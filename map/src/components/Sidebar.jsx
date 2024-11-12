import React, { useState } from 'react';
import SeasonForm from './SeasonForm';
import '../css/Sidebar.css';

const Sidebar = ({
  inputCoordinates,
  newPolygonName,
  handleInputChange,
  handlePolygonNameChange,
  addPolygon,
  clearMarkers,
  toggleCreationMode,
  creationMode,
  showPolygons,
  setShowPolygons,
  fields,
  handleFieldSelection,
  selectedFieldId,
  handleSeasonInputChange,
  selectedSeason,
  seasons,
  handleFieldTypeSelection,
  selectedFieldType,
  fieldTypes,
  saveProperty,
  handleSeasonCreated,
  polygons,
  selectedFieldTypes
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const toggleSidebar = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div>
      <div className={`sidebar ${isVisible ? 'visible' : 'hidden'}`}>
        <div className="sidebar-content">
          <h3>Форма полигона</h3>
          <input
            type="text"
            placeholder='Введите координаты в формате "lat lng", разделенные запятыми'
            value={inputCoordinates.join(', ')}
            onChange={handleInputChange}
          />
          <input
            type="text"
            placeholder='Введите название полигона'
            value={newPolygonName}
            onChange={handlePolygonNameChange}
          />
          <button onClick={addPolygon}>Сохранить заливку</button>
          <button onClick={clearMarkers}>Очистить маркеры</button>
          <button onClick={toggleCreationMode}>
            {creationMode ? 'Выключить режим заливки' : 'Включить режим заливки'}
          </button>
          <button onClick={() => setShowPolygons(!showPolygons)}>
            {showPolygons ? 'Скрыть полигоны' : 'Показать полигоны'}
          </button>

          <h3>Управление полями</h3>
          <select onChange={handleFieldSelection} value={selectedFieldId || ''}>
            <option value="" disabled>Выберите поле</option>
            {fields.map(field => (
              <option key={field.id} value={field.id}>{field.name}</option>
            ))}
          </select>
          <select onChange={handleSeasonInputChange} value={selectedSeason || ''}>
            <option value="" disabled>Выберите сезон</option>
            {seasons.map(season => (
              <option key={season.id} value={season.name}>{season.name}</option>
            ))}
          </select>
          <select onChange={handleFieldTypeSelection} value={selectedFieldType || ''}>
            <option value="" disabled>Выберите культуру</option>
            {fieldTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <button onClick={saveProperty}>Сохранить</button>

          <SeasonForm
            onSeasonCreated={handleSeasonCreated}
            polygons={polygons}
            selectedFieldTypes={selectedFieldTypes}
          />
        </div>
      </div>
      <button className="side-button" onClick={toggleSidebar}>
        {isVisible ? '✕' : '☰'}
      </button>
    </div>
  );
};

export default Sidebar;