import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FieldComponent = () => {
    const [data, setData] = useState([]);

    const fetchFields = async () => {
        try {
            const response = await axios.get('/api/fields');
            setData(response.data);
        } catch (error) {
            console.error('Ошибка при загрузке данных:', error);
        }
    };

    useEffect(() => {
        fetchFields();
    }, []);

    return null;
};

export default FieldComponent;

