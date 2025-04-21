// Определяем имя кеша
const CACHE_NAME = 'agro-map-cache-v1';

// Файлы для кеширования при установке
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/static/js/main.chunk.js',
  '/static/js/vendors~main.chunk.js',
  '/static/js/bundle.js',
  '/static/css/main.chunk.css'
];

// Устанавливаем сервис-воркер и кешируем файлы
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Кеш открыт');
        return cache.addAll(urlsToCache);
      })
  );
});

// Активация сервис-воркера и очистка старого кеша
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Стратегия кеширования: сначала сеть, потом кеш
self.addEventListener('fetch', event => {
  // Игнорируем запросы к chrome-extension и WebSocket (ws://)
  if (event.request.url.startsWith('chrome-extension:') || 
      event.request.url.indexOf('/ws') !== -1 ||
      event.request.url.startsWith('ws:')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Проверяем, что ответ валидный
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Клонируем ответ, так как он может быть использован только один раз
        const responseToCache = response.clone();

        // Кешируем только http/https запросы
        if (event.request.url.startsWith('http')) {
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            })
            .catch(err => console.log('Ошибка кеширования:', err));
        }

        return response;
      })
      .catch(() => {
        // Если сеть недоступна, пытаемся получить ответ из кеша
        return caches.match(event.request);
      })
  );
});

// Обработка сообщений от клиента
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 