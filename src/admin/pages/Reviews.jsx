import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Button,
  TextField,
  Avatar,
  Stack,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
} from '@mui/material';
import {
  ThumbUp,
  ThumbDown,
  SentimentNeutral,
  Reply as ReplyIcon,
  CheckCircle,
  VisibilityOff,
  Delete,
  Refresh,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import reviewsApi from '../services/reviewsApi';

const MARK_COLOR = { good: '#27ae60', neutral: '#7f8c8d', bad: '#e74c3c' };
const MARK_ICON = {
  good: <ThumbUp sx={{ fontSize: 14 }} />,
  neutral: <SentimentNeutral sx={{ fontSize: 14 }} />,
  bad: <ThumbDown sx={{ fontSize: 14 }} />,
};

const formatDate = (raw) => {
  if (!raw) return '';
  try { return new Date(raw).toLocaleString('ka-GE'); } catch { return raw; }
};

const ReviewRow = ({ review, onApprove, onHide, onDelete, onReply, busy }) => {
  const customer = review.customer || {};
  const customerName = customer.full_name || `${customer.firstname || ''} ${customer.lastname || ''}`.trim() || 'Customer';
  const initials = customerName.split(' ').filter(Boolean).map((s) => s[0]).slice(0, 2).join('').toUpperCase();
  const markColor = MARK_COLOR[review.mark] || MARK_COLOR.neutral;

  return (
    <Card sx={{ mb: 2, borderRadius: 2.5, border: '1px solid rgba(255,255,255,0.06)' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Box display="flex" gap={1.5} alignItems="flex-start" flex={1} minWidth={0}>
            <Avatar sx={{ bgcolor: '#87003A', width: 40, height: 40, fontWeight: 700 }}>{initials || '?'}</Avatar>
            <Box flex={1} minWidth={0}>
              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                <Typography variant="subtitle2" fontWeight={700}>{customerName}</Typography>
                <Chip
                  size="small"
                  icon={MARK_ICON[review.mark]}
                  label={(review.mark || 'neutral').toUpperCase()}
                  sx={{ bgcolor: `${markColor}22`, color: markColor, fontWeight: 700, height: 22 }}
                />
                {!review.is_approved && (
                  <Chip size="small" label="Hidden" sx={{ bgcolor: '#fff3cd', color: '#856404', fontWeight: 700, height: 22 }} />
                )}
                {review.event_name && (
                  <Chip size="small" variant="outlined" label={review.event_name} sx={{ height: 22 }} />
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">
                {customer.email ? `${customer.email} • ` : ''}{formatDate(review.created_at)}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                {review.comment || review.text || review.body || 'No comment text provided.'}
              </Typography>

              {review.reply && (
                <Box
                  sx={{
                    mt: 1.5,
                    p: 1.5,
                    borderRadius: 1.5,
                    bgcolor: 'rgba(135,0,58,0.08)',
                    borderLeft: '3px solid #87003A',
                  }}
                >
                  <Typography variant="caption" fontWeight={700} color="primary" display="block">
                    Staff Reply:
                  </Typography>
                  <Typography variant="body2">{review.reply}</Typography>
                </Box>
              )}
            </Box>
          </Box>

          <Stack direction="row" spacing={0.5} alignItems="center" alignSelf={{ xs: 'flex-start', md: 'center' }}>
            {review.is_approved ? (
              <Tooltip title="Hide review">
                <span>
                  <IconButton size="small" onClick={() => onHide(review.id)} disabled={busy}>
                    <VisibilityOff fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            ) : (
              <Tooltip title="Approve review">
                <span>
                  <IconButton size="small" color="success" onClick={() => onApprove(review.id)} disabled={busy}>
                    <CheckCircle fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            )}

            <Tooltip title="Reply">
              <span>
                <IconButton size="small" color="primary" onClick={() => onReply(review)} disabled={busy}>
                  <ReplyIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="Delete">
              <span>
                <IconButton size="small" color="error" onClick={() => onDelete(review.id)} disabled={busy}>
                  <Delete fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

const Reviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [filterMark, setFilterMark] = useState('all');

  // Reply dialog state
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [activeReview, setActiveReview] = useState(null);
  const [replyText, setReplyText] = useState('');

  const companyId = user?.company_id || user?.company?.id || user?.companies?.[0]?.id || null;

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await reviewsApi.listForCompany(companyId);
      setReviews(list || []);
    } catch (e) {
      console.error('Failed to load reviews:', e);
      setError(e.response?.data?.message || e.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [companyId]);

  const counts = useMemo(() => {
    const total = reviews.length;
    const good = reviews.filter((r) => r.mark === 'good').length;
    const neutral = reviews.filter((r) => r.mark === 'neutral').length;
    const bad = reviews.filter((r) => r.mark === 'bad').length;
    return { total, good, neutral, bad };
  }, [reviews]);

  const filtered = useMemo(() => {
    if (filterMark === 'all') return reviews;
    return reviews.filter((r) => r.mark === filterMark);
  }, [reviews, filterMark]);

  const handleApprove = async (id) => {
    try {
      setBusyId(id);
      await reviewsApi.approve(id);
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, is_approved: true } : r)));
    } catch (e) {
      setError(e.message || 'Approve failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleHide = async (id) => {
    try {
      setBusyId(id);
      await reviewsApi.hide(id);
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, is_approved: false } : r)));
    } catch (e) {
      setError(e.message || 'Hide failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      setBusyId(id);
      await reviewsApi.remove(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      setError(e.message || 'Delete failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleOpenReply = (review) => {
    setActiveReview(review);
    setReplyText(review.reply || '');
    setReplyDialogOpen(true);
  };

  const handleSendReply = async () => {
    if (!activeReview) return;
    try {
      setBusyId(activeReview.id);
      await reviewsApi.reply(activeReview.id, replyText);
      setReviews((prev) =>
        prev.map((r) => (r.id === activeReview.id ? { ...r, reply: replyText } : r))
      );
      setReplyDialogOpen(false);
    } catch (e) {
      setError(e.message || 'Reply failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: '-0.02em' }}>
            Customer Reviews & Feedback
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage feedback, publish/hide reviews, and reply to customer experiences.
          </Typography>
        </Box>
        <Button startIcon={<Refresh />} variant="outlined" onClick={loadReviews} disabled={loading}>
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'All Reviews', value: counts.total, mark: 'all', color: '#87003A' },
          { label: 'Positive', value: counts.good, mark: 'good', color: '#27ae60' },
          { label: 'Neutral', value: counts.neutral, mark: 'neutral', color: '#7f8c8d' },
          { label: 'Negative', value: counts.bad, mark: 'bad', color: '#e74c3c' },
        ].map((card) => (
          <Grid item xs={6} sm={3} key={card.mark}>
            <Card
              onClick={() => setFilterMark(card.mark)}
              sx={{
                cursor: 'pointer',
                borderRadius: 2.5,
                border: filterMark === card.mark ? `2px solid ${card.color}` : '1px solid rgba(255,255,255,0.06)',
                bgcolor: filterMark === card.mark ? 'rgba(135,0,58,0.08)' : 'background.paper',
                transition: 'all 0.2s',
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  {card.label}
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color: card.color, mt: 0.5 }}>
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Reviews list */}
      {loading ? (
        <Box display="flex" justifyContent="center" my={6}>
          <CircularProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Typography color="text.secondary">No reviews found for this selection.</Typography>
        </Card>
      ) : (
        filtered.map((rev) => (
          <ReviewRow
            key={rev.id}
            review={rev}
            busy={busyId === rev.id}
            onApprove={handleApprove}
            onHide={handleHide}
            onDelete={handleDelete}
            onReply={handleOpenReply}
          />
        ))
      )}

      {/* Reply dialog */}
      <Dialog open={replyDialogOpen} onClose={() => setReplyDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Reply to Review</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Responding as staff to: <strong>{activeReview?.customer?.full_name || 'Customer'}</strong>
          </Typography>
          <TextField
            multiline
            rows={4}
            fullWidth
            placeholder="Write a professional and helpful reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReplyDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSendReply} sx={{ bgcolor: '#87003A', '&:hover': { bgcolor: '#69002D' } }}>
            Post Reply
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Reviews;
