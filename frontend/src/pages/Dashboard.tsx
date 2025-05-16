// src/pages/Dashboard.tsx
import React from 'react';
import NavBar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const username = localStorage.getItem('username') || 'Guest';
  const navigate = useNavigate();

  return (
    <>
      <NavBar />
      <div className="dashboard-container">
        <h2 className="dashboard-heading">Hi {username}!</h2>
        <div className="dashboard-buttons">
          <button onClick={() => navigate('/create-parking')} className="dashboard-btn">
            Create Parking Space
          </button>
          <button onClick={() => navigate('/listings')} className="dashboard-btn">
            View Listings
          </button>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
