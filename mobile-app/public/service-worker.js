// Имя кэша для нашего приложения
const CACHE_NAME = 'agro-mob-v2';
const API_CACHE_NAME = 'agro-mob-api-v1';

// Файлы, которые будем кэшировать при установке
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/manifest.json',
  '/static/js/main.js',
  '/static/css/main.css',
];

// Установка сервис-воркера и кэширование статических ресурсов
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Кэш открыт');
        return cache.addAll(urlsToCache);
      })
  );
  
  // Активируем новый сервис-воркер сразу (не ждем закрытия всех вкладок)
  self.skipWaiting();
});

// Активация нового сервис-воркера и удаление старых кэшей
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME, API_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Удаление устаревшего кэша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Позволяет сервис-воркеру взять под контроль все клиенты сразу
      return self.clients.claim();
    })
  );
});

// Обработка запросов и возврат данных из кэша (или сети, если в кэше нет)
self.addEventListener('fetch', (event) => {
  // Проверяем, является ли запрос API запросом
  const isApiRequest = event.request.url.includes('/api/');
  
  if (isApiRequest) {
    // Для API запросов используем стратегию "сеть с fallback на кэш"
    event.respondWith(
      fetch(event.request.clone())
        .then((response) => {
          // Проверяем валидность ответа
          if (!response || response.status !== 200) {
            return response;
          }

          // Клонируем ответ для кэширования
          const responseToCache = response.clone();
          
          // Кэшируем ответ API в отдельный кэш для API
          caches.open(API_CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
              console.log('API ответ закэширован:', event.request.url);
            });

          return response;
        })
        .catch(() => {
          console.log('Не удалось загрузить API из сети, пробуем кэш:', event.request.url);
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                console.log('Найден в кэше:', event.request.url);
                return cachedResponse;
              }
              
              // Если в кэше ничего нет, возвращаем ошибку
              console.log('Не найдено в кэше:', event.request.url);
              return new Response(JSON.stringify({ 
                error: 'Данные недоступны в оффлайн режиме' 
              }), {
                headers: { 'Content-Type': 'application/json' },
                status: 503,
                statusText: 'Service Unavailable'
              });
            });
        })
    );
  } else {
    // Для статических ресурсов используем стратегию "кэш с fallback на сеть"
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            // Возвращаем из кэша, если есть
            return cachedResponse;
          }
          
          // Иначе делаем запрос к сети
          return fetch(event.request)
            .then((response) => {
              // Если ресурс не найден или не валидный, просто возвращаем
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Клонируем ответ для кэширования
              const responseToCache = response.clone();
              
              // Сохраняем в кэш
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
                
              return response;
            });
        })
    );
  }
});

// Обработка сообщений от клиента
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Обработка запроса на очистку кэша API
  if (event.data && event.data.type === 'CLEAR_API_CACHE') {
    event.waitUntil(
      caches.open(API_CACHE_NAME).then((cache) => {
        cache.keys().then((keys) => {
          keys.forEach((request) => {
            cache.delete(request);
          });
        });
        
        // Отправляем сообщение клиенту, что кэш очищен
        event.ports[0].postMessage({
          type: 'API_CACHE_CLEARED',
          timestamp: Date.now()
        });
      })
    );
  }
});

// Обработка синхронизации для фоновых задач
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    console.log('Пытаемся выполнить синхронизацию данных');
    // Здесь мог бы быть код для фоновой синхронизации
  }
});

// Обработка пуш-уведомлений
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const title = data.title || 'АгроМоб';
    const options = {
      body: data.message || 'Новое обновление доступно',
      icon: '/logo192.png',
      badge: '/favicon.ico'
    };
    
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

// Обработка нажатия на уведомление
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
}); 