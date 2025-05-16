import React, { useState, useEffect } from 'react';
import { Layout } from 'antd';
import MapComponent from "./components/Map.jsx";
import MobileMap from "./components/MobileMap.jsx";
import './App.css';
import FieldComponent from './components/FieldComponent';

const { Content } = Layout;

function App() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Проверяем при первом рендере
    checkMobile();
    
    // Добавляем слушатель изменения размера окна
    window.addEventListener('resize', checkMobile);
    
    // Очищаем слушатель при размонтировании
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="main" >
      <Layout className="main-app" >
        <FieldComponent />
        <Layout>
          <Content className="main-map">
            {isMobile ? <MobileMap /> : <MapComponent />}
          </Content>
        </Layout>
      </Layout>
    </div>
  );
}

export default App;
