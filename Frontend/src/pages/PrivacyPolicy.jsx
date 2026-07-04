import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LegalPages.css';
import logo from '/logo.png';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="legalPageContainer">
      <nav className="navbar">
        <div className="navHeader" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="Voxel Logo" className="navLogo" />
          <span className="navBrandText">Meet</span>
        </div>
        <div className="navList">
          <button className="navBackBtn" onClick={() => navigate(-1)}>Back</button>
        </div>
      </nav>

      <main className="legalContentWrapper">
        <header className="legalHeader">
          <h1>Privacy Policy</h1>
          <p className="lastUpdated">Last Updated: July 2026</p>
        </header>

        <section className="legalSection">
          <p className="introText">
            Welcome to Voxel. We are committed to protecting your personal information and your right to privacy. 
            This Privacy Policy explains how we collect, use, and safeguard your data when you use our WebRTC-powered video collaboration platform.
          </p>
        </section>

        <section className="legalSection">
          <h2>1. Information We Collect</h2>
          <h3>a. Account Metadata</h3>
          <p>When you register an account, we collect credentials such as your username, encrypted password (via bcrypt), and email address to manage secure sessions.</p>
          
          <h3>b. Meeting & Connection Data</h3>
          <p>We generate and store self-contained alphabetic meeting codes. While our peer-to-peer audio-video streams are established directly between users using WebRTC mesh protocols, connection signaling data passes through our secure Node.js servers.</p>
        </section>

        <section className="legalSection">
          <h2>2. How We Use Your Data</h2>
          <ul>
            <li>To provision, authenticate, and secure your account access.</li>
            <li>To authorize platform resource usage via stateless JSON Web Tokens (JWT).</li>
            <li>To establish real-time WebSockets connections for room synchronization.</li>
          </ul>
        </section>

        <section className="legalSection">
          <h2>3. Data Retention</h2>
          <p>
            Voxel leverages volatile session configurations. Meeting space records committed to our databases are governed by auto-expiring TTL (Time-To-Live) indexes, which permanently scrub room footprints out of MongoDB exactly 24 hours after creation.
          </p>
        </section>

        <section className="legalSection">
          <h2>4. Security Standards</h2>
          <p>
            We implement industry-standard practices, including field-level password hashing and mandatory JWT payload verification across protected endpoints, to prevent unauthorized system breaches.
          </p>
        </section>

        <section className="legalSection">
          <h2>5. Contact Us</h2>
          <p>If you have any questions about this policy, please reach out to our team at support@voxel.io.</p>
        </section>
      </main>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Voxel. All rights reserved.</p>
      </footer>
    </div>
  );
}