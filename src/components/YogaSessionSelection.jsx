/**
 * Yoga Session Selection Screen
 * 
 * Allows users to configure and generate Yoga sessions based on
 * science-backed protocols from .github/HIIT-YOGA-GUIDE.md
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { motion } from 'framer-motion';
import { SelfImprovement, Spa, FitnessCenter } from '@mui/icons-material';
import {
  generateYogaSession,
  YOGA_MODES,
  BREATHING_TECHNIQUES
} from '../utils/yogaSessionGenerator';

const YogaSessionSelection = () => {
  const navigate = useNavigate();
  
  // State for session configuration
  const [mode, setMode] = useState('power');
  const [level, setLevel] = useState('intermediate');
  const [goal, setGoal] = useState('balance');
  
  // Load yoga poses data
  const { data: poses = [], isLoading } = useQuery({
    queryKey: ['yogaPoses'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.BASE_URL}data/yoga-poses.json`);
      if (!response.ok) {
        throw new Error('Failed to load yoga poses');
      }
      return response.json();
    },
    staleTime: Infinity,
  });
  
  const handleGenerateSession = () => {
    const session = generateYogaSession({
      mode,
      level,
      poses,
      goal
    });
    
    // Navigate to session execution screen with the generated session
    navigate('/yoga-session', { state: { session } });
  };
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  const selectedMode = YOGA_MODES[mode.toUpperCase()];
  const breathingTechnique = selectedMode?.sympatheticActivation === 'low' 
    ? BREATHING_TECHNIQUES.UJJAYI 
    : BREATHING_TECHNIQUES.NATURAL;
  
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
        <SelfImprovement fontSize="large" />
        Yoga Session Builder
      </Typography>
      
      <Typography variant="subtitle1" sx={{ textAlign: 'center', mb: 4, color: 'text.secondary' }}>
        Evidence-based yoga flows from .github/HIIT-YOGA-GUIDE.md
      </Typography>
      
      <Box sx={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Mode Information */}
        {selectedMode && (
          <Alert 
            severity={selectedMode.sympatheticActivation === 'low' ? 'success' : 'info'} 
            sx={{ mb: 3 }}
            icon={selectedMode.sympatheticActivation === 'low' ? <Spa /> : <FitnessCenter />}
          >
            <Typography variant="subtitle2" gutterBottom>
              <strong>{selectedMode.name}</strong> - {selectedMode.duration} minutes
            </Typography>
            <Typography variant="body2" gutterBottom>
              {selectedMode.description}
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selectedMode.benefits.map((benefit, idx) => (
                <Chip key={idx} label={benefit} size="small" color="primary" variant="outlined" />
              ))}
            </Box>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Guide Reference: Section {selectedMode.guideSection} | 
              Nervous System: {selectedMode.sympatheticActivation === 'low' ? 'Parasympathetic (Calming)' : 'Balanced/Active'}
            </Typography>
          </Alert>
        )}
        
        {/* Configuration Cards */}
        <Grid container spacing={3}>
          {/* Mode Selection */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SelfImprovement />
                  Yoga Mode
                </Typography>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Mode</InputLabel>
                  <Select
                    value={mode}
                    label="Mode"
                    onChange={(e) => setMode(e.target.value)}
                  >
                    <MenuItem value="power">Power Yoga</MenuItem>
                    <MenuItem value="restorative">Restorative Yoga</MenuItem>
                    <MenuItem value="yin">Yin Yoga</MenuItem>
                    <MenuItem value="flexibility">Flexibility Focus</MenuItem>
                    <MenuItem value="core">Core Strength</MenuItem>
                  </Select>
                </FormControl>
                
                <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
                  {mode === 'power' && 'Dynamic flow focusing on strength, balance, and cardiovascular conditioning'}
                  {mode === 'restorative' && 'Deep relaxation with props, parasympathetic activation for recovery'}
                  {mode === 'yin' && 'Long passive holds (3-6 min) for deep tissue and fascia release'}
                  {mode === 'flexibility' && 'Target hip and hamstring opening, address tightness'}
                  {mode === 'core' && 'Build core strength and stability for athletic performance'}
                </Typography>
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
                  {level === 'beginner' && 'Shorter holds, simpler poses, more guidance'}
                  {level === 'intermediate' && 'Standard holds, balanced challenge'}
                  {level === 'advanced' && 'Longer holds, complex variations, arm balances and inversions'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Goal Selection */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Primary Goal
                </Typography>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Goal</InputLabel>
                  <Select
                    value={goal}
                    label="Goal"
                    onChange={(e) => setGoal(e.target.value)}
                  >
                    <MenuItem value="strength">Strength Building</MenuItem>
                    <MenuItem value="flexibility">Flexibility Development</MenuItem>
                    <MenuItem value="recovery">Recovery & Rest</MenuItem>
                    <MenuItem value="stress_relief">Stress Relief</MenuItem>
                    <MenuItem value="balance">Balance & Stability</MenuItem>
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Breathing Technique */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Breathing Technique
                </Typography>
                <Typography variant="subtitle2" color="primary" sx={{ mt: 2 }}>
                  {breathingTechnique.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {breathingTechnique.description}
                </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Instruction: {breathingTechnique.instruction}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Session Overview */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  What to Expect
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Warm-up Sequence" 
                      secondary="Gentle movements to prepare body and mind"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Main Practice" 
                      secondary={`${selectedMode?.duration - 10 || 30}-minute focused sequence`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Cool-down & Savasana" 
                      secondary="Integration, relaxation, and final rest"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Props Needed" 
                      secondary={mode === 'restorative' || mode === 'yin' 
                        ? "Yoga blocks, bolsters, straps, blankets (optional but recommended)" 
                        : "Yoga mat (optional: blocks for modifications)"}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Generate Button */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleGenerateSession}
            sx={{ minWidth: 250, py: 1.5, fontSize: '1.1rem' }}
          >
            Generate Yoga Session
          </Button>
        </Box>
        
        {/* Guide Reference */}
        <Alert severity="success" sx={{ mt: 3 }}>
          <Typography variant="body2">
            All yoga sequences follow evidence-based principles from .github/HIIT-YOGA-GUIDE.md
            with proper sequencing, hold timing, and breathwork integration for maximum health benefits.
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            <strong>Recovery Balance:</strong> Restorative and Yin yoga support parasympathetic nervous system
            activation, essential for balancing high-intensity training (Guide Section 10.1).
          </Typography>
        </Alert>
      </Box>
    </motion.div>
  );
};

export default YogaSessionSelection;
