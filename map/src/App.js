import React from 'react';
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
          {/* <Header style={{ background: '#fff', width: "100vw" }} /> */}
          <Content className="main-map">
            <MapComponent />
          </Content>
        </Layout>
      </Layout>
    </div>
  );
}

export default App;
