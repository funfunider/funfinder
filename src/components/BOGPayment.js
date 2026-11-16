import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import {
  Payment,
  Security,
  Refresh,
  Launch
} from '@mui/icons-material';
import orderApiService from '../services/orderApi';

/**
 * BOG Payment Gateway Component
 * Handles BOG payment gateway integration and automatic redirection
 */
const BOGPayment = ({ 
  orderNumber, 
  amount, 
  onPaymentSuccess, 
  onPaymentError,
  onPaymentCancel 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState(null);

  // Initialize payment and redirect to Bank of Georgia
  const initializePayment = async () => {
    if (!orderNumber) {
      const errorMsg = 'შეკვეთის ნომერი ვერ მოიძებნა.';
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    console.log('Initializing BOG payment for order:', orderNumber);
    setLoading(true);
    setError(null);

    try {
      // Call backend to initiate BOG payment
      const response = await orderApiService.initiatePayment(orderNumber, 'card');
      const targetUrl = response?.payment_url || response?._links?.redirect?.href || response?.redirect_url;
      
      if (targetUrl) {
        setPaymentUrl(targetUrl);
        console.log('Redirecting to Bank of Georgia payment gateway:', targetUrl);
        window.location.href = targetUrl;
      } else {
        throw new Error('საქართველოს ბანკის გადახდის ბმული ვერ მივიღეთ სერვერისგან.');
      }
    } catch (err) {
      console.error('Error initializing payment:', err);
      let errorMessage = 'გადახდის ინიციალიზაცია ვერ მოხერხდა';
      if (err.message) {
        if (err.message.includes('Network error')) {
          errorMessage = 'ინტერნეტის კავშირის შეცდომა. გთხოვთ შეამოწმოთ კავშირი და სცადოთ ხელახლა.';
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
      if (onPaymentError) {
        onPaymentError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-initialize payment on mount
  useEffect(() => {
    if (orderNumber && !paymentUrl) {
      initializePayment();
    }
  }, [orderNumber]);

  return (
    <Card sx={{ mb: 3, border: '1px solid #E0D7FA', borderRadius: 3, overflow: 'hidden', boxShadow: '0 8px 24px rgba(58,29,148,0.08)' }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: '#87003A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Payment />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} color="#333">
              საქართველოს ბანკი (BOG)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              უსაფრთხო ონლაინ გადახდა ბარათით
            </Typography>
          </Box>
        </Box>

        {loading && (
          <Box sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={36} sx={{ color: '#87003A' }} />
            <Typography variant="body1" fontWeight={600} color="#87003A">
              მიმდინარეობს საქართველოს ბანკის გადახდის გვერდზე გადამისამართება...
            </Typography>
            <Typography variant="caption" color="text.secondary">
              გთხოვთ დაელოდოთ, არ დახუროთ ფანჯარა
            </Typography>
          </Box>
        )}

        {error && (
          <Box my={2}>
            <Alert 
              severity="error" 
              action={
                <Button color="inherit" size="small" onClick={initializePayment} startIcon={<Refresh />}>
                  ხელახლა ცდა
                </Button>
              }
            >
              {error}
            </Alert>
          </Box>
        )}

        {paymentUrl && !loading && (
          <Box my={2} textAlign="center">
            <Alert severity="info" sx={{ mb: 2 }}>
              თუ გადამისამართება ავტომატურად არ დაიწყო, დააჭირეთ ქვემოთ მოცემულ ღილაკს:
            </Alert>
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={() => { window.location.href = paymentUrl; }}
              endIcon={<Launch />}
              sx={{
                backgroundColor: '#87003A',
                '&:hover': { backgroundColor: '#5c0027' },
                py: 1.5,
                fontWeight: 700,
                fontSize: '1rem',
                borderRadius: 2
              }}
            >
              გადასვლა საქართველოს ბანკის გადახდის გვერდზე
            </Button>
          </Box>
        )}

        <Box display="flex" justifyContent="space-between" alignItems="center" mt={3} pt={2} borderTop="1px solid #F0EDFA">
          <Typography variant="body2" color="text.secondary">
            გადასახდელი თანხა:
          </Typography>
          <Typography variant="h6" fontWeight={800} color="#87003A">
            {amount ? `${amount} ₾` : ''}
          </Typography>
        </Box>

        <Box mt={2}>
          <List dense sx={{ py: 0 }}>
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 28, color: '#2e7d32' }}>
                <Security fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="3D Secure & PCI DSS დაცული ტრანზაქცია" 
                primaryTypographyProps={{ fontSize: '0.8rem', color: 'text.secondary' }}
              />
            </ListItem>
          </List>
        </Box>
      </CardContent>
    </Card>
  );
};

export default BOGPayment;
