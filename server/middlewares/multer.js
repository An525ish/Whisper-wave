import multer from 'multer';
import Jimp from 'jimp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import path from 'path';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const storage = multer.memoryStorage();

const multerUpload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 50, // 50MB limit
  },
});

const compressFile = async (file) => {
  const { buffer, mimetype, originalname } = file;

  if (mimetype.startsWith('image/')) {
    const image = await Jimp.read(buffer);
    const compressedImageBuffer = await image
      .scaleToFit(1280, 720)
      .quality(80)
      .getBufferAsync(Jimp.MIME_JPEG);

    return {
      buffer: compressedImageBuffer,
      mimetype: 'image/jpeg',
      originalname: originalname,
      fileType: 'media',
      compressedName: `${path.parse(originalname).name}.jpg`,
    };
  } else if (mimetype.startsWith('video/')) {
    const tempInputPath = `temp_input_${Date.now()}.mp4`;
    const tempOutputPath = `temp_output_${Date.now()}.mp4`;

    await fs.promises.writeFile(tempInputPath, buffer);

    return new Promise((resolve, reject) => {
      ffmpeg(tempInputPath)
        .outputOptions('-crf 23')
        .output(tempOutputPath)
        .on('end', async () => {
          const compressedBuffer = await fs.promises.readFile(tempOutputPath);
          fs.unlink(tempInputPath, () => {});
          fs.unlink(tempOutputPath, () => {});
          resolve({
            buffer: compressedBuffer,
            mimetype: 'video/mp4',
            originalname: originalname,
            fileType: 'media',
            compressedName: `${path.parse(originalname).name}.mp4`,
          });
        })
        .on('error', (err) => {
          fs.unlink(tempInputPath, () => {});
          reject(err);
        })
        .run();
    });
  } else if (mimetype.startsWith('audio/')) {
    const tempInputPath = `temp_input_${Date.now()}.${mimetype.split('/')[1]}`;
    const tempOutputPath = `temp_output_${Date.now()}.mp3`;

    await fs.promises.writeFile(tempInputPath, buffer);

    return new Promise((resolve, reject) => {
      ffmpeg(tempInputPath)
        .audioCodec('libmp3lame')
        .audioBitrate('128k')
        .output(tempOutputPath)
        .on('end', async () => {
          const compressedBuffer = await fs.promises.readFile(tempOutputPath);
          fs.unlink(tempInputPath, () => {});
          fs.unlink(tempOutputPath, () => {});
          resolve({
            buffer: compressedBuffer,
            mimetype: 'audio/mpeg',
            originalname: originalname,
            fileType: 'media',
            compressedName: `${path.parse(originalname).name}.mp3`,
          });
        })
        .on('error', (err) => {
          fs.unlink(tempInputPath, () => {});
          reject(err);
        })
        .run();
    });
  }

  // Return original file for other types
  return {
    ...file,
    originalname: originalname,
    fileType: 'document',
  };
};

export const avatarUpload = async (req, res, next) => {
  multerUpload.single('avatar')(req, res, async (err) => {
    if (err) return next(err);
    if (req.file) {
      req.file = await compressFile(req.file);
    }
    next();
  });
};

export const attachmentsUpload = async (req, res, next) => {
  multerUpload.array('files')(req, res, async (err) => {
    if (err) return next(err);
    if (req.files && req.files.length > 0) {
      req.files = await Promise.all(req.files.map(compressFile));
    }
    next();
  });
};
