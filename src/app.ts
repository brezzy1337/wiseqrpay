import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import { paymentRoutes } from './routes/paymentRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Routes
app.use('/api', paymentRoutes);

// Basic health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Only start the server if we're not in a Vercel environment
if (process.env.VERCEL !== '1') {
    app.listen(port, () => {
        console.log(`WizeQRPay server running on port ${port}`);
    });
}

// Export the Express app for Vercel
export default app;
