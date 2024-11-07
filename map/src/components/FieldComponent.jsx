import React, { useEffect, useState } from 'react';
import axios from 'axios';

const FieldComponent = () => {
    const [data, setData] = useState(null);

    useEffect(() => {
        // Получение данных из API
        axios.get('http://appi.test/api/fields')
            .then(response => {
                setData(response.data);
            })
            .catch(error => {
                console.error('There was an error fetching the data!', error);
            });
    }, []);

    const handleSubmit = () => {
        // Отправка данных на API
        axios.post('http://appi.test/api/fields', { /* ваши данные */ })
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

