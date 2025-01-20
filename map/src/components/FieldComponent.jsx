import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';

const FieldComponent = () => {
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchFields = async () => {
            try {
                const response = await axios.get(`${API_URL}/fields`);
                setData(response.data);
            } catch (error) {
                console.error('There was an error fetching the data!', error);
            }
        };
        
        fetchFields();
    }, []);

    const handleSubmit = () => {
        // Отправка данных на API
        axios.post(`${API_URL}/fields`, { /* ваши данные */ })
            .then(response => {
                console.log(response.data);
            })
            .catch(error => {
                console.error('There was an error sending the data!', error);
            });
    };

    return (
        <div>
           
            {/* {data && <pre>{JSON.stringify(data, null, 2)}</pre>} */}
        </div>
    );
};

export default FieldComponent;

