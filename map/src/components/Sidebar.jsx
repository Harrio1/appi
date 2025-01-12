import React, { useState, useRef } from 'react';
import Draggable from 'react-draggable';
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
  const [isPolygonModalOpen, setPolygonModalOpen] = useState(false);
  const [isSeasonModalOpen, setSeasonModalOpen] = useState(false);

  const toggleSidebar = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div>
      <div className={`sidebar ${isVisible ? 'visible' : 'hidden'}`}>
        <div className="sidebar-content">
          

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
        </div>
        <button onClick={() => setPolygonModalOpen(true)}>Открыть создание поля</button>
          <button onClick={() => setSeasonModalOpen(true)}>Создать новый сезон</button>
      </div>
      <button className="side-button" onClick={toggleSidebar}>
        {isVisible ? '✕' : '☰'}
      </button>

      {/* Polygon Modal */}
      {isPolygonModalOpen && (
        <Draggable handle=".modal-header">
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <span className="close" onClick={() => setPolygonModalOpen(false)}>&times;</span>
                <h2>Создание поля </h2>
              </div>
              <form>
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
                <button type="button" onClick={addPolygon}>Сохранить поле</button>
                <button type="button" onClick={clearMarkers}>Очистить маркеры</button>
                <button type="button" onClick={toggleCreationMode}>
                  {creationMode ? 'Выключить режим маркера' : 'Включить режим маркера'}
                </button>
                <button type="button" onClick={() => setShowPolygons(!showPolygons)}>
                  {showPolygons ? 'Скрыть полигоны' : 'Показать полигоны'}
                </button>
              </form>
            </div>
          </div>
        </Draggable>
      )}

      {/* Season Modal */}
      {isSeasonModalOpen && (
        <Draggable handle=".modal-header">
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <span className="close" onClick={() => setSeasonModalOpen(false)}>&times;</span>
                <h2>Создать новый сезон</h2>
              </div>
              <form>
                <input
                  type="text"
                  placeholder='Введите название сезона'
                  // value и onChange для управления состоянием формы сезона
                />
                <button type="button" onClick={handleSeasonCreated}>Создать сезон</button>
              </form>
            </div>
          </div>
        </Draggable>
      )}
    </div>
  );
};

export default Sidebar;