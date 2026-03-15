import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { ChevronLeft, ChevronRight, Today } from '@mui/icons-material';
import WellnessBuckets from '../components/Wellness/WellnessBuckets';
import WellnessDayEntry from '../components/Wellness/WellnessDayEntry';
import {
  getDateKey,
  getEntryForDate,
  saveWellnessEntry,
  getWellnessStats,
} from '../utils/wellnessJournalStorage';
import { BREAKPOINTS } from '../theme/responsive';

/**
 * WellnessJournalScreen - Main page for the wellness journal feature.
 * 
 * Layout:
 * 1. Bucket visualization at top (showing progress for Mind, Body, Spirit, Community)
 * 2. Date navigation (prev/next day)
 * 3. Daily check-off and notes entry
 */
const WellnessJournalScreen = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isDesktop = useMediaQuery(`(min-width: ${BREAKPOINTS.desktop}px)`);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entry, setEntry] = useState(null);
  const [stats, setStats] = useState(null);

  // Keep a ref of the entry before current edits for diff purposes
  const previousEntryRef = useRef(null);

  const dateKey = getDateKey(selectedDate);

  // Load entry and stats on mount and date change
  useEffect(() => {
    const loadedEntry = getEntryForDate(dateKey);
    setEntry(loadedEntry);
    previousEntryRef.current = JSON.parse(JSON.stringify(loadedEntry));
    setStats(getWellnessStats());
  }, [dateKey]);

  // Navigate dates
  const goToPreviousDay = useCallback(() => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
  }, []);

  const goToNextDay = useCallback(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      // Don't go past today
      if (d > tomorrow) return prev;
      return d;
    });
  }, []);

  const goToToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  // Handle entry updates from the day entry component
  const handleEntryUpdate = useCallback((updatedEntry) => {
    const result = saveWellnessEntry(dateKey, updatedEntry, previousEntryRef.current);
    setEntry(updatedEntry);
    previousEntryRef.current = JSON.parse(JSON.stringify(updatedEntry));
    setStats(result.stats);
  }, [dateKey]);

  // Check if selected date is today
  const isToday = getDateKey(selectedDate) === getDateKey(new Date());

  // Format display date
  const displayDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  if (!entry || !stats) return null;

  return (
    <Box
      sx={{
        padding: { xs: 1.5, sm: 1.5, md: 2, lg: 3 },
        paddingTop: { xs: 0.5, sm: 0.5, md: 1, lg: 1.5 },
        maxWidth: isDesktop ? '1400px' : '1200px',
        margin: '0 auto',
        minHeight: 'calc(100vh - 48px)',
        paddingBottom: { xs: '80px', md: '2rem' },
      }}
    >
      {/* Section title */}
      <Typography
        sx={{
          fontSize: { xs: '0.7rem', sm: '0.75rem' },
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: isDark ? 'rgba(255,255,255,0.4)' : 'text.secondary',
          mb: 1.5,
          textAlign: 'center',
        }}
      >
        Wellness Journal
      </Typography>

      {/* Bucket visualizations */}
      <WellnessBuckets stats={stats} />

      {/* Date navigation */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          mb: 2,
        }}
      >
        <IconButton
          onClick={goToPreviousDay}
          size="small"
          sx={{
            color: isDark ? 'rgba(255,255,255,0.6)' : 'text.secondary',
          }}
          aria-label="Previous day"
        >
          <ChevronLeft />
        </IconButton>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            cursor: !isToday ? 'pointer' : 'default',
          }}
          onClick={!isToday ? goToToday : undefined}
        >
          <Typography
            sx={{
              fontSize: { xs: '0.9rem', sm: '1rem' },
              fontWeight: 600,
              color: isToday ? 'primary.main' : 'text.primary',
            }}
          >
            {isToday ? 'Today' : displayDate}
          </Typography>
          {!isToday && (
            <Today
              sx={{
                fontSize: '1rem',
                color: 'primary.main',
                opacity: 0.7,
              }}
            />
          )}
        </Box>

        <IconButton
          onClick={goToNextDay}
          size="small"
          disabled={isToday}
          sx={{
            color: isDark ? 'rgba(255,255,255,0.6)' : 'text.secondary',
          }}
          aria-label="Next day"
        >
          <ChevronRight />
        </IconButton>
      </Box>

      {/* Day entry - checkboxes and notes */}
      <WellnessDayEntry
        entry={entry}
        onUpdate={handleEntryUpdate}
      />
    </Box>
  );
};

export default WellnessJournalScreen;
