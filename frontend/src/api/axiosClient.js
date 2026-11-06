import axios from 'axios';

const axiosClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT Token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('paypulse_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global Error Handling
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred';

    // Auto logout on token expiration / unauthorized
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('paypulse_token');
      localStorage.removeItem('paypulse_user');
      window.location.href = '/login?expired=1';
    }

    return Promise.reject({
      status: error.response?.status,
      message,
      details: error.response?.data?.details || null,
      raw: error,
    });
  }
);

export default axiosClient;

