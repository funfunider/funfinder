import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Rating from "@mui/material/Rating";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { getImageUrl, DEFAULT_ACTIVITY_IMAGE } from "../utils/imageUtils";
import { useCurrency } from "../contexts/CurrencyContext";
import { useLanguage } from "../contexts/LanguageContext";
import "./Categories.css";

const ActivityCard = ({
  image,
  name,
  times = [],
  types = [],
  price,
  rating,
  ratingCount,
  featured = false,
  location,
  soldOut = false,
  onClick,
  onReserve,
  onInfo,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { formatPrice } = useCurrency();
  const { language } = useLanguage();
  const isKa = language === "ka";

  // Format subtitle: e.g. "შაბათი, 18:00 • ბათუმი"
  const timeStr = times && times.length > 0 ? times[0] : "";
  const locationStr = location || (types && types.length > 0 ? types[0] : (isKa ? "საქართველო" : "Georgia"));
  const subtitle = [timeStr, locationStr].filter(Boolean).join(" • ");

  // Formatted price string with currency context
  const formattedPrice =
    price !== undefined && price !== null && price !== ""
      ? formatPrice ? formatPrice(Number(price) || price) : `${price} ₾`
      : null;

  return (
    <div
      className={`tkt-card ${featured ? "tkt-card-featured" : ""}`}
      onClick={onClick || onInfo || onReserve}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          (onClick || onInfo || onReserve)?.();
        }
      }}
    >
      {/* Poster Image Container */}
      <div className="tkt-card-media-wrapper">
        <img
          src={getImageUrl(image)}
          alt={name}
          loading="lazy"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = DEFAULT_ACTIVITY_IMAGE;
            setImageLoaded(true);
          }}
          className="tkt-card-image"
          style={{ opacity: imageLoaded ? 1 : 0.85, transition: "opacity 0.3s ease, transform 0.5s cubic-bezier(0.2, 0, 0, 1)" }}
        />

        {/* Gradient Scrim for Contrast */}
        <div className="tkt-card-gradient-overlay" />

        {/* Top-Right Status Badge (Featured / Sold Out / Category) */}
        {soldOut ? (
          <div className="tkt-status-badge tkt-status-soldout">{isKa ? "გაყიდულია" : "Sold Out"}</div>
        ) : featured ? (
          <div className="tkt-status-badge tkt-status-featured">★ {isKa ? "რჩეული" : "Featured"}</div>
        ) : types && types.length > 0 && types[0] ? (
          <div className="tkt-status-badge">{types[0]}</div>
        ) : null}
      </div>

      {/* Card Info Section */}
      <div className="tkt-card-info">
        <h3 className="tkt-card-title" title={name}>
          {name}
        </h3>

        {/* Subtitle / Location / Time with Icon */}
        {subtitle && (
          <div className="tkt-card-subtitle-wrapper">
            <LocationOnIcon sx={{ fontSize: 14, color: "#87003A", flexShrink: 0, mr: 0.4 }} />
            <span className="tkt-card-subtitle" title={subtitle}>
              {subtitle}
            </span>
          </div>
        )}

        {/* Rating and Price Row */}
        <div className="tkt-card-bottom-row">
          <div className="tkt-card-rating-wrapper">
            {rating !== undefined && rating !== null && Number(rating) > 0 ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Rating value={Number(rating)} precision={0.1} size="small" readOnly sx={{ fontSize: "0.9rem", color: "#f59e0b" }} />
                <Typography variant="caption" sx={{ color: "#374151", fontWeight: 700, fontSize: "0.8rem" }}>
                  {Number(rating).toFixed(1)}
                </Typography>
                {ratingCount ? (
                  <Typography variant="caption" sx={{ color: "#9ca3af", fontSize: "0.75rem" }}>
                    ({ratingCount})
                  </Typography>
                ) : null}
              </Box>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Rating value={5} size="small" readOnly sx={{ fontSize: "0.9rem", color: "#f59e0b" }} />
                <Typography variant="caption" sx={{ color: "#374151", fontWeight: 700, fontSize: "0.8rem" }}>
                  5.0
                </Typography>
              </Box>
            )}
          </div>

          {formattedPrice && (
            <div className="tkt-card-price">
              <span className="tkt-card-price-amount">{formattedPrice}</span>
              <span className="tkt-card-price-suffix">{isKa ? "-დან" : "from"}</span>
            </div>
          )}
        </div>

        {/* Micro-action footer bar */}
        <div className="tkt-card-action-bar">
          <span className="tkt-card-action-text">{isKa ? "დაჯავშნა" : "Book Now"}</span>
          <ArrowForwardIcon sx={{ fontSize: 15, transition: "transform 0.2s ease" }} className="tkt-action-arrow" />
        </div>
      </div>
    </div>
  );
};

export default ActivityCard;
