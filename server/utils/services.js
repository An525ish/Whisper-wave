import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import { getBase64 } from './helper.js';
import { v4 as uuid } from 'uuid';
import { userSocketIds } from '../index.js';

export const generateToken = (id) => {
  const accessToken = jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '15d',
  });
  return accessToken;
};

export const getSockets = (members) => {
  const memberSocketIds = [];

  members.forEach((memberId) => {
    const socketId = userSocketIds.get(memberId.toString());
    if (socketId) {
      memberSocketIds.push(socketId);
    }
  });

  return memberSocketIds;
};

export const emitEvent = (req, event, members, data) => {
  const io = req.app.get('io');
  const memberSocketIds = getSockets(members);
  io.to(memberSocketIds).emit(event, data);
};

export const uploadToCloudinary = async (files = []) => {
  try {
    const uploadPromises = files.map((file) => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          getBase64(file),
          {
            resource_type: 'auto',
            public_id: uuid(),
            filename: file.originalname,
          },
          (error, result) => {
            if (error) return reject(error);
            resolve({
              ...result,
              type: file.fileType,
              originalname: file.originalname,
            });
          }
        );
      });
    });

    const results = await Promise.all(uploadPromises);

    const formattedResults = results.map((result) => ({
      publicId: result.public_id,
      url: result.secure_url,
      name: result.originalname,
      fileType: result.type,
    }));

    return formattedResults;
  } catch (error) {
    console.log(error);
    throw new Error('Failed to upload files to Cloudinary');
  }
};
