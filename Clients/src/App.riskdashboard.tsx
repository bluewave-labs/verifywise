import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Container, Typography, Stack } from '@mui/material';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './application/redux/store';
import light from './presentation/themes/light';
import RiskDashboard from './presentation/components/RiskDashboard';

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Router>
          <ThemeProvider theme={light}>
            <CssBaseline />
            <Container maxWidth="lg" sx={{ py: 4 }}>
              <Stack spacing={4}>
                <Typography 
                  variant="h4" 
                  component="h1" 
                  sx={{ 
                    fontWeight: 600,
                    color: 'text.primary',
                    mb: 2
                  }}
                >
                  Risk Dashboard
                </Typography>
                
                <RiskDashboard 
                  projectId="1"
                  onVendorRisksViewDetails={() => console.log('Navigate to vendor risks')}
                  onProjectRisksViewDetails={() => console.log('Navigate to project risks')}
                />
              </Stack>
            </Container>
          </ThemeProvider>
        </Router>
      </PersistGate>
    </Provider>
  );
}

export default App;