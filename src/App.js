import React, { Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID } from './config/googleAuth';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { GuideProvider } from './contexts/GuideContext';
import { LanguageProvider } from './contexts/LanguageContext';
import LanguageSync from './components/LanguageSync';
import { Home } from "./pages/home/Home";
import Footer from "./layout/Footer";
import Sidebar from './layout/Sidebar';
import CurrencyToggle from './components/CurrencyToggle';
import AccessibilityPanel from './components/AccessibilityPanel';
import ScrollToTop from './components/ScrollToTop';
import ScrollProgressBar from './components/ScrollProgressBar';
import OrbitalFab from './components/OrbitalFab';

// Lazy-loaded routes
const About = React.lazy(() => import("./pages/about/About").then(m => ({ default: m.About })));
const Tickets = React.lazy(() => import("./pages/tickets/Tickets"));
const TicketDetails = React.lazy(() => import("./pages/tickets/TicketDetails"));
const Restrictions = React.lazy(() => import("./pages/restrictions/Restrictions"));
const Contact = React.lazy(() => import("./pages/contact/Contact"));
const Rules = React.lazy(() => import("./pages/rules/Rules"));
const Privacy = React.lazy(() => import("./pages/privacy/Privacy"));
const Login = React.lazy(() => import("./pages/auth/Login"));
const Register = React.lazy(() => import("./pages/auth/Register"));
const Profile = React.lazy(() => import("./pages/profile/Profile"));
const AdminPortal = React.lazy(() => import("./admin/App"));
const ApiExample = React.lazy(() => import('./components/ApiExample'));
const BookingHistory = React.lazy(() => import('./pages/booking/BookingHistory'));
const ActivityDetails = React.lazy(() => import('./pages/activities/ActivityDetails'));
const MapDemo = React.lazy(() => import('./pages/map/MapDemo'));
const PaymentPage = React.lazy(() => import('./pages/payment/Payment'));
const PaymentStatus = React.lazy(() => import('./pages/payment/PaymentStatus'));
const GooglePayTest = React.lazy(() => import('./pages/payment/GooglePayTest'));
const LandActivities = React.lazy(() => import('./pages/activities/land/LandActivities'));
const QuadTours = React.lazy(() => import('./pages/activities/land/QuadTours'));
const MotoTours = React.lazy(() => import('./pages/activities/land/MotoTours'));
const JeepTours = React.lazy(() => import('./pages/activities/land/JeepTours'));
const Bicycles = React.lazy(() => import('./pages/activities/land/Bicycles'));
const Hiking = React.lazy(() => import('./pages/activities/land/Hiking'));
const WaterActivities = React.lazy(() => import('./pages/activities/water/WaterActivities'));
const Parachute = React.lazy(() => import('./pages/activities/water/Parachute'));
const Yacht = React.lazy(() => import('./pages/activities/water/Yacht'));
const Rafting = React.lazy(() => import('./pages/activities/water/Rafting'));
const SeaMoto = React.lazy(() => import('./pages/activities/water/SeaMoto'));
const SeaOther = React.lazy(() => import('./pages/activities/water/SeaOther'));
const NearbyActivities = React.lazy(() => import('./pages/activities/NearbyActivities'));
const CategoryPage = React.lazy(() => import('./pages/activities/CategoryPage'));

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/tickets" element={<Tickets />} />
      <Route path="/tickets/:orderNumber" element={<TicketDetails />} />
      <Route path="/orders/:orderNumber" element={<TicketDetails />} />
      <Route path="/ticket/:orderNumber" element={<TicketDetails />} />
      <Route path="/order/:orderNumber" element={<TicketDetails />} />
      <Route path="/restrictions" element={<Restrictions />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/rules" element={<Rules />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/privacy-policy" element={<Privacy />} />
      <Route path="/terms" element={<Rules />} />
      <Route path="/terms-of-service" element={<Rules />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<Profile />} />
      
      {/* New Entertainment Pages */}
      <Route path="/activity/:id" element={<ActivityDetails />} />
      <Route path="/activity/:category/:title" element={<ActivityDetails />} />
      <Route path="/booking-history" element={<BookingHistory />} />
      <Route path="/payment" element={<PaymentPage />} />
      <Route path="/payment/status" element={<PaymentStatus />} />
      <Route path="/payment/status/:orderNumber" element={<PaymentStatus />} />
      <Route path="/map-demo" element={<MapDemo />} />
      
      {/* Water Activities */}
      <Route path="/water-activities" element={<WaterActivities />} />
      <Route path="/parachute" element={<Parachute />} />
      <Route path="/yacht" element={<Yacht />} />
      <Route path="/rafting" element={<Rafting />} />
      <Route path="/sea-moto" element={<SeaMoto />} />
      <Route path="/sea-other" element={<SeaOther />} />
      
      {/* Dynamic Category Route */}
      <Route path="/category/:categoryId" element={<CategoryPage />} />
      <Route path="/activity/:category" element={<CategoryPage />} />

      {/* Land Activities */}
      <Route path="/land-activities" element={<LandActivities />} />
      <Route path="/quad-tours" element={<QuadTours />} />
      <Route path="/moto-tours" element={<MotoTours />} />
      <Route path="/jeep-tours" element={<JeepTours />} />
      <Route path="/bicycles" element={<Bicycles />} />
      <Route path="/hiking" element={<Hiking />} />
      
      {/* Nearby Activities */}
      <Route path="/nearby-activities" element={<NearbyActivities />} />
      
      <Route path="/api-example" element={<ApiExample />} />
      <Route path="/google-pay-test" element={<GooglePayTest />} />
    </Routes>
  );
}

