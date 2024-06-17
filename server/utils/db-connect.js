import mongoose from 'mongoose';

const DbConnect = async () => {
  try {
    await mongoose.connect(process.env.DB_URI, { dbName: 'WhisperWave' });
    console.log('Database is connected');
  } catch (error) {
    throw new Error(error);
  }
};

export default DbConnect;
