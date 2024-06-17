import { configDotenv } from 'dotenv';
import express from 'express';
import DbConnect from './utils/db-connect.js';
import { authRouter } from './routes/auth.js';
import { globalErrorHandler } from './middlewares/globalErrorHandler.js';
import cookieParser from 'cookie-parser';

const app = express();

configDotenv({ path: '.env' });

const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/api/auth', authRouter);

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
