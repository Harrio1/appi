import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { Provider } from 'react-redux';
import store from './store';
import App from './App';
import * as serviceWorker from './serviceWorker';
import ErrorBoundary from './components/ErrorBoundary';
// Импортируем отладочный модуль для проверки соединения с API
import './utils/networkDebug';

ReactDOM.render(
    <Provider store={store}>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </Provider>, 
  document.getElementById('root'));

// Временно отключаем Service Worker, чтобы исправить проблемы с кешированием
// Включите его позже, когда приложение будет стабильно работать
serviceWorker.unregister();
