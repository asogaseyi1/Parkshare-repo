// src/pages/Dashboard.tsx
import React from 'react';
import NavBar from '../components/Navbar';

const Dashboard: React.FC = () => {
  const username = localStorage.getItem('userName') || 'Guest';

  return (
    <>
      <NavBar />
      <div style={{ padding: '2rem' }}>
        <h2>Hi {username}!</h2>
      </div>
    </>
  );
};

export default Dashboard;
