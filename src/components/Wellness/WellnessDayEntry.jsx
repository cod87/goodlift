import { useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Checkbox,
  IconButton,
  TextField,
  useTheme,
} from '@mui/material';
import { Add, Close } from '@mui/icons-material';
import { WELLNESS_CATEGORIES } from '../../utils/wellnessJournalStorage';

/**
 * WellnessDayEntry - Daily check-off and bulleted notes for each wellness category.
 * 
 * For each of the 4 categories (Mind, Body, Spirit, Community):
 * - A checkbox to mark it as attended
 * - Bulleted notes that can be added/removed
 */
const WellnessDayEntry = ({ entry, onUpdate }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const handleToggleCategory = useCallback((categoryId) => {
    const updated = {
      ...entry,
      categories: {
        ...entry.categories,
        [categoryId]: {
          ...entry.categories[categoryId],
          checked: !entry.categories[categoryId].checked,
        },
      },
    };
    onUpdate(updated);
  }, [entry, onUpdate]);

  const handleAddNote = useCallback((categoryId, noteInput) => {
    // Support both a single string and an array of strings
    const items = Array.isArray(noteInput) ? noteInput : [noteInput];
    const validNotes = items.map((n) => n.trim()).filter((n) => n.length > 0);
    if (validNotes.length === 0) return;
    const updated = {
      ...entry,
      categories: {
        ...entry.categories,
        [categoryId]: {
          ...entry.categories[categoryId],
          notes: [...(entry.categories[categoryId].notes || []), ...validNotes],
        },
      },
    };
    onUpdate(updated);
  }, [entry, onUpdate]);

  const handleRemoveNote = useCallback((categoryId, noteIndex) => {
    const updated = {
      ...entry,
      categories: {
        ...entry.categories,
        [categoryId]: {
          ...entry.categories[categoryId],
          notes: entry.categories[categoryId].notes.filter((_, i) => i !== noteIndex),
        },
      },
    };
    onUpdate(updated);
  }, [entry, onUpdate]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {WELLNESS_CATEGORIES.map((cat) => {
        const catData = entry.categories[cat.id] || { checked: false, notes: [] };

        return (
          <CategoryRow
            key={cat.id}
            category={cat}
            data={catData}
            isDark={isDark}
            onToggle={() => handleToggleCategory(cat.id)}
            onAddNote={(text) => handleAddNote(cat.id, text)}
            onRemoveNote={(index) => handleRemoveNote(cat.id, index)}
          />
        );
      })}
    </Box>
  );
};

WellnessDayEntry.propTypes = {
  entry: PropTypes.shape({
    date: PropTypes.string.isRequired,
    categories: PropTypes.object.isRequired,
  }).isRequired,
  onUpdate: PropTypes.func.isRequired,
};

/** Single category row with checkbox, label, and notes */
const CategoryRow = ({ category, data, isDark, onToggle, onAddNote, onRemoveNote }) => {
  const [noteInput, setNoteInput] = useState('');
  const [showInput, setShowInput] = useState(false);
  const submittedRef = useRef(false);

  const handleSubmitNote = () => {
    if (submittedRef.current) return;
    const lines = noteInput.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length > 0) {
      submittedRef.current = true;
      onAddNote(lines);
      setNoteInput('');
      setShowInput(false);
      // Reset flag after a tick to allow future submissions
      setTimeout(() => { submittedRef.current = false; }, 0);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmitNote();
    } else if (e.key === 'Escape') {
      setNoteInput('');
      setShowInput(false);
    }
  };

  return (
    <Box
      sx={{
        background: isDark
          ? data.checked ? `${category.color}12` : 'rgba(255,255,255,0.03)'
          : data.checked ? `${category.color}08` : 'var(--color-surface)',
        borderRadius: 'var(--radius-md, 12px)',
        border: `1px solid ${data.checked ? `${category.color}40` : isDark ? 'rgba(255,255,255,0.06)' : 'var(--color-border)'}`,
        padding: { xs: '0.75rem', sm: '1rem' },
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header: checkbox + label + add note button */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        <Checkbox
          checked={data.checked}
          onChange={onToggle}
          sx={{
            color: `${category.color}60`,
            '&.Mui-checked': { color: category.color },
            padding: '4px',
          }}
          inputProps={{ 'aria-label': `Mark ${category.label} as attended` }}
        />

        <Typography sx={{ fontSize: '1.1rem', lineHeight: 1 }}>
          {category.emoji}
        </Typography>

        <Typography
          sx={{
            fontSize: { xs: '0.85rem', sm: '0.9rem' },
            fontWeight: 600,
            color: data.checked ? category.color : isDark ? 'rgba(255,255,255,0.7)' : 'text.primary',
            flex: 1,
          }}
        >
          {category.label}
        </Typography>

        <IconButton
          size="small"
          onClick={() => setShowInput(!showInput)}
          sx={{
            color: category.color,
            opacity: 0.6,
            '&:hover': { opacity: 1, background: `${category.color}15` },
            padding: '4px',
          }}
          aria-label={`Add note to ${category.label}`}
        >
          <Add sx={{ fontSize: '1.1rem' }} />
        </IconButton>
      </Box>

      {/* Note input */}
      {showInput && (
        <Box sx={{ mt: 1, ml: 4.5 }}>
          <TextField
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (noteInput.trim()) {
                handleSubmitNote();
              } else {
                setShowInput(false);
              }
            }}
            placeholder={`Add notes for ${category.label} (one per line)...`}
            size="small"
            fullWidth
            autoFocus
            multiline
            minRows={2}
            maxRows={6}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '0.85rem',
                borderRadius: '8px',
                '& fieldset': { borderColor: `${category.color}30` },
                '&:hover fieldset': { borderColor: `${category.color}60` },
                '&.Mui-focused fieldset': { borderColor: category.color },
              },
            }}
            inputProps={{ maxLength: 1000 }}
          />
        </Box>
      )}

      {/* Existing notes */}
      {data.notes && data.notes.length > 0 && (
        <Box sx={{ mt: 0.75, ml: 4.5 }}>
          {data.notes.map((note, idx) => (
            <Box
              key={idx}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 0.5,
                py: 0.25,
                '&:hover .note-remove': { opacity: 1 },
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  color: category.color,
                  mt: '2px',
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                •
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: '0.8rem', sm: '0.85rem' },
                  color: isDark ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                  lineHeight: 1.4,
                  flex: 1,
                  wordBreak: 'break-word',
                }}
              >
                {note}
              </Typography>
              <IconButton
                className="note-remove"
                size="small"
                onClick={() => onRemoveNote(idx)}
                sx={{
                  opacity: { xs: 0.6, sm: 0 },
                  padding: '2px',
                  '&:hover': { color: 'error.main' },
                  transition: 'opacity 0.15s ease',
                }}
                aria-label="Remove note"
              >
                <Close sx={{ fontSize: '0.85rem' }} />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

CategoryRow.propTypes = {
  category: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    emoji: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
  }).isRequired,
  data: PropTypes.shape({
    checked: PropTypes.bool.isRequired,
    notes: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  isDark: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  onAddNote: PropTypes.func.isRequired,
  onRemoveNote: PropTypes.func.isRequired,
};

export default WellnessDayEntry;
