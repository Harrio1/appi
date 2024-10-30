import React from "react";
import L from 'leaflet';
import { Map, TileLayer, Marker, Popup, ZoomControl, Polygon, Polyline } from "react-leaflet";
import '../css/Map.css';
import { connect } from "react-redux";
import axios from 'axios';

// указываем путь к файлам marker
L.Icon.Default.imagePath = "https://unpkg.com/leaflet@1.5.0/dist/images/";

class MapComponent extends React.Component {
  state = {
    // Установите координаты для Целинского района Ростовской области
    lat: 46.536032,  // Широта
    lng: 41.031736, // Долгота
    zoom: 10,     // Увеличение для более детального просмотра
    basemap: 'mapbox', // Убедитесь, что это значение существует в basemapsDict
    polygons: [], // Массив для хранния заливок
    inputCoordinates: [], // Массив для хранения введенных координат
    creationMode: true, // Новый флаг для режима создания полей
    selectedPolygonId: null, // ID выбранного полигон
    fieldTypes: ['Пшеница', 'Кукуруза', 'Соя', 'Подсолнечник', 'Рапс', 'Ячмень', 'Овес', 'Рис', 'Гречиха'], // Возможные типы полей
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
    selectedFieldTypes: {}, // Объект для хранения выбранных типов полей для каждого полигона
    seasons: [], // Массив для хранения сезонов
    currentSeasonId: null, // ID текущего сезона
    newSeasonName: '' // Имя для нового сезона
  };

  // Переместите basemapsDict сюда
  basemapsDict = {
    osm: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    hot: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
    mapbox: "https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}.png"
  };

  colors = ['red']
  handleInputChange = (e) => {
    const { value } = e.target;
    const coordinates = value.split(',').map(coord => coord.trim()).filter(coord => coord); // Разделяем по запятой и очищаем пробелы
    this.setState({ inputCoordinates: coordinates });
  };

  componentDidMount() {
    this.loadSeasons();
    this.loadPolygonsFromDatabase();
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
          field_type: null // Сбрасываем тип поля
      }));

      this.setState({ polygons, selectedFieldTypes: {} });
    } catch (error) {
        console.error('Ошибка при загрузке полигонов:', error);
        alert('Ошибка при загрузке данных: ' + error.message);
    }
  };

  addPolygon = async () => {
    const { inputCoordinates, selectedFieldTypes, currentSeasonId } = this.state;
    if (!currentSeasonId) {
        alert('Пожалуйста, выберите сезон.');
        return;
    }

    if (inputCoordinates.length >= 4 && inputCoordinates.length <= 9) {
        const coordinates = inputCoordinates.map(coord => {
            const [lat, lng] = coord.split(' ').map(Number);
            return [lat, lng];
        });

        const selectedType = selectedFieldTypes[this.state.selectedPolygonId] || 'Пшеница';

        const newPolygon = {
            coordinates: coordinates,
            color: this.colors[this.state.polygons.length % this.colors.length],
            name: 'Polygon Name',
            field_type: selectedType
        };

        try {
            const response = await axios.post(`http://appi.test/api/seasons/${currentSeasonId}/fields`, newPolygon);
            console.log('Ответ сервера:', response.data);

            if (response.data && response.data.success && response.data.id && response.data.name) {
                console.log('Полученный id:', response.data.id);
                console.log('Полученное имя:', response.data.name);

                const addedPolygon = {
                    id: response.data.id,
                    coordinates: coordinates,
                    color: newPolygon.color,
                    name: response.data.name,
                    field_type: selectedType
                };

                this.setState(prevState => ({
                    polygons: [...prevState.polygons, addedPolygon],
                    inputCoordinates: []
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
      polygons: prevState.polygons.slice(0, -1) // Удаляем последний полигон
    }));
  };

  handleMapClick = (e) => {
    if (!this.state.creationMode) return; // Если режим создания выключен, не добавляем координаты

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
      selectedPolygonId: null // Сбросить выбраный полигон
    }));
  };

  clearMarkers = () => {
    this.setState({ inputCoordinates: [] });
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevState.polygons !== this.state.polygons) {
      console.log('Обновлено состояние полигонов:', this.state.polygons);
    }
  }

  render() {
    const center = [this.state.lat, this.state.lng];
    const basemapUrl = this.basemapsDict[this.state.basemap];

    if (!basemapUrl) {
      console.error('Basemap URL is undefined');
      return null;
    }

    console.log("Current Polygons:", this.state.polygons); // Выводим текущие полигоны в консоль

    // Преобразуем inputCoordinates в массив координат для Polyline
    const polylineCoordinates = this.state.inputCoordinates.map(coord => {
      const [lat, lng] = coord.split(' ').map(Number);
      return [lat, lng];
    });

    return (
      <div style={{ position: 'relative', height: '100vh', width: '100vw' }}>
        {/* Основной блок управления картой */}
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, background: 'white', padding: '10px', borderRadius: '5px' }}>
          <input
            type="text"
            placeholder='Введите координаты в формате "lat lng", разделенные запятыми'
            value={this.state.inputCoordinates.join(', ')} // Преобразуем массив в строку
            onChange={this.handleInputChange}
            style={{ width: '300px', marginRight: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} // Устанавливаем фиксированную ширину и стили для предотвращения растягивания
          />
          <button onClick={this.addPolygon}>Сохранить заливку</button>
          <button onClick={this.clearMarkers}>Очистить маркеры</button>
          <button onClick={this.toggleCreationMode}>
            {this.state.creationMode ? 'Выключить режим заливки' : 'Включить режим заливки'}
          </button>
        </div>

        {/* Блок для управления сезонами */}
        <div style={{ position: 'absolute', top: 100, left: 10, zIndex: 1000, background: 'white', padding: '10px', borderRadius: '5px' }}>
          <h3>Управление сезонами</h3>
          <select onChange={this.handleSeasonChange} value={this.state.currentSeasonId || ''}>
            <option value="" disabled>Выберите сезон</option>
            {this.state.seasons.map(season => (
              <option key={season.id} value={season.id}>{season.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Имя нового сезона"
            value={this.state.newSeasonName}
            onChange={(e) => this.setState({ newSeasonName: e.target.value })}
          />
          <button onClick={this.createNewSeason}>Создать новй сезон</button>
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
              <Marker key={index} position={[lat, lng]} />
            );
          })}
          {this.state.polygons.map(polygon => {
            const selectedType = this.state.selectedFieldTypes[polygon.id];
            const fillColor = this.state.fieldColors[selectedType] || polygon.color;
            const seedName = this.state.seedNames[selectedType] || 'Не выбрано';

            return (
              <Polygon
                key={polygon.id}
                positions={polygon.coordinates}
                color="red" // Устанавливаем границы полигона красными
                fillColor={fillColor} // Устанавливаем цвет заливки  зависимости от выбранного типа семян
                fillOpacity={0.5}
              >
                <Popup>
                  <div>
                    <label>Выберите тип поля:</label>
                    <select
                      value={selectedType || ''}
                      onChange={(e) => this.handleFieldTypeChange(polygon.id, e)}
                    >
                      <option value="" disabled>Выберите тип</option>
                      {this.state.fieldTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <p>Название семян: {seedName}</p>
                  </div>
                </Popup>
              </Polygon>
            );
          })}
          <Polyline positions={polylineCoordinates} />
        </Map>
      </div>
    );
  }

  // Функция для вычисления центра полигона
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
};

const mapStateToProps = (state) => {
  return {
    layers: state.layers
  };
};

export default connect(mapStateToProps)(MapComponent);
