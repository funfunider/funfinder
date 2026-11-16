import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  IconButton,
  Alert,
  CircularProgress,
  Fab,
  DialogContentText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  InputAdornment,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  Public as CountryIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import { countryApi } from '../services/api';

const Countries = () => {
  const [countries, setCountries] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingCountry, setEditingCountry] = useState(null);
  const [deleteCountryId, setDeleteCountryId] = useState(null);
  const [activeLangTab, setActiveLangTab] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
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
    is_active: true,
  });

  // Load countries on component mount
  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching countries...');
      const response = await countryApi.getAll();
      console.log('Countries response:', response);
      
      let countriesList = [];
      if (Array.isArray(response)) {
        countriesList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        countriesList = response.data;
      } else if (response?.results && Array.isArray(response.results)) {
        countriesList = response.results;
      }
      
      console.log('Processed countries list:', countriesList);
      setCountries(countriesList);
    } catch (error) {
      console.error('Error fetching countries:', error);
      setError('Failed to load countries. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (country = null) => {
    setError(null); // Clear any previous errors
    setActiveLangTab(0);
    if (country) {
      setEditingCountry(country);
      setFormData({
        name: country.name || '',
        name_en: country.name_en || country.name || '',
        name_ka: country.name_ka || '',
        name_ru: country.name_ru || '',
        name_hi: country.name_hi || '',
        name_ar: country.name_ar || '',
        name_he: country.name_he || '',
        name_tr: country.name_tr || '',
        name_hy: country.name_hy || '',
        name_kk: country.name_kk || '',
        name_uk: country.name_uk || '',
        name_zh: country.name_zh || '',
        is_active: country.is_active !== undefined ? country.is_active : true,
      });
    } else {
      setEditingCountry(null);
      setFormData({
        name: '',
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
        is_active: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCountry(null);
    setActiveLangTab(0);
    setFormData({
      name: '',
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
      is_active: true,
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTranslationChange = (nameField, val) => {
    setFormData(prev => ({
      ...prev,
      [nameField]: val,
      ...(nameField === 'name_en' ? { name: val } : {})
    }));
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.name || formData.name.trim() === '') {
        setError('Please fill in the country name.');
        return;
      }

      // Prepare data according to API specification
      const countryData = {
        name: formData.name.trim(),
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
        is_active: formData.is_active
      };
      
      console.log('Country data to send:', countryData);
      
      if (editingCountry) {
        // Update existing country - include country_id in request body for PATCH
        const updateData = {
          ...countryData,
          country_id: editingCountry.country_id || editingCountry.id
        };
        
        console.log('Updating country with data:', updateData);
        const response = await countryApi.update(updateData);
        console.log('Country update response:', response);
        
        setCountries(countries.map(country => 
          (country.country_id || country.id) === (editingCountry.country_id || editingCountry.id)
            ? { ...country, ...response.data || response }
            : country
        ));
      } else {
        // Create new country using PATCH method - let API auto-generate country_id
        const createData = {
          ...countryData
          // country_id will be auto-generated by API
        };
        
        console.log('Creating country with data:', createData);
        const response = await countryApi.create(createData);
        console.log('Country create response:', response);
        
        setCountries([...countries, response.data || response]);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving country:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.response?.data?.error ||
                          error.message;
      
      setError(`Failed to ${editingCountry ? 'update' : 'create'} country: ${errorMessage}`);
    }
  };

  const handleDeleteClick = (countryId) => {
    setDeleteCountryId(countryId);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await countryApi.delete(deleteCountryId);
      setCountries(countries.filter(country => 
        (country.country_id || country.id) !== deleteCountryId
      ));
      setOpenDeleteDialog(false);
      setDeleteCountryId(null);
    } catch (error) {
      console.error('Error deleting country:', error);
      setError(`Failed to delete country: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleDeleteCancel = () => {
    setOpenDeleteDialog(false);
    setDeleteCountryId(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const filteredCountries = countries.filter((country) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (country.name || '').toLowerCase().includes(q) ||
      (country.name_ka || '').toLowerCase().includes(q) ||
      String(country.country_id || country.id || '').includes(q)
    );
  });

  return (
    <Box>
      <PageHeader
        title="Countries"
        subtitle="Manage country destinations and international availability"
        icon={<CountryIcon />}
        breadcrumbs={[{ label: 'Catalog' }, { label: 'Countries' }]}
        actions={
          <>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchCountries}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Country
            </Button>
          </>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

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
              placeholder="Search countries by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: { xs: '100%', md: 380 } }}
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
            {countries.length > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Showing {filteredCountries.length} of {countries.length} countries
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      {filteredCountries.length === 0 ? (
        <Card sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <CountryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
          <Typography variant="h6" color="textSecondary">
            {countries.length === 0 ? 'No countries found. Add your first country.' : 'No countries match your search.'}
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredCountries.map((country) => (
            <Grid item xs={12} sm={6} md={4} key={country.country_id || country.id}>
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
                    boxShadow: '0 16px 32px rgba(109, 40, 217, 0.12)',
                    borderColor: 'rgba(109, 40, 217, 0.35)',
                  },
                }}
              >
                {/* Header Banner */}
                <Box
                  sx={{
                    p: 2.5,
                    background: 'linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)',
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
                      <CountryIcon sx={{ fontSize: 24, color: '#ffffff' }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
                        {country.name}
                      </Typography>
                      {country.name_ka && country.name_ka !== country.name && (
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', fontWeight: 500 }}>
                          {country.name_ka}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Chip
                    label={country.is_active ? 'Active' : 'Inactive'}
                    size="small"
                    sx={{
                      bgcolor: country.is_active ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      backdropFilter: 'blur(4px)',
                    }}
                  />
                </Box>

                {/* Content */}
                <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Country Code / ID: <b style={{ color: '#0f172a' }}>#{country.country_id || country.id}</b>
                  </Typography>

                  <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Tooltip title="Edit Country">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(country)}
                        sx={{
                          bgcolor: 'rgba(109, 40, 217, 0.08)',
                          color: '#6d28d9',
                          '&:hover': { bgcolor: 'rgba(109, 40, 217, 0.18)' },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Country">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(country.country_id || country.id)}
                        sx={{
                          bgcolor: 'rgba(239, 68, 68, 0.08)',
                          color: '#ef4444',
                          '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.18)' },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add/Edit Country Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCountry ? 'Edit Country' : 'Add New Country'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
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
                fullWidth
                label="Country Name (English)"
                value={formData.name_en || ''}
                onChange={(e) => handleTranslationChange('name_en', e.target.value)}
                margin="normal"
                required
                autoFocus
                helperText="Required field"
              />
            )}

            {activeLangTab === 1 && (
              <TextField
                fullWidth
                label="Country Name (Georgian)"
                value={formData.name_ka || ''}
                onChange={(e) => handleTranslationChange('name_ka', e.target.value)}
                margin="normal"
              />
            )}

            {activeLangTab === 2 && (
              <TextField
                fullWidth
                label="Country Name (Russian)"
                value={formData.name_ru || ''}
                onChange={(e) => handleTranslationChange('name_ru', e.target.value)}
                margin="normal"
              />
            )}

            {activeLangTab === 3 && (
              <TextField
                fullWidth
                label="Country Name (Hindi)"
                value={formData.name_hi || ''}
                onChange={(e) => handleTranslationChange('name_hi', e.target.value)}
                margin="normal"
              />
            )}

            {activeLangTab === 4 && (
              <TextField
                fullWidth
                label="Country Name (Arabic)"
                value={formData.name_ar || ''}
                onChange={(e) => handleTranslationChange('name_ar', e.target.value)}
                margin="normal"
                inputProps={{ dir: 'rtl', style: { textAlign: 'right' } }}
              />
            )}

            {activeLangTab === 5 && (
              <TextField
                fullWidth
                label="Country Name (Hebrew)"
                value={formData.name_he || ''}
                onChange={(e) => handleTranslationChange('name_he', e.target.value)}
                margin="normal"
                inputProps={{ dir: 'rtl', style: { textAlign: 'right' } }}
              />
            )}

            {activeLangTab === 6 && (
              <TextField
                fullWidth
                label="Country Name (Turkish - Türkçe)"
                value={formData.name_tr || ''}
                onChange={(e) => handleTranslationChange('name_tr', e.target.value)}
                margin="normal"
              />
            )}

            {activeLangTab === 7 && (
              <TextField
                fullWidth
                label="Country Name (Armenian - Հայერენ)"
                value={formData.name_hy || ''}
                onChange={(e) => handleTranslationChange('name_hy', e.target.value)}
                margin="normal"
              />
            )}

            {activeLangTab === 8 && (
              <TextField
                fullWidth
                label="Country Name (Kazakh - Қазақша)"
                value={formData.name_kk || ''}
                onChange={(e) => handleTranslationChange('name_kk', e.target.value)}
                margin="normal"
              />
            )}

            {activeLangTab === 9 && (
              <TextField
                fullWidth
                label="Country Name (Ukrainian - Українська)"
                value={formData.name_uk || ''}
                onChange={(e) => handleTranslationChange('name_uk', e.target.value)}
                margin="normal"
              />
            )}

            {activeLangTab === 10 && (
              <TextField
                fullWidth
                label="Country Name (Chinese - 中文)"
                value={formData.name_zh || ''}
                onChange={(e) => handleTranslationChange('name_zh', e.target.value)}
                margin="normal"
              />
            )}
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.value)}
                label="Status"
              >
                <MenuItem value={true}>Active</MenuItem>
                <MenuItem value={false}>Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCountry ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this country? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Countries;
