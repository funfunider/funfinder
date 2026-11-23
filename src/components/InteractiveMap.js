import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  Stack,
  Paper,
  alpha
} from '@mui/material';
import {
  MyLocation,
  Search,
  Place,
  Navigation,
  ZoomIn,
  ZoomOut,
  CenterFocusStrong,
  CheckCircle,
  Layers,
  ContentCopy
} from '@mui/icons-material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom modern SVG marker pin matching FunFinder colors
const createCustomPin = (color = '#3A1D94') => {
  return L.divIcon({
    className: 'funfinder-map-pin',
    html: `
      <div style="
        background: linear-gradient(135deg, ${color} 0%, #6E3FF3 100%);
        width: 34px;
        height: 34px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 6px 16px rgba(58,29,148,0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2.5px solid #ffffff;
      ">
        <div style="
          width: 10px;
          height: 10px;
          background: #ffffff;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34]
  });
};

const userLocationPin = L.divIcon({
  className: 'funfinder-user-pin',
  html: `
    <div style="
      background: #3B82F6;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
      border: 3px solid #ffffff;
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10]
});

/**
 * Interactive OpenStreetMap Component
 * 100% Free, zero API keys required, works reliably every single time!
 */
const InteractiveMap = ({
  center = { lat: 41.6500, lng: 41.6333 }, // Default: Batumi / Georgia
  onLocationSelect,
  currentLocation = null,
  height = '480px',
  showSearch = true,
  showControls = true,
  zoom = 13,
  style = {}
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const userMarkerRef = useRef(null);

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(center);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [mapType, setMapType] = useState('osm'); // 'osm' | 'hot' | 'topo'
  const [copied, setCopied] = useState(false);

  // 100% Free OpenStreetMap tile layers (NO API Key required, NO watermarks)
  const tileLayers = {
    osm: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    hot: {
      url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors, Humanitarian OpenStreetMap Team'
    },
    topo: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenTopoMap &copy; OpenStreetMap'
    }
  };

  const tileLayerRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = center?.lat ?? 41.6500;
      const initialLng = center?.lng ?? 41.6333;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: currentZoom,
        zoomControl: false // Using our custom control buttons
      });

      const initialLayer = L.tileLayer(tileLayers.osm.url, {
        attribution: tileLayers.osm.attribution,
        maxZoom: 19
      }).addTo(map);

      tileLayerRef.current = initialLayer;
      mapInstanceRef.current = map;

      // Handle Map Click to place marker and reverse geocode
      map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        handleSelectCoordinates(lat, lng, true);
      });

      map.on('zoomend', () => {
        setCurrentZoom(map.getZoom());
      });

      // Force Leaflet to recalculate size after mount
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
      setTimeout(() => {
        map.invalidateSize();
      }, 500);

      const resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      if (mapContainerRef.current) {
        resizeObserver.observe(mapContainerRef.current);
      }

      window.addEventListener('resize', () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle tile layer change
  useEffect(() => {
    if (mapInstanceRef.current && tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
      const newLayer = L.tileLayer(tileLayers[mapType].url, {
        attribution: tileLayers[mapType].attribution,
        maxZoom: 19
      }).addTo(mapInstanceRef.current);
      tileLayerRef.current = newLayer;
    }
  }, [mapType]);

  // Handle user current location
  useEffect(() => {
    if (currentLocation && mapInstanceRef.current) {
      const lat = currentLocation.latitude || currentLocation.lat;
      const lng = currentLocation.longitude || currentLocation.lng;
      if (lat && lng) {
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([lat, lng]);
        } else {
          userMarkerRef.current = L.marker([lat, lng], {
            icon: userLocationPin
          }).addTo(mapInstanceRef.current)
            .bindPopup('<b>თქვენი მდებარეობა</b>');
        }
      }
    }
  }, [currentLocation]);

  // Core coordinate selection handler
  const handleSelectCoordinates = async (lat, lng, updateMap = false) => {
    if (!mapInstanceRef.current) return;

    // Place or move marker
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], {
        icon: createCustomPin('#3A1D94')
      }).addTo(mapInstanceRef.current);
    }

    if (updateMap) {
      mapInstanceRef.current.panTo([lat, lng]);
    }

    // Set initial location object
    let locationData = {
      lat,
      lng,
      latitude: lat,
      longitude: lng,
      address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      yandexFormat: `${lng},${lat}`
    };

    setSelectedLocation(locationData);
    if (onLocationSelect) {
      onLocationSelect(locationData);
    }

    // Reverse geocode via free OpenStreetMap Nominatim
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: { 'Accept-Language': 'ka,en' }
      });
      const data = await res.json();
      if (data && data.display_name) {
        locationData = {
          ...locationData,
          address: data.display_name,
          city: data.address?.city || data.address?.town || data.address?.village || data.address?.state || '',
          country: data.address?.country || 'Georgia'
        };
        setSelectedLocation(locationData);
        if (markerRef.current) {
          markerRef.current.bindPopup(`
            <div style="font-family: sans-serif; font-size: 13px; line-height: 1.4;">
              <strong style="color: #3A1D94;">შერჩეული მდებარეობა:</strong><br>
              ${data.display_name}<br>
              <span style="color: #64748B; font-size: 11px;">${lat.toFixed(5)}, ${lng.toFixed(5)}</span>
            </div>
          `).openPopup();
        }
        if (onLocationSelect) {
          onLocationSelect(locationData);
        }
      }
    } catch (err) {
      console.warn('Reverse geocode note:', err);
    }
  };

  // Search places via free OpenStreetMap Nominatim
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setSearchResults([]);

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=ge,am,tr,az&limit=5&addressdetails=1`, {
        headers: { 'Accept-Language': 'ka,en' }
      });
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 15);
    }
    handleSelectCoordinates(lat, lng, false);
    setSearchResults([]);
    setSearchQuery(result.display_name);
  };

  const handleCurrentLocationClick = () => {
    if (navigator.geolocation && mapInstanceRef.current) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          mapInstanceRef.current.setView([lat, lng], 15);
          handleSelectCoordinates(lat, lng, false);
        },
        (err) => {
          alert('მდებარეობის დაფიქსირება ვერ მოხერხდა. ჩართეთ GPS თქვენს მოწყობილობაში.');
        }
      );
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleResetCenter = () => {
    if (mapInstanceRef.current) {
      const c = center || { lat: 41.6500, lng: 41.6333 };
      mapInstanceRef.current.setView([c.lat, c.lng], 13);
    }
  };

  const handleCopyCoords = () => {
    if (selectedLocation) {
      navigator.clipboard.writeText(`${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', height, minHeight: height, borderRadius: 3, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', ...style }}>
      {/* Map Container */}
      <Box
        ref={mapContainerRef}
        sx={{
          width: '100%',
          height: '100%',
          minHeight: height,
          zIndex: 1,
          '& .leaflet-container': {
            width: '100%',
            height: '100%',
            minHeight: height
          },
          '& .leaflet-popup-content-wrapper': {
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            border: '1px solid #E2E8F0'
          }
        }}
      />

      {/* Floating Search Bar */}
      {showSearch && (
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            right: { xs: 16, sm: 'auto' },
            width: { sm: 380 },
            zIndex: 1000,
            borderRadius: 3,
            p: 0.5,
            bgcolor: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(8px)'
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="მოძებნეთ ქალაქი, მისამართი ან ადგილი..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#6E3FF3' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {searchLoading ? (
                    <CircularProgress size={20} sx={{ color: '#6E3FF3' }} />
                  ) : (
                    <IconButton size="small" onClick={handleSearch} sx={{ color: '#3A1D94' }}>
                      <Navigation fontSize="small" />
                    </IconButton>
                  )}
                </InputAdornment>
              ),
              sx: {
                borderRadius: 2.5,
                bgcolor: '#FFFFFF',
                '& fieldset': { borderColor: 'transparent' },
                '&:hover fieldset': { borderColor: '#E2E8F0' },
                '&.Mui-focused fieldset': { borderColor: '#6E3FF3' }
              }
            }}
          />

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <Box sx={{ mt: 1, maxHeight: 220, overflowY: 'auto', borderTop: '1px solid #F1F5F9' }}>
              {searchResults.map((item, idx) => (
                <Box
                  key={idx}
                  onClick={() => handleSelectSearchResult(item)}
                  sx={{
                    p: 1.2,
                    cursor: 'pointer',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    '&:hover': { bgcolor: '#F1EDFF' }
                  }}
                >
                  <Place sx={{ fontSize: 18, color: '#6E3FF3' }} />
                  <Typography variant="body2" sx={{ fontSize: 13, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.display_name}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      )}

      {/* Map Controls */}
      {showControls && (
        <Stack
          spacing={1}
          sx={{
            position: 'absolute',
            bottom: selectedLocation ? { xs: 150, sm: 16 } : 16,
            right: 16,
            zIndex: 1000
          }}
        >
          {/* Layer switcher */}
          <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <IconButton
              size="small"
              onClick={() => setMapType(prev => prev === 'osm' ? 'hot' : prev === 'hot' ? 'topo' : 'osm')}
              title="რუკის ფენის შეცვლა"
              sx={{ bgcolor: '#fff', '&:hover': { bgcolor: '#f8fafc' }, color: '#3A1D94' }}
            >
              <Layers fontSize="small" />
            </IconButton>
          </Paper>

          {/* My Location */}
          <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <IconButton
              size="small"
              onClick={handleCurrentLocationClick}
              title="ჩემი მდებარეობა"
              sx={{ bgcolor: '#fff', '&:hover': { bgcolor: '#f8fafc' }, color: '#3A1D94' }}
            >
              <MyLocation fontSize="small" />
            </IconButton>
          </Paper>

          {/* Zoom controls */}
          <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <IconButton size="small" onClick={handleZoomIn} sx={{ bgcolor: '#fff', '&:hover': { bgcolor: '#f8fafc' } }}>
              <ZoomIn fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={handleZoomOut} sx={{ bgcolor: '#fff', '&:hover': { bgcolor: '#f8fafc' } }}>
              <ZoomOut fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={handleResetCenter} title="ცენტრის გასწორება" sx={{ bgcolor: '#fff', '&:hover': { bgcolor: '#f8fafc' } }}>
              <CenterFocusStrong fontSize="small" />
            </IconButton>
          </Paper>
        </Stack>
      )}

      {/* Selected Location Bottom Card */}
      {selectedLocation && (
        <Paper
          elevation={4}
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            right: { xs: 16, sm: 'auto' },
            maxWidth: { sm: 420 },
            zIndex: 1000,
            p: 2,
            borderRadius: 3,
            bgcolor: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(10px)',
            border: '1px solid #E2E8F0'
          }}
        >
          <Stack spacing={1}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckCircle sx={{ color: '#16A34A', fontSize: 18 }} />
                <Typography variant="subtitle2" fontWeight={700} color="#1E1B4B">
                  შერჩეული ადგილი
                </Typography>
              </Stack>
              <Button
                size="small"
                startIcon={<ContentCopy fontSize="small" />}
                onClick={handleCopyCoords}
                sx={{ textTransform: 'none', fontSize: 11, color: '#6E3FF3', p: 0.5 }}
              >
                {copied ? 'კოპირებულია!' : 'კოპირება'}
              </Button>
            </Stack>

            <Typography variant="body2" color="#334155" sx={{ fontSize: 13, lineHeight: 1.4, maxHeight: 42, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {selectedLocation.address}
            </Typography>

            <Stack direction="row" spacing={1}>
              <Chip
                size="small"
                label={`Lat: ${selectedLocation.lat.toFixed(5)}`}
                sx={{ fontSize: 11, bgcolor: '#FAF5FF', color: '#6E3FF3', fontWeight: 600 }}
              />
              <Chip
                size="small"
                label={`Lng: ${selectedLocation.lng.toFixed(5)}`}
                sx={{ fontSize: 11, bgcolor: '#FAF5FF', color: '#6E3FF3', fontWeight: 600 }}
              />
            </Stack>
          </Stack>
        </Paper>
      )}
    </Box>
  );
};

export default InteractiveMap;
