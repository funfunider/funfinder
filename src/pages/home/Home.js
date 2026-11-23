import React, { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Button,
  Container,
  Paper,
  Card,
  CardContent,
  IconButton,
  Chip,
  Skeleton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Pagination,
} from "@mui/material";

import Phone from "@mui/icons-material/Phone";
import Email from "@mui/icons-material/Email";
import LocationOn from "@mui/icons-material/LocationOn";
import WhatsApp from "@mui/icons-material/WhatsApp";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import StarIcon from "@mui/icons-material/Star";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/autoplay";

import MainSlider from "../../components/MainSlider";
import ActivityCard from "../../components/ActivityCard";
import DateFilterStrip from "../../components/DateFilterStrip";
import RevealOnScroll from "../../components/RevealOnScroll";
import { useGuide } from "../../contexts/GuideContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useLanguageNavigate } from "../../hooks/useLanguageNavigate";
import { usePopularEvents, useEventFeed, useCategoryList } from "../../hooks/useApi";
import { sliderApi } from "../../services/api";
import { getEventDetailUrl } from "../../utils/routeHelper";
import { updateSeoMeta } from "../../utils/seoUtils";

const FirstTimeGuide = React.lazy(() => import("../../components/FirstTimeGuide"));

// Image helpers
const IMAGE_BASE_URL = "https://base.funfinder.ge/uploads/service_images/";
const defaultActivityImage =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80";

const getImageUrl = (image) => {
  if (!image) return defaultActivityImage;
  const imageStr = typeof image === "string" ? image : String(image);
  if (imageStr.startsWith("http://") || imageStr.startsWith("https://")) return imageStr;
  const isLocal =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  if (imageStr.startsWith("/")) {
    if (imageStr.startsWith("/uploads/")) {
      return isLocal ? imageStr : "https://base.funfinder.ge" + imageStr;
    }
    if (imageStr.startsWith("/media/")) {
      return "https://base.funfinder.ge" + imageStr;
    }
    return imageStr;
  }
  if (imageStr.startsWith("event-") || imageStr.startsWith("slider-") || imageStr.startsWith("img-")) {
    return (isLocal ? "/uploads/" : "https://base.funfinder.ge/uploads/") + imageStr;
  }
  return IMAGE_BASE_URL + imageStr;
};

const getSliderImageUrl = (image) => {
  if (!image) return "";
  const imageStr = typeof image === "string" ? image : String(image);
  if (imageStr.startsWith("http://") || imageStr.startsWith("https://")) return imageStr;
  const isLocal =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  if (imageStr.startsWith("/")) {
    if (imageStr.startsWith("/uploads/")) {
      return isLocal ? imageStr : "https://base.funfinder.ge" + imageStr;
    }
    if (imageStr.startsWith("/media/")) {
      return "https://base.funfinder.ge" + imageStr;
    }
    return imageStr;
  }
  if (imageStr.startsWith("slider-") || imageStr.startsWith("event-") || imageStr.startsWith("img-")) {
    return (isLocal ? "/uploads/" : "https://base.funfinder.ge/uploads/") + imageStr;
  }
  return "https://base.funfinder.ge/uploads/slider_images/" + imageStr;
};

const defaultSlides = [
  {
    id: 1,
    title: "აღმოაჩინე დაუვიწყარი თავგადასავლები საქართველოში",
    description: "ზღვისა და სამთო ტურები, პარაგლაიდინგი, იახტები და ექსტრემალური აქტივობები",
    image: "https://base.funfinder.ge/uploads/slider_images/89b6b3e3-cb30-47b8-8247-0bd854f943e4.png",
    link: "/water-activities",
  },
  {
    id: 2,
    title: "ექსტრემალური და VIP გართობა საქართველოში",
    description: "კვადროციკლები, ჯიპ ტურები, რაფტინგი საუკეთესო ადგილობრივი ფასით",
    image: "https://base.funfinder.ge/uploads/slider_images/c7794290-5657-42fa-8b9b-74b7e8d095d1.jpg",
    link: "/land-activities",
  },
];

