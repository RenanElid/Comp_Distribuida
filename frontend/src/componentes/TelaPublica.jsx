import { Box, Paper, Typography } from '@mui/material';

// Centered card used by the pages that work without login (login, password reset, email check)
export default function TelaPublica({ titulo, subtitulo, children, ...propsDoPaper }) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: 'grey.100', p: 2 }}>
      <Paper sx={{ p: 4, width: '100%', maxWidth: 400 }} {...propsDoPaper}>
        <Typography variant="h5" gutterBottom>
          {titulo}
        </Typography>
        {subtitulo && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {subtitulo}
          </Typography>
        )}
        {children}
      </Paper>
    </Box>
  );
}
