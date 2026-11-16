import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Grid,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormControlLabel,
  Checkbox,
  LinearProgress,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  InputAdornment,
  Stack,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Event as EventIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Image as ImageIcon,
  Visibility as ViewIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  DeleteOutline as DeleteImageIcon,
  EditOutlined as EditImageIcon,
  Map as MapIcon,
  StarBorder as FeaturedIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  GridView as GridViewIcon,
  ViewList as ViewListIcon
} from '@mui/icons-material';
import { eventApi, eventApiV2, companyApi, categoryApi, cityApi } from '../services/api';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { compressImage } from '../utils/imageCompressor';
import MapPicker from '../components/MapPicker';

const getImageUrl = (imgPath) => {
  if (!imgPath) return null;
  if (typeof imgPath !== 'string') return null;
  if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) return imgPath;
  if (imgPath.startsWith('/')) return imgPath;
  return `/${imgPath}`;
};

const getYouTubeVideoId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return match[2];
  }
  const shortsMatch = url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) {
    return shortsMatch[1];
  }
  return null;
};

const Events = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { canCreate, canUpdate, canDelete, canRead } = useAuth();
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Image upload modal state
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [imageUploadData, setImageUploadData] = useState({
    image: null,
    alt_text: '',
    is_primary: false
  });
  const [imageUploading, setImageUploading] = useState(false);

  // Event details modal state
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [eventDetails, setEventDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Image update modal state
  const [imageUpdateModalOpen, setImageUpdateModalOpen] = useState(false);
  const [selectedImageForUpdate, setSelectedImageForUpdate] = useState(null);
  const [imageUpdateData, setImageUpdateData] = useState({
    alt_text: '',
    is_primary: false
  });
  const [imageUpdating, setImageUpdating] = useState(false);
  
  // Map picker state
  const [openMapPicker, setOpenMapPicker] = useState(false);

  // Removed axiosInstance; not needed for v1 feed usage
  
  // Form state
  const [activeLangTab, setActiveLangTab] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    name_en: '',
    name_ka: '',
    name_ru: '',
    name_hi: '',
    name_ar: '',
    name_he: '',
    name_tr: '',
    name_hy: '',
    name_kk: '',
    name_uk: '',
    name_zh: '',
    description_en: '',
    description_ka: '',
    description_ru: '',
    description_hi: '',
    description_ar: '',
    description_he: '',
    description_tr: '',
    description_hy: '',
    description_kk: '',
    description_uk: '',
    description_zh: '',
    category: '',
    city: '',
    base_price: '',
    price_per_person: '',
    adult_price: '',
    child_price: '',
    infant_price: '',
    min_people: '',
    max_people: '',
    location: '',
    latitude: '',
    longitude: '',
    is_popular: false,
    is_active: true,
    is_featured: false,
    company_id: '',
    image: null,
    image_alt_text: '',
    image_is_primary: true,
    event_ticket: '',
    youtube_link: '',
    age_prices: [],
    booking_type: 'activity',
    daily_price: '',
    deposit_amount: '',
    car_transmission: 'Automatic',
    car_fuel: 'Petrol',
    car_seats: '5',
    working_hours_start: '09:00',
    working_hours_end: '20:00',
    slot_duration_mins: 60,
    time_slots: []
  });

  // Additional state for dropdowns
  const [categories, setCategories] = useState([]);
  const [companyCategories, setCompanyCategories] = useState([]);
  const [loadingCompanyCategories, setLoadingCompanyCategories] = useState(false);
  const [cities, setCities] = useState([]);
  const [companies, setCompanies] = useState([]);
  
  // Function to extract coordinates from event object
  const extractCoordinates = (event) => {
    // Try multiple possible field names and structures
    const possibleLatFields = [
      'latitude', 'lat', 'lat_lng', 'location_lat', 'geo_lat',
      'coordinates.lat', 'location_data.lat', 'position.lat'
    ];
    const possibleLngFields = [
      'longitude', 'lng', 'lon', 'lng_lat', 'location_lng', 'geo_lng',
      'coordinates.lng', 'location_data.lng', 'position.lng'
    ];

    let latitude = null;
    let longitude = null;

    // Try direct field access
    for (const field of possibleLatFields) {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        if (event[parent] && event[parent][child]) {
          latitude = event[parent][child];
          break;
        }
      } else if (event[field]) {
        latitude = event[field];
        break;
      }
    }

    for (const field of possibleLngFields) {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        if (event[parent] && event[parent][child]) {
          longitude = event[parent][child];
          break;
        }
      } else if (event[field]) {
        longitude = event[field];
        break;
      }
    }

    // Try array format [lat, lng] or [lng, lat]
    if (!latitude && !longitude) {
      if (Array.isArray(event.coordinates) && event.coordinates.length >= 2) {
        latitude = event.coordinates[0];
        longitude = event.coordinates[1];
      } else if (Array.isArray(event.lat_lng) && event.lat_lng.length >= 2) {
        latitude = event.lat_lng[0];
        longitude = event.lat_lng[1];
      } else if (Array.isArray(event.position) && event.position.length >= 2) {
        latitude = event.position[0];
        longitude = event.position[1];
      }
    }

    return { latitude, longitude };
  };

  // Debug: Log events state changes
  useEffect(() => {
    console.log('Events state updated:', events);
    console.log('Events count:', events.length);
    if (events.length > 0) {
      console.log('First event:', events[0]);
      console.log('First event ID:', events[0]?.id);
      const coords = extractCoordinates(events[0]);
      console.log('Extracted coordinates:', coords);
    }
  }, [events]);

  // Fetch events from API (v1 feed)
  const fetchEvents = async () => {
    try {
      setLoading(true);
      console.log('Fetching events from v1 feed /event/feed ...');

      // v1 feed returns an array directly
      const response = await eventApi.getAll();

      let eventsList = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];
      
      console.log('Extracted events list:', eventsList);
      console.log('Sample event structure:', eventsList.length > 0 ? eventsList[0] : 'No events');
      
      // Debug: Check summary of first event
      if (eventsList.length > 0) {
        console.log('First event ID:', eventsList[0]?.id);
      }
      
      // Ensure all events have an id property for MUI DataGrid
      const eventsWithIds = eventsList.map((event, index) => {
        // Generate a unique ID if none exists
        if (!event.id || event.id === '' || event.id === null || event.id === undefined) {
          const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${index}`;
          console.warn(`Event without ID found at index ${index}, assigned temp ID: ${tempId}`, event);
          return { ...event, id: tempId };
        }
        return event;
      });
      
      // Double-check that all events have valid IDs
      const validEvents = eventsWithIds.filter(event => {
        const hasValidId = event.id && event.id !== '' && event.id !== null && event.id !== undefined;
        if (!hasValidId) {
          console.error('Event still missing ID after processing:', event);
        }
        return hasValidId;
      });
      
      console.log('Events with IDs:', eventsWithIds);
      console.log('Valid events:', validEvents);
      console.log('Events count:', validEvents.length);
      
      // Set events only if we have valid ones
      if (validEvents.length > 0) {
        setEvents(validEvents);
      } else {
        console.warn('No valid events found, setting empty array');
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setSnackbar({
        open: true,
        message: `Error fetching events: ${error.response?.data?.detail || error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load events and dropdown options in parallel on component mount
  useEffect(() => {
    Promise.all([
      fetchEvents(),
      fetchCategories(),
      fetchCities(),
      fetchCompanies()
    ]).catch(err => console.error('Error fetching initial event data:', err));
  }, []);

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getAll();
      console.log('Categories API response:', response);
      
      let categoriesList = [];
      if (Array.isArray(response)) {
        categoriesList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        categoriesList = response.data;
      } else if (response?.results && Array.isArray(response.results)) {
        categoriesList = response.results;
      }
      
      console.log('Processed categories list:', categoriesList);
      setCategories(categoriesList);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  // Fetch cities from API
  const fetchCities = async () => {
    try {
      const response = await cityApi.getAll();
      console.log('Cities API response:', response);
      
      let citiesList = [];
      if (Array.isArray(response)) {
        citiesList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        citiesList = response.data;
      } else if (response?.results && Array.isArray(response.results)) {
        citiesList = response.results;
      }
      
      console.log('Processed cities list:', citiesList);
      setCities(citiesList);
    } catch (error) {
      console.error('Error fetching cities:', error);
      setCities([]);
    }
  };

  // Fetch companies from API
  const fetchCompanies = async () => {
    try {
      console.log('Fetching companies for Events component...');
      const response = await companyApi.getAll();
      console.log('Companies API response:', response);
      
      let companiesList = [];
      if (Array.isArray(response)) {
        companiesList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        companiesList = response.data;
      } else if (response?.results && Array.isArray(response.results)) {
        companiesList = response.results;
      }
      
      console.log('Processed companies list for Events:', companiesList);
      setCompanies(companiesList);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
    }
  };

  // Fetch categories linked to a specific company
  const fetchCategoriesForCompany = async (companyId) => {
    if (!companyId) {
      setCompanyCategories(categories);
      return;
    }
    try {
      setLoadingCompanyCategories(true);
      
      let response;
      try {
        response = await categoryApi.getByCompanyAdmin(companyId);
      } catch (e1) {
        try {
          response = await categoryApi.getByCompanyStaff(companyId);
        } catch (e2) {
          response = await categoryApi.getAllCompanyCategoryRelationships().catch(() => null);
        }
      }

      let list = [];
      if (Array.isArray(response)) {
        list = response;
      } else if (response?.data && Array.isArray(response.data)) {
        list = response.data;
      } else if (response?.results && Array.isArray(response.results)) {
        list = response.results;
      }

      const categoryIds = list.map(item => {
        if (typeof item === 'number' || typeof item === 'string') return String(item);
        return String(item.category_id || item.category || item.id || '');
      }).filter(Boolean);

      let matchedCategories = [];
      if (categoryIds.length > 0) {
        matchedCategories = categories.filter(c => 
          categoryIds.includes(String(c.id || c.category_id))
        );
      }

      if (matchedCategories.length === 0 && list.length > 0 && (list[0].name || list[0].title)) {
        matchedCategories = list;
      }

      if (matchedCategories.length === 0 && categories.length > 0) {
        matchedCategories = categories.filter(cat => 
          String(cat.company_id) === String(companyId) || 
          String(cat.company) === String(companyId) || 
          (Array.isArray(cat.companies) && cat.companies.map(c => String(c.id || c)).includes(String(companyId)))
        );
      }

      if (matchedCategories.length > 0) {
        setCompanyCategories(matchedCategories);
      } else {
        setCompanyCategories(categories);
      }
    } catch (err) {
      console.error(`Error fetching categories for company ${companyId}:`, err);
      setCompanyCategories(categories);
    } finally {
      setLoadingCompanyCategories(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'company_id') {
        updated.category = '';
        fetchCategoriesForCompany(value);
      }
      return updated;
    });
  };

  // Map picker functions
  const handleOpenMapPicker = () => {
    setOpenMapPicker(true);
  };

  const handleCloseMapPicker = () => {
    setOpenMapPicker(false);
  };

  const handleLocationSelect = (location) => {
    // Format coordinates to have no more than 9 digits total
    const formatCoordinate = (coord) => {
      const str = coord.toString();
      if (str.length <= 9) {
        return coord;
      }
      // Truncate to 9 digits total
      return parseFloat(str.substring(0, 9));
    };

    const formattedLat = formatCoordinate(location.lat);
    const formattedLng = formatCoordinate(location.lng);

    setFormData(prev => ({
      ...prev,
      latitude: formattedLat,
      longitude: formattedLng
    }));
    setSnackbar({
      open: true,
      message: `Location selected: ${formattedLat}, ${formattedLng}`,
      severity: 'success'
    });
  };

  // Open dialog for creating/editing event
  const handleOpenDialog = (event = null) => {
    setActiveLangTab(0);
    if (event) {
      // Editing existing event
      setEditingEvent(event);
      setFormData({
        name: event.name || '',
        description: event.description || '',
        name_en: event.name_en || event.name || '',
        name_ka: event.name_ka || '',
        name_ru: event.name_ru || '',
        name_hi: event.name_hi || '',
        name_ar: event.name_ar || '',
        name_he: event.name_he || '',
        name_tr: event.name_tr || '',
        name_hy: event.name_hy || '',
        name_kk: event.name_kk || '',
        name_uk: event.name_uk || '',
        name_zh: event.name_zh || '',
        description_en: event.description_en || event.description || '',
        description_ka: event.description_ka || '',
        description_ru: event.description_ru || '',
        description_hi: event.description_hi || '',
        description_ar: event.description_ar || '',
        description_he: event.description_he || '',
        description_tr: event.description_tr || '',
        description_hy: event.description_hy || '',
        description_kk: event.description_kk || '',
        description_uk: event.description_uk || '',
        description_zh: event.description_zh || '',
        category: event.category?.id || event.category || '',
        city: event.city?.id || event.city || '',
        base_price: event.base_price || '',
        price_per_person: event.price_per_person || '',
        adult_price: event.adult_price || '',
        child_price: event.child_price || '',
        infant_price: event.infant_price || '',
        min_people: event.min_people || '',
        max_people: event.max_people || '',
        location: event.location || '',
        latitude: event.latitude || '',
        longitude: event.longitude || '',
        is_popular: event.is_popular || false,
        is_active: event.is_active !== undefined ? event.is_active : true,
        is_featured: event.is_featured || false,
        company_id: event.company?.id || event.company || event.company_id || '',
        image: null,
        image_alt_text: '',
        image_is_primary: true,
        event_ticket: event.event_ticket || '',
        age_prices: event.age_prices || [],
        seo_title: event.seo_title || '',
        seo_description: event.seo_description || '',
        booking_type: event.booking_type || 'activity',
        daily_price: event.daily_price || '',
        deposit_amount: event.deposit_amount || '',
        car_transmission: event.car_transmission || 'Automatic',
        car_fuel: event.car_fuel || 'Petrol',
        car_seats: event.car_seats || '5',
        working_hours_start: event.working_hours_start || '09:00',
        working_hours_end: event.working_hours_end || '20:00',
        slot_duration_mins: event.slot_duration_mins || 60,
        time_slots: Array.isArray(event.time_slots)
          ? event.time_slots
          : Array.isArray(event.timeSlots)
            ? event.timeSlots.map(s => typeof s === 'string' ? { start_time: s, end_time: '', price: event.price_per_person || '', adult_price: '', child_price: '' } : s)
            : []
      });
      const selCompany = event.company?.id || event.company || event.company_id || '';
      if (selCompany) {
        fetchCategoriesForCompany(selCompany);
      } else {
        setCompanyCategories([]);
      }
    } else {
      setCompanyCategories([]);
      // Creating new event
      setEditingEvent(null);
      setFormData({
        name: '',
        description: '',
        name_en: '',
        name_ka: '',
        name_ru: '',
        name_hi: '',
        name_ar: '',
        name_he: '',
        name_tr: '',
        name_hy: '',
        name_kk: '',
        name_uk: '',
        name_zh: '',
        description_en: '',
        description_ka: '',
        description_ru: '',
        description_hi: '',
        description_ar: '',
        description_he: '',
        description_tr: '',
        description_hy: '',
        description_kk: '',
        description_uk: '',
        description_zh: '',
        category: '',
        city: '',
        base_price: '',
        price_per_person: '',
        adult_price: '',
        child_price: '',
        infant_price: '',
        min_people: '',
        max_people: '',
        location: '',
        latitude: '',
        longitude: '',
        is_popular: false,
        is_active: true,
        is_featured: false,
        company_id: '',
        image: null,
        image_alt_text: '',
        image_is_primary: true,
        event_ticket: '',
        youtube_link: '',
        age_prices: [],
        seo_title: '',
        seo_description: ''
      });
    }
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingEvent(null);
    setActiveLangTab(0);
    setFormData({
      name: '',
      description: '',
      name_en: '',
      name_ka: '',
      name_ru: '',
      name_hi: '',
      name_ar: '',
      name_he: '',
      name_tr: '',
      name_hy: '',
      name_kk: '',
      name_uk: '',
      name_zh: '',
      description_en: '',
      description_ka: '',
      description_ru: '',
      description_hi: '',
      description_ar: '',
      description_he: '',
      description_tr: '',
      description_hy: '',
      description_kk: '',
      description_uk: '',
      description_zh: '',
      category: '',
      city: '',
      base_price: '',
      price_per_person: '',
      adult_price: '',
      child_price: '',
      infant_price: '',
      min_people: '',
      max_people: '',
      location: '',
      latitude: '',
      longitude: '',
      is_popular: false,
      is_active: true,
      is_featured: false,
      company_id: '',
      image: null,
      image_alt_text: '',
      image_is_primary: true,
      event_ticket: '',
      youtube_link: '',
      age_prices: [],
      seo_title: '',
      seo_description: ''
    });
  };

  const handleAddTimeSlot = (defaultStart = '10:00', defaultEnd = '11:00') => {
    setFormData(prev => ({
      ...prev,
      time_slots: [
        ...(prev.time_slots || []),
        {
          start_time: defaultStart,
          end_time: defaultEnd,
          price: prev.price_per_person || prev.base_price || '',
          adult_price: prev.adult_price || prev.price_per_person || '',
          child_price: prev.child_price || '',
          slot_label: '',
          max_people: prev.max_people || ''
        }
      ]
    }));
  };

  const handleRemoveTimeSlot = (index) => {
    setFormData(prev => ({
      ...prev,
      time_slots: (prev.time_slots || []).filter((_, i) => i !== index)
    }));
  };

  const handleTimeSlotChange = (index, field, value) => {
    setFormData(prev => {
      const updated = (prev.time_slots || []).map((slot, i) => {
        if (i === index) {
          return { ...slot, [field]: value };
        }
        return slot;
      });
      return { ...prev, time_slots: updated };
    });
  };

  const handleToggleHourChip = (hour) => {
    setFormData(prev => {
      const currentSlots = prev.time_slots || [];
      const existsIndex = currentSlots.findIndex(s => s.start_time === hour);
      if (existsIndex >= 0) {
        return {
          ...prev,
          time_slots: currentSlots.filter((_, i) => i !== existsIndex)
        };
      } else {
        const hourNum = parseInt(hour.split(':')[0], 10);
        const nextHour = String(hourNum + 1).padStart(2, '0') + ':00';
        const baseP = prev.price_per_person || prev.base_price || '';
        return {
          ...prev,
          time_slots: [
            ...currentSlots,
            {
              start_time: hour,
              end_time: nextHour,
              price: baseP,
              adult_price: prev.adult_price || baseP,
              child_price: prev.child_price || '',
              slot_label: '',
              max_people: prev.max_people || ''
            }
          ].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
        };
      }
    });
  };

  const handleGenerateTimeSlots = () => {
    const startHour = parseInt((formData.working_hours_start || '09:00').split(':')[0], 10) || 9;
    const endHour = parseInt((formData.working_hours_end || '20:00').split(':')[0], 10) || 20;
    const duration = parseInt(formData.slot_duration_mins, 10) || 60;
    
    const newSlots = [];
    let currentHour = startHour;
    
    while (currentHour < endHour) {
      const nextHour = currentHour + Math.max(1, Math.floor(duration / 60));
      const sStart = String(currentHour).padStart(2, '0') + ':00';
      const sEnd = String(Math.min(nextHour, endHour)).padStart(2, '0') + ':00';
      
      const isSunset = currentHour >= 17 && currentHour <= 20;
      const baseP = parseFloat(formData.price_per_person || formData.base_price || 30);
      const slotPrice = isSunset ? Math.round(baseP * 1.25) : baseP;
      
      newSlots.push({
        start_time: sStart,
        end_time: sEnd,
        price: slotPrice,
        adult_price: slotPrice,
        child_price: formData.child_price ? (isSunset ? Math.round(parseFloat(formData.child_price) * 1.25) : parseFloat(formData.child_price)) : '',
        slot_label: isSunset ? 'საღამოს პიკი / Sunset' : 'სტანდარტული',
        max_people: formData.max_people || ''
      });
      currentHour = nextHour;
    }
    
    setFormData(prev => ({
      ...prev,
      time_slots: newSlots
    }));
  };

  const handleAddAgePrice = () => {
    setFormData(prev => ({
      ...prev,
      age_prices: [
        ...(prev.age_prices || []),
        { category_name: '', min_age: '', max_age: '', price: '', start_time: '', end_time: '' }
      ]
    }));
  };

  const handleRemoveAgePrice = (index) => {
    setFormData(prev => ({
      ...prev,
      age_prices: (prev.age_prices || []).filter((_, i) => i !== index)
    }));
  };

  const handleAgePriceChange = (index, field, value) => {
    setFormData(prev => {
      const updated = (prev.age_prices || []).map((ap, i) => {
        if (i === index) {
          let val = value;
          if (field === 'min_age' || field === 'max_age') {
            val = value === '' ? '' : parseInt(value, 10);
            if (isNaN(val)) val = '';
          } else if (field === 'price') {
            val = value === '' ? '' : parseFloat(value);
            if (isNaN(val)) val = '';
          }
          return { ...ap, [field]: val };
        }
        return ap;
      });
      return { ...prev, age_prices: updated };
    });
  };

  // Handle image file selection inside the create/edit dialog
  const handleFormImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setSnackbar({ open: true, message: 'Please select a valid image file (PNG, JPEG, GIF, or WebP)', severity: 'error' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setSnackbar({ open: true, message: 'Image file size must be less than 10MB', severity: 'error' });
      return;
    }

    try {
      const compressed = await compressImage(file);
      setFormData(prev => ({ ...prev, image: compressed }));
    } catch (err) {
      console.warn('Image compression fallback:', err);
      setFormData(prev => ({ ...prev, image: file }));
    }
  };

  // Validate form data
  const validateForm = () => {
    if (!formData.name.trim()) {
      setSnackbar({ open: true, message: 'Name is required', severity: 'error' });
      return false;
    }
    if (!formData.description.trim()) {
      setSnackbar({ open: true, message: 'Description is required', severity: 'error' });
      return false;
    }
    if (!formData.category) {
      setSnackbar({ open: true, message: 'Category is required', severity: 'error' });
      return false;
    }
    if (!formData.city) {
      setSnackbar({ open: true, message: 'City is required', severity: 'error' });
      return false;
    }
    if (!formData.company_id) {
      setSnackbar({ open: true, message: 'Company is required', severity: 'error' });
      return false;
    }
    if (!formData.base_price || parseFloat(formData.base_price) <= 0) {
      setSnackbar({ open: true, message: 'Base price must be greater than 0', severity: 'error' });
      return false;
    }
    if (!formData.price_per_person || parseFloat(formData.price_per_person) <= 0) {
      setSnackbar({ open: true, message: 'Price per person must be greater than 0', severity: 'error' });
      return false;
    }
    if (!formData.min_people || parseInt(formData.min_people) <= 0) {
      setSnackbar({ open: true, message: 'Minimum people must be greater than 0', severity: 'error' });
      return false;
    }
    if (!formData.max_people || parseInt(formData.max_people) <= 0) {
      setSnackbar({ open: true, message: 'Maximum people must be greater than 0', severity: 'error' });
      return false;
    }
    if (parseInt(formData.min_people) > parseInt(formData.max_people)) {
      setSnackbar({ open: true, message: 'Minimum people cannot be greater than maximum people', severity: 'error' });
      return false;
    }
    if (!formData.location.trim()) {
      setSnackbar({ open: true, message: 'Location is required', severity: 'error' });
      return false;
    }
    if (!formData.latitude || isNaN(parseFloat(formData.latitude))) {
      setSnackbar({ open: true, message: 'Valid latitude is required', severity: 'error' });
      return false;
    }
    if (!formData.longitude || isNaN(parseFloat(formData.longitude))) {
      setSnackbar({ open: true, message: 'Valid longitude is required', severity: 'error' });
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    // Check if we have authentication token
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setSnackbar({
        open: true,
        message: 'Authentication token not found. Please log in again.',
        severity: 'error'
      });
      return;
    }
    
    console.log('Auth token available:', !!token);

    try {
      // Start with the original working fields
      const eventData = {
        company_id: parseInt(formData.company_id),
        name: formData.name.trim(),
        description: formData.description.trim(),
        name_en: (formData.name_en || formData.name || '').trim(),
        name_ka: (formData.name_ka || '').trim(),
        name_ru: (formData.name_ru || '').trim(),
        name_hi: (formData.name_hi || '').trim(),
        name_ar: (formData.name_ar || '').trim(),
        name_he: (formData.name_he || '').trim(),
        name_tr: (formData.name_tr || '').trim(),
        name_hy: (formData.name_hy || '').trim(),
        name_kk: (formData.name_kk || '').trim(),
        name_uk: (formData.name_uk || '').trim(),
        name_zh: (formData.name_zh || '').trim(),
        description_en: (formData.description_en || formData.description || '').trim(),
        description_ka: (formData.description_ka || '').trim(),
        description_ru: (formData.description_ru || '').trim(),
        description_hi: (formData.description_hi || '').trim(),
        description_ar: (formData.description_ar || '').trim(),
        description_he: (formData.description_he || '').trim(),
        description_tr: (formData.description_tr || '').trim(),
        description_hy: (formData.description_hy || '').trim(),
        description_kk: (formData.description_kk || '').trim(),
        description_uk: (formData.description_uk || '').trim(),
        description_zh: (formData.description_zh || '').trim(),
        category: parseInt(formData.category),
        city: parseInt(formData.city),
        price_per_person: parseFloat(formData.price_per_person),
        location: formData.location.trim(),
        event_ticket: formData.event_ticket || null,
        age_prices: (formData.age_prices || []).map(ap => ({
          ...ap,
          start_time: ap.start_time || null,
          end_time: ap.end_time || null
        })),
        seo_title: (formData.seo_title || '').trim() || null,
        seo_description: (formData.seo_description || '').trim() || null,
        youtube_link: (formData.youtube_link || '').trim() || null
      };

      if (formData.booking_type) {
        eventData.booking_type = formData.booking_type;
      }
      if (formData.daily_price) {
        eventData.daily_price = parseFloat(formData.daily_price);
      }
      if (formData.deposit_amount) {
        eventData.deposit_amount = parseFloat(formData.deposit_amount);
      }
      if (formData.car_transmission) {
        eventData.car_transmission = formData.car_transmission;
      }
      if (formData.car_fuel) {
        eventData.car_fuel = formData.car_fuel;
      }
      if (formData.car_seats) {
        eventData.car_seats = parseInt(formData.car_seats);
      }
      if (formData.working_hours_start) {
        eventData.working_hours_start = formData.working_hours_start;
      }
      if (formData.working_hours_end) {
        eventData.working_hours_end = formData.working_hours_end;
      }
      if (formData.slot_duration_mins) {
        eventData.slot_duration_mins = parseInt(formData.slot_duration_mins);
      }
      if (Array.isArray(formData.time_slots) && formData.time_slots.length > 0) {
        eventData.time_slots = formData.time_slots.map(s => ({
          start_time: s.start_time,
          end_time: s.end_time || '',
          price: s.price !== '' ? parseFloat(s.price) : (parseFloat(formData.price_per_person) || null),
          adult_price: s.adult_price !== '' ? parseFloat(s.adult_price) : null,
          child_price: s.child_price !== '' ? parseFloat(s.child_price) : null,
          slot_label: s.slot_label || null,
          max_people: s.max_people !== '' ? parseInt(s.max_people, 10) : null
        }));
        eventData.timeSlots = formData.time_slots.map(s => s.start_time);
        const pMap = {};
        formData.time_slots.forEach(s => {
          if (s.start_time) {
            pMap[s.start_time] = {
              price: s.price !== '' ? parseFloat(s.price) : undefined,
              adult: s.adult_price !== '' ? parseFloat(s.adult_price) : undefined,
              child: s.child_price !== '' ? parseFloat(s.child_price) : undefined,
              label: s.slot_label || undefined
            };
          }
        });
        eventData.slots_pricing = pMap;
      }

      // Add new fields if they have values
      if (formData.base_price) {
        eventData.base_price = parseFloat(formData.base_price);
      }
      if (formData.adult_price) {
        eventData.adult_price = parseFloat(formData.adult_price);
      } else {
        eventData.adult_price = null;
      }
      if (formData.child_price) {
        eventData.child_price = parseFloat(formData.child_price);
      } else {
        eventData.child_price = null;
      }
      if (formData.infant_price) {
        eventData.infant_price = parseFloat(formData.infant_price);
      } else {
        eventData.infant_price = null;
      }
      if (formData.min_people) {
        eventData.min_people = parseInt(formData.min_people);
      }
      if (formData.max_people) {
        eventData.max_people = parseInt(formData.max_people);
      }
      if (formData.latitude) {
        eventData.latitude = parseFloat(formData.latitude);
      }
      if (formData.longitude) {
        eventData.longitude = parseFloat(formData.longitude);
      }
      if (formData.is_popular !== undefined) {
        eventData.is_popular = formData.is_popular;
      }
      if (formData.is_active !== undefined) {
        eventData.is_active = formData.is_active;
      }
      if (formData.is_featured !== undefined) {
        eventData.is_featured = formData.is_featured;
      }

      console.log('=== EVENT CREATION DEBUG ===');
      console.log('Form data:', formData);
      console.log('Event data to send:', eventData);
      console.log('Editing event:', editingEvent);
      console.log('Is editing mode:', !!editingEvent);
      console.log('Event ID for update:', editingEvent?.id);
      console.log('API endpoint:', editingEvent ? `/event/update/${editingEvent.id}` : '/event/create');
      console.log('==========================');

      let response;
      let savedEventId = editingEvent?.id;
    if (editingEvent && editingEvent.id) {
        // Update existing event
        console.log('=== UPDATING EVENT ===');
        console.log('Calling eventApiV2.update with ID:', editingEvent.id);
        console.log('Update data:', eventData);
        try {
          response = await eventApiV2.update(editingEvent.id, eventData);
          console.log('Update response:', response);
          setSnackbar({
            open: true,
            message: 'Event updated successfully',
            severity: 'success'
          });
        } catch (updateError) {
          console.error('Update failed:', updateError);
          throw updateError;
        }
    } else {
        // Create new event
        console.log('=== CREATING EVENT ===');
        console.log('Calling eventApiV2.create with data:', eventData);
        try {
          response = await eventApiV2.create(eventData);
          console.log('Create response:', response);
          savedEventId = response?.id || response?.data?.id || response?.event?.id || response?.result?.id;
          setSnackbar({
            open: true,
            message: 'Event created successfully',
            severity: 'success'
          });
        } catch (createError) {
          console.error('Create failed:', createError);
          throw createError;
        }
      }

      // Upload image if one was selected in the form
      if (formData.image && savedEventId) {
        try {
          const imageFormData = new FormData();
          imageFormData.append('image', formData.image);
          imageFormData.append('alt_text', formData.image_alt_text?.trim() || formData.name.trim());
          imageFormData.append('is_primary', formData.image_is_primary);

          await eventApi.uploadImage(savedEventId, imageFormData);
          setSnackbar({
            open: true,
            message: editingEvent ? 'Event and image updated successfully' : 'Event created and image uploaded successfully',
            severity: 'success'
          });
        } catch (imageError) {
          console.error('Image upload failed:', imageError);
          setSnackbar({
            open: true,
            message: `Event saved, but image upload failed: ${imageError.response?.data?.detail || imageError.message}`,
            severity: 'warning'
          });
        }
      } else if (formData.image && !savedEventId) {
        setSnackbar({
          open: true,
          message: 'Event saved, but image could not be uploaded (missing event id).',
          severity: 'warning'
        });
      }

      console.log('API Response:', response);

      // Refresh events list to get the updated data with proper IDs
      await fetchEvents();
      
      // Ensure the dialog is closed after successful operation
      handleCloseDialog();
    } catch (error) {
      console.error('=== EVENT CREATION ERROR ===');
      console.error('Error object:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      console.error('Error message:', error.message);
      console.error('Request config:', error.config);
      console.error('==========================');
      
      // Log the full error response for debugging
      console.error('Full error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      
      // Try to extract more detailed error information
      let errorMessage = 'Error saving event';
      if (error.response?.data) {
        if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (typeof error.response.data === 'object') {
          // Try to extract field-specific errors
          const fieldErrors = Object.entries(error.response.data)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ');
          if (fieldErrors) {
            errorMessage = `Validation errors: ${fieldErrors}`;
          }
        }
      } else {
        errorMessage = error.message || 'Error saving event';
      }
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  // Delete event
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      await eventApiV2.delete(eventId);
      setSnackbar({
        open: true,
        message: 'Event deleted successfully',
        severity: 'success'
      });
      await fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      setSnackbar({
        open: true,
        message: `Error deleting event: ${error.response?.data?.detail || error.message}`,
        severity: 'error'
      });
    }
  };

  // Toggle event active status
  const handleToggleStatus = async (event) => {
    const actionLabel = event.is_active ? 'გათიშვა (დეაქტივაცია)' : 'გააქტიურება';
    if (!window.confirm(`ნამდვილად გსურთ "${event.name}"-ის ${actionLabel}?`)) {
      return;
    }

    try {
      await eventApi.update(event.id, { is_active: !event.is_active });
      setSnackbar({
        open: true,
        message: event.is_active ? 'ივენთი დეაქტივირებულია (ფრონტზე დაიმალა)' : 'ივენთი გააქტიურებულია (ფრონტზე გამოჩნდა)',
        severity: 'success'
      });
      await fetchEvents();
    } catch (error) {
      console.error('Error toggling event status:', error);
      setSnackbar({
        open: true,
        message: `შეცდომა სტატუსის შეცვლისას: ${error.response?.data?.detail || error.message}`,
        severity: 'error'
      });
    }
  };

  // Handle view details button click
  const handleViewDetails = async (event) => {
    console.log('Viewing details for event:', event.name, 'ID:', event.id);
    setDetailsLoading(true);
    setDetailsModalOpen(true);
    
    try {
      // Use getDetails endpoint which calls /event/details/${id}
      const response = await eventApi.getDetails(event.id);
      console.log('Using event details endpoint');

      console.log('Event details response:', response);
      console.log('Event details response keys:', Object.keys(response || {}));
      console.log('Event details images:', response?.images);
      console.log('Event details images type:', typeof response?.images);
      console.log('Event details images length:', response?.images?.length);
      
      // Handle different response structures
      let eventDetailsData = response;
      if (response?.data) {
        eventDetailsData = response.data;
      }
      
      // Log the final event details data
      console.log('Final eventDetailsData:', eventDetailsData);
      console.log('Final eventDetailsData images:', eventDetailsData?.images);
      console.log('Final eventDetailsData images length:', eventDetailsData?.images?.length);
      
      setEventDetails(eventDetailsData);
    } catch (error) {
      console.error('Error fetching event details:', error);
      setSnackbar({
        open: true,
        message: `Error loading event details: ${error.response?.data?.detail || error.message}`,
        severity: 'error'
      });
      setDetailsModalOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Handle close details modal
  const handleCloseDetailsModal = () => {
    setDetailsModalOpen(false);
    setEventDetails(null);
    setDetailsLoading(false);
  };

  // Handle delete image
  const handleDeleteImage = async (imageId, eventId) => {
    if (!window.confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('Deleting image:', imageId, 'from event:', eventId);
      await eventApi.deleteImage(eventId, imageId);
      
      setSnackbar({
        open: true,
        message: 'Image deleted successfully!',
        severity: 'success'
      });
      
      // Refresh event details to show updated data
      if (eventDetails) {
        await handleViewDetails({ id: eventDetails.id });
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      setSnackbar({
        open: true,
        message: `Error deleting image: ${error.response?.data?.detail || error.message}`,
        severity: 'error'
      });
    }
  };

  // Handle edit image button click
  const handleEditImage = (image, eventId) => {
    console.log('Editing image:', image, 'for event:', eventId);
    setSelectedImageForUpdate({ ...image, eventId });
    setImageUpdateData({
      alt_text: image.alt_text || '',
      is_primary: image.is_primary || false
    });
    setImageUpdateModalOpen(true);
  };

  // Handle close image update modal
  const handleCloseImageUpdateModal = () => {
    setImageUpdateModalOpen(false);
    setSelectedImageForUpdate(null);
    setImageUpdateData({
      alt_text: '',
      is_primary: false
    });
    setImageUpdating(false);
  };

  // Handle image update form submission
  const handleImageUpdate = async () => {
    if (!selectedImageForUpdate) {
      setSnackbar({
        open: true,
        message: 'No image selected for update',
        severity: 'error'
      });
      return;
    }

    if (!imageUpdateData.alt_text.trim()) {
      setSnackbar({
        open: true,
        message: 'Please provide alternative text for the image',
        severity: 'error'
      });
      return;
    }

    setImageUpdating(true);

    try {
      const updateData = {
        alt_text: imageUpdateData.alt_text.trim(),
        is_primary: imageUpdateData.is_primary
      };

      console.log('Updating image:', selectedImageForUpdate.id, 'with data:', updateData);
      
      const response = await eventApi.updateImage(
        selectedImageForUpdate.eventId, 
        selectedImageForUpdate.id, 
        updateData
      );

      console.log('Image update response:', response);

      setSnackbar({
        open: true,
        message: 'Image updated successfully!',
        severity: 'success'
      });

      handleCloseImageUpdateModal();
      
      // Refresh event details to show updated data
      if (eventDetails) {
        await handleViewDetails({ id: eventDetails.id });
      }
    } catch (error) {
      console.error('Error updating image:', error);
      setSnackbar({
        open: true,
        message: `Error updating image: ${error.response?.data?.detail || error.message}`,
        severity: 'error'
      });
    } finally {
      setImageUpdating(false);
    }
  };

  // Handle add image button click
  const handleAddImage = (event) => {
    console.log('Add image for event:', event.name);
    setSelectedEvent(event);
    setImageUploadData({
      image: null,
      alt_text: '',
      is_primary: false
    });
    setImageModalOpen(true);
  };

  // Handle image upload modal close
  const handleImageModalClose = () => {
    setImageModalOpen(false);
    setSelectedEvent(null);
    setImageUploadData({
      image: null,
      alt_text: '',
      is_primary: false
    });
    setImageUploading(false);
  };

  // Handle image file selection
  const handleImageFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setSnackbar({
          open: true,
          message: 'Please select a valid image file (PNG, JPEG, GIF, or WebP)',
          severity: 'error'
        });
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setSnackbar({
          open: true,
          message: 'Image file size must be less than 10MB',
          severity: 'error'
        });
        return;
      }

      try {
        const compressed = await compressImage(file);
        setImageUploadData(prev => ({
          ...prev,
          image: compressed
        }));
      } catch (err) {
        console.warn('Image compression fallback:', err);
        setImageUploadData(prev => ({
          ...prev,
          image: file
        }));
      }
    }
  };

  // Handle image upload form submission
  const handleImageUpload = async () => {
    if (!imageUploadData.image) {
      setSnackbar({
        open: true,
        message: 'Please select an image file',
        severity: 'error'
      });
      return;
    }

    if (!imageUploadData.alt_text.trim()) {
      setSnackbar({
        open: true,
        message: 'Please provide alternative text for the image',
        severity: 'error'
      });
      return;
    }

    setImageUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', imageUploadData.image);
      formData.append('alt_text', imageUploadData.alt_text);
      formData.append('is_primary', imageUploadData.is_primary);

      const response = await eventApi.uploadImage(selectedEvent.id, formData);

      setSnackbar({
        open: true,
        message: 'Image uploaded successfully!',
        severity: 'success'
      });

      handleImageModalClose();
      
      // Refresh events to show updated data
      await fetchEvents();
    } catch (error) {
      console.error('Error uploading image:', error);
      setSnackbar({
        open: true,
        message: `Error uploading image: ${error.response?.data?.detail || error.message}`,
        severity: 'error'
      });
    } finally {
      setImageUploading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Copy coordinates to clipboard
  const handleCopyCoordinates = (latitude, longitude) => {
    const coordinates = `${latitude}, ${longitude}`;
    navigator.clipboard.writeText(coordinates).then(() => {
      setSnackbar({
        open: true,
        message: 'Coordinates copied to clipboard!',
        severity: 'success'
      });
    }).catch(() => {
      setSnackbar({
        open: true,
        message: 'Failed to copy coordinates',
        severity: 'error'
      });
    });
  };

  // Get status color
  const getStatusColor = (isActive) => {
    return isActive ? 'success' : 'error';
  };

  const selectedCategoryObj = categories.find(c => c.id === parseInt(formData.category));
  const isSpecialActivity = selectedCategoryObj?.activity === 'special';

  const getCategoryName = (event) => {
    if (!event) return 'N/A';
    if (typeof event.category === 'object' && event.category) {
      return event.category.name || event.category.title || event.category.name_en || 'N/A';
    }
    const found = categories.find(c => c.id === event.category || c.id === parseInt(event.category));
    if (found) return found.name || found.title || found.name_en;
    return event.category != null ? String(event.category) : 'N/A';
  };

  const getCityName = (event) => {
    if (!event) return '—';
    if (typeof event.city === 'object' && event.city) {
      return event.city.name || event.city.title || event.city.name_en || '—';
    }
    const found = cities.find(c => c.id === event.city || c.id === parseInt(event.city));
    if (found) return found.name || found.title || found.name_en;
    return event.city != null ? String(event.city) : '—';
  };

  const getCompanyName = (event) => {
    if (!event) return '—';
    if (typeof event.company === 'object' && event.company) {
      return event.company.name || event.company.title || '—';
    }
    const compId = event.company_id || event.company;
    const found = companies.find(c => c.id === compId || c.id === parseInt(compId));
    if (found) return found.name || found.title;
    return compId != null ? String(compId) : '—';
  };

  const filteredEvents = events.filter(event => {
    if (!event) return false;
    const term = String(searchTerm || '').trim().toLowerCase();
    if (!term) return true;

    const catName = getCategoryName(event);
    const cityName = getCityName(event);

    const name = String(event.name || event.name_en || event.name_ka || '').toLowerCase();
    const category = String(catName).toLowerCase();
    const city = String(cityName).toLowerCase();
    const location = String(event.location || '').toLowerCase();
    const description = String(event.description || event.description_en || '').toLowerCase();
    
    return name.includes(term) || 
           category.includes(term) || 
           city.includes(term) || 
           location.includes(term) || 
           description.includes(term);
  });

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', md: 'center' }, 
        mb: 4,
        p: 3,
        borderRadius: 3,
        background: 'linear-gradient(135deg, #ffffff 0%, #f4f6f8 100%)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
        gap: { xs: 2, md: 0 }
      }}>
        <Typography variant="h4" sx={{ fontWeight: 800, background: 'linear-gradient(45deg, #1976d2, #9c27b0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Events Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', md: 'auto' } }}>
          {canCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ 
                borderRadius: 2, 
                px: 3,
                boxShadow: '0 4px 14px rgba(25, 118, 210, 0.4)',
                flex: { xs: 1, md: 'none' }
              }}
            >
              Add Event
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchEvents}
            disabled={loading}
            sx={{ 
              borderRadius: 2,
              flex: { xs: 1, md: 'none' }
            }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Filter bar */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.04)' }}>
        <CardContent sx={{ py: 2 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', md: 'center' }}
            justifyContent="space-between"
          >
            <TextField
              placeholder="Search events by name, description, city, category, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: { xs: '100%', md: 480 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                     <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm ? (
                  <InputAdornment position="end">
                     <IconButton size="small" onClick={() => setSearchTerm('')}>
                       <CloseIcon fontSize="small" />
                     </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
            {events.length > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Showing {filteredEvents.length} of {events.length} events
              </Typography>
            )}
            <Box sx={{ ml: { xs: 0, sm: 'auto' }, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, val) => val && setViewMode(val)}
                size="small"
                sx={{
                  bgcolor: '#f1f5f9',
                  p: 0.5,
                  borderRadius: 2,
                  '& .MuiToggleButton-root': {
                    border: 'none',
                    borderRadius: 1.5,
                    px: 1.5,
                    py: 0.5,
                    fontWeight: 600,
                    textTransform: 'none',
                    color: '#64748b',
                    '&.Mui-selected': {
                      bgcolor: '#ffffff',
                      color: 'primary.main',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }
                  }
                }}
              >
                <ToggleButton value="cards">
                  <GridViewIcon fontSize="small" sx={{ mr: 0.5 }} /> ქარდები
                </ToggleButton>
                <ToggleButton value="table">
                  <ViewListIcon fontSize="small" sx={{ mr: 0.5 }} /> ცხრილი
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredEvents.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <Typography variant="h6" color="textSecondary">
            {events.length === 0 ? 'No events found' : 'No matching events found'}
          </Typography>
        </Box>
      ) : (viewMode === 'cards' || isMobile) ? (
        <Grid container spacing={3}>
          {filteredEvents
            .filter(event => event && event.id && typeof event.id !== 'undefined')
            .map((event) => {
              const coords = extractCoordinates(event);
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={event.id} sx={{ display: 'flex' }}>
                  <Card sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.1)'
                    }
                  }}>
                    <Box sx={{ position: 'relative', height: 180, backgroundColor: '#f0f2f5' }}>
                      {event.image || event.primary_image ? (
                        <>
                          <img
                            src={getImageUrl(event.image || event.primary_image?.image)}
                            alt={event.primary_image?.alt_text || event.name || 'Event image'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const fallback = e.target.parentElement?.querySelector('.fallback-icon');
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          <Box className="fallback-icon" sx={{ display: 'none', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                            <ImageIcon sx={{ color: 'text.secondary', fontSize: 40 }} />
                          </Box>
                        </>
                      ) : (
                        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ImageIcon sx={{ color: 'text.secondary', fontSize: 40 }} />
                        </Box>
                      )}
                      
                      <Box sx={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 1 }}>
                        <Tooltip title={event.is_active ? "სტატუსი: აქტიური (დააწკაპუნეთ გასათიშად)" : "სტატუსი: არააქტიური (დააწკაპუნეთ გასააქტიურებლად)"}>
                          <Chip 
                            label={event.is_active ? 'Active' : 'Inactive'} 
                            clickable
                            onClick={() => handleToggleStatus(event)}
                            sx={{ 
                              backgroundColor: event.is_active ? 'rgba(46, 204, 113, 0.95)' : 'rgba(231, 76, 60, 0.95)', 
                              color: 'white', 
                              fontWeight: 700, 
                              backdropFilter: 'blur(4px)',
                              cursor: 'pointer',
                              '&:hover': {
                                opacity: 0.9,
                                transform: 'scale(1.05)',
                                transition: 'all 0.2s'
                              }
                            }} 
                            size="small" 
                          />
                        </Tooltip>
                      </Box>
                    </Box>
                    <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1a1f36' }}>
                        {event.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <LocationIcon sx={{ fontSize: 16, color: 'primary.main', mr: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">
                          {getCityName(event)} • {event.location || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                        <Chip label={getCategoryName(event)} size="small" sx={{ backgroundColor: '#f3f4f6', color: '#4b5563', fontWeight: 600 }} />
                        {event.is_popular && <Chip label="Popular" size="small" sx={{ backgroundColor: '#fff3cd', color: '#856404', fontWeight: 600 }} />}
                        {event.is_featured && <Chip label="Featured" size="small" sx={{ backgroundColor: '#cce5ff', color: '#004085', fontWeight: 600 }} />}
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderTop: '1px solid #f0f0f0' }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Price
                          </Typography>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1a1f36' }}>
                            {event.price_per_person ? `${event.price_per_person} ₾` : 'N/A'}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Capacity
                          </Typography>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1a1f36' }}>
                            {event.min_people || 'N/A'} - {event.max_people || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, mt: 'auto', pt: 2, borderTop: '1px solid #f0f0f0', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {canUpdate && (
                          <Tooltip title={event.is_active ? "გათიშვა (ფრონტზე დამალვა)" : "გააქტიურება (ფრონტზე გამოჩენა)"}>
                            <IconButton 
                              size="small" 
                              onClick={() => handleToggleStatus(event)} 
                              sx={{ 
                                backgroundColor: event.is_active ? '#e8f5e9' : '#ffebee', 
                                color: event.is_active ? '#2e7d32' : '#d32f2f', 
                                border: `1px solid ${event.is_active ? '#a5d6a7' : '#ef9a9a'}`,
                                '&:hover': { backgroundColor: event.is_active ? '#c8e6c9' : '#ffcdd2' } 
                              }}
                            >
                              {event.is_active ? <CheckCircleIcon fontSize="small" /> : <BlockIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        )}
                        {canRead && (
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => handleViewDetails(event)} sx={{ backgroundColor: '#e3f2fd', color: '#1976d2', '&:hover': { backgroundColor: '#bbdefb' } }}>
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canUpdate && (
                          <Tooltip title="Edit Event">
                            <IconButton size="small" onClick={() => handleOpenDialog(event)} sx={{ backgroundColor: '#f3e5f5', color: '#9c27b0', '&:hover': { backgroundColor: '#e1bee7' } }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Add Image">
                          <IconButton size="small" onClick={() => handleAddImage(event)} sx={{ backgroundColor: '#fff8e1', color: '#f57c00', '&:hover': { backgroundColor: '#ffecb3' } }}>
                            <ImageIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {canDelete && (
                          <Tooltip title="Delete Event">
                            <IconButton size="small" onClick={() => handleDeleteEvent(event.id)} sx={{ backgroundColor: '#ffebee', color: '#d32f2f', '&:hover': { backgroundColor: '#ffcdd2' } }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
        </Grid>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.04)', overflow: 'hidden', border: 'none' }}>
          <Table sx={{ minWidth: 1000 }}>
            <TableHead sx={{ backgroundColor: '#fafbfc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: '#4a5568', py: 2 }}>Event Details</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#4a5568', py: 2 }}>Category & Location</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#4a5568', py: 2 }}>Pricing</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#4a5568', py: 2 }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, color: '#4a5568', py: 2 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEvents
                .filter(event => event && event.id && typeof event.id !== 'undefined')
                .map((event) => (
                <TableRow key={event.id} hover sx={{ '&:hover': { backgroundColor: '#f8fafd' }, transition: 'background-color 0.2s ease' }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ mr: 2, position: 'relative' }}>
                        {event.image || event.primary_image ? (
                          <>
                            <img
                              src={getImageUrl(event.image || event.primary_image?.image)}
                              alt={event.primary_image?.alt_text || event.name || 'Event image'}
                              style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const fallback = e.target.parentElement?.querySelector('.event-thumb-fallback');
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                            <Box className="event-thumb-fallback" sx={{ display: 'none', width: 64, height: 64, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f2f5', borderRadius: 12 }}>
                              <ImageIcon sx={{ color: 'text.secondary', fontSize: 28 }} />
                            </Box>
                          </>
                        ) : (
                          <Box sx={{ width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f2f5', borderRadius: 12 }}>
                            <ImageIcon sx={{ color: 'text.secondary', fontSize: 28 }} />
                          </Box>
                        )}
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a202c', fontSize: '0.95rem' }}>
                          {event.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#718096', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {event.description}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Chip label={getCategoryName(event)} size="small" sx={{ width: 'fit-content', backgroundColor: '#edf2f7', color: '#2d3748', fontWeight: 600 }} />
                      <Typography variant="body2" sx={{ color: '#4a5568', mt: 1, display: 'flex', alignItems: 'center' }}>
                        <LocationIcon sx={{ fontSize: 14, mr: 0.5, color: '#a0aec0' }} />
                        {getCityName(event)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#2d3748' }}>
                        ${event.price_per_person || 'N/A'} <span style={{ fontWeight: 400, color: '#a0aec0' }}>/ person</span> {event.event_ticket && `(${event.event_ticket})`}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#718096' }}>
                        Capacity: {event.min_people || 'N/A'} - {event.max_people || 'N/A'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Tooltip title={event.is_active ? "სტატუსი: აქტიური (დააწკაპუნეთ გასათიშად)" : "სტატუსი: არააქტიური (დააწკაპუნეთ გასააქტიურებლად)"}>
                        <Chip 
                          label={event.is_active ? 'Active' : 'Inactive'} 
                          clickable
                          onClick={() => handleToggleStatus(event)}
                          sx={{ 
                            backgroundColor: event.is_active ? '#c6f6d5' : '#fed7d7', 
                            color: event.is_active ? '#22543d' : '#822727', 
                            fontWeight: 700,
                            cursor: 'pointer',
                            '&:hover': { transform: 'scale(1.05)' }
                          }} 
                          size="small" 
                        />
                      </Tooltip>
                      {event.is_popular && <Chip label="Popular" sx={{ backgroundColor: '#feebc8', color: '#7b341e', fontWeight: 600 }} size="small" />}
                      {event.is_featured && <Chip label="Featured" sx={{ backgroundColor: '#eebafa', color: '#44337a', fontWeight: 600 }} size="small" />}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'center' }}>
                      {canUpdate && (
                        <Tooltip title={event.is_active ? "გათიშვა (ფრონტზე დამალვა)" : "გააქტიურება (ფრონტზე გამოჩენა)"}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleToggleStatus(event)} 
                            sx={{ 
                              color: event.is_active ? '#2e7d32' : '#d32f2f', 
                              backgroundColor: event.is_active ? '#e8f5e9' : '#ffebee', 
                              border: `1px solid ${event.is_active ? '#a5d6a7' : '#ef9a9a'}`,
                              '&:hover': { backgroundColor: event.is_active ? '#c8e6c9' : '#ffcdd2' } 
                            }}
                          >
                            {event.is_active ? <CheckCircleIcon fontSize="small" /> : <BlockIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      )}
                      {canRead && (
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => handleViewDetails(event)} sx={{ color: '#3182ce', backgroundColor: '#ebf8ff', '&:hover': { backgroundColor: '#bee3f8' } }}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canUpdate && (
                        <Tooltip title="Edit Event">
                          <IconButton size="small" onClick={() => handleOpenDialog(event)} sx={{ color: '#805ad5', backgroundColor: '#faf5ff', '&:hover': { backgroundColor: '#e9d8fd' } }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Add Image">
                        <IconButton size="small" onClick={() => handleAddImage(event)} sx={{ color: '#dd6b20', backgroundColor: '#fffff0', '&:hover': { backgroundColor: '#fefcbf' } }}>
                          <ImageIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {canDelete && (
                        <Tooltip title="Delete Event">
                          <IconButton size="small" onClick={() => handleDeleteEvent(event.id)} sx={{ color: '#e53e3e', backgroundColor: '#fff5f5', '&:hover': { backgroundColor: '#fed7d7' } }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Event Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingEvent ? 'Edit Event' : 'Add New Event'}
        </DialogTitle>
                <DialogContent sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ color: '#ff6b35', fontWeight: 'bold', mb: 2 }}>
              Event Information (Translations)
            </Typography>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs 
                value={activeLangTab} 
                onChange={(e, newValue) => setActiveLangTab(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                textColor="primary"
                indicatorColor="primary"
              >
                <Tab label="English" />
                <Tab label="Georgian (ქართული)" />
                <Tab label="Russian (Русский)" />
                <Tab label="Hindi (हिन्दी)" />
                <Tab label="Arabic (العربية)" />
                <Tab label="Hebrew (עברית)" />
                <Tab label="Turkish (Türkçe) 🇹🇷" />
                <Tab label="Armenian (Հայერენ) 🇦🇲" />
                <Tab label="Kazakh (Қазақша) 🇰🇿" />
                <Tab label="Ukrainian (Українська) 🇺🇦" />
                <Tab label="Chinese (中文) 🇨🇳" />
              </Tabs>
            </Box>
            
            {activeLangTab === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    placeholder="Event Name (English)"
                    value={formData.name_en || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleInputChange('name_en', val);
                      handleInputChange('name', val);
                    }}
                    required
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 2, color: '#666' }}>
                          📝
                        </Box>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:hover': {
                          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    placeholder="Description (English)"
                    value={formData.description_en || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleInputChange('description_en', val);
                      handleInputChange('description', val);
                    }}
                    multiline
                    rows={3}
                    required
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 2, color: '#666' }}>
                          📄
                        </Box>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:hover': {
                          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            )}

            {activeLangTab === 1 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    placeholder="Event Name (Georgian)"
                    value={formData.name_ka || ''}
                    onChange={(e) => handleInputChange('name_ka', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 2, color: '#666' }}>
                          📝
                        </Box>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:hover': {
                          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    placeholder="Description (Georgian)"
                    value={formData.description_ka || ''}
                    onChange={(e) => handleInputChange('description_ka', e.target.value)}
                    multiline
                    rows={3}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 2, color: '#666' }}>
                          📄
                        </Box>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:hover': {
                          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            )}

            {activeLangTab === 2 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    placeholder="Event Name (Russian)"
                    value={formData.name_ru || ''}
                    onChange={(e) => handleInputChange('name_ru', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 2, color: '#666' }}>
                          📝
                        </Box>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:hover': {
                          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    placeholder="Description (Russian)"
                    value={formData.description_ru || ''}
                    onChange={(e) => handleInputChange('description_ru', e.target.value)}
                    multiline
                    rows={3}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 2, color: '#666' }}>
                          📄
                        </Box>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:hover': {
                          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            )}

            {activeLangTab === 3 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    placeholder="Event Name (Hindi)"
                    value={formData.name_hi || ''}
                    onChange={(e) => handleInputChange('name_hi', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 2, color: '#666' }}>
                          📝
                        </Box>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:hover': {
                          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    placeholder="Description (Hindi)"
                    value={formData.description_hi || ''}
                    onChange={(e) => handleInputChange('description_hi', e.target.value)}
                    multiline
                    rows={3}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 2, color: '#666' }}>
                          📄
                        </Box>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:hover': {
                          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            )}

            {activeLangTab === 4 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    placeholder="Event Name (Arabic)"
                    value={formData.name_ar || ''}
                    onChange={(e) => handleInputChange('name_ar', e.target.value)}
                    inputProps={{ dir: 'rtl', style: { textAlign: 'right' } }}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 2, color: '#666' }}>
                          📝
                        </Box>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:hover': {
                          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    placeholder="Description (Arabic)"
                    value={formData.description_ar || ''}
                    onChange={(e) => handleInputChange('description_ar', e.target.value)}
                    multiline
                    rows={3}
                    inputProps={{ dir: 'rtl', style: { textAlign: 'right' } }}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 2, color: '#666' }}>
                          📄
                        </Box>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:hover': {
                          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            )}

            {activeLangTab === 5 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    placeholder="Event Name (Hebrew)"
                    value={formData.name_he || ''}
                    onChange={(e) => handleInputChange('name_he', e.target.value)}
                    inputProps={{ dir: 'rtl', style: { textAlign: 'right' } }}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 2, color: '#666' }}>
                          📝
                        </Box>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:hover': {
                          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    placeholder="Description (Hebrew)"
                    value={formData.description_he || ''}
                    onChange={(e) => handleInputChange('description_he', e.target.value)}
                    multiline
                    rows={3}
                    inputProps={{ dir: 'rtl', style: { textAlign: 'right' } }}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 2, color: '#666' }}>
                          📄
                        </Box>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:hover': {
                          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            )}

            {activeLangTab === 6 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    placeholder="Event Name (Turkish - Türkçe)"
                    value={formData.name_tr || ''}
                    onChange={(e) => handleInputChange('name_tr', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 2, color: '#666' }}>
                          🇹🇷
                        </Box>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.15)' },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    placeholder="Description (Turkish - Türkçe)"
                    value={formData.description_tr || ''}
                    onChange={(e) => handleInputChange('description_tr', e.target.value)}
                    multiline
                    rows={3}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 2, color: '#666' }}>
                          📄
                        </Box>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.15)' },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            )}

            {activeLangTab === 7 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    placeholder="Event Name (Armenian - Հայერენ)"
                    value={formData.name_hy || ''}
                    onChange={(e) => handleInputChange('name_hy', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 2, color: '#666' }}>
                          🇦🇲
                        </Box>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.15)' },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    placeholder="Description (Armenian - Հայერენ)"
                    value={formData.description_hy || ''}
                    onChange={(e) => handleInputChange('description_hy', e.target.value)}
                    multiline
                    rows={3}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 2, color: '#666' }}>
                          📄
                        </Box>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.15)' },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            )}

            {activeLangTab === 8 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    placeholder="Event Name (Kazakh - Қазақша)"
                    value={formData.name_kk || ''}
                    onChange={(e) => handleInputChange('name_kk', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 2, color: '#666' }}>
                          🇰🇿
                        </Box>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.15)' },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    placeholder="Description (Kazakh - Қазақша)"
                    value={formData.description_kk || ''}
                    onChange={(e) => handleInputChange('description_kk', e.target.value)}
                    multiline
                    rows={3}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 2, color: '#666' }}>
                          📄
                        </Box>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.15)' },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            )}

            {activeLangTab === 9 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    placeholder="Event Name (Ukrainian - Українська)"
                    value={formData.name_uk || ''}
                    onChange={(e) => handleInputChange('name_uk', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 2, color: '#666' }}>
                          🇺🇦
                        </Box>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.15)' },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    placeholder="Description (Ukrainian - Українська)"
                    value={formData.description_uk || ''}
                    onChange={(e) => handleInputChange('description_uk', e.target.value)}
                    multiline
                    rows={3}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 2, color: '#666' }}>
                          📄
                        </Box>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.15)' },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            )}

            {activeLangTab === 10 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    placeholder="Event Name (Chinese - 中文)"
                    value={formData.name_zh || ''}
                    onChange={(e) => handleInputChange('name_zh', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 2, color: '#666' }}>
                          🇨🇳
                        </Box>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.15)' },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    placeholder="Description (Chinese - 中文)"
                    value={formData.description_zh || ''}
                    onChange={(e) => handleInputChange('description_zh', e.target.value)}
                    multiline
                    rows={3}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 2, color: '#666' }}>
                          📄
                        </Box>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.15)' },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            )}
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ color: '#ff6b35', fontWeight: 'bold', mb: 2 }}>
              Company & Category
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Company</InputLabel>
                  <Select
                    value={formData.company_id}
                    onChange={(e) => handleInputChange('company_id', e.target.value)}
                    label="Company"
                    startAdornment={
                      <Box sx={{ mr: 2, color: '#666' }}>
                        🏢
                      </Box>
                    }
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:hover': {
                          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                        },
                      },
                    }}
                  >
                    {companies.length === 0 ? (
                      <MenuItem disabled>
                        <Typography variant="body2" color="text.secondary">
                          {loading ? 'Loading companies...' : 'No companies available'}
                        </Typography>
                      </MenuItem>
                    ) : (
                      companies.map((company) => (
                        <MenuItem key={company.id} value={company.id}>
                          {company.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    label="Category"
                    startAdornment={
                      <Box sx={{ mr: 2, color: '#666' }}>
                        🏷️
                      </Box>
                    }
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:hover': {
                          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                        },
                      },
                    }}
                  >
                    {loadingCompanyCategories ? (
                      <MenuItem disabled value="">
                        <Typography variant="body2" color="text.secondary">
                          Loading categories for company...
                        </Typography>
                      </MenuItem>
                    ) : (
                      ((formData.company_id && companyCategories.length > 0) ? companyCategories : categories).map((category) => (
                        <MenuItem key={category.id || category.category_id} value={category.id || category.category_id}>
                          {category.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={12}>
                <FormControl fullWidth>
                  <InputLabel>Ticket Type / Unit (Optional)</InputLabel>
                  <Select
                    value={formData.event_ticket || ''}
                    onChange={(e) => handleInputChange('event_ticket', e.target.value)}
                    label="Ticket Type / Unit (Optional)"
                    startAdornment={
                      <Box sx={{ mr: 2, color: '#666' }}>
                        🎫
                      </Box>
                    }
                  >
                    <MenuItem value="">None / Not Specified</MenuItem>
                    <MenuItem value="per 10 minutes">per 10 minutes</MenuItem>
                    <MenuItem value="per 15 minutes">per 15 minutes</MenuItem>
                    <MenuItem value="per 30 minutes">per 30 minutes</MenuItem>
                    <MenuItem value="per hour">per hour</MenuItem>
                    <MenuItem value="per 2 hours">per 2 hours</MenuItem>
                    <MenuItem value="per 3 hours">per 3 hours</MenuItem>
                    <MenuItem value="per 4 hours">per 4 hours</MenuItem>
                    <MenuItem value="per day">per day</MenuItem>
                    <MenuItem value="per week">per week</MenuItem>
                    <MenuItem value="per month">per month</MenuItem>
                    <MenuItem value="per year">per year</MenuItem>
                    <MenuItem value="per kilometer">per kilometer</MenuItem>
                    <MenuItem value="per room">per room</MenuItem>
                    <MenuItem value="per person">per person</MenuItem>
                    <MenuItem value="per car">per car</MenuItem>
                    <MenuItem value="per boat">per boat</MenuItem>
                    <MenuItem value="per driver">per driver</MenuItem>
                    <MenuItem value="per loop">per loop</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ color: '#ff6b35', fontWeight: 'bold', mb: 2 }}>
              Location & Pricing
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth required>
                  <InputLabel>City</InputLabel>
                  <Select
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    label="City"
                    startAdornment={
                      <Box sx={{ mr: 2, color: '#666' }}>
                        🏙️
                      </Box>
                    }
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:hover': {
                          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                        },
                      },
                    }}
                  >
                    {cities.map((city) => (
                      <MenuItem key={city.id} value={city.id}>
                        {city.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  placeholder="Price Per Person"
                  type="number"
                  value={formData.base_price}
                  onChange={(e) => handleInputChange('base_price', e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 2, color: '#666' }}>
                        💰
                      </Box>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  placeholder="Base Price"
                  type="number"
                  value={formData.price_per_person}
                  onChange={(e) => handleInputChange('price_per_person', e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 2, color: '#666' }}>
                        💵
                      </Box>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                      },
                    },
                  }}
                />
              </Grid>

              {/* Booking & Car Rental Options */}
              <Grid item xs={12}>
                <Box sx={{ mt: 2, mb: 1, p: 3, border: '2px solid #e0e7ff', borderRadius: 3, bgcolor: '#f8faff' }}>
                  <Typography variant="subtitle1" fontWeight={700} color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    🚗 დაჯავშნის & მანქანის ქირაობის პარამეტრები (Booking & Car Rental)
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth>
                        <InputLabel>დაჯავშნის ტიპი (Booking Mode)</InputLabel>
                        <Select
                          value={formData.booking_type || 'activity'}
                          label="დაჯავშნის ტიპი (Booking Mode)"
                          onChange={(e) => handleInputChange('booking_type', e.target.value)}
                          sx={{ borderRadius: 2, bgcolor: '#fff' }}
                        >
                          <MenuItem value="activity">🎟️ სტანდარტული ტური / ბილეთი</MenuItem>
                          <MenuItem value="time_slots">🕒 საათობრივი სლოტები (Upcoming Hours)</MenuItem>
                          <MenuItem value="car_rental">🚗 მანქანის გაქირავება (Car Rental / Daily)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {formData.booking_type === 'car_rental' && (
                      <>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="დღიური ფასი (Daily Rental ₾)"
                            type="number"
                            value={formData.daily_price || ''}
                            onChange={(e) => handleInputChange('daily_price', e.target.value)}
                            sx={{ borderRadius: 2, bgcolor: '#fff' }}
                            InputProps={{
                              startAdornment: <Box sx={{ mr: 1, color: '#666' }}>₾</Box>,
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="დეპოზიტი (Security Deposit ₾)"
                            type="number"
                            value={formData.deposit_amount || ''}
                            onChange={(e) => handleInputChange('deposit_amount', e.target.value)}
                            sx={{ borderRadius: 2, bgcolor: '#fff' }}
                            InputProps={{
                              startAdornment: <Box sx={{ mr: 1, color: '#666' }}>🛡️</Box>,
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <FormControl fullWidth>
                            <InputLabel>გადაცემათა კოლოფი</InputLabel>
                            <Select
                              value={formData.car_transmission || 'Automatic'}
                              label="გადაცემათა კოლოფი"
                              onChange={(e) => handleInputChange('car_transmission', e.target.value)}
                              sx={{ borderRadius: 2, bgcolor: '#fff' }}
                            >
                              <MenuItem value="Automatic">ავტომატიკა (Automatic)</MenuItem>
                              <MenuItem value="Manual">მექანიკა (Manual)</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <FormControl fullWidth>
                            <InputLabel>საწვავის ტიპი</InputLabel>
                            <Select
                              value={formData.car_fuel || 'Petrol'}
                              label="საწვავის ტიპი"
                              onChange={(e) => handleInputChange('car_fuel', e.target.value)}
                              sx={{ borderRadius: 2, bgcolor: '#fff' }}
                            >
                              <MenuItem value="Petrol">ბენზინი (Petrol)</MenuItem>
                              <MenuItem value="Diesel">დიზელი (Diesel)</MenuItem>
                              <MenuItem value="Hybrid">ჰიბრიდი (Hybrid)</MenuItem>
                              <MenuItem value="Electric">ელექტრო (Electric)</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="ადგილების რაოდენობა"
                            type="number"
                            value={formData.car_seats || '5'}
                            onChange={(e) => handleInputChange('car_seats', e.target.value)}
                            sx={{ borderRadius: 2, bgcolor: '#fff' }}
                          />
                        </Grid>
                      </>
                    )}

                    {(formData.booking_type === 'time_slots' || formData.booking_type === 'activity') && (
                      <>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="დაწყება (Start Time)"
                            type="time"
                            value={formData.working_hours_start || '09:00'}
                            onChange={(e) => handleInputChange('working_hours_start', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ borderRadius: 2, bgcolor: '#fff' }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="დასრულება (End Time)"
                            type="time"
                            value={formData.working_hours_end || '20:00'}
                            onChange={(e) => handleInputChange('working_hours_end', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ borderRadius: 2, bgcolor: '#fff' }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="სლოტის ხანგრძლივობა (წთ)"
                            type="number"
                            value={formData.slot_duration_mins || 60}
                            onChange={(e) => handleInputChange('slot_duration_mins', e.target.value)}
                            sx={{ borderRadius: 2, bgcolor: '#fff' }}
                          />
                        </Grid>

                        {/* Interactive Dynamic Time Slots & Custom Hour Pricing */}
                        <Grid item xs={12}>
                          <Box sx={{ mt: 2, p: 2.5, border: '1px solid #bfdbfe', borderRadius: 3, bgcolor: '#ffffff', boxShadow: '0 2px 8px rgba(37,99,235,0.06)' }}>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1.5, mb: 2 }}>
                              <Box>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#1e40af', display: 'flex', alignItems: 'center', gap: 1 }}>
                                  🕒 საათობრივი ტარიფები & სლოტები (Upcoming Hours & Dynamic Rates)
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  აირჩიეთ რამოდენიმე საათი და დაადეთ თითოეულს სასურველი ფასი
                                </Typography>
                              </Box>
                              <Stack direction="row" spacing={1} flexWrap="wrap">
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={handleGenerateTimeSlots}
                                  sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' }, textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
                                >
                                  ⚡ სლოტების ავტომატური დაგენერირება
                                </Button>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => handleAddTimeSlot()}
                                  sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
                                >
                                  ➕ საათის დამატება
                                </Button>
                              </Stack>
                            </Box>

                            {/* Quick Hour Add Chips */}
                            <Box sx={{ mb: 2.5, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
                              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                ⚡ სწრაფი საათების არჩევა (დააწკაპუნეთ დასამატებლად / ამოსაშლელად):
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                                {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'].map(hour => {
                                  const isAdded = (formData.time_slots || []).some(s => s.start_time === hour);
                                  return (
                                    <Chip
                                      key={hour}
                                      label={hour}
                                      size="small"
                                      clickable
                                      color={isAdded ? "primary" : "default"}
                                      variant={isAdded ? "filled" : "outlined"}
                                      onClick={() => handleToggleHourChip(hour)}
                                      sx={{ fontWeight: 600, fontSize: '0.82rem', px: 0.5 }}
                                    />
                                  );
                                })}
                              </Box>
                            </Box>

                            {/* List of Time Slots with Pricing */}
                            {(!formData.time_slots || formData.time_slots.length === 0) ? (
                              <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
                                <Typography variant="body2" color="text.secondary">
                                  ჯერ არ გაქვთ დამატებული კონკრეტული საათები. დააჭირეთ <strong>„⚡ სლოტების ავტომატური დაგენერირება“</strong>-ს ან აირჩიეთ ზედა საათებიდან.
                                </Typography>
                              </Box>
                            ) : (
                              <Stack spacing={1.5}>
                                {formData.time_slots.map((slot, sIdx) => (
                                  <Box
                                    key={sIdx}
                                    sx={{
                                      p: 2,
                                      borderRadius: 2,
                                      border: '1px solid #e2e8f0',
                                      bgcolor: sIdx % 2 === 0 ? '#f8fafc' : '#ffffff',
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                                    }}
                                  >
                                    <Grid container spacing={1.5} alignItems="center">
                                      <Grid item xs={6} sm={2}>
                                        <TextField
                                          fullWidth
                                          size="small"
                                          type="time"
                                          label="დაწყება"
                                          InputLabelProps={{ shrink: true }}
                                          value={slot.start_time || ''}
                                          onChange={(e) => handleTimeSlotChange(sIdx, 'start_time', e.target.value)}
                                          sx={{ bgcolor: '#fff' }}
                                        />
                                      </Grid>
                                      <Grid item xs={6} sm={2}>
                                        <TextField
                                          fullWidth
                                          size="small"
                                          type="time"
                                          label="დასრულება"
                                          InputLabelProps={{ shrink: true }}
                                          value={slot.end_time || ''}
                                          onChange={(e) => handleTimeSlotChange(sIdx, 'end_time', e.target.value)}
                                          sx={{ bgcolor: '#fff' }}
                                        />
                                      </Grid>
                                      <Grid item xs={6} sm={2.5}>
                                        <TextField
                                          fullWidth
                                          size="small"
                                          type="number"
                                          label="ფასი / ტარიფი (₾)"
                                          value={slot.price ?? ''}
                                          onChange={(e) => handleTimeSlotChange(sIdx, 'price', e.target.value)}
                                          placeholder="მაგ. 35"
                                          InputProps={{
                                            startAdornment: <InputAdornment position="start">₾</InputAdornment>
                                          }}
                                          sx={{ bgcolor: '#fff', '& input': { fontWeight: 700 } }}
                                        />
                                      </Grid>
                                      <Grid item xs={6} sm={2}>
                                        <TextField
                                          fullWidth
                                          size="small"
                                          type="number"
                                          label="ზრდასრული (₾)"
                                          value={slot.adult_price ?? ''}
                                          onChange={(e) => handleTimeSlotChange(sIdx, 'adult_price', e.target.value)}
                                          placeholder="არასავალდ."
                                          sx={{ bgcolor: '#fff' }}
                                        />
                                      </Grid>
                                      <Grid item xs={6} sm={2}>
                                        <TextField
                                          fullWidth
                                          size="small"
                                          type="number"
                                          label="ბავშვი (₾)"
                                          value={slot.child_price ?? ''}
                                          onChange={(e) => handleTimeSlotChange(sIdx, 'child_price', e.target.value)}
                                          placeholder="არასავალდ."
                                          sx={{ bgcolor: '#fff' }}
                                        />
                                      </Grid>
                                      <Grid item xs={6} sm={1.5} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                        <IconButton
                                          size="small"
                                          color="error"
                                          onClick={() => handleRemoveTimeSlot(sIdx)}
                                          title="წაშლა"
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </Grid>
                                      <Grid item xs={12}>
                                        <TextField
                                          fullWidth
                                          size="small"
                                          placeholder="სლოტის აღწერა/ლეიბლი (მაგ. დილის ტარიფი, Sunset საღამო, VIP სესია)"
                                          value={slot.slot_label || ''}
                                          onChange={(e) => handleTimeSlotChange(sIdx, 'slot_label', e.target.value)}
                                          sx={{ bgcolor: '#fff' }}
                                        />
                                      </Grid>
                                    </Grid>
                                  </Box>
                                ))}
                              </Stack>
                            )}
                          </Box>
                        </Grid>
                      </>
                    )}
                  </Grid>
                </Box>
              </Grid>

              {/* SEO Configurations */}
              <Grid item xs={12}>
                <Box sx={{ mt: 2, mb: 1, p: 2.5, border: '1px dashed #ccc', borderRadius: 3, bgcolor: '#fafafa' }}>
                  <Typography variant="subtitle1" fontWeight={600} color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    🔍 Search Engine Optimization (SEO)
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="SEO Title Override (Optional)"
                        placeholder="Search engine title display"
                        value={formData.seo_title || ''}
                        onChange={(e) => handleInputChange('seo_title', e.target.value)}
                        helperText="Provide a custom SEO title or leave blank to auto-generate."
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="SEO Meta Description Override (Optional)"
                        placeholder="Search engine result description snippet"
                        value={formData.seo_description || ''}
                        onChange={(e) => handleInputChange('seo_description', e.target.value)}
                        helperText="Provide a custom SEO description or leave blank to auto-generate."
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              {/* Media & Video Configurations */}
              <Grid item xs={12}>
                <Box sx={{ mt: 2, mb: 1, p: 2.5, border: '1px dashed #ccc', borderRadius: 3, bgcolor: '#fafafa' }}>
                  <Typography variant="subtitle1" fontWeight={600} color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    🎥 Media & Video (Optional)
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="YouTube Video Link"
                        placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                        value={formData.youtube_link || ''}
                        onChange={(e) => handleInputChange('youtube_link', e.target.value)}
                        helperText="Provide a YouTube URL to embed a video player on the event details page."
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          },
                        }}
                      />
                      {(() => {
                        const videoId = getYouTubeVideoId(formData.youtube_link);
                        if (!videoId) return null;
                        const previewThumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                        return (
                          <Box sx={{ mt: 2, display: 'flex', gap: 2, p: 1.5, border: '1px dashed #ff6b35', borderRadius: 2, bgcolor: '#fffdfb', alignItems: 'center' }}>
                            <Box sx={{ width: 120, height: 68, borderRadius: 1, overflow: 'hidden', position: 'relative', bgcolor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <img src={previewThumbnail} alt="YouTube Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.2)' }}>
                                <span style={{ fontSize: '24px', color: '#fff' }}>▶</span>
                              </Box>
                            </Box>
                            <Box>
                              <Typography variant="body2" fontWeight="bold" color="text.primary">YouTube Video Preview</Typography>
                              <Typography variant="caption" color="text.secondary">Video ID: {videoId}</Typography>
                            </Box>
                          </Box>
                        );
                      })()}
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              {/* Dynamic Age-Based Pricing Editor */}
              <Grid item xs={12}>
                <Box sx={{ mt: 2, mb: 1, p: 2.5, border: '1px dashed #ccc', borderRadius: 3, bgcolor: '#fafafa' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle1" fontWeight={600} color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      👶 Dynamic Age-Based Pricing (Optional)
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleAddAgePrice}
                      startIcon={<span>➕</span>}
                      sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                      Add Age Price
                    </Button>
                  </Box>

                  {(!formData.age_prices || formData.age_prices.length === 0) ? (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                      No custom age prices defined. This event will use the standard Base Price.
                    </Typography>
                  ) : (
                    <Box display="flex" flexDirection="column" gap={2}>
                      {formData.age_prices.map((ap, idx) => {
                        const nameWidth = isSpecialActivity ? 2 : 3;
                        const ageWidth = isSpecialActivity ? 1.5 : 2.5;
                        const priceWidth = isSpecialActivity ? 2 : 3;
                        const timeWidth = 2;
                        return (
                          <Grid container spacing={2} key={idx} alignItems="center">
                            <Grid item xs={12} sm={nameWidth}>
                              <TextField
                                fullWidth
                                size="small"
                                placeholder="Category Name"
                                value={ap.category_name || ''}
                                onChange={(e) => handleAgePriceChange(idx, 'category_name', e.target.value)}
                                required
                              />
                            </Grid>
                            <Grid item xs={6} sm={ageWidth}>
                              <TextField
                                fullWidth
                                size="small"
                                type="number"
                                placeholder="Min Age"
                                value={ap.min_age === '' ? '' : ap.min_age}
                                onChange={(e) => handleAgePriceChange(idx, 'min_age', e.target.value)}
                                required
                                inputProps={{ min: 0 }}
                              />
                            </Grid>
                            <Grid item xs={6} sm={ageWidth}>
                              <TextField
                                fullWidth
                                size="small"
                                type="number"
                                placeholder="Max Age"
                                value={ap.max_age === '' ? '' : ap.max_age}
                                onChange={(e) => handleAgePriceChange(idx, 'max_age', e.target.value)}
                                required
                                inputProps={{ min: 0 }}
                              />
                            </Grid>
                            {isSpecialActivity && (
                              <>
                                <Grid item xs={6} sm={timeWidth}>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    type="time"
                                    label="Start"
                                    InputLabelProps={{ shrink: true }}
                                    value={ap.start_time || ''}
                                    onChange={(e) => handleAgePriceChange(idx, 'start_time', e.target.value)}
                                    required
                                  />
                                </Grid>
                                <Grid item xs={6} sm={timeWidth}>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    type="time"
                                    label="End"
                                    InputLabelProps={{ shrink: true }}
                                    value={ap.end_time || ''}
                                    onChange={(e) => handleAgePriceChange(idx, 'end_time', e.target.value)}
                                    required
                                  />
                                </Grid>
                              </>
                            )}
                            <Grid item xs={10} sm={priceWidth}>
                              <TextField
                                fullWidth
                                size="small"
                                type="number"
                                placeholder="Price ($)"
                                value={ap.price === '' ? '' : ap.price}
                                onChange={(e) => handleAgePriceChange(idx, 'price', e.target.value)}
                                required
                                inputProps={{ min: 0, step: 0.01 }}
                              />
                            </Grid>
                            <Grid item xs={2} sm={1} textAlign="center">
                              <Button 
                                color="error" 
                                onClick={() => handleRemoveAgePrice(idx)}
                                sx={{ minWidth: 0, p: 1 }}
                              >
                                ❌
                              </Button>
                            </Grid>
                          </Grid>
                        );
                      })}
                    </Box>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  placeholder="Min People"
                  type="number"
                  value={formData.min_people}
                  onChange={(e) => handleInputChange('min_people', e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 2, color: '#666' }}>
                        👥
                      </Box>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  placeholder="Max People"
                  type="number"
                  value={formData.max_people}
                  onChange={(e) => handleInputChange('max_people', e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 2, color: '#666' }}>
                        👥
                      </Box>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  placeholder="Location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 2, color: '#666' }}>
                        📍
                      </Box>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                      },
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ color: '#ff6b35', fontWeight: 'bold', mb: 2 }}>
              Coordinates
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  placeholder="Latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Limit to 9 digits total
                    if (value.length <= 9) {
                      handleInputChange('latitude', value);
                    }
                  }}
                  helperText="Max 9 digits total"
                  required
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 2, color: '#666' }}>
                        🌐
                      </Box>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  placeholder="Longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Limit to 9 digits total
                    if (value.length <= 9) {
                      handleInputChange('longitude', value);
                    }
                  }}
                  helperText="Max 9 digits total"
                  required
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 2, color: '#666' }}>
                        🌐
                      </Box>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  startIcon={<MapIcon />}
                  onClick={handleOpenMapPicker}
                  sx={{
                    borderColor: '#ff6b35',
                    color: '#ff6b35',
                    '&:hover': {
                      borderColor: '#e55a2b',
                      backgroundColor: '#fff5f2',
                    },
                  }}
                >
                  Pick Location on Map
                </Button>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ color: '#ff6b35', fontWeight: 'bold', mb: 2 }}>
              Event Image
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {editingEvent
                ? 'Optional. Upload a new image to add to this event. Existing images are not replaced.'
                : 'Optional. Upload an image to attach when the event is created.'}
            </Typography>

            <Box sx={{ mb: 2 }}>
              <input
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                style={{ display: 'none' }}
                id="event-form-image-upload"
                type="file"
                onChange={handleFormImageChange}
              />
              <label htmlFor="event-form-image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  sx={{
                    py: 2,
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    '&:hover': { borderStyle: 'dashed', borderWidth: 2 }
                  }}
                >
                  {formData.image ? (
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body1" color="primary">
                        {formData.image.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {(formData.image.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center' }}>
                      <ImageIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                      <Typography variant="body1">Click to select an image</Typography>
                      <Typography variant="body2" color="text.secondary">
                        PNG, JPEG, GIF, WebP — max 10MB
                      </Typography>
                    </Box>
                  )}
                </Button>
              </label>
              {formData.image && (
                <Button
                  size="small"
                  color="error"
                  sx={{ mt: 1 }}
                  onClick={() => setFormData(prev => ({ ...prev, image: null }))}
                >
                  Remove selected image
                </Button>
              )}
            </Box>

            {formData.image && (
              <>
                <TextField
                  fullWidth
                  label="Alternative Text"
                  placeholder="Describe the image for accessibility (defaults to event name)"
                  value={formData.image_alt_text}
                  onChange={(e) => handleInputChange('image_alt_text', e.target.value)}
                  multiline
                  rows={2}
                  sx={{ mb: 2 }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.image_is_primary}
                      onChange={(e) => handleInputChange('image_is_primary', e.target.checked)}
                    />
                  }
                  label="Set as primary image"
                />
              </>
            )}
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ color: '#ff6b35', fontWeight: 'bold', mb: 2 }}>
              Event Settings
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.is_popular}
                      onChange={(e) => handleInputChange('is_popular', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Is Popular"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.is_active}
                      onChange={(e) => handleInputChange('is_active', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Is Active"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.is_featured}
                      onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Is Featured"
                />
              </Grid>
            </Grid>
          </Box>

        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingEvent ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Map Picker Modal */}
      <MapPicker
        open={openMapPicker}
        onClose={handleCloseMapPicker}
        onLocationSelect={handleLocationSelect}
        initialLocation={{
          lat: formData.latitude ? parseFloat(formData.latitude) : 41.6500,
          lng: formData.longitude ? parseFloat(formData.longitude) : 41.6333
        }}
        height="500px"
      />

      {/* Image Upload Modal */}
      <Dialog open={imageModalOpen} onClose={handleImageModalClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ImageIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h6">
              Upload Image for "{selectedEvent?.name}"
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload an image for this event. Supported formats: PNG, JPEG, GIF, WebP (max 10MB)
            </Typography>
            
            {/* File Upload */}
            <Box sx={{ mb: 3 }}>
              <input
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                style={{ display: 'none' }}
                id="image-upload"
                type="file"
                onChange={handleImageFileChange}
              />
              <label htmlFor="image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  sx={{ 
                    py: 2,
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    '&:hover': {
                      borderStyle: 'dashed',
                      borderWidth: 2,
                    }
                  }}
                >
                  {imageUploadData.image ? (
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body1" color="primary">
                        {imageUploadData.image.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {(imageUploadData.image.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center' }}>
                      <ImageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                      <Typography variant="body1">
                        Click to select image file
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        or drag and drop
                      </Typography>
                    </Box>
                  )}
                </Button>
              </label>
            </Box>

            {/* Alt Text */}
            <TextField
              fullWidth
              label="Alternative Text"
              placeholder="Describe the image for accessibility"
              value={imageUploadData.alt_text}
              onChange={(e) => setImageUploadData(prev => ({
                ...prev,
                alt_text: e.target.value
              }))}
              multiline
              rows={2}
              required
              sx={{ mb: 3 }}
            />

            {/* Primary Image Checkbox */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={imageUploadData.is_primary}
                  onChange={(e) => setImageUploadData(prev => ({
                    ...prev,
                    is_primary: e.target.checked
                  }))}
                />
              }
              label="Set as primary image"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Primary images are displayed as the main event image
            </Typography>
          </Box>

          {/* Upload Progress */}
          {imageUploading && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Uploading image...
              </Typography>
              <LinearProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleImageModalClose} disabled={imageUploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleImageUpload} 
            variant="contained"
            disabled={!imageUploadData.image || !imageUploadData.alt_text.trim() || imageUploading}
            startIcon={<ImageIcon />}
          >
            {imageUploading ? 'Uploading...' : 'Upload Image'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Event Details Modal */}
      <Dialog open={detailsModalOpen} onClose={handleCloseDetailsModal} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EventIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h5">
              Event Details
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {detailsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : eventDetails ? (
            <Box>
              {/* Basic Information */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ color: '#ff6b35', fontWeight: 'bold', mb: 2 }}>
                  Basic Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <EventIcon sx={{ mr: 2, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {eventDetails.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ID: {eventDetails.id}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <LocationIcon sx={{ mr: 2, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="body1" fontWeight="bold">
                          {eventDetails.location}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {getCityName(eventDetails)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {eventDetails.description}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* SEO Information */}
              {(eventDetails.seo_title || eventDetails.seo_description) && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ color: '#ff6b35', fontWeight: 'bold', mb: 2 }}>
                    SEO Meta Configurations
                  </Typography>
                  <Grid container spacing={2}>
                    {eventDetails.seo_title && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                          SEO Title:
                        </Typography>
                        <Typography variant="body1">
                          {eventDetails.seo_title}
                        </Typography>
                      </Grid>
                    )}
                    {eventDetails.seo_description && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                          SEO Description:
                        </Typography>
                        <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                          {eventDetails.seo_description}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}

              {/* Pricing Information */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ color: '#ff6b35', fontWeight: 'bold', mb: 2 }}>
                  Pricing & Capacity
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <Card sx={{ p: 2, textAlign: 'center' }}>
                      <MoneyIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                      <Typography variant="h6" fontWeight="bold">
                        ${eventDetails.base_price} {eventDetails.event_ticket && `(${eventDetails.event_ticket})`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Base Price
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card sx={{ p: 2, textAlign: 'center' }}>
                      <MoneyIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                      <Typography variant="h6" fontWeight="bold">
                        ${eventDetails.discounted_price || eventDetails.price_per_person}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Current Price
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card sx={{ p: 2, textAlign: 'center' }}>
                      <PeopleIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                      <Typography variant="h6" fontWeight="bold">
                        {eventDetails.min_people || 'N/A'} - {eventDetails.max_people || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        People Capacity
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
                {((eventDetails.age_prices && eventDetails.age_prices.length > 0) || eventDetails.adult_price || eventDetails.child_price || eventDetails.infant_price) && (
                  <Box sx={{ mt: 3, mb: 1, p: 2, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fafafa' }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, color: 'primary.main' }}>
                      Age-Specific Prices
                    </Typography>
                    <Grid container spacing={2}>
                      {eventDetails.age_prices && eventDetails.age_prices.length > 0 ? (
                        eventDetails.age_prices.map((ap, idx) => (
                          <Grid item xs={12} sm={4} key={ap.id || idx}>
                            <Typography variant="body2" color="text.secondary">
                              {ap.category_name || 'Standard'} (Ages {ap.min_age ?? 0}-{ap.max_age ?? 99}){ap.start_time && ap.end_time && ` [${String(ap.start_time).substring(0, 5)} - ${String(ap.end_time).substring(0, 5)}]`}: <strong>${(parseFloat(ap.price) || 0).toFixed(2)}</strong>
                            </Typography>
                          </Grid>
                        ))
                      ) : (
                        <>
                          {eventDetails.adult_price && (
                            <Grid item xs={12} sm={4}>
                              <Typography variant="body2" color="text.secondary">Adult Price: <strong>${eventDetails.adult_price}</strong></Typography>
                            </Grid>
                          )}
                          {eventDetails.child_price && (
                            <Grid item xs={12} sm={4}>
                              <Typography variant="body2" color="text.secondary">Child Price: <strong>${eventDetails.child_price}</strong></Typography>
                            </Grid>
                          )}
                          {eventDetails.infant_price && (
                            <Grid item xs={12} sm={4}>
                              <Typography variant="body2" color="text.secondary">Infant Price: <strong>${eventDetails.infant_price}</strong></Typography>
                            </Grid>
                          )}
                        </>
                      )}
                    </Grid>
                  </Box>
                )}
              </Box>

              {/* Discount Information */}
              {eventDetails.current_discount && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ color: '#ff6b35', fontWeight: 'bold', mb: 2 }}>
                    Current Discount
                  </Typography>
                  <Card sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body1">
                          <strong>Type:</strong> {eventDetails.current_discount.discount_type}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body1">
                          <strong>Value:</strong> {eventDetails.current_discount.discount_value}
                          {eventDetails.current_discount.discount_type === 'percentage' ? '%' : '$'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body1">
                          <strong>Valid Until:</strong> {eventDetails.current_discount.valid_until ? 
                            new Date(eventDetails.current_discount.valid_until).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body1">
                          <strong>Savings:</strong> ${eventDetails.base_price - eventDetails.discounted_price}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Card>
                </Box>
              )}

              {/* Statistics */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ color: '#ff6b35', fontWeight: 'bold', mb: 2 }}>
                  Statistics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TrendingUpIcon sx={{ mr: 2, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {eventDetails.views_count || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Views
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PeopleIcon sx={{ mr: 2, color: 'success.main' }} />
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {eventDetails.bookings_count || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Bookings
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <StarIcon sx={{ mr: 2, color: 'warning.main' }} />
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {eventDetails.is_popular ? 'Yes' : 'No'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Popular
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Category & Company */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ color: '#ff6b35', fontWeight: 'bold', mb: 2 }}>
                  Category & Company
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ p: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                        Category
                      </Typography>
                      <Typography variant="body1">
                        {getCategoryName(eventDetails)}
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ p: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                        Company
                      </Typography>
                      <Typography variant="body1">
                        {getCompanyName(eventDetails)}
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              </Box>

              {/* Location & Coordinates */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ color: '#ff6b35', fontWeight: 'bold', mb: 2 }}>
                  Location & Coordinates
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ p: 2, border: '2px solid #1976d2', backgroundColor: '#f3f8ff' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <LocationIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                        <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                          Latitude
                        </Typography>
                      </Box>
                      <Typography variant="h6" fontWeight="bold" color="primary.main">
                        {eventDetails.latitude || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Geographic latitude coordinate
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ p: 2, border: '2px solid #9c27b0', backgroundColor: '#faf5ff' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <LocationIcon sx={{ mr: 1, color: 'secondary.main', fontSize: 20 }} />
                        <Typography variant="subtitle1" fontWeight="bold" color="secondary.main">
                          Longitude
                        </Typography>
                      </Box>
                      <Typography variant="h6" fontWeight="bold" color="secondary.main">
                        {eventDetails.longitude || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Geographic longitude coordinate
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12}>
                    <Card sx={{ p: 2, backgroundColor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <MapIcon sx={{ mr: 1, color: 'text.primary', fontSize: 20 }} />
                          <Typography variant="subtitle1" fontWeight="bold">
                            Full Coordinates
                          </Typography>
                        </Box>
                        {eventDetails.latitude && eventDetails.longitude && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleCopyCoordinates(eventDetails.latitude, eventDetails.longitude)}
                            sx={{ 
                              minWidth: 'auto',
                              px: 2,
                              py: 0.5,
                              fontSize: '0.75rem'
                            }}
                          >
                            Copy
                          </Button>
                        )}
                      </Box>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '1.1rem', mb: 1 }}>
                        {eventDetails.latitude && eventDetails.longitude 
                          ? `${eventDetails.latitude}, ${eventDetails.longitude}`
                          : 'Coordinates not available'
                        }
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {eventDetails.latitude && eventDetails.longitude 
                          ? 'Click "Copy" to copy coordinates to clipboard for use in mapping applications'
                          : 'No coordinates available for this event'
                        }
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              </Box>

              {/* Status Flags */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ color: '#ff6b35', fontWeight: 'bold', mb: 2 }}>
                  Status Flags
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <Card sx={{ p: 2, textAlign: 'center' }}>
                      <StarIcon sx={{ fontSize: 40, color: eventDetails.is_popular ? 'warning.main' : 'grey.400', mb: 1 }} />
                      <Typography variant="h6" fontWeight="bold" color={eventDetails.is_popular ? 'warning.main' : 'text.secondary'}>
                        {eventDetails.is_popular ? 'Yes' : 'No'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Popular
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card sx={{ p: 2, textAlign: 'center' }}>
                      <CheckCircleIcon sx={{ fontSize: 40, color: eventDetails.is_active ? 'success.main' : 'grey.400', mb: 1 }} />
                      <Typography variant="h6" fontWeight="bold" color={eventDetails.is_active ? 'success.main' : 'text.secondary'}>
                        {eventDetails.is_active ? 'Yes' : 'No'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Active
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card sx={{ p: 2, textAlign: 'center' }}>
                      <FeaturedIcon sx={{ fontSize: 40, color: eventDetails.is_featured ? 'primary.main' : 'grey.400', mb: 1 }} />
                      <Typography variant="h6" fontWeight="bold" color={eventDetails.is_featured ? 'primary.main' : 'text.secondary'}>
                        {eventDetails.is_featured ? 'Yes' : 'No'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Featured
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              </Box>

              {/* Timestamps */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ color: '#ff6b35', fontWeight: 'bold', mb: 2 }}>
                  Timestamps
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ p: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                        Created At
                      </Typography>
                      <Typography variant="body1">
                        {eventDetails.created_at ? new Date(eventDetails.created_at).toLocaleString() : 'N/A'}
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ p: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                        Updated At
                      </Typography>
                      <Typography variant="body1">
                        {eventDetails.updated_at ? new Date(eventDetails.updated_at).toLocaleString() : 'N/A'}
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              </Box>

              {/* Images */}
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#ff6b35', fontWeight: 'bold' }}>
                    Event Images ({(() => {
                      const images = eventDetails.images || eventDetails.event_images || [];
                      console.log('Admin - Images count - eventDetails.images:', eventDetails.images);
                      console.log('Admin - Images count - eventDetails.event_images:', eventDetails.event_images);
                      console.log('Admin - Images count - final:', images.length);
                      return images.length;
                    })()})
                  </Typography>
                  {canCreate && (
                    <Button
                      variant="outlined"
                      startIcon={<ImageIcon />}
                      onClick={() => handleAddImage(eventDetails)}
                      size="small"
                    >
                      Add Image
                    </Button>
                  )}
                </Box>
                
                {(() => {
                  const images = eventDetails.images || eventDetails.event_images || [];
                  console.log('Admin - Rendering images section. Images array:', images);
                  return images.length > 0 ? (
                  <Grid container spacing={2}>
                    {images.map((image, index) => {
                      console.log('Admin - Rendering image:', image, 'index:', index);
                      return (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card sx={{ 
                          p: 2, 
                          position: 'relative',
                          border: image.is_primary ? '2px solid #1976d2' : '1px solid #e0e0e0',
                          '&:hover': {
                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                            transform: 'translateY(-2px)',
                            transition: 'all 0.2s ease-in-out'
                          }
                        }}>
                          {/* Primary Image Badge */}
                          {image.is_primary && (
                            <Chip 
                              label="Primary Image" 
                              color="primary" 
                              size="small" 
                              sx={{ 
                                position: 'absolute', 
                                top: 8, 
                                right: 8, 
                                zIndex: 1,
                                fontWeight: 'bold'
                              }} 
                            />
                          )}
                          
                          {/* Image */}
                          <Box sx={{ position: 'relative', mb: 2 }}>
                            <img
                              src={getImageUrl(image.image)}
                              alt={image.alt_text || 'Event image'}
                              style={{
                                width: '100%',
                                height: 200,
                                objectFit: 'cover',
                                borderRadius: 8,
                                cursor: 'pointer'
                              }}
                              onError={(e) => {
                                console.error('Image load error:', image.image, e);
                                e.target.style.display = 'none';
                              }}
                              onClick={() => {
                                const imageUrl = getImageUrl(image.image);
                                if (imageUrl) window.open(imageUrl, '_blank');
                              }}
                            />
                            
                            {/* Image Overlay on Hover */}
                            <Box sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: 'rgba(0,0,0,0.5)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: 0,
                              transition: 'opacity 0.2s ease-in-out',
                              borderRadius: 8,
                              '&:hover': {
                                opacity: 1
                              }
                            }}>
                              <Typography variant="body2" color="white" fontWeight="bold">
                                Click to view full size
                              </Typography>
                            </Box>
                          </Box>
                          
                          {/* Image Info */}
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              <strong>Alt Text:</strong> {image.alt_text || 'No description'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              <strong>ID:</strong> {image.id}
                            </Typography>
                          </Box>
                          
                          {/* Action Buttons */}
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            {canUpdate && (
                              <Tooltip title="Edit Image">
                                <IconButton 
                                  size="small" 
                                  color="primary"
                                  onClick={() => handleEditImage(image, eventDetails.id)}
                                >
                                  <EditImageIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {canDelete && (
                              <Tooltip title="Delete Image">
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => handleDeleteImage(image.id, eventDetails.id)}
                                >
                                  <DeleteImageIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </Card>
                      </Grid>
                      );
                    })}
                  </Grid>
                  ) : (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 4, 
                    border: '2px dashed #e0e0e0', 
                    borderRadius: 2,
                    bgcolor: '#fafafa'
                  }}>
                    <ImageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                      No Images Yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Add images to make your event more attractive
                    </Typography>
                    {canCreate && (
                      <Button
                        variant="contained"
                        startIcon={<ImageIcon />}
                        onClick={() => handleAddImage(eventDetails)}
                      >
                        Add First Image
                      </Button>
                    )}
                  </Box>
                );
                })()}
              </Box>

              {/* Creation Date */}
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Created: {eventDetails.created_at ? new Date(eventDetails.created_at).toLocaleDateString() : 'N/A'}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Typography variant="body1" color="text.secondary">
              No event details available
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDetailsModal} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Update Modal */}
      <Dialog open={imageUpdateModalOpen} onClose={handleCloseImageUpdateModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EditImageIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h6">
              Update Image
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedImageForUpdate && (
            <Box>
              {/* Current Image Preview */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Current Image:
                </Typography>
                <img
                  src={`${selectedImageForUpdate.image}`}
                  alt={selectedImageForUpdate.alt_text || 'Event image'}
                  style={{
                    width: '100%',
                    maxHeight: 200,
                    objectFit: 'cover',
                    borderRadius: 8,
                    border: '1px solid #e0e0e0'
                  }}
                />
              </Box>

              {/* Alt Text */}
              <TextField
                fullWidth
                label="Alternative Text"
                placeholder="Describe the image for accessibility"
                value={imageUpdateData.alt_text}
                onChange={(e) => setImageUpdateData(prev => ({
                  ...prev,
                  alt_text: e.target.value
                }))}
                multiline
                rows={2}
                required
                sx={{ mb: 3 }}
              />

              {/* Primary Image Checkbox */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={imageUpdateData.is_primary}
                    onChange={(e) => setImageUpdateData(prev => ({
                      ...prev,
                      is_primary: e.target.checked
                    }))}
                  />
                }
                label="Set as primary image"
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Primary images are displayed as the main event image
              </Typography>

              {/* Update Progress */}
              {imageUpdating && (
                <Box sx={{ mb: 2, mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Updating image...
                  </Typography>
                  <LinearProgress />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseImageUpdateModal} disabled={imageUpdating}>
            Cancel
          </Button>
          <Button 
            onClick={handleImageUpdate} 
            variant="contained"
            disabled={!imageUpdateData.alt_text.trim() || imageUpdating}
            startIcon={<EditImageIcon />}
          >
            {imageUpdating ? 'Updating...' : 'Update Image'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Events;
