import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext';

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
    <nav className="main-nav">
      <div className="logo">GoodLift</div>
      <div className="nav-links">
        <button
          className={currentScreen === 'selection' ? 'active' : ''}
          onClick={() => onNavigate('selection')}
        >
          Workout
        </button>
        <button
          className={currentScreen === 'progress' ? 'active' : ''}
          onClick={() => onNavigate('progress')}
        >
          Progress
        </button>
        {currentUser && (
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        )}
      </div>
    </nav>
  );
};

Navigation.propTypes = {
  currentScreen: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired,
};

export default Navigation;
