// src/validations/customValidation.js
export const validateUsername = (value) => {
  if (!value) {
    return 'Username is required';
  } else if (value.length < 3) {
    return 'Username must be at least 3 characters';
  } else if (!/^[a-zA-Z0-9]+$/.test(value)) {
    return 'Invalid Username';
  }
  return true;
};

export const validateFullname = (value) => {
  if (!value) {
    return 'Username is required';
  } else if (value.length < 3) {
    return 'Fullname must be at least 3 characters';
  } else if (!/^[a-zA-Z]+( [a-zA-Z]+)*$/.test(value)) {
    return 'Invalid Fullname';
  }
  return true;
};

export const validateEmail = (value) => {
  if (!value) {
    return 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(value)) {
    return 'Invalid email address';
  }
  return true;
};

export const validatePassword = (value) => {
  if (!value) {
    return 'Password is required';
  } else if (value.length < 8) {
    return 'Password must be at least 8 characters';
  } else if (!/[a-z]/.test(value)) {
    return 'Password must contain at least one lowercase letter';
  } else if (!/[A-Z]/.test(value)) {
    return 'Password must contain at least one uppercase letter';
  } else if (!/[0-9]/.test(value)) {
    return 'Password must contain at least one number';
  } else if (!/[^a-zA-Z0-9]/.test(value)) {
    return 'Password must contain at least one special character';
  }
  return true;
};
