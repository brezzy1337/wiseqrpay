import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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
    FormHelperText,
} from '@mui/material';
import QRCode from 'react-qr-code';

interface PaymentFormData {
    country: string;
    service: string;
    accountNumber: string;
    amount: string;
    currency: string;
}

const validationSchema = z.object({
    country: z.string().min(1, 'Country is required'),
    service: z.string().min(1, 'Payment service is required'),
    accountNumber: z.string().min(1, 'Account number is required'),
    amount: z.string()
        .min(1, 'Amount is required')
        .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid number'),
    currency: z.string().min(1, 'Currency is required'),
});

const PaymentForm: React.FC = () => {
    const [qrValue, setQrValue] = useState<string>('');
    
    const { control, handleSubmit, formState: { errors } } = useForm<PaymentFormData>({
        resolver: zodResolver(validationSchema),
        defaultValues: {
            country: '',
            service: '',
            accountNumber: '',
            amount: '',
            currency: 'USD'
        }
    });

    const onSubmit = (data: PaymentFormData) => {
        const paymentUrl = `${window.location.origin}/api/payment?` + 
            new URLSearchParams(data as any).toString();
        setQrValue(paymentUrl);
    };

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Generate Payment QR Code
                </Typography>
                
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Controller
                        name="country"
                        control={control}
                        render={({ field }) => (
                            <FormControl fullWidth margin="normal" error={!!errors.country}>
                                <InputLabel>Country</InputLabel>
                                <Select {...field}>
                                    <MenuItem value="US">United States</MenuItem>
                                    <MenuItem value="UK">United Kingdom</MenuItem>
                                    <MenuItem value="EU">European Union</MenuItem>
                                </Select>
                                {errors.country && (
                                    <FormHelperText>{errors.country.message}</FormHelperText>
                                )}
                            </FormControl>
                        )}
                    />

                    <Controller
                        name="service"
                        control={control}
                        render={({ field }) => (
                            <FormControl fullWidth margin="normal" error={!!errors.service}>
                                <InputLabel>Payment Service</InputLabel>
                                <Select {...field}>
                                    <MenuItem value="wise">Wise</MenuItem>
                                    <MenuItem value="revolut">Revolut</MenuItem>
                                </Select>
                                {errors.service && (
                                    <FormHelperText>{errors.service.message}</FormHelperText>
                                )}
                            </FormControl>
                        )}
                    />

                    <Controller
                        name="accountNumber"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                fullWidth
                                margin="normal"
                                label="Account Number"
                                error={!!errors.accountNumber}
                                helperText={errors.accountNumber?.message}
                            />
                        )}
                    />

                    <Controller
                        name="amount"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                fullWidth
                                margin="normal"
                                label="Amount"
                                type="text"
                                error={!!errors.amount}
                                helperText={errors.amount?.message}
                            />
                        )}
                    />

                    <Controller
                        name="currency"
                        control={control}
                        render={({ field }) => (
                            <FormControl fullWidth margin="normal" error={!!errors.currency}>
                                <InputLabel>Currency</InputLabel>
                                <Select {...field}>
                                    <MenuItem value="USD">USD</MenuItem>
                                    <MenuItem value="EUR">EUR</MenuItem>
                                    <MenuItem value="GBP">GBP</MenuItem>
                                </Select>
                                {errors.currency && (
                                    <FormHelperText>{errors.currency.message}</FormHelperText>
                                )}
                            </FormControl>
                        )}
                    />

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
