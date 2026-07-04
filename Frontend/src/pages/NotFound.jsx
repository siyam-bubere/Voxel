import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="notFoundContainer">
      {/* Blurred background decorative waves matching your layout theme */}
      <div className="decorBlur circle1"></div>
      <div className="decorBlur circle2"></div>

      <div className="notFoundContent">
        <div className="voxelBrand">
          <span className="v">V</span>
          <span className="o">O</span>
          <span className="x">X</span>
          <span className="e">E</span>
          <span className="l">L</span>
          <span className="dot">.</span>
          <span className="meetTag">Meet</span>
        </div>

        <h1 className="errorCode">404</h1>
        <h2>Meeting Not Found</h2>
        
        <p className="errorDescription">
          The room code you entered doesn't exist, has expired, or the host has ended the session. 
          Please check the link configuration or return home to initialize a fresh session.
        </p>

        <div className="errorActionButtons">
          <button className="primaryHomeBtn" onClick={() => navigate('/')}>
            Return Home
          </button>
          <button className="secondaryCreateBtn" onClick={() => navigate('/')}>
            Create New Meeting
          </button>
        </div>
      </div>
    </div>
  );
}