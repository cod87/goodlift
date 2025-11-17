/**
 * Preset avatars - simple colored circles with initials using app theme colors
 * These use only the official app theme colors for consistency
 */
export const PRESET_AVATARS = [
  { id: 'preset-1', color: '#1db584', label: 'Primary Teal' },
  { id: 'preset-2', color: '#18a071', label: 'Dark Teal' },
  { id: 'preset-3', color: '#2dd099', label: 'Light Teal' },
  { id: 'preset-4', color: '#ff8c00', label: 'Orange' },
  { id: 'preset-5', color: '#ffa333', label: 'Light Orange' },
  { id: 'preset-6', color: '#cc7000', label: 'Dark Orange' },
  { id: 'preset-7', color: '#ef5350', label: 'Red' },
  { id: 'preset-8', color: '#6b8a9d', label: 'Blue Grey' },
];

/**
 * Doggo avatars - preset dog images
 * Users can select these as their avatar in the Doggos section
 * Images are hosted locally in the repository
 */
export const DOGGO_AVATARS = [
  { 
    id: 'doggo-1', 
    url: '/avatars/doggo-1.jpeg',
    label: 'Doggo 1' 
  },
  { 
    id: 'doggo-2', 
    url: '/avatars/doggo-2.jpeg',
    label: 'Doggo 2' 
  },
  { 
    id: 'doggo-3', 
    url: '/avatars/doggo-3.jpeg',
    label: 'Doggo 3' 
  },
  { 
    id: 'doggo-4', 
    url: '/avatars/doggo-4.jpeg',
    label: 'Doggo 4' 
  },
];



/**
 * Check if avatar is a preset or doggo avatar
 * @param {string} avatar - Avatar string (preset ID, doggo ID, or legacy URL)
 * @returns {boolean} True if preset or doggo, false if legacy custom URL
 */
export const isPresetAvatar = (avatar) => {
  if (!avatar) return false;
  return avatar.startsWith('preset-') || avatar.startsWith('doggo-');
};

/**
 * Check if avatar is a doggo avatar
 * @param {string} avatar - Avatar string
 * @returns {boolean} True if doggo avatar
 */
export const isDoggoAvatar = (avatar) => {
  if (!avatar) return false;
  return avatar.startsWith('doggo-');
};

/**
 * Get preset avatar color
 * @param {string} presetId - Preset avatar ID
 * @returns {string|null} Color code or null if not found
 */
export const getPresetAvatarColor = (presetId) => {
  const preset = PRESET_AVATARS.find(p => p.id === presetId);
  return preset ? preset.color : null;
};

/**
 * Get doggo avatar URL
 * @param {string} doggoId - Doggo avatar ID
 * @returns {string|null} URL or null if not found
 */
export const getDoggoAvatarUrl = (doggoId) => {
  const doggo = DOGGO_AVATARS.find(d => d.id === doggoId);
  return doggo ? doggo.url : null;
};

/**
 * Generate avatar initials element
 * @param {string} initials - User initials
 * @param {string} color - Background color (defaults to app orange #ff8c00)
 * @returns {Object} Style object for avatar display
 */
export const getInitialsAvatarStyle = (initials, color = '#ff8c00') => {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: color,
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '2rem',
    textTransform: 'uppercase',
  };
};
