import { HOST } from './hostConfig';

export const API_URL = process.env.REACT_APP_API_URL || `http://${HOST}:8000/api`; 
