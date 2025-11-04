import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { FaDumbbell, FaHome, FaClock, FaSignOutAlt, FaTimes, FaBars } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const NavigationSidebar = ({ 
  currentScreen, 
  onNavigate, 
  isOpen,
  onToggle
}) => {
  const { currentUser, logout } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
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
      {isMobile && (
        <motion.button
          className="hamburger-menu"
          onClick={onToggle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          style={{
            position: 'fixed',
            top: '1rem',
            left: '1rem',
            zIndex: 1001,
            background: 'rgba(19, 70, 134, 0.9)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(19, 70, 134, 0.3)',
          }}
        >
          {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
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
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              boxShadow: '4px 0 20px rgba(19, 70, 134, 0.15)',
              zIndex: 1000,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Logo Section */}
            <div style={{
              padding: '1.5rem 1.5rem 1rem',
              borderBottom: '2px solid rgba(19, 70, 134, 0.1)',
            }}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
             <img
  src={`${import.meta.env.BASE_URL}goodlift-logo.svg`}
  alt="GoodLift"
  style={{ height: '48px', width: 'auto' }}
/>
              </motion.div>
            </div>

            {/* Navigation Links */}
            <nav style={{ 
              padding: '1rem 0',
              borderBottom: '2px solid rgba(19, 70, 134, 0.1)',
            }}>
              <NavLink
                icon={<FaHome />}
                label="Home"
                isActive={currentScreen === 'progress'}
                onClick={() => handleNavClick('progress')}
              />
              <NavLink
                icon={<FaDumbbell />}
                label="Workout"
                isActive={currentScreen === 'selection' || currentScreen === 'preview'}
                onClick={() => handleNavClick('selection')}
              />
              <NavLink
                icon={<FaClock />}
                label="HIIT Timer"
                isActive={currentScreen === 'hiit'}
                onClick={() => handleNavClick('hiit')}
              />
            </nav>

            {/* Logout Button */}
            {currentUser && (
              <div style={{
                padding: '1rem 1.5rem',
                borderTop: '2px solid rgba(19, 70, 134, 0.1)',
                marginTop: 'auto',
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
                    background: 'rgb(237, 63, 39)',
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
    </>
  );
};

// NavLink component for sidebar navigation
const NavLink = ({ icon, label, isActive, onClick }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ x: 5, backgroundColor: 'rgba(19, 70, 134, 0.05)' }}
    whileTap={{ scale: 0.98 }}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      width: '100%',
      padding: '12px 1.5rem',
      fontSize: '1rem',
      fontWeight: 600,
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

NavLink.propTypes = {
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
