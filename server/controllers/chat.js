import { Chat } from '../models/chat.js';
import { Message } from '../models/message.js';
import { errorHandler } from '../utils/errorHandler.js';

export const createGroupChat = async (req, res, next) => {
  const { name, members } = req.body;
  const { userId } = req;

  if (!name) return next(errorHandler(400, 'Group name is required'));

  if (!members || members.length < 3)
    return next(errorHandler(400, 'At least 3 member are required'));

  try {
    const chat = await Chat.create({
      name,
      groupChat: true,
      creator: userId,
      members: [...members, userId],
    });

    res.status(201).json({
      success: true,
      message: 'Group chat created successfully',
      data: { chat },
    });
  } catch (error) {
    next(error);
  }
};

export const updateGroupDetails = async (req, res, next) => {
  const { name } = req.body;
  const { chatId } = req.params;
  const { userId } = req;
  // const avatar = req.avatar;

  if (!name) return next(errorHandler(400, 'Group name is required'));
  // if (avatar.length === 0) return next(errorHandler(400, 'No avatar selected'));

  try {
    const chat = await Chat.findByIdAndUpdate(chatId, { name });

    if (userId !== chat.creator.toString())
      return next(
        errorHandler(
          401,
          'Only group creator is authorised to perform this action'
        )
      );

    res.status(201).json({
      success: true,
      message: 'Group name updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getMyChats = async (req, res, next) => {
  const userId = req.userId;

  const page = parseInt(req.query.page) || 1;
  const resultPerPage = 20;

  try {
    const [chats, totalChats] = await Promise.all([
      Chat.find({ members: userId })
        .populate('members', 'name username email avatar')
        .sort({ updatedAt: -1 })
        .skip((page - 1) * resultPerPage)
        .limit(resultPerPage)
        .lean(), // Use lean() for better performance
      Chat.countDocuments({ members: userId }),
    ]);

    const customizedChats = chats.map(({ _id, name, members, groupChat }) => {
      const otherMembers = members.filter(
        (member) => member._id.toString() !== userId.toString()
      );

      return {
        _id,
        groupChat,
        name: groupChat ? name : otherMembers[0]?.name || 'Unknown',
        avatar: groupChat
          ? members
              .slice(0, 3)
              .map((member) => member.avatar?.url)
              .filter(Boolean)
          : [otherMembers[0]?.avatar?.url].filter(Boolean),
        members: otherMembers.map((member) => member._id),
      };
    });

    res.status(200).json({
      success: true,
      chats: customizedChats,
      totalPages: Math.ceil(totalChats / resultPerPage) || 0,
    });
  } catch (error) {
    console.error('Error in getMyChats:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching chats',
    });
  }
};

export const getChatDetails = async (req, res, next) => {
  const userId = req.userId;

  try {
    if (req.query.populate === 'true') {
      const chat = await Chat.findById(req.query.id)
        .populate('members', 'name avatar')
        .populate('creator', 'name avatar')
        .lean();

      if (!chat) return next(errorHandler(400, 'No chat found'));

      const otherMembers = chat.members.filter(
        (member) => member._id.toString() !== userId.toString()
      );

      chat.creator.avatar = chat.creator.avatar.url;

      chat.avatar = chat.groupChat ? null : [otherMembers[0]?.avatar?.url];

      chat.members = chat.members.map((member) => ({
        _id: member._id,
        name: member.name,
        avatar: member.avatar.url,
      }));

      res.status(200).json({
        success: true,
        data: chat,
      });
    } else {
      const chat = await Chat.findById(req.query.id);

      if (!chat) return next(errorHandler(400, 'No chat found'));

      res.status(200).json({
        success: true,
        data: chat,
      });
    }
  } catch (error) {
    next(error);
  }
};

export const addMembers = async (req, res, next) => {
  const { chatId } = req.params;
  const { members } = req.body;
  const { userId } = req;

  if (!members || members.length === 0)
    return next(errorHandler(400, 'Select at least one member to proceed'));

  try {
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return next(errorHandler(404, 'Chat not found'));
    }

    if (userId !== chat.creator.toString())
      return next(
        errorHandler(
          401,
          'Only group creator is authorised to perform this action'
        )
      );

    // Use a Set to avoid duplicate members
    const existingMembers = new Set(
      chat.members.map((member) => member.toString())
    );

    members.forEach((member) => existingMembers.add(member.toString()));

    chat.members = Array.from(existingMembers);
    await chat.save();

    res.status(200).json({
      success: true,
      message: 'Members added successfully',
      data: chat,
    });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  const { chatId } = req.params;
  const { memberToBeRemoved } = req.body;
  const { userId } = req;

  if (!memberToBeRemoved) return next(errorHandler(400, 'No member found'));

  try {
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return next(errorHandler(404, 'Chat not found'));
    }

    if (userId !== chat.creator.toString())
      return next(
        errorHandler(
          401,
          'Only group creator is authorised to perform this action'
        )
      );

    const updatedMembers = chat.members.filter(
      (member) => member.toString() !== memberToBeRemoved.toString()
    );

    chat.members = updatedMembers;

    await chat.save();

    res
      .status(200)
      .json({ success: true, message: 'Members removed successfully' });
  } catch (error) {
    next(error);
  }
};

export const leaveGroup = async (req, res, next) => {
  const { chatId } = req.params;
  const { userId } = req;

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) return next(errorHandler(400, 'No chat found'));

    const remainingMembers = chat.members.filter(
      (member) => member.toString() !== userId.toString()
    );

    chat.members = remainingMembers;

    if (userId === chat.creator.toString()) {
      const randomCreator = Math.floor(Math.random() * chat.members.length);
      chat.creator = chat.members[randomCreator];
    }

    await chat.save();

    res.status(200).json({
      success: true,
      message: `You left ${chat.name}`,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteGroup = async (req, res, next) => {
  const { chatId } = req.params;
  const { userId } = req;

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) return next(errorHandler(404, 'Chat not found'));

    if (userId !== chat.creator.toString())
      return next(
        errorHandler(
          401,
          'Only group creator is authorised to perform this action'
        )
      );

    const msgsWithAttachments = await Message.find({
      chat: chatId,
      attachments: { $exists: true, $not: { $size: 0 } },
    });

    const publicIds = msgsWithAttachments.flatMap(({ attachments }) =>
      attachments.map((attachment) => attachment.publicId)
    );

    await Promise.all([
      chat.deleteOne(),
      Message.deleteMany({ chat: chatId }),
      //  deleteFromCloudinary(publicIds)
    ]);

    res.status(200).json({
      success: true,
      message: `${chat.name} deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};
