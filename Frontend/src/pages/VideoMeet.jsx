import React, { useEffect, useRef, useState, useMemo, useContext } from 'react';
import './VideoMeet.css';
import { TextField, Button } from '@mui/material';
import { io } from 'socket.io-client';
import { useParams, useNavigate } from 'react-router-dom';
import logo from '/logo.png';
import { AuthContext } from '../contexts/AuthContext';

// --- DYNAMIC SERVER ROUTING UTILITY ---
// Automatically targets localhost or your public backend ngrok tunnel instance
const getBackendUrl = () => {
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "http://localhost:8000";
  }
  // 💻 PASTE YOUR BACKEND NGROK LINK HERE WHEN TESTING FROM MOBILE DEVICES:
  return "http://192.168.137.1:8000"; 
};

const server_url = getBackendUrl();

// const peerConfigConnections = {
//   "iceServers" : [
//     {"urls": "stun:stun.l.google.com:19302"},
//     {"urls": "stun:stun1.l.google.com:19302"} // Fallback STUN candidate for mobile network traversal
//   ]
// };

const peerConfigConnections = {
  "iceServers": [
    { "urls": "stun:stun.l.google.com:19302" },
    { "urls": "stun:stun1.l.google.com:19302" },
    { "urls": "stun:stun2.l.google.com:19302" },
    { "urls": "stun:stun3.l.google.com:19302" },
    { "urls": "stun:stun4.l.google.com:19302" }
  ]
};

function calculateBestFitLayout(containerWidth, containerHeight, tileCount, aspectRatio, gap) {
  if (!containerWidth || !containerHeight || tileCount < 1) {
    return { cols: 1, rows: 1, width: 0, height: 0 };
  }
  let best = { cols: 1, rows: tileCount, width: 0, height: 0, area: 0 };
  for (let cols = 1; cols <= tileCount; cols++) {
    const rows = Math.ceil(tileCount / cols);
    const availWidth = (containerWidth - gap * (cols - 1)) / cols;
    const availHeight = (containerHeight - gap * (rows - 1)) / rows;
    if (availWidth <= 0 || availHeight <= 0) continue;
    let width = availWidth;
    let height = width / aspectRatio;
    if (height > availHeight) {
      height = availHeight;
      width = height * aspectRatio;
    }
    const area = width * height;
    if (area > best.area) {
      best = { cols, rows, width, height, area };
    }
  }
  return best;
}

