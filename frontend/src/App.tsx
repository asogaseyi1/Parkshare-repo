// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateParkingSpace from './pages/CreateParkingSpace';
import ManageListing from './pages/ManageListing';
import ParkingListings from './pages/ParkingListings';
import ReservationPage from './pages/ReservationPage';
import Messages from './pages/Messages';
import Navbar from './components/Navbar';
import { IconArrowLeft, IconMap } from './components/Icons';

const NotFound: React.FC = () => (
  <div className="page">
    <Navbar />
    <div className="container">
      <div className="card card-pad" style={{ maxWidth: '34rem', margin: '3rem auto' }}>
        <div className="empty-state">
          <span className="empty-state__icon">
            <IconMap />
          </span>
          <p className="empty-state__title">This page took a wrong turn</p>
          <p className="empty-state__text">
            The link may be out of date. Try the map — every live space is there.
          </p>
          <div className="row row-wrap" style={{ marginTop: '0.6rem' }}>
            <Link to="/" className="btn btn-secondary">
              <IconArrowLeft />
              Home
            </Link>
            <Link to="/listings" className="btn btn-primary">
              Find parking
            </Link>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-parking" element={<CreateParkingSpace />} />
        <Route path="/listings/:id/manage" element={<ManageListing />} />
        <Route path="/listings" element={<ParkingListings />} />
        <Route path="/reserve/:id" element={<ReservationPage />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
