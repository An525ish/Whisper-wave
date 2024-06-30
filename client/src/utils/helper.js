import toast from 'react-hot-toast';

export const getFirstName = (fullName) => {
  if (!fullName) return '';

  const prefixes = [
    'Mr',
    'Mr.',
    'Mrs',
    'Mrs.',
    'Miss',
    'Ms',
    'Ms.',
    'Dr',
    'Dr.',
    'Prof',
    'Prof.',
  ];
  const nameParts = fullName.split(' ');

  if (nameParts.length > 1 && prefixes.includes(nameParts[0])) {
    return `${nameParts[0]} ${nameParts[1]}`;
  }

  return nameParts[0];
};

export const validateFiles = (
  files,
  individualLimit = 0,
  cumulativeLimit = 0
) => {
  const fileType = files[0].type.split('/')[0];

  if (files.length > 5) {
    toast.error(`You can only upload up to 5 ${fileType}`);
    return false;
  }

  let totalSize = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    totalSize += file.size;

    if (individualLimit > 0 && file.size > individualLimit) {
      toast.error(
        `${fileType} size cannot exceed ${individualLimit / 1024 / 1024} MB`
      );
      return false;
    }
  }

  if (cumulativeLimit > 0 && totalSize > cumulativeLimit) {
    toast.error(
      `${fileType} file size cannot exceed ${cumulativeLimit / 1024 / 1024} MB`
    );
    return false;
  }

  return true;
};

export const localStorageHandler = ({ key, value, get }) => {
  if (get) {
    return localStorage.getItem(key)
      ? JSON.parse(localStorage.getItem(key))
      : null;
  } else {
    return localStorage.setItem(key, JSON.stringify(value));
  }
};
