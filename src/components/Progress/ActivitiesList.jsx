import { memo, useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Card,
  CardContent,
  Typography, 
  List,
  ListItem,
  Collapse,
  IconButton,
  Chip,
  Stack,
  Button
} from '@mui/material';
import { 
  ExpandMore,
  ExpandLess,
  Delete,
  Edit,
  FitnessCenter,
  Timer,
  DirectionsRun,
  SelfImprovement
} from '@mui/icons-material';
import { formatDate, formatDuration } from '../../utils/helpers';

/**
 * ActivitiesList - Compact expandable activity history
 * Shows workout summary with expandable details
 * Enhanced to show last 10 workouts by default with form quality notes
 */
const ActivitiesList = memo(({ 
  activities = [],
  onDelete,
  onEdit,
  maxVisible = 10,
  showLoadMore = true,
}) => {
  const [expandedId, setExpandedId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(maxVisible);

  const handleToggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getActivityIcon = (type) => {
    const icons = {
      strength: <FitnessCenter fontSize="small" />,
      cardio: <DirectionsRun fontSize="small" />,
      hiit: <DirectionsRun fontSize="small" />,
      stretch: <SelfImprovement fontSize="small" />,
    };
    return icons[type] || <FitnessCenter fontSize="small" />;
  };

  const getActivityColor = (type) => {
    const colors = {
      strength: 'primary',
      cardio: 'info',
      hiit: 'error',
      stretch: 'warning',
    };
    return colors[type] || 'default';
  };

  const formatActivityType = (type) => {
    if (!type) return 'Workout';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getExerciseCount = (activity) => {
    if (activity.exercises) {
      if (Array.isArray(activity.exercises)) {
        return activity.exercises.length;
      }
      if (typeof activity.exercises === 'object') {
        return Object.keys(activity.exercises).length;
      }
    }
    return 0;
  };

  const visibleActivities = activities.slice(0, visibleCount);

  if (activities.length === 0) {
    return (
      <Card sx={{ width: '100%', borderRadius: 3 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary" align="center">
            No activities yet. Start your first workout!
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography 
        variant="overline" 
        sx={{ 
          color: 'primary.main',
          fontWeight: 600,
          letterSpacing: 1,
          mb: 1,
          display: 'block',
        }}
      >
        ACTIVITY HISTORY
      </Typography>

      <List sx={{ p: 0 }}>
        {visibleActivities.map((activity, index) => {
          const isExpanded = expandedId === index;
          const exerciseCount = getExerciseCount(activity);
          const activityType = activity.type || 'strength';

          return (
            <Card
              key={index}
              sx={{ 
                mb: 1,
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(19, 70, 134, 0.06)',
                transition: 'box-shadow 0.2s',
                '&:hover': {
                  boxShadow: '0 4px 16px rgba(19, 70, 134, 0.12)',
                },
              }}
            >
              <ListItem
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  p: 1.5,
                  cursor: 'pointer',
                }}
                onClick={() => handleToggleExpand(index)}
              >
                {/* Summary Row */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                    <Box sx={{ color: `${getActivityColor(activityType)}.main` }}>
                      {getActivityIcon(activityType)}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {formatActivityType(activityType)}
                        {activity.isPartial && (
                          <Chip 
                            label="Partial"
                            size="small"
                            sx={{ ml: 1, height: '18px', fontSize: '0.7rem' }}
                          />
                        )}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                          {formatDate(activity.date)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                          •
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                          {formatDuration(activity.duration)}
                        </Typography>
                        {exerciseCount > 0 && (
                          <>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                              •
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                              {exerciseCount} exercises
                            </Typography>
                          </>
                        )}
                      </Stack>
                    </Box>
                  </Box>
                  
                  <IconButton 
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleExpand(index);
                    }}
                  >
                    {isExpanded ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Box>

                {/* Expanded Details */}
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    {activity.exercises && typeof activity.exercises === 'object' && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          Exercises:
                        </Typography>
                        <List dense sx={{ mt: 0.5 }}>
                          {Object.entries(activity.exercises).map(([exerciseName, exerciseData], idx) => (
                            <ListItem key={idx} sx={{ py: 0.5, px: 1, flexDirection: 'column', alignItems: 'flex-start' }}>
                              <Typography variant="caption" sx={{ color: 'text.primary' }}>
                                {exerciseName}: {exerciseData.sets?.length || 0} sets
                              </Typography>
                              {exerciseData.formNotes && (
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic', mt: 0.5 }}>
                                  Form: {exerciseData.formNotes}
                                </Typography>
                              )}
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}

                    {/* Overall Workout Notes */}
                    {activity.notes && (
                      <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>
                          Notes:
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.primary' }}>
                          {activity.notes}
                        </Typography>
                      </Box>
                    )}

                    <Stack direction="row" spacing={1}>
                      {onEdit && (
                        <Button
                          size="small"
                          startIcon={<Edit />}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(index);
                          }}
                          variant="outlined"
                        >
                          Edit
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          size="small"
                          startIcon={<Delete />}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(index);
                          }}
                          variant="outlined"
                          color="error"
                        >
                          Delete
                        </Button>
                      )}
                    </Stack>
                  </Box>
                </Collapse>
              </ListItem>
            </Card>
          );
        })}
      </List>

      {/* Load More */}
      {showLoadMore && visibleCount < activities.length && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setVisibleCount(prev => prev + maxVisible)}
          >
            Load More ({activities.length - visibleCount} remaining)
          </Button>
        </Box>
      )}
    </Box>
  );
});

ActivitiesList.displayName = 'ActivitiesList';

ActivitiesList.propTypes = {
  activities: PropTypes.arrayOf(PropTypes.shape({
    date: PropTypes.string,
    type: PropTypes.string,
    duration: PropTypes.number,
    exercises: PropTypes.oneOfType([
      PropTypes.array,
      PropTypes.object,
    ]),
    isPartial: PropTypes.bool,
  })).isRequired,
  onDelete: PropTypes.func,
  onEdit: PropTypes.func,
  maxVisible: PropTypes.number,
  showLoadMore: PropTypes.bool,
};

export default ActivitiesList;
