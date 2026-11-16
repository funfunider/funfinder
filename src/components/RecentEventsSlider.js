import React, { useState, useEffect, useMemo } from "react";
import { Box, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import StarIcon from "@mui/icons-material/Star";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import RowingIcon from "@mui/icons-material/Rowing";
import SailingIcon from "@mui/icons-material/Sailing";
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";
import ElectricBikeIcon from "@mui/icons-material/ElectricBike";
import TerrainIcon from "@mui/icons-material/Terrain";
import SpeedIcon from "@mui/icons-material/Speed";
import ExploreIcon from "@mui/icons-material/Explore";
import { useLanguageNavigate } from "../hooks/useLanguageNavigate";
import { useLanguage } from "../contexts/LanguageContext";
import { eventsApi } from "../services/api";
import FunLoader from "./FunLoader";
import { getImageUrl } from "../utils/imageUtils";
import { getEventDetailUrl } from "../utils/routeHelper";
import "./MainSlider.css";

const getCategoryIcon = (catName = "") => {
  const lower = catName.toLowerCase();
  if (lower.includes("jeep")) return <DirectionsCarIcon sx={{ fontSize: 16 }} />;
  if (lower.includes("quad")) return <ElectricBikeIcon sx={{ fontSize: 16 }} />;
  if (lower.includes("moto")) return <TwoWheelerIcon sx={{ fontSize: 16 }} />;
  if (lower.includes("rafting")) return <RowingIcon sx={{ fontSize: 16 }} />;
  if (lower.includes("yacht") || lower.includes("boat") || lower.includes("ship")) return <SailingIcon sx={{ fontSize: 16 }} />;
  if (lower.includes("hike") || lower.includes("hiking")) return <TerrainIcon sx={{ fontSize: 16 }} />;
  if (lower.includes("jet") || lower.includes("speed")) return <SpeedIcon sx={{ fontSize: 16 }} />;
  return <ExploreIcon sx={{ fontSize: 16 }} />;
};

const RecentEventsSlider = ({ categoryName, categoryId, events: passedEvents }) => {
  const navigate = useLanguageNavigate();
  const { language } = useLanguage();
  const [events, setEvents] = useState(passedEvents || []);
  const [loading, setLoading] = useState(!passedEvents);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (passedEvents && passedEvents.length > 0) {
      setEvents(passedEvents);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchRecentEvents = async () => {
      try {
        setLoading(true);
        const all = await eventsApi.getAll();
        if (!isMounted) return;

        let filtered = Array.isArray(all) ? all : [];

        if (categoryId) {
          filtered = filtered.filter((event) => {
            const eId = event.category?.id;
            return eId && String(eId) === String(categoryId);
          });
        } else if (categoryName) {
          const target = categoryName.toLowerCase().trim();
          filtered = filtered.filter((event) => {
            const eName = (event.category?.name || "").toLowerCase().trim();
            return (
              eName === target ||
              eName.includes(target) ||
              target.includes(eName)
            );
          });
        }

        // Sort by ID descending and take up to 4 featured events
        const sorted = filtered.sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 4);
        setEvents(sorted);
      } catch (err) {
        if (isMounted) setEvents([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRecentEvents();
    return () => {
      isMounted = false;
    };
  }, [categoryName, categoryId, passedEvents]);

  const activeEvent = useMemo(() => {
    if (!events || events.length === 0) return null;
    return events[activeIndex] || events[0];
  }, [events, activeIndex]);

  if (loading) {
    return <FunLoader />;
  }

  if (!events || events.length === 0 || !activeEvent) {
    return null;
  }

  const isKa = language === "ka";
  const activeImage = getImageUrl(
    activeEvent.primary_image?.image ||
    activeEvent.images?.[0]?.image ||
    activeEvent.image
  );
  const activeTitle = activeEvent.name || activeEvent.title || (isKa ? "თავგადასავალი" : "Adventure");
  const activeLocation = activeEvent.city?.name || activeEvent.location || (isKa ? "საქართველო" : "Georgia");
  const activeCategory = activeEvent.category?.name || categoryName || (isKa ? "აქტივობა" : "Activity");
  const activePrice = activeEvent.base_price || activeEvent.price;
  const activeRating = activeEvent.average_rating ? Number(activeEvent.average_rating).toFixed(1) : "4.9";
  const activeDuration = activeEvent.duration || (isKa ? "2-3 საათი" : "2-3 Hours");
  const activeUrl = getEventDetailUrl(activeEvent);

  const handleCardClick = () => {
    if (activeUrl) {
      navigate(activeUrl);
    }
  };

  return (
    <Box sx={{ width: "100%", position: "relative", mb: 3.5 }}>
      {/* Cinematic Showcase Card */}
      <div
        className="hero-spotlight-card"
        onClick={handleCardClick}
        style={{
          height: events.length > 1 ? "380px" : "340px",
          borderRadius: "20px",
          position: "relative",
          cursor: "pointer",
        }}
      >
        {/* Background Image with Ken Burns / smooth transition */}
        <div className="hero-spotlight-bg-wrap">
          <img
            key={activeEvent.id}
            src={activeImage}
            alt={activeTitle}
            className="hero-spotlight-img"
            loading="eager"
          />
        </div>

        {/* Dual Gradient Scrims for 100% crystal text clarity */}
        <div className="hero-spotlight-scrim-x" />
        <div className="hero-spotlight-scrim-y" />

        {/* Spotlight Content Overlay */}
        <div className="hero-spotlight-content" style={{ padding: "28px" }}>
          {/* Top Badges */}
          <div className="hero-spotlight-badge-row">
            <span className="hero-spotlight-badge">
              {getCategoryIcon(activeCategory)}
              <span>{activeCategory}</span>
            </span>

            <span className="hero-spotlight-rating">
              <StarIcon sx={{ fontSize: 15, color: "#facc15" }} />
              <strong>{activeRating}</strong>
              <span style={{ opacity: 0.85, fontSize: "0.78rem" }}>
                ({activeEvent.rating_count || 48}+)
              </span>
            </span>
          </div>

          {/* Title */}
          <h2
            className="hero-spotlight-title"
            style={{
              fontSize: "1.9rem",
              lineHeight: 1.25,
              marginBottom: "12px",
              maxWidth: "680px",
            }}
          >
            {activeTitle}
          </h2>

          {/* Meta: Location & Duration */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              marginBottom: "18px",
              flexWrap: "wrap",
            }}
          >
            <span className="hero-badge-location">
              <LocationOnIcon sx={{ fontSize: 14, color: "#f43f5e", mr: 0.5 }} />
              <span>{activeLocation}</span>
            </span>
            <span className="hero-badge-location">
              <AccessTimeIcon sx={{ fontSize: 14, color: "#38bdf8", mr: 0.5 }} />
              <span>{activeDuration}</span>
            </span>
          </div>

          {/* Bottom Actions Row: Price + CTA + Multiple Item Switcher */}
          <div
            className="hero-spotlight-actions"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            {/* Price & CTA Button */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              {activePrice && (
                <div className="hero-spotlight-price-pill">
                  <span className="hero-price-label">
                    {isKa ? "ფასი" : "Price"}
                  </span>
                  <span className="hero-price-val">
                    {activePrice} ₾
                  </span>
                </div>
              )}

              <button
                type="button"
                className="hero-spotlight-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick();
                }}
              >
                <span>{isKa ? "დეტალურად ნახვა" : "View Details"}</span>
                <ArrowForwardIcon sx={{ fontSize: 16 }} />
              </button>
            </div>

            {/* Interactive Switcher for 2+ events (no auto-slider needed) */}
            {events.length > 1 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(15, 23, 42, 0.65)",
                  backdropFilter: "blur(8px)",
                  padding: "4px 8px",
                  borderRadius: "24px",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {events.map((ev, idx) => {
                  const isCurrent = idx === activeIndex;
                  const shortName = ev.name || ev.title || `${idx + 1}`;
                  return (
                    <button
                      key={ev.id || idx}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "16px",
                        border: "none",
                        backgroundColor: isCurrent ? "#87003A" : "transparent",
                        color: isCurrent ? "#ffffff" : "rgba(255, 255, 255, 0.75)",
                        fontSize: "12.5px",
                        fontWeight: isCurrent ? 700 : 500,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        whiteSpace: "nowrap",
                        maxWidth: "140px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={shortName}
                    >
                      {shortName}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Box>
  );
};

export default RecentEventsSlider;
