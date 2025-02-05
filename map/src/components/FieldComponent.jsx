import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';

const FieldComponent = () => {
    const [setData] = useState(null);

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
    }, [setData]);

    return (
        <div>
           
            {/* {data && <pre>{JSON.stringify(data, null, 2)}</pre>} */}
        </div>
    );
};

export default FieldComponent;

