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
      // Dark theme: Deep slate backgrounds with teal accent
      root.style.setProperty('--color-bg', '#1a202c');
      root.style.setProperty('--color-surface', '#2d3748');
      root.style.setProperty('--color-surface-elevated', '#374151');
      root.style.setProperty('--color-text', '#f7fafc');
      root.style.setProperty('--color-text-light', '#a0aec0');
      root.style.setProperty('--color-border', 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--color-primary', '#1db584');
      root.style.setProperty('--color-secondary', '#f6ad55');
    } else {
      // Light theme: White main background with subtle gray for surfaces
      root.style.setProperty('--color-bg', '#ffffff');
      root.style.setProperty('--color-surface', '#f8fafc');
      root.style.setProperty('--color-surface-elevated', '#f8fafc');
      root.style.setProperty('--color-text', '#1a202c');
      root.style.setProperty('--color-text-light', '#718096');
      root.style.setProperty('--color-border', 'rgba(0, 0, 0, 0.06)');
      root.style.setProperty('--color-primary', '#1db584');
      root.style.setProperty('--color-secondary', '#f6ad55');
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
            light: '#4fd1aa',
            dark: '#169b70',
            contrastText: '#ffffff',
          },
          secondary: {
            main: '#f6ad55', // Warm orange/yellow accent
            light: '#f8c77e',
            dark: '#dd9a4a',
            contrastText: '#1a202c',
          },
          background: {
            default: '#1a202c', // Deep slate background
            paper: '#2d3748', // Slate for cards
          },
          text: {
            primary: '#f7fafc', // Near-white text
            secondary: '#a0aec0', // Muted gray text
          },
          divider: 'rgba(255, 255, 255, 0.08)',
          success: {
            main: '#48bb78',
            light: '#68d391',
            dark: '#38a169',
          },
          warning: {
            main: '#f6ad55',
            light: '#f8c77e',
            dark: '#dd9a4a',
          },
          error: {
            main: '#fc8181',
            light: '#feb2b2',
            dark: '#e53e3e',
          },
          info: {
            main: '#63b3ed',
            light: '#90cdf4',
            dark: '#4299e1',
          },
        } : {
          // Light theme - clean minimalist design with white main background
          mode: 'light',
          primary: {
            main: '#1db584', // Teal accent
            light: '#4fd1aa',
            dark: '#169b70',
            contrastText: '#ffffff',
          },
          secondary: {
            main: '#f6ad55', // Warm orange/yellow accent
            light: '#f8c77e',
            dark: '#dd9a4a',
            contrastText: '#1a202c',
          },
          background: {
            default: '#ffffff', // White main background
            paper: '#f8fafc', // Very light gray for cards/surfaces for subtle contrast
          },
          text: {
            primary: '#1a202c', // Dark text
            secondary: '#718096', // Gray text
          },
          divider: 'rgba(0, 0, 0, 0.06)',
          success: {
            main: '#38a169',
            light: '#48bb78',
            dark: '#2f855a',
          },
          warning: {
            main: '#dd6b20',
            light: '#ed8936',
            dark: '#c05621',
          },
          error: {
            main: '#e53e3e',
            light: '#fc8181',
            dark: '#c53030',
          },
          info: {
            main: '#3182ce',
            light: '#4299e1',
            dark: '#2b6cb0',
          },
        },
        shape: {
          borderRadius: 12, // Increased border radius for minimalist look
        },
        typography: {
          fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          h1: { fontFamily: "'Montserrat', sans-serif", fontWeight: 700, letterSpacing: '-0.02em' },
          h2: { fontFamily: "'Montserrat', sans-serif", fontWeight: 700, letterSpacing: '-0.01em' },
          h3: { fontFamily: "'Montserrat', sans-serif", fontWeight: 600 },
          h4: { fontFamily: "'Montserrat', sans-serif", fontWeight: 600 },
          h5: { fontFamily: "'Montserrat', sans-serif", fontWeight: 600 },
          h6: { fontFamily: "'Montserrat', sans-serif", fontWeight: 600 },
          button: { textTransform: 'none', fontWeight: 600 },
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                scrollbarWidth: 'thin',
                scrollbarColor: mode === 'dark' 
                  ? 'rgba(255,255,255,0.2) transparent'
                  : 'rgba(0,0,0,0.2) transparent',
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
                borderRadius: 16,
                border: mode === 'dark' 
                  ? '1px solid rgba(255, 255, 255, 0.06)'
                  : '1px solid rgba(0, 0, 0, 0.04)',
                transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
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
                borderRadius: 16,
              },
            },
            defaultProps: {
              elevation: 0,
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                padding: '10px 24px',
                fontSize: '0.95rem',
                fontWeight: 600,
                boxShadow: 'none',
                textTransform: 'none',
                '&:hover': {
                  boxShadow: 'none',
                },
                '&:active': {
                  boxShadow: 'none',
                },
              },
              contained: {
                '&:hover': {
                  transform: 'translateY(-1px)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
              },
              containedPrimary: {
                backgroundColor: '#1db584',
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: '#169b70',
                },
              },
              containedSecondary: {
                backgroundColor: '#f6ad55',
                color: '#1a202c',
                '&:hover': {
                  backgroundColor: '#dd9a4a',
                },
              },
              outlined: {
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                },
              },
            },
            defaultProps: {
              disableElevation: true,
              disableRipple: true,
            },
          },
          MuiIconButton: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                transition: 'background-color 0.2s ease',
              },
            },
            defaultProps: {
              disableRipple: true,
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                fontWeight: 500,
              },
            },
          },
          MuiTab: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 600,
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
              indicator: {
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            },
          },
          MuiDialog: {
            styleOverrides: {
              paper: {
                borderRadius: 20,
                padding: 8,
              },
            },
          },
          MuiDialogTitle: {
            styleOverrides: {
              root: {
                fontSize: '1.25rem',
                fontWeight: 600,
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 12,
                },
              },
            },
          },
          MuiSelect: {
            styleOverrides: {
              root: {
                borderRadius: 12,
              },
            },
          },
          MuiLinearProgress: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                height: 8,
              },
              bar: {
                borderRadius: 8,
              },
            },
          },
          MuiAccordion: {
            styleOverrides: {
              root: {
                borderRadius: '16px !important',
                '&:before': {
                  display: 'none',
                },
                '&.Mui-expanded': {
                  margin: 0,
                },
              },
            },
            defaultProps: {
              elevation: 0,
            },
          },
          MuiToggleButton: {
            styleOverrides: {
              root: {
                borderRadius: 10,
                textTransform: 'none',
                fontWeight: 500,
              },
            },
          },
          MuiAlert: {
            styleOverrides: {
              root: {
                borderRadius: 12,
              },
            },
          },
          MuiSnackbar: {
            styleOverrides: {
              root: {
                '& .MuiSnackbarContent-root': {
                  borderRadius: 12,
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
