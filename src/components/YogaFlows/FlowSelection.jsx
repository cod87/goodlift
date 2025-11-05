import { useState } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from '@mui/material';
import { Schedule, FitnessCenter, SelfImprovement, OpenInNew } from '@mui/icons-material';
import { yogaFlowsData, getDifficultyLevels, getDurations } from '../../data/yogaFlows';

/**
 * FlowSelection Component
 * Browse and select yoga flows with filtering options
 */
const FlowSelection = ({ onStartFlow }) => {
  const [durationFilter, setDurationFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const difficultyLevels = getDifficultyLevels();
  const durations = getDurations();

  // Get difficulty color
  const getDifficultyColor = (level) => {
    switch (level) {
      case 'Beginner':
        return 'success';
      case 'Intermediate':
        return 'warning';
      case 'Advanced':
        return 'error';
      default:
        return 'default';
    }
  };

  // Filter flows
  const filteredFlows = yogaFlowsData.filter((flow) => {
    if (durationFilter !== 'all' && flow.durationMinutes !== parseInt(durationFilter)) {
      return false;
    }
    if (difficultyFilter !== 'all' && flow.difficultyLevel !== difficultyFilter) {
      return false;
    }
    return true;
  });

  // Sort flows
  const diffOrder = { Beginner: 1, Intermediate: 2, Advanced: 3 };
  const sortedFlows = [...filteredFlows].sort((a, b) => {
    switch (sortBy) {
      case 'duration':
        return a.durationMinutes - b.durationMinutes;
      case 'difficulty':
        return diffOrder[a.difficultyLevel] - diffOrder[b.difficultyLevel];
      case 'name':
      default:
        return a.flowName.localeCompare(b.flowName);
    }
  });

  return (
    <Box
      sx={{
        padding: { xs: '2rem 1rem', sm: '2rem', md: '3rem' },
        maxWidth: '1400px',
        margin: '0 auto',
        minHeight: 'calc(100vh - 60px)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography
          variant="h3"
          sx={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 800,
            color: 'primary.main',
            marginBottom: '0.5rem',
            textAlign: 'center',
          }}
        >
          Yoga Flows
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            marginBottom: '2rem',
            textAlign: 'center',
          }}
        >
          Choose a guided yoga flow to enhance flexibility, strength, and mindfulness
        </Typography>

        {/* Filters */}
        <Card sx={{ marginBottom: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Duration</InputLabel>
                  <Select
                    value={durationFilter}
                    label="Duration"
                    onChange={(e) => setDurationFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Durations</MenuItem>
                    {durations.map((duration) => (
                      <MenuItem key={duration} value={duration}>
                        {duration} minutes
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Difficulty</InputLabel>
                  <Select
                    value={difficultyFilter}
                    label="Difficulty"
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Levels</MenuItem>
                    {difficultyLevels.map((level) => (
                      <MenuItem key={level} value={level}>
                        {level}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort By"
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <MenuItem value="name">Name</MenuItem>
                    <MenuItem value="duration">Duration</MenuItem>
                    <MenuItem value="difficulty">Difficulty</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Results count */}
        <Typography
          variant="body2"
          sx={{ marginBottom: 2, color: 'text.secondary' }}
        >
          Showing {sortedFlows.length} flow{sortedFlows.length !== 1 ? 's' : ''}
        </Typography>

        {/* Flow Cards */}
        <Grid container spacing={3}>
          {sortedFlows.map((flow, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: 6,
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, padding: 3 }}>
                    {/* Header */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 2,
                      }}
                    >
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          color: 'primary.main',
                          flexGrow: 1,
                          marginRight: 1,
                        }}
                      >
                        {flow.flowName}
                      </Typography>
                      <Chip
                        label={flow.difficultyLevel}
                        color={getDifficultyColor(flow.difficultyLevel)}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>

                    {/* Duration and Focus */}
                    <Stack direction="row" spacing={1} sx={{ marginBottom: 2 }}>
                      <Chip
                        icon={<Schedule />}
                        label={`${flow.durationMinutes} min`}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                      <Chip
                        icon={<SelfImprovement />}
                        label={flow.pace}
                        size="small"
                        variant="outlined"
                      />
                    </Stack>

                    {/* Primary Focus */}
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, marginBottom: 0.5, color: 'primary.main' }}
                    >
                      Focus:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ marginBottom: 2, color: 'text.secondary' }}
                    >
                      {flow.primaryFocus}
                    </Typography>

                    {/* Target Muscles */}
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, marginBottom: 0.5, color: 'primary.main' }}
                    >
                      Target Muscles:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ marginBottom: 2, color: 'text.secondary' }}
                    >
                      {flow.targetMuscles}
                    </Typography>

                    {/* Suitable For */}
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, marginBottom: 0.5, color: 'primary.main' }}
                    >
                      Suitable For:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ marginBottom: 2, color: 'text.secondary' }}
                    >
                      {flow.suitableFor}
                    </Typography>

                    {/* Props */}
                    {flow.propsNeeded && (
                      <>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600, marginBottom: 0.5, color: 'primary.main' }}
                        >
                          Props Needed:
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ marginBottom: 2, color: 'text.secondary' }}
                        >
                          {flow.propsNeeded}
                        </Typography>
                      </>
                    )}

                    {/* Poses */}
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, marginBottom: 0.5, color: 'primary.main' }}
                    >
                      Poses Included ({flow.posesIncluded.length}):
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, marginBottom: 2 }}>
                      {flow.posesIncluded.slice(0, 5).map((pose, idx) => (
                        <Chip key={idx} label={pose} size="small" variant="outlined" />
                      ))}
                      {flow.posesIncluded.length > 5 && (
                        <Chip
                          label={`+${flow.posesIncluded.length - 5} more`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </CardContent>

                  {/* Actions */}
                  <CardContent sx={{ paddingTop: 0 }}>
                    <Stack spacing={1}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => onStartFlow(flow)}
                        startIcon={<FitnessCenter />}
                        sx={{ fontWeight: 600 }}
                      >
                        Start Flow
                      </Button>
                      {flow.youtubeLink && (
                        <Button
                          variant="outlined"
                          fullWidth
                          startIcon={<OpenInNew />}
                          onClick={() => window.open(flow.youtubeLink, '_blank')}
                          size="small"
                        >
                          Watch Video
                        </Button>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {sortedFlows.length === 0 && (
          <Box sx={{ textAlign: 'center', padding: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No flows match your filters
            </Typography>
          </Box>
        )}
      </motion.div>
    </Box>
  );
};

FlowSelection.propTypes = {
  onStartFlow: PropTypes.func.isRequired,
};

export default FlowSelection;
