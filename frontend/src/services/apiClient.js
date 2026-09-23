import axios from 'axios';

// ---------------------------------------------------------------------------
// Axios Instance
// ---------------------------------------------------------------------------
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Request Interceptor — attach Bearer token from localStorage
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Simple GET Cache
// ---------------------------------------------------------------------------
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

apiClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }

    if (config.method === 'get') {
      // Do not use cache for binary downloads
      if (config.responseType !== 'blob' && config.responseType !== 'arraybuffer') {
        const cacheKey = config.url + (config.params ? '?' + new URLSearchParams(config.params).toString() : '');
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          config.adapter = () => Promise.resolve({
            data: cached.data,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            request: {}
          });
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response Interceptor — silent token refresh on 401
// ---------------------------------------------------------------------------
let isRefreshing = false;
let failedQueue = []; // requests waiting for the new token

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    if (response.config.method === 'get') {
      // Do not cache binary downloads (blob, arraybuffer)
      if (response.config.responseType !== 'blob' && response.config.responseType !== 'arraybuffer') {
        const cacheKey = response.config.url + (response.config.params ? '?' + new URLSearchParams(response.config.params).toString() : '');
        cache.set(cacheKey, {
          data: response.data,
          timestamp: Date.now()
        });
      }
    } else if (['post', 'put', 'patch', 'delete'].includes(response.config.method?.toLowerCase())) {
      // Invalidate all cache on mutations for full state consistency
      cache.clear();
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh once per failed request (avoid infinite loops)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request until the in-flight refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        // No refresh token — force logout
        isRefreshing = false;
        processQueue(error, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/auth/token/refresh/`,
          { refresh: refreshToken }
        );

        const newAccessToken = data.access;
        localStorage.setItem('access_token', newAccessToken);

        // Also update the refresh token if the backend rotates it
        if (data.refresh) {
          localStorage.setItem('refresh_token', data.refresh);
        }

        apiClient.defaults.headers['Authorization'] = `Bearer ${newAccessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
