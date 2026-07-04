import React, { useState, useEffect, useContext } from 'react';
import './LandingPage.css';
import logo from '/logo.png'; 
import mobileMockup from '/mobile.png'; 
import { AuthContext } from '../contexts/AuthContext';

const API_BASE_URL = 'http://192.168.1.16:8000/api/v1/meetings';

export default function LandingPage() {
  const [meetingCode, setMeetingCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showJoinButton, setShowJoinButton] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { token, handleLogout } = useContext(AuthContext);

  // Sanitizes and formats raw character keystrokes into the xxx-xxx-xxx alphabetic pattern
  const handleInputChange = (e) => {
    // CRITICAL FIX: Changed regex to allow ONLY letters (removes 0-9)
    let value = e.target.value.replace(/[^a-zA-Z]/g, '').toLowerCase();
    if (value.length > 9) value = value.slice(0, 9);

    const formatted = [];
    for (let i = 0; i < value.length; i++) {
      if (i === 3 || i === 6) formatted.push('-');
      formatted.push(value[i]);
    }
    
    const finalCode = formatted.join('');
    setMeetingCode(finalCode);
    setErrorMessage(''); 
    setShowJoinButton(false);
  };

  useEffect(() => {
    const verifyMeetingExists = async () => {
      if (!token) {
        setErrorMessage('You must be logged in to view this page.');
        return;
      }

      if (meetingCode.length === 11) {
        setIsLoading(true);
        try {
          const response = await fetch(`${API_BASE_URL}/verify/${meetingCode}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.status === 401) {
            setErrorMessage('Your session has timed out. Please sign in again.');
            handleLogout();
            return;
          }

          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            setShowJoinButton(false);
            setErrorMessage(`Server Error: Received status code ${response.status} instead of JSON.`);
            return;
          }

          const data = await response.json();

          if (response.ok && data.exists) {
            setShowJoinButton(true);
            setErrorMessage('');
          } else {
            setShowJoinButton(false);
            setErrorMessage(data.message || 'This meeting code does not exist.');
          }
        } catch (error) {
          setShowJoinButton(false);
          setErrorMessage('Server connection error. Unable to verify meeting.');
          console.error('Verification tracking error:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setShowJoinButton(false);
        if (meetingCode.length > 0 && meetingCode.length < 11) {
          setErrorMessage('');
        }
      }
    };

    const delayDebounceFn = setTimeout(() => {
      verifyMeetingExists();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [meetingCode, token, handleLogout]);

  const handleCreateMeeting = async () => {
    setIsLoading(true);
    setErrorMessage('');

    if (!token) {
      setErrorMessage('You must be logged in to create a meeting.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      
      if (response.status === 401) {
        setErrorMessage('Session expired or invalid. Please log in again.');
        handleLogout();
        return;
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textError = await response.text();
        console.error("Server returned non-JSON response structure:", textError);
        setErrorMessage(`Server Configuration Error: Received status code ${response.status}`);
        return;
      }

      const data = await response.json();

      if (response.ok && data.meetingCode) {
        setMeetingCode(data.meetingCode);
        setShowJoinButton(true);
        setErrorMessage('');
      } else {
        setErrorMessage(data.message || 'Failed to initialize a new room.');
      }
    } catch (error) {
      setErrorMessage('Network timeout. Server could not be reached.');
      console.error('Creation connection failure:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinMeeting = (e) => {
    e.preventDefault();
    if (showJoinButton && !isLoading) {
      window.location.href = `/room/${meetingCode}`;
    }
  };

  return (
    <div className="landingPageContainer">
      <nav className="navbar">
        <div className="navHeader">
          <img href="/home" src={logo} alt="Voxel Logo" className="navLogo" />
        </div>
        
        <div className="navList">
          <a href="/home" className="navLink">Join as Guest</a>
          <button className="loginButton" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="heroContent">
        <div className="heroLeft">
          <h1>
            Connecting, Creating, Collaborating,{' '}
            <span className="voxel-text">
              <span className="v">V</span>
              <span className="o">O</span>
              <span className="x">X</span>
              <span className="e">E</span>
              <span className="l">L</span>
              <span className="dot">.</span>
            </span>
          </h1>
          <p>Welcome to the future of Voxel.</p>

          <div className="meetActionsWrapper">
            <div className="meetActionsContainer">
              <button 
                className="newMeetingBtn" 
                onClick={handleCreateMeeting}
                disabled={isLoading}
              >
                <svg className="meetIcon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zM14 13h-3v3H9v-3H6v-2h3V8h2v3h3v2z"/>
                </svg>
                {isLoading && meetingCode.length === 0 ? 'Creating...' : 'New meeting'}
              </button>

              <form onSubmit={handleJoinMeeting} className="joinMeetingForm">
                <div className="inputWrapper">
                  <svg className="keyboardIcon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-1 10H5c-.55 0-1-.45-1-1s.45-1 1-1h14c.55 0 1 .45 1 1s-.45 1-1 1zm0-3H5c-.55 0-1-.45-1-1s.45-1 1-1h14c.55 0 1 .45 1 1s-.45 1-1 1zm0-3H5c-.55 0-1-.45-1-1s.45-1 1-1h14c.55 0 1 .45 1 1s-.45 1-1 1z"/>
                  </svg>
                  <input 
                    type="text" 
                    placeholder={isLoading ? "Verifying..." : "Enter a code or link"} 
                    value={meetingCode}
                    onChange={handleInputChange}
                    disabled={isLoading && meetingCode.length === 11}
                    className={`meetCodeInput ${errorMessage ? 'inputError' : ''}`}
                  />
                </div>
                
                {showJoinButton && (
                  <button type="submit" className="joinMeetBtn active" disabled={isLoading}>
                    Join
                  </button>
                )}
              </form>
            </div>

            {errorMessage && (
              <div className="meetErrorMessage">
                <svg className="errorIcon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        <div className="heroRight">
          <img src={mobileMockup} alt="Voxel Mobile App Mockup" className="mockupImage" />
        </div>
      </div>

      <footer className="footer">
        <div className="footerLeft">
          <p>&copy; {new Date().getFullYear()} Voxel. All rights reserved.</p>
        </div>
        <div className="footerRight">
          <a href="/privacy" className="footerLink">Privacy Policy</a>
          <a href="/terms" className="footerLink">Terms of Service</a>
          <a href="#contact" className="footerLink">Contact Support</a>
        </div>
      </footer>
    </div>
  );
}