import React, { useState, useEffect, useRef } from "react";
import L from 'leaflet';
import { Map, TileLayer, Marker, Popup, ZoomControl, Polygon, Tooltip } from "react-leaflet";
import axios from 'axios';
// Используем универсальную конфигурацию API
import API_URL, { handleRateLimitedRequest } from '../utils/apiConfig';
import '../css/MobileMap.css';

// указываем путь к файлам marker
L.Icon.Default.imagePath = "https://unpkg.com/leaflet@1.5.0/dist/images/";

// Добавляем логирование для отладки
console.log('MobileMap инициализирован с API_URL:', API_URL);
console.log('Режим мобильного приложения:', process.env.REACT_APP_MOBILE_MODE);
console.log('Порт API:', process.env.REACT_APP_API_PORT);

const MobileMap = () => {
  // Добавляем ref для отслеживания, смонтирован ли компонент
  const isMounted = useRef(true);
  
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

  useEffect(() => {
    // Устанавливаем флаг монтирования
    isMounted.current = true;
    
    // Определяем геолокацию пользователя
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (isMounted.current) {
            setLat(position.coords.latitude);
            setLng(position.coords.longitude);
          }
        },
        (error) => {
          console.error('Ошибка получения геолокации:', error);
        }
      );
    }

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

  const loadSeasons = async () => {
    try {
      const response = await handleRateLimitedRequest(
        () => axios.get(`${API_URL}/seasons`),
        'get-seasons'
      );
      if (isMounted.current) {
        setSeasons(response.data);
      }
    } catch (error) {
      console.error('Ошибка при загрузке сезонов:', error);
      if (isMounted.current) {
        alert('Не удалось загрузить сезоны');
      }
    }
  };

  const loadCrops = async () => {
    try {
      const response = await handleRateLimitedRequest(
        () => axios.get(`${API_URL}/seeds`),
        'get-seeds'
      );
      if (isMounted.current) {
        setCrops(response.data);
      }
    } catch (error) {
      console.error('Ошибка при загрузке культур:', error);
    }
  };

  const loadFields = async () => {
    if (isMounted.current) {
      setIsLoading(true);
    }
    try {
      const response = await handleRateLimitedRequest(
        () => axios.get(`${API_URL}/fields`),
        'get-fields'
      );
      
      // Проверяем и преобразуем координаты для корректного отображения
      const processedPolygons = response.data.map(field => {
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
      
      if (isMounted.current) {
        setPolygons(processedPolygons);
        setFilteredPolygons(processedPolygons);
      }
    } catch (error) {
      console.error('Ошибка при загрузке полей:', error);
      if (isMounted.current && error.response && error.response.status === 429) {
        alert('Превышен лимит запросов. Попробуйте снова через несколько секунд.');
      } else if (isMounted.current) {
        alert('Не удалось загрузить данные полей');
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
      const response = await handleRateLimitedRequest(
        () => axios.get(`${API_URL}/seasons/${seasonId}/fields`),
        `get-season-fields-${seasonId}`
      );
      
      // Проверяем, что данные существуют и являются массивом
      if (!response.data) {
        console.error('Нет данных в ответе API');
        if (isMounted.current) {
          setPolygons([]);
          setFilteredPolygons([]);
          setIsLoading(false);
        }
        return;
      }
      
      const fieldsData = Array.isArray(response.data) ? response.data : [];
      console.log('Получены данные полей для сезона:', fieldsData);

      if (fieldsData.length === 0) {
        console.warn('Нет полей для выбранного сезона');
      }

      // Получаем все поля
      console.log('Загружаем все поля');
      const allFieldsResponse = await handleRateLimitedRequest(
        () => axios.get(`${API_URL}/fields`),
        'get-all-fields'
      );
      
      if (!Array.isArray(allFieldsResponse.data)) {
        console.error('Получены некорректные данные всех полей');
        if (isMounted.current) {
          setPolygons([]);
          setFilteredPolygons([]);
          setIsLoading(false);
        }
        return;
      }
      
      const allFields = allFieldsResponse.data;

      const updatedPolygons = allFields.map(field => {
        const seasonField = fieldsData.find(f => f.id === field.id);
        
        // Проверяем и преобразуем координаты
        let coordinates = field.coordinates;
        if (coordinates && !Array.isArray(coordinates[0][0])) {
          coordinates = [coordinates];
        }
        
        return {
          id: field.id,
          coordinates: coordinates,
          field_type: seasonField ? seasonField.seed_name : field.field_type || 'Неизвестно',
          color: seasonField ? seasonField.seed_color : 'red',
          name: field.name || 'Без названия',
          area: field.area || 0
        };
      });

      if (isMounted.current) {
        setPolygons(updatedPolygons);
        filterPolygons(updatedPolygons);
      }
    } catch (error) {
      console.error('Ошибка при загрузке данных полей:', error);
      if (isMounted.current && error.response && error.response.status === 429) {
        alert('Превышен лимит запросов. Попробуйте снова через несколько секунд.');
      } else if (isMounted.current) {
        alert('Ошибка при загрузке данных: ' + error.message);
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
    // Запрещаем выбор культуры, если сезон не выбран
    if (!currentSeasonId) {
      return;
    }
    if (isMounted.current) {
      setSelectedCropType(e.target.value);
    }
  };

  const toggleInterface = () => {
    if (isMounted.current) {
      setHideInterface(!hideInterface);
    }
  };

  const changeBasemap = (newBasemap) => {
    if (isMounted.current) {
      setBasemap(newBasemap);
    }
  };

  // Функция для создания HTML-контента с цветовым индикатором для option
  const renderCropOptions = () => {
    return crops.map(crop => (
      <option 
        key={crop.id} 
        value={crop.name}
        style={{ backgroundColor: crop.color || 'transparent' }}
        className="crop-option"
      >
        {crop.name}
      </option>
    ));
  };

  // Если компонент размонтирован, не рендерим ничего
  if (!isMounted.current) {
    return null;
  }

  return (
    <div className={`mobile-map-container ${hideInterface ? 'fullscreen-mode' : ''}`}>
      {!hideInterface && (
        <div className="mobile-controls">
          
          <div className="mobile-season-selector">
            <select 
              onChange={handleSeasonChange} 
              value={currentSeasonId || ''} 
              className="mobile-select"
              title="Выберите сезон"
            >
              <option value="">Выберите сезон</option>
              {seasons.length > 0 && seasons.map((season) => (
                <option key={season.id} value={season.id}>{season.name}</option>
              ))}
            </select>
          </div>
 
          <div className="mobile-crop-type-selector">
            <div className="select-with-colors">
              <select 
                onChange={handleCropTypeChange}
                value={selectedCropType}
                className={`mobile-select ${!currentSeasonId ? 'disabled' : ''}`}
                title={currentSeasonId ? "Выберите тип культуры" : "Сначала выберите сезон"}
                disabled={!currentSeasonId}
              >
                <option value="">Все культуры</option>
                {renderCropOptions()}
              </select>
              {selectedCropType && (
                <span 
                  className="selected-crop-color"
                  style={{ 
                    backgroundColor: crops.find(c => c.name === selectedCropType)?.color || 'red'
                  }}
                ></span>
              )}
            </div>
          </div>
        </div>
      )}
      
      {isLoading ? (
        <div className="mobile-loading">
          <div className="mobile-spinner"></div>
          <p>Загрузка данных...</p>
        </div>
      ) : (
        <Map
          zoomControl={hideInterface ? false : true}
          zoom={zoom}
          center={[lat, lng]}
          minZoom={8}
          maxZoom={18}
          className="mobile-map"
          attributionControl={false}
        >
          {!hideInterface && <ZoomControl position={'bottomright'} />}
          <TileLayer url={basemapsDict[basemap]} />
          
          {filteredPolygons.map(polygon => {
            if (!polygon.coordinates || polygon.coordinates.length === 0) {
              return null;
            }
            
            const fillColor = polygon.color || 'red';
            const fieldType = polygon.field_type || 'Неизвестно';
            
            // Проверяем, выбрана ли эта культура в выпадающем списке
            const isSelectedType = selectedCropType && fieldType === selectedCropType;

            return (
              <Polygon
                key={polygon.id}
                positions={polygon.coordinates}
                color={isSelectedType ? 'blue' : 'red'}
                fillColor={fieldType === 'Неизвестно' ? 'transparent' : fillColor}
                fillOpacity={fieldType === 'Неизвестно' ? 0 : (isSelectedType ? 0.6 : 0.3)}
                name={polygon.name}
              >
                <Tooltip permanent direction="center" className="mobile-polygon-tooltip">
                  <span>{polygon.name}</span>
                </Tooltip>
                <Popup className="mobile-polygon-popup">
                  <div>
                    <p>Имя поля: {polygon.name}</p>
                    <p>Тип поля: {polygon.field_type || 'Неизвестно'}</p>
                    <p>Площадь: {polygon.area || 'Неизвестно'} кв.м</p>
                  </div>
                </Popup>
              </Polygon>
            );
          })}
        </Map>
      )}
      
      <div className="interface-toggle-container">
        <button 
          className={`interface-toggle-button ${hideInterface ? 'show-interface' : 'hide-interface'}`}
          onClick={toggleInterface}
        >
          <div className="toggle-icon">
            <span className="toggle-line"></span>
            <span className="toggle-line"></span>
            <span className="toggle-line"></span>
          </div>
          <span className="toggle-text">{hideInterface ? "Показать панель" : "Скрыть панель"}</span>
        </button>
      </div>
      
      {!hideInterface && (
        <div className="mobile-basemap-selector">
          <button onClick={() => changeBasemap('osm')} className={basemap === 'osm' ? 'active' : ''}>OSM</button>
          <button onClick={() => changeBasemap('hot')} className={basemap === 'hot' ? 'active' : ''}>HOT</button>
          <button onClick={() => changeBasemap('dark')} className={basemap === 'dark' ? 'active' : ''}>DARK</button>
          <button onClick={() => changeBasemap('mapbox')} className={basemap === 'mapbox' ? 'active' : ''}>MAPBOX</button>
        </div>
      )}
    </div>
  );
};

export default MobileMap;