const defaultEvents = [
  {
    id: 101,
    name: "იახტით გასეირნება ბათუმში",
    base_price: 50,
    average_rating: 4.9,
    location: "ბათუმი • Batumi Port",
    category: { id: 1, name: "ზღვა" },
    views_count: 2450,
    image: "/2.jpg",
    start_date: new Date().toISOString(),
  },
  {
    id: 102,
    name: "ტანდემ პარაგლაიდინგი ყაზბეგში",
    base_price: 250,
    average_rating: 5.0,
    location: "ყაზბეგი • გუდაური",
    category: { id: 2, name: "პარაგლაიდინგი" },
    views_count: 3100,
    image: "/header.jpg",
    start_date: new Date().toISOString(),
  },
  {
    id: 103,
    name: "კვადროციკლების საფარი ტური აჭარაში",
    base_price: 120,
    average_rating: 4.8,
    location: "მაჭახელა • Machakhela",
    category: { id: 3, name: "კვადრო" },
    views_count: 1890,
    image: "/3.jpg",
    start_date: new Date().toISOString(),
  },
  {
    id: 104,
    name: "4x4 ჯიპ ტური თრუსოს ხეობაში",
    base_price: 90,
    average_rating: 4.9,
    location: "სტეფანწმინდა • Stepantsminda",
    category: { id: 4, name: "ჯიპ ტური" },
    views_count: 1650,
    image: "/5.jpg",
    start_date: new Date().toISOString(),
  },
  {
    id: 105,
    name: "ექსტრემალური რაფტინგი რიონზე",
    base_price: 70,
    average_rating: 4.7,
    location: "ქუთაისი • Kutaisi",
    category: { id: 5, name: "რაფტინგი" },
    views_count: 980,
    image: "/6.jpg",
    start_date: new Date().toISOString(),
  },
  {
    id: 106,
    name: "ზღვის ჩქაროსნული მოტოციკლი / Jet Ski",
    base_price: 80,
    average_rating: 4.8,
    location: "ბათუმის სანაპირო • Batumi Beach",
    category: { id: 1, name: "ზღვა" },
    views_count: 1420,
    image: "/7.jpg",
    start_date: new Date().toISOString(),
  },
  {
    id: 107,
    name: "სამთო ლაშქრობა აბუდელაურის ტბებზე",
    base_price: 65,
    average_rating: 4.9,
    location: "როშკა • Roshka",
    category: { id: 6, name: "ლაშქრობა" },
    views_count: 890,
    image: "/1.jpg",
    start_date: new Date().toISOString(),
  },
  {
    id: 108,
    name: "ცხენოსნობის ტური ბორჯომში",
    base_price: 75,
    average_rating: 4.8,
    location: "ბორჯომი • Borjomi Park",
    category: { id: 7, name: "ცხენოსნობა" },
    views_count: 760,
    image: "/images.jpg",
    start_date: new Date().toISOString(),
  },
];