function App() {
  const clientId = GOOGLE_CLIENT_ID || "333647909738-mk7oujo9rhbji5dpgdu4okh49ue2r3ba.apps.googleusercontent.com";
  const location = useLocation();

  const isAdminOrStaff = 
    location.pathname.startsWith('/admin') || 
    location.pathname === '/staff' || 
    location.pathname.startsWith('/staff/') ||
    Boolean(location.pathname.match(/^\/(en|ka|ru|hi|ar|he|tr|hy|kk|uk|zh)\/(admin|staff)($|\/)/i));

  if (isAdminOrStaff) {
    return (
      <GoogleOAuthProvider clientId={clientId}>
        <LanguageProvider>
          <LanguageSync />
          <CurrencyProvider>
            <Suspense fallback={
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '80vh',
                color: '#87003A',
                fontSize: '1.25rem',
                fontWeight: 600
              }}>
                Loading Portal...
              </div>
            }>
              <Routes>
                <Route path="/admin/*" element={<AdminPortal />} />
                <Route path="/staff/*" element={<AdminPortal initialView="staff" />} />
                <Route path="/:lang/admin/*" element={<AdminPortal />} />
                <Route path="/:lang/staff/*" element={<AdminPortal initialView="staff" />} />
              </Routes>
            </Suspense>
          </CurrencyProvider>
        </LanguageProvider>
      </GoogleOAuthProvider>
    );
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <LanguageProvider>
        <LanguageSync />
        <CurrencyProvider>
          <GuideProvider>
            <Sidebar />
            <main className="main-content" style={{fontFamily:"'Inter', sans-serif"}}>
              <Suspense fallback={
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '80vh',
                  color: '#87003A',
                  fontSize: '1.25rem',
                  fontWeight: 600
                }}>
                  Loading...
                </div>
              }>
                <Routes>
                  <Route path="/:lang/*" element={<AppRoutes />} />
                  <Route path="/*" element={<AppRoutes />} />
                </Routes>
              </Suspense>
              <Footer />
            </main>
            <ScrollProgressBar />
            <ScrollToTop />
          </GuideProvider>
        </CurrencyProvider>
      </LanguageProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
