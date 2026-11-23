import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Alert,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Place as PlaceIcon,
  CheckCircle as CheckCircleIcon,
  Map as MapIcon
} from '@mui/icons-material';
import InteractiveMap from '../../components/InteractiveMap';

/**
 * Map Picker Component for Admin Panel
 * Uses 100% Free OpenStreetMap & Leaflet — Zero API keys required!
 */
const MapPicker = ({ 
  open,
  onClose,
  onLocationSelect,
  initialLocation = { lat: 41.6500, lng: 41.6333 },
  height = '500px'
}) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [manualCoords, setManualCoords] = useState({ lat: '', lng: '' });

  // Reset and initialize when dialog opens/closes
  useEffect(() => {
    if (open) {
      const initialLat = initialLocation?.lat ? parseFloat(initialLocation.lat) : 41.6500;
      const initialLng = initialLocation?.lng ? parseFloat(initialLocation.lng) : 41.6333;

      const initLoc = {
        lat: initialLat,
        lng: initialLng,
        address: `Selected (${initialLat.toFixed(5)}, ${initialLng.toFixed(5)})`
      };
      setSelectedLocation(initLoc);
      setManualCoords({
        lat: initialLat.toString(),
        lng: initialLng.toString()
      });
    } else {
      setSelectedLocation(null);
    }
  }, [open, initialLocation?.lat, initialLocation?.lng]);

  const handleMapLocationSelect = (loc) => {
    if (!loc) return;
    const lat = typeof loc.lat === 'number' ? loc.lat : parseFloat(loc.lat);
    const lng = typeof loc.lng === 'number' ? loc.lng : parseFloat(loc.lng);
    
    const formatted = {
      lat,
      lng,
      address: loc.address || loc.fullAddress || `კოორდინატები: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      fullAddress: loc.fullAddress || loc.address || ''
    };

    setSelectedLocation(formatted);
    setManualCoords({
      lat: lat.toFixed(6),
      lng: lng.toFixed(6)
    });
  };

  const handleConfirm = () => {
    if (selectedLocation && onLocationSelect) {
      onLocationSelect(selectedLocation);
      onClose();
    }
  };

  const handleApplyManual = () => {
    const lat = parseFloat(manualCoords.lat);
    const lng = parseFloat(manualCoords.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      const loc = {
        lat,
        lng,
        address: `ხელით მითითებული (${lat.toFixed(5)}, ${lng.toFixed(5)})`
      };
      setSelectedLocation(loc);
      if (onLocationSelect) {
        onLocationSelect(loc);
        onClose();
      }
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        m: 0, 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #3A1D94 0%, #87003A 100%)',
        color: '#fff'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MapIcon sx={{ color: '#fff' }} />
          <Typography variant="h6" component="div" sx={{ fontWeight: 700, color: '#fff' }}>
            ლოკაციის შერჩევა რუკაზე
          </Typography>
          <Chip 
            label="OpenStreetMap" 
            size="small" 
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600, ml: 1 }}
          />
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2, bgcolor: '#f8fafc' }}>
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
          დააწკაპუნეთ რუკაზე სასურველ ადგილას ან გამოიყენეთ ძიება. კოორდინატები ავტომატურად შეივსება.
        </Alert>

        {/* The OpenStreetMap Leaflet Component */}
        <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: 1 }}>
          <InteractiveMap
            center={{
              lat: initialLocation?.lat ? parseFloat(initialLocation.lat) : 41.6500,
              lng: initialLocation?.lng ? parseFloat(initialLocation.lng) : 41.6333
            }}
            onLocationSelect={handleMapLocationSelect}
            height={height}
            showSearch={true}
            showControls={true}
            zoom={13}
          />
        </Box>

        {/* Selected Coordinates Card */}
        <Card sx={{ mt: 2, borderRadius: 2, border: '1px solid #e2e8f0' }} elevation={0}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PlaceIcon sx={{ color: '#87003A' }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                    არჩეული კოორდინატები:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    {selectedLocation 
                      ? `${selectedLocation.lat?.toFixed(6)}, ${selectedLocation.lng?.toFixed(6)}`
                      : 'მონიშნეთ ადგილი რუკაზე'}
                  </Typography>
                  {selectedLocation?.address && (
                    <Typography variant="caption" sx={{ color: '#3A1D94', fontWeight: 600 }}>
                      {selectedLocation.address}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Manual inputs if user wants to tweak */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  label="განედი (Lat)"
                  size="small"
                  value={manualCoords.lat}
                  onChange={(e) => setManualCoords(prev => ({ ...prev, lat: e.target.value }))}
                  sx={{ width: 130 }}
                />
                <TextField
                  label="გრძედი (Lng)"
                  size="small"
                  value={manualCoords.lng}
                  onChange={(e) => setManualCoords(prev => ({ ...prev, lng: e.target.value }))}
                  sx={{ width: 130 }}
                />
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={handleApplyManual}
                  sx={{ color: '#3A1D94', borderColor: '#3A1D94' }}
                >
                  მითითება
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2, bgcolor: '#f8fafc', gap: 1 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          გაუქმება
        </Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          disabled={!selectedLocation}
          startIcon={<CheckCircleIcon />}
          sx={{
            background: 'linear-gradient(135deg, #3A1D94 0%, #87003A 100%)',
            color: '#fff',
            fontWeight: 700,
            px: 3,
            '&:hover': {
              background: 'linear-gradient(135deg, #2e1675 0%, #69002d 100%)'
            }
          }}
        >
          ლოკაციის დადასტურება
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MapPicker;
