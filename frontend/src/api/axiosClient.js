import axios from 'axios';

const axiosClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('peoplepay_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unpacking envelope, token expiry, and error handling
axiosClient.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && response.data.success === true && 'data' in response.data) {
      return {
        ...response,
        data: response.data.data,
        meta: response.data.meta,
      };
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('peoplepay_token');
      localStorage.removeItem('peoplepay_user');
      // Redirect to login if unauthenticated
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
