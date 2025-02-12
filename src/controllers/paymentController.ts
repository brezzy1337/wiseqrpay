import { Request, Response } from 'express';
import { WiseService } from '../services/wiseService';
import { paymentDetailsSchema, authCallbackSchema } from '../schemas/paymentSchema';

export class PaymentController {
    private wiseService: WiseService;

    constructor() {
        this.wiseService = new WiseService();
    }

    initiateAuth = async (req: Request, res: Response) => {
        try {
            const paymentDetails = paymentDetailsSchema.parse({
                amount: req.query.amount,
                sourceCurrency: req.query.sourceCurrency,
                targetCurrency: req.query.targetCurrency
            });

            const authUrl = this.wiseService.getAuthUrl();
            req.session.paymentDetails = paymentDetails;
            res.redirect(authUrl);
        } catch (error) {
            console.error('Auth initiation error:', error);
            if (error.errors) {
                return res.status(400).json({ errors: error.errors });
            }
            res.status(500).json({ error: 'Failed to initiate authentication' });
        }
    };
    handleCallback = async (req: Request, res: Response) => {
        try {
            const { code } = authCallbackSchema.parse(req.query);
            const accessToken = await this.wiseService.getAccessToken(code);
            
            // Store the access token in session
            req.session.accessToken = accessToken;

            // If there were payment details stored, proceed with payment
            if (req.session.paymentDetails) {
                res.redirect('/api/payment/create');
            } else {
                res.redirect('/');
            }
        } catch (error) {
            console.error('OAuth callback error:', error);
            res.status(500).json({ error: 'Failed to handle OAuth callback' });
        }
    };

    createPayment = async (req: Request, res: Response) => {
        try {
            const accessToken = req.session.accessToken;
            if (!accessToken) {
                return res.status(401).json({ error: 'Not authenticated with Wise' });
            }

            const paymentDetails = paymentDetailsSchema.parse(req.body);
            const transfer = await this.wiseService.createTransfer(
                accessToken,
                parseFloat(paymentDetails.amount),
                paymentDetails.sourceCurrency,
                paymentDetails.targetCurrency
            );

            res.status(201).json({
                success: true,
                transferId: transfer.id,
                status: transfer.status
            });
        } catch (error) {
            console.error('Payment creation error:', error);
            res.status(500).json({ error: 'Failed to create payment' });
        }
    };

    getPaymentStatus = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            // TODO: Implement status check with Wise API
            res.status(200).json({
                transferId: id,
                status: 'pending' // This should be fetched from Wise API
            });
        } catch (error) {
            console.error('Payment status check error:', error);
            res.status(500).json({ error: 'Failed to check payment status' });
        }
    };
}
