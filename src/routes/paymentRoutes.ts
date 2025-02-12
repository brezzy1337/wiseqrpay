import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';

const router = Router();
const paymentController = new PaymentController();

// Route to initiate OAuth flow
router.get('/auth', paymentController.initiateAuth);

// OAuth callback route
router.get('/auth/callback', paymentController.handleCallback);

// Route to create a new payment
router.post('/payment', paymentController.createPayment);

// Route to get payment status
router.get('/payment/:id', paymentController.getPaymentStatus);

export const paymentRoutes = router;
