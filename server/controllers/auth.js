import { compare, hash } from 'bcrypt';
import { User } from '../models/user.js';
import { errorHandler } from '../utils/errorHandler.js';
import { generateToken } from '../utils/services.js';
import { cookieOption } from '../constants/constant.js';

export const signUp = async (req, res, next) => {
  const { name, username, password, bio } = req.body;

  if (!name || !username || !password)
    return next(errorHandler(404, 'All inputs are required'));

  const avatar = {
    publicId: 'fsfsd',
    url: 'sfsdf',
  };

  try {
    const userExist = await User.findOne({ username });
    // console.log(userExist._id);
    if (userExist) next(errorHandler(409, 'User already exist'));

    const hashedPassword = await hash(password, 10);

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
      message: 'User created Successfullly',
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

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}`,
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
