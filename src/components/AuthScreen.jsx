import { motion, AnimatePresence } from 'framer-motion';
import { Box, TextField, Button, Typography, Alert, Card, CardContent, Divider } from '@mui/material';
import { useLoginForm } from '../hooks/useLoginForm';
import { useAuth } from '../contexts/AuthContext';

const AuthScreen = () => {
  const {
    isLogin,
    email,
    setEmail,
    password,
    setPassword,
    error,
    loading,
    handleSubmit,
    toggleMode,
  } = useLoginForm();
  
  const { continueAsGuest } = useAuth();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, rgb(253, 244, 227) 0%, rgb(254, 230, 200) 100%)',
        p: 2,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card
          sx={{
            maxWidth: 440,
            width: '100%',
            borderRadius: 4,
            boxShadow: '0 8px 32px rgba(19, 70, 134, 0.2)',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                style={{ marginBottom: '1rem' }}
              >
               <img
  src={`${import.meta.env.BASE_URL}goodlift-logo.svg`}
  alt="GoodLift"
  style={{ height: '80px', width: 'auto' }}
/>
              </motion.div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={isLogin ? 'login' : 'signup'}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {isLogin
                      ? 'Log in to continue your fitness journey'
                      : 'Sign up to start tracking your workouts'}
                  </Typography>
                </motion.div>
              </AnimatePresence>
            </Box>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                sx={{ mb: 3 }}
              />

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    bgcolor: 'primary.main',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                  }}
                >
                  {loading ? 'Please wait...' : isLogin ? 'Log In' : 'Sign Up'}
                </Button>
              </motion.div>

              <Divider sx={{ my: 2 }}>OR</Divider>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  disabled={loading}
                  onClick={continueAsGuest}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderColor: 'secondary.main',
                    color: 'secondary.main',
                    '&:hover': {
                      borderColor: 'secondary.dark',
                      bgcolor: 'rgba(237, 63, 39, 0.05)',
                    },
                  }}
                >
                  Continue as Guest
                </Button>
              </motion.div>

              <Box
                sx={{
                  mt: 3,
                  pt: 3,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <Button
                    onClick={toggleMode}
                    disabled={loading}
                    sx={{
                      color: 'primary.main',
                      fontWeight: 600,
                      textDecoration: 'underline',
                      '&:hover': {
                        bgcolor: 'transparent',
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    {isLogin ? 'Sign Up' : 'Log In'}
                  </Button>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
};

export default AuthScreen;
