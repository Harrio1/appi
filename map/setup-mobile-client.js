#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { exec } = require('child_process');

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

// Создание .env файла для мобильного приложения
function createEnvFile(serverIp, serverPort, appFolder) {
  try {
    const envContent = `REACT_APP_API_URL=http://${serverIp}:${serverPort}
REACT_APP_API_TIMEOUT=10000
REACT_APP_DEBUG=true
REACT_APP_MOCK_DATA=false`;

    const envPath = path.join(appFolder, '.env.local');
    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Файл .env.local создан в ${envPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Ошибка при создании .env файла: ${error.message}`);
    return false;
  }
}

// Создание файла запуска с указанным IP
function createStartScript(mobileIp, mobilePort, appFolder) {
  try {
    const batContent = `@echo off
echo Запуск мобильного приложения на IP ${mobileIp}:${mobilePort}
SET HOST=${mobileIp}
SET PORT=${mobilePort}
cd "${appFolder}"
npm start
pause
`;
    const batPath = path.join(appFolder, `start-${mobileIp}.bat`);
    fs.writeFileSync(batPath, batContent);
    console.log(`✅ Файл запуска создан: ${batPath}`);

    const psContent = `# Запуск мобильного приложения на IP ${mobileIp}:${mobilePort}
Write-Host "Запуск мобильного приложения на IP ${mobileIp}:${mobilePort}" -ForegroundColor Green
$env:HOST="${mobileIp}"
$env:PORT="${mobilePort}"
Set-Location "${appFolder.replace(/\\/g, '\\\\')}"
npm start
`;
    const psPath = path.join(appFolder, `start-${mobileIp}.ps1`);
    fs.writeFileSync(psPath, psContent);
    console.log(`✅ PowerShell скрипт создан: ${psPath}`);

    return true;
  } catch (error) {
    console.error(`❌ Ошибка при создании скрипта запуска: ${error.message}`);
    return false;
  }
}

// Проверка наличия axios в package.json и настройка API URL
function setupApiConfig(serverIp, serverPort, appFolder) {
  try {
    // Путь к файлу настроек API (предполагаем, что он находится в src/api/config.js или подобном месте)
    const possibleConfigPaths = [
      path.join(appFolder, 'src', 'api', 'config.js'),
      path.join(appFolder, 'src', 'config', 'api.js'),
      path.join(appFolder, 'src', 'services', 'api.js'),
      path.join(appFolder, 'src', 'utils', 'api.js')
    ];

    let configFilePath = null;
    for (const filePath of possibleConfigPaths) {
      if (fs.existsSync(filePath)) {
        configFilePath = filePath;
        break;
      }
    }

    if (!configFilePath) {
      console.log('⚠️ Не найден файл конфигурации API. Создадим его...');
      configFilePath = path.join(appFolder, 'src', 'api', 'config.js');
      
      // Создаем каталог, если он не существует
      const apiDir = path.dirname(configFilePath);
      if (!fs.existsSync(apiDir)) {
        fs.mkdirSync(apiDir, { recursive: true });
      }
      
      const configContent = `// Автоматически созданный файл конфигурации API
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://${serverIp}:${serverPort}';
const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT || '10000', 10);

const api = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

export default api;
`;
      fs.writeFileSync(configFilePath, configContent);
      console.log(`✅ Файл конфигурации API создан: ${configFilePath}`);
    } else {
      console.log(`📝 Обновление файла конфигурации API: ${configFilePath}`);
      let configContent = fs.readFileSync(configFilePath, 'utf8');
      
      // Обновляем URL API в файле конфигурации
      configContent = configContent.replace(
        /const API_URL\s*=\s*[^;]+;/,
        `const API_URL = process.env.REACT_APP_API_URL || 'http://${serverIp}:${serverPort}';`
      );
      
      fs.writeFileSync(configFilePath, configContent);
      console.log(`✅ URL API обновлен в файле конфигурации`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Ошибка при настройке конфигурации API: ${error.message}`);
    return false;
  }
}

// Основная функция
async function main() {
  console.log('🛠️  Настройка мобильного клиента');
  console.log('--------------------------------');
  
  const ipAddresses = getIpAddresses();
  console.log('📱 Доступные IP адреса на этой машине:');
  ipAddresses.forEach((ip, index) => {
    console.log(`   ${index + 1}. ${ip}`);
  });
  
  // Определение пути к мобильному приложению
  const workspacePath = process.cwd();
  let mobileAppPath = path.join(workspacePath, '..', 'mobile-app');
  
  if (!fs.existsSync(mobileAppPath)) {
    mobileAppPath = path.join(workspacePath, 'mobile-app');
    
    if (!fs.existsSync(mobileAppPath)) {
      mobileAppPath = await new Promise((resolve) => {
        rl.question('Введите путь к папке мобильного приложения: ', (answer) => {
          resolve(answer.trim());
        });
      });
      
      if (!fs.existsSync(mobileAppPath)) {
        console.error(`❌ Папка не найдена: ${mobileAppPath}`);
        rl.close();
        return;
      }
    }
  }
  
  console.log(`📁 Папка мобильного приложения: ${mobileAppPath}`);
  
  // Запрос параметров
  const defaultServerIp = ipAddresses[0] || '192.168.58.253';
  const serverIp = await promptForIp('Введите IP-адрес сервера', defaultServerIp);
  const serverPort = await promptForPort('Введите порт сервера', '8000');
  
  const mobileIp = await promptForIp('Введите IP-адрес для запуска мобильного приложения', defaultServerIp);
  const mobilePort = await promptForPort('Введите порт для запуска мобильного приложения', '3000');
  
  console.log('\n📝 Применение настроек:');
  console.log(`   ➡️ IP сервера: ${serverIp}:${serverPort}`);
  console.log(`   ➡️ IP мобильного приложения: ${mobileIp}:${mobilePort}`);
  
  // Применяем изменения
  createEnvFile(serverIp, serverPort, mobileAppPath);
  setupApiConfig(serverIp, serverPort, mobileAppPath);
  createStartScript(mobileIp, mobilePort, mobileAppPath);
  
  console.log('\n✅ Настройка мобильного клиента завершена!');
  console.log(`Для запуска клиента используйте: ${path.join(mobileAppPath, `start-${mobileIp}.bat`)}`);
  
  // Спрашиваем, хочет ли пользователь запустить клиент сейчас
  rl.question('\nЗапустить мобильное приложение сейчас? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      console.log('Запуск мобильного приложения...');
      const scriptPath = path.join(mobileAppPath, `start-${mobileIp}.bat`);
      exec(`"${scriptPath}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Ошибка при запуске: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`⚠️ Вывод ошибок: ${stderr}`);
        }
        console.log(`📱 Приложение запущено: ${stdout}`);
      });
    } else {
      console.log('Запуск отменен. Вы можете запустить приложение вручную позже.');
    }
    rl.close();
  });
}

main().catch(console.error); 