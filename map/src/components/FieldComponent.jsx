import '../css/FieldComponent.css';
import API_URL, { fetchData } from '../utils/apiConfig';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { logApiError } from '../utils/networkDebug';

const FieldComponent = () => {
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchFields = async () => {
        try {
            setLoading(true);
            console.log('Запрос полей из:', `${API_URL}/fields`);
            
            // Используем fetchData вместо прямого axios.get
            const response = await fetchData('fields');
            setFields(response.data);
            
            console.log('Успешно получены поля:', response.data.length);
            setError(null);
        } catch (error) {
            console.error('Ошибка при загрузке полей:', error);
            logApiError(error, 'fetchFields');
            setError('Не удалось загрузить данные полей');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFields();
    }, []);

    // Возвращаем пустой div без видимого контента
    return null;
};

export default FieldComponent;

