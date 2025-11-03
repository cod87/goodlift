import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const Sidebar = ({ isOpen, onStartWorkout, allExercises }) => {
  const [workoutType, setWorkoutType] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState(new Set(['all']));
  const [equipmentOptions, setEquipmentOptions] = useState([]);

  // Extract unique equipment types from exercises
  useEffect(() => {
    if (allExercises.length > 0) {
      const equipmentSet = new Set();
      allExercises.forEach(ex => {
        const equipment = ex.Equipment;
        if (equipment.includes('Cable')) {
          equipmentSet.add('Cable Machine');
        } else if (equipment.includes('Dumbbell')) {
          equipmentSet.add('Dumbbells');
        } else {
          equipmentSet.add(equipment);
        }
      });
      setEquipmentOptions(Array.from(equipmentSet).sort());
    }
  }, [allExercises]);

  const handleWorkoutTypeChange = (type) => {
    setWorkoutType(type);
  };

  const handleEquipmentChange = (value) => {
    const newSelected = new Set(selectedEquipment);
    
    if (value === 'all') {
      if (selectedEquipment.has('all')) {
        newSelected.delete('all');
      } else {
        newSelected.clear();
        newSelected.add('all');
      }
    } else {
      newSelected.delete('all');
      if (newSelected.has(value)) {
        newSelected.delete(value);
      } else {
        newSelected.add(value);
      }
      
      if (newSelected.size === 0) {
        newSelected.add('all');
      }
    }
    
    setSelectedEquipment(newSelected);
  };

  const handleStartClick = () => {
    if (workoutType) {
      const equipmentFilter = selectedEquipment.has('all') ? 'all' : Array.from(selectedEquipment).map(e => e.toLowerCase());
      onStartWorkout(workoutType, equipmentFilter);
    }
  };

  return (
    <aside className={`filter-sidebar ${!isOpen ? 'hidden' : ''}`}>
      <div className="sidebar-content">
        <h2>Filter Your Workout</h2>
        
        <div className="sidebar-section">
          <h3>Workout Type</h3>
          <div className="sidebar-workout-options">
            <label className="radio-option">
              <input
                type="radio"
                name="workout-type"
                value="full"
                checked={workoutType === 'full'}
                onChange={() => handleWorkoutTypeChange('full')}
              />
              <span className="radio-circle"></span>
              <span className="radio-label">Full Body</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="workout-type"
                value="upper"
                checked={workoutType === 'upper'}
                onChange={() => handleWorkoutTypeChange('upper')}
              />
              <span className="radio-circle"></span>
              <span className="radio-label">Upper Body</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="workout-type"
                value="lower"
                checked={workoutType === 'lower'}
                onChange={() => handleWorkoutTypeChange('lower')}
              />
              <span className="radio-circle"></span>
              <span className="radio-label">Lower Body</span>
            </label>
          </div>
        </div>
        
        <div className="sidebar-section">
          <h3>Equipment</h3>
          <div className="sidebar-equipment-options">
            <label className="checkbox-option">
              <input
                type="checkbox"
                name="equipment"
                value="all"
                checked={selectedEquipment.has('all')}
                onChange={() => handleEquipmentChange('all')}
              />
              <span className="checkbox-circle"></span>
              <span className="checkbox-label">All</span>
            </label>
            {equipmentOptions.map(equipment => (
              <label key={equipment} className="checkbox-option">
                <input
                  type="checkbox"
                  name="equipment"
                  value={equipment.toLowerCase()}
                  checked={selectedEquipment.has(equipment.toLowerCase())}
                  onChange={() => handleEquipmentChange(equipment.toLowerCase())}
                />
                <span className="checkbox-circle"></span>
                <span className="checkbox-label">{equipment}</span>
              </label>
            ))}
          </div>
        </div>
        
        <button
          className="sidebar-start-btn"
          disabled={!workoutType}
          onClick={handleStartClick}
        >
          Start Workout
        </button>
      </div>
    </aside>
  );
};

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onStartWorkout: PropTypes.func.isRequired,
  allExercises: PropTypes.array.isRequired,
};

export default Sidebar;
