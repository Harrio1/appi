// Настройки прокси для React-приложения
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('Setting up proxy middleware for API requests...');
  
  // Настройка прокси для API-запросов с префиксом /api
  const apiProxy = createProxyMiddleware({
    target: 'http://127.0.0.1:8000',
    changeOrigin: true,
    secure: false,
    logLevel: 'debug',
    pathRewrite: {
      '^/api': '/api', // Не меняем путь, просто перенаправляем на API сервер
    },
    onProxyReq: (proxyReq, req, res) => {
      // Логирование запроса
      console.log(`Proxying ${req.method} ${req.url} to http://127.0.0.1:8000${req.url}`);
      
      // Для POST запросов убедимся, что тело есть
      if (req.method === 'POST' && req.body) {
        console.log('POST body:', req.body);
      }
      
      // Удаляем заголовок origin, чтобы избежать CORS-проблем
      proxyReq.removeHeader('origin');
    },
    onProxyRes: (proxyRes, req, res) => {
      // Добавляем CORS заголовки в ответ
      proxyRes.headers['Access-Control-Allow-Origin'] = req.headers.origin || '*';
      proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,Cache-Control,Pragma,Expires,Accept';
      
      console.log(`Response from proxy: ${proxyRes.statusCode} for ${req.method} ${req.url}`);
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      console.error('For request:', req.method, req.url);
      res.status(500).json({ 
        error: 'Proxy error', 
        message: err.message,
        details: 'The API server may not be running on port 8000',
        url: req.url,
        method: req.method
      });
    }
  });
  
  // Специальная обработка для OPTIONS запросов
  app.options('/api/*', (req, res) => {
    console.log('Handling OPTIONS request manually for:', req.url);
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Cache-Control,Pragma,Expires,Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(200).end();
  });
  
  // Применяем прокси для всех путей /api
  app.use('/api', apiProxy);
  
  // Добавляем middleware для логирования всех запросов
  app.use((req, res, next) => {
    console.log(`[React App] ${req.method} ${req.url}`);
    next();
  });
  
  // Добавляем middleware для парсинга JSON тела запроса
  app.use(require('body-parser').json());
  
  console.log('Proxy middleware setup complete.');
}; 