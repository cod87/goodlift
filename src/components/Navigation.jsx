import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { FaDumbbell } from 'react-icons/fa';

const Navigation = ({ currentScreen, onNavigate }) => {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out:', error);
      alert('Failed to log out. Please try again.');
    }
  };

  return (
    <motion.nav
      className="main-nav"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <motion.div
        className="logo"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <FaDumbbell /> GoodLift
      </motion.div>
      <div className="nav-links">
        <motion.button
          className={currentScreen === 'selection' || currentScreen === 'preview' ? 'active' : ''}
          onClick={() => onNavigate('selection')}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          Workout
        </motion.button>
        <motion.button
          className={currentScreen === 'progress' ? 'active' : ''}
          onClick={() => onNavigate('progress')}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          Progress
        </motion.button>
        {currentUser && (
          <motion.button
            onClick={handleLogout}
            className="logout-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Logout
          </motion.button>
        )}
      </div>
    </motion.nav>
  );
};

Navigation.propTypes = {
  currentScreen: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired,
};

export default Navigation;
