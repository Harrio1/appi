import React, { Component } from "react";
import L from 'leaflet';
import { Map, TileLayer, Marker, Popup, ZoomControl, Polygon, Polyline, Tooltip } from "react-leaflet";
import '../css/Map.css';
import { connect } from "react-redux";
import axios from 'axios';
import * as turf from '@turf/turf'; // Импортируем turf
import Sidebar from './Sidebar'; // Импортируем новый компонент
import API_URL, { fetchData } from '../utils/apiConfig';
// указываем путь к файлам marker
L.Icon.Default.imagePath = "https://unpkg.com/leaflet@1.5.0/dist/images/";

class MapComponent extends Component {
  _isMounted = false;

  constructor(props) {
    super(props);
    this.state = {
      lat: 46.536032,
      lng: 41.031736,
      zoom: 10,
      basemap: 'mapbox',
      polygons: [],
      inputCoordinates: [],
      creationMode: false,
      selectedPolygonId: null,
      fieldTypes: ['Пшеница', 'Кукуруза', 'Соя', 'Подсолнечник', 'Рапс', 'Ячмень', 'Овес', 'Рис', 'Гречиха'],
      seedNames: {
        'Пшеница': 'Семена Пшеницы',
        'Кукуруза': 'Семена Кукурузы',
        'Соя': 'Семена Сои',
        'Подсолнечник': 'Семена Подсолнечника',
        'Рапс': 'Семена Рапса',
        'Ячмень': 'Семена Ячменя',
        'Овес': 'Семена Овса',
        'Рис': 'Семена Риса',
        'Гречиха': 'Семена Гречихи'
      },
      fieldColors: {
        'Пшеница': 'gold',
        'Кукуруза': 'yellow',
        'Соя': 'green',
        'Подсолнечник': 'orange',
        'Рапс': 'lightgreen',
        'Ячмень': 'beige',
        'Овес': 'lightyellow',
        'Рис': 'lightblue',
        'Гречиха': 'brown'
      },
      selectedFieldTypes: {},
      seasons: [],
      currentSeasonId: null,
      newSeasonName: '',
      filterText: '',
      seeds: [],
      fields: [],
      selectedFieldId: null,
      selectedSeason: '',
      selectedFieldType: '',
      newPolygonName: '',
      searchPolygonName: '',
      showPolygons: true,
      showPolygonForm: true,
      showFieldManagementForm: true,
      isSidebarVisible: true,
      basemapsDict: {
        osm: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        hot: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
        dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        mapbox: "https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}.png"
      },
      selectedCrop: '',
      showCropSelector: false,
      selectedCrops: [],
      filteredPolygons: [],
    };
  }

