import { isGuestMode, getGuestData, setGuestData } from './guestStorage';

/**
 * Wellness Journal Storage Module
 * 
 * Manages persistence for wellness journal entries.
 * Each entry tracks which of the 4 categories (Mind, Body, Spirit, Community)
 * were attended to on a given day, along with bulleted notes per category.
 * 
 * Data shape:
 * {
 *   [dateKey: string]: {
 *     date: string,           // ISO date string (YYYY-MM-DD)
 *     categories: {
 *       mind:      { checked: boolean, notes: string[] },
 *       body:      { checked: boolean, notes: string[] },
 *       spirit:    { checked: boolean, notes: string[] },
 *       community: { checked: boolean, notes: string[] },
 *     }
 *   }
 * }
 * 
 * Stats shape:
 * {
 *   mind:      { totalDrops: number, level: number },
 *   body:      { totalDrops: number, level: number },
 *   spirit:    { totalDrops: number, level: number },
 *   community: { totalDrops: number, level: number },
 * }
 */

const KEYS = {
  WELLNESS_JOURNAL: 'goodlift_wellness_journal',
  WELLNESS_STATS: 'goodlift_wellness_stats',
};

/** Wellness category definitions */
export const WELLNESS_CATEGORIES = [
  { id: 'mind', label: 'Mind', emoji: '🧠', color: '#7c3aed' },
  { id: 'body', label: 'Body', emoji: '💪', color: '#e53e3e' },
  { id: 'spirit', label: 'Spirit', emoji: '✨', color: '#f6ad55' },
  { id: 'community', label: 'Community', emoji: '🤝', color: '#4299e1' },
];

/**
 * Level thresholds:
 * Level 1: 10 drops (up to 10), Level 2: 20 drops (11–30),
 * Level 3: 20 drops (31–50), Level 4: 50 drops (51–100),
 * Level 5+: 50 drops each (increments of 50)
 */
const LEVEL_THRESHOLDS = [10, 20, 20, 50];

export const getLevelInfo = (totalDrops) => {
  let level = 1;
  let dropsAccountedFor = 0;

  const getThreshold = (lvl) =>
    lvl <= LEVEL_THRESHOLDS.length ? LEVEL_THRESHOLDS[lvl - 1] : 50;

  let threshold = getThreshold(level);

  while (totalDrops >= dropsAccountedFor + threshold) {
    dropsAccountedFor += threshold;
    level++;
    threshold = getThreshold(level);
  }

  const dropsInCurrentLevel = totalDrops - dropsAccountedFor;
  const maxDropsForLevel = threshold;

  return {
    level,
    dropsInCurrentLevel,
    maxDropsForLevel,
    totalDrops,
    progress: dropsInCurrentLevel / maxDropsForLevel,
  };
};

/** Get today's date key in YYYY-MM-DD format */
export const getDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Create an empty entry for a given date */
const createEmptyEntry = (dateKey) => ({
  date: dateKey,
  categories: {
    mind: { checked: false, notes: [] },
    body: { checked: false, notes: [] },
    spirit: { checked: false, notes: [] },
    community: { checked: false, notes: [] },
  },
});

/** Create default stats */
const createDefaultStats = () => ({
  mind: { totalDrops: 0 },
  body: { totalDrops: 0 },
  spirit: { totalDrops: 0 },
  community: { totalDrops: 0 },
});

/**
 * Load all wellness journal entries
 * @returns {Object} Map of dateKey → entry
 */
export const getWellnessJournal = () => {
  try {
    if (isGuestMode()) {
      return getGuestData('wellness_journal') || {};
    }
    const data = localStorage.getItem(KEYS.WELLNESS_JOURNAL);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error loading wellness journal:', error);
    return {};
  }
};

/**
 * Load wellness stats (total drops per category)
 * @returns {Object} Stats object
 */
export const getWellnessStats = () => {
  try {
    if (isGuestMode()) {
      return getGuestData('wellness_stats') || createDefaultStats();
    }
    const data = localStorage.getItem(KEYS.WELLNESS_STATS);
    return data ? JSON.parse(data) : createDefaultStats();
  } catch (error) {
    console.error('Error loading wellness stats:', error);
    return createDefaultStats();
  }
};

/**
 * Get or create an entry for a specific date
 * @param {string} dateKey - YYYY-MM-DD format
 * @returns {Object} Journal entry for that date
 */
export const getEntryForDate = (dateKey) => {
  const journal = getWellnessJournal();
  return journal[dateKey] || createEmptyEntry(dateKey);
};

/**
 * Save a wellness journal entry and update stats accordingly.
 * Handles incrementing/decrementing drops when categories are checked/unchecked.
 * 
 * @param {string} dateKey - YYYY-MM-DD format
 * @param {Object} entry - The journal entry to save
 * @param {Object} previousEntry - The previous state of the entry (for diff)
 */
export const saveWellnessEntry = (dateKey, entry, previousEntry) => {
  try {
    const journal = getWellnessJournal();
    const stats = getWellnessStats();

    // Calculate drop changes by diffing previous vs current checked state
    const categoryIds = ['mind', 'body', 'spirit', 'community'];
    for (const catId of categoryIds) {
      const wasChecked = previousEntry?.categories?.[catId]?.checked || false;
      const isChecked = entry.categories[catId].checked;

      if (!wasChecked && isChecked) {
        // Newly checked → add a drop
        stats[catId].totalDrops = (stats[catId].totalDrops || 0) + 1;
      } else if (wasChecked && !isChecked) {
        // Unchecked → remove a drop (minimum 0)
        stats[catId].totalDrops = Math.max(0, (stats[catId].totalDrops || 0) - 1);
      }
    }

    journal[dateKey] = entry;

    // Persist
    if (isGuestMode()) {
      setGuestData('wellness_journal', journal);
      setGuestData('wellness_stats', stats);
    } else {
      localStorage.setItem(KEYS.WELLNESS_JOURNAL, JSON.stringify(journal));
      localStorage.setItem(KEYS.WELLNESS_STATS, JSON.stringify(stats));
    }

    return { journal, stats };
  } catch (error) {
    console.error('Error saving wellness entry:', error);
    throw error;
  }
};

/**
 * Recalculate stats from all journal entries (useful for data integrity)
 * @returns {Object} Recalculated stats
 */
export const recalculateStats = () => {
  const journal = getWellnessJournal();
  const stats = createDefaultStats();

  for (const entry of Object.values(journal)) {
    for (const catId of ['mind', 'body', 'spirit', 'community']) {
      if (entry.categories?.[catId]?.checked) {
        stats[catId].totalDrops++;
      }
    }
  }

  if (isGuestMode()) {
    setGuestData('wellness_stats', stats);
  } else {
    localStorage.setItem(KEYS.WELLNESS_STATS, JSON.stringify(stats));
  }

  return stats;
};
