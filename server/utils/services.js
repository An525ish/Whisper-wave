import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import { getBase64 } from './helper.js';
import { v4 as uuid } from 'uuid';

export const generateToken = (id) => {
  const accessToken = jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '15d',
  });
  return accessToken;
};

export const getSockets = (userSocketIds, users) =>
  users.map((user) => userSocketIds.get(user._id.toString()));

export const uploadToCloudinary = async (files = []) => {
  try {
    const uploadPromises = files.map((file) => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          getBase64(file),
          {
            resource_type: 'auto',
            public_id: uuid(),
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
      });
    });

    const results = await Promise.all(uploadPromises);

    const formattedResults = results.map((result) => ({
      public_id: result.public_id,
      url: result.secure_url,
    }));

    return formattedResults;
  } catch (error) {
    throw new Error('Failed to upload files to Cloudinary');
  }
};
