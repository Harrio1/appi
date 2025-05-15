#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Получение IP-адресов
function getIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  Object.keys(interfaces).forEach(iface => {
    interfaces[iface].forEach(details => {
      if (details.family === 'IPv4' && !details.internal) {
        addresses.push(details.address);
      }
    });
  });
  
  return addresses;
}

// Запрос IP-адреса
async function promptForIp(message, defaultValue) {
  return new Promise((resolve) => {
    rl.question(`${message} [${defaultValue}]: `, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

// Запрос порта
async function promptForPort(message, defaultValue) {
  return new Promise((resolve) => {
    rl.question(`${message} [${defaultValue}]: `, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

// Обновление файла mobile-server.js
function updateServerFile(serverIp, mobileIp, serverPort) {
  const serverFilePath = path.join(__dirname, 'mobile-server.js');
  let serverFileContent = fs.readFileSync(serverFilePath, 'utf8');
  
  // Обновление CORS опций
  const corsOptionsRegex = /const corsOptions = \{[\s\S]*?\};/;
  const newCorsOptions = `const corsOptions = {
  origin: ['http://${mobileIp}:3000', 'http://localhost:3000'], // Разрешаем запросы только из этих источников
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With', 'Cache-Control'],
  credentials: true
};`;
  
  serverFileContent = serverFileContent.replace(corsOptionsRegex, newCorsOptions);
  
  // Обновление app.listen
  const listenRegex = /app\.listen\(.*?\);/s;
  const newListen = `app.listen(PORT, '${serverIp}', () => {
  console.log(\`Мобильный API сервер запущен на порту \${PORT}\`);
  console.log(\`Доступен по адресу: http://${serverIp}:\${PORT}\`);
  console.log(\`Тестовый эндпоинт: http://${serverIp}:\${PORT}/api/health\`);
});`;
  
  serverFileContent = serverFileContent.replace(listenRegex, newListen);
  
  // Обновление порта
  const portRegex = /const PORT = \d+;/;
  const newPort = `const PORT = ${serverPort};`;
  
  serverFileContent = serverFileContent.replace(portRegex, newPort);
  
  // Сохранение изменений
  fs.writeFileSync(serverFilePath, serverFileContent);
  console.log(`✅ Файл mobile-server.js обновлен`);
}

// Создание файлов запуска
function createStartScript(serverIp, serverPort) {
  // Создание bat файла
  const batContent = `@echo off
echo Запуск мобильного сервера на IP ${serverIp}:${serverPort}
node mobile-server.js
pause
`;
  fs.writeFileSync(path.join(__dirname, `start-mobile-${serverIp}.bat`), batContent);
  console.log(`✅ Создан файл start-mobile-${serverIp}.bat`);
  
  // Создание PowerShell файла
  const psContent = `# Запуск мобильного сервера на IP ${serverIp}:${serverPort}
Write-Host "Запуск мобильного сервера на IP ${serverIp}:${serverPort}" -ForegroundColor Green
node mobile-server.js
Read-Host "Нажмите Enter для выхода"
`;
  fs.writeFileSync(path.join(__dirname, `start-mobile-${serverIp}.ps1`), psContent);
  console.log(`✅ Создан файл start-mobile-${serverIp}.ps1`);
}

// Основная функция
async function main() {
  console.log('🛠️  Настройка CORS и IP адресов для мобильного сервера');
  console.log('---------------------------------------------------');
  
  const ipAddresses = getIpAddresses();
  console.log('📱 Доступные IP адреса на этой машине:');
  ipAddresses.forEach((ip, index) => {
    console.log(`   ${index + 1}. ${ip}`);
  });
  
  const defaultServerIp = ipAddresses[0] || '192.168.58.253';
  const serverIp = await promptForIp('Введите IP-адрес сервера', defaultServerIp);
  
  const mobileIp = await promptForIp('Введите IP-адрес мобильного клиента', serverIp);
  
  const serverPort = await promptForPort('Введите порт сервера', '8000');
  
  console.log('\n📝 Применение настроек:');
  console.log(`   ➡️ IP сервера: ${serverIp}`);
  console.log(`   ➡️ IP мобильного клиента: ${mobileIp}`);
  console.log(`   ➡️ Порт сервера: ${serverPort}`);
  
  // Применяем изменения
  updateServerFile(serverIp, mobileIp, serverPort);
  createStartScript(serverIp, serverPort);
  
  console.log('\n✅ Настройка завершена!');
  console.log(`Для запуска сервера используйте: node start-mobile-${serverIp}.bat`);
  
  rl.close();
}

main().catch(console.error); 