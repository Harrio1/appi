// Имя кэша для нашего приложения
const CACHE_NAME = 'agro-mob-v3';
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

// Функция для проверки, можно ли кэшировать запрос
const isCacheableRequest = (request) => {
  try {
    // Проверяем URL и его схему
    const url = new URL(request.url);
    // Кэшируем только http и https схемы
    return (url.protocol === 'http:' || url.protocol === 'https:');
  } catch (e) {
    console.error('Ошибка при проверке URL запроса:', e);
    return false;
  }
};

// Установка сервис-воркера и кэширование статических ресурсов
self.addEventListener('install', (event) => {
  console.log('Service Worker установка v3');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Кэш открыт');
        return cache.addAll(urlsToCache)
          .catch(error => {
            console.error('Ошибка при кэшировании статических ресурсов:', error);
            // Продолжаем установку даже при ошибке кэширования
            return Promise.resolve();
          });
      })
  );
  
  // Активируем новый сервис-воркер сразу (не ждем закрытия всех вкладок)
  self.skipWaiting();
});

// Активация нового сервис-воркера и удаление старых кэшей
self.addEventListener('activate', (event) => {
  console.log('Service Worker активация v3');
  const cacheWhitelist = [CACHE_NAME, API_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Удаление устаревшего кэша:', cacheName);
            return caches.delete(cacheName);
          }
          return Promise.resolve();
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
  // Игнорируем все запросы к chrome-extension
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  // Проверяем, можно ли кэшировать запрос (исключаем chrome-extension и другие схемы)
  if (!isCacheableRequest(event.request)) {
    console.log('Пропускаем некэшируемый запрос:', event.request.url);
    return;
  }
  
  // Проверяем, является ли запрос API запросом
  const isApiRequest = event.request.url.includes('/api/');
  
  try {
    if (isApiRequest) {
      // Для API запросов используем стратегию "сеть с fallback на кэш"
      event.respondWith(
        fetch(event.request.clone())
          .then((response) => {
            // Проверяем валидность ответа
            if (!response || response.status !== 200) {
              return response;
            }

            try {
              // Клонируем ответ для кэширования
              const responseToCache = response.clone();
              
              // Кэшируем ответ API в отдельный кэш для API
              caches.open(API_CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                  console.log('API ответ закэширован:', event.request.url);
                })
                .catch(error => {
                  console.error('Ошибка при кэшировании API:', error);
                });
            } catch (error) {
              console.error('Ошибка при обработке кэширования:', error);
            }

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
              })
              .catch(error => {
                console.error('Ошибка при получении данных из кэша:', error);
                return new Response(JSON.stringify({ error: 'Ошибка сервиса' }), {
                  headers: { 'Content-Type': 'application/json' },
                  status: 500
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
                
                try {
                  // Проверяем еще раз, можно ли кэшировать этот ответ
                  if (isCacheableRequest(event.request)) {
                    // Клонируем ответ для кэширования
                    const responseToCache = response.clone();
                    
                    // Сохраняем в кэш
                    caches.open(CACHE_NAME)
                      .then((cache) => {
                        cache.put(event.request, responseToCache);
                      })
                      .catch(error => {
                        console.error('Ошибка при сохранении в кэш:', error);
                      });
                  }
                } catch (error) {
                  console.error('Ошибка при обработке кэширования:', error);
                }
                  
                return response;
              })
              .catch(error => {
                console.error('Ошибка при загрузке ресурса:', error);
                return new Response('Ошибка загрузки ресурса', { status: 500 });
              });
          })
          .catch(error => {
            console.error('Ошибка при проверке кэша:', error);
            return fetch(event.request);
          })
      );
    }
  } catch (error) {
    console.error('Критическая ошибка в обработчике fetch:', error);
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