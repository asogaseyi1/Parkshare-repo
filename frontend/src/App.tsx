// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateParkingSpace from './pages/CreateParkingSpace';
import ParkingListings from './pages/ParkingListings';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-parking" element={<CreateParkingSpace />} />
        <Route path="/listings" element={<ParkingListings />} />
      </Routes>
    </Router>
  );
};

export default App;