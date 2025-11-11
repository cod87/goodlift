import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { createTheme } from '@mui/material/styles';

const ThemeContext = createContext();

/* eslint-disable react-refresh/only-export-components */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Load theme preference from localStorage, default to 'dark'
  const [mode, setMode] = useState(() => {
    try {
      const stored = localStorage.getItem('themeMode');
      return stored === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  // Save theme preference to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('themeMode', mode);
    } catch (e) {
      console.warn('Could not save theme preference', e);
    }
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'dark' ? 'light' : 'dark'));
  };

  // Create MUI theme based on mode
  const theme = useMemo(
    () =>
      createTheme({
        palette: mode === 'dark' ? {
          mode: 'dark',
          primary: {
            main: '#1db584', // Teal/Green Accent
            light: '#2dd099',
            dark: '#18a071',
          },
          secondary: {
            main: '#ff8c00', // Orange Button
            light: '#ffa333',
            dark: '#cc7000',
          },
          background: {
            default: '#1e2939', // Dark Background
            paper: '#2a3647', // Slightly lighter for cards
          },
          text: {
            primary: '#ffffff', // White Text
            secondary: '#a0a8b3', // Secondary Text
          },
          success: {
            main: '#1db584',
          },
          warning: {
            main: '#ff8c00',
          },
          error: {
            main: '#ef5350',
          },
          info: {
            main: '#6b8a9d',
          },
        } : {
          // Light theme with tan/beige colors from auth screen
          mode: 'light',
          primary: {
            main: '#18a071', // Darker teal for better contrast
            light: '#1db584',
            dark: '#0f7a55',
          },
          secondary: {
            main: '#ed3f27', // Red/orange accent
            light: '#ff6347',
            dark: '#cc3520',
          },
          background: {
            default: 'rgb(253, 244, 227)', // Tan/beige from auth screen
            paper: 'rgb(254, 230, 200)', // Slightly warmer for cards
          },
          text: {
            primary: '#1e2939', // Dark text
            secondary: '#4a5568', // Medium gray
          },
          success: {
            main: '#18a071',
          },
          warning: {
            main: '#ff8c00',
          },
          error: {
            main: '#ef5350',
          },
          info: {
            main: '#6b8a9d',
          },
        },
        typography: {
          fontFamily: "'Poppins', sans-serif",
          h1: { fontFamily: "'Montserrat', sans-serif", fontWeight: 800 },
          h2: { fontFamily: "'Montserrat', sans-serif", fontWeight: 800 },
          h3: { fontFamily: "'Montserrat', sans-serif", fontWeight: 700 },
          h4: { fontFamily: "'Montserrat', sans-serif", fontWeight: 700 },
          h5: { fontFamily: "'Montserrat', sans-serif", fontWeight: 700 },
          h6: { fontFamily: "'Montserrat', sans-serif", fontWeight: 700 },
        },
        components: {
          MuiCard: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              containedPrimary: mode === 'dark' ? {
                backgroundColor: '#1db584',
                '&:hover': {
                  backgroundColor: '#18a071',
                },
              } : {
                backgroundColor: '#18a071',
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: '#0f7a55',
                },
              },
              containedSecondary: mode === 'dark' ? {
                backgroundColor: '#ff8c00',
                '&:hover': {
                  backgroundColor: '#cc7000',
                },
              } : {
                backgroundColor: '#ed3f27',
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: '#cc3520',
                },
              },
            },
          },
        },
      }),
    [mode]
  );

  const value = {
    mode,
    toggleTheme,
    theme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
/* eslint-enable react-refresh/only-export-components */

export default ThemeContext;
