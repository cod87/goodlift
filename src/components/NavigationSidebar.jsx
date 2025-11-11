import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { FaDumbbell, FaSignOutAlt, FaTimes, FaBars } from 'react-icons/fa';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Chip, Tooltip } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import GuestLogoutDialog from './GuestLogoutDialog';
import { clearGuestData } from '../utils/guestStorage';

const NavigationSidebar = ({ 
  currentScreen, 
  onNavigate, 
  isOpen,
  onToggle
}) => {
  const { currentUser, isGuest, logout } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [showGuestLogoutDialog, setShowGuestLogoutDialog] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = async () => {
    // Show confirmation dialog for guest users
    if (isGuest) {
      setShowGuestLogoutDialog(true);
      return;
    }
    
    // Regular logout for authenticated users
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out:', error);
      alert('Failed to log out. Please try again.');
    }
  };

  const handleConfirmGuestLogout = async () => {
    try {
      clearGuestData();
      await logout();
      setShowGuestLogoutDialog(false);
    } catch (error) {
      console.error('Failed to log out:', error);
      alert('Failed to log out. Please try again.');
    }
  };

  const handleNavClick = (screen) => {
    onNavigate(screen);
    if (isMobile) {
      onToggle();
    }
  };

  // On desktop, sidebar is always open; on mobile, it's controlled by isOpen
  const shouldShow = !isMobile || isOpen;

  return (
    <>
      {/* Hamburger Menu Button (Mobile Only) */}
      {isMobile && !isOpen && (
        <motion.button
          className="hamburger-menu"
          onClick={onToggle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          style={{
            position: 'fixed',
            top: 'max(1rem, env(safe-area-inset-top))',
            left: 'max(1rem, env(safe-area-inset-left))',
            zIndex: 1001,
            background: 'transparent',
            color: '#1db584',
            border: 'none',
            borderRadius: '0',
            padding: '8px',
            cursor: 'pointer',
            boxShadow: 'none',
          }}
        >
          <FaBars size={24} />
        </motion.button>
      )}

      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <motion.div
          className="sidebar-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onToggle}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
          }}
        />
      )}

      {/* Navigation Sidebar */}
      <AnimatePresence>
        {shouldShow && (
          <motion.aside
            initial={isMobile ? { x: -320 } : false}
            animate={{ x: 0 }}
            exit={isMobile ? { x: -320 } : {}}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="navigation-sidebar"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '280px',
              height: '100vh',
              background: '#2a3647',
              backdropFilter: 'blur(10px)',
              boxShadow: '4px 0 20px rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Logo Section */}
            <div style={{
              padding: '1.5rem 1.5rem 1rem',
              borderBottom: '2px solid rgba(29, 181, 132, 0.2)',
            }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavClick('selection')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  width: '100%',
                }}
                aria-label="Go to Workouts screen"
              >
                <img
                  src={`${import.meta.env.BASE_URL}goodlift-logo.svg`}
                  alt="GoodLift"
                  style={{ height: '48px', width: 'auto' }}
                />
              </motion.button>
              
              {/* Guest Mode Indicator */}
              {isGuest && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginTop: '0.5rem',
                  }}
                >
                  <Tooltip title="You're in guest mode. Sign up to save your data permanently!" arrow>
                    <Chip
                      label="Guest Mode"
                      size="small"
                      sx={{
                        bgcolor: 'warning.main',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                      }}
                    />
                  </Tooltip>
                </motion.div>
              )}
            </div>

            {/* Navigation Links */}
            <nav style={{ 
              padding: '1rem 0',
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
            }}>
              <NavLink
                icon={<FaDumbbell />}
                label="Training Hub"
                isActive={currentScreen === 'selection' || currentScreen === 'preview'}
                onClick={() => handleNavClick('selection')}
              />
              <NavLink
                icon={<TrendingUpIcon />}
                label="Progress"
                isActive={currentScreen === 'progress'}
                onClick={() => handleNavClick('progress')}
              />
              <NavLink
                icon={<AddCircleOutlineIcon />}
                label="Log Activity"
                isActive={currentScreen === 'log-activity'}
                onClick={() => handleNavClick('log-activity')}
              />
              <NavLink
                icon={<FitnessCenterIcon />}
                label="Exercise List"
                isActive={currentScreen === 'exercise-list'}
                onClick={() => handleNavClick('exercise-list')}
              />
            </nav>

            {/* Logout Button */}
            {currentUser && (
              <div style={{
                padding: '1rem 1.5rem',
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
                borderTop: '2px solid rgba(29, 181, 132, 0.2)',
                flexShrink: 0,
              }}>
                <motion.button
                  onClick={handleLogout}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '10px 20px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    background: '#ff8c00',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <FaSignOutAlt /> Logout
                </motion.button>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
      
      {/* Guest Logout Confirmation Dialog */}
      <GuestLogoutDialog
        open={showGuestLogoutDialog}
        onClose={() => setShowGuestLogoutDialog(false)}
        onConfirm={handleConfirmGuestLogout}
      />
    </>
  );
};

// NavLink component for sidebar navigation
const NavLink = ({ icon, label, isActive, onClick }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ x: 5, backgroundColor: 'rgba(29, 181, 132, 0.1)' }}
    whileTap={{ scale: 0.98 }}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      width: '100%',
      padding: '12px 1.5rem',
      fontSize: '1rem',
      fontWeight: 600,
      background: isActive ? 'rgba(29, 181, 132, 0.2)' : 'transparent',
      color: isActive ? '#1db584' : '#a0a8b3',
      border: 'none',
      borderLeft: isActive ? '4px solid #1db584' : '4px solid transparent',
      textAlign: 'left',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }}
  >
    {icon}
    <span>{label}</span>
  </motion.button>
);

NavLink.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

// NavSubLink component for subsection navigation (indented)
const NavSubLink = ({ icon, label, isActive, onClick }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ x: 5, backgroundColor: 'rgba(19, 70, 134, 0.05)' }}
    whileTap={{ scale: 0.98 }}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      width: '100%',
      padding: '10px 1.5rem 10px 2.5rem',
      fontSize: '0.95rem',
      fontWeight: 500,
      background: isActive ? 'rgba(19, 70, 134, 0.1)' : 'transparent',
      color: isActive ? 'rgb(19, 70, 134)' : 'rgb(237, 63, 39)',
      border: 'none',
      borderLeft: isActive ? '4px solid rgb(19, 70, 134)' : '4px solid transparent',
      textAlign: 'left',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }}
  >
    {icon}
    <span>{label}</span>
  </motion.button>
);

NavSubLink.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

NavigationSidebar.propTypes = {
  currentScreen: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

export default NavigationSidebar;
