import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  TextField,
  Chip,
  Alert,
  Button,
  CircularProgress,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SearchIcon from "@mui/icons-material/Search";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import { useLanguageNavigate } from "../../hooks/useLanguageNavigate";
import { useLanguage } from "../../contexts/LanguageContext";
import { useEventFeed } from "../../hooks/useApi";
import { useLocation } from "../../hooks/useLocation";
import ActivityCard from "../../components/ActivityCard";
import RecentEventsSlider from "../../components/RecentEventsSlider";
import FunLoader from "../../components/FunLoader";
import { getImageUrl } from "../../utils/imageUtils";
import { getEventDetailUrl } from "../../utils/routeHelper";

// Helper function to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Format distance for display
const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
};

const NearbyActivities = () => {
  const navigate = useLanguageNavigate();
  const { language } = useLanguage();
  const isKa = language === "ka";

  const { position, loading: locationLoading, error: locationError, getCurrentPosition } = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { data: allEvents, loading: eventsLoading, error: eventsError } = useEventFeed();

  // Request location on component mount
  useEffect(() => {
    if (!position && !locationLoading && !locationError) {
      getCurrentPosition();
    }
  }, [position, locationLoading, locationError, getCurrentPosition]);

  // Dynamic cities
  const cities = useMemo(() => {
    if (!allEvents) return ["All"];
    const unique = [...new Set(allEvents.map((e) => e.city?.name).filter(Boolean))];
    return ["All", ...unique];
  }, [allEvents]);

  // Dynamic categories
  const categories = useMemo(() => {
    if (!allEvents) return ["All"];
    const unique = [...new Set(allEvents.map((e) => e.category?.name).filter(Boolean))];
    return ["All", ...unique];
  }, [allEvents]);

  // Filter and sort events by distance
  const sortedActivities = useMemo(() => {
    if (!allEvents || !Array.isArray(allEvents)) return [];

    let eventsToProcess = allEvents;

    // If position is available, calculate real distance
    if (position) {
      const withDistance = eventsToProcess.map((event) => {
        const lat =
          event.latitude ||
          event.location?.latitude ||
          event.coordinates?.latitude ||
          event.lat;
        const lng =
          event.longitude ||
          event.location?.longitude ||
          event.coordinates?.longitude ||
          event.lng;

        let distance = undefined;
        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
          distance = calculateDistance(position.latitude, position.longitude, lat, lng);
        }
        return { ...event, distance };
      });

      // Closest first (items with distance first, then others)
      eventsToProcess = withDistance.sort((a, b) => {
        if (a.distance !== undefined && b.distance !== undefined) return a.distance - b.distance;
        if (a.distance !== undefined) return -1;
        if (b.distance !== undefined) return 1;
        return 0;
      });
    }

    // Apply search and filters
    return eventsToProcess.filter((activity) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (activity.name && activity.name.toLowerCase().includes(q)) ||
        (activity.description && activity.description.toLowerCase().includes(q));

      const matchesCity = selectedCity === "All" || activity.city?.name === selectedCity;
      const matchesCategory = selectedCategory === "All" || activity.category?.name === selectedCategory;

      return matchesSearch && matchesCity && matchesCategory;
    });
  }, [allEvents, position, searchTerm, selectedCity, selectedCategory]);

  return (
    <Box sx={{ width: "100%", bgcolor: "#f8f9fa", minHeight: "100vh", pb: 8, pt: { xs: 2, md: 3 } }}>
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Modern Featured Spotlight */}
        {sortedActivities.length > 0 && (
          <Box sx={{ mb: { xs: 2.5, md: 3.5 } }}>
            <RecentEventsSlider
              categoryName="Nearby"
              events={sortedActivities.slice(0, 4)}
            />
          </Box>
        )}

        {/* Header Row */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", mb: 0.8 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40,
                height: 40,
                borderRadius: "12px",
                bgcolor: "rgba(135, 0, 58, 0.08)",
                color: "#87003A",
              }}
            >
              <LocationOnIcon />
            </Box>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: "#111827",
                fontSize: { xs: "1.75rem", sm: "2rem", md: "2.35rem" },
                letterSpacing: "-0.5px",
              }}
            >
              {isKa ? "აქტივობები შენს სიახლოვეს" : "Activities Near You"}
            </Typography>

            <Chip
              label={
                isKa
                  ? `${sortedActivities.length} აქტივობა`
                  : `${sortedActivities.length} Activities`
              }
              size="small"
              sx={{
                bgcolor: "rgba(135, 0, 58, 0.08)",
                color: "#87003A",
                fontWeight: 700,
                fontSize: "0.84rem",
                height: 28,
                borderRadius: "14px",
              }}
            />
          </Box>

          <Typography variant="body1" sx={{ color: "#6b7280", maxWidth: 750 }}>
            {isKa
              ? "აღმოაჩინე შენთან ყველაზე ახლოს მდებარე თავგადასავლები და ლოკაციები"
              : "Discover activities closest to your current location across Georgia"}
          </Typography>
        </Box>

        {/* Location Status Notifications */}
        {locationLoading && (
          <Alert severity="info" sx={{ mb: 3, borderRadius: "14px" }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <CircularProgress size={18} />
              <Typography variant="body2">
                {isKa ? "მიმდინარეობს თქვენი ლოკაციის განსაზღვრა..." : "Detecting your location..."}
              </Typography>
            </Box>
          </Alert>
        )}

        {!position && !locationLoading && (
          <Alert
            severity="info"
            sx={{ mb: 3, borderRadius: "14px", display: "flex", alignItems: "center" }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={getCurrentPosition}
                startIcon={<MyLocationIcon />}
                sx={{ fontWeight: 700 }}
              >
                {isKa ? "ლოკაციის ჩართვა" : "Enable Location"}
              </Button>
            }
          >
            {isKa
              ? "ჩართეთ ლოკაცია, რათა დალაგდეს აქტივობები თქვენთან მანძილის მიხედვით."
              : "Enable location to sort activities by distance to you."}
          </Alert>
        )}

        {/* Modern Filter & Search Bar */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
            bgcolor: "#ffffff",
            p: { xs: 1.5, md: 2 },
            borderRadius: "18px",
            border: "1px solid #eef0f3",
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.03)",
            mb: 4,
          }}
        >
          {/* City & Category Filter Pills */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              overflowX: "auto",
              maxWidth: { xs: "100%", md: "65%" },
              pb: { xs: 0.5, md: 0 },
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            {cities.map((city) => {
              const isSelected = selectedCity === city;
              const label = city === "All" ? (isKa ? "ყველა ქალაქი" : "All Cities") : city;
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => setSelectedCity(city)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "20px",
                    border: isSelected ? "1px solid #87003A" : "1px solid #e5e7eb",
                    backgroundColor: isSelected ? "#87003A" : "#f9fafb",
                    color: isSelected ? "#ffffff" : "#4b5563",
                    fontSize: "13.5px",
                    fontWeight: isSelected ? 700 : 500,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s ease",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </Box>

          {/* Search Box */}
          <Box sx={{ width: { xs: "100%", sm: "280px" } }}>
            <TextField
              size="small"
              fullWidth
              placeholder={isKa ? "ძებნა სიახლოვეს..." : "Search nearby..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: "#9ca3af", mr: 1, fontSize: 20 }} />,
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "24px",
                  bgcolor: "#f9fafb",
                  fontSize: "14px",
                  "&:hover fieldset": { borderColor: "#cbd5e1" },
                  "&.Mui-focused fieldset": { borderColor: "#87003A" },
                },
              }}
            />
          </Box>
        </Box>

        {/* Loading Spinner */}
        {eventsLoading && <FunLoader />}

        {/* Error Alert */}
        {eventsError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {eventsError}
          </Alert>
        )}

        {/* 4 Cards Per Row Grid */}
        {!eventsLoading && !eventsError && sortedActivities.length > 0 && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(1, 1fr)",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
                lg: "repeat(4, 1fr)",
              },
              gap: { xs: 2, sm: 2.5, md: 3 },
            }}
          >
            {sortedActivities.map((activity) => {
              const distanceStr =
                activity.distance !== undefined
                  ? `${formatDistance(activity.distance)}`
                  : null;
              const locationLabel = [
                distanceStr,
                activity.city?.name || activity.location || (isKa ? "საქართველო" : "Georgia"),
              ]
                .filter(Boolean)
                .join(" • ");

              return (
                <ActivityCard
                  key={activity.id}
                  image={getImageUrl(
                    activity.primary_image?.image ||
                    activity.images?.[0]?.image ||
                    activity.image
                  )}
                  name={activity.name}
                  price={activity.base_price || activity.price}
                  rating={activity.average_rating || 4.8}
                  location={locationLabel}
                  date={activity.start_date || new Date().toISOString()}
                  types={[activity.category?.name || (isKa ? "აქტივობა" : "Activity")]}
                  onClick={() => navigate(getEventDetailUrl(activity))}
                />
              );
            })}
          </Box>
        )}

        {/* Empty State */}
        {!eventsLoading && !eventsError && sortedActivities.length === 0 && (
          <Box
            sx={{
              textAlign: "center",
              py: 8,
              bgcolor: "#ffffff",
              borderRadius: "20px",
              border: "1px solid #eef0f3",
              px: 3,
            }}
          >
            <Typography variant="h6" fontWeight={700} color="#111827" mb={1}>
              {isKa ? "აქტივობები ვერ მოიძებნა" : "No Nearby Activities Found"}
            </Typography>
            <Typography variant="body2" color="#6b7280" mb={3}>
              {isKa
                ? "სცადეთ სხვა საძიებო სიტყვა ან შეცვალეთ ქალაქის ფილტრი"
                : "Try adjusting your search filters or resetting them."}
            </Typography>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedCity("All");
                setSelectedCategory("All");
              }}
              style={{
                padding: "9px 22px",
                borderRadius: "20px",
                border: "none",
                backgroundColor: "#87003A",
                color: "#ffffff",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              {isKa ? "ფილტრების გასუფთავება" : "Reset Filters"}
            </button>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default NearbyActivities;
