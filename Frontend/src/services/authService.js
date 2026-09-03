import api from './api';

export const authService = {
  login: async (email, password, captchaId, captchaAnswer) => {
    const payload = { email, password };
    if (captchaId) {
      payload.captchaId = captchaId;
      payload.captchaAnswer = captchaAnswer;
    }
    const response = await api.post('/auth/login', payload);
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getCaptcha: async () => {
    const response = await api.get('/auth/captcha');
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};
