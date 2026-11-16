import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  TextField,
  Chip,
  Container,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import { useEventFeed } from "../../../hooks/useApi";
import ActivityCard from "../../../components/ActivityCard";
import RecentEventsSlider from "../../../components/RecentEventsSlider";
import FunLoader from "../../../components/FunLoader";
import { getImageUrl } from "../../../utils/imageUtils";

const fallbackLandActivities = [
  {
    id: 301,
    name: "კვადროციკლების საფარი ტური აჭარაში",
    base_price: 120,
    average_rating: 4.8,
    location: "მაჭახელა • Machakhela National Park",
    category: { id: 1, name: "კვადროციკლი", activity: "land" },
    city: { name: "ბათუმი" },
    image: "/3.jpg",
    start_date: new Date().toISOString(),
  },
  {
    id: 302,
    name: "4x4 ჯიპ ტური ყაზბეგსა და თრუსოს ხეობაში",
    base_price: 90,
    average_rating: 4.9,
    location: "სტეფანწმინდა • Stepantsminda",
    category: { id: 2, name: "ჯიპ ტური", activity: "land" },
    city: { name: "ყაზბეგი" },
    image: "/5.jpg",
    start_date: new Date().toISOString(),
  },
  {
    id: 303,
    name: "ტანდემ პარაგლაიდინგი გუდაურში",
    base_price: 250,
    average_rating: 5.0,
    location: "გუდაური • Gudauri Panorama",
    category: { id: 3, name: "პარაგლაიდინგი", activity: "land" },
    city: { name: "გუდაური" },
    image: "/header.jpg",
    start_date: new Date().toISOString(),
  },
  {
    id: 304,
    name: "სამთო ენდურო მოტოციკლის ტური",
    base_price: 150,
    average_rating: 4.9,
    location: "თბილისის ეროვნული პარკი • Sabaduri",
    category: { id: 4, name: "მოტო ტური", activity: "land" },
    city: { name: "თბილისი" },
    image: "/1.jpg",
    start_date: new Date().toISOString(),
  },
  {
    id: 305,
    name: "ცხენოსნობის ტური ბორჯომ-ხარაგაულში",
    base_price: 75,
    average_rating: 4.8,
    location: "ბორჯომი • Borjomi Park",
    category: { id: 5, name: "ცხენოსნობა", activity: "land" },
    city: { name: "ბორჯომი" },
    image: "/images.jpg",
    start_date: new Date().toISOString(),
  },
  {
    id: 306,
    name: "სამთო ლაშქრობა აბუდელაურის ფერად ტბებზე",
    base_price: 65,
    average_rating: 4.9,
    location: "როშკა • Roshka",
    category: { id: 6, name: "ლაშქრობა", activity: "land" },
    city: { name: "ხევსურეთი" },
    image: "/2.jpg",
    start_date: new Date().toISOString(),
  },
];

