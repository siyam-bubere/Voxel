import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LegalPages.css';
import logo from '/logo.png';

export default function TermsOfService() {
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
          <h1>Terms of Service</h1>
          <p className="lastUpdated">Last Updated: July 2026</p>
        </header>

        <section className="legalSection">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Voxel collaboration platform, you agree to be bound by these Terms of Service. 
            If you do not agree with any part of these terms, you are prohibited from utilizing our communication services.
          </p>
        </section>

        <section className="legalSection">
          <h2>2. User Accounts & Security</h2>
          <p>
            To deploy live rooms, authentication is required. You are entirely responsible for maintaining the 
            confidentiality of your access tokens and account properties. Any malicious usage or generation of arbitrary 
            tokens bypassing route protections will result in immediate termination of access privileges.
          </p>
        </section>

        <section className="legalSection">
          <h2>3. Acceptable Platform Use</h2>
          <p>You agree not to use Voxel's real-time channels to:</p>
          <ul>
            <li>Disrupt or flood signaling sockets or media mesh channels.</li>
            <li>Inject malicious scripts, automated request loops, or brute-force API paths.</li>
            <li>Interfere with the dynamic generation parameters of purely alphabetic room routing mechanisms.</li>
          </ul>
        </section>

        <section className="legalSection">
          <h2>4. Room Lifecycle Policy</h2>
          <p>
            Voxel room provisions are ephemeral spaces meant for active, live collaboration. The platform reserves the right 
            to scrub inactive meeting nodes automatically via our 24-hour database eviction policy.
          </p>
        </section>

        <section className="legalSection">
          <h2>5. Limitation of Liability</h2>
          <p>
            Voxel is provided "as is" without warranties of any kind. We are not liable for any network line timeouts, 
            WebRTC connection drops, signaling latency, or accidental data drops occurring within local test or development frameworks.
          </p>
        </section>
      </main>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Voxel. All rights reserved.</p>
      </footer>
    </div>
  );
}