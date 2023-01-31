import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from './pages/Login';
import Main from './pages/Main/Main';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Shipments from './pages/Shipments';
import Clients from './pages/Clients';
import Chalanes from './pages/Chalanes';
import Suppliers from './pages/Suppliers';
import Users from './pages/Users';
import Shopping from './pages/Shopping';
import CashRegister from './pages/CashRegister';
import Inventory from './pages/Inventory';

ReactDOM.render(
  <BrowserRouter>
    <Routes>
        <Route path="/inicio" element={ <Main />} />
        <Route path="/notas" element={ <Orders />} />
        <Route path="/productos" element={ <Products />} />
        <Route path="/envios" element={ <Shipments />} />
        <Route path="/clientes" element={ <Clients />} />
        <Route path="/chalanes" element={ <Chalanes /> } />
        <Route path="/proveedores" element={ <Suppliers /> } />
        <Route path="/usuarios" element={ <Users /> } />
        <Route path="/compras" element={ <Shopping /> } />
        <Route path="/caja" element={ <CashRegister /> } />
        <Route path="/inventario" element={ <Inventory /> } />
        <Route path="/" element={ <Login />} />

      </Routes>
  </BrowserRouter>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
