/**
 * PlanBasicsForm - Mobile-first step 1 form for entering plan basics
 * 
 * Features:
 * - Single text input for plan name
 * - 5 large, vertically-stacked radio buttons for plan type
 * - Next button to save state and advance to step 2
 * - Full-width mobile design with 16px padding
 * - No horizontal scrolling
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Paper,
  Typography
} from '@mui/material';
import {
  FitnessCenter as StrengthIcon,
  TrendingUp as PowerliftingIcon,
  SportsKabaddi as OlympicIcon,
  DirectionsRun as FitnessIcon,
  Build as CustomIcon,
  NavigateNext as NextIcon
} from '@mui/icons-material';

const PLAN_TYPES = [
  {
    value: 'strength_training',
    label: 'Strength Training',
    description: 'Build overall strength with compound movements',
    icon: StrengthIcon
  },
  {
    value: 'powerlifting',
    label: 'Powerlifting',
    description: 'Focus on squat, bench press, and deadlift',
    icon: PowerliftingIcon
  },
  {
    value: 'olympic_lifting',
    label: 'Olympic Lifting',
    description: 'Master the snatch and clean & jerk',
    icon: OlympicIcon
  },
  {
    value: 'general_fitness',
    label: 'General Fitness',
    description: 'Balanced approach for overall health',
    icon: FitnessIcon
  },
  {
    value: 'custom',
    label: 'Custom',
    description: 'Create your own personalized plan',
    icon: CustomIcon
  }
];

const PlanBasicsForm = ({ onNext, initialValues = {} }) => {
  const [planName, setPlanName] = useState(initialValues.planName || '');
  const [planType, setPlanType] = useState(initialValues.planType || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Save state and advance to step 2
    if (onNext) {
      onNext({
        planName: planName.trim(),
        planType
      });
    }
  };

  const isFormValid = planType !== '';

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100%',
        padding: '16px',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      {/* Plan Name Input */}
      <Box sx={{ mb: 3 }}>
        <TextField
          label="Plan Name"
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          fullWidth
          placeholder="e.g., Summer Training Program"
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: '1.1rem'
            }
          }}
        />
      </Box>

      {/* Plan Type Selection */}
      <FormControl component="fieldset" sx={{ flex: 1, mb: 3 }}>
        <FormLabel
          component="legend"
          sx={{
            fontSize: '1.1rem',
            fontWeight: 600,
            mb: 2,
            color: 'text.primary'
          }}
        >
          Select Plan Type
        </FormLabel>
        
        <RadioGroup
          value={planType}
          onChange={(e) => setPlanType(e.target.value)}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          {PLAN_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <Paper
                key={type.value}
                elevation={planType === type.value ? 4 : 1}
                sx={{
                  width: '100%',
                  border: planType === type.value ? 2 : 1,
                  borderColor: planType === type.value ? 'primary.main' : 'divider',
                  backgroundColor: planType === type.value ? 'action.selected' : 'background.paper',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: 3
                  }
                }}
                onClick={() => setPlanType(type.value)}
              >
                <FormControlLabel
                  value={type.value}
                  control={
                    <Radio
                      sx={{
                        '& .MuiSvgIcon-root': {
                          fontSize: 28
                        }
                      }}
                    />
                  }
                  label={
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        py: 2,
                        pr: 2,
                        width: '100%'
                      }}
                    >
                      <Icon
                        sx={{
                          fontSize: 32,
                          color: planType === type.value ? 'primary.main' : 'action.active'
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            fontSize: '1.1rem',
                            mb: 0.5
                          }}
                        >
                          {type.label}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: '0.9rem' }}
                        >
                          {type.description}
                        </Typography>
                      </Box>
                    </Box>
                  }
                  sx={{
                    width: '100%',
                    m: 0,
                    ml: 1,
                    '& .MuiFormControlLabel-label': {
                      flex: 1,
                      width: '100%'
                    }
                  }}
                />
              </Paper>
            );
          })}
        </RadioGroup>
      </FormControl>

      {/* Next Button - Fixed at bottom */}
      <Box
        sx={{
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: 'background.default',
          pt: 2,
          pb: 2,
          mt: 'auto'
        }}
      >
        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={!isFormValid}
          endIcon={<NextIcon />}
          sx={{
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 600,
            textTransform: 'none'
          }}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
};

PlanBasicsForm.propTypes = {
  onNext: PropTypes.func.isRequired,
  initialValues: PropTypes.shape({
    planName: PropTypes.string,
    planType: PropTypes.string
  })
};

export default PlanBasicsForm;
