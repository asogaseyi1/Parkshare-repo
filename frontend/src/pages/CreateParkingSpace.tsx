import React from 'react';
import ParkingSpaceForm from '../components/ParkingSpaceForm';
import Navbar from '../components/Navbar';
import { IconSparkle } from '../components/Icons';
import './CreateParkingSpace.css';

const CreateParkingSpace: React.FC = () => (
  <div className="page">
    <Navbar backToDashboard />

    <div className="container container-wide">
      <header className="page-head">
        <div>
          <span className="page-head__eyebrow">
            <IconSparkle />
            New listing
          </span>
          <h1 className="page-head__title">List a parking space</h1>
          <p className="page-head__sub">
            Three short sections and your spot is on the map. You keep full control of the rate and
            the hours — change or unlist it whenever you like.
          </p>
        </div>
      </header>

      <ParkingSpaceForm />
    </div>
  </div>
);

export default CreateParkingSpace;
