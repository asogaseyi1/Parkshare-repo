// src/pages/Home.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/Navbar';
import './Home.css';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <NavBar />
      <div className="home-container">
        <h1 className="home-title">Welcome to ParkShare</h1>
        <p className="home-subtitle">Your smart parking space sharing solution.</p>
        <div className="home-buttons">
          <button onClick={() => navigate('/login')}>Login</button>
          <button onClick={() => navigate('/register')}>Sign Up</button>
        </div>
      </div>
    </>
  );
};

export default Home;
