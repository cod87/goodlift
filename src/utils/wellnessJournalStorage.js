import { isGuestMode, getGuestData, setGuestData } from './guestStorage';

/**
 * Wellness Journal Storage Module
 * 
 * Manages persistence for wellness journal entries.
 * Each entry tracks which of the 7 categories (Physical, Nutritional, Social,
 * Spiritual, Intellectual, Financial, Environmental) were attended to on a
 * given day, along with bulleted notes per category.
 * 
 * Data shape:
 * {
 *   [dateKey: string]: {
 *     date: string,           // ISO date string (YYYY-MM-DD)
 *     categories: {
 *       physical:      { checked: boolean, notes: string[] },
 *       nutritional:   { checked: boolean, notes: string[] },
 *       social:        { checked: boolean, notes: string[] },
 *       spiritual:     { checked: boolean, notes: string[] },
 *       intellectual:  { checked: boolean, notes: string[] },
 *       financial:     { checked: boolean, notes: string[] },
 *       environmental: { checked: boolean, notes: string[] },
 *     }
 *   }
 * }
 * 
 * Stats shape:
 * {
 *   physical:      { totalDrops: number },
 *   nutritional:   { totalDrops: number },
 *   social:        { totalDrops: number },
 *   spiritual:     { totalDrops: number },
 *   intellectual:  { totalDrops: number },
 *   financial:     { totalDrops: number },
 *   environmental: { totalDrops: number },
 * }
 */

const KEYS = {
  WELLNESS_JOURNAL: 'goodlift_wellness_journal',
  WELLNESS_STATS: 'goodlift_wellness_stats',
};

/** Wellness category definitions */
export const WELLNESS_CATEGORIES = [
  { id: 'physical', label: 'Physical', emoji: '💪', color: '#e53e3e', description: 'Sleep quality and exercise' },
  { id: 'nutritional', label: 'Nutritional', emoji: '🥗', color: '#38a169', description: 'Eating well-balanced whole foods and staying hydrated' },
  { id: 'social', label: 'Social', emoji: '🤝', color: '#4299e1', description: 'Spending time with friends and family, establishing new connections, and building community' },
  { id: 'spiritual', label: 'Spiritual', emoji: '✨', color: '#f6ad55', description: 'Journaling, meditating, practicing art, time in nature, or quiet reflection' },
  { id: 'intellectual', label: 'Intellectual', emoji: '📚', color: '#7c3aed', description: 'Reading, learning, and practicing art' },
  { id: 'financial', label: 'Financial', emoji: '💰', color: '#d69e2e', description: 'Good money management' },
  { id: 'environmental', label: 'Environmental', emoji: '🌿', color: '#319795', description: 'Keeping your surroundings clean and organized' },
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
  categories: Object.fromEntries(
    WELLNESS_CATEGORIES.map((cat) => [cat.id, { checked: false, notes: [] }])
  ),
});

/** Create default stats */
const createDefaultStats = () =>
  Object.fromEntries(
    WELLNESS_CATEGORIES.map((cat) => [cat.id, { totalDrops: 0 }])
  );

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
    const categoryIds = WELLNESS_CATEGORIES.map((cat) => cat.id);
    for (const catId of categoryIds) {
      // Ensure stats entry exists (handles migration from old categories)
      if (!stats[catId]) {
        stats[catId] = { totalDrops: 0 };
      }
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
    for (const catId of WELLNESS_CATEGORIES.map((cat) => cat.id)) {
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
