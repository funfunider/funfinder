import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Container,
  Chip,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Stack,
  alpha,
} from "@mui/material";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ExploreIcon from "@mui/icons-material/Explore";
import { QRCodeCanvas } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import orderApiService from "../../services/orderApi";

const Tickets = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const isKa = language === "ka";

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [qrOrder, setQrOrder] = useState(null);

  // Load order feed and filter for current user
  useEffect(() => {
    const loadOrders = async () => {
      if (!user?.email) return;
      try {
        setOrdersLoading(true);
        setOrdersError("");
        const feed = await orderApiService.getOrderFeed();
        const list = Array.isArray(feed)
          ? feed
          : Array.isArray(feed?.orders)
            ? feed.orders
            : Array.isArray(feed?.data)
              ? feed.data
              : [];
        // Filter only this user's orders, exclude failed
        const failedStatuses = ['failed', 'cancelled', 'canceled', 'rejected', 'expired'];
        const myOrders = list.filter((o) => {
          const status = (o.status || o.payment_status || '').toLowerCase();
          if (failedStatuses.includes(status)) return false;
          const emails = [o.customer_email, o.email, o.customer?.email, o.user?.email]
            .filter(Boolean)
            .map((e) => (typeof e === "string" ? e.toLowerCase() : e));
          return emails.includes(user.email.toLowerCase());
        });
        setOrders(myOrders);
      } catch (e) {
        setOrdersError(e.message || "Failed to load orders");
      } finally {
        setOrdersLoading(false);
      }
    };
    loadOrders();
  }, [user]);

  const getStatusConfig = (status) => {
    switch (status) {
      case "active":
        return { label: isKa ? "აქტიური" : "Active", color: "#16a34a", bg: "rgba(22, 163, 74, 0.12)" };
      case "pending":
        return { label: isKa ? "მოლოდინში" : "Pending", color: "#d97706", bg: "rgba(217, 119, 6, 0.12)" };
      case "used":
        return { label: isKa ? "გამოყენებული" : "Used", color: "#64748b", bg: "rgba(100, 116, 139, 0.12)" };
      case "cancelled":
        return { label: isKa ? "გაუქმებული" : "Cancelled", color: "#dc2626", bg: "rgba(220, 38, 38, 0.12)" };
      default:
        return { label: status, color: "#87003A", bg: "rgba(135, 0, 58, 0.12)" };
    }
  };

  const mapOrderToTicket = (order) => {
    const statusRaw = (order.status || "").toString().toLowerCase();
    let status = "pending";
    if (/(paid|approved|confirmed|active)/.test(statusRaw)) status = "active";
    else if (/(completed|used|done)/.test(statusRaw)) status = "used";
    else if (/(cancel)/.test(statusRaw)) status = "cancelled";

    return {
      id: order.order_number || order.number || order.id,
      activity: order.event_title || order.title || order.event?.title || order.event?.name || (isKa ? "თავგადასავალი" : "Adventure Tour"),
      description: order.event_description || order.description || order.event?.description || "",
      date: order.event_date || order.date || order.event?.date || "",
      time: order.event_time || order.time || order.event?.time || "",
      location: order.location || order.event?.location || (isKa ? "საქართველო" : "Georgia"),
      latitude: order.latitude || order.lat || order.event?.latitude || order.event?.lat || null,
      longitude: order.longitude || order.lng || order.lon || order.event?.longitude || order.event?.lng || null,
      price: order.total_price || order.price || order.amount || 0,
      peopleCount: order.people_count || order.quantity || order.tickets_count || 1,
      status,
      _raw: order,
    };
  };

  const TicketCard = ({ ticket }) => {
    const statusCfg = getStatusConfig(ticket.status);

    return (
      <Card
        sx={{
          mb: 3,
          borderRadius: 4,
          border: '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.06)',
          overflow: 'hidden',
          transition: 'all 0.28s ease',
          background: '#ffffff',
          position: 'relative',
          '&:hover': {
            boxShadow: '0 16px 36px -6px rgba(135, 0, 58, 0.12)',
            transform: 'translateY(-3px)',
            borderColor: 'rgba(135, 0, 58, 0.25)',
          },
        }}
      >
        <Grid container>
          {/* Main ticket stub */}
          <Grid item xs={12} md={8.5} sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>
                TICKET #{ticket.id}
              </Typography>
              <Chip
                label={statusCfg.label}
                size="small"
                sx={{
                  bgcolor: statusCfg.bg,
                  color: statusCfg.color,
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  borderRadius: 2,
                }}
              />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, lineHeight: 1.3 }}>
              {ticket.activity}
            </Typography>

            {ticket.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 2,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {ticket.description}
              </Typography>
            )}

            <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ gap: 1, mt: 2 }}>
              {ticket.location && (
                <Chip
                  icon={<LocationOnIcon sx={{ fontSize: 16, color: '#87003A !important' }} />}
                  label={ticket.location}
                  size="small"
                  sx={{ bgcolor: '#f1f5f9', color: '#334155', fontWeight: 600 }}
                />
              )}
              {ticket.date && (
                <Chip
                  icon={<CalendarTodayIcon sx={{ fontSize: 15, color: '#87003A !important' }} />}
                  label={ticket.date}
                  size="small"
                  sx={{ bgcolor: '#f1f5f9', color: '#334155', fontWeight: 600 }}
                />
              )}
              {ticket.time && (
                <Chip
                  icon={<AccessTimeIcon sx={{ fontSize: 15, color: '#87003A !important' }} />}
                  label={ticket.time}
                  size="small"
                  sx={{ bgcolor: '#f1f5f9', color: '#334155', fontWeight: 600 }}
                />
              )}
              <Chip
                icon={<PeopleAltIcon sx={{ fontSize: 15, color: '#87003A !important' }} />}
                label={`${ticket.peopleCount} ${isKa ? 'პერსონა' : 'Guests'}`}
                size="small"
                sx={{ bgcolor: '#f1f5f9', color: '#334155', fontWeight: 600 }}
              />
            </Stack>
          </Grid>

          {/* Perforated Divider / Right Action stub */}
          <Grid
            item
            xs={12}
            md={3.5}
            sx={{
              p: { xs: 2.5, sm: 3 },
              bgcolor: '#fafbfc',
              borderLeft: { md: '2px dashed #e2e8f0' },
              borderTop: { xs: '2px dashed #e2e8f0', md: 'none' },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: { xs: 'flex-start', md: 'center' },
              textAlign: { xs: 'left', md: 'center' },
            }}
          >
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              {isKa ? 'გადახდილი თანხა' : 'Total Amount'}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#87003A', mt: 0.5, mb: 2 }}>
              {formatPrice ? formatPrice(Number(ticket.price) || ticket.price) : `${ticket.price} ₾`}
            </Typography>

            <Button
              variant="contained"
              startIcon={<QrCode2Icon />}
              onClick={() => setQrOrder(ticket._raw)}
              sx={{
                bgcolor: '#87003A',
                '&:hover': { bgcolor: '#6d002e' },
                borderRadius: 2.5,
                px: 3,
                py: 1,
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(135, 0, 58, 0.25)',
                width: { xs: '100%', sm: 'auto' },
              }}
            >
              {isKa ? 'QR კოდი' : 'View QR'}
            </Button>
          </Grid>
        </Grid>
      </Card>
    );
  };

  // If user is not logged in, show login message
  if (!user) {
    return (
      <Box sx={{ py: 8, minHeight: '80vh', bgcolor: '#f8fafc' }}>
        <Container maxWidth="sm">
          <Card sx={{ p: 4, textAlign: 'center', borderRadius: 4, boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)' }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(135, 0, 58, 0.1)',
                color: '#87003A',
                mx: 'auto',
                mb: 2.5,
              }}
            >
              <ConfirmationNumberIcon sx={{ fontSize: 36 }} />
            </Box>
            <Typography variant="h4" fontWeight={800} color="#0f172a" gutterBottom>
              {isKa ? 'ჩემი ბილეთები' : 'My Tickets'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {isKa
                ? 'თქვენი აქტიური და გამოყენებული ბილეთების სანახავად გთხოვთ გაიაროთ ავტორიზაცია.'
                : 'Please sign in to access your digital activity passes and booking QR codes.'}
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/login')}
              sx={{
                bgcolor: '#87003A',
                '&:hover': { bgcolor: '#6d002e' },
                borderRadius: 3,
                px: 4,
                py: 1.25,
                fontWeight: 700,
              }}
            >
              {isKa ? 'შესვლა' : 'Log In'}
            </Button>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ py: { xs: 4, md: 6 }, minHeight: '85vh', bgcolor: '#f8fafc' }}>
      <Container maxWidth="lg">
        {/* Header Section */}
        <Box sx={{ mb: 5 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(135, 0, 58, 0.1)',
                color: '#87003A',
              }}
            >
              <ConfirmationNumberIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800} color="#0f172a">
                {isKa ? 'ჩემი ბილეთები' : 'My Digital Tickets'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isKa ? 'თქვენი შეკვეთები და საგზურები' : 'Your booked adventures and entry passes'}
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Content */}
        {ordersLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#87003A' }} />
          </Box>
        )}

        {ordersError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
            {ordersError}
          </Alert>
        )}

        {!ordersLoading && !ordersError && orders.length === 0 && (
          <Card sx={{ p: 6, textAlign: 'center', borderRadius: 4, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#f1f5f9',
                color: '#64748b',
                mx: 'auto',
                mb: 2,
              }}
            >
              <ExploreIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h6" fontWeight={700} color="#0f172a" gutterBottom>
              {isKa ? 'აქტიური ბილეთები არ გაქვთ' : 'No tickets found'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 450, mx: 'auto' }}>
              {isKa
                ? 'დაათვალიერეთ ჩვენი წყლისა და სახმელეთო აქტივობები და დაჯავშნეთ თქვენი პირველი თავგადასავალი ონლაინ!'
                : 'Browse through our mountain and sea adventures and book your next unforgettable trip online!'}
            </Typography>
            <Button
              variant="contained"
              startIcon={<ExploreIcon />}
              onClick={() => navigate('/')}
              sx={{
                bgcolor: '#87003A',
                '&:hover': { bgcolor: '#6d002e' },
                borderRadius: 3,
                px: 3.5,
                py: 1,
                fontWeight: 700,
              }}
            >
              {isKa ? 'აქტივობების დათვალიერება' : 'Explore Activities'}
            </Button>
          </Card>
        )}

        {!ordersLoading && !ordersError && orders.length > 0 && (
          <Box>
            {orders.map((o) => (
              <TicketCard
                key={(o.order_number || o.number || o.id || Math.random()).toString()}
                ticket={mapOrderToTicket(o)}
              />
            ))}
          </Box>
        )}

        {/* QR Code Dialog */}
        <Dialog
          open={!!qrOrder}
          onClose={() => setQrOrder(null)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 4, p: 1 },
          }}
        >
          <DialogTitle sx={{ textAlign: 'center', fontWeight: 800, color: '#0f172a', pb: 0 }}>
            {isKa ? 'ბილეთის QR კოდი' : 'Entry QR Pass'}
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
            {qrOrder && (
              <>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: '#ffffff',
                    borderRadius: 3,
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                    border: '1px solid #e2e8f0',
                    mb: 2,
                  }}
                >
                  <QRCodeCanvas
                    value={JSON.stringify({
                      order_number: qrOrder.order_number || qrOrder.number || qrOrder.id,
                      event_title: qrOrder.event_title || qrOrder.title || qrOrder.event?.title,
                      date: qrOrder.event_date || qrOrder.event?.date,
                      customer: user?.email,
                      people: qrOrder.people_count || qrOrder.quantity || 1,
                    })}
                    size={220}
                    includeMargin
                    level="H"
                  />
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  #{qrOrder.order_number || qrOrder.id}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', textAlign: 'center', mt: 0.5 }}>
                  {isKa
                    ? 'წარუდგინეთ ეს QR კოდი ინსტრუქტორს აქტივობის ადგილზე დასასკანერებლად'
                    : 'Show this digital QR code to your instructor upon arrival'}
                </Typography>
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setQrOrder(null)}
              sx={{ borderRadius: 2, px: 3, color: '#87003A', borderColor: '#87003A' }}
            >
              {isKa ? 'დახურვა' : 'Close'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default Tickets;
