import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Chip,
  Snackbar,
  Alert,
  Button,
  CircularProgress,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GroupIcon from "@mui/icons-material/Group";
import LanguageIcon from "@mui/icons-material/Language";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoIcon from "@mui/icons-material/Info";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ShareIcon from "@mui/icons-material/Share";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import CloseIcon from "@mui/icons-material/Close";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import PhoneIcon from "@mui/icons-material/Phone";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import MapIcon from "@mui/icons-material/Map";
import ShieldIcon from "@mui/icons-material/Shield";
import BoltIcon from "@mui/icons-material/Bolt";

import { useLanguageNavigate } from "../../hooks/useLanguageNavigate";
import { useLanguage } from "../../contexts/LanguageContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import { useEventFeed, usePopularEvents, useEventDetails } from "../../hooks/useApi";
import ActivityCard from "../../components/ActivityCard";
import EventReviews from "../../components/EventReviews";
import { getImageUrl, DEFAULT_ACTIVITY_IMAGE } from "../../utils/imageUtils";
import { getEventDetailUrl, slugify } from "../../utils/routeHelper";
import { updateSeoMeta, buildEventJsonLd } from "../../utils/seoUtils";
import "./ActivityDetails.css";

const WHATSAPP_NUMBER = "+995555346132";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER.replace("+", "").replace(/\s/g, "")}`;

// Extract real images strictly from the database/event object without dummy fillers

export const extractActivityImages = (act) => {
  if (!act) return [DEFAULT_ACTIVITY_IMAGE];

  const rawList = [];

  const extractPath = (val) => {
    if (!val) return null;
    if (typeof val === "string") return val;
    if (typeof val === "object") {
      return (
        val.image ||
        val.url ||
        val.raw_path ||
        val.raw_image ||
        val.src ||
        val.path ||
        val.file ||
        val.primary_image?.image ||
        val.primary_image
      );
    }
    return null;
  };

  // 1. Primary image ALWAYS comes first (in DB: primary_image: { image: "/uploads/service_images/...", ... })
  if (act.primary_image) {
    const p = extractPath(act.primary_image);
    if (p) rawList.push(p);
  }

  // 2. Main image property (if distinct from primary_image, or slider image)
  if (act.image) {
    const p = extractPath(act.image);
    if (p) rawList.push(p);
  }

  // 3. Array of images (images, service_images, event_images, photos, gallery)
  const arraySources = [
    act.images,
    act.service_images,
    act.event_images,
    act.photos,
    act.gallery,
    act.slider_images,
  ];

  arraySources.forEach((arr) => {
    if (Array.isArray(arr) && arr.length > 0) {
      arr.forEach((item) => {
        const p = extractPath(item);
        if (p) rawList.push(p);
      });
    }
  });

  // 4. Secondary cover/thumbnail
  if (act.cover_image) {
    const p = extractPath(act.cover_image);
    if (p) rawList.push(p);
  }
  if (act.thumbnail) {
    const p = extractPath(act.thumbnail);
    if (p) rawList.push(p);
  }

  // Clean, map to getImageUrl and deduplicate preserving exact priority order
  const seen = new Set();
  const cleanList = [];

  for (const item of rawList) {
    if (!item) continue;
    const url = getImageUrl(item);
    if (url && !seen.has(url)) {
      seen.add(url);
      cleanList.push(url);
    }
  }

  // If literally 0 images exist in DB object, return 1 clean fallback
  if (cleanList.length === 0) {
    return [DEFAULT_ACTIVITY_IMAGE];
  }

  return cleanList;
};

const ActivityDetails = () => {
  const navigate = useNavigate();
  const langNavigate = useLanguageNavigate();
  const { language } = useLanguage();
  const { id, category, title } = useParams();
  const { currency, convertPrice, formatPrice } = useCurrency();

  const { data: allEvents, loading: allEventsLoading } = useEventFeed();
  const { data: popularEvents, loading: popularLoading } = usePopularEvents();

  // Combine feeds into pool
  const pool = useMemo(() => {
    return [...(allEvents || []), ...(popularEvents || [])];
  }, [allEvents, popularEvents]);

  // Match event from feed by id OR by slug (category/title)
  const matchedFeedEvent = useMemo(() => {
    if (!pool || pool.length === 0) return null;
    if (id) {
      return pool.find((e) => String(e.id) === String(id) || e.id === parseInt(id, 10)) || null;
    }
    if (title || category) {
      const targetSlug = slugify(title || "");
      const targetCat = slugify(category || "");
      // Try exact title match first
      const exact = pool.find((e) => {
        const eTitle = slugify(e.name || e.title || "");
        return targetSlug && eTitle === targetSlug;
      });
      if (exact) return exact;

      // Try title substring or category match
      return (
        pool.find((e) => {
          const eTitle = slugify(e.name || e.title || "");
          const eCat = slugify(e.category?.name || e.category_name || "");
          return (
            (targetSlug && (eTitle.includes(targetSlug) || targetSlug.includes(eTitle))) ||
            (targetCat && eCat === targetCat)
          );
        }) || null
      );
    }
    return null;
  }, [pool, id, title, category]);

  const resolvedId = id ? parseInt(id, 10) : matchedFeedEvent?.id || null;
  const { data: apiActivity, loading: detailsLoading } = useEventDetails(resolvedId);

  // Next 5 days generation
  const nextDays = useMemo(() => {
    const days = [];
    const georgianDays = ["კვი", "ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ"];
    const georgianMonths = [
      "იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ",
    ];
    const now = new Date();
    for (let i = 0; i < 5; i++) {
      const d = new Date();
      d.setDate(now.getDate() + i);
      const label = i === 0 ? "დღეს" : i === 1 ? "ხვალ" : georgianDays[d.getDay()];
      const dateStr = `${d.getDate()} ${georgianMonths[d.getMonth()]}`;
      days.push({ id: `${label}, ${dateStr}`, label, dateStr });
    }
    return days;
  }, []);

  // States
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const georgianMonths = [
      "იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ",
    ];
    const now = new Date();
    return `დღეს, ${now.getDate()} ${georgianMonths[now.getMonth()]}`;
  });
  const [selectedTime, setSelectedTime] = useState("");
  const [guestsCount, setGuestsCount] = useState(1);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Resolve activity data strictly from API or feed
  const activity = useMemo(() => {
    // 1. If API returned valid detail, use it directly (it has full images[] array!)
    if (apiActivity && (apiActivity.name || apiActivity.title)) {
      return apiActivity;
    }

    // 2. If matched from feed pool, use it
    if (matchedFeedEvent) {
      return matchedFeedEvent;
    }

    return null;
  }, [apiActivity, matchedFeedEvent]);

  // Extract all available time slots (from time_slots objects or timeSlots strings)
  const availableSlots = useMemo(() => {
    if (Array.isArray(activity?.time_slots) && activity.time_slots.length > 0) {
      return activity.time_slots;
    }
    if (Array.isArray(activity?.timeSlots) && activity.timeSlots.length > 0) {
      return activity.timeSlots.map(s => typeof s === 'string' ? { start_time: s, price: activity.discounted_price || activity.base_price } : s);
    }
    const defBase = parseFloat(activity?.discounted_price || activity?.base_price || 30);
    return [
      { start_time: "11:00", price: defBase },
      { start_time: "14:00", price: defBase },
      { start_time: "17:00", price: Math.round(defBase * 1.25), slot_label: "Sunset" },
      { start_time: "19:00", price: Math.round(defBase * 1.25), slot_label: "Evening" }
    ];
  }, [activity]);

  // Set default time slot when activity loads
  useEffect(() => {
    if (availableSlots && availableSlots.length > 0) {
      const first = availableSlots[0];
      setSelectedTime(typeof first === 'string' ? first : first.start_time);
    } else {
      setSelectedTime("12:00");
    }
  }, [availableSlots]);

  // Strictly extract real images from database / event object
  const allImages = useMemo(() => {
    return extractActivityImages(activity);
  }, [activity]);

  // Dynamic SEO & Open Graph Meta updates for search engines and social sharing
  useEffect(() => {
    if (activity) {
      const actTitle = activity.name || activity.title || "";
      const actDesc = activity.description || "";
      const actCover = activity.cover_image || (allImages && allImages[0]) || "";
      const pageUrl = window.location.href;
      const jsonLd = buildEventJsonLd(activity, language);

      updateSeoMeta({
        title: actTitle,
        description: actDesc,
        image: actCover,
        url: pageUrl,
        type: 'article',
        lang: language,
        keywords: `${actTitle}, ${activity.category?.name || ''}, ${activity.city?.name || ''}, adventures Georgia, funfinder`,
        jsonLd,
      });
    }
  }, [activity, language, allImages]);

  // Check if current event is Car Rental
  const isCarRental = activity?.booking_type === 'car_rental' || activity?.category?.slug === 'car-rental';

  // Find currently selected slot data
  const selectedSlotData = useMemo(() => {
    if (!availableSlots || availableSlots.length === 0) return null;
    return availableSlots.find(s => (typeof s === 'string' ? s : s.start_time) === selectedTime) || availableSlots[0];
  }, [availableSlots, selectedTime]);

  // Price calculations depending on selected slot and booking type
  const slotSpecificPrice = selectedSlotData && typeof selectedSlotData === 'object' && selectedSlotData.price
    ? parseFloat(selectedSlotData.price)
    : (parseFloat(activity?.discounted_price) || parseFloat(activity?.base_price) || 0);

  const unitPrice = isCarRental
    ? (parseFloat(activity?.daily_price) || parseFloat(activity?.base_price) || 90)
    : slotSpecificPrice;

  const originalPrice = parseFloat(activity?.base_price) || unitPrice;
  const totalPrice = unitPrice * guestsCount;
  const hasDiscount = originalPrice > unitPrice && !isCarRental;

  // Similar activities directly from database pool
  const similarActivities = useMemo(() => {
    if (!pool || pool.length === 0 || !activity) return [];
    return pool.filter((item) => item.id !== activity.id).slice(0, 4);
  }, [pool, activity]);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: activity?.name || "",
        text: `შეამოწმე ეს თავგადასავალი Funfinder-ზე: ${activity?.name || ""}`,
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setToastMsg("ბმული დაკოპირდა გაცვლის ბუფერში!");
      setToastOpen(true);
    }
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    setToastMsg(!isFavorite ? "დაემატა რჩეულებში!" : "წაიშალა რჩეულებიდან");
    setToastOpen(true);
  };

  const handleBookNow = () => {
    if (!activity) return;
    if (activity.is_active === false) {
      alert(language === 'ka' ? 'ეს აქტივობა ამჟამად მიუწვდომელია (არააქტიურია).' : 'This activity is currently inactive and cannot be booked.');
      return;
    }
    langNavigate("/payment", {
      state: {
        bookingMode: isCarRental ? 'rental' : 'activity',
        bookingData: {
          bookingType: isCarRental ? 'rental' : 'activity',
          activity: {
            ...activity,
            id: activity.id,
            name: activity.name,
            image: allImages[0],
            base_price: parseFloat(unitPrice),
            discounted_price: parseFloat(activity.discounted_price || unitPrice),
            price_per_person: parseFloat(activity.price_per_person || unitPrice),
            adult_price: activity.adult_price,
            child_price: activity.child_price,
            infant_price: activity.infant_price,
            age_prices: activity.age_prices,
            slots_pricing: activity.slots_pricing,
            working_hours_start: activity.working_hours_start,
            working_hours_end: activity.working_hours_end,
            slot_duration_mins: activity.slot_duration_mins,
            daily_price: parseFloat(activity.daily_price || unitPrice),
            deposit_amount: parseFloat(activity.deposit_amount || 200),
            car_transmission: activity.car_transmission,
            car_fuel: activity.car_fuel,
            car_seats: activity.car_seats,
            booking_type: activity.booking_type || (isCarRental ? 'car_rental' : 'activity'),
            time_slots: activity.time_slots || activity.timeSlots,
            duration: activity.duration,
            location: activity.location || activity.city?.name,
            description: activity.description,
          },
          bookingDetails: {
            name: "",
            phone: "",
            date: selectedDate,
            time: selectedTime,
            participants: guestsCount,
            totalPrice,
            slotData: selectedSlotData
          },
        },
      },
    });
  };

  const handleMobileBookClick = () => {
    const bookingWidget = document.getElementById("booking-widget-card");
    if (bookingWidget) {
      const rect = bookingWidget.getBoundingClientRect();
      const inView =
        rect.top >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
      if (inView) {
        handleBookNow();
      } else {
        bookingWidget.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else {
      handleBookNow();
    }
  };

  const openLightbox = (index) => {
    setSelectedImageIndex(index);
    setLightboxOpen(true);
  };

  // If activity is still loading or not found
  if (!activity) {
    const isLoading = detailsLoading || allEventsLoading || popularLoading;
    return (
      <div
        className="act-details-container"
        style={{
          minHeight: "65vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "16px",
          textAlign: "center",
          padding: "60px 20px",
        }}
      >
        {isLoading ? (
          <>
            <CircularProgress sx={{ color: "#87003A" }} />
            <Typography variant="body1" sx={{ color: "#6b7280", fontWeight: 600 }}>
              {language === "ka" ? "აქტივობა იტვირთება..." : "Loading activity..."}
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="h5" fontWeight={800} color="#111827">
              {language === "ka" ? "აქტივობა ვერ მოიძებნა" : "Activity Not Found"}
            </Typography>
            <Typography variant="body2" color="#6b7280" sx={{ maxWidth: 450 }}>
              {language === "ka"
                ? "მოთხოვნილი აქტივობა ბაზაში არ არსებობს ან წაშლილია."
                : "The requested activity does not exist in the database or has been removed."}
            </Typography>
            <Button
              onClick={() => navigate("/")}
              variant="contained"
              sx={{
                bgcolor: "#87003A",
                "&:hover": { bgcolor: "#67002c" },
                borderRadius: "10px",
                mt: 1,
                textTransform: "none",
                fontWeight: 700,
                px: 3,
                py: 1,
              }}
            >
              {language === "ka" ? "მთავარ გვერდზე დაბრუნება" : "Back to Home"}
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="act-details-container">
      {/* Breadcrumbs */}
      <nav className="act-breadcrumbs">
        <Link to="/">მთავარი</Link>
        <span className="act-breadcrumbs-sep">/</span>
        <Link to={activity.category?.activity === "water" ? "/water-activities" : "/land-activities"}>
          {activity.category?.name || "აქტივობები"}
        </Link>
        <span className="act-breadcrumbs-sep">/</span>
        <span className="act-breadcrumbs-active">{activity.name}</span>
      </nav>

      {/* Header Row */}
      <div className="act-header-row">
        <div>
          <h1 className="act-title">{activity.name}</h1>
          <div className="act-meta-row">
            <span className="act-rating-badge">
              <StarIcon className="act-rating-star" />
              {activity.average_rating || 4.9}
              <span style={{ color: "#6b7280", fontWeight: 500 }}>
                ({activity.rating_count || 128} შეფასება)
              </span>
            </span>

            <span className="act-location-link">
              <LocationOnIcon sx={{ fontSize: 18, color: "#87003A" }} />
              {activity.location || activity.city?.name || "საქართველო"}
            </span>

            {activity.category?.name && (
              <span className="act-category-pill">{activity.category.name}</span>
            )}

            <Chip
              icon={<VerifiedUserIcon sx={{ fontSize: 15, color: "#059669 !important" }} />}
              label="ვერიფიცირებული ოპერატორი"
              size="small"
              sx={{
                bgcolor: "#ecfdf5",
                color: "#059669",
                fontWeight: 600,
                fontSize: "12px",
                height: 24,
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="act-actions-group">
          <button
            className={`act-action-btn ${isFavorite ? "active" : ""}`}
            onClick={handleToggleFavorite}
          >
            {isFavorite ? <FavoriteIcon sx={{ fontSize: 18 }} /> : <FavoriteBorderIcon sx={{ fontSize: 18 }} />}
            <span>{isFavorite ? "რჩეულია" : "რჩეულებში"}</span>
          </button>

          <button className="act-action-btn" onClick={handleShare}>
            <ShareIcon sx={{ fontSize: 18 }} />
            <span>გაზიარება</span>
          </button>
        </div>
      </div>

      {/* Dynamic Photo Gallery (Adapts directly to the number of photos from DB) */}
      <div className="act-gallery-container">
        {allImages.length === 1 && (
          <div className="act-gallery-1" onClick={() => openLightbox(0)}>
            <div className="act-gallery-main">
              <img
                src={allImages[0]}
                alt={activity.name}
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_ACTIVITY_IMAGE;
                }}
              />
            </div>
            <button
              className="act-view-all-photos-btn"
              onClick={(e) => {
                e.stopPropagation();
                openLightbox(0);
              }}
            >
              <PhotoCameraIcon sx={{ fontSize: 18 }} />
              1 ფოტო
            </button>
          </div>
        )}

        {allImages.length === 2 && (
          <div className="act-gallery-2">
            <div className="act-gallery-item" onClick={() => openLightbox(0)}>
              <img
                src={allImages[0]}
                alt={activity.name}
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_ACTIVITY_IMAGE;
                }}
              />
            </div>
            <div className="act-gallery-item" onClick={() => openLightbox(1)}>
              <img
                src={allImages[1]}
                alt={`${activity.name} 2`}
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_ACTIVITY_IMAGE;
                }}
              />
            </div>
            <button
              className="act-view-all-photos-btn"
              onClick={(e) => {
                e.stopPropagation();
                openLightbox(0);
              }}
            >
              <PhotoCameraIcon sx={{ fontSize: 18 }} />
              2 ფოტო
            </button>
          </div>
        )}

        {allImages.length === 3 && (
          <div className="act-gallery-3">
            <div className="act-gallery-main" onClick={() => openLightbox(0)}>
              <img
                src={allImages[0]}
                alt={activity.name}
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_ACTIVITY_IMAGE;
                }}
              />
            </div>
            <div className="act-gallery-3-side">
              <div className="act-gallery-item" onClick={() => openLightbox(1)}>
                <img
                  src={allImages[1]}
                  alt={`${activity.name} 2`}
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_ACTIVITY_IMAGE;
                  }}
                />
              </div>
              <div className="act-gallery-item" onClick={() => openLightbox(2)}>
                <img
                  src={allImages[2]}
                  alt={`${activity.name} 3`}
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_ACTIVITY_IMAGE;
                  }}
                />
              </div>
            </div>
            <button
              className="act-view-all-photos-btn"
              onClick={(e) => {
                e.stopPropagation();
                openLightbox(0);
              }}
            >
              <PhotoCameraIcon sx={{ fontSize: 18 }} />
              3 ფოტო
            </button>
          </div>
        )}

        {allImages.length === 4 && (
          <div className="act-gallery-4">
            <div className="act-gallery-main" onClick={() => openLightbox(0)}>
              <img
                src={allImages[0]}
                alt={activity.name}
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_ACTIVITY_IMAGE;
                }}
              />
            </div>
            <div className="act-gallery-4-side">
              {allImages.slice(1, 4).map((img, idx) => (
                <div key={idx} className="act-gallery-item" onClick={() => openLightbox(idx + 1)}>
                  <img
                    src={img}
                    alt={`${activity.name} ${idx + 2}`}
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_ACTIVITY_IMAGE;
                    }}
                  />
                </div>
              ))}
            </div>
            <button
              className="act-view-all-photos-btn"
              onClick={(e) => {
                e.stopPropagation();
                openLightbox(0);
              }}
            >
              <PhotoCameraIcon sx={{ fontSize: 18 }} />
              4 ფოტო
            </button>
          </div>
        )}

        {allImages.length >= 5 && (
          <div className="act-gallery-5">
            <div className="act-gallery-main" onClick={() => openLightbox(0)}>
              <img
                src={allImages[0]}
                alt={activity.name}
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_ACTIVITY_IMAGE;
                }}
              />
            </div>
            <div className="act-gallery-5-thumbs">
              {allImages.slice(1, 5).map((img, idx) => (
                <div key={idx} className="act-gallery-item" onClick={() => openLightbox(idx + 1)}>
                  <img
                    src={img}
                    alt={`${activity.name} ${idx + 2}`}
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_ACTIVITY_IMAGE;
                    }}
                  />
                </div>
              ))}
            </div>
            <button
              className="act-view-all-photos-btn"
              onClick={(e) => {
                e.stopPropagation();
                openLightbox(0);
              }}
            >
              <PhotoCameraIcon sx={{ fontSize: 18 }} />
              ყველა ფოტო ({allImages.length})
            </button>
          </div>
        )}
      </div>

      {/* Main Layout Grid */}
      <div className="act-layout-grid">
        {/* Left Column: Details */}
        <div className="act-main-column">
          {/* Highlights Ribbon */}
          <div className="act-highlights-strip">
            <div className="act-highlight-card">
              <div className="act-highlight-icon">
                <AccessTimeIcon sx={{ fontSize: 20 }} />
              </div>
              <div className="act-highlight-info">
                <span className="act-highlight-label">ხანგრძლივობა</span>
                <span className="act-highlight-val">{activity.duration || "2 საათი"}</span>
              </div>
            </div>

            <div className="act-highlight-card">
              <div className="act-highlight-icon">
                <GroupIcon sx={{ fontSize: 20 }} />
              </div>
              <div className="act-highlight-info">
                <span className="act-highlight-label">ჯგუფის ზომა</span>
                <span className="act-highlight-val">
                  {activity.min_people && activity.max_people
                    ? `${activity.min_people} - ${activity.max_people} პერსონა`
                    : "მოქნილი"}
                </span>
              </div>
            </div>

            <div className="act-highlight-card">
              <div className="act-highlight-icon">
                <LanguageIcon sx={{ fontSize: 20 }} />
              </div>
              <div className="act-highlight-info">
                <span className="act-highlight-label">ენები</span>
                <span className="act-highlight-val">{activity.languages || "GEO, ENG, RUS"}</span>
              </div>
            </div>

            <div className="act-highlight-card">
              <div className="act-highlight-icon">
                <ShieldIcon sx={{ fontSize: 20 }} />
              </div>
              <div className="act-highlight-info">
                <span className="act-highlight-label">უსაფრთხოება</span>
                <span className="act-highlight-val">სრული ეკიპირება</span>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="act-section">
            <h2 className="act-section-heading">აქტივობის შესახებ</h2>
            <p className="act-description-text">{activity.description}</p>
          </div>

          {/* What's Included / Requirements Section */}
          <div className="act-section">
            <div className="act-features-grid">
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111827", marginBottom: "14px" }}>
                  რა შედის ფასში
                </h3>
                <ul className="act-feature-list">
                  {(activity.included || [
                    "პროფესიონალი ინსტრუქტორის მომსახურება",
                    "სრული უსაფრთხოების აღჭურვილობა",
                    "საწვავი და ტექნიკური მხარდაჭერა",
                    "სამახსოვრო ფოტო და ვიდეო გადაღება",
                  ]).map((inc, i) => (
                    <li key={i} className="act-feature-item">
                      <CheckCircleIcon sx={{ fontSize: 18, color: "#059669", flexShrink: 0, mt: "2px" }} />
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111827", marginBottom: "14px" }}>
                  რეკომენდაციები და წესები
                </h3>
                <ul className="act-feature-list">
                  {(activity.requirements || [
                    "კომფორტული სპორტული ტანსაცმელი",
                    "მზისგან დამცავი სათვალე და კრემი",
                    "შეკრების ადგილზე მოსვლა 15 წუთით ადრე",
                    "ალკოჰოლის მიღება კატეგორიულად აკრძალულია",
                  ]).map((req, i) => (
                    <li key={i} className="act-feature-item">
                      <InfoIcon sx={{ fontSize: 18, color: "#87003A", flexShrink: 0, mt: "2px" }} />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Location & Meeting Point Section */}
          <div className="act-section">
            <h2 className="act-section-heading">შეკრების ადგილი და მდებარეობა</h2>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
              <LocationOnIcon sx={{ color: "#87003A", fontSize: 22, mt: "2px" }} />
              <div>
                <Typography variant="body1" fontWeight={700} color="#111827">
                  {activity.location || "ბათუმის პორტი / სანაპირო ზოლი"}
                </Typography>
                <Typography variant="body2" color="#6b7280">
                  დეტალური ლოკაცია და გიდის პირდაპირი ტელეფონი მოგეწოდებათ ჯავშნის დადასტურებისას
                </Typography>
              </div>
            </Box>

            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mt: 2 }}>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  activity.location || "Batumi Port Georgia"
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="act-contact-btn"
                style={{ background: "#f8fafc" }}
              >
                <MapIcon sx={{ fontSize: 18, color: "#87003A" }} />
                <span>Google Maps-ში ნახვა</span>
              </a>

              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="act-contact-btn whatsapp"
              >
                <WhatsAppIcon sx={{ fontSize: 18 }} />
                <span>ლოკაციის გაგზავნა WhatsApp-ში</span>
              </a>
            </Box>
          </div>

          {/* Reviews Section */}
          <div className="act-section">
            <h2 className="act-section-heading">მომხმარებელთა შეფასებები</h2>
            <EventReviews eventId={activity.id} />
          </div>


        </div>

        {/* Right Column: Sticky Booking Widget */}
        <div className="act-sidebar-column">
          <div className="act-booking-card" id="booking-widget-card">
            {/* Price Header */}
            <div className="act-booking-price-row">
              <div>
                <span className="act-price-main">{formatPrice(unitPrice)}</span>
                <span className="act-price-suffix">{isCarRental ? "/ დღე" : "/ პერსონაზე"}</span>
              </div>

              {hasDiscount && (
                <div style={{ textAlign: "right" }}>
                  <span style={{ textDecoration: "line-through", color: "#9ca3af", fontSize: "14px", display: "block" }}>
                    {formatPrice(originalPrice)}
                  </span>
                  <span className="act-discount-tag">
                    დაზოგე {formatPrice(originalPrice - unitPrice)}
                  </span>
                </div>
              )}
            </div>

            {/* Car Rental Specifications Badge */}
            {isCarRental && (
              <div style={{ marginBottom: "16px", padding: "12px", backgroundColor: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontWeight: 700, fontSize: "13px", color: "#1e293b", marginBottom: "6px" }}>
                  🚗 ავტომობილის მახასიათებლები:
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "12px", color: "#475569" }}>
                  <div>⚙️ {activity.car_transmission || "ავტომატიკა"}</div>
                  <div>⛽ {activity.car_fuel || "ბენზინი"}</div>
                  <div>💺 {activity.car_seats || 5} ადგილი</div>
                  <div>🛡️ დეპოზიტი: {formatPrice(activity.deposit_amount || 200)}</div>
                </div>
              </div>
            )}

            {/* Date Selection */}
            <div className="act-picker-group">
              <label className="act-picker-label">
                <span>აირჩიეთ დღე</span>
              </label>
              <div className="act-pills-row">
                {nextDays.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className={`act-slot-pill ${selectedDate === d.id ? "active" : ""}`}
                    onClick={() => setSelectedDate(d.id)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      padding: "6px 12px",
                      lineHeight: 1.2,
                    }}
                  >
                    <span style={{ fontSize: "11px", opacity: 0.85 }}>{d.label}</span>
                    <span style={{ fontSize: "13px", fontWeight: 700 }}>{d.dateStr}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slot Selection with Dynamic Prices */}
            {!isCarRental && (
              <div className="act-picker-group">
                <label className="act-picker-label">
                  <span>დრო / სესია & ტარიფი</span>
                </label>
                <div className="act-pills-row" style={{ flexWrap: "wrap", gap: "8px" }}>
                  {availableSlots.map((slotObj) => {
                    const slotTime = typeof slotObj === 'string' ? slotObj : slotObj.start_time;
                    const sPrice = typeof slotObj === 'object' && slotObj.price ? slotObj.price : null;
                    const sLabel = typeof slotObj === 'object' && slotObj.slot_label ? slotObj.slot_label : null;
                    const isSelected = selectedTime === slotTime;
                    return (
                      <button
                        key={slotTime}
                        type="button"
                        className={`act-slot-pill ${isSelected ? "active" : ""}`}
                        onClick={() => setSelectedTime(slotTime)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 12px",
                          lineHeight: 1.2
                        }}
                      >
                        <span style={{ fontWeight: 700 }}>{slotTime}</span>
                        {sPrice && (
                          <span style={{
                            fontSize: "11px",
                            padding: "2px 6px",
                            borderRadius: "6px",
                            backgroundColor: isSelected ? "rgba(255,255,255,0.25)" : "#e2e8f0",
                            color: isSelected ? "#ffffff" : "#0f172a",
                            fontWeight: 700
                          }}>
                            {sPrice} ₾
                          </span>
                        )}
                        {sLabel && (
                          <span style={{ fontSize: "10px", opacity: 0.9 }}>
                            {sLabel}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Guests / Tickets Counter */}
            <div className="act-picker-group">
              <label className="act-picker-label">
                <span>მონაწილეების რაოდენობა</span>
              </label>
              <div className="act-counter-box">
                <span style={{ fontSize: "14px", color: "#4b5563" }}>ადამიანების რაოდენობა</span>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <button
                    type="button"
                    className="act-counter-btn"
                    disabled={guestsCount <= 1}
                    onClick={() => setGuestsCount((prev) => Math.max(1, prev - 1))}
                  >
                    -
                  </button>
                  <span className="act-counter-val">{guestsCount}</span>
                  <button
                    type="button"
                    className="act-counter-btn"
                    disabled={guestsCount >= (activity.max_people || 10)}
                    onClick={() => setGuestsCount((prev) => prev + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Total Calculation */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
                borderTop: "1px dashed #e2e8f0",
                marginTop: "16px",
              }}
            >
              <span style={{ fontSize: "15px", fontWeight: 600, color: "#111827" }}>
                სულ გადასახდელი:
              </span>
              <span style={{ fontSize: "20px", fontWeight: 800, color: "#87003A" }}>
                {formatPrice(totalPrice)}
              </span>
            </div>

            {/* Primary CTA */}
            {activity.is_active === false ? (
              <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1.5px dashed #ef4444', borderRadius: '12px', color: '#b91c1c', fontWeight: 700, textAlign: 'center', fontSize: '14px', marginBottom: '8px' }}>
                {language === 'ka' ? '⚠️ აქტივობა დროებით არააქტიურია' : '⚠️ Activity currently unavailable'}
              </div>
            ) : (
              <button className="act-book-cta" onClick={handleBookNow}>
                <BoltIcon sx={{ fontSize: 20 }} />
                {language === 'ka' ? 'ბილეთის ყიდვა / დაჯავშნა' : 'Book Now / Buy Ticket'}
              </button>
            )}

            {/* Support Buttons */}
            <div className="act-contact-buttons-row">
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="act-contact-btn whatsapp">
                <WhatsAppIcon sx={{ fontSize: 16 }} />
                <span>WhatsApp</span>
              </a>
              <a href={`tel:${WHATSAPP_NUMBER}`} className="act-contact-btn call">
                <PhoneIcon sx={{ fontSize: 16 }} />
                <span>დარეკვა</span>
              </a>
            </div>

            {/* Security Guarantees */}
            <div className="act-guarantees">
              <div className="act-guarantee-item">
                <CheckCircleIcon sx={{ fontSize: 15, color: "#059669" }} />
                <span>მყისიერი ელექტრონული ვაუჩერი</span>
              </div>
              <div className="act-guarantee-item">
                <CheckCircleIcon sx={{ fontSize: 15, color: "#059669" }} />
                <span>უფასო გაუქმება 24 საათით ადრე</span>
              </div>
              <div className="act-guarantee-item">
                <ShieldIcon sx={{ fontSize: 15, color: "#059669" }} />
                <span>100% უსაფრთხო ონლაინ გადახდა</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Gallery Modal */}
      {lightboxOpen && (
        <div className="act-lightbox-overlay">
          <div className="act-lightbox-header">
            <span className="act-lightbox-counter">
              {selectedImageIndex + 1} / {allImages.length}
            </span>
            <button className="act-lightbox-close" onClick={() => setLightboxOpen(false)}>
              <CloseIcon sx={{ fontSize: 24 }} />
            </button>
          </div>

          <div className="act-lightbox-main">
            {allImages.length > 1 && selectedImageIndex > 0 && (
              <button
                className="act-lightbox-nav act-lightbox-prev"
                onClick={() => setSelectedImageIndex((prev) => prev - 1)}
              >
                <NavigateBeforeIcon sx={{ fontSize: 32 }} />
              </button>
            )}

            <img
              src={allImages[selectedImageIndex]}
              alt={activity.name}
              onError={(e) => {
                e.currentTarget.src = DEFAULT_ACTIVITY_IMAGE;
              }}
            />

            {allImages.length > 1 && selectedImageIndex < allImages.length - 1 && (
              <button
                className="act-lightbox-nav act-lightbox-next"
                onClick={() => setSelectedImageIndex((prev) => prev + 1)}
              >
                <NavigateNextIcon sx={{ fontSize: 32 }} />
              </button>
            )}
          </div>

          {allImages.length > 1 && (
            <div className="act-lightbox-thumbs">
              {allImages.map((thumb, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`act-lightbox-thumb-btn ${idx === selectedImageIndex ? "active" : ""}`}
                  onClick={() => setSelectedImageIndex(idx)}
                >
                  <img
                    src={thumb}
                    alt={`thumb-${idx}`}
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_ACTIVITY_IMAGE;
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mobile Sticky Floating Booking Bar */}
      <div className="act-mobile-bottom-bar">
        <div>
          <span style={{ fontSize: "12px", color: "#6b7280", display: "block" }}>
            {isCarRental ? "ფასი 1 დღეზე" : "ფასი ერთ პერსონაზე"}
          </span>
          <span style={{ fontSize: "20px", fontWeight: 800, color: "#87003A" }}>{formatPrice(unitPrice)}</span>
        </div>
        <button
          onClick={handleMobileBookClick}
          style={{
            padding: "10px 24px",
            borderRadius: "12px",
            background: "#87003A",
            color: "#ffffff",
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 3px 10px rgba(135,0,58,0.3)",
          }}
        >
          დაჯავშნა
        </button>
      </div>

      {/* Notification Toast */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={3000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" sx={{ width: "100%", borderRadius: "10px", fontWeight: 600 }}>
          {toastMsg}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ActivityDetails;
