const fs = require('fs');
const path = require('path');

// Содержимое файла .env.local
const envContent = `REACT_APP_API_URL=http://192.168.1.105:8000
REACT_APP_API_TIMEOUT=15000
REACT_APP_DEBUG=true
REACT_APP_MOCK_DATA=false`;

// Путь к файлу .env.local
const envPath = path.join(__dirname, '.env.local');

// Запись файла
fs.writeFileSync(envPath, envContent);

console.log(`Файл .env.local создан по пути: ${envPath}`);
console.log('Содержимое:');
console.log(envContent); 