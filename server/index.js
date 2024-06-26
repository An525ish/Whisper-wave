import { config as configDotenv } from 'dotenv';
import express from 'express';
import DbConnect from './utils/db-connect.js';
import { authRouter } from './routes/auth.js';
import { globalErrorHandler } from './middlewares/globalErrorHandler.js';
import cookieParser from 'cookie-parser';
import { userRouter } from './routes/user.js';
import { chatRouter } from './routes/chat.js';
import { messageRouter } from './routes/message.js';
import { friendRequestRouter } from './routes/request.js';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { NEW_MESSAGE, NEW_MESSAGE_ALERT } from './constants/socket-events.js';
import { v4 as uuid } from 'uuid';
import { getSockets } from './utils/services.js';
import { Message } from './models/message.js';
import { corsOption } from './constants/constant.js';
import cors from 'cors';
import { v2 as cloudinary } from 'cloudinary';
import { socketAuth } from './middlewares/auth.js';

// Load environment variables
configDotenv({ path: '.env' });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: corsOption });

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors(corsOption));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/chat', chatRouter);
app.use('/api/message', messageRouter);
app.use('/api/friend-request', friendRequestRouter);

// Global Error Handler
app.use(globalErrorHandler);

const userSocketIds = new Map();

io.use((socket, next) => {
  cookieParser()(
    socket.request,
    socket.request.res || {},
    async (err) => await socketAuth(err, socket, next)
  );
});

// Socket.IO
io.on('connection', (socket) => {
  const user = socket.user;
  userSocketIds.set(user._id.toString(), socket.id);
  console.log(`User connected: ${socket.id}`);
  console.log(userSocketIds);

  socket.on(NEW_MESSAGE, async ({ message, members, chatId }) => {
    console.log(message, members, chatId);
    const realTimeMsg = {
      content: message,
      _id: uuid(),
      sender: {
        _id: user._id,
        name: user.name,
        avatar: user.avatar.url,
      },
      chat: chatId,
      createdAt: new Date().toISOString(),
    };

    const msgForDb = {
      content: message,
      chat: chatId,
      sender: user._id,
    };

    const memberSocket = getSockets(userSocketIds, members);
    console.log(memberSocket);
    io.to(memberSocket).emit(NEW_MESSAGE, {
      chatId,
      message: realTimeMsg,
    });

    io.to(memberSocket).emit(NEW_MESSAGE_ALERT, { chatId });

    try {
      await Message.create(msgForDb);
    } catch (error) {
      console.log(error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected`);
  });
});

// Start the server
(async () => {
  try {
    await DbConnect();
    server.listen(PORT, () => {
      console.log(
        `Server is running on port: ${PORT} in ${process.env.NODE_ENV} mode`
      );
    });
  } catch (error) {
    console.error('Failed to start the server:', error.message);
    process.exit(1); // Exit the process with a failure code
  }
})();
