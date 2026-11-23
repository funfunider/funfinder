import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Paper,
  alpha
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as AccessTimeIcon,
  CalendarToday as CalendarTodayIcon,
  LocationOn as LocationOnIcon,
  ConfirmationNumber as ConfirmationNumberIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  DoneAll as DoneAllIcon,
  Map as MapIcon,
  ArrowBack as ArrowBackIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import { useParams, useNavigate } from 'react-router-dom';
import orderApiService from '../../services/orderApi';
import logo from '../../assets/logo.jpg';

const TicketDetails = () => {
  const { orderNumber, id } = useParams();
  const navigate = useNavigate();
  const targetId = orderNumber || id;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    const fetchOrder = async () => {
      if (!targetId) {
        setError('ბილეთის ნომერი არ არის მითითებული');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const data = await orderApiService.getOrderDetailsByNumber(targetId);
        const orderData = data?.data || data?.order || data;
        if (!orderData || !orderData.id) {
          setError('ბილეთი ამ ნომრით ვერ მოიძებნა');
        } else {
          setOrder(orderData);
        }
      } catch (err) {
        console.error('Error fetching ticket details:', err);
        setError('ბილეთის ინფორმაციის ჩატვირთვა ვერ მოხერხდა. გადაამოწმეთ ნომერი ან სცადეთ მოგვიანებით.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [targetId]);

  const handleCheckIn = async () => {
    try {
      setCheckingIn(true);
      await orderApiService.markTicketUsed(order.order_number || order.id);
      setOrder(prev => ({
        ...prev,
        is_used: true,
        used_at: new Date().toISOString(),
        status: 'completed'
      }));
      setCheckInDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'ბილეთი წარმატებით მონიშნულია გამოყენებულად (Checked-In)!',
        severity: 'success'
      });
    } catch (err) {
      console.error('Check-in failed:', err);
      setSnackbar({
        open: true,
        message: 'შეცდომა ბილეთის მონიშვნისას: ' + (err.message || 'დაფიქსირდა შეცდომა'),
        severity: 'error'
      });
    } finally {
      setCheckingIn(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `FunFinder ბილეთი: ${order.event_name || 'Experience'}`,
        text: `ჩემი FunFinder ბილეთი: ${order.event_name || 'Experience'} (#${order.order_number || order.id})`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setSnackbar({
        open: true,
        message: 'ბილეთის ბმული დაკოპირდა ბუფერში!',
        severity: 'success'
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F8FAFC' }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress sx={{ color: '#3A1D94' }} size={48} />
          <Typography variant="body1" color="text.secondary">
            ბილეთის მონაცემები იტვირთება...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (error || !order) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 4, border: '1px solid #E2E8F0' }}>
          <WarningIcon sx={{ fontSize: 64, color: '#EF4444', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            ბილეთი ვერ მოიძებნა
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            {error || 'მითითებული ნომრით შეკვეთა მონაცემთა ბაზაში არ ფიქსირდება.'}
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/')}
            sx={{
              bgcolor: '#3A1D94',
              '&:hover': { bgcolor: '#2A146C' },
              borderRadius: 3,
              px: 4,
              py: 1.2
            }}
          >
            მთავარ გვერდზე დაბრუნება
          </Button>
        </Paper>
      </Container>
    );
  }

  const isUsed = Boolean(order.is_used || (order.status === 'completed' && order.used_at));
  const isPaid = order.status === 'paid' || order.payment_status === 'paid' || order.status === 'completed' || isUsed;
  const isCancelled = order.status === 'cancelled' || order.status === 'failed';

  // Status configuration
  let statusBadge = {
    label: 'ვალიდური და აქტიური',
    color: '#16A34A',
    bg: '#DCFCE7',
    icon: <CheckCircleIcon sx={{ fontSize: 20 }} />,
    desc: 'ბილეთი ნამდვილია და მზადაა გამოსაყენებლად'
  };

  if (isUsed) {
    statusBadge = {
      label: 'გამოყენებულია (Used)',
      color: '#475569',
      bg: '#F1F5F9',
      icon: <DoneAllIcon sx={{ fontSize: 20 }} />,
      desc: order.used_at
        ? `გამოყენებულია: ${new Date(order.used_at).toLocaleString('ka-GE')}`
        : 'ეს ბილეთი უკვე გამოყენებულია შესასვლელზე'
    };
  } else if (isCancelled) {
    statusBadge = {
      label: 'გაუქმებულია',
      color: '#DC2626',
      bg: '#FEE2E2',
      icon: <CancelIcon sx={{ fontSize: 20 }} />,
      desc: 'ბილეთი გაუქმებულია და არ არის აქტიური'
    };
  } else if (!isPaid) {
    statusBadge = {
      label: 'გადახდის მოლოდინში',
      color: '#D97706',
      bg: '#FEF3C7',
      icon: <AccessTimeIcon sx={{ fontSize: 20 }} />,
      desc: 'გადახდა ჯერ არ არის დადასტურებული'
    };
  }

  const eventName = order.event_name || order.event?.name || 'FunFinder Experience';
  const locationName = order.event?.city?.name || (typeof order.event?.city === 'string' ? order.event.city : '') || 'თბილისი, საქართველო';
  const locationAddress = order.event?.location || order.pickup_location || '';
  const mapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${eventName} ${locationAddress} ${locationName}`)}`;
  const ticketCount = order.people_count || order.tickets_count || 1;
  const totalPrice = order.total_price ?? order.total_amount ?? 0;
  const currency = order.currency || 'GEL';

  let formattedDate = order.event_date || '';
  try {
    if (order.event_date) {
      const d = new Date(order.event_date);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString('ka-GE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      }
    }
  } catch {}

  const currentUrl = typeof window !== 'undefined' ? window.location.href : `https://funfinder.ge/orders/${order.order_number || order.id}`;

  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', py: { xs: 3, md: 6 } }}>
      <Container maxWidth="sm">
        {/* Top bar (hidden in print) */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }} className="no-print">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
            sx={{ color: '#475569', textTransform: 'none', fontWeight: 600 }}
          >
            მთავარი
          </Button>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ShareIcon />}
              onClick={handleShare}
              sx={{ borderColor: '#CBD5E1', color: '#475569', borderRadius: 2, textTransform: 'none' }}
            >
              გაზიარება
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              sx={{ bgcolor: '#3A1D94', '&:hover': { bgcolor: '#2A146C' }, borderRadius: 2, textTransform: 'none' }}
            >
              ბეჭდვა / PDF
            </Button>
          </Stack>
        </Stack>

        {/* Status Alert Banner */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: 3,
            bgcolor: statusBadge.bg,
            border: `1px solid ${alpha(statusBadge.color, 0.25)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ color: statusBadge.color, display: 'flex' }}>
              {statusBadge.icon}
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: statusBadge.color, lineHeight: 1.2 }}>
                {statusBadge.label}
              </Typography>
              <Typography variant="caption" sx={{ color: alpha(statusBadge.color, 0.85), display: 'block', mt: 0.2 }}>
                {statusBadge.desc}
              </Typography>
            </Box>
          </Stack>

          {/* Mark as used (Check-In) Button for Organizers */}
          {!isUsed && isPaid && !isCancelled && (
            <Button
              variant="contained"
              size="small"
              color="success"
              onClick={() => setCheckInDialogOpen(true)}
              className="no-print"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                boxShadow: 'none',
                '&:hover': { boxShadow: 'none' }
              }}
            >
              შესვლის დადასტურება (Check-In)
            </Button>
          )}
        </Paper>

        {/* Main Ticket Card (Designed like a concert/experience ticket stub) */}
        <Card
          id="printable-ticket"
          elevation={3}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            border: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF',
            boxShadow: '0 20px 40px -15px rgba(58, 29, 148, 0.15)'
          }}
        >
          {/* Header with FunFinder Branding */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #3A1D94 0%, #6E3FF3 100%)',
              color: '#FFFFFF',
              p: 3,
              textAlign: 'center',
              position: 'relative'
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5} sx={{ mb: 1.5 }}>
              <Box
                component="img"
                src={logo}
                alt="FunFinder"
                sx={{ width: 36, height: 36, borderRadius: '8px', bgcolor: '#fff', p: 0.3 }}
              />
              <Typography variant="h6" fontWeight={800} letterSpacing={1}>
                FUNFINDER
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ color: '#D9D2FF', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}>
              ოფიციალური ელექტრონული ბილეთი
            </Typography>
          </Box>

          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            {/* Event Name */}
            <Typography variant="h5" fontWeight={800} sx={{ color: '#1E1B4B', mb: 1, lineHeight: 1.3 }}>
              {eventName}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              შეკვეთის ნომერი: <strong style={{ color: '#3A1D94' }}>#{order.order_number || order.id}</strong>
            </Typography>

            <Divider sx={{ my: 2 }} />

            {/* Event Details Grid */}
            <Stack spacing={2.5}>
              {/* Date & Time */}
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <CalendarTodayIcon sx={{ color: '#6E3FF3', mt: 0.3, fontSize: 22 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={700}>
                    თარიღი და დრო
                  </Typography>
                  <Typography variant="body1" fontWeight={600} color="#1E293B">
                    {formattedDate || 'შეთანხმებით'}
                  </Typography>
                  {order.slot_time && (
                    <Typography variant="body2" color="text.secondary">
                      დრო: {order.slot_time}
                    </Typography>
                  )}
                </Box>
              </Stack>

              {/* Location */}
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <LocationOnIcon sx={{ color: '#6E3FF3', mt: 0.3, fontSize: 22 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={700}>
                    ადგილმდებარეობა
                  </Typography>
                  <Typography variant="body1" fontWeight={600} color="#1E293B">
                    {locationName}
                  </Typography>
                  {locationAddress && (
                    <Typography variant="body2" color="text.secondary">
                      {locationAddress}
                    </Typography>
                  )}
                  <Button
                    size="small"
                    startIcon={<MapIcon />}
                    href={mapSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="no-print"
                    sx={{ mt: 0.8, p: 0, textTransform: 'none', color: '#6E3FF3', fontWeight: 600, fontSize: 13 }}
                  >
                    რუკაზე ნახვა (Google Maps)
                  </Button>
                </Box>
              </Stack>

              {/* Customer Info */}
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <PersonIcon sx={{ color: '#6E3FF3', mt: 0.3, fontSize: 22 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={700}>
                    მყიდველი
                  </Typography>
                  <Typography variant="body1" fontWeight={600} color="#1E293B">
                    {order.customer_name || 'სტუმარი'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {order.customer_phone || order.customer_email || ''}
                  </Typography>
                </Box>
              </Stack>
            </Stack>

            <Divider sx={{ my: 3 }} />

            {/* Price & Quantity Summary */}
            <Box sx={{ bgcolor: '#F8FAFC', p: 2, borderRadius: 3, border: '1px solid #E2E8F0' }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  ბილეთების რაოდენობა:
                </Typography>
                <Typography variant="body2" fontWeight={700} color="#1E293B">
                  {ticketCount} ცალი ({order.ticket_type || 'General Booking'})
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body1" fontWeight={700} color="#1E1B4B">
                  სულ გადახდილი:
                </Typography>
                <Typography variant="h6" fontWeight={800} color="#3A1D94">
                  {totalPrice} {currency}
                </Typography>
              </Stack>
            </Box>

            {/* Ticket Stub Dashed Separator */}
            <Box
              sx={{
                my: 4,
                position: 'relative',
                borderTop: '2px dashed #CBD5E1',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: { xs: -36, sm: -44 },
                  top: -14,
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: '#F8FAFC',
                  boxShadow: 'inset -2px 0 3px rgba(0,0,0,0.05)'
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  right: { xs: -36, sm: -44 },
                  top: -14,
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: '#F8FAFC',
                  boxShadow: 'inset 2px 0 3px rgba(0,0,0,0.05)'
                }
              }}
            />

            {/* QR Code Section */}
            <Box sx={{ textAlign: 'center', py: 1 }}>
              <Box
                sx={{
                  display: 'inline-block',
                  p: 2,
                  bgcolor: '#FFFFFF',
                  borderRadius: 3,
                  border: '2px solid #E2E8F0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                }}
              >
                <QRCodeSVG
                  value={currentUrl}
                  size={190}
                  level="H"
                  includeMargin={true}
                  fgColor="#3A1D94"
                  imageSettings={{
                    src: logo,
                    x: undefined,
                    y: undefined,
                    height: 34,
                    width: 34,
                    excavate: true
                  }}
                />
              </Box>

              <Typography variant="body2" fontWeight={700} sx={{ mt: 2, color: '#1E293B' }}>
                წარადგინეთ ეს QR კოდი შესვლისას
              </Typography>
              <Typography variant="caption" color="text.secondary">
                სკანირებისას მოწმდება ბილეთის ნამდვილობა
              </Typography>
            </Box>
          </CardContent>

          {/* Footer note */}
          <Box sx={{ bgcolor: '#F8FAFC', p: 2, textAlign: 'center', borderTop: '1px solid #E2E8F0' }}>
            <Typography variant="caption" color="text.secondary">
              გაქვთ შეკითხვები? დაგვიკავშირდით: funfinder.georgia@gmail.com
            </Typography>
          </Box>
        </Card>
      </Container>

      {/* Confirmation Dialog for Check-in */}
      <Dialog open={checkInDialogOpen} onClose={() => setCheckInDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          ბილეთის გამოყენების დადასტურება
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            ნამდვილად გსურთ ბილეთის <strong>#{order.order_number || order.id}</strong> მონიშვნა გამოყენებულად?
            ამ მოქმედების შემდეგ ბილეთი მეორედ ვეღარ იქნება გამოყენებული.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCheckInDialogOpen(false)} color="inherit">
            გაუქმება
          </Button>
          <Button
            onClick={handleCheckIn}
            variant="contained"
            color="success"
            disabled={checkingIn}
          >
            {checkingIn ? 'მონიშვნა...' : 'დადასტურება'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        message={snackbar.message}
      />

      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body {
            background-color: #FFFFFF !important;
          }
          .no-print {
            display: none !important;
          }
          #printable-ticket {
            box-shadow: none !important;
            border: 1px solid #CCCCCC !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </Box>
  );
};

export default TicketDetails;
