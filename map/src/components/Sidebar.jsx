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
  selectedFieldTypes,
  addNewFieldType,
  fieldColors
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isPolygonModalOpen, setPolygonModalOpen] = useState(false);
  const [isSeasonModalOpen, setSeasonModalOpen] = useState(false);
  const [isFieldTypeModalOpen, setFieldTypeModalOpen] = useState(false);
  const [newFieldType, setNewFieldType] = useState('');
  const [newFieldColor, setNewFieldColor] = useState('');
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
          <select onChange={handleFieldSelection} value={selectedFieldId || ''}>
            <option value="" disabled>Выберите поле</option>
            {fields.map((field, index) => (
              <option key={field.id || index} value={field.id}>{field.name}</option>
            ))}
          </select>
          <select onChange={handleSeasonInputChange} value={selectedSeason || ''}>
            <option value="" disabled>Выберите сезон</option>
            {seasons.map((season, index) => (
              <option key={season.id || index} value={season.name}>{season.name}</option>
            ))}
          </select>
<<<<<<< HEAD
<<<<<<< HEAD
          <select onChange={handleFieldTypeSelection} value={selectedFieldType || ''}>
            <option value="" disabled>Выберите культуру</option>
            {fieldTypes.map((type, index) => (
              <option key={type || index} value={type}>{type}</option>
            ))}
          </select>
=======
=======
>>>>>>> b673b050222f8980401590cb32418dcccfe94703
          <div className="custom-select">
            <div className="selected-option">
              {selectedFieldType ? (
                <span>
                  <span className="color-box" style={{ backgroundColor: fieldColors[selectedFieldType] || 'black' }}></span>
                  {selectedFieldType}
                </span>
              ) : 'Выберите культуру'}
            </div>
            <div className="options">
              {fieldTypes.map(type => (
                <div 
                  key={type} 
                  className="option"
                  onClick={() => handleFieldTypeSelection({ target: { value: type } })}
                >
                  <span className="color-box" style={{ backgroundColor: fieldColors[type] || 'black' }}></span>
                  {type}
                </div>
              ))}
            </div>
          </div>
<<<<<<< HEAD
>>>>>>> b673b050222f8980401590cb32418dcccfe94703
=======
>>>>>>> b673b050222f8980401590cb32418dcccfe94703
          <button onClick={saveProperty}>Сохранить</button>
        </div>
        <button onClick={() => setPolygonModalOpen(true)}>Открыть создание поля</button>
          <button onClick={() => setSeasonModalOpen(true)}>Создать новый сезон</button>
        <button onClick={() => setFieldTypeModalOpen(true)}>Добавить новую культуру</button>
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