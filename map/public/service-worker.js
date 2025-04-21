// Имя кэша
const CACHE_NAME = 'agro-map-cache-v2';

// Ресурсы для предварительного кэширования
const urlsToCache = [
  '/',
  '/index.html'
  // Остальные ресурсы будем добавлять по мере запроса
];

// Установка Service Worker
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Installing...');
  
  // Предварительное кэширование файлов
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Открыт кэш:', CACHE_NAME);
        // Используем более надежный метод для кэширования каждого ресурса отдельно
        return Promise.all(
          urlsToCache.map(url => {
            return cache.add(url).catch(err => {
              console.error(`[ServiceWorker] Ошибка кэширования ${url}:`, err);
              return Promise.resolve(); // Продолжаем несмотря на ошибку
            });
          })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] Все доступные ресурсы закэшированы');
        // Не используем skipWaiting() чтобы избежать ошибки "Only the active worker can claim clients"
        return Promise.resolve();
      })
      .catch(err => {
        console.error('[ServiceWorker] Критическая ошибка кэширования:', err);
        return Promise.resolve();
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activating...');
  
  // Удаление старых версий кэша
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[ServiceWorker] Удаление старого кэша:', cacheName);
              return caches.delete(cacheName);
            }
            return Promise.resolve();
          })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] Активирован и берет контроль');
        // Не используем clients.claim() чтобы избежать ошибки "Only the active worker can claim clients"
        return Promise.resolve();
      })
  );
});

// Безопасное добавление в кэш
const safeCache = async (request, response) => {
  if (!response || !response.ok) {
    return response;
  }
  
  try {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    console.error('[ServiceWorker] Ошибка при кэшировании:', error);
    return response;
  }
};

// Перехват запросов
self.addEventListener('fetch', event => {
  // Игнорируем определенные запросы
  const url = new URL(event.request.url);
  
  // Не обрабатываем запросы к API, сокеты и другие специфичные ресурсы
  if (event.request.method !== 'GET' || 
      url.pathname.startsWith('/api/') || 
      url.href.includes('chrome-extension') ||
      url.href.includes('localhost:3003') ||
      url.href.includes('sockjs-node') ||
      url.href.includes('hot-update')) {
    return;
  }

  // Стратегия "Cache First, Network Fallback" для статических ресурсов
  if (url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|json)$/) || 
      url.pathname === '/' || 
      url.pathname === '/index.html') {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Если ресурс найден в кэше, возвращаем его
          if (response) {
            console.log('[ServiceWorker] Возвращаем из кэша:', url.pathname);
            return response;
          }
          
          console.log('[ServiceWorker] Запрос сети для:', url.pathname);
          
          // Иначе делаем запрос к сети
          return fetch(event.request)
            .then(networkResponse => {
              // Если получен успешный ответ, кэшируем его и возвращаем
              if (networkResponse && networkResponse.status === 200) {
                console.log('[ServiceWorker] Кэширую ответ для:', url.pathname);
                return safeCache(event.request, networkResponse);
              }
              
              console.log('[ServiceWorker] Не кэширую ответ для:', url.pathname, networkResponse ? networkResponse.status : 'undefined');
              return networkResponse;
            })
            .catch(error => {
              console.error('[ServiceWorker] Ошибка запроса для:', url.pathname, error);
              
              // Возвращаем заглушку для ошибки сети
              return new Response('Ошибка сети. Проверьте соединение с интернетом.', { 
                status: 503,
                headers: new Headers({
                  'Content-Type': 'text/plain'
                })
              });
            });
        })
    );
  } else {
    // Для других запросов используем стратегию "Network First, Cache Fallback"
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Кэшируем успешные ответы
          if (response && response.status === 200) {
            return safeCache(event.request, response);
          }
          return response;
        })
        .catch(() => {
          // При ошибке сети проверяем кэш
          return caches.match(event.request);
        })
    );
  }
});

// Обработка уведомлений
self.addEventListener('push', event => {
  try {
    let data = { title: 'Уведомление', body: 'Новое уведомление от Агро-карты' };
    
    if (event.data) {
      try {
        data = event.data.json();
      } catch (e) {
        console.error('Ошибка при парсинге данных уведомления:', e);
      }
    }
    
    const options = {
      body: data.body || 'Новое уведомление от Агро-карты',
      icon: '/logo192.png',
      badge: '/favicon.ico',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Уведомление', options)
    );
  } catch (error) {
    console.error('Ошибка при обработке уведомления:', error);
  }
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(windowClients => {
        // Если есть открытое окно - фокусируемся на нем
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === event.notification.data.url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Иначе открываем новое окно
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url);
        }
      })
  );
}); 