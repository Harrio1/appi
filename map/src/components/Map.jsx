import React from "react";
import L from 'leaflet';
import { Map, TileLayer, Marker, Popup, ZoomControl, Polygon, Polyline, Tooltip } from "react-leaflet";
import '../css/Map.css';
import { connect } from "react-redux";
import axios from 'axios';
import * as turf from '@turf/turf'; // Импортируем turf
import SeasonForm from './SeasonForm'; // Импортируем новый компонент
import Sidebar from './Sidebar'; // Импортируем новый компонент
import { API_URL } from '../config/api';
// указываем путь к файлам marker
L.Icon.Default.imagePath = "https://unpkg.com/leaflet@1.5.0/dist/images/";

class MapComponent extends React.Component {
  state = {
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
  };

  basemapsDict = {
    osm: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    hot: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
    mapbox: "https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}.png"
  };

  colors = ['red'];

  componentDidMount() {
    this.loadAllPolygons();
    this.loadSeasons();
    this.loadSeeds();
    this.loadFields();
  }

  loadSeasons = async () => {
    try {
      const response = await axios.get(`${API_URL}/seasons`);
      this.setState({ seasons: response.data });
    } catch (error) {
      console.error('Ошибка при загрузке сезонов:', error);
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

      const response = await axios.post(`${API_URL}/api/seasons`, {
        name: this.state.newSeasonName,
        seeds: this.state.polygons.map(polygon => ({
          id: polygon.id,
          field_type: this.state.selectedFieldTypes[polygon.id] || 'Пшеница'
        }))
      });

      this.setState(prevState => ({
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

        const allPolygons = fieldsData.map(field => ({
          id: field.id,
          coordinates: field.coordinates,
          field_type: field.field_type,
          color: field.color || this.state.fieldColors[field.field_type] || 'red',
          name: field.name,
          area: field.area
        }));

        this.setState({ currentSeasonId: null, polygons: allPolygons });
      } catch (error) {
        console.error('Ошибка при загрузке всех полей:', error);
        alert('Ошибка при загрузке данных: ' + error.message);
      }
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/seasons/${seasonId}/fields`);
      const fieldsData = response.data;

      const updatedPolygons = fieldsData.map(field => ({
        id: field.id,
        coordinates: field.coordinates,
        field_type: field.field_type,
        color: field.color || this.state.fieldColors[field.field_type] || 'red',
        name: field.name,
        area: field.area
      }));

      this.setState({ currentSeasonId: seasonId, polygons: updatedPolygons });
    } catch (error) {
      console.error('Ошибка при загрузке данных полей:', error);
      alert('Ошибка при загрузке данных: ' + error.message);
    }
  };

  loadPolygonsFromDatabase = async () => {
    if (!this.state.currentSeasonId) return;

    try {
      const response = await axios.get(`${API_URL}/api/seasons/${this.state.currentSeasonId}/fields`);
      const polygonsData = response.data;
      console.log('Загруженные данные полигонов:', polygonsData);
      const polygons = polygonsData.map(polygon => ({
        id: polygon.id,
        coordinates: polygon.coordinates,
        color: polygon.color
      }));

      this.setState({ polygons, selectedFieldTypes: {} });
    } catch (error) {
      console.error('Ошибка при загрузке полигонов:', error);
      alert('Ошибка при загрузе данных: ' + error.message);
    }
  };

  handlePolygonNameChange = (event) => {
    this.setState({ newPolygonName: event.target.value });
  };

  calculateArea = (coordinates) => {
    const polygon = turf.polygon([coordinates]);
    const area = turf.area(polygon);
    return area;
  };

  addPolygon = async () => {
    const { inputCoordinates, newPolygonName, polygons } = this.state;

    // Проверка на пустое название
    if (!newPolygonName.trim()) {
      alert('Напишите название поля');
      return;
    }

    // Проверка на уникальность имени полигона
    const isNameTaken = polygons.some(polygon => polygon.name === newPolygonName);
    if (isNameTaken) {
      alert('Имя поля занято');
      return;
    }

    if (inputCoordinates.length >= 4 && inputCoordinates.length <= 9) {
      const coordinates = inputCoordinates.map(coord => {
        const [lat, lng] = coord.split(' ').map(Number);
        return [lat, lng]; // Убедитес, что порядок [lat, lng] правильный
      });

      // Добавление первой координаты в конец, если они не совпадают
      if (coordinates.length > 0 && (coordinates[0][0] !== coordinates[coordinates.length - 1][0] || coordinates[0][1] !== coordinates[coordinates.length - 1][1])) {
        coordinates.push(coordinates[0]);
      }

      const area = this.calculateArea(coordinates);

      const newPolygon = {
        coordinates: coordinates,
        name: newPolygonName,
        area: area,
        season_id: this.state.currentSeasonId
      };

      try {
        const response = await axios.post(`${API_URL}/fields`, newPolygon);
        console.log('Ответ сервера:', response.data);

        if (response.data && response.data.success && response.data.id && response.data.name) {
          const addedPolygon = {
            id: response.data.id,
            coordinates: coordinates,
            color: 'red',
            name: response.data.name,
            area: newPolygon.area
          };

          this.setState(prevState => ({
            polygons: [...prevState.polygons, addedPolygon],
            inputCoordinates: [],
            newPolygonName: ''
          }));

          console.log("Полигон добавлен:", addedPolygon);
        } else {
          const errorMessage = response.data.error || 'Неизвестная ошиб';
          console.error('Ошибка при давлении полигона:', errorMessage);
          alert(`Не удалось сохранить полигон: ${errorMessage}`);
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
    this.setState(prevState => ({
      creationMode: !prevState.creationMode
    }));
  };

  removeLastPolygon = () => {
    this.setState(prevState => ({
      polygons: prevState.polygons.slice(0, -1)
    }));
  };

  handleMapClick = (e) => {
    if (!this.state.creationMode) return;

    const { lat, lng } = e.latlng;
    const newCoordinates = [...this.state.inputCoordinates, `${lat} ${lng}`];
    this.setState({
      inputCoordinates: newCoordinates
    });
  };

  selectPolygon = (id) => {
    this.setState({ selectedPolygonId: id });
  };

  removeSelectedPolygon = () => {
    this.setState(prevState => ({
      polygons: prevState.polygons.filter(polygon => polygon.id !== prevState.selectedPolygonId),
      selectedPolygonId: null
    }));
  };

  clearMarkers = () => {
    this.setState({ inputCoordinates: [] });
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevState.polygons !== this.state.polygons) {
      console.log('Оовлено состояние полигонов:', this.state.polygons);
    }
  }

  calculatePolygonCenter(coordinates) {
    const latSum = coordinates.reduce((sum, coord) => sum + coord[0], 0);
    const lngSum = coordinates.reduce((sum, coord) => sum + coord[1], 0);
    return [latSum / coordinates.length, lngSum / coordinates.length];
  }

  handleFieldTypeChange = (polygonId, event) => {
    const selectedFieldType = event.target.value;
    this.setState(prevState => ({
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
    this.setState(prevState => ({
      polygons: prevState.polygons.map(polygon => 
        polygon.id === polygonId ? { ...polygon, color: selectedFieldColor } : polygon
      )
    }));
  };

  loadSeeds = async () => {
    try {
      const response = await axios.get(`${API_URL}/seeds`);
      const seeds = response.data;
      this.setState({ seeds });
    } catch (error) {
      console.error('Ошибка при загрузке семян:', error);
    }
  };

  handleSeedChange = (event) => {
    const seedId = event.target.value;
    console.log('Выбранный семя ID:', seedId);
    this.setState({ currentSeedId: seedId }, this.loadPolygonsFromDatabase);
  };

  editField = async (fieldId) => {
    const field = this.state.fields.find(f => f.id === fieldId);
    if (!field) return;

    this.setState({
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
      const response = await axios.put(`${API_URL}/api/fields/${editFieldId}`, {
        name: newFieldName,
        coordinates: newFieldCoordinates,
        area: parseFloat(newFieldArea)
      });

      this.setState(prevState => ({
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
    this.setState({ [name]: value }, this.filterFields);
  };

  filterFields = () => {
    const { fields, selectedSeasonId, selectedSeedId } = this.state;
    const filteredFields = fields.filter(field => {
        const binding = field.bindings.find(b => b.season_id === selectedSeasonId && b.seed_id === selectedSeedId);
        return binding !== undefined;
    });
    this.setState({ filteredFields });
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

      this.setState({ polygons });
    } catch (error) {
      console.error('Ошибка при загрузке полигонов:', error);
      alert('Ошибка при загрузке данных: ' + error.message);
    }
  };

  handleFieldSelection = (event) => {
    this.setState({ selectedFieldId: event.target.value });
  };

  handleSeasonInputChange = (event) => {
    this.setState({ selectedSeason: event.target.value });
  };

  handleFieldTypeSelection = (event) => {
    const selectedFieldType = event.target.value;
    this.setState({ selectedFieldType });

    // Обновляем цвет поля в зависимости от выбранной культуры
    const selectedFieldColor = this.state.fieldColors[selectedFieldType] || 'red';
    this.setState({ selectedFieldColor });

    this.setState(prevState => ({
      polygons: prevState.polygons.map(polygon => 
        polygon.id === prevState.selectedFieldId ? { ...polygon, color: selectedFieldColor } : polygon
      )
    }));
  };

  saveProperty = async () => {
    const { selectedFieldId, selectedSeason, selectedFieldType, selectedFieldColor } = this.state;

    console.log('Проверка значений:', { selectedFieldId, selectedSeason, selectedFieldType, selectedFieldColor });

    if (!selectedFieldId || !selectedSeason || !selectedFieldType || !selectedFieldColor) {
      alert('Пожалуйста, заполните все поля.');
      return;
    }

    try {
        await axios.post(`${API_URL}/fields/properties`, {
            field_id: selectedFieldId,
            season_name: selectedSeason,
            field_type: selectedFieldType,
            seed_color: selectedFieldColor
        });

        alert('Данные успешно сохранены!');
    } catch (error) {
        console.error('Ошибка при сохранении данных:', error);
        if (error.response && error.response.data) {
            console.log('Детали ошибки:', error.response.data);
            alert(`Ошибка: ${error.response.data.error}`);
        } else {
            alert('Ошибка при сохранении данных: ' + error.message);
        }
    }
  };

  handleSearchNameChange = (event) => {
    this.setState({ searchPolygonName: event.target.value });
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

      this.setState({ polygons: polygonsData });
    } catch (error) {
      console.error('Ошибка при поиске полигонов:', error);
      alert('Ошибка при поиске полигонов: ' + error.message);
    }
  };

  componentWillUnmount() {
    // Отмените все асинхронные операции, например, запросы axios
    this.cancelTokenSource && this.cancelTokenSource.cancel('Component unmounted');
  }

  handleMarkerDragEnd = (newPosition, index) => {
    this.setState(prevState => {
      const newCoordinates = [...prevState.inputCoordinates];
      newCoordinates[index] = `${newPosition.lat} ${newPosition.lng}`;
      return { inputCoordinates: newCoordinates };
    });
  };

  handleMarkerDoubleClick = (index) => {
    this.setState(prevState => {
      const newCoordinates = prevState.inputCoordinates.filter((_, i) => i !== index);
      return { inputCoordinates: newCoordinates };
    });
  };

  handleInputChange = (event) => {
    const inputCoordinates = event.target.value.split(',').map(coord => coord.trim());
    this.setState({ inputCoordinates });
  };

  loadFields = async () => {
    try {
      const response = await axios.get(`${API_URL}/fields`);
      // Убедитесь, что response.data является массивом объектов
      if (Array.isArray(response.data)) {
        this.setState({ fields: response.data });
      } else {
        console.error('Некорректный формат данных:', response.data);
      }
    } catch (error) {
      console.error('Ошибка при загрузке полей:', error);
    }
  };

  handleSeasonCreated = async (newSeason) => {
    try {
      const response = await axios.post(`${API_URL}/seasons`, newSeason);
      this.setState((prevState) => ({
        seasons: [...prevState.seasons, response.data],
        currentSeasonId: response.data.id,
      }));
      alert('Сезон успешно создан!');
    } catch (error) {
      console.error('Ошибка при создании нового сезона:', error);
      alert('Ошибка при создании нового сезона: ' + error.message);
    }
  };

  deleteField = async (fieldId) => {
    try {
      await axios.delete(`${API_URL}/fields/${fieldId}`);
      this.setState(prevState => ({
        fields: prevState.fields.filter(field => field.id !== fieldId)
      }));
      alert('Поле успешно удалено!');
    } catch (error) {
      console.error('Ошибка при удалении поля:', error);
      alert('Ошибка при удалении поля: ' + error.message);
    }
  };

  togglePolygonForm = () => {
    this.setState(prevState => ({
      showPolygonForm: !prevState.showPolygonForm
    }));
  };

  toggleFieldManagementForm = () => {
    this.setState(prevState => ({
      showFieldManagementForm: !prevState.showFieldManagementForm
    }));
  };

  toggleSidebar = () => {
    this.setState(prevState => ({
      isSidebarVisible: !prevState.isSidebarVisible
    }));
  };

  addNewFieldType = (name, color) => {
    this.setState(prevState => ({
      fieldTypes: [...prevState.fieldTypes, name],
      fieldColors: { ...prevState.fieldColors, [name]: color }
    }));
  };

  loadPolygons = async () => {
    try {
      const response = await axios.get(`${API_URL}/fields`);
      this.setState({ polygons: response.data });
    } catch (error) {
      console.error('Ошибка при загрузке полигонов:', error);
    }
  };

  render() {
    const center = [this.state.lat, this.state.lng];
    const basemapUrl = this.basemapsDict[this.state.basemap];

    if (!basemapUrl) {
      console.error('Basemap URL is undefined');
      return null;
    }

    const polylineCoordinates = this.state.inputCoordinates.map(coord => {
      const [lat, lng] = coord.split(' ').map(Number);
      return [lat, lng];
    });

    if (polylineCoordinates.length > 1 && (polylineCoordinates[0][0] !== polylineCoordinates[polylineCoordinates.length - 1][0] || polylineCoordinates[0][1] !== polylineCoordinates[polylineCoordinates.length - 1][1])) {
      polylineCoordinates.push(polylineCoordinates[0]);
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
          setShowPolygons={(show) => this.setState({ showPolygons: show })}
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
        <div className="season-selector">
          <select onChange={this.handleSeasonChange} value={this.state.currentSeasonId || ''}>
            <option value="">Выберите сезон</option>
            {this.state.seasons.map((season, index) => (
              <option key={season.id || index} value={season.id}>{season.name}</option>
            ))}
          </select>
        </div>
        <Map
          zoomControl={false}
          zoom={this.state.zoom}
          center={center}
          minZoom={8}
          maxZoom={18}
          className="map"
          dragging={true}
          onClick={this.handleMapClick}
        >
          <ZoomControl position={'bottomright'} />
          <TileLayer
            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
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
          {this.state.showPolygons && this.state.polygons.map(polygon => {
            const fillColor = polygon.color;
            const fieldType = polygon.field_type || 'Неизвестно';

            return (
              <Polygon
                key={polygon.id}
                positions={polygon.coordinates}
                color="red"
                fillColor={fillColor}
                fillOpacity={0.5}
                name={polygon.name}
              >
                <Tooltip permanent direction="center" className="polygon-tooltip">
                  <span>{polygon.name}</span>
                </Tooltip>
                <Popup className="polygon-popup">
                  <div>
                    <p>Имя полигона: {polygon.name}</p>
                    <p>Тип поля: {fieldType}</p>
                    <p>Площадь: {polygon.area || 'Неизвестно'} кв.м</p>
                  </div>
                </Popup>
              </Polygon>
            );
          })}
        </Map>
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