const LandActivities = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("All");
  const [selectedCity, setSelectedCity] = useState("All");

  const { data: allEvents, loading: eventsLoading } = useEventFeed();

  // Filter events by land type or use fallbacks
  const landActivities = useMemo(() => {
    if (allEvents && allEvents.length > 0) {
      const filtered = allEvents.filter((event) => {
        const act = (event.category?.activity || "").toLowerCase();
        const name = (event.category?.name || "").toLowerCase();
        return act === "land" || name.includes("land") || name.includes("კვადრო") || name.includes("ჯიპ");
      });
      if (filtered.length > 0) return filtered;
    }
    return fallbackLandActivities;
  }, [allEvents]);

  const categories = useMemo(() => {
    const list = [...new Set(landActivities.map((e) => e.category?.name).filter(Boolean))];
    return ["All", ...list];
  }, [landActivities]);

  const cities = useMemo(() => {
    const list = [...new Set(landActivities.map((e) => e.city?.name).filter(Boolean))];
    return ["All", ...list];
  }, [landActivities]);

  const filtered = useMemo(() => {
    return landActivities.filter((item) => {
      const name = (item.name || "").toLowerCase();
      const desc = (item.description || "").toLowerCase();
      const query = searchTerm.toLowerCase();
      const matchSearch = !query || name.includes(query) || desc.includes(query);
      const matchCat = selectedSubCategory === "All" || item.category?.name === selectedSubCategory;
      const matchCity = selectedCity === "All" || item.city?.name === selectedCity;
      return matchSearch && matchCat && matchCity;
    });
  }, [landActivities, searchTerm, selectedSubCategory, selectedCity]);

  return (
    <Box sx={{ width: "100%", bgcolor: "#f8f9fa", minHeight: "100vh", pb: 8, pt: 3 }}>
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Featured Showcase */}
        {landActivities.length > 0 && (
          <Box sx={{ mb: { xs: 2.5, md: 3.5 } }}>
            <RecentEventsSlider
              categoryName="Land"
              events={landActivities.slice(0, 4)}
            />
          </Box>
        )}

        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", mb: 1 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: "#111827",
                fontSize: { xs: "1.75rem", md: "2.25rem" },
                letterSpacing: "-0.5px",
              }}
            >
              სახმელეთო აქტივობები
            </Typography>
            <Chip
              label={`${filtered.length} აქტივობა`}
              size="small"
              sx={{
                bgcolor: "rgba(135, 0, 58, 0.08)",
                color: "#87003A",
                fontWeight: 700,
                fontSize: "0.82rem",
                height: 28,
              }}
            />
          </Box>
          <Typography variant="body1" sx={{ color: "#6b7280", maxWidth: 700 }}>
            კვადროციკლები, ჯიპ ტურები, პარაგლაიდინგი და სამთო ექსტრემალური თავგადასავლები
          </Typography>
        </Box>

        {/* Filter Bar */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
            bgcolor: "#ffffff",
            p: 2,
            borderRadius: "16px",
            border: "1px solid #eef0f3",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            mb: 4,
          }}
        >
          {/* Subcategory Pills */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, overflowX: "auto", maxWidth: { xs: "100%", md: "65%" } }}>
            {categories.map((cat) => {
              const isSelected = selectedSubCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedSubCategory(cat)}
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
                  {cat === "All" ? "ყველა აქტივობა" : cat}
                </button>
              );
            })}
          </Box>

          {/* Search Box */}
          <Box sx={{ width: { xs: "100%", md: "300px" } }}>
            <TextField
              size="small"
              fullWidth
              placeholder="ძებნა სახმელეთო აქტივობებში..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: "#9ca3af", mr: 1, fontSize: 20 }} />,
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "24px",
                  bgcolor: "#f9fafb",
                  "&:hover fieldset": { borderColor: "#cbd5e1" },
                  "&.Mui-focused fieldset": { borderColor: "#87003A" },
                },
              }}
            />
          </Box>
        </Box>

        {/* Loading Spinner */}
        {eventsLoading && <FunLoader />}

        {/* Card Grid */}
        {!eventsLoading && filtered.length > 0 && (
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
            {filtered.map((item) => (
              <ActivityCard
                key={item.id}
                image={getImageUrl(
                  item.image ||
                  item.primary_image?.image ||
                  item.images?.[0]?.image
                )}
                name={item.name}
                price={item.base_price || item.price}
                rating={item.average_rating || 4.9}
                location={item.location || item.city?.name || "საქართველო"}
                date={item.start_date || new Date().toISOString()}
                types={[item.category?.name || "სახმელეთო ტური"]}
                onClick={() => navigate(`/activity/${item.id}`)}
              />
            ))}
          </Box>
        )}

        {/* Empty State */}
        {!eventsLoading && filtered.length === 0 && (
          <Box
            sx={{
              textAlign: "center",
              py: 8,
              bgcolor: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #eef0f3",
            }}
          >
            <Typography variant="h6" fontWeight={700} color="#111827" mb={1}>
              სახმელეთო აქტივობები ვერ მოიძებნა
            </Typography>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedSubCategory("All");
              }}
              style={{
                padding: "8px 20px",
                borderRadius: "20px",
                border: "none",
                backgroundColor: "#87003A",
                color: "#ffffff",
                fontWeight: 600,
                cursor: "pointer",
                marginTop: "12px",
              }}
            >
              ფილტრების გასუფთავება
            </button>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default LandActivities;