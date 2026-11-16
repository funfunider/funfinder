import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  TextField,
  Chip,
  Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";
import FilterListIcon from "@mui/icons-material/FilterList";
import { useLanguageNavigate } from "../hooks/useLanguageNavigate";
import { useLanguage } from "../contexts/LanguageContext";
import { useEventFeed } from "../hooks/useApi";
import ActivityCard from "./ActivityCard";
import RecentEventsSlider from "./RecentEventsSlider";
import FunLoader from "./FunLoader";
import FirstTimeGuide from "./FirstTimeGuide";
import { useGuide } from "../contexts/GuideContext";
import { getEventDetailUrl } from "../utils/routeHelper";
import { getImageUrl } from "../utils/imageUtils";
import { updateSeoMeta } from "../utils/seoUtils";

const CategoryActivityTemplate = ({
  categoryKeys = [],
  titleKa = "აქტივობები",
  titleEn = "Activities",
  subtitleKa = "აღმოაჩინე საუკეთესო თავგადასავლები და დაჯავშნე ონლაინ",
  subtitleEn = "Discover top adventures and book tickets online",
  icon = null,
  guideTarget = "category-page",
  guideSteps = null,
  customFilterFn = null,
}) => {
  const navigate = useLanguageNavigate();
  const { language } = useLanguage();
  const isKa = language === "ka";

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("All");
  const [sortBy, setSortBy] = useState("popular"); // 'popular' | 'rating' | 'priceAsc' | 'priceDesc'

  const { data: allEvents, loading: eventsLoading, error: eventsError } = useEventFeed();
  const { showGuide, markGuideAsSeen } = useGuide();

  // Dynamic SEO metadata update for this category view
  useEffect(() => {
    updateSeoMeta({
      title: isKa ? titleKa : titleEn,
      description: isKa ? subtitleKa : subtitleEn,
      url: window.location.href,
      type: 'website',
      lang: language,
      keywords: `${isKa ? titleKa : titleEn}, adventures in Georgia, tours Georgia, funfinder`,
    });
  }, [titleKa, titleEn, subtitleKa, subtitleEn, isKa, language]);

  // Normalize category keys to lowercase array
  const normalizedKeys = useMemo(() => {
    const arr = Array.isArray(categoryKeys) ? categoryKeys : [categoryKeys];
    return arr.map((k) => String(k).toLowerCase().trim()).filter(Boolean);
  }, [categoryKeys]);

  // Filter category events from all events
  const categoryEvents = useMemo(() => {
    if (!allEvents || !Array.isArray(allEvents)) return [];

    if (customFilterFn) {
      return allEvents.filter(customFilterFn);
    }

    if (normalizedKeys.length === 0) return allEvents;

    return allEvents.filter((event) => {
      const catName = String(event.category?.name || "").toLowerCase().trim();
      const catId = String(event.category?.id || "");
      const actType = String(event.activity_type || event.category?.activity || "").toLowerCase();

      return normalizedKeys.some(
        (key) =>
          catName === key ||
          catName.includes(key) ||
          key.includes(catName) ||
          catId === key ||
          actType === key
      );
    });
  }, [allEvents, normalizedKeys, customFilterFn]);

  // Extract unique cities
  const cities = useMemo(() => {
    const list = categoryEvents
      .map((e) => e.city?.name)
      .filter(Boolean);
    return ["All", ...new Set(list)];
  }, [categoryEvents]);

  // Filter and sort for the grid
  const filteredEvents = useMemo(() => {
    let result = categoryEvents.filter((tour) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        (tour.name && tour.name.toLowerCase().includes(q)) ||
        (tour.description && tour.description.toLowerCase().includes(q)) ||
        (tour.city?.name && tour.city.name.toLowerCase().includes(q));

      const matchCity = selectedCity === "All" || tour.city?.name === selectedCity;

      return matchSearch && matchCity;
    });

    if (sortBy === "rating") {
      result.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
    } else if (sortBy === "priceAsc") {
      result.sort((a, b) => (a.base_price || a.price || 0) - (b.base_price || b.price || 0));
    } else if (sortBy === "priceDesc") {
      result.sort((a, b) => (b.base_price || b.price || 0) - (a.base_price || a.price || 0));
    } else {
      // 'popular': sort by rating count or id
      result.sort((a, b) => (b.rating_count || b.id || 0) - (a.rating_count || a.id || 0));
    }

    return result;
  }, [categoryEvents, searchTerm, selectedCity, sortBy]);

  const defaultGuideSteps = useMemo(() => {
    return [
      {
        target: `[data-guide="${guideTarget}-hero"]`,
        title: isKa ? "რჩეული თავგადასავალი" : "Featured Adventure",
        content: isKa
          ? "გაეცანით კატეგორიის მთავარ რეკომენდებულ ტურებს და დაჯავშნეთ პირდაპირ."
          : "Explore the spotlight adventures in this category and book directly.",
        position: "bottom",
      },
      {
        target: `[data-guide="${guideTarget}-filters"]`,
        title: isKa ? "ფილტრაცია და ძებნა" : "Filters & Search",
        content: isKa
          ? "გამოიყენეთ ქალაქის ღილაკები და საძიებო ველი სასურველი ტურის მარტივად საპოვნელად."
          : "Use city pills and search to easily find your desired tour.",
        position: "bottom",
      },
      {
        target: `[data-guide="${guideTarget}-grid"]`,
        title: isKa ? "ხელმისაწვდომი ტურები" : "Available Tours",
        content: isKa
          ? "აქ წარმოდგენილია ყველა აქტივობა დეტალური ინფორმაციითა და ფასებით."
          : "Here you can browse all activities with complete details and pricing.",
        position: "top",
      },
    ];
  }, [guideTarget, isKa]);

  const pageTitle = isKa ? titleKa : titleEn;
  const pageSubtitle = isKa ? subtitleKa : subtitleEn;

  return (
    <Box sx={{ width: "100%", bgcolor: "#f8f9fa", minHeight: "100vh", pb: 8, pt: { xs: 2, md: 3 } }}>
      {/* First Time Guide */}
      <FirstTimeGuide
        open={showGuide}
        onClose={markGuideAsSeen}
        steps={guideSteps || defaultGuideSteps}
        onComplete={markGuideAsSeen}
      />

      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Modern Representative Hero Showcase */}
        <Box sx={{ mb: { xs: 2.5, md: 3.5 } }} data-guide={`${guideTarget}-hero`}>
          <RecentEventsSlider
            categoryName={titleEn}
            events={categoryEvents}
          />
        </Box>

        {/* Category Header Row */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", mb: 0.8 }}>
            {icon && (
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
                {icon}
              </Box>
            )}
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: "#111827",
                fontSize: { xs: "1.75rem", sm: "2rem", md: "2.35rem" },
                letterSpacing: "-0.5px",
              }}
            >
              {pageTitle}
            </Typography>

            <Chip
              label={
                isKa
                  ? `${filteredEvents.length} აქტივობა`
                  : `${filteredEvents.length} ${filteredEvents.length === 1 ? "Activity" : "Activities"}`
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

          <Typography variant="body1" sx={{ color: "#6b7280", maxWidth: 750, fontSize: "0.98rem" }}>
            {pageSubtitle}
          </Typography>
        </Box>

        {/* Modern Filter & Search Bar */}
        <Box
          data-guide={`${guideTarget}-filters`}
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
          {/* City Filter Pills */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              overflowX: "auto",
              maxWidth: { xs: "100%", md: "62%" },
              pb: { xs: 0.5, md: 0 },
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            {cities.map((city) => {
              const isSelected = selectedCity === city;
              const label =
                city === "All"
                  ? isKa
                    ? "ყველა ქალაქი"
                    : "All Cities"
                  : city;

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

          {/* Search Box & Sort */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              width: { xs: "100%", md: "auto" },
              flexGrow: { xs: 1, md: 0 },
            }}
          >
            {/* Search Input */}
            <TextField
              size="small"
              placeholder={isKa ? "ძებნა კატეგორიაში..." : "Search in category..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: "#9ca3af", mr: 1, fontSize: 20 }} />,
              }}
              sx={{
                width: { xs: "100%", sm: "280px" },
                "& .MuiOutlinedInput-root": {
                  borderRadius: "24px",
                  bgcolor: "#f9fafb",
                  fontSize: "14px",
                  "&:hover fieldset": { borderColor: "#cbd5e1" },
                  "&.Mui-focused fieldset": { borderColor: "#87003A" },
                },
              }}
            />

            {/* Quick Sort Toggle */}
            <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 0.5 }}>
              <button
                type="button"
                onClick={() => setSortBy(sortBy === "priceAsc" ? "priceDesc" : "priceAsc")}
                style={{
                  padding: "8px 12px",
                  borderRadius: "20px",
                  border: sortBy.startsWith("price") ? "1px solid #87003A" : "1px solid #e5e7eb",
                  backgroundColor: sortBy.startsWith("price") ? "rgba(135, 0, 58, 0.08)" : "#f9fafb",
                  color: sortBy.startsWith("price") ? "#87003A" : "#6b7280",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  whiteSpace: "nowrap",
                }}
                title={isKa ? "დალაგება ფასის მიხედვით" : "Sort by price"}
              >
                <SortIcon sx={{ fontSize: 16 }} />
                <span>
                  {sortBy === "priceAsc"
                    ? isKa ? "ფასი ↑" : "Price ↑"
                    : sortBy === "priceDesc"
                    ? isKa ? "ფასი ↓" : "Price ↓"
                    : isKa ? "ფასი" : "Price"}
                </span>
              </button>
            </Box>
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
        {!eventsLoading && !eventsError && filteredEvents.length > 0 && (
          <Box
            data-guide={`${guideTarget}-grid`}
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
            {filteredEvents.map((tour) => (
              <ActivityCard
                key={tour.id}
                image={getImageUrl(
                  tour.primary_image?.image ||
                  tour.images?.[0]?.image ||
                  tour.image
                )}
                name={tour.name}
                price={tour.base_price || tour.price}
                rating={tour.average_rating || 4.8}
                location={tour.city?.name || tour.location || (isKa ? "საქართველო" : "Georgia")}
                date={tour.start_date || new Date().toISOString()}
                types={[tour.category?.name || pageTitle]}
                onClick={() => navigate(getEventDetailUrl(tour))}
              />
            ))}
          </Box>
        )}

        {/* Empty State */}
        {!eventsLoading && !eventsError && filteredEvents.length === 0 && (
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
              {isKa ? "აქტივობები ვერ მოიძებნა" : "No Adventures Found"}
            </Typography>
            <Typography variant="body2" color="#6b7280" mb={3}>
              {isKa
                ? "სცადეთ სხვა საძიებო სიტყვა ან შეცვალეთ ქალაქის ფილტრი"
                : "Try adjusting your search query or reset the city filter."}
            </Typography>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedCity("All");
                setSortBy("popular");
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

export default CategoryActivityTemplate;
