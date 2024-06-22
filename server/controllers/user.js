import { compare, hash } from 'bcrypt';
import { User } from '../models/user.js';
import { errorHandler } from '../utils/errorHandler.js';
import { Chat } from '../models/chat.js';

export const getProfile = async (req, res, next) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) return next(errorHandler(404, 'No user found in the database'));

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  const userId = req.userId;
  const { name, username, email, oldPassword, newPassword, avatar } = req.body;

  try {
    const user = await User.findById(userId).select('+password');
    if (!user) return next(errorHandler(404, 'User not found in the database'));

    if (oldPassword && newPassword) {
      const isMatch = await compare(oldPassword, user.password);
      if (!isMatch) return next(errorHandler(400, 'Old password is incorrect'));
      user.password = await hash(newPassword, 10);
    }

    const updatedFields = { name, username, email, avatar };
    for (let key in updatedFields) {
      if (updatedFields[key]) user[key] = updatedFields[key];
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProfile = async (req, res, next) => {
  const { userId } = req;

  try {
    await User.findByIdAndDelete(userId);
    res.json({
      success: true,
      message: 'User Deleted Successfully',
    });
  } catch (error) {}
};

export const searchUser = async (req, res, next) => {
  const { name = '' } = req.query;

  const myChats = await Chat.find({ groupChat: false, members: req.userId });

  const myChatsMembers = myChats.flatMap(({ members }) => members);

  const allOtherMembers = await User.find({
    _id: { $nin: myChatsMembers },
    name: { $regex: name, $options: 'i' }, // anish - can be searched by sh and i is case insensitive
  });

  const users = allOtherMembers.map(({ _id, name, avatar }) => ({
    _id,
    name,
    avatar: avatar.url,
  }));

  res.status(200).json({
    success: true,
    data: users,
  });
};