export const Home = () => {
  const navigate = useLanguageNavigate();
  const [searchParams] = useSearchParams();
  const urlSearchQuery = searchParams.get("q") || "";

  const { formatPrice } = useCurrency();
  const { showGuide, markGuideAsSeen } = useGuide();
  const { t, language } = useLanguage();

  // Dynamic Home Page SEO Meta
  useEffect(() => {
    updateSeoMeta({
      title: language === 'ka' ? 'Funfinder - თავგადასავლები და ივენთები საქართველოში' : 'Funfinder - Events & Adventures in Georgia',
      description: language === 'ka'
        ? 'აღმოაჩინე და დაჯავშნე დაუვიწყარი საზღვაო, სამთო და ექსტრემალური თავგადასავლები საქართველოში. ბილეთების ონლაინ შეძენა Funfinder-ზე.'
        : 'Discover and book unforgettable sea, mountain, and extreme adventures in Georgia. Book tickets online on Funfinder.',
      url: window.location.href,
      type: 'website',
      lang: language,
    });
  }, [language]);

  const [sliderSlides, setSliderSlides] = useState(defaultSlides);
  const [loadingSliders, setLoadingSliders] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState(null);

  const activitiesSectionRef = useRef(null);

  // Fetch API data
  const { data: popularEvents, loading: popularLoading } = usePopularEvents();
  const { data: allEvents, loading: allEventsLoading } = useEventFeed();
  const { data: categories, loading: categoriesLoading } = useCategoryList();

  // Load slider banners
  useEffect(() => {
    let isMounted = true;
    const loadSliders = async () => {
      try {
        setLoadingSliders(true);
        const sliders = await sliderApi.getAll();
        if (isMounted && sliders && sliders.length > 0) {
          const transformed = sliders.map((s) => ({
            id: s.id,
            title: s.title || "",
            description: s.description || "",
            image: getSliderImageUrl(s.image),
            link: s.link || null,
          }));
          setSliderSlides(transformed);
        }
      } catch (err) {
        console.error("Failed to load sliders:", err);
      } finally {
        if (isMounted) setLoadingSliders(false);
      }
    };
    loadSliders();
    return () => {
      isMounted = false;
    };
  }, []);

  const effectiveEvents = useMemo(() => {
    if (allEvents && allEvents.length > 0) return allEvents;
    if (popularEvents && popularEvents.length > 0) return popularEvents;
    return defaultEvents;
  }, [allEvents, popularEvents]);

  // Top popular events
  const topPopular = useMemo(() => {
    return [...effectiveEvents].sort((a, b) => (b.views_count || 0) - (a.views_count || 0)).slice(0, 10);
  }, [effectiveEvents]);

  // Filtered events based on search, category, and date
  const filteredEvents = useMemo(() => {
    let list = effectiveEvents;

    // Filter by search query
    if (urlSearchQuery) {
      const q = urlSearchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          (e.name && e.name.toLowerCase().includes(q)) ||
          (e.title && e.title.toLowerCase().includes(q)) ||
          (e.description && e.description.toLowerCase().includes(q)) ||
          (e.category?.name && e.category.name.toLowerCase().includes(q))
      );
    }

    // Filter by category
    if (selectedCategoryId) {
      list = list.filter(
        (e) =>
          e.category?.id === selectedCategoryId ||
          (e.category?.name && e.category.name.toLowerCase() === selectedCategoryName?.toLowerCase())
      );
    }

    // Dates in database are formal: show all activities on any date
    // When a date is selected, activities reflect that date for exploration
    return list;
  }, [allEvents, popularEvents, urlSearchQuery, selectedCategoryId, selectedCategoryName]);

  // Pagination & Sorting state for All Adventures (4 items per row/page by default)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const [sortBy, setSortBy] = useState("popular");

  // Reset page when filters, sorting, or itemsPerPage change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate, selectedCategoryId, urlSearchQuery, sortBy, itemsPerPage]);

  // Sorted events
  const sortedEvents = useMemo(() => {
    const list = [...filteredEvents];
    if (sortBy === "price_asc") {
      return list.sort((a, b) => (Number(a.base_price) || 0) - (Number(b.base_price) || 0));
    }
    if (sortBy === "price_desc") {
      return list.sort((a, b) => (Number(b.base_price) || 0) - (Number(a.base_price) || 0));
    }
    if (sortBy === "rating") {
      return list.sort((a, b) => (Number(b.average_rating) || 0) - (Number(a.average_rating) || 0));
    }
    return list.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
  }, [filteredEvents, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedEvents.length / itemsPerPage));

  // Paginated slice for current page (shows exactly 4 items per page by default)
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedEvents.slice(start, start + itemsPerPage);
  }, [sortedEvents, currentPage, itemsPerPage]);

  // Water activities subsection
  const waterEvents = useMemo(() => {
    return (allEvents || []).filter((e) => {
      const cat = (e.category?.name || "").toLowerCase();
      return cat.includes("water") || cat.includes("yacht") || cat.includes("rafting") || cat.includes("sea") || cat.includes("parachute");
    }).slice(0, 8);
  }, [allEvents]);

  // Extreme & Land activities subsection
  const landEvents = useMemo(() => {
    return (allEvents || []).filter((e) => {
      const cat = (e.category?.name || "").toLowerCase();
      return cat.includes("land") || cat.includes("quad") || cat.includes("jeep") || cat.includes("moto") || cat.includes("hiking") || cat.includes("paragliding");
    }).slice(0, 8);
  }, [allEvents]);

  const handleCardClick = (event) => {
    navigate(getEventDetailUrl(event));
  };

  return (
    <Box sx={{ width: "100%", maxWidth: "100%", overflowX: "clip", bgcolor: "#f6f7f9", pb: 8 }}>
      {/* First Time User Interactive Guide */}
      <Suspense fallback={null}>
        <FirstTimeGuide open={showGuide} onClose={() => markGuideAsSeen()} onComplete={() => markGuideAsSeen()} />
      </Suspense>

      <Container maxWidth={false} sx={{ maxWidth: 1360, mx: "auto", px: { xs: 2, sm: 3, md: 4 }, pt: 2.5, overflowX: "clip" }}>
        {/* ===== HERO SHOWCASE (Elite Featured & Navigator) ===== */}
        <Box sx={{ mb: 3.5, width: "100%" }}>
          <MainSlider slides={sliderSlides} popularEvents={topPopular} />
        </Box>

        {/* ===== SIGNATURE TKT.GE DATE FILTER STRIP ===== */}
        <DateFilterStrip selectedDate={selectedDate} onSelectDate={(d) => setSelectedDate(d)} />

        {/* ===== ACTIVE SEARCH / FILTER STATUS HEADER ===== */}
        {(urlSearchQuery || selectedCategoryId || selectedDate) && (
          <Box
            ref={activitiesSectionRef}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: "#ffffff",
              p: 2,
              borderRadius: "14px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              border: "1px solid #e8ebed",
              mb: 3.5,
              flexWrap: "wrap",
              gap: 1.5,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="h6" fontWeight={800} color="#111827" sx={{ fontSize: "1.1rem" }}>
                {language === "ka" ? "ნაპოვნია აქტივობები" : "Found Activities"}:
              </Typography>
              <Chip
                label={`${filteredEvents.length} ${language === "ka" ? "ღონისძიება" : "results"}`}
                size="small"
                sx={{ bgcolor: "rgba(135,0,58,0.08)", color: "#87003A", fontWeight: 700 }}
              />
              {selectedCategoryName && (
                <Chip
                  label={selectedCategoryName}
                  size="small"
                  onDelete={() => {
                    setSelectedCategoryId(null);
                    setSelectedCategoryName(null);
                  }}
                  sx={{ bgcolor: "#87003A", color: "#fff", fontWeight: 600 }}
                />
              )}
              {selectedDate && (
                <Chip
                  label={selectedDate}
                  size="small"
                  onDelete={() => setSelectedDate(null)}
                  sx={{ bgcolor: "#1f2937", color: "#fff", fontWeight: 600 }}
                />
              )}
            </Box>

            <Button
              size="small"
              startIcon={<CloseIcon sx={{ fontSize: 16 }} />}
              onClick={() => {
                setSelectedCategoryId(null);
                setSelectedCategoryName(null);
                setSelectedDate(null);
              }}
              sx={{ color: "#ef4444", textTransform: "none", fontWeight: 600 }}
            >
              {language === "ka" ? "ფილტრის გასუფთავება" : "Clear Filters"}
            </Button>
          </Box>
        )}

        {/* ===== 1. POPULAR EVENTS SECTION (პოპულარული - TKT.GE Style) ===== */}
        {topPopular.length > 0 && !urlSearchQuery && !selectedCategoryId && (
          <Box sx={{ mb: 5 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, flexWrap: "wrap", gap: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: "10px",
                    bgcolor: "rgba(135, 0, 58, 0.09)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#87003A",
                  }}
                >
                  <LocalFireDepartmentIcon sx={{ fontSize: 20 }} />
                </Box>
                <Typography
                  variant="h5"
                  component="h2"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: "1.3rem", md: "1.65rem" },
                    color: "#111827",
                    letterSpacing: "-0.5px",
                  }}
                >
                  {t("home.popular.title") !== "home.popular.title"
                    ? t("home.popular.title")
                    : language === "ka"
                    ? "პოპულარული აქტივობები"
                    : "Popular Activities"}
                </Typography>
                <Chip
                  label={language === "ka" ? "ტოპ არჩევანი" : "Top Trending"}
                  size="small"
                  sx={{
                    bgcolor: "rgba(135, 0, 58, 0.08)",
                    color: "#87003A",
                    fontWeight: 700,
                    fontSize: "11.5px",
                    height: 24,
                  }}
                />
              </Box>

              <Button
                component="button"
                onClick={() => {
                  activitiesSectionRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
                endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                sx={{
                  color: "#87003A",
                  fontWeight: 700,
                  fontSize: "13.5px",
                  textTransform: "none",
                  "&:hover": { bgcolor: "transparent", opacity: 0.8 },
                }}
              >
                {language === "ka" ? "ყველა" : "View All"}
              </Button>
            </Box>

            {popularLoading && topPopular.length === 0 ? (
              <Grid container spacing={2.5}>
                {Array.from({ length: 4 }).map((_, idx) => (
                  <Grid item xs={12} sm={6} md={3} key={idx}>
                    <Skeleton variant="rectangular" height={190} sx={{ borderRadius: "16px", mb: 1.5 }} />
                    <Skeleton width="80%" height={24} />
                    <Skeleton width="40%" height={18} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Swiper
                modules={[Navigation, Autoplay]}
                spaceBetween={20}
                slidesPerView={1.15}
                navigation
                autoplay={{ delay: 5000, pauseOnMouseEnter: true }}
                breakpoints={{
                  480: { slidesPerView: 2 },
                  768: { slidesPerView: 3 },
                  1100: { slidesPerView: 4 },
                }}
                style={{ paddingBottom: 12 }}
              >
                {topPopular.map((event) => (
                  <SwiperSlide key={event.id}>
                    <ActivityCard
                      image={getImageUrl(event.primary_image?.image || event.images?.[0]?.image || event.image)}
                      name={event.name || event.title}
                      price={event.base_price}
                      rating={event.average_rating}
                      location={event.city?.name || event.location}
                      date={selectedDate || event.start_date || event.created_at}
                      types={[event.category?.name || "Activity"]}
                      featured={true}
                      onClick={() => handleCardClick(event)}
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </Box>
        )}

        {/* ===== 2. ALL / FILTERED ACTIVITIES GRID (WITH PAGINATION) ===== */}
        <Box sx={{ mb: 6 }} ref={activitiesSectionRef}>
          {/* Section Header with Title, Badge, Sorting, and View Controls */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { xs: "flex-start", md: "center" },
              justifyContent: "space-between",
              mb: 3,
              gap: 2,
            }}
          >
            {/* Title & Subtitle */}
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                <Typography
                  variant="h5"
                  component="h2"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: "1.35rem", md: "1.65rem" },
                    color: "#111827",
                    letterSpacing: "-0.5px",
                  }}
                >
                  {selectedCategoryName ||
                    (selectedDate
                      ? `${language === "ka" ? "ღონისძიებები" : "Events"}: ${selectedDate}`
                      : urlSearchQuery
                      ? `${language === "ka" ? "ძიების შედეგები" : "Search"}: "${urlSearchQuery}"`
                      : language === "ka"
                      ? "ყველა თავგადასავალი"
                      : "All Adventures")}
                </Typography>
                <Chip
                  label={`${sortedEvents.length} ${language === "ka" ? "აქტივობა" : "activities"}`}
                  size="small"
                  sx={{
                    bgcolor: "rgba(135,0,58,0.08)",
                    color: "#87003A",
                    fontWeight: 700,
                    borderRadius: "8px",
                  }}
                />
              </Box>
              <Typography variant="body2" color="#6b7280" sx={{ mt: 0.5 }}>
                {language === "ka"
                  ? "დაათვალიერეთ და დაჯავშნეთ ექსკლუზიური ტურები და გართობა საქართველოში"
                  : "Explore and book exclusive activities and tours across Georgia"}
              </Typography>
            </Box>

            {/* Sorting & Items Per Page Controls */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                flexWrap: "wrap",
                alignSelf: { xs: "stretch", sm: "auto" },
              }}
            >
              {/* Sort Pills */}
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  bgcolor: "#ffffff",
                  p: 0.5,
                  borderRadius: "12px",
                  border: "1px solid #e8ebed",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                }}
              >
                {[
                  { id: "popular", label: language === "ka" ? "პოპულარული" : "Popular" },
                  { id: "rating", label: language === "ka" ? "რეიტინგი" : "Rating" },
                  { id: "price_asc", label: language === "ka" ? "ფასი ↑" : "Price ↑" },
                  { id: "price_desc", label: language === "ka" ? "ფასი ↓" : "Price ↓" },
                ].map((sortOption) => {
                  const isSelected = sortBy === sortOption.id;
                  return (
                    <Button
                      key={sortOption.id}
                      size="small"
                      onClick={() => setSortBy(sortOption.id)}
                      sx={{
                        px: { xs: 1, sm: 1.4 },
                        py: 0.6,
                        fontSize: "12px",
                        fontWeight: isSelected ? 700 : 600,
                        textTransform: "none",
                        borderRadius: "8px",
                        color: isSelected ? "#ffffff" : "#4b5563",
                        bgcolor: isSelected ? "#87003A" : "transparent",
                        boxShadow: isSelected ? "0 2px 8px rgba(135,0,58,0.3)" : "none",
                        "&:hover": {
                          bgcolor: isSelected ? "#87003A" : "#f3f4f6",
                        },
                      }}
                    >
                      {sortOption.label}
                    </Button>
                  );
                })}
              </Box>

              {/* Items Per Page Selector (4 / 8 / 12) */}
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  bgcolor: "#ffffff",
                  p: 0.5,
                  borderRadius: "12px",
                  border: "1px solid #e8ebed",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                }}
              >
                {[4, 8, 12].map((count) => {
                  const isCountActive = itemsPerPage === count;
                  return (
                    <Button
                      key={count}
                      size="small"
                      onClick={() => setItemsPerPage(count)}
                      sx={{
                        minWidth: 32,
                        px: 1,
                        py: 0.6,
                        fontSize: "12px",
                        fontWeight: isCountActive ? 700 : 600,
                        textTransform: "none",
                        borderRadius: "8px",
                        color: isCountActive ? "#ffffff" : "#4b5563",
                        bgcolor: isCountActive ? "#1f2937" : "transparent",
                        "&:hover": {
                          bgcolor: isCountActive ? "#1f2937" : "#f3f4f6",
                        },
                      }}
                    >
                      {count}
                    </Button>
                  );
                })}
              </Box>
            </Box>
          </Box>

          {allEventsLoading && paginatedEvents.length === 0 ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(4, 1fr)",
                },
                gap: 2.5,
                width: "100%",
              }}
            >
              {Array.from({ length: itemsPerPage }).map((_, idx) => (
                <Box key={idx}>
                  <Skeleton variant="rectangular" height={210} sx={{ borderRadius: "16px", mb: 1.5 }} />
                  <Skeleton width="85%" height={24} />
                  <Skeleton width="45%" height={18} />
                </Box>
              ))}
            </Box>
          ) : paginatedEvents.length === 0 ? (
            <Paper
              sx={{
                p: 6,
                textAlign: "center",
                borderRadius: "16px",
                bgcolor: "#ffffff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <Typography variant="h6" fontWeight={700} color="#374151" gutterBottom>
                {language === "ka" ? "აქტივობები ვერ მოიძებნა" : "No activities found"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {language === "ka"
                  ? "სცადეთ სხვა თარიღის ან კატეგორიის არჩევა"
                  : "Try selecting another date or category"}
              </Typography>
              <Button
                variant="contained"
                onClick={() => {
                  setSelectedDate(null);
                  setSelectedCategoryId(null);
                  setSelectedCategoryName(null);
                }}
                sx={{
                  bgcolor: "#87003A",
                  color: "#fff",
                  fontWeight: 700,
                  borderRadius: 2,
                  "&:hover": { bgcolor: "#6a002c" },
                }}
              >
                {language === "ka" ? "ყველა აქტივობის ნახვა" : "View All Activities"}
              </Button>
            </Paper>
          ) : (
            <>
              {/* Exactly 4 Items per row on desktop (repeat(4, 1fr)) */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(4, 1fr)",
                  },
                  gap: 2.5,
                  width: "100%",
                }}
              >
                {paginatedEvents.map((event) => (
                  <ActivityCard
                    key={event.id}
                    image={getImageUrl(event.primary_image?.image || event.images?.[0]?.image || event.image)}
                    name={event.name || event.title}
                    price={event.base_price}
                    rating={event.average_rating}
                    location={event.city?.name || event.location}
                    date={selectedDate || event.start_date || event.created_at}
                    types={[event.category?.name || "Activity"]}
                    onClick={() => handleCardClick(event)}
                  />
                ))}
              </Box>

              {/* Modern Pagination Bar */}
              {totalPages > 1 && (
                <Box
                  sx={{
                    mt: 4,
                    p: { xs: 2, sm: 2.5 },
                    bgcolor: "#ffffff",
                    borderRadius: "16px",
                    border: "1px solid #e8ebed",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                  }}
                >
                  <Typography variant="body2" color="#6b7280" fontWeight={600}>
                    {language === "ka"
                      ? `ნაჩვენებია ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(
                          currentPage * itemsPerPage,
                          sortedEvents.length
                        )} (${sortedEvents.length}-დან)`
                      : `Showing ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(
                          currentPage * itemsPerPage,
                          sortedEvents.length
                        )} of ${sortedEvents.length}`}
                  </Typography>

                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={(e, val) => {
                      setCurrentPage(val);
                      activitiesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    shape="rounded"
                    size="medium"
                    showFirstButton
                    showLastButton
                    sx={{
                      "& .MuiPaginationItem-root": {
                        fontWeight: 700,
                        borderRadius: "10px",
                        color: "#374151",
                        border: "1px solid #e5e7eb",
                        bgcolor: "#ffffff",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          bgcolor: "#f9fafb",
                          borderColor: "#87003A",
                        },
                        "&.Mui-selected": {
                          bgcolor: "#87003A !important",
                          color: "#ffffff !important",
                          borderColor: "#87003A !important",
                          boxShadow: "0 4px 12px rgba(135,0,58,0.3)",
                        },
                      },
                    }}
                  />
                </Box>
              )}
            </>
          )}
        </Box>

        {/* ===== 3. WATER & SEA ADVENTURES HIGHLIGHT ===== */}
        {waterEvents.length > 0 && !selectedCategoryId && (
          <Box sx={{ mb: 6 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography
                variant="h5"
                component="h2"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: "1.35rem", md: "1.65rem" },
                  color: "#111827",
                  letterSpacing: "-0.5px",
                }}
              >
                {language === "ka" ? "ზღვისა და წყლის ტურები" : "Sea & Water Adventures"}
              </Typography>

              <Button
                onClick={() => navigate("/water-activities")}
                endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                sx={{
                  color: "#87003A",
                  fontWeight: 700,
                  fontSize: "13.5px",
                  textTransform: "none",
                }}
              >
                {language === "ka" ? "ყველა" : "View All"}
              </Button>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(4, 1fr)",
                },
                gap: 2.5,
                width: "100%",
              }}
            >
              {waterEvents.slice(0, 4).map((event) => (
                <ActivityCard
                  key={event.id}
                  image={getImageUrl(event.primary_image?.image || event.images?.[0]?.image || event.image)}
                  name={event.name || event.title}
                  price={event.base_price}
                  rating={event.average_rating}
                  location={event.city?.name || event.location}
                  date={selectedDate || event.start_date || event.created_at}
                  types={["ზღვა"]}
                  onClick={() => handleCardClick(event)}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* ===== 4. EXTREME & LAND TOURS HIGHLIGHT ===== */}
        {landEvents.length > 0 && !selectedCategoryId && (
          <Box sx={{ mb: 6 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography
                variant="h5"
                component="h2"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: "1.35rem", md: "1.65rem" },
                  color: "#111827",
                  letterSpacing: "-0.5px",
                }}
              >
                {language === "ka" ? "სამთო და ექსტრემალური ტურები" : "Mountain & Extreme Tours"}
              </Typography>

              <Button
                onClick={() => navigate("/land-activities")}
                endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                sx={{
                  color: "#87003A",
                  fontWeight: 700,
                  fontSize: "13.5px",
                  textTransform: "none",
                }}
              >
                {language === "ka" ? "ყველა" : "View All"}
              </Button>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(4, 1fr)",
                },
                gap: 2.5,
                width: "100%",
              }}
            >
              {landEvents.slice(0, 4).map((event) => (
                <ActivityCard
                  key={event.id}
                  image={getImageUrl(event.primary_image?.image || event.images?.[0]?.image || event.image)}
                  name={event.name || event.title}
                  price={event.base_price}
                  rating={event.average_rating}
                  location={event.city?.name || event.location}
                  date={selectedDate || event.start_date || event.created_at}
                  types={["ექსტრიმი"]}
                  onClick={() => handleCardClick(event)}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* ===== 6. ABOUT & INFO CARDS (TKT.GE Style) ===== */}
        <Box sx={{ mb: 6 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper
                sx={{
                  p: 3,
                  height: "100%",
                  borderRadius: "16px",
                  bgcolor: "#ffffff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  border: "1px solid #e8ebed",
                }}
              >
                <Typography variant="h6" fontWeight={800} color="#87003A" gutterBottom>
                  {language === "ka" ? "უსაფრთხოება" : "Safety Standards"}
                </Typography>
                <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
                  {language === "ka"
                    ? "ყველა აქტივობა სერტიფიცირებულია და ტარდება პროფესიონალი ინსტრუქტორების მეთვალყურეობით თანამედროვე ეკიპირებით."
                    : "All activities are certified and conducted under the supervision of professional instructors with modern safety gear."}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper
                sx={{
                  p: 3,
                  height: "100%",
                  borderRadius: "16px",
                  bgcolor: "#ffffff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  border: "1px solid #e8ebed",
                }}
              >
                <Typography variant="h6" fontWeight={800} color="#87003A" gutterBottom>
                  {language === "ka" ? "მყისიერი ჯავშანი" : "Instant Booking"}
                </Typography>
                <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
                  {language === "ka"
                    ? "მარტივი და სწრაფი ონლაინ გადახდა Apple Pay, Google Pay და საბანკო ბარათებით. ბილეთი მყისიერად გეგზავნებათ."
                    : "Fast and easy online checkout with Apple Pay, Google Pay, and bank cards. E-tickets delivered instantly to your device."}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper
                sx={{
                  p: 3,
                  height: "100%",
                  borderRadius: "16px",
                  bgcolor: "#ffffff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  border: "1px solid #e8ebed",
                }}
              >
                <Typography variant="h6" fontWeight={800} color="#87003A" gutterBottom>
                  {language === "ka" ? "24/7 მხარდაჭერა" : "24/7 Support"}
                </Typography>
                <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
                  {language === "ka"
                    ? "ჩვენი გუნდი მზადაა დაგეხმაროთ ნებისმიერ შეკითხვაზე WhatsApp-ით, ტელეფონითა და ელ-ფოსტით."
                    : "Our customer support team is available 24/7 to assist you via WhatsApp, phone, and email."}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* ===== 7. FAQ ACCORDIONS ===== */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" fontWeight={800} color="#111827" sx={{ mb: 2.5 }}>
            {t("home.faq.title") || (language === "ka" ? "ხშირად დასმული კითხვები" : "Frequently Asked Questions")}
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Accordion sx={{ borderRadius: "12px !important", border: "1px solid #e8ebed", "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight={700}>
                  {t("home.faq.q1") || "როგორ ხდება ბილეთის შეძენა?"}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  {t("home.faq.a1") || "აირჩიეთ სასურველი აქტივობა, დააჭირეთ დაჯავშნას, შეავსეთ მონაცემები და გადაიხადეთ ონლაინ."}
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ borderRadius: "12px !important", border: "1px solid #e8ebed", "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight={700}>
                  {t("home.faq.q2") || "რა ხდება უამინდობის შემთხვევაში?"}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  {t("home.faq.a2") || "უამინდობისას აქტივობა გადაიდება თქვენთვის მოსახერხებელ დროს ან თანხა სრულად ბრუნდება."}
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ borderRadius: "12px !important", border: "1px solid #e8ebed", "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight={700}>
                  {t("home.faq.q3") || "შესაძლებელია თუ არა ჯავშნის გაუქმება?"}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  {t("home.faq.a3") || "ჯავშნის გაუქმება შესაძლებელია ღონისძიებამდე 24 საათით ადრე სრული ანაზღაურებით."}
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Home;
