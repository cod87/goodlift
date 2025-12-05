/**
 * BottomSheet - A modal that slides up from the bottom of the screen
 * 
 * Follows the minimalist design pattern with global theme/fonts
 * Used for filter modals, options menus, and other contextual actions
 */

import PropTypes from 'prop-types';
import { Dialog, DialogContent, Box, IconButton, Typography, Slide } from '@mui/material';
import { Close } from '@mui/icons-material';
import { forwardRef } from 'react';

// Transition component for sliding up from bottom
const SlideUp = forwardRef(function SlideUp(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
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
  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={SlideUp}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          m: 0,
          borderRadius: '16px 16px 0 0',
          maxHeight,
          minHeight: '200px',
          overflow: 'hidden',
        },
      }}
      sx={{
        '& .MuiDialog-container': {
          alignItems: 'flex-end',
        },
      }}
    >
      {/* Handle bar for visual indication */}
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
      
      {/* Header with title and optional close button */}
      {(title || showCloseButton) && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 2,
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
