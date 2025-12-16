import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  Tooltip,
  Chip,
  Stack,
  Collapse,
} from '@mui/material';
import {
  FitnessCenter,
  DirectionsRun,
  SelfImprovement,
  HotelOutlined,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';

/**
 * SessionTypeQuickToggle - Compact UI component for quickly changing session types
 * Allows users to toggle between different workout types with visual feedback
 */
const SessionTypeQuickToggle = ({ currentType, onChange, compact = false }) => {
  const [expanded, setExpanded] = useState(false);

  // Session type categories
  const sessionCategories = {
    strength: [
      { value: 'full', label: 'Full Body', shortLabel: 'Full' },
      { value: 'upper', label: 'Upper Body', shortLabel: 'Upper' },
      { value: 'lower', label: 'Lower Body', shortLabel: 'Lower' },
      { value: 'push', label: 'Push', shortLabel: 'Push' },
      { value: 'pull', label: 'Pull', shortLabel: 'Pull' },
      { value: 'legs', label: 'Legs', shortLabel: 'Legs' },
      { value: 'core', label: 'Core', shortLabel: 'Core' },
    ],
    cardio: [
      { value: 'cardio', label: 'Cardio', shortLabel: 'Cardio' },
      { value: 'hiit', label: 'HIIT', shortLabel: 'HIIT' },
    ],
    flexibility: [
      { value: 'yoga', label: 'Yoga', shortLabel: 'Yoga' },
      { value: 'mobility', label: 'Mobility', shortLabel: 'Mobility' },
      { value: 'stretch', label: 'Stretching', shortLabel: 'Stretch' },
    ],
    rest: [
      { value: 'rest', label: 'Rest Day', shortLabel: 'Rest' },
    ],
    sick: [
      { value: 'sick_day', label: 'Sick Day', shortLabel: 'Sick' },
    ],
  };

  // Get icon for category
  const getCategoryIcon = (category) => {
    const icons = {
      strength: <FitnessCenter fontSize="small" />,
      cardio: <DirectionsRun fontSize="small" />,
      flexibility: <SelfImprovement fontSize="small" />,
      rest: <HotelOutlined fontSize="small" />,
      sick: <HotelOutlined fontSize="small" />,
    };
    return icons[category];
  };

  // Get current category
  const getCurrentCategory = () => {
    for (const [category, types] of Object.entries(sessionCategories)) {
      if (types.some(t => t.value === currentType)) {
        return category;
      }
    }
    return 'strength';
  };

  const currentCategory = getCurrentCategory();

  // Handle toggle change
  const handleToggle = (event, newValue) => {
    if (newValue !== null && newValue !== currentType) {
      onChange(newValue);
    }
  };

  if (compact) {
    // Compact view - shows only the current category and type
    return (
      <Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            p: 1.5,
            borderRadius: 1,
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
          onClick={() => setExpanded(!expanded)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getCategoryIcon(currentCategory)}
            <Typography variant="body2" fontWeight={600}>
              Session Type:
            </Typography>
            <Chip
              label={sessionCategories[currentCategory].find(t => t.value === currentType)?.label || currentType}
              size="small"
              color="primary"
            />
          </Box>
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ pt: 2 }}>
            {Object.entries(sessionCategories).map(([category, types]) => (
              <Box key={category} sx={{ mb: 2 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}
                >
                  {getCategoryIcon(category)}
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Typography>
                <ToggleButtonGroup
                  value={currentType}
                  exclusive
                  onChange={handleToggle}
                  size="small"
                  fullWidth
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 0.5,
                    '& .MuiToggleButton-root': {
                      flex: '1 1 auto',
                      minWidth: 'fit-content',
                    },
                  }}
                >
                  {types.map((type) => (
                    <ToggleButton key={type.value} value={type.value}>
                      {type.shortLabel}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>
            ))}
          </Box>
        </Collapse>
      </Box>
    );
  }

  // Full view - shows all categories expanded
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        Quick Toggle Session Type
      </Typography>
      <Stack spacing={2}>
        {Object.entries(sessionCategories).map(([category, types]) => (
          <Box key={category}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}
            >
              {getCategoryIcon(category)}
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Typography>
            <ToggleButtonGroup
              value={currentType}
              exclusive
              onChange={handleToggle}
              size="small"
              fullWidth
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.5,
                '& .MuiToggleButton-root': {
                  flex: { xs: '1 1 45%', sm: '1 1 auto' },
                  minWidth: 'fit-content',
                },
              }}
            >
              {types.map((type) => (
                <Tooltip key={type.value} title={type.label} arrow>
                  <ToggleButton value={type.value}>
                    {type.shortLabel}
                  </ToggleButton>
                </Tooltip>
              ))}
            </ToggleButtonGroup>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

SessionTypeQuickToggle.propTypes = {
  currentType: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  compact: PropTypes.bool,
};

export default SessionTypeQuickToggle;
