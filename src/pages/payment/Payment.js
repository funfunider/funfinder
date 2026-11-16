import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Divider,
  Chip,
  IconButton,
  Avatar,
  Paper,
  InputAdornment,
  Tab,
  Tabs,
  MenuItem,
} from '@mui/material';
import {
  CreditCard,
  CalendarToday,
  ChevronLeft,
  ChevronRight,
  AccessTime,
  LocationOn,
  People,
  ConfirmationNumber,
  ArrowBack,
  VerifiedUser,
  Email,
  Phone,
  Person,
  Lock,
  Shield,
  Add,
  Remove,
  Check,
  NoteAlt,
  EventAvailable,
  FiberManualRecord,
  ChildCare,
  Elderly,
  WbSunny,
  DirectionsCar,
  LocalActivity,
  Luggage,
  GpsFixed,
  Security,
  PhotoCamera,
  Badge,
} from '@mui/icons-material';
import { FaCcVisa, FaCcMastercard } from 'react-icons/fa';
import orderApiService from '../../services/orderApi';
import { eventsApi } from '../../services/api';
import { useLocation, Link } from 'react-router-dom';
import { useLanguageNavigate } from '../../hooks/useLanguageNavigate';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import CheckoutAuth from '../../components/CheckoutAuth';

const BRAND_COLOR = '#87003A';
const BRAND_HOVER = '#5a0027';
const SUCCESS_COLOR = '#16a34a';

const DAYS_LONG = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MONTHS_ENGLISH = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const AVAILABLE_LOCATIONS = [
  { id: 'office', label: 'ადგილზე ოფისში / ბაზაზე (At Venue / Main Office)' },
  { id: 'batumi_airport', label: 'ბათუმის საერთაშორისო აეროპორტი (Batumi Airport - BUS)' },
  { id: 'tbilisi_airport', label: 'თბილისის საერთაშორისო აეროპორტი (Tbilisi Airport - TBS)' },
  { id: 'kutaisi_airport', label: 'ქუთაისის საერთაშორისო აეროპორტი (Kutaisi Airport - KUT)' },
  { id: 'hotel_delivery', label: 'მიწოდება სასტუმროში / მისამართზე (Hotel / Custom Delivery)' },
];

const ADD_ONS_CATALOG = [
  {
    id: 'insurance_full',
    title: 'სრული დაზღვევა',
    titleEn: 'Full Insurance',
    price: 25,
    perDay: true,
    icon: <Security sx={{ fontSize: 18, color: '#16a34a' }} />,
  },
  {
    id: 'child_seat',
    title: 'ბავშვის სავარძელი',
    titleEn: 'Child Safety Seat',
    price: 15,
    perDay: false,
    icon: <ChildCare sx={{ fontSize: 18, color: '#0284c7' }} />,
  },
  {
    id: 'gps_wifi',
    title: 'GPS + 4G Wi-Fi',
    titleEn: 'GPS + 4G Wi-Fi',
    price: 12,
    perDay: true,
    icon: <GpsFixed sx={{ fontSize: 18, color: '#f59e0b' }} />,
  },
  {
    id: 'private_driver',
    title: 'პირადი მძღოლი / გიდი',
    titleEn: 'Private Driver / Guide',
    price: 60,
    perDay: true,
    icon: <Person sx={{ fontSize: 18, color: BRAND_COLOR }} />,
  },
  {
    id: 'action_camera',
    title: 'GoPro 4K გადაღება',
    titleEn: 'GoPro 4K Camera',
    price: 35,
    perDay: false,
    icon: <PhotoCamera sx={{ fontSize: 18, color: '#9333ea' }} />,
  },
];

