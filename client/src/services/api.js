import axios from 'axios';
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});
export const errorMessage = (error) =>
  error.response?.data?.message || 'Unable to reach the library. Please try again.';
