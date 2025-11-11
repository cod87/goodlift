/**
 * HIIT Session Selection Screen
 * 
 * Allows users to configure and generate HIIT sessions based on
 * science-backed protocols from .github/HIIT-YOGA-GUIDE.md
 * Also supports building custom HIIT sessions exercise-by-exercise
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { motion } from 'framer-motion';
import { FitnessCenter, DirectionsRun, SelfImprovement, Build as BuildIcon } from '@mui/icons-material';
import {
  generateHIITSession,
  HIIT_PROTOCOLS,
  EXERCISE_CATEGORIES
} from '../utils/hiitSessionGenerator';
import HiitSessionBuilderDialog from './HiitSessionBuilderDialog';

const HiitSessionSelection = ({ onNavigate }) => {
  
  // State for session configuration
  const [modality, setModality] = useState('bodyweight');
  const [level, setLevel] = useState('intermediate');
  const [protocol, setProtocol] = useState('BALANCED');
  const [lowerImpact, setLowerImpact] = useState(false);
  const [goal, setGoal] = useState('cardiovascular');
  const [showBuilder, setShowBuilder] = useState(false);
  
  // Load exercises data
  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['exercises'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.BASE_URL}data/exercises.json`);
      if (!response.ok) {
        throw new Error('Failed to load exercises');
      }
      return response.json();
    },
    staleTime: Infinity,
  });
  
  const handleGenerateSession = () => {
    const session = generateHIITSession({
      modality,
      level,
      protocol,
      exercises,
      lowerImpact,
      goal
    });
    
    // Navigate to session execution screen with the generated session
    // Store session in localStorage for now
    localStorage.setItem('currentHiitSession', JSON.stringify(session));
    onNavigate('hiit-session');
  };

  const handleSaveCustomSession = (session) => {
    // Store custom session and navigate to session screen
    localStorage.setItem('currentHiitSession', JSON.stringify(session));
    setShowBuilder(false);
    onNavigate('hiit-session');
  };
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress color="secondary" size={60} />
      </Box>
    );
  }
  
  const selectedProtocol = HIIT_PROTOCOLS[protocol];
  const selectedCategory = EXERCISE_CATEGORIES[modality.toUpperCase()];
  
  return (
    <motion.div
      className="screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Typography variant="h3" component="h1" sx={{ 
        fontWeight: 700,
        mb: 2,
        textAlign: 'center',
        color: 'primary.main',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2
      }}>
        <DirectionsRun fontSize="large" />
        HIIT Session Builder
      </Typography>
      
      <Typography variant="subtitle1" sx={{ textAlign: 'center', mb: 4, color: 'text.secondary' }}>
        Science-backed HIIT workouts based on .github/HIIT-YOGA-GUIDE.md
      </Typography>
      
      <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Protocol Information */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            <strong>Selected Protocol:</strong> {selectedProtocol.name}
          </Typography>
          <Typography variant="body2">
            {selectedProtocol.description}
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Guide Reference: Section {selectedProtocol.guideSection} | Difficulty: {selectedProtocol.difficulty}
          </Typography>
        </Alert>
        
        {/* Configuration Cards */}
        <Grid container spacing={3}>
          {/* Modality Selection */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FitnessCenter />
                  Modality
                </Typography>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>HIIT Type</InputLabel>
                  <Select
                    value={modality}
                    label="HIIT Type"
                    onChange={(e) => setModality(e.target.value)}
                  >
                    <MenuItem value="bodyweight">Bodyweight HIIT</MenuItem>
                    <MenuItem value="plyometric">Plyometric HIIT</MenuItem>
                    <MenuItem value="cycling">Cycling HIIT</MenuItem>
                    <MenuItem value="rowing">Rowing HIIT</MenuItem>
                    <MenuItem value="elliptical">Elliptical HIIT</MenuItem>
                    <MenuItem value="step">Step Platform HIIT</MenuItem>
                  </Select>
                </FormControl>
                
                {selectedCategory && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Guide Section: {selectedCategory.guideSection}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedCategory.benefits.map((benefit, idx) => (
                        <Chip key={idx} label={benefit} size="small" color="primary" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Level Selection */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Experience Level
                </Typography>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Level</InputLabel>
                  <Select
                    value={level}
                    label="Level"
                    onChange={(e) => setLevel(e.target.value)}
                  >
                    <MenuItem value="beginner">Beginner</MenuItem>
                    <MenuItem value="intermediate">Intermediate</MenuItem>
                    <MenuItem value="advanced">Advanced</MenuItem>
                  </Select>
                </FormControl>
                
                <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
                  {level === 'beginner' && 'Lower intensity, longer rest, focus on form'}
                  {level === 'intermediate' && 'Moderate intensity, balanced work-rest'}
                  {level === 'advanced' && 'High intensity, shorter rest, maximum effort'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Protocol Selection */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Work-to-Rest Ratio
                </Typography>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Protocol</InputLabel>
                  <Select
                    value={protocol}
                    label="Protocol"
                    onChange={(e) => setProtocol(e.target.value)}
                  >
                    {Object.entries(HIIT_PROTOCOLS).map(([key, proto]) => (
                      <MenuItem key={key} value={key}>
                        {proto.name} ({proto.workSeconds}:{proto.restSeconds}s)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Goal Selection */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Health Goal
                </Typography>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Goal</InputLabel>
                  <Select
                    value={goal}
                    label="Goal"
                    onChange={(e) => setGoal(e.target.value)}
                  >
                    <MenuItem value="fat_loss">Fat Loss</MenuItem>
                    <MenuItem value="cardiovascular">Cardiovascular Health</MenuItem>
                    <MenuItem value="power">Power Development</MenuItem>
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Options */}
          {(modality === 'bodyweight' || modality === 'plyometric') && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Options
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant={lowerImpact ? 'contained' : 'outlined'}
                      onClick={() => setLowerImpact(!lowerImpact)}
                      fullWidth
                    >
                      {lowerImpact ? '✓ ' : ''}Lower-Impact Modifications
                    </Button>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }} color="text.secondary">
                      Use lower-impact alternatives to reduce joint stress (e.g., step instead of jump)
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
        
        {/* Generate and Build Buttons */}
        <Box sx={{ mt: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleGenerateSession}
            sx={{ minWidth: 250, py: 1.5, fontSize: '1.1rem' }}
          >
            Generate HIIT Session
          </Button>

          <Divider sx={{ width: '100%', maxWidth: 400 }}>
            <Typography variant="caption" color="text.secondary">OR</Typography>
          </Divider>

          <Button
            variant="outlined"
            size="large"
            startIcon={<BuildIcon />}
            onClick={() => setShowBuilder(true)}
            sx={{ minWidth: 250, py: 1.5, fontSize: '1.1rem' }}
          >
            Build Custom Session
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 400, textAlign: 'center' }}>
            Build your own HIIT session exercise-by-exercise with custom work/rest intervals
          </Typography>
        </Box>
        
        {/* Guide Reference */}
        <Alert severity="success" sx={{ mt: 3 }}>
          <Typography variant="body2">
            All HIIT protocols are based on evidence-based research from .github/HIIT-YOGA-GUIDE.md.
            Sessions include proper warm-up, main workout, and cool-down sequences with progressive overload support.
          </Typography>
        </Alert>
      </Box>

      {/* HIIT Session Builder Dialog */}
      <HiitSessionBuilderDialog
        open={showBuilder}
        onClose={() => setShowBuilder(false)}
        onSave={handleSaveCustomSession}
        allExercises={exercises}
      />
    </motion.div>
  );
};

HiitSessionSelection.propTypes = {
  onNavigate: PropTypes.func.isRequired,
};

export default HiitSessionSelection;
