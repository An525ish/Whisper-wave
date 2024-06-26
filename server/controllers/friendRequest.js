import { Request } from '../models/request.js';
import { Chat } from '../models/chat.js';
import { errorHandler } from '../utils/errorHandler.js';
import { NEW_REQUEST } from '../constants/socket-events.js';
import { emitEvent } from '../utils/services.js';

export const sendRequest = async (req, res, next) => {
  const { receiverId } = req.body;
  if (!receiverId) return next(errorHandler(400, 'No receiver Id found'));

  try {
    const requestExist = await Request.findOne({
      $or: [
        { sender: req.userId, receiver: receiverId },
        { sender: receiverId, receiver: req.userId },
      ],
    });

    if (requestExist) return next(errorHandler(400, 'Request already sent'));

    if (receiverId === req.userId)
      return next(errorHandler(400, 'Request can not be send to own self'));

    const request = await Request.create({
      sender: req.userId,
      receiver: receiverId,
    });

    emitEvent(req, NEW_REQUEST, [receiverId]);

    res.status(200).json({
      success: true,
      message: 'Request sent successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const handleRequest = async (req, res, next) => {
  const { requestId, accept } = req.body;
  if (!requestId) return next(errorHandler(400, 'No RequestId found'));

  if (typeof accept !== 'boolean')
    return next(
      errorHandler(400, 'Accept or Reject in order to process the request')
    );

  try {
    const request = await Request.findById(requestId)
      .populate('sender', 'name')
      .populate('receiver', 'name');

    if (!request) return next(errorHandler(404, 'No request found'));

    if (request.receiver._id.toString() !== req.userId)
      return next(
        errorHandler(401, 'You are not authorise to handle this request')
      );

    if (!accept) {
      await request.deleteOne();
      return res.status(200).json({
        success: true,
        message: 'Request rejected successfullly',
      });
    }

    const members = [request.sender._id, req.userId];

    await Promise.all([
      Chat.create({
        name: `${request.sender.name}-${request.receiver.name}`,
        creator: request.receiver._id,
        members,
      }),
      request.deleteOne(),
    ]);

    res.status(200).json({
      success: true,
      message: 'Request accepted',
      data: {
        senderId: request.sender._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getNotifications = async (req, res, next) => {
  const { userId } = req;

  try {
    const requests = await Request.find({ receiver: userId }).populate(
      'sender',
      'name avatar'
    );

    const modifiedRequest = requests.map(({ _id, sender }) => ({
      _id,
      sender: {
        _id: sender._id,
        name: sender.name,
        avatar: sender.avatar.url,
      },
    }));

    res.status(200).json({
      success: true,
      message: 'Request sent successfully',
      data: modifiedRequest,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyfriends = async (req, res, next) => {
  const { userId } = req;
  const { chatId } = req.query;

  try {
    const chats = await Chat.find({
      groupChat: false,
      members: userId,
    }).populate('members', 'name avatar');

    const friends = chats.flatMap(({ members }) => {
      const otherMembers = members.filter(
        (member) => member._id.toString() !== userId.toString()
      );

      return otherMembers.map((member) => ({
        _id: member._id,
        name: member.name,
        avatar: member.avatar?.url,
      }));
    });

    if (chatId) {
      const chat = await Chat.findById(chatId);

      if (!chat) {
        return res.status(404).json({
          success: false,
          message: 'Chat not found',
        });
      }

      const availableFriends = friends.filter(
        (friend) => !chat.members.includes(friend._id)
      );

      return res.status(200).json({
        success: true,
        data: availableFriends,
      });
    }

    res.status(200).json({
      success: true,
      data: friends,
    });
  } catch (error) {
    next(error);
  }
};
