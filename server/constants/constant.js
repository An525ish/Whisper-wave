export const cookieOption = {
  maxAge: 1000 * 60 * 60 * 24 * 15,
  sameSite: 'none',
  httpOnly: true,
  secure: true,
};

export const corsOption = {
  origin: [
    'http://localhost:5173',
    'http://localhost:4173',
    process.env.CLIENT_URL,
  ],
  credentials: true,
};
