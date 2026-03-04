import api from './api';

const TOKEN_KEY = 'tokens';

export const login = async (username, password) => {
    const res = await api.post('login/', { username, password });
    localStorage.setItem(TOKEN_KEY, JSON.stringify(res.data));
    return res.data;
};

export const getTokens = () => JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null');

export const logout = () => localStorage.removeItem(TOKEN_KEY);

export const getAccess = () => getTokens()?.access;

export const setTokens = (data) => {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(data));
};
