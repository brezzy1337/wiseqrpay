import 'express-session';

declare module 'express-session' {
    interface SessionData {
        accessToken?: string;
        paymentDetails?: {
            amount?: string;
            sourceCurrency?: string;
            targetCurrency?: string;
        };
    }
}
