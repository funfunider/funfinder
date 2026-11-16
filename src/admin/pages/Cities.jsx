import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  Chip,
  Stack,
  InputAdornment,
  alpha,
} from '@mui/material';
import { 
  LocationCity as CityIcon, 
  Add as AddIcon, 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Public as CountryIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { cityApi, countryApi } from '../services/api';
import createAxiosInstance from '../services/axios';

const Cities = () => {
  const { canCreate, canUpdate, canDelete, canRead, isAuthenticated } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const [activeLangTab, setActiveLangTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [newCity, setNewCity] = useState({
    name: '',
    name_en: '',
    name_ka: '',
    name_ru: '',
    name_hi: '',
    name_ar: '',
    name_he: '',
    city_id: null,
    country_id: 1,
    is_active: true,
    population: 0
  });

  // API data
  const [cities, setCities] = useState([]);
  const [countries, setCountries] = useState([]);
  const [search, setSearch] = useState('');

  const axiosInstance = createAxiosInstance();

  // Fetch cities and countries on component mount
  useEffect(() => {
    fetchCities();
    fetchCountries();
  }, []);

  // Fetch cities from API
  const fetchCities = async () => {
    try {
      setLoading(true);
      console.log('Fetching cities from API...');
      const response = await cityApi.getAll();
      console.log('Cities API response:', response);
      
      let citiesData = [];
      if (Array.isArray(response)) {
        citiesData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        citiesData = response.data;
      } else if (response && response.results && Array.isArray(response.results)) {
        citiesData = response.results;
      } else {
        console.warn('Unexpected cities API response format:', response);
        citiesData = [];
      }
      
      setCities(citiesData);
    } catch (error) {
      console.error('Error fetching cities:', error);
      setSnackbar({
        open: true,
        message: `Error fetching cities: ${error.response?.data?.detail || error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch countries from API
  const fetchCountries = async () => {
    try {
      console.log('Fetching countries from API...');
      const response = await countryApi.getAll();
      console.log('Countries API response:', response);
      
      let countriesData = [];
      if (Array.isArray(response)) {
        countriesData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        countriesData = response.data;
      } else if (response && response.results && Array.isArray(response.results)) {
        countriesData = response.results;
      } else {
        console.warn('Unexpected countries API response format:', response);
        countriesData = [];
      }
      
      setCountries(countriesData);
    } catch (error) {
      console.error('Error fetching countries:', error);
      setSnackbar({
        open: true,
        message: `Error fetching countries: ${error.response?.data?.detail || error.message}`,
        severity: 'error'
      });
    }
  };

  // Function to get country name from country ID or city object
  const getCountryName = (countryIdOrObj) => {
    if (!countryIdOrObj) return 'Georgia';
    if (typeof countryIdOrObj === 'object') {
      return countryIdOrObj.name || countryIdOrObj.name_en || countryIdOrObj.name_ka || 'Georgia';
    }
    const country = countries.find(c => Number(c.id) === Number(countryIdOrObj));
    return country ? (country.name || country.name_en || 'Georgia') : 'Georgia';
  };

  const handleOpenDialog = (city = null) => {
    setActiveLangTab(0);
    if (city) {
      setEditingCity(city);
      setNewCity({
        name: city.name || '',
        name_en: city.name_en || city.name || '',
        name_ka: city.name_ka || '',
        name_ru: city.name_ru || '',
        name_hi: city.name_hi || '',
        name_ar: city.name_ar || '',
        name_he: city.name_he || '',
        country_id: city.country_id || city.country?.id || (typeof city.country === 'number' ? city.country : 1),
        is_active: city.is_active || true,
        population: city.population || 0,
        city_id: city.city_id || city.id || null
      });
    } else {
      setEditingCity(null);
      setNewCity({
        name: '',
        name_en: '',
        name_ka: '',
        name_ru: '',
        name_hi: '',
        name_ar: '',
        name_he: '',
        country_id: countries.length > 0 ? countries[0].id : '',
        is_active: true,
        population: 0,
        city_id: null
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCity(null);
    setActiveLangTab(0);
    setNewCity({
      name: '',
      name_en: '',
      name_ka: '',
      name_ru: '',
      name_hi: '',
      name_ar: '',
      name_he: '',
      country_id: countries.length > 0 ? countries[0].id : '',
      is_active: true,
      population: 0,
      city_id: null
    });
  };

  const handleInputChange = (field, value) => {
    setNewCity(prev => ({
      ...prev,
      [field]: field === 'country_id' ? parseInt(value) : value
    }));
  };

  const handleTranslationChange = (nameField, val) => {
    setNewCity(prev => ({
      ...prev,
      [nameField]: val,
      ...(nameField === 'name_en' ? { name: val } : {})
    }));
  };

  const handleSubmit = async () => {
    if (!newCity.name || !newCity.country_id || newCity.population === undefined || newCity.population === null) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields.',
        severity: 'warning'
      });
      return;
    }

    try {
      const cityData = {
        ...newCity,
        name: newCity.name.trim(),
        name_en: (newCity.name_en || newCity.name || '').trim(),
        name_ka: (newCity.name_ka || '').trim(),
        name_ru: (newCity.name_ru || '').trim(),
        name_hi: (newCity.name_hi || '').trim(),
        name_ar: (newCity.name_ar || '').trim(),
        name_he: (newCity.name_he || '').trim()
      };

      console.log('Saving city with data:', cityData);
      console.log('Editing city:', editingCity);
      
      if (editingCity) {
        // Update existing city
        console.log('Updating existing city...');
        await cityApi.update(cityData);
        setSnackbar({
          open: true,
          message: 'City updated successfully!',
          severity: 'success'
        });
      } else {
        // Create new city
        console.log('Creating new city...');
        await cityApi.create(cityData);
        setSnackbar({
          open: true,
          message: 'City created successfully!',
          severity: 'success'
        });
      }
      
      handleCloseDialog();
      // Refresh cities list
      await fetchCities();
    } catch (error) {
      console.error('Error saving city:', error);
      setSnackbar({
        open: true,
        message: `Error saving city: ${error.response?.data?.detail || error.message}`,
        severity: 'error'
      });
    }
  };

  const handleDeleteCity = async (cityId) => {
    if (window.confirm('Are you sure you want to delete this city?')) {
      try {
        await cityApi.delete(cityId);
        setSnackbar({
          open: true,
          message: 'City deleted successfully!',
          severity: 'success'
        });
        // Refresh cities list
        await fetchCities();
      } catch (error) {
        console.error('Error deleting city:', error);
        setSnackbar({
          open: true,
          message: `Error deleting city: ${error.response?.data?.detail || error.message}`,
          severity: 'error'
        });
      }
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="textSecondary">
          Authentication required. Please login first.
        </Typography>
      </Box>
    );
  }

  const filteredCities = cities.filter((city) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const countryName = String(city.country?.name || getCountryName(city.country_id || city.country) || '').toLowerCase();
    return (
      (city.name || '').toLowerCase().includes(q) ||
      (city.name_ka || '').toLowerCase().includes(q) ||
      countryName.includes(q)
    );
  });

  return (
    <Box>
      <PageHeader
        title="Cities"
        subtitle="Manage activity destinations, regions, and regional hubs"
        icon={<CityIcon />}
        breadcrumbs={[{ label: 'Catalog' }, { label: 'Cities' }]}
        actions={
          <>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchCities}
              disabled={loading}
            >
              Refresh
            </Button>
            {canCreate && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Add City
              </Button>
            )}
          </>
        }
      />

      {/* Search Filter Bar */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
        <CardContent sx={{ py: 2 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', md: 'center' }}
            justifyContent="space-between"
          >
            <TextField
              placeholder="Search cities by Georgian, English name, or country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: { xs: '100%', md: 420 } }}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch('')}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
            {cities.length > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Showing {filteredCities.length} of {cities.length} cities
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
      
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" color="textSecondary">
            Loading cities...
          </Typography>
        </Box>
      ) : filteredCities.length === 0 ? (
        <Card sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <CityIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
          <Typography variant="h6" color="textSecondary">
            {cities.length === 0 ? 'No cities found. Add your first city to get started.' : 'No cities match your search.'}
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredCities.map((city) => {
            const countryName = city.country?.name || getCountryName(city.country_id || city.country) || 'Georgia';
            return (
              <Grid item xs={12} sm={6} md={4} key={city.id || city.city_id}>
                <Card
                  sx={{
                    borderRadius: 3.5,
                    overflow: 'hidden',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.25s cubic-bezier(0.2, 0, 0, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 16px 32px rgba(2, 132, 199, 0.12)',
                      borderColor: 'rgba(2, 132, 199, 0.35)',
                    },
                  }}
                >
                  {/* Top Gradient Banner */}
                  <Box
                    sx={{
                      p: 2.5,
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: 2.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'rgba(255, 255, 255, 0.2)',
                          backdropFilter: 'blur(8px)',
                        }}
                      >
                        <CityIcon sx={{ fontSize: 24, color: '#ffffff' }} />
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
                          {city.name}
                        </Typography>
                        {city.name_ka && city.name_ka !== city.name && (
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', fontWeight: 500 }}>
                            {city.name_ka}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Chip
                      label={city.is_active ? 'Active' : 'Inactive'}
                      size="small"
                      sx={{
                        bgcolor: city.is_active ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        backdropFilter: 'blur(4px)',
                      }}
                    />
                  </Box>

                  {/* Body Content */}
                  <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Stack spacing={1.5} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CountryIcon sx={{ fontSize: 18, color: '#0284c7' }} />
                        <Typography variant="body2" color="text.secondary">
                          Country: <b style={{ color: '#0f172a' }}>{countryName}</b>
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PeopleIcon sx={{ fontSize: 18, color: '#0284c7' }} />
                        <Typography variant="body2" color="text.secondary">
                          Population: <b style={{ color: '#0f172a' }}>{city.population ? Number(city.population).toLocaleString() : 'N/A'}</b>
                        </Typography>
                      </Box>
                    </Stack>

                    <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      {canUpdate && (
                        <Tooltip title="Edit City">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(city)}
                            sx={{
                              bgcolor: 'rgba(2, 132, 199, 0.08)',
                              color: '#0284c7',
                              '&:hover': { bgcolor: 'rgba(2, 132, 199, 0.18)' },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip title="Delete City">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteCity(city.id || city.city_id)}
                            sx={{
                              bgcolor: 'rgba(239, 68, 68, 0.08)',
                              color: '#ef4444',
                              '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.18)' },
                            }}
                          >
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
      )}

      {/* Add/Edit City Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCity ? 'Edit City' : 'Add New City'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
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
              <TextField
                label="City Name (English)"
                fullWidth
                value={newCity.name_en || ''}
                onChange={(e) => handleTranslationChange('name_en', e.target.value)}
                required
                autoFocus
              />
            )}

            {activeLangTab === 1 && (
              <TextField
                label="City Name (Georgian)"
                fullWidth
                value={newCity.name_ka || ''}
                onChange={(e) => handleTranslationChange('name_ka', e.target.value)}
              />
            )}

            {activeLangTab === 2 && (
              <TextField
                label="City Name (Russian)"
                fullWidth
                value={newCity.name_ru || ''}
                onChange={(e) => handleTranslationChange('name_ru', e.target.value)}
              />
            )}

            {activeLangTab === 3 && (
              <TextField
                label="City Name (Hindi)"
                fullWidth
                value={newCity.name_hi || ''}
                onChange={(e) => handleTranslationChange('name_hi', e.target.value)}
              />
            )}

            {activeLangTab === 4 && (
              <TextField
                label="City Name (Arabic)"
                fullWidth
                value={newCity.name_ar || ''}
                onChange={(e) => handleTranslationChange('name_ar', e.target.value)}
                inputProps={{ dir: 'rtl', style: { textAlign: 'right' } }}
              />
            )}

            {activeLangTab === 5 && (
              <TextField
                label="City Name (Hebrew)"
                fullWidth
                value={newCity.name_he || ''}
                onChange={(e) => handleTranslationChange('name_he', e.target.value)}
                inputProps={{ dir: 'rtl', style: { textAlign: 'right' } }}
              />
            )}

            {activeLangTab === 6 && (
              <TextField
                label="City Name (Turkish - Türkçe)"
                fullWidth
                value={newCity.name_tr || ''}
                onChange={(e) => handleTranslationChange('name_tr', e.target.value)}
              />
            )}

            {activeLangTab === 7 && (
              <TextField
                label="City Name (Armenian - Հայერენ)"
                fullWidth
                value={newCity.name_hy || ''}
                onChange={(e) => handleTranslationChange('name_hy', e.target.value)}
              />
            )}

            {activeLangTab === 8 && (
              <TextField
                label="City Name (Kazakh - Қазақша)"
                fullWidth
                value={newCity.name_kk || ''}
                onChange={(e) => handleTranslationChange('name_kk', e.target.value)}
              />
            )}

            {activeLangTab === 9 && (
              <TextField
                label="City Name (Ukrainian - Українська)"
                fullWidth
                value={newCity.name_uk || ''}
                onChange={(e) => handleTranslationChange('name_uk', e.target.value)}
              />
            )}

            {activeLangTab === 10 && (
              <TextField
                label="City Name (Chinese - 中文)"
                fullWidth
                value={newCity.name_zh || ''}
                onChange={(e) => handleTranslationChange('name_zh', e.target.value)}
              />
            )}

            <FormControl fullWidth>
              <InputLabel>Country</InputLabel>
              <Select
                value={newCity.country_id}
                label="Country"
                onChange={(e) => handleInputChange('country_id', e.target.value)}
                required
                disabled={countries.length === 0}
              >
                {countries.length === 0 ? (
                  <MenuItem disabled>Loading countries...</MenuItem>
                ) : (
                  countries.map((country) => (
                    <MenuItem key={country.id} value={country.id}>
                      {country.name}
                    </MenuItem>
                  ))
                )}
              </Select>
              {countries.length === 0 && (
                <Typography variant="caption" color="textSecondary">
                  Loading countries...
                </Typography>
              )}
            </FormControl>
            <TextField
              label="Population"
              fullWidth
              type="number"
              value={newCity.population}
              onChange={(e) => handleInputChange('population', parseInt(e.target.value) || 0)}
              required
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={newCity.is_active ? 'Active' : 'Inactive'}
                label="Status"
                onChange={(e) => handleInputChange('is_active', e.target.value === 'Active')}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCity ? 'Update' : 'Add'} City
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Cities;
