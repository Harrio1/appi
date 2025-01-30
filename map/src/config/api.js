<<<<<<< HEAD
export const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.1.116:8000/api'; 
=======
import { HOST } from './hostConfig';

export const API_URL = process.env.REACT_APP_API_URL || `http://${HOST}:8000/api`; 
>>>>>>> 444b88f3b17e9a6d10b3652e6281b13a0d2e4ab8
