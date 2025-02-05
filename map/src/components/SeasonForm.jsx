import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';


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
      const response = await axios.post(API_URL + '/seasons', {
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