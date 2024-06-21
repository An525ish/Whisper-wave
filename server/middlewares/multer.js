import multer from 'multer';

const multerUpload = multer({
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
});

export const avatarUpload = multerUpload.single('avatar');

export const attachmentsUpload = multerUpload.array('files');
