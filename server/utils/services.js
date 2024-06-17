import jwt from 'jsonwebtoken';

export const generateToken = (id) => {
  const accessToken = jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '1h',
  });
  return accessToken;
};
