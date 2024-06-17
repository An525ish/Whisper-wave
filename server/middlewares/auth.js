import jwt from 'jsonwebtoken';
import { errorHandler } from '../utils/errorHandler.js';

export const auth = async (req, res, next) => {
  const { accessToken } = req.cookies;

  if (!accessToken)
    return next(errorHandler(400, 'Please SignIn to access the resource'));

  try {
    const cookieData = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

    req.userId = cookieData.id;

    next();
  } catch (error) {
    next(error);
  }
};