  componentDidMount() {
    this._isMounted = true;
    this.loadSeeds();
    this.loadPolygons();
    this.loadSeasons();
    this.loadFields();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.currentSeasonId !== this.state.currentSeasonId) {
        console.log('Сезон изменен. Текущий сезон ID:', this.state.currentSeasonId);
        console.log('Текущие полигоны:', this.state.polygons);
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  safeSetState(data, callback) {
    if (this._isMounted) {
      this.setState(data, callback);
    }
  }

  loadSeasons = async () => {
    try {
      console.log('Загружаем сезоны с:', API_URL);
      const response = await fetchData('seasons');
      // Ensure seasons is always an array
      const seasonsData = Array.isArray(response.data) ? response.data : [];
      console.log('Полученные данные сезонов:', seasonsData);
      
      this.safeSetState({ seasons: seasonsData });
    } catch (error) {
      console.error('Ошибка при загрузке сезонов:', error);
      // Set seasons to empty array in case of error
      this.safeSetState({ seasons: [] });
    }
  };

  createNewSeason = async () => {
    try {
      console.log('Отправляемые данные:', {
        name: this.state.newSeasonName,
        seeds: this.state.polygons.map(polygon => ({
          id: polygon.id,
          field_type: this.state.selectedFieldTypes[polygon.id] || 'Пшеница'
        }))
      });

      const response = await axios.post(`${API_URL}/seasons`, {
        name: this.state.newSeasonName,
        seeds: this.state.polygons.map(polygon => ({
          id: polygon.id,
          field_type: this.state.selectedFieldTypes[polygon.id] || 'Пшеница'
        }))
      });

      this.safeSetState(prevState => ({
        seasons: [...prevState.seasons, response.data],
        newSeasonName: '',
        currentSeasonId: response.data.id
      }));
    } catch (error) {
      console.error('Ошибка при создании нового сезона:', error);
      if (error.response && error.response.data) {
        console.log('Детали ошибки:', error.response.data);
        alert(`Ошибка: ${error.response.data.message}`);
      } else {
        alert(`Ошибка: ${error.message}`);
      }
    }
  };

  handleSeasonChange = async (event) => {
    const seasonId = event.target.value;
    console.log('Выбранный сезон ID:', seasonId);

    if (seasonId === '') {
        try {
            const response = await axios.get(`${API_URL}/fields`);
            const fieldsData = response.data;

            if (!fieldsData || !Array.isArray(fieldsData)) {
                throw new Error('Некорректные данные полей');
            }

            const allPolygons = fieldsData.map(field => ({
                id: field.id,
                coordinates: field.coordinates,
                field_type: field.field_type || 'Неизвестно',
                color: field.color || 'red',
                name: field.name || 'Без названия',
                area: field.area || 0
            }));

            console.log('Обновленные полигоны (все поля):', allPolygons);
            this.safeSetState({ currentSeasonId: null, polygons: allPolygons });
        } catch (error) {
            console.error('Ошибка при загрузке всех полей:', error);
            alert('Ошибка при загрузке данных: ' + error.message);
        }
        return;
    }

    try {
        const response = await axios.get(`${API_URL}/seasons/${seasonId}/fields`);
        const fieldsData = response.data;
        console.log('Данные полей для сезона:', fieldsData);

        if (!fieldsData || !Array.isArray(fieldsData)) {
            throw new Error('Некорректные данные полей для сезона');
        }

        // Получаем все поля, включая те, которые не были добавлены в сезон
        const allFieldsResponse = await axios.get(`${API_URL}/fields`);
        const allFields = allFieldsResponse.data;

        const updatedPolygons = allFields.map(field => {
            const seasonField = fieldsData.find(f => f.id === field.id);
            return {
                id: field.id,
                coordinates: field.coordinates,
                field_type: seasonField ? seasonField.seed_name : field.field_type || 'Неизвестно',
                color: seasonField ? seasonField.seed_color : 'red',
                name: field.name || 'Без названия',
                area: field.area || 0
            };
        });

        console.log('Обновленные полигоны (сезон):', updatedPolygons);
        this.safeSetState({ currentSeasonId: seasonId, polygons: updatedPolygons });
    } catch (error) {
        console.error('Ошибка при загрузке данных полей:', error);
        alert('Ошибка при загрузке данных: ' + error.message);
    }
  };

  loadPolygonsFromDatabase = async () => {
    if (!this.state.currentSeasonId) return;

    try {
      const response = await axios.get(`${API_URL}/seasons/${this.state.currentSeasonId}/fields`);
      const polygonsData = response.data;
      console.log('Загруженные данные полигонов:', polygonsData);
      const polygons = polygonsData.map(polygon => ({
        id: polygon.id,
        coordinates: polygon.coordinates,
        color: polygon.color
      }));

      this.safeSetState({ polygons, selectedFieldTypes: {} });
    } catch (error) {
      console.error('Ошибка при загрузке полигонов:', error);
      alert('Ошибка при загрузе данных: ' + error.message);
    }
  };

  handlePolygonNameChange = (event) => {
    this.safeSetState({ newPolygonName: event.target.value });
  };

  calculateArea = (coordinates) => {
    const polygon = turf.polygon([coordinates]);
    const area = turf.area(polygon);
    return area;
  };

  addPolygon = async () => {
    const { inputCoordinates, newPolygonName, polygons, currentSeasonId } = this.state;

    if (!newPolygonName.trim()) {
        alert('Напишите название поля');
        return;
    }

    const isNameTaken = polygons.some(polygon => polygon.name === newPolygonName);
    if (isNameTaken) {
        alert('Имя поля занято');
        return;
    }

    if (inputCoordinates.length >= 4 && inputCoordinates.length <= 9) {
        const coordinates = inputCoordinates.map(coord => {
            const [lat, lng] = coord.split(' ').map(Number);
            return [lat, lng];
        });

        if (coordinates.length > 0 && (coordinates[0][0] !== coordinates[coordinates.length - 1][0] || coordinates[0][1] !== coordinates[coordinates.length - 1][1])) {
            coordinates.push(coordinates[0]);
        }

        const area = this.calculateArea(coordinates);
        const roundedArea = Math.round(area);

        try {
            const response = await axios.post(`${API_URL}/fields`, {
                coordinates: coordinates,
                name: newPolygonName,
                area: roundedArea,
                season_id: currentSeasonId
            });

            if (response.data && response.data.success) {
                const addedPolygon = {
                    id: response.data.field.id,
                    coordinates: coordinates,
                    color: 'red',
                    name: response.data.field.name,
                    area: response.data.field.area
                };

                if (this._isMounted) {
                    this.setState(prevState => ({
                        polygons: [...prevState.polygons, addedPolygon],
                        inputCoordinates: [],
                        newPolygonName: ''
                    }));
                }

                this.loadFields();
            } else {
                alert('Ошибка при сохранении полигона');
            }
        } catch (error) {
            console.error('Ошибка при добавлении полигона:', error);
            alert(`Ошибка: ${error.message}`);
        }
    } else {
        alert("Введите от 4 до 9 координат в формате 'lat lng', разделенные запятыми.");
    }
  };

  toggleCreationMode = () => {
    this.safeSetState(prevState => ({
      creationMode: !prevState.creationMode
    }));
  };

  removeLastPolygon = () => {
    this.safeSetState(prevState => ({
      polygons: prevState.polygons.slice(0, -1)
    }));
  };

  handleMapClick = (e) => {
    if (!this.state.creationMode) return;

    const { lat, lng } = e.latlng;
    const newCoordinates = [...this.state.inputCoordinates, `${lat} ${lng}`];
    this.safeSetState({
      inputCoordinates: newCoordinates
    });
  };

  selectPolygon = (id) => {
    this.safeSetState({ selectedPolygonId: id });
  };

  removeSelectedPolygon = () => {
    this.safeSetState(prevState => ({
      polygons: prevState.polygons.filter(polygon => polygon.id !== prevState.selectedPolygonId),
      selectedPolygonId: null
    }));
  };

  clearMarkers = () => {
    this.safeSetState({ inputCoordinates: [] });
  };

  calculatePolygonCenter(coordinates) {
    const latSum = coordinates.reduce((sum, coord) => sum + coord[0], 0);
    const lngSum = coordinates.reduce((sum, coord) => sum + coord[1], 0);
    return [latSum / coordinates.length, lngSum / coordinates.length];
  }

  handleFieldTypeChange = (polygonId, event) => {
    const selectedFieldType = event.target.value;
    this.safeSetState(prevState => ({
      selectedFieldTypes: {
        ...prevState.selectedFieldTypes,
        [polygonId]: selectedFieldType
      }
    }));

    // Обновляем цвет поля в зависимости от выбранной культуры
    const selectedFieldColor = this.state.fieldColors[selectedFieldType] || 'red';
    if (!this.state.fieldColors[selectedFieldType]) {
      console.error('Цвет для выбранной культуры не найден');
      alert('Цвет для выбранной культуры не найден');
    }
    this.safeSetState(prevState => ({
      polygons: prevState.polygons.map(polygon => 
        polygon.id === polygonId ? { ...polygon, color: selectedFieldColor } : polygon
      )
    }));
  };

  loadSeeds = async () => {
    try {
      console.log('Загружаем семена с:', API_URL);
      const response = await fetchData('seeds');
      const seeds = Array.isArray(response.data) ? response.data : [];
      
      console.log('Получены данные о семенах:', seeds);
      
      if (seeds.length > 0) {
        const fieldTypes = seeds.map(seed => seed.name);
        const fieldColors = seeds.reduce((acc, seed) => {
          acc[seed.name] = seed.color || 'red';
          return acc;
        }, {});
        
        this.safeSetState({ seeds, fieldTypes, fieldColors });
      } else {
        console.warn('Нет данных о семенах или получен некорректный формат');
        this.safeSetState({ seeds: [] });
      }
    } catch (error) {
      console.error('Ошибка при загрузке семян:', error);
    }
  };

  handleSeedChange = (event) => {
    const seedId = event.target.value;
    console.log('Выбранный семя ID:', seedId);
    this.safeSetState({ currentSeedId: seedId }, this.loadPolygonsFromDatabase);
  };

  editField = async (fieldId) => {
    const field = this.state.fields.find(f => f.id === fieldId);
    if (!field) return;

    this.safeSetState({
      editFieldId: field.id,
      newFieldName: field.name,
      newFieldCoordinates: field.coordinates,
      newFieldArea: field.area.toString()
    });
  };

  updateField = async () => {
    const { editFieldId, newFieldName, newFieldCoordinates, newFieldArea } = this.state;
    if (!editFieldId || !newFieldName || !newFieldCoordinates || !newFieldArea) {
      alert('Пожалуйста, заполните все поля.');
      return;
    }

    try {
      const response = await axios.put(`${API_URL}/fields/${editFieldId}`, {
        name: newFieldName,
        coordinates: newFieldCoordinates,
        area: parseFloat(newFieldArea)
      });

      this.safeSetState(prevState => ({
        fields: prevState.fields.map(field =>
          field.id === editFieldId ? response.data.field : field
        ),
        editFieldId: null,
        newFieldName: '',
        newFieldCoordinates: '',
        newFieldArea: ''
      }));

      alert('Поле успешно обновлено!');
    } catch (error) {
      console.error('Ошибка при обновлении поля:', error);
      alert('Ошибка при обновлении поля: ' + error.message);
    }
  };

  handleFilterChange = (e) => {
    const { name, value } = e.target;
    this.safeSetState({ [name]: value }, this.filterFields);
  };

  filterFields = () => {
    const { fields, selectedSeasonId, selectedSeedId } = this.state;
    const filteredFields = fields.filter(field => {
      const binding = field.bindings.find(b => b.season_id === selectedSeasonId && b.seed_id === selectedSeedId);
      return binding !== undefined;
    });
    this.safeSetState({ filteredFields });
  };

  getFilteredFields = () => {
    const { fields, filterText } = this.state;
    return fields.filter(field => field.name.toLowerCase().includes(filterText.toLowerCase()));
  };

  loadAllPolygons = async () => {
    try {
      const response = await axios.get(`${API_URL}/fields`);
      const polygonsData = response.data;
      console.log('Загруженные данные полигонов:', polygonsData);

      const polygons = polygonsData.map(polygon => {
        const coordinatesArray = polygon.coordinates.map(coord => [coord[0], coord[1]]);
        return {
          id: polygon.id,
          coordinates: coordinatesArray,
          color: polygon.color || 'red',
          name: polygon.name,
          area: polygon.area
        };
      });

      this.safeSetState({ polygons });
    } catch (error) {
      console.error('Ошибка при загрузке полигонов:', error);
      alert('Ошибка при загрузке данных: ' + error.message);
    }
  };

  handleFieldSelection = (event) => {
    this.safeSetState({ selectedFieldId: event.target.value });
  };

  handleSeasonInputChange = (event) => {
    this.safeSetState({ selectedSeason: event.target.value });
  };

  handleFieldTypeSelection = (event) => {
    const selectedFieldType = event.target.value;
    const selectedFieldId = this.state.selectedFieldId;

    if (!selectedFieldId) {
      alert('Пожалуйста, выберите поле');
      return;
    }

    console.log('Выбранный тип поля:', selectedFieldType);
    console.log('ID выбранного поля:', selectedFieldId);

    // Обновляем тип и цвет выбранного поля
    this.safeSetState(prevState => ({
      polygons: prevState.polygons.map(polygon => 
        polygon.id === selectedFieldId ? { 
          ...polygon, 
          field_type: selectedFieldType,
          color: this.state.fieldColors[selectedFieldType] || 'red'
        } : polygon
      ),
      selectedFieldType
    }));
  };

  saveProperty = async () => {
    const { selectedFieldId, selectedSeason, selectedFieldType, fieldColors } = this.state;

    if (!selectedFieldId || !selectedSeason || !selectedFieldType) {
      alert('Пожалуйста, заполните все обязательные поля.');
      return;
    }

    try {
      console.log('Попытка сохранения данных:', { selectedFieldId, selectedSeason, selectedFieldType });

      // Получаем все семена по названию культуры
      const seedResponse = await axios.get(`${API_URL}/seeds?name=${selectedFieldType}`);
      if (!seedResponse.data || seedResponse.data.length === 0) {
        throw new Error(`Культура "${selectedFieldType}" не найдена`);
      }

      // Используем первое семя с совпадающим названием
      const matchingSeed = seedResponse.data.find(seed => seed.name === selectedFieldType);
      if (!matchingSeed) {
        throw new Error(`Семя для культуры "${selectedFieldType}" не найдено`);
      }

      const seedId = matchingSeed.id;

      // Получаем цвет для выбранной культуры
      const seedColor = fieldColors[selectedFieldType] || 'red';

      const dataToSend = {
        field_id: selectedFieldId,
        season_name: selectedSeason,
        seed_id: seedId,
        seed_color: seedColor
      };

      console.log('Отправляемые данные:', dataToSend);

      const response = await axios.post(`${API_URL}/fields/properties`, dataToSend);
      console.log('Ответ сервера:', response.data);

      if (response.data && response.data.success) {
        alert('Данные успешно сохранены!');
        // Обновляем состояние, если необходимо
        this.safeSetState({
          selectedFieldId: null,
          selectedSeason: '',
          selectedFieldType: ''
        });
      } else {
        throw new Error('Сервер вернул неуспешный ответ');
      }
    } catch (error) {
      console.error('Ошибка при сохранении данных:', error);
      if (error.response) {
        console.error('Детали ошибки:', error.response.data);
        alert(`Ошибка: ${error.response.data.error || error.response.data.message}`);
      } else {
        alert('Ошибка при сохранении данных: ' + error.message);
      }
    }
  };

  handleSearchNameChange = (event) => {
    this.safeSetState({ searchPolygonName: event.target.value });
  };

  searchPolygonsByName = async () => {
    const { searchPolygonName } = this.state;

    if (!searchPolygonName.trim()) {
      alert('Введите название для поиска');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/fields/by-name`, { name: searchPolygonName });
      const polygonsData = response.data;
      console.log('Найденные полигоны:', polygonsData);

      this.safeSetState({ polygons: polygonsData });
    } catch (error) {
      console.error('Ошибка при поиске полигонов:', error);
      alert('Ошибка при поиске полигонов: ' + error.message);
    }
  };

  handleMarkerDoubleClick = (index) => {
    this.safeSetState(prevState => {
      const newCoordinates = prevState.inputCoordinates.filter((_, i) => i !== index);
      return { inputCoordinates: newCoordinates };
    });
  };

  handleMarkerDragEnd = (e, index) => {
    const { lat, lng } = e.target.getLatLng();
    this.safeSetState(prevState => {
      const newCoordinates = [...prevState.inputCoordinates];
      newCoordinates[index] = `${lat} ${lng}`;
      return { inputCoordinates: newCoordinates };
    });
  };

  handleInputChange = (event) => {
    const inputValue = event.target.value;
    const coordinates = inputValue.split(',').map(coord => coord.trim());
    this.safeSetState({ inputCoordinates: coordinates });
  };

  loadFields = async () => {
    try {
      const fieldsResponse = await fetchData('fields');
      const fields = fieldsResponse.data;
      this.safeSetState({ fields });
    } catch (error) {
      console.error('Ошибка при загрузке полей:', error);
    }
  };

  handleSeasonCreated = async (newSeason) => {
    try {
        const response = await axios.post(`${API_URL}/seasons`, {
            name: newSeason.name
        });

        if (response.data && response.data.id) {
            this.safeSetState(prevState => ({
                seasons: [...prevState.seasons, response.data],
                currentSeasonId: response.data.id,
                newSeasonName: ''
            }));
            alert('Сезон успешно создан!');
            console.log('Ответ сервера:', response.data);
        } else {
            throw new Error('Не удалось получить данные созданного сезона');
        }
    } catch (error) {
        console.error('Ошибка при создании нового сезона:', error);
        alert('Ошибка при создании нового сезона: ' + error.message);
    }
  };

  deleteField = async (fieldId) => {
    try {
      await axios.delete(`${API_URL}/fields/${fieldId}`);
      this.safeSetState(prevState => ({
        fields: prevState.fields.filter(field => field.id !== fieldId)
      }));
      alert('Поле успешно удалено!');
    } catch (error) {
      console.error('Ошибка при удалении поля:', error);
      alert('Ошибка при удалении поля: ' + error.message);
    }
  };

  togglePolygonForm = () => {
    this.safeSetState(prevState => ({
      showPolygonForm: !prevState.showPolygonForm
    }));
  };

  toggleFieldManagementForm = () => {
    this.safeSetState(prevState => ({
      showFieldManagementForm: !prevState.showFieldManagementForm
    }));
  };

  toggleSidebar = () => {
    this.safeSetState(prevState => ({
      isSidebarVisible: !prevState.isSidebarVisible
    }));
  };

  addNewFieldType = async (name, color) => {
    try {
        // Создаем семя
        const seedResponse = await axios.post(`${API_URL}/seeds`, { name });
        const seedId = seedResponse.data.id;

        // Создаем цвет для семени
        await axios.post(`${API_URL}/seed-colors`, { seed_id: seedId, color });

        console.log('Культура и цвет успешно созданы:', { name, color });

        // Обновляем список культур
        this.safeSetState(prevState => ({
            fieldTypes: [...prevState.fieldTypes, name],
            fieldColors: {
                ...prevState.fieldColors,
                [name]: color
            }
        }));
    } catch (error) {
        console.error('Ошибка при создании культуры:', error);
        alert('Ошибка при создании культуры: ' + error.message);
    }
  };

  loadPolygons = async () => {
    try {
      console.log('Загружаем полигоны с:', API_URL);
      const fieldsResponse = await fetchData('fields');
      const polygonsData = fieldsResponse.data;
      
      if (!Array.isArray(polygonsData)) {
        console.error('Данные полигонов не являются массивом:', polygonsData);
        return;
      }
      
      // Process and format polygons data
      const polygons = polygonsData.map(polygon => {
        let coordinates;
        
        if (polygon.coordinates) {
          // Handle potential nesting differences in coordinates
          if (Array.isArray(polygon.coordinates[0]) && typeof polygon.coordinates[0][0] === 'number') {
            // Format is [[lat, lng], [lat, lng], ...]
            coordinates = polygon.coordinates;
          } else if (Array.isArray(polygon.coordinates[0]) && Array.isArray(polygon.coordinates[0][0])) {
            // Format is [[[lat, lng], [lat, lng], ...]]
            coordinates = polygon.coordinates[0];
          } else {
            console.error('Неизвестный формат координат:', polygon.coordinates);
            coordinates = [];
          }
        } else {
          coordinates = [];
        }
        
        return {
          id: polygon.id,
          coordinates: coordinates,
          color: polygon.color || 'red',
          name: polygon.name || 'Без названия',
          field_type: polygon.field_type || 'Неизвестно',
          area: polygon.area || 0
        };
      });
      
      this.safeSetState({ polygons, filteredPolygons: polygons });
    } catch (error) {
      console.error('Ошибка при загрузке полигонов:', error);
    }
  };

  handleCropChange = (event) => {
    const crop = event.target.value;
    this.safeSetState({ selectedCrop: crop }, this.filterPolygonsByCrop);
  };

  filterPolygonsByCrop = () => {
    const { selectedCrop, polygons } = this.state;
    
    if (!selectedCrop) {
      this.safeSetState({ filteredPolygons: polygons });
      return;
    }

    const filtered = polygons.filter(polygon => 
      polygon.field_type === selectedCrop
    );

    this.safeSetState({ filteredPolygons: filtered });
  };

  toggleCropSelector = () => {
    if (!this.state.currentSeasonId) {
      alert('Пожалуйста, сначала выберите сезон');
      return;
    }
    this.safeSetState(prevState => ({
      showCropSelector: !prevState.showCropSelector
    }));
  };

  handleCropSelection = (crop) => {
    if (!this.state.currentSeasonId) {
      alert('Пожалуйста, сначала выберите сезон');
      return;
    }

    // Получаем список культур в текущем сезоне
    const cropsInSeason = this.state.polygons
      .map(polygon => polygon.field_type)
      .filter((value, index, self) => self.indexOf(value) === index);

    // Проверяем, есть ли выбранная культура в текущем сезоне
    if (!cropsInSeason.includes(crop)) {
      alert(`Культура "${crop}" отсутствует в текущем сезоне`);
      return;
    }

    // Добавляем/убираем культуру из списка выбранных
    this.safeSetState(prevState => ({
      selectedCrops: prevState.selectedCrops.includes(crop)
        ? prevState.selectedCrops.filter(c => c !== crop)
        : [...prevState.selectedCrops, crop]
    }), this.filterPolygonsByCrops);
  };

  filterPolygonsByCrops = () => {
    const { selectedCrops, polygons } = this.state;

    // Если не выбраны культуры, показываем все полигоны
    if (selectedCrops.length === 0) {
      this.safeSetState({ filteredPolygons: polygons });
      return;
    }

    // Создаем новый массив полигонов с добавлением информации о выделении
    const filtered = polygons.map(polygon => ({
      ...polygon,
      highlighted: selectedCrops.includes(polygon.field_type)
    }));

    this.safeSetState({ filteredPolygons: filtered });
  };

  render() {
    const center = [this.state.lat, this.state.lng];
    const basemapUrl = this.state.basemapsDict[this.state.basemap];

    if (!basemapUrl) {
      console.error('Basemap URL is undefined');
      return null;
    }

    const polylineCoordinates = this.state.inputCoordinates.map(coord => {
      const [lat, lng] = coord.split(' ').map(Number);
      return !isNaN(lat) && !isNaN(lng) ? [lat, lng] : null;
    }).filter(coord => coord !== null);

    if (polylineCoordinates.length > 1 && (polylineCoordinates[0][0] !== polylineCoordinates[polylineCoordinates.length - 1][0] || polylineCoordinates[0][1] !== polylineCoordinates[polylineCoordinates.length - 1][1])) {
      polylineCoordinates.push(polylineCoordinates[0]);
    }

    const { fieldTypes, showCropSelector, selectedCrops } = this.state;

    // Проверяем polygons на тип массива
    if (!Array.isArray(this.state.polygons)) {
      console.error('this.state.polygons не является массивом:', this.state.polygons);
      this.setState({ polygons: [] });
      return null;
    }
    
    // Проверяем filteredPolygons на тип массива
    if (!Array.isArray(this.state.filteredPolygons)) {
      console.error('this.state.filteredPolygons не является массивом:', this.state.filteredPolygons);
      this.setState({ filteredPolygons: [] });
      return null;
    }

    const polygonsToDisplay = this.state.selectedCrops.length > 0
      ? this.state.filteredPolygons
      : this.state.polygons;

    // Дополнительная проверка для polygonsToDisplay
    if (!Array.isArray(polygonsToDisplay)) {
      console.error('polygonsToDisplay не является массивом:', polygonsToDisplay);
      return null;
    }

    return (
      <div className="map-container">
        <Sidebar
          inputCoordinates={this.state.inputCoordinates}
          newPolygonName={this.state.newPolygonName}
          handleInputChange={this.handleInputChange}
          handlePolygonNameChange={this.handlePolygonNameChange}
          addPolygon={this.addPolygon}
          clearMarkers={this.clearMarkers}
          toggleCreationMode={this.toggleCreationMode}
          creationMode={this.state.creationMode}
          showPolygons={this.state.showPolygons}
          setShowPolygons={(show) => this.safeSetState({ showPolygons: show })}
          fields={this.state.fields}
          handleFieldSelection={this.handleFieldSelection}
          selectedFieldId={this.state.selectedFieldId}
          handleSeasonInputChange={this.handleSeasonInputChange}
          selectedSeason={this.state.selectedSeason}
          seasons={this.state.seasons}
          handleFieldTypeSelection={this.handleFieldTypeSelection}
          selectedFieldType={this.state.selectedFieldType}
          fieldTypes={this.state.fieldTypes}
          saveProperty={this.saveProperty}
          handleSeasonCreated={this.handleSeasonCreated}
          polygons={this.state.polygons}
          selectedFieldTypes={this.state.selectedFieldTypes}
          addNewFieldType={this.addNewFieldType}
          fieldColors={this.state.fieldColors}
        />
        <Map
          zoomControl={false}
          zoom={this.state.zoom}
          center={center}
          minZoom={8}
          maxZoom={18}
          className="map"
          dragging={true}
          onClick={this.handleMapClick}
          attributionControl={false}
        >
          <ZoomControl position={'bottomright'} />
          <TileLayer
            url={basemapUrl}
          />
          {this.state.inputCoordinates.map((coord, index) => {
            const [lat, lng] = coord.split(' ').map(Number);
            if (!isNaN(lat) && !isNaN(lng)) {
              return (
                <Marker
                  key={index}
                  position={[lat, lng]}
                  onDragEnd={this.handleMarkerDragEnd}
                  onDoubleClick={this.handleMarkerDoubleClick}
                  index={index}
                />
              );
            }
            return null;
          })}
          {polylineCoordinates.length > 1 && (
            <Polyline positions={polylineCoordinates} color="blue" />
          )}
          {this.state.showPolygons && polygonsToDisplay.length > 0 && polygonsToDisplay.map(polygon => {
            const fillColor = polygon.color || 'red';
            const fieldType = polygon.field_type || 'Неизвестно';
            const isHighlighted = polygon.highlighted;

            return (
              <Polygon
                key={polygon.id}
                positions={polygon.coordinates}
                color={isHighlighted ? 'blue' : 'red'}
                fillColor={fieldType === 'Неизвестно' ? 'transparent' : fillColor}
                fillOpacity={fieldType === 'Неизвестно' ? 0 : (isHighlighted ? 0.8 : 0.3)}
                name={polygon.name}
              >
                <Tooltip permanent direction="center" className="polygon-tooltip">
                  <span>{polygon.name}</span>
                </Tooltip>
                <Popup className="polygon-popup">
                  <div>
                    <p>Имя полигона: {polygon.name}</p>
                    <p>Тип поля: {polygon.field_type || 'Неизвестно'}</p>
                    <p>Площадь: {polygon.area || 'Неизвестно'} кв.м</p>
                  </div>
                </Popup>
              </Polygon>
            );
          })}
        </Map>
        <div className="bottom-controls">
          <div className="season-selector">
            <select onChange={this.handleSeasonChange} value={this.state.currentSeasonId || ''}>
              <option value="">Выберите сезон</option>
              {Array.isArray(this.state.seasons) && this.state.seasons.map((season, index) => (
                <option key={season.id || index} value={season.id}>{season.name}</option>
              ))}
            </select>
          </div>
          <div className="basemap-selector">
            <button onClick={() => this.safeSetState({ basemap: 'osm' })}>OSM</button>
            <button onClick={() => this.safeSetState({ basemap: 'hot' })}>HOT</button>
            <button onClick={() => this.safeSetState({ basemap: 'dark' })}>DARK</button>
            <button onClick={() => this.safeSetState({ basemap: 'mapbox' })}>MAPBOX</button>
          </div>
        </div>
        <div className="crop-controls">
          <button 
            onClick={this.toggleCropSelector}
            className="crop-selector-button"
            disabled={!this.state.currentSeasonId}
          >
            Поиск культур {this.state.selectedCrops.length > 0 ? `(${this.state.selectedCrops.length})` : ''}
          </button>

          {showCropSelector && (
            <div className="crop-selector">
              {fieldTypes.map((type, index) => (
                <div key={index} className="crop-option">
                  <input
                    type="checkbox"
                    id={`crop-${index}`}
                    checked={selectedCrops.includes(type)}
                    onChange={() => this.handleCropSelection(type)}
                    disabled={!this.state.currentSeasonId}
                  />
                  <label htmlFor={`crop-${index}`}>
                    {type}
                    <span 
                      className="crop-color-indicator"
                      style={{ backgroundColor: this.state.fieldColors[type] || 'red' }}
                    />
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
        <select onChange={this.handleFieldTypeSelection}>
          {fieldTypes.map((type, index) => (
            <option key={index} value={type}>
              {type} ({this.state.fieldColors[type] || 'red'})
            </option>
          ))}
        </select>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    layers: state.layers
  };
};

export default connect(mapStateToProps)(MapComponent);
