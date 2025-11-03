import PropTypes from 'prop-types';

const Navigation = ({ currentScreen, onNavigate }) => {
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
      </div>
    </nav>
  );
};

Navigation.propTypes = {
  currentScreen: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired,
};

export default Navigation;
