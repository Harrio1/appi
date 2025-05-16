import React, { useState, useEffect } from 'react';
import { Layout } from 'antd';
import MapComponent from "./components/Map.jsx";
import './App.css';
import FieldComponent from './components/FieldComponent';

const { Content } = Layout;

function App() {
  return (
    <div className="main" >
      <Layout className="main-app" >
        <FieldComponent />
        <Layout>
          <Content className="main-map">
            <MapComponent />
            <div className="app-footer">
              <img src="/images/logo.svg" alt="Логотип" className="footer-logo" />
              <span>© 2024 Агро Карта</span>
            </div>
          </Content>
        </Layout>
      </Layout>
    </div>
  );
}

export default App;
