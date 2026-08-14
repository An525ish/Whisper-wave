import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { Jimp, JimpMime } from 'jimp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import os from 'os';
import path from 'path';
import type { UploadableFile } from '../types/message.js';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const MAX_FILES_PER_REQUEST = 5;

const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 50,
    // Cap file count to match the client MAX_FILES constant and prevent memory DoS.
    files: MAX_FILES_PER_REQUEST,
  },
});

const scaleToFit = (
  image: { width: number; height: number; resize: (opts: { w: number; h: number }) => unknown },
  maxWidth: number,
  maxHeight: number
): void => {
  const ratio = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
  if (ratio >= 1) return;

  image.resize({
    w: Math.max(1, Math.round(image.width * ratio)),
    h: Math.max(1, Math.round(image.height * ratio)),
  });
};

const compressFile = async (file: Express.Multer.File): Promise<UploadableFile> => {
  const { buffer, mimetype, originalname } = file;

  if (mimetype.startsWith('image/')) {
    const image = await Jimp.fromBuffer(buffer);
    scaleToFit(image, 1280, 720);
    const compressedImageBuffer = Buffer.from(
      await image.getBuffer(JimpMime.jpeg, { quality: 80 })
    );

    return {
      buffer: Buffer.from(compressedImageBuffer),
      mimetype: 'image/jpeg',
      originalname,
      fileType: 'media',
    };
  }

  if (mimetype.startsWith('video/')) {
    const tempInputPath = path.join(os.tmpdir(), `ww_in_${Date.now()}.mp4`);
    const tempOutputPath = path.join(os.tmpdir(), `ww_out_${Date.now()}.mp4`);

    await fs.promises.writeFile(tempInputPath, buffer);

    try {
      const compressedBuffer = await new Promise<Buffer>((resolve, reject) => {
        ffmpeg(tempInputPath)
          .outputOptions('-crf 23')
          .output(tempOutputPath)
          .on('end', async () => {
            try {
              resolve(await fs.promises.readFile(tempOutputPath));
            } catch (error) {
              reject(error);
            }
          })
          .on('error', reject)
          .run();
      });

      return {
        buffer: compressedBuffer,
        mimetype: 'video/mp4',
        originalname,
        fileType: 'media',
      };
    } finally {
      await Promise.allSettled([
        fs.promises.unlink(tempInputPath),
        fs.promises.unlink(tempOutputPath),
      ]);
    }
  }

  if (mimetype.startsWith('audio/')) {
    const ext = mimetype.split('/')[1] ?? 'tmp';
    const tempInputPath = path.join(os.tmpdir(), `ww_in_${Date.now()}.${ext}`);
    const tempOutputPath = path.join(os.tmpdir(), `ww_out_${Date.now()}.mp3`);

    await fs.promises.writeFile(tempInputPath, buffer);

    try {
      const compressedBuffer = await new Promise<Buffer>((resolve, reject) => {
        ffmpeg(tempInputPath)
          .audioCodec('libmp3lame')
          .audioBitrate('128k')
          .output(tempOutputPath)
          .on('end', async () => {
            try {
              resolve(await fs.promises.readFile(tempOutputPath));
            } catch (error) {
              reject(error);
            }
          })
          .on('error', reject)
          .run();
      });

      return {
        buffer: compressedBuffer,
        mimetype: 'audio/mpeg',
        originalname,
        fileType: 'media',
      };
    } finally {
      await Promise.allSettled([
        fs.promises.unlink(tempInputPath),
        fs.promises.unlink(tempOutputPath),
      ]);
    }
  }

  return {
    buffer,
    mimetype,
    originalname,
    fileType: 'document',
  };
};

export const avatarUpload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  multerUpload.single('avatar')(req, res, async (err) => {
    if (err) {
      next(err);
      return;
    }

    try {
      if (req.file) {
        req.file = (await compressFile(req.file)) as Express.Multer.File;
      }
      next();
    } catch (error) {
      next(error);
    }
  });
};

export const attachmentsUpload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  multerUpload.array('files')(req, res, async (err) => {
    if (err) {
      next(err);
      return;
    }

    try {
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        req.files = (await Promise.all(
          req.files.map((file) => compressFile(file))
        )) as Express.Multer.File[];
      }
      next();
    } catch (error) {
      next(error);
    }
  });
};
