import { Chat } from '../models/chat.js';
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
        name: groupChat ? name : otherMember.name,
        avatar: groupChat
          ? members.slice(0, 3).map(({ avatar }) => avatar.url)
          : [otherMember.avatar.url],
        members: members
          .filter((member) => member._id.toString() !== userId.toString())
          .map((member) => member._id),
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
    console.log(userId, chat.creator.toString());
    if (userId !== chat.creator.toString())
      return next(
        errorHandler(
          401,
          'Only group creator is authorised to perform this action'
        )
      );

    await Chat.findByIdAndDelete(chatId);

    res.status(200).json({
      success: true,
      message: `${chat.name} deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};
