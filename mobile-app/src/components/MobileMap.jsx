import React, { useState, useEffect, useRef } from "react";
import L from 'leaflet';
import { MapContainer, TileLayer, ZoomControl, Polygon, Tooltip, Marker, Popup } from "react-leaflet";
// Используем новые сервисы для оффлайн режима
import ApiService from '../utils/apiService';
import '../css/MobileMap.css';

// указываем путь к файлам marker
L.Icon.Default.imagePath = "https://unpkg.com/leaflet@1.9.4/dist/images/";

// Добавляем логирование для отладки
console.log('MobileMap инициализирован');

// Добавляем информацию о текущей конфигурации
console.log('Текущий URL приложения:', window.location.href);
console.log('Режим разработки:', process.env.NODE_ENV === 'development' ? 'Да' : 'Нет');
console.log('Состояние сети:', navigator.onLine ? 'Онлайн' : 'Оффлайн');

const MobileMap = () => {
  // Добавляем ref для отслеживания, смонтирован ли компонент
  const isMounted = useRef(true);
  
  // Фиксированные координаты для центра карты (вместо геолокации)
  const [lat, setLat] = useState(46.3);        // Обновленный центр по данным со скриншота
  const [lng, setLng] = useState(41.9);        // Обновленный центр по данным со скриншота
  const [zoom, setZoom] = useState(10);       // Меньший зум для отображения всех полей
  const [basemap, setBasemap] = useState('mapbox');
  const [polygons, setPolygons] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [currentSeasonId, setCurrentSeasonId] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [searchText, setSearchText] = useState('');
  const [filteredPolygons, setFilteredPolygons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [crops, setCrops] = useState([]);
  const [selectedCropType, setSelectedCropType] = useState('');
  const [hideInterface, setHideInterface] = useState(false);
  // Новые состояния для оффлайн режима
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('Никогда');
  // Состояние для подсказки
  const [showHelpTip, setShowHelpTip] = useState(false);
  // Состояние для компактного режима
  const [compactMode, setCompactMode] = useState(false);
  // Цвета для типов культур, совпадающие с основным проектом
  const [fieldColors, setFieldColors] = useState({
    'Пшеница': 'gold',
    'Кукуруза': 'yellow',
    'Соя': 'green',
    'Подсолнечник': 'orange',
    'Рапс': 'lightgreen',
    'Ячмень': 'beige',
    'Овес': 'lightyellow',
    'Рис': 'lightblue',
    'Гречиха': 'brown'
  });
  
  const basemapsDict = {
    osm: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    hot: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
    mapbox: "https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}.png"
  };

  function filterPolygons(polygonsData = polygons) {
    // Проверяем, смонтирован ли компонент
    if (!isMounted.current) return;
    
    // Фильтрация начинается с исходного набора полигонов
    let filtered = polygonsData;
    
    // Фильтр по названию поля (текстовый поиск)
    if (searchText.trim()) {
      filtered = filtered.filter(polygon => 
        polygon.name && polygon.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    // Фильтр по выбранному типу культуры из выпадающего списка
    if (selectedCropType) {
      filtered = filtered.filter(polygon => 
        polygon.field_type === selectedCropType
      );
    }
    
    // Логирование для отладки
    if (currentSeasonId) {
      console.log(`Отображение полей для сезона ID: ${currentSeasonId}`);
      const fieldTypesInSeason = filtered
        .map(polygon => polygon.field_type)
        .filter((value, index, self) => self.indexOf(value) === index);
      console.log('Типы культур в текущем сезоне:', fieldTypesInSeason);
    }
    
    setFilteredPolygons(filtered);
  }

  // Обработчик переключения режима
  const toggleOfflineMode = async () => {
    const newOfflineMode = !isOfflineMode;
    setIsOfflineMode(newOfflineMode);
    
    // Перезагружаем данные с учетом нового режима
    await loadSeasons(newOfflineMode);
    await loadFields(newOfflineMode);
    await loadCrops(newOfflineMode);
    
    // Сбрасываем выбранные значения
    setCurrentSeasonId('');
    setSelectedCropType('');
  };

  // Проверка, был ли уже показан совет по использованию интерфейса
  const checkIfHelpTipShown = () => {
    const helpTipShown = localStorage.getItem('helpTipShown');
    if (!helpTipShown) {
      setShowHelpTip(true);
      // Устанавливаем таймер на скрытие подсказки через 5 секунд
      setTimeout(() => {
        setShowHelpTip(false);
        localStorage.setItem('helpTipShown', 'true');
      }, 7000);
    }
  };

  useEffect(() => {
    // Устанавливаем флаг монтирования
    isMounted.current = true;
    
    // Проверяем, нужно ли показать подсказку
    checkIfHelpTipShown();
    
    // Установка слушателей для отслеживания состояния сети
    ApiService.setupNetworkListeners();
    
    // Проверяем текущее состояние сети
    const checkNetworkStatus = async () => {
      const isOnline = ApiService.isOnline();
      if (!isOnline) {
        setIsOfflineMode(true);
      }
    };
    
    checkNetworkStatus();
    
    // Обновляем информацию о последней синхронизации
    const updateLastSyncTime = async () => {
      const time = await ApiService.getLastSyncTimeFormatted();
      if (isMounted.current) {
        setLastSyncTime(time);
      }
    };
    
    updateLastSyncTime();
    
    // Загружаем данные сразу
    loadSeasons();
    loadFields();
    loadCrops();
    
    // Проверяем размер экрана для автоматического включения компактного режима
    const checkScreenSize = () => {
      if (window.innerWidth < 360) {
        setCompactMode(true);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    // Функция очистки при размонтировании компонента
    return () => {
      isMounted.current = false;
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  useEffect(() => {
    if (isMounted.current) {
      filterPolygons();
    }
  }, [searchText, polygons, selectedCropType]);

  const loadSeasons = async (forceOffline = isOfflineMode) => {
    try {
      const data = await ApiService.fetchSeasons(forceOffline);
      if (isMounted.current) {
        setSeasons(data);
      }
    } catch (error) {
      console.error('Ошибка при загрузке сезонов:', error);
      if (isMounted.current) {
        alert('Не удалось загрузить сезоны. ' + (forceOffline ? 'Нет данных в кэше.' : ''));
      }
    }
  };

  const loadCrops = async (forceOffline = isOfflineMode) => {
    try {
      const data = await ApiService.fetchCrops(forceOffline);
      if (isMounted.current) {
        setCrops(data);
        
        // Обновляем цвета полей на основе полученных данных о культурах
        if (data && data.length > 0) {
          // Создаем новый объект для цветов
          const newFieldColors = { ...fieldColors };
          
          // Обновляем цвета из данных API
          data.forEach(crop => {
            if (crop.name && crop.color) {
              newFieldColors[crop.name] = crop.color;
            }
          });
          
          // Устанавливаем обновленные цвета
          setFieldColors(newFieldColors);
          console.log('Обновлены цвета культур:', newFieldColors);
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке культур:', error);
    }
  };

  const loadFields = async (forceOffline = isOfflineMode) => {
    if (isMounted.current) {
      setIsLoading(true);
    }
    try {
      let data;
      if (currentSeasonId) {
        console.log('Загружаем поля для сезона:', currentSeasonId);
        data = await ApiService.fetchFieldsForSeason(currentSeasonId, forceOffline);
      } else {
        console.log('Загружаем все поля');
        data = await ApiService.fetchFields(forceOffline);
      }
      
      console.log('Получены данные полей, количество:', data ? data.length : 0);
      
      // Дополнительное логирование формата данных
      if (data && data.length > 0) {
        console.log('Пример первого поля:', JSON.stringify(data[0]).substring(0, 200) + '...');
        
        // Проверяем наличие координат в каждом поле
        let fieldsWithCoordinates = 0;
        let fieldsWithValidCoordinates = 0;
        let coordinateFormats = new Set();
        
        data.forEach((field, index) => {
          if (field.coordinates) {
            fieldsWithCoordinates++;
            
            // Определяем формат координат
            let format = 'unknown';
            if (typeof field.coordinates === 'string') {
              format = 'string';
            } else if (Array.isArray(field.coordinates)) {
              if (field.coordinates.length === 0) {
                format = 'empty_array';
              } else if (typeof field.coordinates[0] === 'number') {
                format = 'flat_array_of_numbers';
              } else if (Array.isArray(field.coordinates[0])) {
                if (field.coordinates[0].length === 2 && typeof field.coordinates[0][0] === 'number') {
                  format = 'array_of_points';
                  fieldsWithValidCoordinates++;
                } else if (Array.isArray(field.coordinates[0][0])) {
                  format = 'nested_arrays';
                  fieldsWithValidCoordinates++;
                }
              }
            } else if (typeof field.coordinates === 'object') {
              if (field.coordinates.coordinates) {
                format = 'object_with_coordinates';
                fieldsWithValidCoordinates++;
              } else if (field.coordinates.type) {
                format = 'geojson';
                fieldsWithValidCoordinates++;
              }
            }
            
            coordinateFormats.add(format);
            
            // Дополнительное логирование для выборочных полей
            if (index < 3 || index === data.length - 1) {
              console.log(`Поле ${index}, ID: ${field.id}, формат координат: ${format}`);
            }
          }
        });
        
        console.log(`Статистика полей: всего ${data.length}, с координатами ${fieldsWithCoordinates}, с валидными координатами ${fieldsWithValidCoordinates}`);
        console.log('Обнаруженные форматы координат:', Array.from(coordinateFormats));
      }
      
      // Проверяем, имеют ли данные правильный формат
      const validData = Array.isArray(data) ? data : [];
      
      if (validData.length === 0) {
        console.warn('Получен пустой массив данных полей');
        if (isMounted.current) {
          setPolygons([]);
          setFilteredPolygons([]);
          setIsLoading(false);
        }
        return;
      }
      
      // Проверяем и преобразуем координаты для корректного отображения
      const processedPolygons = validData.map((field, index) => {
        // Создаем копию поля для изменений
        const processedField = { ...field };
        let coordinates = field.coordinates;
        
        // Дополнительное логирование для отладки
        console.log(`Обработка поля ${index}, ID: ${field.id || 'неизвестен'}, тип координат:`, typeof coordinates);
        
        try {
          // Если координаты не в правильном формате, преобразуем их
          if (coordinates) {
            // Проверяем, если координаты - строка, пытаемся распарсить JSON
            if (typeof coordinates === 'string') {
              try {
                coordinates = JSON.parse(coordinates);
                console.log(`Поле ${index}: координаты успешно распарсены из JSON`);
              } catch (e) {
                console.error(`Поле ${index}: ошибка парсинга координат из JSON:`, e);
                coordinates = [];
              }
            }
            
            // Убеждаемся, что координаты в правильном формате [[[lon,lat],...]]
            if (Array.isArray(coordinates)) {
              // Если координаты не имеют правильной вложенности
              if (coordinates.length > 0) {
                if (!Array.isArray(coordinates[0])) {
                  // Формат [lon,lat] -> [[[lon,lat]]]
                  console.log(`Поле ${index}: преобразование из формата [lon,lat]`);
                  coordinates = [[coordinates]];
                } else if (!Array.isArray(coordinates[0][0])) {
                  // Формат [[lon,lat], [lon,lat]] -> [[[lon,lat], [lon,lat]]]
                  console.log(`Поле ${index}: преобразование из формата [[lon,lat], ...]`);
                  coordinates = [coordinates];
                }
              } else {
                console.warn(`Поле ${index}: пустой массив координат`);
                coordinates = [];
              }
            } else {
              console.warn(`Поле ${index}: координаты не являются массивом:`, typeof coordinates);
              coordinates = [];
            }
          } else {
            console.warn(`Поле ${index}: координаты отсутствуют`);
            coordinates = [];
          }
        } catch (error) {
          console.error(`Ошибка при обработке координат поля ${index}:`, error);
          coordinates = [];
        }
        
        // Логируем результат обработки
        console.log(`Поле ${index} после обработки:`, 
                   coordinates.length > 0 ? 
                   `уровни вложенности: ${Array.isArray(coordinates) ? 1 : 0}→${Array.isArray(coordinates[0]) ? 2 : 0}→${coordinates[0] && Array.isArray(coordinates[0][0]) ? 3 : 0}` : 
                   'нет координат');
        
        processedField.coordinates = coordinates;
        return processedField;
      });
      
      if (isMounted.current) {
        console.log('Обработанные полигоны, количество:', processedPolygons.length);
        
        // Проверяем, что хотя бы один полигон имеет координаты
        const hasValidPolygons = processedPolygons.some(
          polygon => polygon.coordinates && 
                    polygon.coordinates.length > 0 && 
                    polygon.coordinates[0] && 
                    polygon.coordinates[0].length > 0
        );
        
        if (!hasValidPolygons) {
          console.warn('Ни один полигон не имеет действительных координат!');
        }
        
        setPolygons(processedPolygons);
        setFilteredPolygons(processedPolygons);
        
        // Обновляем информацию о последней синхронизации
        const time = await ApiService.getLastSyncTimeFormatted();
        setLastSyncTime(time);
      }
    } catch (error) {
      console.error('Ошибка при загрузке полей:', error);
      if (isMounted.current) {
        alert('Не удалось загрузить данные полей. ' + (forceOffline ? 'Нет данных в кэше.' : ''));
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  const handleSeasonChange = async (e) => {
    const seasonId = e.target.value;
    if (isMounted.current) {
      setCurrentSeasonId(seasonId);
      setIsLoading(true);
      // Сбрасываем выбранный тип культуры при смене сезона
      setSelectedCropType('');
    }

    if (seasonId === '') {
      loadFields();
      return;
    }

    try {
      console.log('Загружаем поля для сезона:', seasonId);
      // Получаем поля для выбранного сезона
      const seasonFieldsData = await ApiService.fetchFieldsForSeason(seasonId, isOfflineMode);
      
      // Также загрузим все поля для обеспечения полного списка
      const allFieldsData = await ApiService.fetchFields(isOfflineMode);
      
      console.log('Данные полей для сезона:', seasonFieldsData);
      console.log('Все данные полей:', allFieldsData);
      
      // Обрабатываем поля, устанавливая правильные типы культур из сезона
      const processedPolygons = allFieldsData.map(field => {
        // Ищем соответствующее поле в данных сезона
        const seasonField = seasonFieldsData.find(f => f.id === field.id);
        
        // Копируем поле и обновляем его свойства
        const processedField = { ...field };
        
        // Устанавливаем тип культуры из данных сезона, если поле найдено
        if (seasonField) {
          processedField.field_type = seasonField.seed_name || seasonField.field_type || field.field_type || 'Неизвестно';
        }
        
        // Обрабатываем координаты
        let coordinates = field.coordinates;
        
        try {
          // Если координаты не в правильном формате, преобразуем их
          if (coordinates) {
            // Проверяем, если координаты - строка, пытаемся распарсить JSON
            if (typeof coordinates === 'string') {
              try {
                coordinates = JSON.parse(coordinates);
              } catch (e) {
                console.error(`Ошибка парсинга координат из JSON:`, e);
                coordinates = [];
              }
            }
            
            // Убеждаемся, что координаты в правильном формате [[[lon,lat],...]]
            if (Array.isArray(coordinates)) {
              // Если координаты не имеют правильной вложенности
              if (coordinates.length > 0) {
                if (!Array.isArray(coordinates[0])) {
                  // Формат [lon,lat] -> [[[lon,lat]]]
                  coordinates = [[coordinates]];
                } else if (!Array.isArray(coordinates[0][0])) {
                  // Формат [[lon,lat], [lon,lat]] -> [[[lon,lat], [lon,lat]]]
                  coordinates = [coordinates];
                }
              } else {
                coordinates = [];
              }
            } else {
              coordinates = [];
            }
          } else {
            coordinates = [];
          }
        } catch (error) {
          console.error(`Ошибка при обработке координат:`, error);
          coordinates = [];
        }
        
        processedField.coordinates = coordinates;
        return processedField;
      });
      
      if (isMounted.current) {
        console.log('Обработанные полигоны для сезона:', processedPolygons);
        setPolygons(processedPolygons);
        setFilteredPolygons(processedPolygons);
      }
    } catch (error) {
      console.error('Ошибка при загрузке полей для сезона:', error);
      if (isMounted.current) {
        alert('Не удалось загрузить поля для выбранного сезона. ' + (isOfflineMode ? 'Данные не найдены в кэше.' : ''));
        // Сбрасываем выбор сезона при ошибке
        setCurrentSeasonId('');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  const handleCropTypeChange = (e) => {
    const newCropType = e.target.value;
    
    // Если выбран сезон, проверяем, посажена ли культура в этом сезоне
    if (currentSeasonId) {
      // Получаем список посаженных культур в текущем сезоне
      const plantedCropTypes = [...new Set(filteredPolygons
        .map(polygon => polygon.field_type)
        .filter(type => type && type !== 'Неизвестно'))];
      
      // Проверяем, есть ли выбранная культура среди посаженных
      if (newCropType && !plantedCropTypes.includes(newCropType)) {
        alert(`Внимание: Культура "${newCropType}" не была посажена в выбранном сезоне.`);
      }
    }
    
    setSelectedCropType(newCropType);
  };

  const toggleInterface = () => {
    setHideInterface(!hideInterface);
    // При скрытии интерфейса показываем подсказку
    if (!hideInterface) {
      setShowHelpTip(true);
      setTimeout(() => setShowHelpTip(false), 3000);
    }
  };

  const changeBasemap = (newBasemap) => {
    setBasemap(newBasemap);
  };

  const toggleCompactMode = () => {
    setCompactMode(!compactMode);
  };

  const renderCropOptions = () => {
    // Всегда используем все доступные культуры
    const allCropTypes = crops.map(crop => crop.name);
    
    // Для текущего сезона определяем, какие культуры фактически посажены
    const plantedCropTypes = currentSeasonId 
      ? [...new Set(filteredPolygons
          .map(polygon => polygon.field_type)
          .filter(type => type && type !== 'Неизвестно'))]
      : [];
    
    console.log('Все типы культур:', allCropTypes);
    console.log('Посаженные культуры в текущем сезоне:', plantedCropTypes);
    
    // Создаем опции из всех типов культур
    return allCropTypes.map(type => (
      <option 
        key={type} 
        value={type} 
        style={{
          backgroundColor: fieldColors[type] || 'white',
          // Если сезон выбран и культура не посажена, делаем текст серым
          color: currentSeasonId && !plantedCropTypes.includes(type) ? 'gray' : 'black'
        }}
      >
        {type}{currentSeasonId && !plantedCropTypes.includes(type) ? ' (не посажена)' : ''}
      </option>
    ));
  };

  // Функция для отображения полигонов полей с оптимизацией для большого количества
  const renderPolygons = () => {
    // Если нет данных полигонов, показываем сообщение
    if (filteredPolygons.length === 0) {
      // Проверяем, есть ли выбранный тип культуры
      if (selectedCropType) {
        return (
          <div className="no-polygons-message">
            <p>Нет полей с культурой "{selectedCropType}" {currentSeasonId ? 'в выбранном сезоне' : ''}</p>
          </div>
        );
      }
      
      console.log('Нет полигонов для отображения');
      return (
        <div className="no-polygons-message">
          <p>Нет данных для отображения</p>
        </div>
      );
    }

    console.log(`Отображаем ${filteredPolygons.length} полигонов`);
    console.log('Примеры полигонов:', filteredPolygons.slice(0, 2));

    // Ограничиваем количество отображаемых полигонов для лучшей производительности
    const maxDisplayedPolygons = 500;
    const polygonsToRender = filteredPolygons.slice(0, maxDisplayedPolygons);

    return polygonsToRender.map((polygon, index) => {
      // Проверяем наличие координат
      if (!polygon.coordinates) {
        console.warn(`Полигон ${index} ID: ${polygon.id || 'неизвестен'} - координаты отсутствуют`);
        return null;
      }
      
      console.log(`Полигон ${index} ID:`, polygon.id, 'Координаты:', JSON.stringify(polygon.coordinates).substring(0, 50) + '...');

      // Преобразуем координаты в формат для Leaflet
      let coordinates = [];
      
      try {
        // Получаем координаты в нужном формате
        let coords = polygon.coordinates;
        
        // Если координаты в формате строки, преобразуем их в объект
        if (typeof coords === 'string') {
          try {
            coords = JSON.parse(coords);
            console.log(`Полигон ${index}: координаты преобразованы из строки в объект`);
          } catch (e) {
            console.error(`Ошибка парсинга JSON координат для полигона ${index}:`, e);
            return null;
          }
        }
        
        // Определяем формат данных на основе скриншота и структуры
        // Формат из скриншота: массив координат [[lat, lon], [lat, lon], ...]
        if (Array.isArray(coords) && Array.isArray(coords[0]) && coords[0].length === 2 && 
            typeof coords[0][0] === 'number' && typeof coords[0][1] === 'number') {
          console.log(`Полигон ${index}: обнаружен формат массива точек`);
          // Поскольку на скриншоте видны правильно отображаемые поля,
          // предполагаем что координаты уже в правильном формате [lat, lon]
          coordinates = [coords];
        }
        // Формат вложенных массивов: [[[lat, lon], [lat, lon], ...]]
        else if (Array.isArray(coords) && Array.isArray(coords[0]) && 
                 Array.isArray(coords[0][0]) && coords[0][0].length === 2) {
          console.log(`Полигон ${index}: формат вложенных массивов`);
          coordinates = coords;
        }
        // Формат GeoJSON: {"type": "Polygon", "coordinates": [[[lon, lat], ...]]}
        else if (coords.type === 'Polygon' && Array.isArray(coords.coordinates)) {
          console.log(`Полигон ${index}: формат GeoJSON Polygon`);
          // Для GeoJSON нужно поменять местами [lon, lat] -> [lat, lon]
          coordinates = coords.coordinates.map(ring => 
            ring.map(coord => [coord[1], coord[0]])
          );
        }
        // Формат с coordinates в объекте: {coordinates: [[lat, lon], ...]}
        else if (coords.coordinates && Array.isArray(coords.coordinates)) {
          console.log(`Полигон ${index}: формат с coordinates в объекте`);
          // Если координаты уже в формате [[lat, lon], ...]
          coordinates = [coords.coordinates];
        }
        // Плоский массив чисел [lat, lon, lat, lon, ...]
        else if (Array.isArray(coords) && coords.length >= 4 && typeof coords[0] === 'number') {
          console.log(`Полигон ${index}: плоский массив координат`);
          const ring = [];
          for (let i = 0; i < coords.length; i += 2) {
            if (i + 1 < coords.length) {
              ring.push([coords[i], coords[i+1]]);
            }
          }
          coordinates = [ring];
        }
        else {
          console.warn(`Полигон ${index}: неизвестный формат координат:`, coords);
          return null;
        }
        
        // Дополнительная проверка, что координаты правильно преобразованы
        if (coordinates && coordinates.length > 0 && coordinates[0] && coordinates[0].length > 0) {
          console.log(`Полигон ${index}: координаты после преобразования:`, 
                     `${coordinates.length} колец, ${coordinates[0].length} точек в первом кольце`);
          console.log(`Первая точка: [${coordinates[0][0][0]}, ${coordinates[0][0][1]}]`);
        }
      } catch (error) {
        console.error(`Ошибка при обработке координат полигона ${index}:`, error);
        return null;
      }

      // Проверка на валидность координат
      if (!coordinates || coordinates.length === 0 || 
          !coordinates[0] || coordinates[0].length < 3) {
        console.warn(`Пропускаем полигон с ID: ${polygon.id} - недостаточно точек:`, 
                     coordinates ? JSON.stringify(coordinates).substr(0, 100) : 'нет координат');
        return null;
      }

      // Добавляем отладочную информацию о полученных координатах
      console.log(`Полигон ${index} подготовлен для отображения, точек: ${coordinates[0].length}`);
      console.log(`Пример точек: ${JSON.stringify(coordinates[0].slice(0, 2))}`);

      // Цвет в зависимости от типа культуры
      const getColor = () => {
        // Используем цвета из состояния fieldColors
        if (polygon.field_type && fieldColors[polygon.field_type]) {
          return fieldColors[polygon.field_type];
        }
        // Если цвет не найден, возвращаем красный по умолчанию
        return 'red';
      };

      // Получаем цвет для поля
      const fieldColor = getColor();
      const hasFieldType = polygon.field_type && polygon.field_type !== 'Неизвестно';

      // Устанавливаем стиль полигона
      return (
        <React.Fragment key={`fragment-${polygon.id}`}>
          <Polygon 
            key={`polygon-${polygon.id}`} 
            positions={coordinates}
            pathOptions={{ 
              fillColor: hasFieldType ? fieldColor : 'transparent',
              weight: 1.5,
              opacity: 1,
              color: 'red',
              fillOpacity: hasFieldType ? 0.5 : 0.05
            }}
          >
            <Tooltip permanent direction="center" className="polygon-tooltip">
              <span>{polygon.name || polygon.id}{polygon.field_type ? ` (${polygon.field_type})` : ''}</span>
            </Tooltip>
            <Popup className="field-popup">
              <div className="field-popup-content">
                <p><strong>Имя полигона:</strong> {polygon.name || polygon.id}</p>
                <p><strong>Тип поля:</strong> {polygon.field_type || 'Не задан'}</p>
                <p><strong>Площадь:</strong> {formatArea(polygon.area)}</p>
              </div>
            </Popup>
          </Polygon>
        </React.Fragment>
      );
    });
  };

  // Функция для форматирования площади с разделением разрядов
  const formatArea = (area) => {
    if (!area) return 'Не указана';
    // Форматируем число с разделением разрядов
    const formattedArea = Number(area).toLocaleString('ru-RU');
    return `${formattedArea} кв.м`;
  };

  return (
    <div className={`mobile-map-container ${compactMode ? 'mobile-mini-interface' : ''}`}>
      {!hideInterface && (
        <div className="mobile-controls">
          <div className="mobile-header">
            <h1>АгроМоб</h1>
            <div className="interface-controls">
              <button 
                onClick={toggleCompactMode}
                className="compact-toggle-btn"
                title={compactMode ? "Расширенный режим" : "Компактный режим"}
              >
                {compactMode ? "⊞" : "⊟"}
              </button>
              <button 
                className="toggle-interface-btn" 
                onClick={toggleInterface}
                title="Скрыть интерфейс"
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="offline-info">
            <div className={`connection-status ${isOfflineMode ? 'offline' : 'online'}`}>
              {isOfflineMode ? 'Оффлайн' : 'Онлайн'}
            </div>
            <button 
              className={`toggle-offline-btn ${isOfflineMode ? 'offline' : 'online'}`} 
              onClick={toggleOfflineMode}
            >
              {isOfflineMode ? 'В онлайн' : 'В оффлайн'}
            </button>
            <div className="last-sync">
              Синхр: {lastSyncTime}
            </div>
          </div>
          
          <div className="filters">
            <div className="filter-row">
              <div className="filter-group">
                <label>Сезон:</label>
                <select 
                  className="season-select" 
                  onChange={handleSeasonChange}
                  value={currentSeasonId || ''}
                >
                  <option value="">Все</option>
                  {seasons.map(season => (
                    <option key={season.id} value={season.id}>
                      {season.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label>Культура:</label>
                <select 
                  className="crop-select" 
                  onChange={handleCropTypeChange}
                  value={selectedCropType}
                >
                  <option value="">Все</option>
                  {renderCropOptions()}
                </select>
                {selectedCropType && (
                  <div className="filter-stats">
                    Полей: {filteredPolygons.length}
                  </div>
                )}
              </div>
              
              <div className="filter-group">
                <label>Поиск:</label>
                <input 
                  type="text" 
                  className="search-input"
                  placeholder="Название..." 
                  onChange={handleSearchChange}
                />
              </div>
            </div>
          </div>
          
          <div className="basemap-selector">
            <button 
              className={`basemap-btn ${basemap === 'mapbox' ? 'active' : ''}`} 
              onClick={() => changeBasemap('mapbox')}
            >
              Спутник
            </button>
            <button 
              className={`basemap-btn ${basemap === 'osm' ? 'active' : ''}`} 
              onClick={() => changeBasemap('osm')}
            >
              Карта
            </button>
            <button 
              className={`basemap-btn ${basemap === 'dark' ? 'active' : ''}`} 
              onClick={() => changeBasemap('dark')}
            >
              Тёмная
            </button>
          </div>
        </div>
      )}
      
      {hideInterface && (
        <button 
          className="show-interface-btn" 
          onClick={toggleInterface}
          title="Показать интерфейс"
        >
          <span className="hamburger-icon">&#9776;</span>
          <span className="button-text">Меню</span>
        </button>
      )}

      {/* Всплывающая подсказка */}
      {showHelpTip && hideInterface && (
        <div className="help-tip">
          <p>Нажмите на кнопку "Меню" чтобы вернуть панель управления</p>
          <div className="help-tip-arrow"></div>
        </div>
      )}

      <MapContainer 
        center={[lat, lng]} 
        zoom={zoom} 
        className="mobile-map"
        zoomControl={false}
        attributionControl={false}
        preferCanvas={true}
      >
        <TileLayer
          url={basemapsDict[basemap]}
          attribution=""
        />
        <ZoomControl position="bottomright" />
        
        {/* Отрисовка полигонов полей */}
        {!isLoading && renderPolygons()}
        
        {/* Индикатор загрузки поверх карты */}
        {isLoading && (
          <div className="map-loading-overlay">
            <div className="loading-spinner"></div>
            <div className="loading-text">Загрузка данных...</div>
          </div>
        )}
      </MapContainer>
    </div>
  );
};

export default MobileMap; 