import axios from 'axios';

export class WiseService {
    private readonly baseUrl: string;
    private readonly clientId: string;
    private readonly clientSecret: string;
    private readonly redirectUri: string;

    constructor() {
        this.baseUrl = 'https://api.wise.com';
        this.clientId = process.env.WISE_CLIENT_ID || '';
        this.clientSecret = process.env.WISE_CLIENT_SECRET || '';
        this.redirectUri = process.env.WISE_REDIRECT_URI || '';
    }

    getAuthUrl(): string {
        return `${this.baseUrl}/oauth/authorize?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&response_type=code`;
    }

    async getAccessToken(code: string): Promise<string> {
        const response = await axios.post(`${this.baseUrl}/oauth/token`, {
            grant_type: 'authorization_code',
            client_id: this.clientId,
            client_secret: this.clientSecret,
            code,
            redirect_uri: this.redirectUri
        });
        
        return response.data.access_token;
    }

    async createTransfer(accessToken: string, amount: number, sourceCurrency: string, targetCurrency: string) {
        // First create a quote
        const quote = await this.createQuote(accessToken, amount, sourceCurrency, targetCurrency);
        
        // Then create a transfer using the quote
        const transfer = await axios.post(
            `${this.baseUrl}/v3/transfers`,
            {
                targetAccount: process.env.WISE_RECIPIENT_ID,
                quoteUuid: quote.id,
            },
            {
                headers: { Authorization: `Bearer ${accessToken}` }
            }
        );

        return transfer.data;
    }

    private async createQuote(accessToken: string, amount: number, sourceCurrency: string, targetCurrency: string) {
        const response = await axios.post(
            `${this.baseUrl}/v3/quotes`,
            {
                sourceCurrency,
                targetCurrency,
                sourceAmount: amount,
                targetAccount: process.env.WISE_RECIPIENT_ID,
            },
            {
                headers: { Authorization: `Bearer ${accessToken}` }
            }
        );

        return response.data;
    }
}
