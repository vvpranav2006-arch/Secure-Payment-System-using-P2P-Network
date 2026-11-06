import axiosClient from './axiosClient';

export const authApi = {
  login: (identifier, password) => {
    return axiosClient.post('/auth/login', { identifier, password });
  },

  register: (userData) => {
    return axiosClient.post('/auth/register', userData);
  },

  getMe: () => {
    return axiosClient.get('/auth/me');
  },

  setPin: (pin, confirmPin, password) => {
    return axiosClient.post('/auth/pin', { pin, confirmPin, password });
  },
};

