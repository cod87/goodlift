import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { FaDumbbell } from 'react-icons/fa';

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
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ x: -320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -320, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`filter-sidebar ${!isOpen ? 'hidden' : ''}`}
        >
          <div className="sidebar-content">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaDumbbell /> Filter Your Workout
              </h2>
            </motion.div>
            
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="sidebar-section"
            >
              <h3>Workout Type</h3>
              <div className="sidebar-workout-options">
                {['full', 'upper', 'lower'].map((type, idx) => (
                  <motion.label
                    key={type}
                    className="radio-option"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <input
                      type="radio"
                      name="workout-type"
                      value={type}
                      checked={workoutType === type}
                      onChange={() => handleWorkoutTypeChange(type)}
                    />
                    <span className="radio-circle"></span>
                    <span className="radio-label">
                      {type === 'full' ? 'Full Body' : type === 'upper' ? 'Upper Body' : 'Lower Body'}
                    </span>
                  </motion.label>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="sidebar-section"
            >
              <h3>Equipment</h3>
              <div className="sidebar-equipment-options">
                <motion.label
                  className="checkbox-option"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ x: 5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <input
                    type="checkbox"
                    name="equipment"
                    value="all"
                    checked={selectedEquipment.has('all')}
                    onChange={() => handleEquipmentChange('all')}
                  />
                  <span className="checkbox-circle"></span>
                  <span className="checkbox-label">All</span>
                </motion.label>
                {equipmentOptions.map((equipment, idx) => (
                  <motion.label
                    key={equipment}
                    className="checkbox-option"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 + idx * 0.05 }}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <input
                      type="checkbox"
                      name="equipment"
                      value={equipment.toLowerCase()}
                      checked={selectedEquipment.has(equipment.toLowerCase())}
                      onChange={() => handleEquipmentChange(equipment.toLowerCase())}
                    />
                    <span className="checkbox-circle"></span>
                    <span className="checkbox-label">{equipment}</span>
                  </motion.label>
                ))}
              </div>
            </motion.div>
            
            <motion.button
              className="sidebar-start-btn"
              disabled={!workoutType}
              onClick={handleStartClick}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              whileHover={{ scale: workoutType ? 1.02 : 1 }}
              whileTap={{ scale: workoutType ? 0.98 : 1 }}
            >
              Start Workout
            </motion.button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onStartWorkout: PropTypes.func.isRequired,
  allExercises: PropTypes.array.isRequired,
};

export default Sidebar;
