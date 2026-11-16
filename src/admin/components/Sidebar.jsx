import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Avatar,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
  alpha,
  Chip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Event as EventIcon,
  LocationCity as CityIcon,
  Category as CategoryIcon,
  People as UserIcon,
  Logout as LogoutIcon,
  Public as CountryIcon,
  Business as CompanyIcon,
  Menu as MenuIcon,
  ViewCarousel as SliderIcon,
  ShoppingCart as OrdersIcon,
  QrCodeScanner as QrCodeScannerIcon,
  RateReview as RateReviewIcon,
  AdminPanelSettings as AdminIcon,
  BadgeOutlined as StaffIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import SessionInfo from './SessionInfo';
import logo from '../logo.jpg';

const drawerWidth = 264;

function Sidebar() {
  const location = useLocation();
  const { user, logout, permissions, isAdmin, isStaffOnly, role: userRole } = useAuth();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  const [sessionInfoOpen, setSessionInfoOpen] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => setMobileOpen((o) => !o);

  const displayName = user?.firstname || user?.username || user?.email?.split('@')[0] || (isAdmin ? 'Admin' : 'Staff');
  const initials = (displayName || 'U').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();

  const companyName = user?.company?.name || user?.companies?.[0]?.name || (isAdmin ? 'Central Admin' : 'Partner Staff');
  const roleLabel = isAdmin 
    ? (permissions?.includes('super_admin') || user?.is_superuser ? 'Super Admin' : 'Administrator')
    : 'Staff / Moderator';

  const SIDEBAR_BG = '#0B1220';
  const SIDEBAR_BG_SOFT = '#111A2E';
  const SIDEBAR_TEXT = '#E5E8EE';
  const SIDEBAR_MUTED = '#94A0B3';
  const SIDEBAR_BORDER = 'rgba(255,255,255,0.06)';
  const BRAND = '#87003A';
  const BRAND_LIGHT = '#D86B8C';

  // Navigation sections based on role
  const navSections = React.useMemo(() => {
    if (isAdmin) {
      return [
        {
          label: 'Overview',
          items: [
            { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin' },
            { text: 'Staff Operations', icon: <StaffIcon />, path: '/staff' },
          ],
        },
        {
          label: 'Operations',
          items: [
            { text: 'Orders', icon: <OrdersIcon />, path: '/admin/orders' },
            { text: 'Events', icon: <EventIcon />, path: '/admin/events' },
            { text: 'Reviews', icon: <RateReviewIcon />, path: '/admin/reviews' },
            { text: 'QR Scanner', icon: <QrCodeScannerIcon />, path: '/admin/qr-scanner' },
          ],
        },
        {
          label: 'Catalog & Content',
          items: [
            { text: 'Categories', icon: <CategoryIcon />, path: '/admin/categories' },
            { text: 'Slider', icon: <SliderIcon />, path: '/admin/slider' },
          ],
        },
        {
          label: 'Locations',
          items: [
            { text: 'Cities', icon: <CityIcon />, path: '/admin/cities' },
            { text: 'Countries', icon: <CountryIcon />, path: '/admin/countries' },
          ],
        },
        {
          label: 'Partners & People',
          items: [
            { text: 'Companies', icon: <CompanyIcon />, path: '/admin/companies' },
            { text: 'Users', icon: <UserIcon />, path: '/admin/users' },
          ],
        }
      ];
    }

    // Staff navigation
    return [
      {
        label: 'Overview',
        items: [
          { text: 'Staff Dashboard', icon: <DashboardIcon />, path: '/staff' },
        ],
      },
      {
        label: 'Operations',
        items: [
          { text: 'Events', icon: <EventIcon />, path: '/admin/events' },
          { text: 'Orders', icon: <OrdersIcon />, path: '/admin/orders' },
          { text: 'Reviews', icon: <RateReviewIcon />, path: '/admin/reviews' },
          { text: 'QR Scanner', icon: <QrCodeScannerIcon />, path: '/admin/qr-scanner' },
        ],
      },
    ];
  }, [isAdmin]);

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: SIDEBAR_BG, color: SIDEBAR_TEXT }}>
      {/* Brand header */}
      <Box sx={{ px: 2.5, py: 2.25, display: 'flex', alignItems: 'center', gap: 1.25, borderBottom: `1px solid ${SIDEBAR_BORDER}` }}>
        <Box
          sx={{
            width: 38, height: 38, borderRadius: 2,
            background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_LIGHT} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 16px rgba(135,0,58,0.35)',
            overflow: 'hidden',
          }}
        >
          <img src={logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </Box>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#fff', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
            funfinder
          </Typography>
          <Chip
            size="small"
            label={isAdmin ? 'ADMIN' : 'STAFF'}
            sx={{
              height: 18,
              fontSize: '0.625rem',
              fontWeight: 800,
              bgcolor: isAdmin ? 'rgba(135,0,58,0.3)' : 'rgba(52, 152, 219, 0.25)',
              color: isAdmin ? '#D86B8C' : '#5dade2',
              border: `1px solid ${isAdmin ? 'rgba(135,0,58,0.5)' : 'rgba(52, 152, 219, 0.4)'}`,
              mt: 0.25,
            }}
          />
        </Box>
      </Box>

      {/* Nav list */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 2 }}>
        {navSections.map((section) => (
          <Box key={section.label} sx={{ mb: 1.5 }}>
            <Typography
              sx={{
                px: 1.5, mb: 0.5,
                fontSize: '0.68rem', fontWeight: 700,
                color: alpha('#fff', 0.4),
                letterSpacing: '0.14em', textTransform: 'uppercase',
              }}
            >
              {section.label}
            </Typography>
            <List dense disablePadding>
              {section.items.map((item) => {
                const active = location.pathname === item.path || (item.path !== '/admin' && item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <ListItem key={item.text} disablePadding sx={{ mb: 0.25 }}>
                    <ListItemButton
                      component={Link}
                      to={item.path}
                      onClick={isMobile ? handleDrawerToggle : undefined}
                      sx={{
                        position: 'relative',
                        borderRadius: 2,
                        px: 1.5, py: 1,
                        color: active ? '#fff' : SIDEBAR_TEXT,
                        backgroundColor: active ? alpha(BRAND, 0.22) : 'transparent',
                        '&:hover': {
                          backgroundColor: active ? alpha(BRAND, 0.28) : SIDEBAR_BG_SOFT,
                        },
                        '&::before': active ? {
                          content: '""',
                          position: 'absolute',
                          left: -6,
                          top: 8, bottom: 8,
                          width: 3,
                          borderRadius: 999,
                          backgroundColor: BRAND_LIGHT,
                        } : {},
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 34, color: active ? BRAND_LIGHT : SIDEBAR_MUTED }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          fontSize: '0.875rem',
                          fontWeight: active ? 700 : 500,
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* User profile card at bottom */}
      <Box sx={{ p: 1.5, borderTop: `1px solid ${SIDEBAR_BORDER}` }}>
        <Box
          sx={{
            display: 'flex', alignItems: 'center', gap: 1.25,
            px: 1.25, py: 1, borderRadius: 2,
            backgroundColor: SIDEBAR_BG_SOFT,
            border: `1px solid ${SIDEBAR_BORDER}`,
          }}
        >
          <Avatar sx={{
            width: 36, height: 36, fontSize: '0.85rem',
            bgcolor: BRAND, color: '#fff',
          }}>
            {initials}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: '0.825rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 }} noWrap>
              {displayName}
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: SIDEBAR_MUTED }} noWrap>
              {roleLabel} • {companyName}
            </Typography>
          </Box>
          <Tooltip title="View Website">
            <IconButton
              size="small"
              component={Link}
              to="/"
              sx={{ color: SIDEBAR_MUTED, '&:hover': { color: '#fff', bgcolor: alpha('#fff', 0.06) } }}
            >
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Logout">
            <IconButton size="small" onClick={logout} sx={{ color: SIDEBAR_MUTED, '&:hover': { color: '#fff', bgcolor: alpha('#fff', 0.06) } }}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );

  // Friendly title for the top bar
  const activeLabel = (() => {
    for (const s of navSections) {
      const m = s.items.find((it) => it.path === location.pathname || (it.path !== '/admin' && it.path !== '/' && location.pathname.startsWith(it.path)));
      if (m) return m.text;
    }
    return isAdmin ? 'Admin Portal' : 'Staff Portal';
  })();

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: 60, md: 68 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            {isMobile && (
              <IconButton edge="start" onClick={handleDrawerToggle} sx={{ color: 'text.primary' }}>
                <MenuIcon />
              </IconButton>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
              <Typography variant="h6" sx={{ lineHeight: 1.1, fontWeight: 700 }} noWrap>
                {activeLabel}
              </Typography>
              <Chip
                size="small"
                icon={isAdmin ? <AdminIcon sx={{ fontSize: '14px !important' }} /> : <StaffIcon sx={{ fontSize: '14px !important' }} />}
                label={roleLabel}
                color={isAdmin ? 'primary' : 'info'}
                variant="outlined"
                sx={{ height: 24, fontSize: '0.75rem', fontWeight: 600 }}
              />
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            border: 'none',
            backgroundColor: SIDEBAR_BG,
            backgroundImage: `radial-gradient(60% 60% at 50% -10%, ${alpha(BRAND, 0.18)} 0%, rgba(0,0,0,0) 65%)`,
          },
        }}
        anchor="left"
      >
        {drawerContent}
      </Drawer>

      <SessionInfo open={sessionInfoOpen} onClose={() => setSessionInfoOpen(false)} />
    </>
  );
}

export default Sidebar;