export default function VideoMeet() {
  const { url } = useParams();
  const navigate = useNavigate();

  var socketRef = useRef();
  let socketIdRef = useRef();
  let localVideoRef = useRef();
  const videoGridRef = useRef(null);
  const chatMessagesEndRef = useRef(null);

  const connectionsRef = useRef({});
  const videoRef = useRef([]);
  const {token} = useContext(AuthContext);

  let [videoAvailable, setVideoAvailable] = useState(false);
  let [audioAvailable, setAudioAvailable] = useState(false);
  let [video, setVideo] = useState();
  let [audio, setAudio] = useState();
  let [screen, setScreen] = useState();
  let [showChat, setShowChat] = useState(false); 
  let [screenAvailable, setScreenAvailable] = useState(false);
  let [messages, setMessages] = useState([]);
  let [message, setMessage] = useState("");
  let [newMessages, setNewMessages] = useState(0);
  let [askForUsername, setAskForUsername] = useState(true);
  let [username, setUsername] = useState("");
  let [videos, setVideos] = useState([]);
  let [currentTime, setCurrentTime] = useState(new Date());
  let [usernames, setUsernames] = useState({});
  let [copied, setCopied] = useState(false);
  const usernameRef = useRef("");
  let [videoAspectRatio, setVideoAspectRatio] = useState(16 / 9);
  let [gridSize, setGridSize] = useState({ width: 0, height: 0 });
  const screenStreamRef = useRef(null);
  const cameraStreamRef = useRef(null);

  useEffect(() => {
    const verifyRoomIntegrity = async () => {
      const codeRegex = /^[a-z0-9]{3}-[a-z0-9]{3}-[a-z0-9]{3}$/;
      if (!url || !codeRegex.test(url.toLowerCase().trim())) {
        navigate('/not-found', { replace: true });
        return;
      }
      try {
        const response = await fetch(`${server_url}/api/v1/meetings/verify/${url}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (!response.ok || !data.exists) {
          navigate('/not-found', { replace: true });
        }
      } catch (error) {
        console.error("Signaling firewall verification failure:", error);
      }
    };
    verifyRoomIntegrity();
  }, [url, navigate]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    usernameRef.current = username;
  }, [username]);

  useEffect(() => {
    setScreenAvailable(!!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia));
  }, []);

  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const el = videoGridRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setGridSize((prev) => (
        prev.width === width && prev.height === height ? prev : { width, height }
      ));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [showChat, videos]); 

  useEffect(() => {
    if (!video) return;
    const settings = typeof video.getSettings === 'function' ? video.getSettings() : null;
    if (settings && settings.width && settings.height) {
      setVideoAspectRatio(settings.width / settings.height);
    }
  }, [video]);

  const remoteCount = useMemo(
    () => videos.filter((v) => v.socketId !== socketIdRef.current).length,
    [videos]
  );
  const tileCount = remoteCount + 1;
  const tileGap = 12;
  const tileLayout = useMemo(
    () => calculateBestFitLayout(gridSize.width, gridSize.height, tileCount, videoAspectRatio, tileGap),
    [gridSize, tileCount, videoAspectRatio]
  );
  const tileStyle = tileLayout.width
    ? { width: `${tileLayout.width}px`, height: `${tileLayout.height}px` }
    : { width: '100%', height: '100%', maxWidth: 480 };

  const getPermissions = async () => {
    try {
      const userStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      if (userStream) {
        setVideoAvailable(true);
        setAudioAvailable(true);
        setVideo(userStream.getVideoTracks()[0]);
        setAudio(userStream.getAudioTracks()[0]);
        window.localStream = userStream;
        cameraStreamRef.current = userStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = userStream;
        }
      }
    } catch (err) {
      console.error("Media permission denied:", err);
      setVideoAvailable(false);
      setAudioAvailable(false);
    }
  };

  let getUserMediaSuccess = (stream) => {
    const isScreenSharing = !!screenStreamRef.current;
    try {
      if (window.localStream && window.localStream !== stream) {
        window.localStream.getTracks().forEach(track => track.stop());
      }
    } catch (err) {
      console.log(err);
    }
    window.localStream = stream;
    if (!isScreenSharing) {
      cameraStreamRef.current = stream;
    }
    if (localVideoRef.current && !isScreenSharing) {
      localVideoRef.current.srcObject = stream;
    }
    for (let id in connectionsRef.current) {
      if (id === socketIdRef.current) continue;
      stream.getTracks().forEach((track) => {
        if (isScreenSharing && track.kind === 'video') return;
        const senders = connectionsRef.current[id].getSenders();
        const sender = senders.find((s) => s.track && s.track.kind === track.kind);
        if (sender) {
          sender.replaceTrack(track);
        } else {
          connectionsRef.current[id].addTrack(track, stream);
        }
      });
      connectionsRef.current[id].createOffer().then((description) => {
        connectionsRef.current[id].setLocalDescription(description)
        .then(() => {
          socketRef.current.emit('signal', id, JSON.stringify({'sdp': connectionsRef.current[id].localDescription, 'username': usernameRef.current}));
        })
        .catch((err) => console.log(err));
      });
    }

    stream.getTracks().forEach(track => {
      track.onended = () => {
        setVideoAvailable(false);
        setAudioAvailable(false);
        try {
          if (localVideoRef.current && localVideoRef.current.srcObject) {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach(t => t.stop());
          }
        } catch (err) {
          console.log(err);
        }
        let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
        window.localStream = blackSilence();
        for (let id in connectionsRef.current) {
          window.localStream.getTracks().forEach(t => {
            const senders = connectionsRef.current[id].getSenders();
            const existingSender = senders.find(s => s.track && s.track.kind === t.kind);
            if (existingSender) {
              existingSender.replaceTrack(t);
            } else {
              connectionsRef.current[id].addTrack(t, window.localStream);
            }
          });
          connectionsRef.current[id].createOffer().then((description) => {
            connectionsRef.current[id].setLocalDescription(description)
            .then(() => {
              socketRef.current.emit('signal', id, JSON.stringify({'sdp': connectionsRef.current[id].localDescription, 'username': usernameRef.current}));
            })
            .catch((err) => console.log(err));
          });
        }
      };
    });
  };

  let silence = () => {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], {enabled: false});
  };

  let black = ({width = 640, height = 480} = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), {width, height});
    canvas.getContext('2d').fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], {enabled: false});
  };

  let getUserMedia = async () => {
    if (videoAvailable || audioAvailable) {
      try {
        let stream = window.localStream;
        if (!stream || stream.getTracks().length === 0) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: videoAvailable,
            audio: audioAvailable
          });
          window.localStream = stream;
        }
        if (localVideoRef.current) {
          if (localVideoRef.current.srcObject !== stream) {
            localVideoRef.current.srcObject = stream;
          }
          localVideoRef.current.play().catch(e => {
            if (e.name !== 'AbortError') {
              console.error("Video playback failed encountered:", e);
            }
          });
        }
        getUserMediaSuccess(stream);
      } catch (e) {
        console.error("Error setting up dynamic media stream:", e);
      }
    } else {
      try {
        if (localVideoRef.current && localVideoRef.current.srcObject) {
          let tracks = localVideoRef.current.srcObject.getTracks();
          tracks.forEach(track => track.stop());
          localVideoRef.current.srcObject = null;
        }
      } catch (e) {
        console.error("Error stopping media tracks:", e);
      }
    }
  };

  let stopScreenShare = () => {
    const screenStream = screenStreamRef.current;
    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    const cameraStream = cameraStreamRef.current;
    const cameraTrack = cameraStream ? cameraStream.getVideoTracks()[0] : null;

    for (let id in connectionsRef.current) {
      const senders = connectionsRef.current[id].getSenders();
      const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
      if (videoSender) {
        videoSender.replaceTrack(cameraTrack || null).catch((err) => console.log(err));
      }
      connectionsRef.current[id].createOffer().then((description) => {
        connectionsRef.current[id].setLocalDescription(description).then(() => {
          socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connectionsRef.current[id].localDescription, 'username': usernameRef.current }));
        }).catch((err) => console.log(err));
      });
    }
    window.localStream = cameraStream || window.localStream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = cameraStream || null;
    }
    setScreen(false);
  };

  let startScreenShare = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const screenTrack = displayStream.getVideoTracks()[0];
      screenStreamRef.current = displayStream;

      if (window.localStream && window.localStream.getVideoTracks().length) {
        cameraStreamRef.current = window.localStream;
      }
      for (let id in connectionsRef.current) {
        const senders = connectionsRef.current[id].getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(screenTrack).catch((err) => console.log(err));
        } else {
          connectionsRef.current[id].addTrack(screenTrack, displayStream);
        }
        connectionsRef.current[id].createOffer().then((description) => {
          connectionsRef.current[id].setLocalDescription(description).then(() => {
            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connectionsRef.current[id].localDescription, 'username': usernameRef.current }));
          }).catch((err) => console.log(err));
        });
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = displayStream;
      }
      screenTrack.onended = () => stopScreenShare();
      setScreen(true);
    } catch (err) {
      console.log("Screen share not started:", err);
    }
  };

  const handleToggleScreenShare = () => {
    if (screen) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  };

  useEffect(() => {
    if (videoAvailable !== undefined && audioAvailable !== undefined) {
      getUserMedia();
    }
  }, [audioAvailable, videoAvailable]);

  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);
    if (fromId !== socketIdRef.current && signal.username) {
      setUsernames((prev) => (
        prev[fromId] === signal.username ? prev : { ...prev, [fromId]: signal.username }
      ));
    }
    if (fromId !== socketIdRef.current && connectionsRef.current[fromId]) {
      if (signal.sdp) {
        connectionsRef.current[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
          if (connectionsRef.current[fromId].remoteDescription.type === 'offer') {
            connectionsRef.current[fromId].createAnswer().then((description) => {
              connectionsRef.current[fromId].setLocalDescription(description).then(() => {
                socketRef.current.emit('signal', fromId, JSON.stringify({'sdp': connectionsRef.current[fromId].localDescription, 'username': usernameRef.current}));
              }).catch((err) => console.log(err));
            }).catch((err) => console.log(err));
          }
        });
      }
      if (signal.ice) {
        connectionsRef.current[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(err => console.log(err));
      }
    }
  };

  let addMessage = (data, sender, socketId) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data, socketId: socketId }
    ]);
    if (socketId !== socketIdRef.current && !showChat) {
      setNewMessages((prev) => prev + 1);
    }
  };

  let sendMessage = () => {
    if (message.trim() === "") return;
    socketRef.current.emit('chat-message', message, username);
    setMessage("");
  };

  let connectToSocketServer = () => {
    // Force direct WebSocket transport connection arrays 
    socketRef.current = io.connect(server_url, { secure: true, transports: ['websocket'] });
    socketRef.current.on('signal', gotMessageFromServer);

    socketRef.current.on('connect', () => {
      // ✓ FIXED: Pass the raw unique token code (url) instead of different absolute page links
      socketRef.current.emit('join-call', url.trim().toLowerCase());
      socketIdRef.current = socketRef.current.id;
      socketRef.current.on('chat-message', addMessage);

      socketRef.current.on('user-left', (id) => {
        setVideos((videos) => videos.filter((v) => v.socketId !== id));
        if(connectionsRef.current[id]) {
          connectionsRef.current[id].close();
          delete connectionsRef.current[id];
        }
      });

      socketRef.current.on('user-joined', (id, clients) => {
        clients.forEach((socketListId) => {
          if (socketListId === socketIdRef.current) return;
          if (!connectionsRef.current[socketListId]) {
            connectionsRef.current[socketListId] = new RTCPeerConnection(peerConfigConnections);
          }

          connectionsRef.current[socketListId].onicecandidate = (event) => {
            if(event.candidate != null) {
              socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate, 'username': usernameRef.current }));
            }
          };

          connectionsRef.current[socketListId].ontrack = (event) => {
            setVideos((currentVideos) => {
              const videoExists = currentVideos.some(v => v.socketId === socketListId);
              if (videoExists) {
                return currentVideos.map(v =>
                  v.socketId === socketListId ? { ...v, stream: event.streams[0] } : v
                );
              } else {
                const updatedList = [...currentVideos, { socketId: socketListId, stream: event.streams[0] }];
                videoRef.current = updatedList;
                return updatedList;
              }
            });
          };

          if(window.localStream !== undefined && window.localStream !== null) {
            window.localStream.getTracks().forEach(track => {
              const senders = connectionsRef.current[socketListId].getSenders();
              const senderExists = senders.find(s => s.track && s.track.kind === track.kind);
              if (senderExists) {
                senderExists.replaceTrack(track);
              } else {
                connectionsRef.current[socketListId].addTrack(track, window.localStream);
              }
            });
          } else {
            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            window.localStream.getTracks().forEach(track => {
              const senders = connectionsRef.current[socketListId].getSenders();
              const senderExists = senders.find(s => s.track && s.track.kind === track.kind);
              if (senderExists) {
                senderExists.replaceTrack(track);
              } else {
                connectionsRef.current[socketListId].addTrack(track, window.localStream);
              }
            });
          }
        });

        if(id === socketIdRef.current) {
          for (let id2 in connectionsRef.current) {
            if(id2 === socketIdRef.current) continue;
            if (window.localStream) {
              window.localStream.getTracks().forEach(track => {
                const senders = connectionsRef.current[id2].getSenders();
                const senderExists = senders.find(s => s.track && s.track.kind === track.kind);
                if (senderExists) {
                  senderExists.replaceTrack(track);
                } else {
                  connectionsRef.current[id2].addTrack(track, window.localStream);
                }
              });
            }
            connectionsRef.current[id2].createOffer().then((description) => {
              connectionsRef.current[id2].setLocalDescription(description)
              .then(() => {
                socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp' : connectionsRef.current[id2].localDescription, 'username': usernameRef.current }));
              })
              .catch(err => console.log(err));
            });
          }
        }
      });
    });
  };

  const handleConnect = () => {
    if (username.trim() !== "") {
      setAskForUsername(false);
      setTimeout(() => {
        if (window.localStream && localVideoRef.current) {
          localVideoRef.current.srcObject = window.localStream;
        }
        connectToSocketServer();
      }, 100);
    }
  };

  const toggleChatPanel = () => {
    setShowChat(!showChat);
    if (!showChat) {
      setNewMessages(0);
    }
  };

  const handleCopyToClipboard = () => {
    if (!url) return;
    navigator.clipboard.writeText(url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => console.error("Could not copy room text: ", err));
  };  

  return (
    <div className="meet-app-container">
      {askForUsername === true ? (
        <div className="lobby-outer-container">
          <header className="global-app-header">
            <div className="brand-logo-block">
              <img src={logo} alt="Voxel Logo" className="app-main-logo" />
              <span className="brand-composed-text">
                <span className="app-subtitle"> Meet</span>
              </span>
            </div>
            <div className="header-meta-right">
              <span className="meta-time-string">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {' • '}
                {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </header>

          <div className="lobby-wrapper">
            <div className="lobby-content">
              <div className="lobby-preview-box">
                {videoAvailable ? (
                  <video ref={localVideoRef} autoPlay muted playsInline className="lobby-video" />
                ) : (
                  <div className="lobby-video-placeholder">
                    <svg
                        viewBox="0 0 24 24"
                        width="36"
                        height="36"
                        fill="currentColor"
                    >
                        <path d="M3.27 2L2 3.27 4.73 6H4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 001.47-.64L20.73 21 22 19.73 3.27 2zM16 6h-5.73L16 11.73V6zm5 0l-4 3.5v2.23L21 16V6z"/>
                    </svg>
                    <span>Camera is off</span>
                  </div>
                )}
                <div className="lobby-preview-actions">
                  <button
                    className={`lobby-mini-btn ${!audioAvailable ? 'disabled' : ''}`}
                    onClick={() => setAudioAvailable(!audioAvailable)}
                    aria-label={audioAvailable ? 'Mute microphone' : 'Unmute microphone'}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                  </button>
                  <button
                    className={`lobby-mini-btn ${!videoAvailable ? 'disabled' : ''}`}
                    onClick={() => setVideoAvailable(!videoAvailable)}
                    aria-label={videoAvailable ? 'Turn off camera' : 'Turn on camera'}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55-.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
                  </button>
                </div>
              </div>

              <div className="lobby-setup-box">
                <h2>Ready to join?</h2>
                <div className="lobby-form">
                  <TextField
                    id='outlined-basic'
                    label='Your name'
                    variant="outlined"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    fullWidth
                    className="lobby-input"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleConnect(); }}
                  />
                  <Button
                    variant='contained'
                    onClick={handleConnect}
                    disabled={!username.trim()}
                    className="lobby-btn"
                  >
                    Join now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="main-meet-layout">
          <header className="global-app-header room-header-override">
            <div className="brand-logo-block">
              <img src={logo} alt="Voxel Logo" className="app-main-logo" />
              <span className="brand-composed-text">
                <span className="app-subtitle"> Meet</span>
              </span>
            </div>
            <div className="header-meta-right">
              <span className="meta-time-string">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </header>

          <div className="meet-workspace-core">
            <div className="video-grid-container" ref={videoGridRef}>
              <div className="video-card local" style={tileStyle}>
                {videoAvailable ? (
                  <video ref={localVideoRef} autoPlay muted playsInline />
                ) : (
                  <div className="grid-avatar-placeholder">
                    <div className="avatar-circle">{username.charAt(0).toUpperCase()}</div>
                  </div>
                )}
                <div className="video-label">{username} (You)</div>
              </div>

              {videos
                .filter((v) => v.socketId !== socketIdRef.current)
                .map((v) => (
                  <div className="video-card" key={v.socketId} style={tileStyle}>
                    <video
                      ref={(el) => { if (el && el.srcObject !== v.stream) el.srcObject = v.stream; }}
                      autoPlay
                      playsInline
                    />
                    <div className="video-label">
                      {usernames[v.socketId] || `Guest ${v.socketId.substring(0, 4)}`}
                    </div>
                  </div>
                ))}
            </div>

            {showChat && (
              <div className="meet-sidebar-chat-panel">
                <div className="chat-panel-header">
                  <h3>In-call messages</h3>
                  <button className="chat-close-icon-btn" onClick={toggleChatPanel} aria-label="Close chat">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                  </button>
                </div>
                <div className="chat-disclaimer-info">
                  Messages can only be seen by people in the call and are deleted when the call ends.
                </div>
                <div className="chat-messages-scroll-area">
                  {messages.map((msg, index) => {
                    const isSelf = msg.socketId === socketIdRef.current;
                    return (
                      <div key={index} className={`chat-message-bubble-row ${isSelf ? 'self-author' : ''}`}>
                        <div className="chat-message-meta">
                          <span className="message-sender-name">{isSelf ? "You" : msg.sender}</span>
                        </div>
                        <div className="chat-message-payload-text">{msg.data}</div>
                      </div>
                    );
                  })}
                  <div ref={chatMessagesEndRef} />
                </div>
                <div className="chat-input-composer-tray">
                  <input
                    type="text"
                    placeholder="Send a message to everyone"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
                  />
                  <button 
                    className={`chat-submit-action-btn ${message.trim() === "" ? 'barren' : ''}`}
                    onClick={sendMessage}
                    disabled={message.trim() === ""}
                    aria-label="Send message"
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bottom-controls-bar">
            <div className="meeting-info-wrapper">
              <span className="room-id-tag">Meeting Code : {url}</span>
              <button 
                onClick={handleCopyToClipboard}
                className={`copy-room-action-btn ${copied ? 'copied' : ''}`}
                title={copied ? "Copied!" : "Copy code to clipboard"}
                aria-label="Copy meeting code"
              >
                {copied ? (
                  <svg className="copy-btn-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                ) : (
                  <svg className="copy-btn-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                )}
              </button>
            </div>

            <div className="action-buttons">
              <button
                className={`control-btn ${!audioAvailable ? 'disabled' : ''}`}
                onClick={() => setAudioAvailable(!audioAvailable)}
                aria-label={audioAvailable ? 'Mute microphone' : 'Unmute microphone'}
              >
                {audioAvailable ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c1.66-.24 3.14-.9 4.38-1.81l2.35 2.35 1.27-1.27L4.27 3z"/></svg>
                )}
              </button>

              <button
                className={`control-btn ${!videoAvailable ? 'disabled' : ''}`}
                onClick={() => setVideoAvailable(!videoAvailable)}
                aria-label={videoAvailable ? 'Turn off camera' : 'Turn on camera'}
              >
                {videoAvailable ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55-.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M18 10.5V6c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2v-4.5l4 4v-11l-4-4zM16 18H5V6h11v12z"/>
                  </svg>
                )}
              </button>

              {screenAvailable && (
                <button
                  className={`control-btn ${screen ? 'active' : ''}`}
                  onClick={handleToggleScreenShare}
                  aria-label={screen ? 'Stop screen sharing' : 'Share your screen'}
                  title={screen ? 'Stop sharing' : 'Present now'}
                >
                  {screen ? (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/><path d="M8.5 15l2.5-2.94L12.71 14.4 15.5 11l3.5 4H8.5z" opacity=".6"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6zm7 1h2v3h3v2h-3v3h-2v-3H8v-2h3V7z"/></svg>
                  )}
                </button>
              )}

              <button className="control-btn end-call-btn" onClick={() => navigate('/')} aria-label="Leave call">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.996.996 0 0 1-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.68-1.36-2.66-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/></svg>
              </button>
            </div>

            <div className="side-panel-toggles">
              <button 
                className={`panel-icon-btn ${showChat ? 'active' : ''} ${newMessages > 0 ? 'has-badge' : ''}`} 
                onClick={toggleChatPanel} 
                title="Chat"
                data-badge={newMessages}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg>
              </button>

              <button className="panel-icon-btn" title="Participants">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.34 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}