const PaymentPage = ({ bookingData: propBookingData }) => {
  const navigate = useLanguageNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { language, getLocalizedPath } = useLanguage();

  const bookingData = location.state?.bookingData || propBookingData;
  const searchParams = new URLSearchParams(location.search);
  const queryEventId = searchParams.get('event') || searchParams.get('id') || searchParams.get('activity_id');
  const initialEventId = bookingData?.activity?.id || queryEventId || '';

  // Detect whether this is car rental / vehicle booking
  const isVehicleInitial =
    bookingData?.bookingType === 'rental' ||
    bookingData?.activity?.category?.slug === 'car-rental' ||
    searchParams.get('type') === 'rental';

  const [bookingMode, setBookingMode] = useState(isVehicleInitial ? 'rental' : 'activity'); // 'activity' | 'rental'

  // Initial Date calculation
  const parseInitialDate = () => {
    if (bookingData?.bookingDetails?.date) {
      const d = new Date(bookingData.bookingDetails.date);
      if (!isNaN(d.getTime())) return d;
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  };

  const [selectedDate, setSelectedDate] = useState(parseInitialDate());
  const [calendarMonth, setCalendarMonth] = useState(
    new Date(parseInitialDate().getFullYear(), parseInitialDate().getMonth(), 1)
  );
  const [calendarView, setCalendarView] = useState(0); // 0 = Month, 1 = Week, 2 = Day
  const [dayCursor, setDayCursor] = useState(parseInitialDate());
  const [selectedSlot, setSelectedSlot] = useState(bookingData?.bookingDetails?.time || '14:00');

  // Rental (Multi-day / Car Rental) state
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const dayAfterTomorrowStr = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];

  const [rentalData, setRentalData] = useState({
    pickupDate: bookingData?.bookingDetails?.pickupDate || tomorrowStr,
    dropoffDate: bookingData?.bookingDetails?.dropoffDate || dayAfterTomorrowStr,
    pickupTime: bookingData?.bookingDetails?.pickupTime || '11:00',
    dropoffTime: bookingData?.bookingDetails?.dropoffTime || '11:00',
    pickupLocation: 'batumi_airport',
    dropoffLocation: 'batumi_airport',
    driverLicense: '',
    drivingExperienceYears: '3',
  });

  // Calculate rental days count
  const rentalDaysCount = useMemo(() => {
    const start = new Date(rentalData.pickupDate);
    const end = new Date(rentalData.dropoffDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, isNaN(diffDays) ? 1 : diffDays);
  }, [rentalData.pickupDate, rentalData.dropoffDate]);

  // Selected Add-ons
  const [selectedAddOns, setSelectedAddOns] = useState([]);

  const toggleAddOn = (addOnId) => {
    setSelectedAddOns((prev) =>
      prev.includes(addOnId) ? prev.filter((id) => id !== addOnId) : [...prev, addOnId]
    );
  };

  // Ticket quantities by age group (Activity mode)
  const [tickets, setTickets] = useState({
    adults: bookingData?.bookingDetails?.participants || 1,
    children: 0,
    infants: 0,
  });

  const [form, setForm] = useState({
    event: initialEventId,
    customer_name: bookingData?.bookingDetails?.name || user?.firstname || user?.name || '',
    customer_email: user?.email || '',
    customer_phone: bookingData?.bookingDetails?.phone?.replace(/\D/g, '') || user?.mobile || '',
    customer_country: user?.country || 'GEO',
    notes: '',
  });

  const [eventDetails, setEventDetails] = useState(bookingData?.activity || null);
  const [eventLoading, setEventLoading] = useState(!bookingData?.activity && !!initialEventId);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsWarning, setShowTermsWarning] = useState(false);
  const [orderNumber, setOrderNumber] = useState(null);
  const [loading, setLoading] = useState(false);
  const [redirectingBOG, setRedirectingBOG] = useState(false);
  const [error, setError] = useState(null);

  // Fetch event details
  useEffect(() => {
    const targetId = form.event || initialEventId;
    if (targetId) {
      if (!eventDetails) setEventLoading(true);
      eventsApi
        .getDetails(targetId)
        .then((data) => {
          if (data) {
            setEventDetails((prev) => ({ ...(prev || {}), ...data }));
          }
        })
        .catch((err) => {
          console.error('Error fetching event details:', err);
        })
        .finally(() => {
          setEventLoading(false);
        });
    }
  }, [form.event, initialEventId]);

  // Autofill form when logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      setForm((prev) => ({
        ...prev,
        customer_name: prev.customer_name || user.firstname || user.name || '',
        customer_email: prev.customer_email || user.email || '',
        customer_phone: prev.customer_phone || user.mobile?.replace(/\D/g, '') || '',
        customer_country: prev.customer_country || user.country || 'GEO',
      }));
    }
  }, [isAuthenticated, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRentalChange = (e) => {
    const { name, value } = e.target;
    setRentalData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTicketChange = (type, delta) => {
    setTickets((prev) => {
      const current = prev[type] || 0;
      const updated = Math.max(0, Math.min(20, current + delta));
      return { ...prev, [type]: updated };
    });
  };

  const totalPeopleCount = tickets.adults + tickets.children + tickets.infants;
  const hasValidTickets = bookingMode === 'rental' || (tickets.adults + tickets.children) > 0;

  // Operating hours
  const availableHours = useMemo(() => {
    if (Array.isArray(eventDetails?.time_slots) && eventDetails.time_slots.length > 0) {
      return eventDetails.time_slots.map(s => typeof s === 'string' ? s : s.start_time).filter(Boolean);
    }
    if (Array.isArray(eventDetails?.timeSlots) && eventDetails.timeSlots.length > 0) {
      return eventDetails.timeSlots.map(s => typeof s === 'string' ? s : s.start_time).filter(Boolean);
    }
    if (Array.isArray(eventDetails?.working_hours?.slots) && eventDetails.working_hours.slots.length > 0) {
      return eventDetails.working_hours.slots;
    }
    const openHour = parseInt(eventDetails?.working_hours_start?.split(':')[0] || eventDetails?.opening_hour || eventDetails?.working_hours?.start || 9, 10);
    const closeHour = parseInt(eventDetails?.working_hours_end?.split(':')[0] || eventDetails?.closing_hour || eventDetails?.working_hours?.end || 19, 10);
    const slots = [];
    for (let h = openHour; h <= closeHour; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
    }
    return slots.length > 0
      ? slots
      : ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
  }, [eventDetails]);

  // Pricing calculations
  const getSlotPricing = (slotTime) => {
    const baseAdult = parseFloat(
      eventDetails?.discounted_price ?? eventDetails?.adult_price ?? eventDetails?.price_per_person ?? eventDetails?.base_price ?? bookingData?.activity?.base_price ?? 50
    );

    // 1. Check time_slots array from admin event configuration
    if (Array.isArray(eventDetails?.time_slots) && eventDetails.time_slots.length > 0) {
      const matched = eventDetails.time_slots.find(s => (typeof s === 'string' ? s : s.start_time) === slotTime);
      if (matched && typeof matched === 'object') {
        const slotPrice = parseFloat(matched.price || baseAdult);
        const adultPrice = parseFloat(matched.adult_price || slotPrice);
        const childPrice = matched.child_price !== '' && matched.child_price != null
          ? parseFloat(matched.child_price)
          : (parseFloat(eventDetails?.child_price) || Math.round(adultPrice * 0.65));
        return {
          adult: adultPrice,
          child: childPrice,
          infant: 0,
          isPeak: !!matched.slot_label,
          label: matched.slot_label || null,
        };
      }
    }

    // 2. Check slots_pricing object
    if (eventDetails?.slots_pricing && eventDetails.slots_pricing[slotTime]) {
      const sp = eventDetails.slots_pricing[slotTime];
      return {
        adult: parseFloat(sp.adult || sp.price || baseAdult),
        child: parseFloat(sp.child || sp.child_price || baseAdult * 0.7),
        infant: parseFloat(sp.infant || 0),
        isPeak: !!sp.is_peak || !!sp.label,
        label: sp.label || null,
      };
    }

    // 3. Check custom age_prices array if defined on the event
    if (Array.isArray(eventDetails?.age_prices) && eventDetails.age_prices.length > 0) {
      const matchingTimeAp = eventDetails.age_prices.filter((ap) => {
        if (!ap.start_time || !ap.end_time) return true;
        const st = String(ap.start_time).substring(0, 5);
        const et = String(ap.end_time).substring(0, 5);
        return slotTime >= st && slotTime <= et;
      });
      const apPool = matchingTimeAp.length > 0 ? matchingTimeAp : eventDetails.age_prices;
      const adultAp = apPool.find((ap) => Number(ap.min_age) >= 18 || /adult|ზრდასრულ/i.test(String(ap.category_name || '')));
      const childAp = apPool.find((ap) => (Number(ap.min_age) < 18 && Number(ap.max_age) > 5) || /child|ბავშვ|მოზარდ/i.test(String(ap.category_name || '')));
      const infantAp = apPool.find((ap) => Number(ap.max_age) <= 5 || /infant|ჩვილ/i.test(String(ap.category_name || '')));
      const fallbackAp = apPool[0];

      const resolvedAdult = adultAp ? parseFloat(adultAp.price) : (fallbackAp ? parseFloat(fallbackAp.price) : baseAdult);
      const resolvedChild = childAp ? parseFloat(childAp.price) : (parseFloat(eventDetails?.child_price ?? Math.round(resolvedAdult * 0.65)));
      const resolvedInfant = infantAp ? parseFloat(infantAp.price) : (parseFloat(eventDetails?.infant_price ?? 0));

      return {
        adult: isNaN(resolvedAdult) ? baseAdult : resolvedAdult,
        child: isNaN(resolvedChild) ? Math.round(baseAdult * 0.65) : resolvedChild,
        infant: isNaN(resolvedInfant) ? 0 : resolvedInfant,
        isPeak: false,
        label: null,
      };
    }

    const hourNum = parseInt(slotTime.split(':')[0], 10);
    const isSunsetPeak = hourNum >= 17 && hourNum <= 20;
    const slotMultiplier = isSunsetPeak ? 1.2 : 1.0;
    const slotAdult = Math.round(baseAdult * slotMultiplier);
    const slotChild = parseFloat(eventDetails?.child_price ?? Math.round(slotAdult * 0.65));
    const slotInfant = parseFloat(eventDetails?.infant_price ?? 0);

    return {
      adult: slotAdult,
      child: slotChild,
      infant: slotInfant,
      isPeak: isSunsetPeak,
      label: isSunsetPeak ? (language === 'ka' ? 'საღამოს / Sunset ტარიფი' : 'Sunset Prime') : null,
    };
  };

  const currentSlotPricing = getSlotPricing(selectedSlot);

  // Daily rate for vehicle rental
  const dailyRate = parseFloat(
    eventDetails?.daily_price ?? eventDetails?.price_per_day ?? eventDetails?.base_price ?? 90
  );

  // Calculate Base Tickets / Rental Cost
  const baseBookingCost = useMemo(() => {
    if (bookingMode === 'rental') {
      return dailyRate * rentalDaysCount;
    }
    return (
      tickets.adults * currentSlotPricing.adult +
      tickets.children * currentSlotPricing.child +
      tickets.infants * currentSlotPricing.infant
    );
  }, [bookingMode, dailyRate, rentalDaysCount, tickets, currentSlotPricing]);

  // Calculate Add-ons cost
  const addOnsCost = useMemo(() => {
    let sum = 0;
    selectedAddOns.forEach((addOnId) => {
      const item = ADD_ONS_CATALOG.find((a) => a.id === addOnId);
      if (item) {
        if (bookingMode === 'rental' && item.perDay) {
          sum += item.price * rentalDaysCount;
        } else {
          sum += item.price;
        }
      }
    });
    return sum;
  }, [selectedAddOns, bookingMode, rentalDaysCount]);

  const totalAmount = baseBookingCost + addOnsCost;

  // Comparison for savings tag
  const originalBasePrice = parseFloat(eventDetails?.base_price ?? bookingData?.activity?.base_price ?? dailyRate);
  const originalTotal =
    bookingMode === 'rental'
      ? originalBasePrice * rentalDaysCount + addOnsCost
      : originalBasePrice * tickets.adults + originalBasePrice * 0.7 * tickets.children + addOnsCost;
  const hasDiscount = originalTotal > totalAmount;
  const savings = hasDiscount ? originalTotal - totalAmount : 0;

  // Event Date ISO string
  const formattedEventDate = useMemo(() => {
    if (bookingMode === 'rental') {
      return `${rentalData.pickupDate}T${rentalData.pickupTime}`;
    }
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(selectedDate.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${selectedSlot}`;
  }, [bookingMode, rentalData, selectedDate, selectedSlot]);

  // Images
  const defaultImg =
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80';
  const rawImg =
    eventDetails?.primary_image?.image ||
    eventDetails?.image ||
    (eventDetails?.images && eventDetails.images[0]?.image) ||
    bookingData?.activity?.image;
  const getFullImageUrl = (img) => {
    if (!img) return defaultImg;
    const str = String(img);
    if (str.startsWith('http://') || str.startsWith('https://')) return str;
    if (str.startsWith('/')) return 'https://funfinder.ge' + str;
    return 'https://funfinder.ge/uploads/service_images/' + str;
  };
  const eventImageUrl = getFullImageUrl(rawImg);

  const activityTitle =
    eventDetails?.name || eventDetails?.title || bookingData?.activity?.name || (language === 'ka' ? 'სერვისი / აქტივობა' : 'Experience');
  const activityLocation =
    bookingData?.activity?.location ||
    eventDetails?.city?.name ||
    eventDetails?.location ||
    (language === 'ka' ? 'საქართველო' : 'Georgia');
  const activityDuration =
    eventDetails?.duration || bookingData?.activity?.duration || (language === 'ka' ? 'მოქნილი' : 'Flexible');

  // Month Grid Calculation (Sunday-first matching user screenshot 1)
  const monthGridCells = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const cells = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push({ empty: true, key: `empty-${i}` });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(year, month, d);
      cellDate.setHours(0, 0, 0, 0);
      const isPast = cellDate < today;
      const isToday = cellDate.getTime() === today.getTime();
      const isSelected =
        cellDate.getFullYear() === selectedDate.getFullYear() &&
        cellDate.getMonth() === selectedDate.getMonth() &&
        cellDate.getDate() === selectedDate.getDate();

      cells.push({
        empty: false,
        date: cellDate,
        dayNum: d,
        isPast,
        isToday,
        isSelected,
        key: `day-${d}`,
      });
    }
    return cells;
  }, [calendarMonth, selectedDate]);

  const weekDays = useMemo(() => {
    const curr = new Date(dayCursor);
    const dayOfWeek = curr.getDay();
    const startOfWeek = new Date(curr);
    startOfWeek.setDate(curr.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  }, [dayCursor]);

  const handlePrevMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setDayCursor(new Date(date));
    setCalendarView(2); // Jump to Day view
  };

  // Main Submit handler (Debit / Credit card redirect via Bank of Georgia)
  const handleProceedToPayment = async () => {
    setError(null);

    if (!termsAccepted) {
      setShowTermsWarning(true);
      setError(
        language === 'ka'
          ? 'გთხოვთ დაეთანხმოთ წესებსა და პირობებს გასაგრძელებლად.'
          : 'Please agree to terms and conditions to proceed.'
      );
      return;
    }

    if (bookingMode === 'activity' && (tickets.adults + tickets.children) <= 0) {
      setError(
        language === 'ka'
          ? 'გთხოვთ აირჩიოთ მინიმუმ 1 ბილეთი (ზრდასრული ან ბავშვი) გასაგრძელებლად.'
          : 'Please select at least 1 ticket (Adult or Child) to proceed.'
      );
      return;
    }

    if (!form.customer_name.trim() || !form.customer_email.trim() || !form.customer_phone.trim()) {
      setError(
        language === 'ka'
          ? 'გთხოვთ შეავსოთ საკონტაქტო მონაცემები (სახელი, ელ.ფოსტა, ტელეფონი).'
          : 'Please fill in all contact details.'
      );
      return;
    }

    if (!isAuthenticated) {
      setError(
        language === 'ka'
          ? 'შეკვეთის გასაფორმებლად გთხოვთ გაიაროთ ავტორიზაცია ქვემოთ მოცემული ფორმით.'
          : 'Please sign in to complete your booking.'
      );
      return;
    }

    setLoading(true);

    try {
      const selectedAddOnObjects = selectedAddOns.map((id) => {
        const item = ADD_ONS_CATALOG.find((a) => a.id === id);
        return { id, title: item?.title, price: item?.price };
      });

      const orderPayload = {
        ...form,
        booking_type: bookingMode,
        event_date: formattedEventDate,
        event_id: form.event,
        event_name: activityTitle,
        adults_count: tickets.adults,
        children_count: tickets.children,
        infants_count: tickets.infants,
        people_count: bookingMode === 'rental' ? 1 : totalPeopleCount,
        slot_time: bookingMode === 'activity' ? selectedSlot : null,
        pickup_date: bookingMode === 'rental' ? rentalData.pickupDate : null,
        dropoff_date: bookingMode === 'rental' ? rentalData.dropoffDate : null,
        pickup_time: bookingMode === 'rental' ? rentalData.pickupTime : null,
        dropoff_time: bookingMode === 'rental' ? rentalData.dropoffTime : null,
        pickup_location: bookingMode === 'rental' ? rentalData.pickupLocation : null,
        dropoff_location: bookingMode === 'rental' ? rentalData.dropoffLocation : null,
        days_count: bookingMode === 'rental' ? rentalDaysCount : 1,
        driver_license: bookingMode === 'rental' ? rentalData.driverLicense : null,
        add_ons: selectedAddOnObjects,
        total_price: totalAmount,
        total_amount: totalAmount,
        payment_method: 'card',
      };

      const orderResponse = await orderApiService.createOrder(orderPayload);
      const generatedOrderNumber = orderResponse.order_number || orderResponse.id;

      if (!generatedOrderNumber) {
        throw new Error('Order number not received from server.');
      }

      setOrderNumber(generatedOrderNumber);
      try {
        localStorage.setItem('lastOrderNumber', String(generatedOrderNumber));
      } catch (_) {}

      // Redirect immediately to Bank of Georgia checkout
      setRedirectingBOG(true);
      try {
        const paymentResponse = await orderApiService.initiatePayment(generatedOrderNumber, 'card');
        const targetUrl =
          paymentResponse?.payment_url || paymentResponse?._links?.redirect?.href || paymentResponse?.redirect_url;

        if (targetUrl) {
          console.log('Redirecting to BOG checkout:', targetUrl);
          window.location.href = targetUrl;
          return;
        } else {
          throw new Error('გადახდის ბმული ვერ მივიღეთ სერვერისგან.');
        }
      } catch (paymentErr) {
        console.warn('BOG initiation issue:', paymentErr);
        setRedirectingBOG(false);
        setError(paymentErr.message || 'საქართველოს ბანკთან დაკავშირება ვერ მოხერხდა. სცადეთ ხელახლა.');
      }
    } catch (err) {
      console.error('Order creation error:', err);
      setRedirectingBOG(false);
      setError(err.message || 'დაფიქსირდა შეცდომა შეკვეთის გაფორმებისას.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f8fafc',
        py: { xs: 3, md: 5 },
        px: { xs: 2, sm: 3, md: 5 },
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Navigation Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
            mb: 4,
          }}
        >
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            sx={{
              color: '#475569',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              borderRadius: 3,
              px: 2,
              '&:hover': { bgcolor: 'rgba(0,0,0,0.04)', color: BRAND_COLOR },
            }}
          >
            {language === 'ka' ? 'უკან დაბრუნება' : 'Back to Experience'}
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Chip
              icon={<Shield sx={{ color: '#16a34a !important', fontSize: 18 }} />}
              label={language === 'ka' ? 'დაცული დაჯავშნა • 256-Bit SSL' : 'Secure Booking • 256-Bit SSL'}
              sx={{
                bgcolor: '#ecfdf5',
                color: '#065f46',
                fontWeight: 600,
                fontSize: '0.85rem',
                border: '1px solid #a7f3d0',
                py: 0.5,
              }}
            />
          </Box>
        </Box>

        {/* Page Title & Booking Mode Toggle */}
        <Box sx={{ mb: 4 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'flex-start', md: 'center' },
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Box>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 800,
                  color: '#0f172a',
                  letterSpacing: '-0.5px',
                  fontSize: { xs: '1.6rem', sm: '2.1rem' },
                }}
              >
                {bookingMode === 'rental'
                  ? language === 'ka'
                    ? 'მანქანის / დღიური დაჯავშნა და ქირაობა'
                    : 'Vehicle Rental & Booking'
                  : language === 'ka'
                  ? 'აქტივობის დაჯავშნა და გადახდა'
                  : 'Experience Booking & Checkout'}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                {language === 'ka'
                  ? 'დაჯავშნეთ მომენტალურად ოფიციალური გარანტიითა და დაზღვევით'
                  : 'Book instantly with full insurance and official guarantee'}
              </Typography>
            </Box>

            {/* Booking Type Switcher (Activity vs Rental) */}
            <Paper
              elevation={0}
              sx={{
                p: 0.5,
                borderRadius: 3.5,
                bgcolor: '#ffffff',
                border: '1.5px solid #e2e8f0',
                display: 'inline-flex',
              }}
            >
              <Button
                variant={bookingMode === 'activity' ? 'contained' : 'text'}
                onClick={() => setBookingMode('activity')}
                startIcon={<LocalActivity />}
                sx={{
                  borderRadius: 3,
                  px: 2.2,
                  py: 1,
                  fontWeight: 700,
                  textTransform: 'none',
                  bgcolor: bookingMode === 'activity' ? BRAND_COLOR : 'transparent',
                  color: bookingMode === 'activity' ? '#ffffff' : '#64748b',
                  '&:hover': {
                    bgcolor: bookingMode === 'activity' ? BRAND_HOVER : '#f1f5f9',
                  },
                }}
              >
                {language === 'ka' ? 'აქტივობა / ტური' : 'Activity / Tour'}
              </Button>
              <Button
                variant={bookingMode === 'rental' ? 'contained' : 'text'}
                onClick={() => setBookingMode('rental')}
                startIcon={<DirectionsCar />}
                sx={{
                  borderRadius: 3,
                  px: 2.2,
                  py: 1,
                  fontWeight: 700,
                  textTransform: 'none',
                  bgcolor: bookingMode === 'rental' ? BRAND_COLOR : 'transparent',
                  color: bookingMode === 'rental' ? '#ffffff' : '#64748b',
                  '&:hover': {
                    bgcolor: bookingMode === 'rental' ? BRAND_HOVER : '#f1f5f9',
                  },
                }}
              >
                {language === 'ka' ? 'მანქანის ქირაობა (Rental)' : 'Car Rental'}
              </Button>
            </Paper>
          </Box>
        </Box>

        {/* BOG Loading Overlay */}
        {redirectingBOG && (
          <Paper
            elevation={4}
            sx={{
              p: 4,
              mb: 4,
              borderRadius: 4,
              bgcolor: '#ffffff',
              border: `2px solid ${BRAND_COLOR}`,
              textAlign: 'center',
            }}
          >
            <CircularProgress sx={{ color: BRAND_COLOR, mb: 2 }} size={48} thickness={4} />
            <Typography variant="h6" fontWeight={700} color={BRAND_COLOR} gutterBottom>
              {language === 'ka'
                ? 'მიმდინარეობს საქართველოს ბანკის დაცულ გვერდზე გადამისამართება...'
                : 'Redirecting to Bank of Georgia Secure Gateway...'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {language === 'ka'
                ? 'გთხოვთ დაელოდოთ, თქვენი ტრანზაქცია სრულდება საქართველოს ბანკის დაცულ სერვერზე.'
                : 'Please wait while we connect you to the official Bank of Georgia checkout.'}
            </Typography>
          </Paper>
        )}

        {/* Main 2-Column Content */}
        <Grid container spacing={3.5}>
          {/* LEFT COLUMN: Booking Form */}
          <Grid item xs={12} md={7} lg={7.5}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* SECTION 1: Booking Details & Calendar / Dates */}
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
                  bgcolor: '#ffffff',
                  p: { xs: 2, sm: 3 },
                }}
              >
                <Typography variant="h6" fontWeight={800} color="#0f172a" sx={{ mb: 2 }}>
                  {bookingMode === 'rental'
                    ? language === 'ka'
                      ? '1. გატანისა და დაბრუნების პარამეტრები'
                      : '1. Pick-up & Return Details'
                    : language === 'ka'
                    ? '1. თარიღის, დროისა და ასაკობრივი ტარიფის არჩევა'
                    : '1. Date, Time & Age Pricing'}
                </Typography>

                {/* Event Mini Card */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 2,
                    p: 2,
                    borderRadius: 3,
                    bgcolor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    mb: 3,
                  }}
                >
                  <Box
                    component="img"
                    src={eventImageUrl}
                    alt={activityTitle}
                    sx={{
                      width: { xs: '100%', sm: 110 },
                      height: { xs: 150, sm: 110 },
                      borderRadius: 2.5,
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0.8 }}>
                    <Typography variant="h6" fontWeight={800} color="#0f172a" sx={{ lineHeight: 1.3 }}>
                      {activityTitle}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        icon={<LocationOn sx={{ fontSize: 16, color: `${BRAND_COLOR} !important` }} />}
                        label={activityLocation}
                        size="small"
                        sx={{ bgcolor: '#ffffff', fontWeight: 600, border: '1px solid #e2e8f0' }}
                      />
                      <Chip
                        icon={<AccessTime sx={{ fontSize: 16, color: '#0284c7 !important' }} />}
                        label={
                          bookingMode === 'rental'
                            ? `${rentalDaysCount} ${language === 'ka' ? 'დღე' : 'day(s)'}`
                            : activityDuration
                        }
                        size="small"
                        sx={{ bgcolor: '#ffffff', fontWeight: 600, border: '1px solid #e2e8f0' }}
                      />
                      <Chip
                        icon={<ConfirmationNumber sx={{ fontSize: 16, color: '#16a34a !important' }} />}
                        label={
                          bookingMode === 'rental'
                            ? language === 'ka'
                              ? 'მყისიერი დაჯავშნა'
                              : 'Instant Booking'
                            : language === 'ka'
                            ? 'მომენტალური QR ბილეთი'
                            : 'Instant Ticket'
                        }
                        size="small"
                        sx={{ bgcolor: '#ffffff', fontWeight: 600, border: '1px solid #e2e8f0' }}
                      />
                    </Box>
                  </Box>
                </Box>

                {/* ── MODE A: ACTIVITY INTERACTIVE CALENDAR ── */}
                {bookingMode === 'activity' && (
                  <Box sx={{ mb: 3 }}>
                    {/* View Tabs */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                      <Tabs
                        value={calendarView}
                        onChange={(e, v) => setCalendarView(v)}
                        sx={{
                          '& .MuiTabs-indicator': { bgcolor: BRAND_COLOR, height: 3 },
                          '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            color: '#64748b',
                            '&.Mui-selected': { color: BRAND_COLOR },
                          },
                        }}
                      >
                        <Tab label={language === 'ka' ? 'თვე (Month)' : 'Month'} />
                        <Tab label={language === 'ka' ? 'კვირა (Week)' : 'Week'} />
                        <Tab label={language === 'ka' ? 'დღე / საათები (Day)' : 'Day'} />
                      </Tabs>
                    </Box>

                    {/* Month Nav */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 2,
                        py: 1,
                        mb: 1.5,
                      }}
                    >
                      <IconButton size="small" onClick={handlePrevMonth}>
                        <ChevronLeft />
                      </IconButton>
                      <Typography variant="h6" fontWeight={800} color="#0f172a">
                        {MONTHS_ENGLISH[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                      </Typography>
                      <IconButton size="small" onClick={handleNextMonth}>
                        <ChevronRight />
                      </IconButton>
                    </Box>

                    {/* Month View (Screenshot 1) */}
                    {calendarView === 0 && (
                      <Box
                        sx={{
                          border: `2px solid ${BRAND_COLOR}`,
                          borderRadius: 2,
                          overflow: 'hidden',
                          bgcolor: '#ffffff',
                        }}
                      >
                        <Box sx={{ textAlign: 'center', py: 1.5, borderBottom: `1px solid ${BRAND_COLOR}` }}>
                          <Typography
                            variant="h5"
                            fontWeight={800}
                            sx={{ color: BRAND_COLOR, letterSpacing: '0.08em', textTransform: 'uppercase' }}
                          >
                            {MONTHS_ENGLISH[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, 1fr)',
                            bgcolor: BRAND_COLOR,
                            color: '#ffffff',
                            textAlign: 'center',
                            py: 0.8,
                          }}
                        >
                          {DAYS_LONG.map((day) => (
                            <Typography key={day} variant="caption" fontWeight={600} sx={{ textTransform: 'lowercase' }}>
                              {day}
                            </Typography>
                          ))}
                        </Box>

                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, 1fr)',
                            gridAutoRows: { xs: '65px', sm: '85px' },
                          }}
                        >
                          {monthGridCells.map((cell) => {
                            if (cell.empty) {
                              return (
                                <Box
                                  key={cell.key}
                                  sx={{
                                    borderRight: '1px solid #e2e8f0',
                                    borderBottom: '1px solid #e2e8f0',
                                    bgcolor: '#f8fafc',
                                  }}
                                />
                              );
                            }

                            return (
                              <Box
                                key={cell.key}
                                onClick={() => !cell.isPast && handleDateClick(cell.date)}
                                sx={{
                                  position: 'relative',
                                  p: 1,
                                  borderRight: '1px solid #e2e8f0',
                                  borderBottom: '1px solid #e2e8f0',
                                  bgcolor: cell.isSelected
                                    ? 'rgba(135, 0, 58, 0.08)'
                                    : cell.isToday
                                    ? 'rgba(135, 0, 58, 0.04)'
                                    : cell.isPast
                                    ? '#f8fafc'
                                    : '#ffffff',
                                  cursor: cell.isPast ? 'not-allowed' : 'pointer',
                                  outline: cell.isSelected
                                    ? `2px solid ${BRAND_COLOR}`
                                    : cell.isToday
                                    ? `1.5px dashed ${BRAND_COLOR}`
                                    : 'none',
                                  outlineOffset: '-2px',
                                  transition: 'all 0.15s ease',
                                  '&:hover': !cell.isPast ? { bgcolor: 'rgba(135, 0, 58, 0.05)' } : {},
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontSize: { xs: '0.85rem', sm: '1rem' },
                                    fontWeight: cell.isSelected || cell.isToday ? 800 : 500,
                                    color: cell.isPast ? '#cbd5e1' : cell.isSelected ? BRAND_COLOR : '#0f172a',
                                  }}
                                >
                                  {cell.dayNum}
                                </Typography>

                                {!cell.isPast && (
                                  <Box sx={{ position: 'absolute', bottom: 4, right: 4 }}>
                                    <FiberManualRecord sx={{ fontSize: 10, color: SUCCESS_COLOR }} />
                                  </Box>
                                )}
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    )}

                    {/* Week View */}
                    {calendarView === 1 && (
                      <Box
                        sx={{
                          border: `2px solid ${BRAND_COLOR}`,
                          borderRadius: 2,
                          overflow: 'hidden',
                          bgcolor: '#ffffff',
                        }}
                      >
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, 1fr)',
                            bgcolor: BRAND_COLOR,
                            color: '#ffffff',
                            textAlign: 'center',
                            py: 0.8,
                          }}
                        >
                          {DAYS_LONG.map((day) => (
                            <Typography key={day} variant="caption" fontWeight={600} sx={{ textTransform: 'lowercase' }}>
                              {day}
                            </Typography>
                          ))}
                        </Box>

                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, 1fr)',
                            minHeight: 120,
                          }}
                        >
                          {weekDays.map((d, idx) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const isPast = d < today;
                            const isSelected =
                              d.getFullYear() === selectedDate.getFullYear() &&
                              d.getMonth() === selectedDate.getMonth() &&
                              d.getDate() === selectedDate.getDate();

                            return (
                              <Box
                                key={idx}
                                onClick={() => !isPast && handleDateClick(d)}
                                sx={{
                                  p: 1.5,
                                  textAlign: 'center',
                                  borderRight: idx === 6 ? 'none' : '1px solid #e2e8f0',
                                  bgcolor: isSelected ? 'rgba(135,0,58,0.08)' : isPast ? '#f8fafc' : '#ffffff',
                                  cursor: isPast ? 'not-allowed' : 'pointer',
                                }}
                              >
                                <Typography
                                  variant="h6"
                                  fontWeight={isSelected ? 800 : 600}
                                  color={isSelected ? BRAND_COLOR : isPast ? '#cbd5e1' : '#0f172a'}
                                >
                                  {d.getDate()}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {MONTHS_ENGLISH[d.getMonth()].slice(0, 3)}
                                </Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    )}

                    {/* Day View with Upcoming Hours (Screenshot 2) */}
                    {calendarView === 2 && (
                      <Box
                        sx={{
                          border: `2px solid ${BRAND_COLOR}`,
                          borderRadius: 2,
                          overflow: 'hidden',
                          bgcolor: '#ffffff',
                        }}
                      >
                        <Box sx={{ bgcolor: BRAND_COLOR, color: '#ffffff', textAlign: 'center', py: 1 }}>
                          <Typography variant="subtitle2" fontWeight={600} sx={{ textTransform: 'lowercase' }}>
                            {DAYS_LONG[dayCursor.getDay()]}
                          </Typography>
                        </Box>

                        <Box sx={{ textAlign: 'center', py: 2.5, borderBottom: `1px solid ${BRAND_COLOR}` }}>
                          <Typography
                            variant="h2"
                            fontWeight={800}
                            sx={{ color: BRAND_COLOR, lineHeight: 1, letterSpacing: '-1px' }}
                          >
                            {dayCursor.getDate()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {MONTHS_ENGLISH[dayCursor.getMonth()]} {dayCursor.getFullYear()}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Chip
                              label={language === 'ka' ? 'ხელმისაწვდომია' : 'Available'}
                              size="small"
                              sx={{ bgcolor: SUCCESS_COLOR, color: '#ffffff', fontWeight: 700 }}
                            />
                          </Box>
                        </Box>

                        <Box sx={{ p: 2.5 }}>
                          <Typography
                            variant="caption"
                            fontWeight={800}
                            color="#64748b"
                            sx={{ letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', mb: 2 }}
                          >
                            {language === 'ka' ? 'სამუშაო საათები & ტარიფები' : 'UPCOMING HOURS & RATES'}
                          </Typography>

                          <Grid container spacing={1.5}>
                            {availableHours.map((slot) => {
                              const pricing = getSlotPricing(slot);
                              const isSelected = selectedSlot === slot;

                              return (
                                <Grid item xs={6} sm={4} key={slot}>
                                  <Paper
                                    elevation={0}
                                    onClick={() => setSelectedSlot(slot)}
                                    sx={{
                                      p: 1.5,
                                      borderRadius: 3,
                                      cursor: 'pointer',
                                      textAlign: 'center',
                                      border: '2px solid',
                                      borderColor: isSelected ? BRAND_COLOR : '#e2e8f0',
                                      bgcolor: isSelected
                                        ? 'rgba(135, 0, 58, 0.06)'
                                        : pricing.isPeak
                                        ? '#fffbeb'
                                        : '#f8fafc',
                                      transition: 'all 0.2s ease',
                                      '&:hover': { borderColor: BRAND_COLOR },
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.8 }}>
                                      {pricing.isPeak ? (
                                        <WbSunny sx={{ fontSize: 16, color: '#f59e0b' }} />
                                      ) : (
                                        <AccessTime sx={{ fontSize: 16, color: '#64748b' }} />
                                      )}
                                      <Typography variant="body1" fontWeight={800} color="#0f172a">
                                        {slot}
                                      </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 0.8 }}>
                                      <Chip
                                        label="Open"
                                        size="small"
                                        sx={{
                                          height: 18,
                                          fontSize: '0.65rem',
                                          bgcolor: SUCCESS_COLOR,
                                          color: '#ffffff',
                                          fontWeight: 700,
                                        }}
                                      />
                                      <Typography variant="caption" fontWeight={700} color={BRAND_COLOR}>
                                        {pricing.adult} ₾
                                      </Typography>
                                    </Box>

                                    {pricing.isPeak && (
                                      <Typography
                                        variant="caption"
                                        sx={{ fontSize: '0.65rem', color: '#b45309', fontWeight: 600, display: 'block', mt: 0.4 }}
                                      >
                                        {pricing.label}
                                      </Typography>
                                    )}
                                  </Paper>
                                </Grid>
                              );
                            })}
                          </Grid>

                          <Box sx={{ mt: 2.5, textAlign: 'center' }}>
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => setCalendarView(0)}
                              sx={{ color: BRAND_COLOR, fontWeight: 700, textTransform: 'none' }}
                            >
                              ← {language === 'ka' ? 'კალენდარზე დაბრუნება (Month View)' : 'Back to Calendar View'}
                            </Button>
                          </Box>
                        </Box>
                      </Box>
                    )}

                    {/* Legend */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        gap: 2.5,
                        mt: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <FiberManualRecord sx={{ fontSize: 14, color: SUCCESS_COLOR }} />
                        <Typography variant="caption" color="text.secondary">
                          {language === 'ka' ? 'ხელმისაწვდომი (Available)' : 'Available'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <FiberManualRecord sx={{ fontSize: 14, color: '#ef4444' }} />
                        <Typography variant="caption" color="text.secondary">
                          {language === 'ka' ? 'დაჯავშნილი (Booked)' : 'Booked'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <FiberManualRecord sx={{ fontSize: 14, color: BRAND_COLOR }} />
                        <Typography variant="caption" color="text.secondary">
                          {language === 'ka' ? 'არჩეული (Selected)' : 'Selected'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <FiberManualRecord sx={{ fontSize: 14, color: '#f59e0b' }} />
                        <Typography variant="caption" color="text.secondary">
                          {language === 'ka' ? 'დღევანდელი (Today)' : 'Today'}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Dynamic Age Group Ticket Counters */}
                    <Divider sx={{ my: 3 }} />

                    <Box>
                      <Typography variant="h6" fontWeight={800} color="#0f172a" sx={{ mb: 1 }}>
                        {language === 'ka' ? 'ბილეთების რაოდენობა და ასაკობრივი კატეგორიები' : 'Age Categories & Tickets'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {language === 'ka'
                          ? `არჩეული სესია: ${selectedSlot} • ტარიფი დამოკიდებულია ასაკსა და დროზე`
                          : `Selected session: ${selectedSlot} • Dynamic rate applied per age category`}
                      </Typography>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {/* Adults */}
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: 3,
                            border: '1.5px solid #e2e8f0',
                            bgcolor: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ bgcolor: 'rgba(135,0,58,0.1)', color: BRAND_COLOR, width: 40, height: 40 }}>
                              <Person />
                            </Avatar>
                            <Box>
                              <Typography variant="body1" fontWeight={700} color="#0f172a">
                                {language === 'ka' ? 'ზრდასრული (18+)' : 'Adult (18+)'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {currentSlotPricing.adult} ₾ / {language === 'ka' ? 'ბილეთი' : 'ticket'}
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleTicketChange('adults', -1)}
                              disabled={tickets.adults <= 0}
                              sx={{ border: '1px solid #cbd5e1', width: 32, height: 32 }}
                            >
                              <Remove fontSize="small" />
                            </IconButton>
                            <Typography sx={{ minWidth: 26, textAlign: 'center', fontWeight: 800 }}>
                              {tickets.adults}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleTicketChange('adults', 1)}
                              disabled={tickets.adults >= 20}
                              sx={{ border: '1px solid #cbd5e1', width: 32, height: 32 }}
                            >
                              <Add fontSize="small" />
                            </IconButton>
                          </Box>
                        </Paper>

                        {/* Children */}
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: 3,
                            border: '1.5px solid #e2e8f0',
                            bgcolor: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ bgcolor: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', width: 40, height: 40 }}>
                              <ChildCare />
                            </Avatar>
                            <Box>
                              <Typography variant="body1" fontWeight={700} color="#0f172a">
                                {language === 'ka' ? 'ბავშვი / მოზარდი (6 - 17)' : 'Child (6 - 17)'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {currentSlotPricing.child} ₾ / {language === 'ka' ? 'ბილეთი' : 'ticket'}
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleTicketChange('children', -1)}
                              disabled={tickets.children <= 0}
                              sx={{ border: '1px solid #cbd5e1', width: 32, height: 32 }}
                            >
                              <Remove fontSize="small" />
                            </IconButton>
                            <Typography sx={{ minWidth: 26, textAlign: 'center', fontWeight: 800 }}>
                              {tickets.children}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleTicketChange('children', 1)}
                              disabled={tickets.children >= 20}
                              sx={{ border: '1px solid #cbd5e1', width: 32, height: 32 }}
                            >
                              <Add fontSize="small" />
                            </IconButton>
                          </Box>
                        </Paper>

                        {/* Infant */}
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: 3,
                            border: '1.5px solid #e2e8f0',
                            bgcolor: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ bgcolor: 'rgba(22, 163, 74, 0.1)', color: SUCCESS_COLOR, width: 40, height: 40 }}>
                              <Elderly />
                            </Avatar>
                            <Box>
                              <Typography variant="body1" fontWeight={700} color="#0f172a">
                                {language === 'ka' ? 'ჩვილი (0 - 5)' : 'Infant (0 - 5)'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: SUCCESS_COLOR, fontWeight: 700 }}>
                                {currentSlotPricing.infant === 0
                                  ? language === 'ka'
                                    ? 'უფასო (0 ₾)'
                                    : 'Free'
                                  : `${currentSlotPricing.infant} ₾`}
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleTicketChange('infants', -1)}
                              disabled={tickets.infants <= 0}
                              sx={{ border: '1px solid #cbd5e1', width: 32, height: 32 }}
                            >
                              <Remove fontSize="small" />
                            </IconButton>
                            <Typography sx={{ minWidth: 26, textAlign: 'center', fontWeight: 800 }}>
                              {tickets.infants}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleTicketChange('infants', 1)}
                              disabled={tickets.infants >= 10}
                              sx={{ border: '1px solid #cbd5e1', width: 32, height: 32 }}
                            >
                              <Add fontSize="small" />
                            </IconButton>
                          </Box>
                        </Paper>
                      </Box>

                      {/* Zero tickets alert */}
                      {(tickets.adults + tickets.children) === 0 && (
                        <Alert severity="warning" sx={{ mt: 2, borderRadius: 2.5, fontWeight: 600 }}>
                          {language === 'ka'
                            ? '⚠️ ბილეთების რაოდენობა არის 0. გადახდის გასაგრძელებლად გთხოვთ აირჩიოთ მინიმუმ 1 ბილეთი.'
                            : '⚠️ Tickets count is 0. Please select at least 1 ticket to proceed with checkout.'}
                        </Alert>
                      )}
                    </Box>
                  </Box>
                )}

                {/* ── MODE B: VEHICLE / CAR RENTAL MULTI-DAY BOOKING ── */}
                {bookingMode === 'rental' && (
                  <Box sx={{ mb: 2 }}>
                    <Grid container spacing={2.5}>
                      {/* Pick-up Date & Time */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label={language === 'ka' ? 'გატანის თარიღი (Pick-up Date)' : 'Pick-up Date'}
                          name="pickupDate"
                          type="date"
                          value={rentalData.pickupDate}
                          onChange={handleRentalChange}
                          required
                          InputLabelProps={{ shrink: true }}
                          inputProps={{ min: new Date().toISOString().split('T')[0] }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <CalendarToday fontSize="small" sx={{ color: BRAND_COLOR }} />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label={language === 'ka' ? 'გატანის დრო (Pick-up Time)' : 'Pick-up Time'}
                          name="pickupTime"
                          type="time"
                          value={rentalData.pickupTime}
                          onChange={handleRentalChange}
                          required
                          InputLabelProps={{ shrink: true }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <AccessTime fontSize="small" sx={{ color: BRAND_COLOR }} />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>

                      {/* Drop-off Date & Time */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label={language === 'ka' ? 'დაბრუნების თარიღი (Drop-off Date)' : 'Drop-off Date'}
                          name="dropoffDate"
                          type="date"
                          value={rentalData.dropoffDate}
                          onChange={handleRentalChange}
                          required
                          InputLabelProps={{ shrink: true }}
                          inputProps={{ min: rentalData.pickupDate }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <CalendarToday fontSize="small" sx={{ color: '#0284c7' }} />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label={language === 'ka' ? 'დაბრუნების დრო (Drop-off Time)' : 'Drop-off Time'}
                          name="dropoffTime"
                          type="time"
                          value={rentalData.dropoffTime}
                          onChange={handleRentalChange}
                          required
                          InputLabelProps={{ shrink: true }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <AccessTime fontSize="small" sx={{ color: '#0284c7' }} />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>

                      {/* Pick-up / Drop-off Location */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          select
                          label={language === 'ka' ? 'მიღების ლოკაცია' : 'Pick-up Location'}
                          name="pickupLocation"
                          value={rentalData.pickupLocation}
                          onChange={handleRentalChange}
                        >
                          {AVAILABLE_LOCATIONS.map((loc) => (
                            <MenuItem key={loc.id} value={loc.id}>
                              {loc.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          select
                          label={language === 'ka' ? 'დაბრუნების ლოკაცია' : 'Drop-off Location'}
                          name="dropoffLocation"
                          value={rentalData.dropoffLocation}
                          onChange={handleRentalChange}
                        >
                          {AVAILABLE_LOCATIONS.map((loc) => (
                            <MenuItem key={loc.id} value={loc.id}>
                              {loc.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>

                      {/* Driver's License & Experience */}
                      <Grid item xs={12} sm={8}>
                        <TextField
                          fullWidth
                          label={language === 'ka' ? 'მართვის მოწმობის ან პირადი ნომერი' : 'Driver License / ID Number'}
                          name="driverLicense"
                          value={rentalData.driverLicense}
                          onChange={handleRentalChange}
                          placeholder="AA123456"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Badge fontSize="small" sx={{ color: '#64748b' }} />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label={language === 'ka' ? 'გამოცდილება (წელი)' : 'Experience (Years)'}
                          name="drivingExperienceYears"
                          type="number"
                          value={rentalData.drivingExperienceYears}
                          onChange={handleRentalChange}
                        />
                      </Grid>
                    </Grid>

                    {/* Calculated Days & Rate Highlight */}
                    <Paper
                      elevation={0}
                      sx={{
                        mt: 2.5,
                        p: 2,
                        borderRadius: 3,
                        bgcolor: 'rgba(135,0,58,0.04)',
                        border: `1.5px solid ${BRAND_COLOR}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <DirectionsCar sx={{ color: BRAND_COLOR }} />
                        <Box>
                          <Typography variant="body1" fontWeight={800} color="#0f172a">
                            {language === 'ka' ? 'ქირაობის ხანგრძლივობა:' : 'Rental Duration:'}{' '}
                            <span style={{ color: BRAND_COLOR }}>{rentalDaysCount} {language === 'ka' ? 'დღე' : 'day(s)'}</span>
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {dailyRate} ₾ / {language === 'ka' ? 'დღეში' : 'day'}
                          </Typography>
                        </Box>
                      </Box>

                      <Typography variant="h6" fontWeight={800} color={BRAND_COLOR}>
                        {dailyRate * rentalDaysCount} ₾
                      </Typography>
                    </Paper>
                  </Box>
                )}
              </Card>

              {/* SECTION 2: Add-ons & Extras (დამატებითი სერვისები) */}
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3.5,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
                  bgcolor: '#ffffff',
                  p: { xs: 2, sm: 2.5 },
                }}
              >
                <Typography variant="subtitle1" fontWeight={800} color="#0f172a" sx={{ mb: 1.5 }}>
                  {language === 'ka' ? '2. დამატებითი აღჭურვილობა' : '2. Add-ons & Equipment'}
                </Typography>

                <Grid container spacing={1}>
                  {ADD_ONS_CATALOG.map((addOn) => {
                    const isSelected = selectedAddOns.includes(addOn.id);
                    const calculatedPrice =
                      bookingMode === 'rental' && addOn.perDay ? addOn.price * rentalDaysCount : addOn.price;

                    return (
                      <Grid item xs={12} sm={6} key={addOn.id}>
                        <Paper
                          elevation={0}
                          onClick={() => toggleAddOn(addOn.id)}
                          sx={{
                            py: 1,
                            px: 1.5,
                            borderRadius: 2.5,
                            cursor: 'pointer',
                            border: '1.5px solid',
                            borderColor: isSelected ? BRAND_COLOR : '#e2e8f0',
                            bgcolor: isSelected ? 'rgba(135,0,58,0.04)' : '#ffffff',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1,
                            '&:hover': { borderColor: BRAND_COLOR },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                            <Checkbox
                              size="small"
                              checked={isSelected}
                              sx={{
                                color: '#cbd5e1',
                                '&.Mui-checked': { color: BRAND_COLOR },
                                p: 0,
                              }}
                            />
                            <Avatar sx={{ bgcolor: '#f8fafc', width: 28, height: 28, flexShrink: 0 }}>
                              {addOn.icon}
                            </Avatar>
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              color="#0f172a"
                              sx={{
                                fontSize: '0.85rem',
                                lineHeight: 1.25,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {language === 'ka' ? addOn.title : addOn.titleEn || addOn.title}
                            </Typography>
                          </Box>

                          <Chip
                            label={`+${calculatedPrice} ₾`}
                            size="small"
                            sx={{
                              height: 24,
                              fontWeight: 800,
                              fontSize: '0.76rem',
                              flexShrink: 0,
                              bgcolor: isSelected ? BRAND_COLOR : '#f1f5f9',
                              color: isSelected ? '#ffffff' : '#334155',
                            }}
                          />
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </Card>

              {/* SECTION 3: Guest & Contact Information */}
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
                  bgcolor: '#ffffff',
                  p: { xs: 2.5, sm: 3 },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" fontWeight={800} color="#0f172a">
                    {language === 'ka' ? '3. საკონტაქტო ინფორმაცია' : '3. Contact Information'}
                  </Typography>
                  {isAuthenticated && (
                    <Chip
                      icon={<Check sx={{ color: '#16a34a !important', fontSize: 16 }} />}
                      label={language === 'ka' ? 'ავტორიზებული ხართ' : 'Logged in'}
                      size="small"
                      sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 600 }}
                    />
                  )}
                </Box>

                {!isAuthenticated && (
                  <Box sx={{ mb: 3 }}>
                    <Alert severity="info" sx={{ mb: 2.5, borderRadius: 3 }}>
                      {language === 'ka'
                        ? 'შეკვეთის გასაფორმებლად გაიარეთ სწრაფი ავტორიზაცია ან რეგისტრაცია.'
                        : 'Sign in or register below to link tickets to your account.'}
                    </Alert>
                    <CheckoutAuth
                      onAuthSuccess={() => {
                        console.log('User signed in on checkout');
                      }}
                    />
                  </Box>
                )}

                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={language === 'ka' ? 'სახელი და გვარი' : 'Full Name'}
                      name="customer_name"
                      value={form.customer_name}
                      onChange={handleChange}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Person fontSize="small" sx={{ color: '#94a3b8' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={language === 'ka' ? 'ელ.ფოსტა' : 'Email Address'}
                      name="customer_email"
                      type="email"
                      value={form.customer_email}
                      onChange={handleChange}
                      required
                      helperText={
                        language === 'ka'
                          ? '🎟️ დაჯავშნის ვაუჩერი გამოიგზავნება ამ ელფოსტაზე'
                          : '🎟️ Voucher & confirmation will be sent here'
                      }
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email fontSize="small" sx={{ color: '#94a3b8' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={language === 'ka' ? 'ტელეფონის ნომერი' : 'Phone Number'}
                      name="customer_phone"
                      value={form.customer_phone}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          customer_phone: e.target.value.replace(/\D/g, ''),
                        }))
                      }
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Phone fontSize="small" sx={{ color: '#94a3b8' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={language === 'ka' ? 'დამატებითი მოთხოვნა / შენიშვნა' : 'Special Notes / Request'}
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <NoteAlt fontSize="small" sx={{ color: '#94a3b8' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
              </Card>

              {/* SECTION 4: Payment Method (DEBIT / CREDIT CARD ONLY) */}
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
                  bgcolor: '#ffffff',
                  p: { xs: 2.5, sm: 3 },
                }}
              >
                <Typography variant="h6" fontWeight={800} color="#0f172a" sx={{ mb: 2 }}>
                  {language === 'ka' ? '4. გადახდის მეთოდი' : '4. Payment Method'}
                </Typography>

                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    border: '2px solid',
                    borderColor: BRAND_COLOR,
                    bgcolor: 'rgba(135, 0, 58, 0.03)',
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    justifyContent: 'space-between',
                    gap: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: BRAND_COLOR,
                        width: 48,
                        height: 48,
                        color: '#fff',
                      }}
                    >
                      <CreditCard sx={{ fontSize: 26 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight={800} color="#0f172a">
                        {language === 'ka' ? 'საბანკო ბარათი (Visa / Mastercard)' : 'Debit / Credit Card (Visa / Mastercard)'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {language === 'ka'
                          ? 'საქართველოს ბანკის დაცული გადახდის სისტემა • 3D Secure'
                          : 'Bank of Georgia Secure Payment Gateway • 3D Secure'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <FaCcVisa size={32} color="#1A1F71" />
                    <FaCcMastercard size={32} color="#EB001B" />
                    <Chip
                      label="BOG 3D Secure"
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        bgcolor: BRAND_COLOR,
                        color: '#ffffff',
                      }}
                    />
                  </Box>
                </Paper>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mt: 2, px: 0.5 }}>
                  <Shield sx={{ fontSize: 18, color: '#16a34a' }} />
                  <Typography variant="caption" color="text.secondary">
                    {language === 'ka'
                      ? 'მიიღება ნებისმიერი ქართული და საერთაშორისო ბანკის Visa და Mastercard ბარათები.'
                      : 'Accepts all Georgian and international Visa & Mastercard cards.'}
                  </Typography>
                </Box>
              </Card>

              {/* SECTION 5: Terms & Safety Agreement */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  bgcolor: termsAccepted ? '#f0fdf4' : '#ffffff',
                  border: '2px solid',
                  borderColor: termsAccepted ? '#86efac' : showTermsWarning ? '#f87171' : '#e2e8f0',
                  transition: 'all 0.25s ease',
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={termsAccepted}
                      onChange={(e) => {
                        setTermsAccepted(e.target.checked);
                        if (e.target.checked) {
                          setShowTermsWarning(false);
                          setError(null);
                        }
                      }}
                      sx={{
                        color: showTermsWarning ? '#ef4444' : '#64748b',
                        '&.Mui-checked': { color: SUCCESS_COLOR },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                      {language === 'ka'
                        ? 'წავიკითხე და ვეთანხმები '
                        : 'I have read and agree to the '}
                      <Link
                        to={getLocalizedPath('/rules')}
                        target="_blank"
                        style={{
                          color: BRAND_COLOR,
                          fontWeight: 700,
                          textDecoration: 'underline',
                        }}
                      >
                        {language === 'ka' ? 'დაჯავშნისა და გაუქმების წესებს' : 'Terms & Cancellation Policy'}
                      </Link>
                      {language === 'ka'
                        ? ' და უსაფრთხოების რეგულაციებს.'
                        : ' and safety guidelines.'}
                    </Typography>
                  }
                />

                {showTermsWarning && !termsAccepted && (
                  <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 600, display: 'block', mt: 0.5, ml: 4 }}>
                    {language === 'ka'
                      ? 'სავალდებულოა: გთხოვთ დაეთანხმოთ პირობებს დაჯავშნის დასასრულებლად.'
                      : 'Required: Please accept the terms to complete booking.'}
                  </Typography>
                )}
              </Paper>

              {/* Error Box */}
              {error && (
                <Alert severity="error" sx={{ borderRadius: 3 }}>
                  {error}
                </Alert>
              )}

              {/* MAIN PAY BUTTON */}
              <Box sx={{ mt: 1 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleProceedToPayment}
                  disabled={loading || redirectingBOG || !isAuthenticated || !hasValidTickets}
                  startIcon={
                    loading || redirectingBOG ? (
                      <CircularProgress size={22} color="inherit" />
                    ) : (
                      <Lock sx={{ fontSize: 22 }} />
                    )
                  }
                  sx={{
                    bgcolor: !hasValidTickets ? '#cbd5e1' : BRAND_COLOR,
                    color: !hasValidTickets ? '#64748b' : '#ffffff',
                    borderRadius: 3.5,
                    py: 1.8,
                    textTransform: 'none',
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    boxShadow: !hasValidTickets ? 'none' : '0 12px 28px -4px rgba(135, 0, 58, 0.45)',
                    '&:hover': { bgcolor: !hasValidTickets ? '#cbd5e1' : BRAND_HOVER },
                  }}
                >
                  {loading || redirectingBOG
                    ? language === 'ka'
                      ? 'მიმდინარეობს საქართველოს ბანკთან დაკავშირება...'
                      : 'Connecting to Bank of Georgia...'
                    : !isAuthenticated
                    ? language === 'ka'
                      ? 'საჭიროა ავტორიზაცია'
                      : 'Sign In Required'
                    : !hasValidTickets
                    ? language === 'ka'
                      ? 'აირჩიეთ მინიმუმ 1 ბილეთი (0 ბილეთი)'
                      : 'Select at least 1 ticket (0 selected)'
                    : `${language === 'ka' ? 'საქართველოს ბანკით გადახდა' : 'Pay via Bank of Georgia'} • ${totalAmount} ₾`}
                </Button>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 1.5 }}>
                  <Shield sx={{ fontSize: 16, color: '#64748b' }} />
                  <Typography variant="caption" color="text.secondary">
                    {language === 'ka'
                      ? 'ტრანზაქცია სრულდება საქართველოს ბანკის ოფიციალურ დაცულ სერვერზე'
                      : 'Transaction is processed on Bank of Georgia 3D Secure Portal'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* RIGHT COLUMN: Sticky Order Summary */}
          <Grid item xs={12} md={5} lg={4.5}>
            <Box
              sx={{
                position: { md: 'sticky' },
                top: { md: 24 },
                zIndex: 10,
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 4,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 12px 35px -4px rgba(15, 23, 42, 0.08)',
                  bgcolor: '#ffffff',
                  p: { xs: 2.5, sm: 3 },
                  overflow: 'hidden',
                }}
              >
                <Typography variant="h6" fontWeight={800} color="#0f172a" sx={{ mb: 2 }}>
                  {language === 'ka' ? 'შეკვეთის შეჯამება' : 'Order Summary'}
                </Typography>

                {/* Event mini card */}
                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    p: 1.5,
                    borderRadius: 3,
                    bgcolor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    mb: 2.5,
                  }}
                >
                  <Box
                    component="img"
                    src={eventImageUrl}
                    alt={activityTitle}
                    sx={{
                      width: 76,
                      height: 76,
                      borderRadius: 2.5,
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                  <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Typography variant="body1" fontWeight={800} color="#0f172a" noWrap title={activityTitle}>
                      {activityTitle}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <LocationOn sx={{ fontSize: 16, color: BRAND_COLOR }} />
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {activityLocation}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Booking details snapshot */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2.5 }}>
                  {bookingMode === 'activity' ? (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          {language === 'ka' ? 'თარიღი' : 'Date'}
                        </Typography>
                        <Typography variant="body2" fontWeight={700} color="#0f172a">
                          {selectedDate.getDate()} {MONTHS_ENGLISH[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          {language === 'ka' ? 'სესია / დრო' : 'Time Slot'}
                        </Typography>
                        <Typography variant="body2" fontWeight={800} color={BRAND_COLOR}>
                          {selectedSlot} {currentSlotPricing.isPeak ? `(${currentSlotPricing.label})` : ''}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          {language === 'ka' ? 'სტუმრები სულ' : 'Total Guests'}
                        </Typography>
                        <Typography variant="body2" fontWeight={700} color="#0f172a">
                          {totalPeopleCount} {language === 'ka' ? 'პერსონა' : 'guest(s)'}
                        </Typography>
                      </Box>
                    </>
                  ) : (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          {language === 'ka' ? 'გატანა (Pick-up)' : 'Pick-up'}
                        </Typography>
                        <Typography variant="body2" fontWeight={700} color="#0f172a">
                          {rentalData.pickupDate} • {rentalData.pickupTime}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          {language === 'ka' ? 'დაბრუნება (Drop-off)' : 'Drop-off'}
                        </Typography>
                        <Typography variant="body2" fontWeight={700} color="#0f172a">
                          {rentalData.dropoffDate} • {rentalData.dropoffTime}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          {language === 'ka' ? 'ხანგრძლივობა' : 'Duration'}
                        </Typography>
                        <Typography variant="body2" fontWeight={800} color={BRAND_COLOR}>
                          {rentalDaysCount} {language === 'ka' ? 'დღე' : 'day(s)'}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Price Breakdown */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, mb: 2.5 }}>
                  <Typography variant="caption" fontWeight={700} color="#64748b" sx={{ textTransform: 'uppercase' }}>
                    {language === 'ka' ? 'ფასების დეტალიზაცია' : 'Price Details'}
                  </Typography>

                  {bookingMode === 'activity' ? (
                    <>
                      {tickets.adults > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            {language === 'ka' ? 'ზრდასრული' : 'Adult'} ({currentSlotPricing.adult} ₾ × {tickets.adults})
                          </Typography>
                          <Typography variant="body2" fontWeight={700} color="#0f172a">
                            {tickets.adults * currentSlotPricing.adult} ₾
                          </Typography>
                        </Box>
                      )}

                      {tickets.children > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            {language === 'ka' ? 'ბავშვი' : 'Child'} ({currentSlotPricing.child} ₾ × {tickets.children})
                          </Typography>
                          <Typography variant="body2" fontWeight={700} color="#0f172a">
                            {tickets.children * currentSlotPricing.child} ₾
                          </Typography>
                        </Box>
                      )}

                      {tickets.infants > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            {language === 'ka' ? 'ჩვილი' : 'Infant'} ({tickets.infants})
                          </Typography>
                          <Typography variant="body2" fontWeight={700} sx={{ color: SUCCESS_COLOR }}>
                            0 ₾ (უფასო)
                          </Typography>
                        </Box>
                      )}

                      {tickets.adults === 0 && tickets.children === 0 && (
                        <Box sx={{ p: 1, bgcolor: '#fef2f2', borderRadius: 2, border: '1px dashed #fca5a5' }}>
                          <Typography variant="caption" color="error" fontWeight={700} sx={{ display: 'block', textAlign: 'center' }}>
                            {language === 'ka' ? '⚠️ ბილეთები არ არის არჩეული' : '⚠️ No tickets selected'}
                          </Typography>
                        </Box>
                      )}
                    </>
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {language === 'ka' ? 'დღიური ქირაობა' : 'Daily Rental'} ({dailyRate} ₾ × {rentalDaysCount} დღე)
                      </Typography>
                      <Typography variant="body2" fontWeight={700} color="#0f172a">
                        {dailyRate * rentalDaysCount} ₾
                      </Typography>
                    </Box>
                  )}

                  {/* Add-ons in summary */}
                  {selectedAddOns.map((addOnId) => {
                    const item = ADD_ONS_CATALOG.find((a) => a.id === addOnId);
                    if (!item) return null;
                    const itemCost =
                      bookingMode === 'rental' && item.perDay ? item.price * rentalDaysCount : item.price;

                    return (
                      <Box key={addOnId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: '75%' }}>
                          + {item.title}
                        </Typography>
                        <Typography variant="caption" fontWeight={700} color="#0f172a">
                          {itemCost} ₾
                        </Typography>
                      </Box>
                    );
                  })}

                  {hasDiscount && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: SUCCESS_COLOR, fontWeight: 600 }}>
                        {language === 'ka' ? 'ფასდაკლებით დაზოგეთ' : 'Discount savings'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: SUCCESS_COLOR, fontWeight: 700 }}>
                        -{Math.round(savings)} ₾
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {language === 'ka' ? 'სერვისის საკომისიო' : 'Service fee'}
                    </Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ color: SUCCESS_COLOR }}>
                      0 ₾ (უფასო)
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Total Price */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    mb: 3,
                  }}
                >
                  <Box>
                    <Typography variant="h6" fontWeight={800} color="#0f172a">
                      {language === 'ka' ? 'სულ გადასახდელი' : 'Total Price'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {language === 'ka' ? 'დღგ-ს ჩათვლით' : 'Includes all taxes & fees'}
                    </Typography>
                  </Box>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 900,
                      color: BRAND_COLOR,
                      letterSpacing: '-0.5px',
                    }}
                  >
                    {totalAmount} ₾
                  </Typography>
                </Box>

                {/* Trust Badges */}
                <Box
                  sx={{
                    bgcolor: '#f8fafc',
                    p: 2,
                    borderRadius: 3,
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <Shield sx={{ color: BRAND_COLOR, fontSize: 20 }} />
                    <Typography variant="caption" fontWeight={600} color="#334155">
                      {language === 'ka'
                        ? 'საქართველოს ბანკი (BOG) • 3D Secure დაცვა'
                        : 'Bank of Georgia • 3D Secure Protection'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <ConfirmationNumber sx={{ color: '#0284c7', fontSize: 20 }} />
                    <Typography variant="caption" fontWeight={600} color="#334155">
                      {bookingMode === 'rental'
                        ? language === 'ka'
                          ? 'დაჯავშნის ვაუჩერი და კონტრაქტი მეილზე'
                          : 'Voucher & rental agreement sent to email'
                        : language === 'ka'
                        ? 'მომენტალური QR ბილეთი მეილზე და კაბინეტში'
                        : 'Instant QR ticket sent via Email & Account'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <Lock sx={{ color: SUCCESS_COLOR, fontSize: 20 }} />
                    <Typography variant="caption" fontWeight={600} color="#334155">
                      {language === 'ka'
                        ? '256-ბიტიანი დაშიფრული უსაფრთხო გადახდა'
                        : '256-Bit Encrypted Secure Processing'}
                    </Typography>
                  </Box>
                </Box>

                {/* Support note */}
                <Box sx={{ mt: 2.5, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    {language === 'ka'
                      ? 'კითხვები გაქვთ? დაგვიკავშირდით: funfinder.georgia@gmail.com'
                      : 'Need help? Contact: funfinder.georgia@gmail.com'}
                  </Typography>
                </Box>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default PaymentPage;
