import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Map as MapIcon,
  CheckCircle as CheckCircleIcon,
  Place as PlaceIcon
} from '@mui/icons-material';
import InteractiveMap from './InteractiveMap';

/**
 * Universal Map Picker Component
 * Uses Leaflet & OpenStreetMap (100% Free, zero API key dependencies)
 */
const MapPicker = ({ 
  open, 
  onClose, 
  onLocationSelect,
  initialLocation = { lat: 41.6500, lng: 41.6333 },
  currentLocation = null 
}) => {
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    if (open) {
      const lat = currentLocation?.latitude || initialLocation?.lat || 41.6500;
      const lng = currentLocation?.longitude || initialLocation?.lng || 41.6333;
      setSelectedLocation({
        lat,
        lng,
        address: `Selected (${lat.toFixed(5)}, ${lng.toFixed(5)})`
      });
    } else {
      setSelectedLocation(null);
    }
  }, [open, currentLocation, initialLocation]);

  const handleLocationSelect = (loc) => {
    if (!loc) return;
    const lat = typeof loc.lat === 'number' ? loc.lat : parseFloat(loc.lat);
    const lng = typeof loc.lng === 'number' ? loc.lng : parseFloat(loc.lng);
    setSelectedLocation({
      lat,
      lng,
      address: loc.address || loc.fullAddress || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      fullAddress: loc.fullAddress || loc.address || ''
    });
  };

  const handleConfirm = () => {
    if (selectedLocation && onLocationSelect) {
      onLocationSelect({
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        address: selectedLocation.address,
        fullAddress: selectedLocation.fullAddress || selectedLocation.address
      });
      onClose();
    }
  };

  const centerCoords = {
    lat: currentLocation?.latitude || initialLocation?.lat || 41.6500,
    lng: currentLocation?.longitude || initialLocation?.lng || 41.6333
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, overflow: 'hidden' }
      }}
    >
      <DialogTitle sx={{
        background: 'linear-gradient(135deg, #3A1D94 0%, #87003A 100%)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <MapIcon sx={{ color: '#fff' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff' }}>
            მდებარეობის შერჩევა
          </Typography>
          <Chip label="OpenStreetMap" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', ml: 1 }} />
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: '#fff' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 2, bgcolor: '#f8fafc' }}>
        <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: 1 }}>
          <InteractiveMap
            center={centerCoords}
            onLocationSelect={handleLocationSelect}
            currentLocation={currentLocation}
            height="480px"
            showSearch={true}
            showControls={true}
          />
        </Box>

        {selectedLocation && (
          <Box sx={{ mt: 2, p: 1.5, bgcolor: '#fff', borderRadius: 2, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
            <PlaceIcon sx={{ color: '#87003A' }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                არჩეული ლოკაცია: {selectedLocation.address}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                განედი: {selectedLocation.lat?.toFixed(6)}, გრძედი: {selectedLocation.lng?.toFixed(6)}
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2, bgcolor: '#f8fafc', gap: 1 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          გაუქმება
        </Button>
        <Button 
          variant="contained" 
          onClick={handleConfirm}
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
          შერჩევა და დადასტურება
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MapPicker;
