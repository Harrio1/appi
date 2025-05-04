import React, { useState, useEffect, useRef } from "react";
import L from 'leaflet';
import { MapContainer, TileLayer, ZoomControl, Polygon, Tooltip } from "react-leaflet";
// Используем новые сервисы для оффлайн режима
import ApiService from '../utils/apiService';
import '../css/MobileMap.css';

// указываем путь к файлам marker
L.Icon.Default.imagePath = "https://unpkg.com/leaflet@1.9.4/dist/images/";

// Добавляем логирование для отладки
console.log('MobileMap инициализирован');

const MobileMap = () => {
  // Добавляем ref для отслеживания, смонтирован ли компонент
  const isMounted = useRef(true);
  
  // Фиксированные координаты для центра карты (вместо геолокации)
  const [lat, setLat] = useState(46.536032);
  const [lng, setLng] = useState(41.031736);
  const [zoom, setZoom] = useState(10);
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
    
    // Функция очистки при размонтировании компонента
    return () => {
      isMounted.current = false;
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
      
      console.log('Получены данные полей:', data);
      
      // Проверяем и преобразуем координаты для корректного отображения
      const processedPolygons = data.map(field => {
        let coordinates = field.coordinates;
        
        // Если координаты не в правильном формате, преобразуем их
        if (coordinates && !Array.isArray(coordinates[0][0])) {
          coordinates = [coordinates];
        }
        
        return {
          ...field,
          coordinates: coordinates
        };
      });
      
      console.log('Обработанные полигоны:', processedPolygons);
      
      if (isMounted.current) {
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
      const data = await ApiService.fetchFieldsForSeason(seasonId, isOfflineMode);
      
      // Обработка данных полей
      const processedPolygons = data.map(field => {
        let coordinates = field.coordinates;
        if (coordinates && !Array.isArray(coordinates[0][0])) {
          coordinates = [coordinates];
        }
        return {
          ...field,
          coordinates: coordinates
        };
      });
      
      if (isMounted.current) {
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
    setSelectedCropType(e.target.value);
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

  const renderCropOptions = () => {
    // Создаем опции из уникальных типов культур
    const uniqueTypes = [...new Set(crops.map(crop => crop.name))];
    return uniqueTypes.map(type => (
      <option key={type} value={type}>
        {type}
      </option>
    ));
  };

  // Функция для отображения полигонов полей с оптимизацией для большого количества
  const renderPolygons = () => {
    // Если нет данных полигонов, показываем сообщение
    if (filteredPolygons.length === 0) {
      console.log('Нет полигонов для отображения');
      return (
        <div className="no-polygons-message">
          <p>Нет данных для отображения</p>
        </div>
      );
    }

    console.log(`Отображаем ${filteredPolygons.length} полигонов`);

    // Ограничиваем количество отображаемых полигонов для лучшей производительности
    const maxDisplayedPolygons = 500;
    const polygonsToRender = filteredPolygons.slice(0, maxDisplayedPolygons);

    return polygonsToRender.map((polygon) => {
      // Проверяем наличие координат и выводим отладочную информацию
      console.log('Полигон ID:', polygon.id, 'Координаты:', polygon.coordinates);

      // Получаем первый набор координат (первый полигон)
      let coordinates = [];
      
      try {
        if (polygon.coordinates && polygon.coordinates.length > 0) {
          // Проверяем различные форматы координат
          if (Array.isArray(polygon.coordinates[0]) && Array.isArray(polygon.coordinates[0][0])) {
            // Формат [[[lon, lat], [lon, lat], ...]]
            coordinates = polygon.coordinates[0].map(coord => {
              // Проверяем и исправляем возможные проблемы с координатами
              if (coord && coord.length >= 2) {
                // Нормализуем координаты в правильном порядке [lat, lon]
                const lat = typeof coord[1] === 'number' ? coord[1] : parseFloat(coord[1]);
                const lon = typeof coord[0] === 'number' ? coord[0] : parseFloat(coord[0]);
                
                // Проверяем, что координаты - валидные числа
                if (!isNaN(lat) && !isNaN(lon)) {
                  return [lat, lon];
                }
              }
              return null;
            }).filter(coord => coord !== null);
          } else if (Array.isArray(polygon.coordinates)) {
            // Пробуем обработать формат [[lon, lat], [lon, lat], ...] или другие варианты
            coordinates = polygon.coordinates.map(coord => {
              if (Array.isArray(coord) && coord.length >= 2) {
                const lat = typeof coord[1] === 'number' ? coord[1] : parseFloat(coord[1]);
                const lon = typeof coord[0] === 'number' ? coord[0] : parseFloat(coord[0]);
                
                if (!isNaN(lat) && !isNaN(lon)) {
                  return [lat, lon];
                }
              }
              return null;
            }).filter(coord => coord !== null);
          }
        }
      } catch (error) {
        console.error('Ошибка при обработке координат полигона:', error);
      }

      console.log('Обработанные координаты:', coordinates);

      // Если координат нет или они некорректны, пропускаем этот полигон
      if (!coordinates || coordinates.length === 0) {
        console.warn('Пропускаем полигон с ID:', polygon.id, '- нет координат');
        return null;
      }

      // Полигон должен иметь минимум 3 точки
      if (coordinates.length < 3) {
        console.warn('Пропускаем полигон с ID:', polygon.id, '- недостаточно точек:', coordinates.length);
        return null;
      }

      // Цвет в зависимости от типа культуры
      const getColor = () => {
        switch(polygon.field_type) {
          case 'Пшеница': return 'yellow';
          case 'Кукуруза': return 'orange';
          case 'Подсолнечник': return 'gold';
          case 'Соя': return 'green';
          case 'Рапс': return 'blue';
          default: return 'red'; // Делаем красным по умолчанию для лучшей видимости
        }
      };

      // Устанавливаем более заметный стиль для полигонов
      return (
        <Polygon 
          key={polygon.id} 
          positions={coordinates}
          pathOptions={{ 
            fillColor: getColor(),
            weight: 3,
            opacity: 1,
            color: 'white',
            fillOpacity: 0.8
          }}
        >
          <Tooltip sticky>
            <div>
              <strong>{polygon.name || 'Без названия'}</strong><br/>
              Культура: {polygon.field_type || 'Неизвестно'}<br/>
              Площадь: {polygon.area ? polygon.area.toFixed(2) + ' га' : 'Не указана'}
            </div>
          </Tooltip>
        </Polygon>
      );
    });
  };

  return (
    <div className="mobile-map-container">
      {!hideInterface && (
        <div className="mobile-controls">
          <div className="mobile-header">
            <h1>АгроМоб</h1>
            <button 
              className="toggle-interface-btn" 
              onClick={toggleInterface}
              title="Скрыть интерфейс"
            >
              &times;
            </button>
          </div>
          
          <div className="offline-info">
            <div className={`connection-status ${isOfflineMode ? 'offline' : 'online'}`}>
              {isOfflineMode ? 'Оффлайн режим' : 'Онлайн режим'}
            </div>
            <button 
              className={`toggle-offline-btn ${isOfflineMode ? 'offline' : 'online'}`} 
              onClick={toggleOfflineMode}
            >
              {isOfflineMode ? 'Перейти в онлайн' : 'Перейти в оффлайн'}
            </button>
            <div className="last-sync">
              Последняя синхронизация: {lastSyncTime}
            </div>
          </div>
          
          <div className="filters">
            <div className="filter-group">
              <label>Сезон:</label>
              <select 
                className="season-select" 
                onChange={handleSeasonChange}
                value={currentSeasonId || ''}
              >
                <option value="">Все поля</option>
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
                <option value="">Все культуры</option>
                {renderCropOptions()}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Поиск поля:</label>
              <input 
                type="text" 
                className="search-input"
                placeholder="Название поля..." 
                onChange={handleSearchChange}
              />
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