import { Chat } from '../models/chat.js';
import { errorHandler } from '../utils/errorHandler.js';

export const createGroupChat = async (req, res, next) => {
  const { name, members } = req.body;
  const { userId } = req;
  console.log(userId);

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

export const getMyChats = async (req, res, next) => {
  const userId = req.userId;
  const { page = 1, limit = 10 } = req.query;

  try {
    const chats = await Chat.find({ members: userId })
      .populate('members', 'name username email avatar')
      .sort({ updatedAt: -1 }) // latest at first
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalChats = await Chat.countDocuments({ members: userId });

    // Customize the response based on chat type
    const customizedChats = chats.map(({ _id, name, members, groupChat }) => {
      const otherMember = members.find(
        (member) => member._id.toString() !== userId.toString()
      );

      return {
        _id,
        groupChat,
        members,
        name: groupChat ? name : otherMember.name,
        avatar: groupChat
          ? members.slice(0, 3).map(({ avatar }) => avatar.url)
          : [otherMember.avatar.url],
      };
    });

    res.status(200).json({
      success: true,
      message: 'Chats retrieved successfully',
      data: {
        chats: customizedChats,
        totalPages: Math.ceil(totalChats / limit),
        currentPage: page,
      },
    });
  } catch (error) {
    next(errorHandler(500, 'Failed to retrieve chats'));
  }
};
