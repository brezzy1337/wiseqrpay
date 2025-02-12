import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material';
import PaymentForm from './components/PaymentForm';

const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
        },
    },
});

const App: React.FC = () => {
    return (
        <ThemeProvider theme={theme}>
            <PaymentForm />
        </ThemeProvider>
    );
};

export default App;
