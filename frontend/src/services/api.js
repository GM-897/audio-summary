import axios from 'axios';
import { getAccess, getTokens, setTokens, logout } from './auth';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://127.0.0.1:8002/api/v1/',
});

// Attach access token to requests
api.interceptors.request.use((config) => {
    const token = getAccess();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) prom.reject(error);
        else prom.resolve(token);
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = 'Bearer ' + token;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            isRefreshing = true;
            const tokens = getTokens();
            if (!tokens?.refresh) {
                logout();
                return Promise.reject(error);
            }

            try {
                const res = await axios.post(api.defaults.baseURL + 'api/token/refresh/', {
                    refresh: tokens.refresh,
                });
                setTokens(res.data);
                processQueue(null, res.data.access);
                originalRequest.headers.Authorization = 'Bearer ' + res.data.access;
                return api(originalRequest);
            } catch (err) {
                processQueue(err, null);
                logout();
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

export default api;