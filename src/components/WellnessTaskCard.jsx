/**
 * WellnessTaskCard Component
 * 
 * Displays today's wellness task and allows users to mark it as complete
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  Collapse,
  Alert,
} from '@mui/material';
import {
  CheckCircle,
  ExpandMore,
  ExpandLess,
  Spa,
  EmojiEvents,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { usePreferences } from '../contexts/PreferencesContext';
import { useUserProfile } from '../contexts/UserProfileContext';
import { useAuth } from '../contexts/AuthContext';
import {
  getTodaysWellnessTask,
  getWeeklyWellnessTask,
  saveCompletedTask,
  getCompletedTasksHistory,
} from '../utils/wellnessTaskService';

const WellnessTaskCard = ({ type = 'daily' }) => {
  const { preferences } = usePreferences();
  const { stats } = useUserProfile();
  const { currentUser } = useAuth();
  const [task, setTask] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    if (!preferences.dailyWellnessTasksEnabled) {
      return;
    }

    // Get today's task based on preferences
    const wellnessPrefs = {
      enabledCategories: preferences.wellnessCategories || [],
      relationshipStatus: preferences.relationshipStatus || 'All',
    };

    const selectedTask = type === 'daily' 
      ? getTodaysWellnessTask(wellnessPrefs)
      : getWeeklyWellnessTask(wellnessPrefs);

    setTask(selectedTask);

    // Check if task was already completed today
    const history = getCompletedTasksHistory(currentUser?.uid);
    const today = new Date().toISOString().split('T')[0];
    const completedToday = history.some(record => {
      const recordDate = new Date(record.completedAt).toISOString().split('T')[0];
      return recordDate === today && record.taskId === selectedTask?.id;
    });
    setCompleted(completedToday);
  }, [preferences, currentUser, type]);

  const handleComplete = async () => {
    if (!task) return;

    try {
      await saveCompletedTask(task.id, currentUser?.uid);
      setCompleted(true);
      setCelebrating(true);

      // Hide celebration after 3 seconds
      setTimeout(() => {
        setCelebrating(false);
      }, 3000);
    } catch (error) {
      console.error('Error marking task as complete:', error);
    }
  };

  if (!preferences.dailyWellnessTasksEnabled || !task) {
    return null;
  }

  return (
    <Card
      sx={{
        borderRadius: 2,
        boxShadow: 3,
        background: (theme) => 
          completed 
            ? `linear-gradient(135deg, ${theme.palette.success.light}20 0%, ${theme.palette.success.main}10 100%)`
            : 'background.paper',
        border: (theme) => completed ? `2px solid ${theme.palette.success.main}` : 'none',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <AnimatePresence>
        {celebrating && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'absolute',
              top: -10,
              right: -10,
              zIndex: 10,
            }}
          >
            <EmojiEvents sx={{ fontSize: 60, color: 'gold' }} />
          </motion.div>
        )}
      </AnimatePresence>

      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Spa sx={{ color: 'secondary.main', mr: 1 }} />
          <Typography variant="h6" fontWeight={600}>
            {type === 'daily' ? 'Today' : 'This Week'}'s Wellness Task
          </Typography>
        </Box>

        <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
          {task.task}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
          {task.categories?.map((category) => (
            <Chip
              key={category}
              label={category}
              size="small"
              variant="outlined"
              color="secondary"
            />
          ))}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            variant={completed ? 'outlined' : 'contained'}
            color={completed ? 'success' : 'primary'}
            startIcon={completed ? <CheckCircle /> : null}
            onClick={handleComplete}
            disabled={completed}
            sx={{ textTransform: 'none' }}
          >
            {completed ? 'Completed!' : 'Mark Complete'}
          </Button>

          <IconButton size="small" onClick={() => setShowDetails(!showDetails)}>
            {showDetails ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        <Collapse in={showDetails}>
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Alert severity="info" sx={{ mb: 1 }}>
              <Typography variant="caption">
                Complete wellness tasks to earn achievements and improve your overall wellbeing!
              </Typography>
            </Alert>
            <Typography variant="caption" color="text.secondary">
              Total completed: {stats.completedWellnessTasks || 0}
            </Typography>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

WellnessTaskCard.propTypes = {
  type: PropTypes.oneOf(['daily', 'weekly']),
};

export default WellnessTaskCard;
