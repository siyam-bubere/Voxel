import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

import './LandingPage.css';
import './Authentication.css';
import logo from '/logo.png';
import { AuthContext } from '../contexts/AuthContext.jsx';

const muiThemeFallback = createTheme({
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
});

export default function Authentication() {
  const navigate = useNavigate();

  const [formState, setFormState] = React.useState(0);
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [open, setOpen] = React.useState(false);

  const { handleRegister, handleLogin, isAuthenticated } = React.useContext(AuthContext);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/home');
    }
  }, [isAuthenticated, navigate]);

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      if (formState === 0) {
        await handleLogin(username, password);
        setMessage("Welcome back to Voxel!");
        setOpen(true);

        setUsername('');
        setPassword('');
        setEmail('');
      } else if (formState === 1) {
        await handleRegister(email, username, password);

        setMessage("Account created successfully! Please sign in.");
        setOpen(true);

        setUsername('');
        setPassword('');
        setEmail('');

        setFormState(0);
      }
    } catch (err) {
      console.error(err);
      const errMessage = err?.response?.data?.message || err?.message || "An unexpected system error occurred.";
      setError(errMessage);
      setMessage(errMessage);
      setOpen(true);
    }
  };

  return (
    <ThemeProvider theme={muiThemeFallback}>
      <div className="landingPageContainer">
        <CssBaseline />

        <nav className="navbar">
          <div className="navHeader">
            <img src={logo} alt="Voxel Logo" className="navLogo" />
          </div>
          <div className="navList">
            <a href="/home" className="navLink">Home</a>
            <a href="#guest" className="navLink">Join as Guest</a>
            <a href="/privacy" className="navLink">Privacy Policy</a>
            <a href="/terms" className="navLink">Terms</a>
            
            <a href="#register"
              className="navLink"
              onClick={(e) => { e.preventDefault(); setFormState(1); }}
            >
              Register
            </a>
          </div>
        </nav>

        <div className="heroContent authOverride">
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
          </div>

          <div className="heroRight authFormWrapper">
            <div className="authFormCard">
              <Avatar className="auth-avatar">
                <LockOutlinedIcon fontSize="small" />
              </Avatar>

              <div className="auth-toggle-container">
                <Button
                  variant={formState === 0 ? 'contained' : "text"}
                  onClick={() => setFormState(0)}
                  className="auth-toggle-btn"
                >
                  Log In
                </Button>

                <Button
                  variant={formState === 1 ? 'contained' : "text"}
                  onClick={() => setFormState(1)}
                  className="auth-toggle-btn"
                >
                  Register
                </Button>
              </div>

              {formState === 0 ? (
                <>
                  <Typography component="h1" variant="h4" className="auth-title">
                    Sign in to Voxel
                  </Typography>
                  <Typography variant="body2" className="auth-subtitle">
                    Welcome back! Please enter your details.
                  </Typography>
                </>
              ) : (
                <>
                  <Typography component="h1" variant="h4" className="auth-title">
                    Sign Up into Voxel
                  </Typography>
                  <Typography variant="body2" className="auth-subtitle">
                    Welcome to Voxel! Please enter your details.
                  </Typography>
                </>
              )}

              <Box component="form" noValidate onSubmit={handleSubmit} sx={{ width: '100%' }}>
                <div style={{
                  height: formState === 1 ? '62px' : '0px',
                  opacity: formState === 1 ? 1 : 0,
                  visibility: formState === 1 ? 'visible' : 'hidden',
                  transition: 'all 0.2s ease-in-out',
                  overflow: 'hidden'
                }}>
                  <TextField
                    required={formState === 1}
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    className="voxel-custom-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <TextField
                  required
                  fullWidth
                  id="username"
                  label="Username"
                  name="username"
                  autoComplete="username"
                  className="voxel-custom-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />

                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete={formState === 0 ? "current-password" : "new-password"}
                  className="voxel-custom-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5, mb: 0.5 }}>
                  <FormControlLabel
                    control={<Checkbox value="remember" className="auth-checkbox" />}
                    label="Remember me"
                    className="auth-checkbox-label"
                  />
                  {formState === 0 && (
                    <Link href="#" variant="body2" className="auth-link-secondary">
                      Forgot password?
                    </Link>
                  )}
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  className="auth-submit-btn"
                >
                  {formState === 0 ? 'Sign In' : 'Sign Up'}
                </Button>

                <Box sx={{ textAlign: 'center' }}>
                  <Link
                    component="button"
                    type="button"
                    variant="body2"
                    className="auth-link-primary"
                    onClick={() => setFormState(formState === 0 ? 1 : 0)}
                  >
                    {formState === 0
                      ? "Don't have an account? Sign Up"
                      : "Already have an account? Sign In"
                    }
                  </Link>
                </Box>
              </Box>
            </div>
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

      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        message={message}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{
          content: {
            className: error ? 'voxel-snackbar-error' : 'voxel-snackbar-success'
          }
        }}
      />
    </ThemeProvider>
  );
}