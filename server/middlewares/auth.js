import jwt from 'jsonwebtoken';
import { errorHandler } from '../utils/errorHandler.js';
import { User } from '../models/user.js';

export const auth = async (req, res, next) => {
  const { accessToken } = req.cookies;

  if (!accessToken)
    return next(errorHandler(401, 'Please SignIn to access the resource'));

  try {
    const cookieData = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(cookieData.id);
    if (!user) return next(errorHandler(404, 'User not found'));

    req.userId = cookieData.id;

    next();
  } catch (error) {
    next(error);
  }
};

export const socketAuth = async (err, socket, next) => {
  try {
    if (err) return next(err);

    const { accessToken } = socket.request.cookies;
    if (!accessToken)
      return next(errorHandler(401, 'Please SignIn to access the resource'));

    const { id } = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(id).lean();
    if (!user) return next(errorHandler(400, 'No user found'));

    socket.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
