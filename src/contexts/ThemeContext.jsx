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
  // Load theme preference from localStorage, default to 'light'
  const [mode, setMode] = useState(() => {
    try {
      const stored = localStorage.getItem('themeMode');
      return stored === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
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

  // Update CSS custom properties when theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.style.setProperty('--color-bg', '#1e2939');
      root.style.setProperty('--color-surface', '#2a3647');
      root.style.setProperty('--color-text', '#ffffff');
      root.style.setProperty('--color-text-light', '#a0a8b3');
    } else {
      root.style.setProperty('--color-bg', '#f5f5f5');
      root.style.setProperty('--color-surface', '#ffffff');
      root.style.setProperty('--color-text', '#1e2939');
      root.style.setProperty('--color-text-light', '#4a5568');
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
          // Light theme - clean and bright, inverse of dark mode
          mode: 'light',
          primary: {
            main: '#18a071', // Darker teal for better contrast
            light: '#1db584',
            dark: '#0f7a55',
          },
          secondary: {
            main: '#ff8c00', // Orange accent
            light: '#ffa333',
            dark: '#cc7000',
          },
          background: {
            default: '#f5f5f5', // Light gray background (clean, neutral)
            paper: '#ffffff', // White for cards and surfaces
          },
          text: {
            primary: '#1e2939', // Dark text (inverse of dark mode background)
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
            defaultProps: {
              elevation: 0,
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
            defaultProps: {
              elevation: 0,
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: 'none',
                },
                '&:active': {
                  boxShadow: 'none',
                },
              },
              containedPrimary: mode === 'dark' ? {
                backgroundColor: '#1db584',
                '&:hover': {
                  backgroundColor: '#18a071',
                },
                '&:active': {
                  backgroundColor: '#0f7a55',
                },
              } : {
                backgroundColor: '#18a071',
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: '#0f7a55',
                },
                '&:active': {
                  backgroundColor: '#0c5f42',
                },
              },
              containedSecondary: mode === 'dark' ? {
                backgroundColor: '#ff8c00',
                '&:hover': {
                  backgroundColor: '#cc7000',
                },
                '&:active': {
                  backgroundColor: '#a65900',
                },
              } : {
                backgroundColor: '#ff8c00',
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: '#cc7000',
                },
                '&:active': {
                  backgroundColor: '#a65900',
                },
              },
            },
            defaultProps: {
              disableElevation: true,
              disableRipple: true,
            },
          },
          MuiIconButton: {
            defaultProps: {
              disableRipple: true,
            },
          },
          MuiTab: {
            styleOverrides: {
              root: {
                '&.Mui-selected': {
                  // Keep color change for selected state
                },
              },
            },
            defaultProps: {
              disableRipple: true,
            },
          },
          MuiTabs: {
            styleOverrides: {
              root: {
                // Keep the indicator animation
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
