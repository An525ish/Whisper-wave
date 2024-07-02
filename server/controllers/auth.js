import { compare, hash } from 'bcrypt';
import { User } from '../models/user.js';
import { errorHandler } from '../utils/errorHandler.js';
import { generateToken, uploadToCloudinary } from '../utils/services.js';
import { cookieOption } from '../constants/constant.js';

export const signUp = async (req, res, next) => {
  const { name, username, password, bio } = req.body;
  const avatarFile = req.file;

  if (!name || !username || !password)
    return next(errorHandler(400, 'All inputs are required'));

  if (!avatarFile) return next(errorHandler(400, 'Please upload an avatar'));

  try {
    const userExist = await User.findOne({ username });
    // console.log(userExist._id);
    if (userExist) next(errorHandler(409, 'User already exist'));

    const hashedPassword = await hash(password, 10);

    const uploadedAvatar = await uploadToCloudinary([avatarFile]);

    if (!uploadedAvatar || !uploadedAvatar.length === 0)
      return next(errorHandler(400, 'Failed to upload avatar'));

    const avatar = {
      publicId: uploadedAvatar[0].publicId,
      url: uploadedAvatar[0].url,
    };

    const user = await User.create({
      name,
      username,
      password: hashedPassword,
      avatar,
      bio,
    });

    if (user) {
      const token = generateToken(user._id);
      res.status(200).cookie('accessToken', token, cookieOption);
    }

    res.status(201).json({
      success: true,
      message: 'Registered Successfullly',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const signIn = async (req, res, next) => {
  const { username, password } = req.body;
  if (!username || !password)
    return next(errorHandler(400, 'All credentials are required'));

  try {
    const user = await User.findOne({ username }).select('+password');
    if (!user) return next(errorHandler(401, 'Invalid Credentials'));

    const isMatch = await compare(password, user.password);

    if (!isMatch) return next(errorHandler(401, 'Invalid Credentials'));

    const token = generateToken(user._id);

    res.status(200).cookie('accessToken', token, cookieOption);

    const { password: userPassword, ...userWithoutPassword } = user.toObject();

    const modifiedUser = {
      ...userWithoutPassword,
      avatar: user.avatar.url,
    };

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}`,
      data: modifiedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const signOut = async (req, res, next) => {
  res.status(200).clearCookie('accessToken');
  res.json({
    success: true,
    message: 'User Logged out successfully',
  });
};
