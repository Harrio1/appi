import React from 'react';
import ReactDOM from 'react-dom/client';
import './css/index.css';
// Импортируем стили Leaflet
import 'leaflet/dist/leaflet.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
// Импортируем сервис для отслеживания состояния сети
import ApiService from './utils/apiService';

// Добавляем предотвращение двойного тапа для мобильных устройств
document.addEventListener('touchstart', function(event) {
  if (event.touches.length > 1) {
    event.preventDefault();
  }
}, { passive: false });

// Предотвращаем масштабирование щипком
document.addEventListener('gesturestart', function(event) {
  event.preventDefault();
});

// Регистрируем сервис-воркер
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('ServiceWorker успешно зарегистрирован:', registration.scope);
      
      // Настраиваем слушатели состояния сети
      ApiService.setupNetworkListeners();
    } catch (error) {
      console.error('Ошибка при регистрации ServiceWorker:', error);
    }
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(); 