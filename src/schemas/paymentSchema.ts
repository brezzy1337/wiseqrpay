import { z } from 'zod';

export const paymentDetailsSchema = z.object({
    amount: z.string().min(1, 'Amount is required')
        .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid number'),
    sourceCurrency: z.string().min(1, 'Source currency is required'),
    targetCurrency: z.string().min(1, 'Target currency is required')
});

export const authCallbackSchema = z.object({
    code: z.string().min(1, 'Authorization code is required')
});

export type PaymentDetails = z.infer<typeof paymentDetailsSchema>;
export type AuthCallback = z.infer<typeof authCallbackSchema>;
