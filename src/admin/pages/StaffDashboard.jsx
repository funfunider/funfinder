import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Avatar,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from '@mui/material';
import {
  Event as EventIcon,
  Receipt as OrdersIcon,
  QrCodeScanner as QrIcon,
  RateReview as ReviewIcon,
  TrendingUp,
  Business as BusinessIcon,
  CheckCircle,
  HourglassEmpty,
  Refresh,
  ArrowForward,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import adminOrderApiService from '../services/orderApi';
import apiService from '../services/api';

const StaffDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const companyName = user?.company?.name || user?.companies?.[0]?.name || 'Partner Provider';
  const displayName = user?.firstname || user?.username || 'Staff Member';

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ordersData, eventsData] = await Promise.allSettled([
        adminOrderApiService.getOrderFeed(),
        apiService.get('/event/list').catch(() => ({ data: [] }))
      ]);

      if (ordersData.status === 'fulfilled') {
        const oList = Array.isArray(ordersData.value) 
          ? ordersData.value 
          : (ordersData.value?.data || ordersData.value?.orders || []);
        setOrders(oList);
      }
      if (eventsData.status === 'fulfilled') {
        const eList = Array.isArray(eventsData.value?.data) 
          ? eventsData.value.data 
          : (Array.isArray(eventsData.value) ? eventsData.value : []);
        setEvents(eList);
      }
    } catch (err) {
      console.error('Error loading staff dashboard data:', err);
      setError('Failed to load operational data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalOrders = orders.length;
  const usedTickets = orders.filter(o => o.is_used || o.status === 'completed').length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_price || o.total_amount) || 0), 0);

  return (
    <Box sx={{ mt: 1, mb: 4 }}>
      {/* Header Banner */}
      <Card
        sx={{
          mb: 3.5,
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 3,
          background: 'linear-gradient(135deg, #111A2E 0%, #1A2744 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Box display="flex" alignItems="center" gap={1.5} mb={1}>
              <Chip
                icon={<BusinessIcon sx={{ fontSize: 16 }} />}
                label={companyName}
                sx={{
                  bgcolor: 'rgba(135,0,58,0.25)',
                  color: '#D86B8C',
                  fontWeight: 700,
                  border: '1px solid rgba(135,0,58,0.4)',
                }}
              />
              <Chip label="Staff Operations" size="small" variant="outlined" sx={{ color: 'text.secondary' }} />
            </Box>
            <Typography variant="h4" fontWeight={800} color="#fff" gutterBottom sx={{ letterSpacing: '-0.02em' }}>
              Welcome, {displayName}! 👋
            </Typography>
            <Typography variant="body1" sx={{ color: '#94A0B3', maxWidth: 600 }}>
              Operational control panel for managing tickets, attendee check-ins, bookings, and customer feedback.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { md: 'right' } }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<QrIcon />}
              onClick={() => navigate('/qr-scanner')}
              sx={{
                bgcolor: '#87003A',
                '&:hover': { bgcolor: '#69002D' },
                py: 1.5,
                px: 3.5,
                borderRadius: 2.5,
                fontWeight: 700,
                boxShadow: '0 8px 24px rgba(135,0,58,0.35)',
              }}
            >
              Open QR Scanner
            </Button>
          </Grid>
        </Grid>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2.5, border: '1px solid rgba(255,255,255,0.06)' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    TOTAL ORDERS
                  </Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5, color: '#fff' }}>
                    {totalOrders}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(135,0,58,0.15)', color: '#D86B8C' }}>
                  <OrdersIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2.5, border: '1px solid rgba(255,255,255,0.06)' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    CHECKED IN / USED
                  </Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5, color: '#27ae60' }}>
                    {usedTickets}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(39, 174, 96, 0.15)', color: '#27ae60' }}>
                  <CheckCircle />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2.5, border: '1px solid rgba(255,255,255,0.06)' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    PENDING CONFIRMATION
                  </Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5, color: '#f39c12' }}>
                    {pendingOrders}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(243, 156, 18, 0.15)', color: '#f39c12' }}>
                  <HourglassEmpty />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2.5, border: '1px solid rgba(255,255,255,0.06)' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    TOTAL REVENUE
                  </Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5, color: '#3498db' }}>
                    {totalRevenue} ₾
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(52, 152, 219, 0.15)', color: '#3498db' }}>
                  <TrendingUp />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Operations Grid */}
      <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
        Staff Workflows
      </Typography>
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {[
          {
            title: 'Scan QR Ticket',
            desc: 'Check in attendees using camera or ticket reference number.',
            icon: <QrIcon sx={{ fontSize: 32, color: '#D86B8C' }} />,
            path: '/qr-scanner',
            btn: 'Open Scanner',
          },
          {
            title: 'Orders & Bookings',
            desc: 'Browse attendee orders, check payment details and ticket statuses.',
            icon: <OrdersIcon sx={{ fontSize: 32, color: '#3498db' }} />,
            path: '/orders',
            btn: 'View Orders',
          },
          {
            title: 'Events Catalog',
            desc: 'View event listings, schedules, pricing and descriptions.',
            icon: <EventIcon sx={{ fontSize: 32, color: '#2ecc71' }} />,
            path: '/events',
            btn: 'View Events',
          },
          {
            title: 'Customer Reviews',
            desc: 'Read guest reviews, approve or hide comments, and post replies.',
            icon: <ReviewIcon sx={{ fontSize: 32, color: '#f1c40f' }} />,
            path: '/reviews',
            btn: 'Moderate Reviews',
          },
        ].map((flow) => (
          <Grid item xs={12} sm={6} md={3} key={flow.title}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2.5,
                border: '1px solid rgba(255,255,255,0.06)',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-3px)' },
              }}
            >
              <CardContent sx={{ p: 2.5, flexGrow: 1 }}>
                <Box sx={{ mb: 1.5 }}>{flow.icon}</Box>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {flow.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {flow.desc}
                </Typography>
                <Button
                  component={Link}
                  to={flow.path}
                  endIcon={<ArrowForward />}
                  variant="outlined"
                  size="small"
                  sx={{ borderRadius: 2 }}
                >
                  {flow.btn}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Orders List */}
      <Card sx={{ borderRadius: 3, border: '1px solid rgba(255,255,255,0.06)' }}>
        <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Recent Orders & Attendee Check-ins
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Latest bookings and verification statuses
            </Typography>
          </Box>
          <Button component={Link} to="/orders" size="small" endIcon={<ArrowForward />}>
            All Orders
          </Button>
        </Box>
        <Divider />
        {loading ? (
          <LinearProgress />
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Order #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Event</TableCell>
                  <TableCell>Tickets</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Check-in Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.slice(0, 6).map((ord) => (
                  <TableRow key={ord.id || ord.order_number} hover>
                    <TableCell sx={{ fontWeight: 700 }}>{ord.order_number || ord.id}</TableCell>
                    <TableCell>{ord.customer_name || 'N/A'}</TableCell>
                    <TableCell>{ord.event_name || ord.event_title || 'N/A'}</TableCell>
                    <TableCell>{ord.tickets_count || 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{ord.total_price || 0} ₾</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={ord.is_used ? 'Checked In' : (ord.status || 'Paid')}
                        color={ord.is_used ? 'default' : (ord.status === 'paid' ? 'success' : 'warning')}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  );
};

export default StaffDashboard;
