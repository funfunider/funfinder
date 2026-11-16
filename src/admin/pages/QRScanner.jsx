import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  Chip,
  Divider,
  CircularProgress,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  QrCodeScanner,
  Search,
  Person,
  Email,
  Phone,
  Event,
  AttachMoney,
  CalendarToday,
  Receipt,
  Refresh,
} from '@mui/icons-material';
import { Html5Qrcode } from 'html5-qrcode';
import adminOrderApiService from '../services/orderApi';

const QRScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        const state = html5QrCodeRef.current.getState();
        if (state === 2) { // SCANNING
          await html5QrCodeRef.current.stop();
        }
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      html5QrCodeRef.current = null;
    }
    setScanning(false);
  };

  const startScanner = async () => {
    setError(null);
    setSuccessMessage(null);
    setScannedResult(null);
    setOrderDetails(null);

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('qr-reader');
      }

      setScanning(true);

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleScanResult(decodedText);
          stopScanner();
        },
        () => {} // ignore scan failures
      );
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError('Could not access camera. Please check camera permissions or use manual order input.');
      setScanning(false);
    }
  };

  const handleScanResult = async (result) => {
    setScannedResult(result);
    await fetchOrderDetails(result);
  };

  const handleManualSearch = async () => {
    if (!manualInput.trim()) return;
    setScannedResult(manualInput.trim());
    await fetchOrderDetails(manualInput.trim());
  };

  const fetchOrderDetails = async (orderIdentifier) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setOrderDetails(null);

    try {
      // 1. First try direct lookup by order number or ID
      try {
        const directOrder = await adminOrderApiService.getOrderDetails(orderIdentifier);
        if (directOrder && (directOrder.id || directOrder.order_number)) {
          setOrderDetails(directOrder);
          setLoading(false);
          return;
        }
      } catch (lookupErr) {
        console.log('Direct lookup fell back to feed search');
      }

      // 2. Fall back to search in order feed
      const data = await adminOrderApiService.getOrderFeed({ search: orderIdentifier });

      let ordersList = [];
      if (Array.isArray(data)) {
        ordersList = data;
      } else if (Array.isArray(data.data)) {
        ordersList = data.data;
      } else if (Array.isArray(data.orders)) {
        ordersList = data.orders;
      }

      const searchLower = orderIdentifier.toLowerCase().trim();
      const found = ordersList.find(order => {
        const values = Object.values(order).map(v => String(v || '').toLowerCase());
        return values.some(v => v === searchLower || v.includes(searchLower) || searchLower.includes(v));
      });

      if (!found) {
        throw new Error(`Order "${orderIdentifier}" not found. Please verify the ticket number.`);
      }

      setOrderDetails(found);
    } catch (err) {
      console.error('Error fetching order:', err);
      const apiErrorMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      setError(apiErrorMsg || 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsUsed = async (orderId) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const updatedOrder = await adminOrderApiService.markOrderAsUsed(orderId);
      setOrderDetails(updatedOrder || { ...orderDetails, is_used: true, status: 'completed' });
      setSuccessMessage('✅ Ticket marked as used successfully!');
    } catch (err) {
      console.error('Error marking order as used:', err);
      const apiErrorMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      setError(apiErrorMsg || 'Failed to mark ticket as used');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setScannedResult(null);
    setOrderDetails(null);
    setError(null);
    setSuccessMessage(null);
    setManualInput('');
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
      case 'paid':
        return 'success';
      case 'pending':
      case 'processing':
        return 'warning';
      case 'failed':
      case 'cancelled':
      case 'canceled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('ka-GE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const formatPrice = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return `${amount} ₾`;
  };

  return (
    <Container maxWidth="md" sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: '-0.02em' }}>
          QR Scanner & Ticket Verification
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Scan attendee QR codes or enter order number to verify and check in tickets.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* Scanner Section */}
      <Card sx={{ mb: 3, borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
        <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
          <Box sx={{ textAlign: 'center' }}>
            <div id="qr-reader" style={{ width: '100%', maxWidth: 400, margin: '0 auto', borderRadius: 12, overflow: 'hidden' }} />

            {!scanning && !scannedResult && (
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<QrCodeScanner />}
                  onClick={startScanner}
                  sx={{
                    mb: 3,
                    px: 4,
                    py: 1.5,
                    borderRadius: 2.5,
                    bgcolor: '#87003A',
                    '&:hover': { bgcolor: '#69002D' },
                    boxShadow: '0 8px 24px rgba(135,0,58,0.3)'
                  }}
                >
                  Start Camera Scan
                </Button>

                <Divider sx={{ my: 2.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    or enter manually
                  </Typography>
                </Divider>

                <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', mt: 2, maxWidth: 440, mx: 'auto' }}>
                  <TextField
                    placeholder="e.g. FF-1001 or 1001"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                    size="small"
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button 
                    variant="contained" 
                    onClick={handleManualSearch}
                    sx={{ bgcolor: '#87003A', '&:hover': { bgcolor: '#69002D' }, px: 3 }}
                  >
                    Search
                  </Button>
                </Box>
              </Box>
            )}

            {scanning && (
              <Button
                variant="outlined"
                color="error"
                onClick={stopScanner}
                sx={{ mt: 2 }}
              >
                Stop Camera
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <Box display="flex" justifyContent="center" sx={{ my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Order Details */}
      {orderDetails && (
        <Card sx={{ borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
          <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
            {orderDetails.is_used && (
              <Alert severity="warning" sx={{ mb: 2.5 }}>
                ⚠️ This ticket has already been used on {formatDate(orderDetails.used_at || orderDetails.updated_at)}.
              </Alert>
            )}

            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Box display="flex" alignItems="center" gap={1.25}>
                <Receipt sx={{ color: '#87003A' }} />
                <Typography variant="h6" fontWeight={700}>Order / Ticket Verification</Typography>
              </Box>
              <Button startIcon={<Refresh />} onClick={handleReset} variant="outlined" size="small">
                Scan Another
              </Button>
            </Box>

            <Divider sx={{ mb: 2.5 }} />

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Order Number</Typography>
                <Typography variant="body1" fontWeight={700}>
                  {orderDetails.order_number || orderDetails.id || scannedResult}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={orderDetails.is_used ? 'Used / Checked In' : (orderDetails.status || 'Paid')}
                    color={orderDetails.is_used ? 'default' : getStatusColor(orderDetails.status)}
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Created Date</Typography>
                <Typography variant="body1">
                  {formatDate(orderDetails.created_at || orderDetails.date)}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Payment Method</Typography>
                <Typography variant="body1">
                  {orderDetails.payment_method || 'Online Card'}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 1.5, color: '#D86B8C' }}>
                  Customer Details
                </Typography>
                <Divider sx={{ my: 1 }} />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <Person fontSize="small" sx={{ color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">Name</Typography>
                </Box>
                <Typography variant="body2" fontWeight={600}>
                  {orderDetails.customer_name || 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <Email fontSize="small" sx={{ color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">Email</Typography>
                </Box>
                <Typography variant="body2">
                  {orderDetails.customer_email || 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <Phone fontSize="small" sx={{ color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">Phone</Typography>
                </Box>
                <Typography variant="body2">
                  {orderDetails.customer_phone || 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 1.5, color: '#D86B8C' }}>
                  Booking & Event Details
                </Typography>
                <Divider sx={{ my: 1 }} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <Event fontSize="small" sx={{ color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">Event</Typography>
                </Box>
                <Typography variant="body1" fontWeight={700}>
                  {orderDetails.event_name || orderDetails.event_title || 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={3}>
                <Typography variant="caption" color="text.secondary">Tickets Count</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {orderDetails.tickets_count || 1}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={3}>
                <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                  <AttachMoney fontSize="small" sx={{ color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">Total</Typography>
                </Box>
                <Typography variant="h6" color="primary" fontWeight={800}>
                  {formatPrice(orderDetails.total_price || orderDetails.total_amount)}
                </Typography>
              </Grid>
            </Grid>

            {/* Mark as Used Action */}
            {!orderDetails.is_used && (
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="warning"
                  size="large"
                  onClick={() => handleMarkAsUsed(orderDetails.order_number || orderDetails.id || scannedResult)}
                  disabled={loading}
                  sx={{
                    fontWeight: 700,
                    px: 4,
                    py: 1.25,
                    boxShadow: '0 6px 20px rgba(237, 108, 2, 0.3)'
                  }}
                >
                  Mark as Used / Check In
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {scannedResult && !orderDetails && !loading && !error && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Scanned: <strong>{scannedResult}</strong> — No order details found in system.
        </Alert>
      )}
    </Container>
  );
};

export default QRScanner;
