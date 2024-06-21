import { configDotenv } from 'dotenv';
import express from 'express';
import DbConnect from './utils/db-connect.js';
import { authRouter } from './routes/auth.js';
import { globalErrorHandler } from './middlewares/globalErrorHandler.js';
import cookieParser from 'cookie-parser';
import { userRouter } from './routes/user.js';
import { chatRouter } from './routes/chat.js';
import { messageRouter } from './routes/message.js';
import { friendRequestRouter } from './routes/request.js';

const app = express();

configDotenv({ path: '.env' });

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/chat', chatRouter);
app.use('/api/message', messageRouter);
app.use('/api/friend-request', friendRequestRouter);

app.use(globalErrorHandler);

(async () => {
  try {
    await DbConnect();
    app.listen(PORT, () => {
      console.log(`server is running on port : ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start the server:', error.message);
    process.exit(1); // Exit the process with a failure code
  }
})();
