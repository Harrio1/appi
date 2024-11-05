import React from "react";
import L from 'leaflet';
import { Map, TileLayer, Marker, Popup, ZoomControl, Polygon, Polyline, Tooltip } from "react-leaflet";
import '../css/Map.css';
import { connect } from "react-redux";
import axios from 'axios';
import * as turf from '@turf/turf'; // Импортируем turf

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
    creationMode: true,
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
  }

  loadSeasons = async () => {
    try {
      const response = await axios.get('http://appi.test/api/seasons');
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

      const response = await axios.post('http://appi.test/api/seasons', {
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

  handleSeasonChange = (event) => {
    const seasonId = event.target.value;
    console.log('Выбранный сезон ID:', seasonId);
    this.setState({ currentSeasonId: seasonId }, this.loadPolygonsFromDatabase);
  };

  loadPolygonsFromDatabase = async () => {
    if (!this.state.currentSeasonId) return;

    try {
      const response = await axios.get(`http://appi.test/api/seasons/${this.state.currentSeasonId}/fields`);
      const polygonsData = response.data;
      console.log('Загруженные данные полигонов:', polygonsData);
      const polygons = polygonsData.map(polygon => ({
        id: polygon.id,
        coordinates: polygon.coordinates,
        color: polygon.color,
        field_type: null
      }));

      this.setState({ polygons, selectedFieldTypes: {} });
    } catch (error) {
      console.error('Ошибка при загрузке полигонов:', error);
      alert('Ошибка при загрузке данных: ' + error.message);
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
        return [lat, lng]; // Убедитесь, что порядок [lat, lng] правильный
      });

      // Добавление первой координаты в конец, если они не совпадают
      if (coordinates.length > 0 && (coordinates[0][0] !== coordinates[coordinates.length - 1][0] || coordinates[0][1] !== coordinates[coordinates.length - 1][1])) {
        coordinates.push(coordinates[0]);
      }

      const area = this.calculateArea(coordinates);

      const newPolygon = {
        coordinates: coordinates,
        name: newPolygonName,
        area: area
      };

      try {
        const response = await axios.post('http://appi.test/api/fields', newPolygon);
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
          const errorMessage = response.data.error || 'Неизвестная ошибка';
          console.error('Ошибка при добавлении полигона:', errorMessage);
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
    const { value } = event.target;
    this.setState(prevState => ({
      selectedFieldTypes: {
        ...prevState.selectedFieldTypes,
        [polygonId]: value
      }
    }));
  };

  loadSeeds = async () => {
    try {
      const response = await axios.get('http://appi.test/api/seeds');
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
      const response = await axios.put(`http://appi.test/api/fields/${editFieldId}`, {
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

  deleteField = async (fieldId) => {
    try {
      await axios.delete(`http://appi.test/api/fields/${fieldId}`);
      this.setState(prevState => ({
        fields: prevState.fields.filter(field => field.id !== fieldId)
      }));
      alert('Поле успешно удалено!');
    } catch (error) {
      console.error('Ошибка при удалении поля:', error);
      alert('Ошибка при далении поля: ' + error.message);
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
      const response = await axios.get('http://appi.test/api/fields');
      const polygonsData = response.data;
      console.log('Загруженные данные полигонов:', polygonsData);

      const polygons = polygonsData.map(polygon => {
        // Преобразуем объект coordinates в массив массивов
        const coordinatesArray = Object.values(polygon.coordinates).map(coord => [coord[1], coord[0]]);

        return {
          id: polygon.id,
          coordinates: coordinatesArray, // Используем преобразованный массив
          color: polygon.color || 'red',
          name: polygon.name,
          field_type: polygon.field_type
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
    this.setState({ selectedFieldType: event.target.value });
  };

  saveProperty = async () => {
    const { selectedFieldId, selectedSeason, selectedFieldType } = this.state;
    if (!selectedFieldId || !selectedSeason || !selectedFieldType) {
      alert('Пожалуйста, заполните все поля.');
      return;
    }

    try {
      const response = await axios.post('http://appi.test/api/properties', {
        field_id: selectedFieldId,
        season: selectedSeason,
        field_type: selectedFieldType
      });

      alert('Данные успешно сохранены!');
    } catch (error) {
      console.error('Ошибка при сохранении данных:', error);
      alert('Ошибка при сохранении данных: ' + error.message);
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
      const response = await axios.post('http://appi.test/api/fields/by-name', { name: searchPolygonName });
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

  render() {
    const center = [this.state.lat, this.state.lng];
    const basemapUrl = this.basemapsDict[this.state.basemap];

    if (!basemapUrl) {
      console.error('Basemap URL is undefined');
      return null;
    }

    console.log("Current Polygons:", this.state.polygons);

    const polylineCoordinates = this.state.inputCoordinates.map(coord => {
      const [lat, lng] = coord.split(' ').map(Number);
      return [lat, lng];
    });

    // Добавление первой координаты в конец, если они не совпадают
    if (polylineCoordinates.length > 1 && (polylineCoordinates[0][0] !== polylineCoordinates[polylineCoordinates.length - 1][0] || polylineCoordinates[0][1] !== polylineCoordinates[polylineCoordinates.length - 1][1])) {
      polylineCoordinates.push(polylineCoordinates[0]);
    }

    const filteredFields = this.getFilteredFields();

    return (
      <div style={{ position: 'relative', height: '100vh', width: '100vw' }}>
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, background: 'white', padding: '10px', borderRadius: '5px' }}>
          <input
            type="text"
            placeholder='Введите координаты в формате "lat lng", разделенные запятыми'
            value={this.state.inputCoordinates.join(', ')}
            onChange={this.handleInputChange}
            style={{ width: '300px', marginRight: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          />
          <input
            type="text"
            placeholder='Введите название полигона'
            value={this.state.newPolygonName}
            onChange={this.handlePolygonNameChange}
            style={{ width: '200px', marginRight: '10px' }}
          />
          <button onClick={this.addPolygon}>Сохранить заливку</button>
          <button onClick={this.clearMarkers}>Очистить маркеры</button>
          <button onClick={this.toggleCreationMode}>
            {this.state.creationMode ? 'Выключить режим заливки' : 'Включить режим заливки'}
          </button>
          <input
            type="text"
            placeholder='Введите название для поиска'
            value={this.state.searchPolygonName}
            onChange={this.handleSearchNameChange}
            style={{ width: '200px', marginRight: '10px' }}
          />
          <button onClick={this.searchPolygonsByName}>Поиск по названию</button>
        </div>

        <div style={{ position: 'absolute', top: 200, left: 10, zIndex: 1000, background: 'white', padding: '10px', borderRadius: '5px' }}>
          <h3>Управление полями</h3>
          <select onChange={this.handleFieldSelection} value={this.state.selectedFieldId || ''}>
            <option value="" disabled>Выберите поле</option>
            {this.state.fields.map(field => (
              <option key={field.id} value={field.id}>{field.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Введите сезон"
            value={this.state.selectedSeason}
            onChange={this.handleSeasonInputChange}
          />
          <select onChange={this.handleFieldTypeSelection} value={this.state.selectedFieldType || ''}>
            <option value="" disabled>Выберите тип поля</option>
            {this.state.fieldTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <button onClick={this.saveProperty}>Сохранить</button>
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
            return (
              <Marker
                key={index}
                position={[lat, lng]}
                onDragEnd={this.handleMarkerDragEnd}
                onDoubleClick={this.handleMarkerDoubleClick}
                index={index}
              />
            );
          })}
          {polylineCoordinates.length > 1 && (
            <Polyline positions={polylineCoordinates} color="blue" />
          )}
          {this.state.polygons.map(polygon => {
            const selectedType = this.state.selectedFieldTypes[polygon.id];
            const fillColor = this.state.fieldColors[selectedType] || polygon.color;

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
                <Popup>
                  <div>
                    <p>Имя полигона: {polygon.name}</p>
                    <label>Выберите тип поля:</label>
                    <select
                      value={selectedType || ''}
                      onChange={(e) => this.handleFieldTypeChange(polygon.id, e)}
                    >
                      <option value="" disabled>Выберте тип</option>
                      {this.state.fieldTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <p>Название семян: {this.state.seedNames[selectedType] || 'Не выбрано'}</p>
                  </div>
                </Popup>
              </Polygon>
            );
          })}
          {filteredFields.map(field => (
            <Polygon
              key={field.id}
              positions={JSON.parse(field.coordinates)}
              color="red"
              fillColor="blue"
              fillOpacity={0.5}
            >
              <Popup>
                <div>
                  <p>Название: {field.name}</p>
                  <p>Площадь: {field.area} кв.м</p>
                  <button onClick={() => this.editField(field.id)}>Редактировать</button>
                  <button onClick={() => this.deleteField(field.id)}>Удалить</button>
                </div>
              </Popup>
            </Polygon>
          ))}
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
