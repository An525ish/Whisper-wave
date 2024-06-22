import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_BASE_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const sendRequest = async (method, endpoint, data = {}, headers = {}) => {
  try {
    const response = await api.request({
      method,
      url: endpoint,
      data,
      headers: {
        ...headers,
      },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Error Response:', error.response.data);
      throw new Error(error.response.data.message || 'An error occurred');
    } else if (error.request) {
      console.error('Error Request:', error.request);
      throw new Error('No response received from the server');
    } else {
      console.error('Error:', error.message);
      throw new Error(error.message);
    }
  }
};

// Specific methods for convenience
export const getRequest = async (endpoint, params = {}, headers = {}) => {
  return sendRequest('get', endpoint, params, headers);
};

export const postRequest = async (endpoint, data, headers = {}) => {
  return sendRequest('post', endpoint, data, headers);
};

export const putRequest = async (endpoint, data, headers = {}) => {
  return sendRequest('put', endpoint, data, headers);
};
