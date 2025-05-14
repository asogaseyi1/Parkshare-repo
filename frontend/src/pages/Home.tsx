// src/pages/Home.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/Navbar';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <NavBar />
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <h1>Welcome to ParkShare</h1>
        <p>Your smart parking space sharing solution.</p>
        <div style={{ marginTop: '20px' }}>
          <button onClick={() => navigate('/login')} style={{ marginRight: '10px' }}>Login</button>
          <button onClick={() => navigate('/register')}>Sign Up</button>
        </div>
      </div>
    </>
  );
};

export default Home;
