import React, { useState } from 'react';
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
  selectedFieldTypes,
  addNewFieldType,
  fieldColors
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isPolygonModalOpen, setPolygonModalOpen] = useState(false);
  const [isSeasonModalOpen, setSeasonModalOpen] = useState(false);
  const [isFieldTypeModalOpen, setFieldTypeModalOpen] = useState(false);
  const [newFieldType, setNewFieldType] = useState('');
  const [newFieldColor, setNewFieldColor] = useState('#000000');
  const [newSeasonName, setNewSeasonName] = useState('');

  const toggleSidebar = () => {
    setIsVisible(!isVisible);
  };

  const handleAddFieldType = () => {
    if (newFieldType.trim() && newFieldColor.trim()) {
      addNewFieldType(newFieldType, newFieldColor);
      setNewFieldType('');
      setNewFieldColor('');
      setFieldTypeModalOpen(false);
    } else {
      alert('Пожалуйста, заполните все поля.');
    }
  };

  return (
    <div>
      <div className={`sidebar ${isVisible ? 'visible' : 'hidden'}`}>
        <div className="sidebar-content">
          <h3>Управление полями</h3>
          <button onClick={() => setPolygonModalOpen(true)}>Создание поля</button>
          <button onClick={() => setSeasonModalOpen(true)}>Создать новый сезон</button>
          <button onClick={() => setFieldTypeModalOpen(true)}>Добавить новую культуру</button>
        </div>
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
                  value={newSeasonName}
                  onChange={(e) => setNewSeasonName(e.target.value)}
                />
                <button type="button" onClick={() => handleSeasonCreated({ name: newSeasonName })}>
                  Создать сезон
                </button>
              </form>
            </div>
          </div>
        </Draggable>
      )}

      {/* Field Type Modal */}
      {isFieldTypeModalOpen && (
        <Draggable handle=".modal-header">
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <span className="close" onClick={() => setFieldTypeModalOpen(false)}>&times;</span>
                <h2>Добавить новую культуру</h2>
              </div>
              <form>
                <input
                  type="text"
                  placeholder='Введите название культуры'
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value)}
                />
                <input
                  type="color"
                  value={newFieldColor}
                  onChange={(e) => setNewFieldColor(e.target.value)}
                />
                <button type="button" onClick={handleAddFieldType}>Добавить культуру</button>
              </form>
            </div>
          </div>
        </Draggable>
      )}
    </div>
  );
};

export default Sidebar;