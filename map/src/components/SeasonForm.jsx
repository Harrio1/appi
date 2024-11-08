import React, { useState } from 'react';
import axios from 'axios';

const SeasonForm = ({ onSeasonCreated, polygons, selectedFieldTypes }) => {
  const [seasonName, setSeasonName] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!seasonName.trim()) {
      setError('Пожалуйста, введите название сезона.');
      return;
    }

    try {
      const response = await axios.post('http://appi.test/api/seasons', {
        name: seasonName
      });

      setSeasonName('');
      setError(null);
      onSeasonCreated(response.data);
      alert('Сезон успешно создан!');
    } catch (error) {
      console.error('Ошибка при создании сезона:', error);
      setError('Ошибка при создании сезона: ' + error.message);
    }
  };

  return (
    <div style={styles.formContainer}>
      <h3>Создать новый сезон</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Название сезона"
          value={seasonName}
          onChange={(e) => setSeasonName(e.target.value)}
          style={styles.input}
        />
        <button type="submit" style={styles.button}>Создать</button>
      </form>
      {error && <p style={styles.error}>{error}</p>}
    </div>
  );
};

const styles = {
  formContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1000,
    backgroundColor: 'white',
    padding: '10px',
    borderRadius: '5px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  input: {
    marginBottom: '5px',
    width: '100%',
  },
  button: {
    width: '100%',
  },
  error: {
    color: 'red',
  },
};

export default SeasonForm; 