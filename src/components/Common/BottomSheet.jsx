/**
 * BottomSheet - A responsive modal component
 * 
 * Responsive behavior:
 * - Mobile/tablet portrait: Full width, slides up from bottom
 * - Mobile/tablet landscape: Enters from left, full height, full width
 * 
 * Follows the minimalist design pattern with global theme/fonts
 * Used for filter modals, options menus, and other contextual actions
 */

import PropTypes from 'prop-types';
import { Dialog, DialogContent, Box, IconButton, Typography, Slide, useMediaQuery } from '@mui/material';
import { Close } from '@mui/icons-material';
import { forwardRef, useMemo } from 'react';

// Transition component for sliding up from bottom
const SlideUp = forwardRef(function SlideUp(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Transition component for sliding from left
const SlideRight = forwardRef(function SlideRight(props, ref) {
  return <Slide direction="right" ref={ref} {...props} />;
});

/**
 * BottomSheet component
 * @param {boolean} open - Whether the bottom sheet is open
 * @param {function} onClose - Callback when the bottom sheet is closed
 * @param {string} title - Optional title for the bottom sheet
 * @param {ReactNode} children - Content to display in the bottom sheet
 * @param {boolean} showCloseButton - Whether to show the close button
 * @param {string} maxHeight - Maximum height of the bottom sheet
 */
const BottomSheet = ({
  open,
  onClose,
  title,
  children,
  showCloseButton = true,
  maxHeight = '70vh',
}) => {
  // Detect landscape orientation (on mobile/tablet)
  const isLandscape = useMediaQuery('(orientation: landscape) and (max-height: 600px)');
  
  // Determine which transition and styling to use
  const TransitionComponent = isLandscape ? SlideRight : SlideUp;
  
  // Memoize paper props based on orientation
  const paperProps = useMemo(() => ({
    sx: isLandscape ? {
      // Landscape mode: slide from left, full height, full width
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      m: 0,
      borderRadius: '0 16px 16px 0',
      width: '100vw',
      maxWidth: '100vw',
      height: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden',
    } : {
      // Portrait mode: slide up from bottom, full width
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      m: 0,
      borderRadius: '16px 16px 0 0',
      width: '100vw',
      maxWidth: '100vw',
      maxHeight,
      minHeight: '200px',
      overflow: 'hidden',
    },
  }), [isLandscape, maxHeight]);
  
  // Memoize dialog sx based on orientation
  const dialogSx = useMemo(() => ({
    '& .MuiDialog-container': {
      alignItems: isLandscape ? 'stretch' : 'flex-end',
      justifyContent: isLandscape ? 'flex-start' : 'center',
    },
  }), [isLandscape]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={TransitionComponent}
      fullWidth
      maxWidth={false}
      PaperProps={paperProps}
      sx={dialogSx}
    >
      {/* Handle bar for visual indication - only show in portrait mode */}
      {!isLandscape && (
        <Box
          sx={{
            width: '40px',
            height: '4px',
            bgcolor: 'divider',
            borderRadius: '2px',
            mx: 'auto',
            mt: 1.5,
            mb: 1,
          }}
        />
      )}
      
      {/* Header with title and optional close button */}
      {(title || showCloseButton) && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 2,
            pt: isLandscape ? 2 : 0,
            pb: 1,
            borderBottom: title ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          {title && (
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontSize: '1.1rem',
              }}
            >
              {title}
            </Typography>
          )}
          {showCloseButton && (
            <IconButton
              onClick={onClose}
              size="small"
              sx={{
                ml: 'auto',
                color: 'text.secondary',
              }}
              aria-label="Close"
            >
              <Close fontSize="small" />
            </IconButton>
          )}
        </Box>
      )}
      
      {/* Content area */}
      <DialogContent
        sx={{
          p: 2,
          pt: title ? 2 : 1,
          overflowY: 'auto',
          flex: isLandscape ? 1 : undefined,
        }}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
};

BottomSheet.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node,
  showCloseButton: PropTypes.bool,
  maxHeight: PropTypes.string,
};

export default BottomSheet;
