// Автоматически созданный файл конфигурации API
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.1.103:8000';
const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT || '10000', 10);

const api = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

export default api;
