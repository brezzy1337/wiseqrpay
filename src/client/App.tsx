import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import { trpc } from './utils/trpc';
import PaymentForm from './components/PaymentForm';

const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
        },
    },
});

const App: React.FC = () => {
    const [queryClient] = useState(() => new QueryClient());
    const [trpcClient] = useState(() =>
        trpc.createClient({
            links: [
                httpBatchLink({
                    url: 'http://localhost:3001/trpc',
                }),
            ],
        })
    );

    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>
                    <PaymentForm />
                </ThemeProvider>
            </QueryClientProvider>
        </trpc.Provider>
    );
};

export default App;
