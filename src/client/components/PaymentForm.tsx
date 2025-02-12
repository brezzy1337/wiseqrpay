import React, { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Typography,
    Paper,
} from '@mui/material';
import QRCode from 'react-qr-code';

interface PaymentFormData {
    country: string;
    service: string;
    accountNumber: string;
    amount: string;
    currency: string;
}

const PaymentForm: React.FC = () => {
    const [formData, setFormData] = useState<PaymentFormData>({
        country: '',
        service: '',
        accountNumber: '',
        amount: '',
        currency: 'USD'
    });
    const [qrValue, setQrValue] = useState<string>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Generate payment URL
        const paymentUrl = `${window.location.origin}/api/payment?` + 
            new URLSearchParams(formData as any).toString();
        setQrValue(paymentUrl);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name as string]: value
        }));
    };

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Generate Payment QR Code
                </Typography>
                
                <form onSubmit={handleSubmit}>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Country</InputLabel>
                        <Select
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            required
                        >
                            <MenuItem value="US">United States</MenuItem>
                            <MenuItem value="UK">United Kingdom</MenuItem>
                            <MenuItem value="EU">European Union</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl fullWidth margin="normal">
                        <InputLabel>Payment Service</InputLabel>
                        <Select
                            name="service"
                            value={formData.service}
                            onChange={handleChange}
                            required
                        >
                            <MenuItem value="wise">Wise</MenuItem>
                            <MenuItem value="revolut">Revolut</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        fullWidth
                        margin="normal"
                        label="Account Number"
                        name="accountNumber"
                        value={formData.accountNumber}
                        onChange={handleChange}
                        required
                    />

                    <TextField
                        fullWidth
                        margin="normal"
                        label="Amount"
                        name="amount"
                        type="number"
                        value={formData.amount}
                        onChange={handleChange}
                        required
                    />

                    <FormControl fullWidth margin="normal">
                        <InputLabel>Currency</InputLabel>
                        <Select
                            name="currency"
                            value={formData.currency}
                            onChange={handleChange}
                            required
                        >
                            <MenuItem value="USD">USD</MenuItem>
                            <MenuItem value="EUR">EUR</MenuItem>
                            <MenuItem value="GBP">GBP</MenuItem>
                        </Select>
                    </FormControl>

                    <Button 
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        sx={{ mt: 2 }}
                    >
                        Generate QR Code
                    </Button>
                </form>

                {qrValue && (
                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                        <QRCode value={qrValue} />
                        <Typography variant="body2" sx={{ mt: 2 }}>
                            Scan this QR code to make the payment
                        </Typography>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default PaymentForm;
