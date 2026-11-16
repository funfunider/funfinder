import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useLanguageNavigate } from "../hooks/useLanguageNavigate";
import { useLanguage } from "../contexts/LanguageContext";
import { getImageUrl } from "../utils/imageUtils";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import StarIcon from "@mui/icons-material/Star";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import BoltIcon from "@mui/icons-material/Bolt";
import ShieldIcon from "@mui/icons-material/Shield";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import "./MainSlider.css";

const SLIDER_UI = {
  ka: {
    popularBadge: "პოპულარული აქტივობა",
    popularTitle: "პოპულარული აქტივობები",
    popularSub: "ტრენდული და ყველაზე მოთხოვნადი",
    exploreBtn: "დეტალურად ნახვა",
    priceLabel: "ფასი",
    prevLabel: "წინა სლაიდი",
    nextLabel: "შემდეგი სლაიდი",
    trust1Title: "მყისიერი ჯავშანი",
    trust1Sub: "E-ბილეთი წამებში",
    trust2Title: "100% უსაფრთხოება",
    trust2Sub: "სერტიფიცირებული გუნდი",
    trust3Title: "4.9/5 რეიტინგი",
    trust3Sub: "10,000+ კმაყოფილი სტუმარი",
    trust4Title: "მარტივი გადახდა",
    trust4Sub: "Apple Pay, Google Pay, ბარათი",
  },
  en: {
    popularBadge: "Popular Activity",
    popularTitle: "Popular Activities",
    popularSub: "Most booked & trending now",
    exploreBtn: "Explore Experience",
    priceLabel: "Price",
    prevLabel: "Previous slide",
    nextLabel: "Next slide",
    trust1Title: "Instant Confirmation",
    trust1Sub: "E-tickets in seconds",
    trust2Title: "Verified Safety",
    trust2Sub: "Certified instructors",
    trust3Title: "4.9/5 Guest Rating",
    trust3Sub: "10,000+ happy adventurers",
    trust4Title: "Secure Checkout",
    trust4Sub: "Apple Pay, Google Pay, Card",
  },
  ru: {
    popularBadge: "Популярная активность",
    popularTitle: "Популярные активности",
    popularSub: "Самые бронируемые туры",
    exploreBtn: "Подробнее",
    priceLabel: "Цена",
    prevLabel: "Предыдущий слайд",
    nextLabel: "Следующий слайд",
    trust1Title: "Мгновенная бронь",
    trust1Sub: "E-билет за секунды",
    trust2Title: "100% безопасность",
    trust2Sub: "Сертифицированная команда",
    trust3Title: "Рейтинг 4.9/5",
    trust3Sub: "10,000+ довольных гостей",
    trust4Title: "Удобная оплата",
    trust4Sub: "Apple Pay, Google Pay, Карта",
  },
  tr: {
    popularBadge: "Popüler Aktivite",
    popularTitle: "Popüler Aktiviteler",
    popularSub: "En çok tercih edilen turlar",
    exploreBtn: "Keşfet",
    priceLabel: "Fiyat",
    prevLabel: "Önceki",
    nextLabel: "Sonraki",
    trust1Title: "Anında Onay",
    trust1Sub: "Saniyeler içinde E-bilet",
    trust2Title: "Doğrulanmış Güvenlik",
    trust2Sub: "Sertifikalı eğitmenler",
    trust3Title: "4.9/5 Puan",
    trust3Sub: "10.000+ mutlu misafir",
    trust4Title: "Güvenli Ödeme",
    trust4Sub: "Apple Pay, Google Pay, Kart",
  },
  uk: {
    popularBadge: "Популярна активність",
    popularTitle: "Популярні активності",
    popularSub: "Найпопулярніші тури зараз",
    exploreBtn: "Детальніше",
    priceLabel: "Ціна",
    prevLabel: "Попередній",
    nextLabel: "Наступний",
    trust1Title: "Миттєве бронювання",
    trust1Sub: "E-квиток за секунди",
    trust2Title: "100% безпека",
    trust2Sub: "Сертифікована команда",
    trust3Title: "Рейтинг 4.9/5",
    trust3Sub: "10,000+ задоволених гостей",
    trust4Title: "Безпечна оплата",
    trust4Sub: "Apple Pay, Google Pay, Карта",
  },
  hy: {
    popularBadge: "Հանրաճանաչ ակտիվություն",
    popularTitle: "Հանրաճանաչ ակտիվություններ",
    popularSub: "Ամենապահանջված տուրերը",
    exploreBtn: "Մանրամասն",
    priceLabel: "Գին",
    prevLabel: "Նախորդ",
    nextLabel: "Հաջորդ",
    trust1Title: "Ակնթարթային ամրագրում",
    trust1Sub: "Էլ. տոմս վայրկյանների ընթացքում",
    trust2Title: "100% անվտանգություն",
    trust2Sub: "Հավաստագրված թիմ",
    trust3Title: "4.9/5 Վարկանիշ",
    trust3Sub: "10,000+ գոհ հյուր",
    trust4Title: "Անվտանգ վճարում",
    trust4Sub: "Apple Pay, Google Pay, Քարտ",
  },
  kk: {
    popularBadge: "Танымал белсенділік",
    popularTitle: "Танымал белсенділіктер",
    popularSub: "Ең көп брондалған турлар",
    exploreBtn: "Толығырақ",
    priceLabel: "Бағасы",
    prevLabel: "Алдыңғы",
    nextLabel: "Келесі",
    trust1Title: "Жедел брондау",
    trust1Sub: "Электрондық билет секундтарда",
    trust2Title: "100% қауіпсіздік",
    trust2Sub: "Сертификатталған команда",
    trust3Title: "4.9/5 Рейтинг",
    trust3Sub: "10,000+ риза қонақ",
    trust4Title: "Қауіпсіз төлем",
    trust4Sub: "Apple Pay, Google Pay, Карта",
  },
  zh: {
    popularBadge: "热门活动",
    popularTitle: "热门活动推荐",
    popularSub: "最受欢迎的精选体验",
    exploreBtn: "查看详情",
    priceLabel: "价格",
    prevLabel: "上一个",
    nextLabel: "下一个",
    trust1Title: "即时确认",
    trust1Sub: "秒速获取电子票",
    trust2Title: "安全保障",
    trust2Sub: "专业认证教练团队",
    trust3Title: "4.9/5 好评",
    trust3Sub: "10,000+ 满意游客",
    trust4Title: "安全支付",
    trust4Sub: "Apple Pay, Google Pay, 银行卡",
  },
  ar: {
    popularBadge: "نشاط شائع",
    popularTitle: "الأنشطة الشائعة",
    popularSub: "الأكثر حجزاً ورواجاً الآن",
    exploreBtn: "استكشف التجربة",
    priceLabel: "السعر",
    prevLabel: "السابق",
    nextLabel: "التالي",
    trust1Title: "تأكيد فوري",
    trust1Sub: "تذاكر إلكترونية في ثوانٍ",
    trust2Title: "أمان موثق",
    trust2Sub: "مدربون معتمدون",
    trust3Title: "تقييم 4.9/5",
    trust3Sub: "+10,000 مغامر سعيد",
    trust4Title: "دفع آمن",
    trust4Sub: "Apple Pay, Google Pay, بطاقة",
  },
  hi: {
    popularBadge: "लोकप्रिय गतिविधि",
    popularTitle: "लोकप्रिय गतिविधियाँ",
    popularSub: "सबसे अधिक बुक किए गए टूर",
    exploreBtn: "विवरण देखें",
    priceLabel: "मूल्य",
    prevLabel: "पिछला",
    nextLabel: "अगला",
    trust1Title: "त्वरित पुष्टि",
    trust1Sub: "सेकंडों में ई-टिकट",
    trust2Title: "सत्यापित सुरक्षा",
    trust2Sub: "प्रमाणित प्रशिक्षक",
    trust3Title: "4.9/5 रेटिंग",
    trust3Sub: "10,000+ खुश यात्री",
    trust4Title: "सुरक्षित भुगतान",
    trust4Sub: "Apple Pay, Google Pay, कार्ड",
  },
  he: {
    popularBadge: "פעילות פופולרית",
    popularTitle: "פעילויות פופולריות",
    popularSub: "האטרקציות המבוקשות ביותר",
    exploreBtn: "לפרטים נוספים",
    priceLabel: "מחיר",
    prevLabel: "הקודם",
    nextLabel: "הבא",
    trust1Title: "אישור מיידי",
    trust1Sub: "כרטיס דיגיטלי תוך שניות",
    trust2Title: "בטיחות מאומתת",
    trust2Sub: "מדריכים מוסמכים",
    trust3Title: "דירוג 4.9/5",
    trust3Sub: "10,000+ מטיילים מרוצים",
    trust4Title: "תשלום מאובטח",
    trust4Sub: "Apple Pay, Google Pay, כרטיס",
  },
};

// Fallback metadata dictionary for popular sliders when backend fields are sparse
const SLIDE_METADATA = {
  carting: {
    title_ka: "კარტინგი მახუნცეთში",
    location: "მახუნცეთი • აჭარა",
    location_en: "Makhuntseti • Adjara",
    category: "კარტინგი",
    category_en: "Go-Karting",
    price: "50 ₾-დან",
    price_en: "From 50 ₾",
    rating: "4.9",
  },
  buggy: {
    title_ka: "მტირალას ბაგი ტური",
    location: "მტირალას პარკი • ჩაქვი",
    location_en: "Mtirala Park • Chakvi",
    category: "ბაგი ტური",
    category_en: "Buggy Tour",
    price: "120 ₾-დან",
    price_en: "From 120 ₾",
    rating: "5.0",
  },
  buran: {
    title_ka: "ბურანი გოდერძის უღელტეხილზე",
    location: "გოდერძი • მთის უღელტეხილი",
    location_en: "Goderdzi • Mountain Pass",
    category: "სნოუმობილი",
    category_en: "Snowmobile",
    price: "90 ₾-დან",
    price_en: "From 90 ₾",
    rating: "4.8",
  },
  jeep: {
    title_ka: "ჯიპ ტური 4x4",
    location: "ყაზბეგი • თრუსოს ხეობა",
    location_en: "Kazbegi • Truso Valley",
    category: "ჯიპ ტური",
    category_en: "4x4 Jeep Tour",
    price: "80 ₾-დან",
    price_en: "From 80 ₾",
    rating: "4.9",
  },
};

const getSlideMeta = (title = "", lang = "ka") => {
  const lower = title.toLowerCase();
  let meta = null;
  if (lower.includes("carting") || lower.includes("karting") || lower.includes("კარტინგი")) {
    meta = SLIDE_METADATA.carting;
  } else if (lower.includes("buggy") || lower.includes("maverick") || lower.includes("ბაგი")) {
    meta = SLIDE_METADATA.buggy;
  } else if (lower.includes("buran") || lower.includes("goderdzi") || lower.includes("ბურანი")) {
    meta = SLIDE_METADATA.buran;
  } else if (lower.includes("jeep") || lower.includes("ჯიპ")) {
    meta = SLIDE_METADATA.jeep;
  }

  if (meta) {
    return {
      title_ka: meta.title_ka,
      location: lang === "ka" ? meta.location : meta.location_en,
      category: lang === "ka" ? meta.category : meta.category_en,
      price: lang === "ka" ? meta.price : meta.price_en,
      rating: meta.rating,
    };
  }

  return {
    title_ka: null,
    location: lang === "ka" ? "საქართველო" : "Georgia",
    category: lang === "ka" ? "თავგადასავალი" : "Adventure",
    price: lang === "ka" ? "საუკეთესო ფასი" : "Best Price",
    rating: "4.9",
  };
};

const MainSlider = ({ slides = [], popularEvents = [] }) => {
  const navigate = useLanguageNavigate();
  const { language, t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const timerRef = useRef(null);
  const listRef = useRef(null);
  const cardRefs = useRef([]);
  const touchStartXRef = useRef(null);

  const ui = SLIDER_UI[language] || SLIDER_UI.en;
  const isGeo = language === "ka";

  // Map popularEvents by ID so slides can enrich with real localized DB info when available
  const popularById = useMemo(() => {
    const map = {};
    if (Array.isArray(popularEvents)) {
      popularEvents.forEach((ev) => {
        if (ev && ev.id !== undefined) {
          map[String(ev.id)] = ev;
        }
      });
    }
    return map;
  }, [popularEvents]);

  // Consolidate items: use backend slides or top popular events
  const items = useMemo(() => {
    if (slides && slides.length > 0) {
      return slides.map((s, index) => {
        const meta = getSlideMeta(s.title || "", language);
        const match = s.link ? String(s.link).match(/\/activity\/(\d+)/) : null;
        const matchedEvent = match ? popularById[match[1]] : null;

        const resolvedTitle =
          matchedEvent?.name ||
          matchedEvent?.title ||
          (isGeo && meta.title_ka ? meta.title_ka : null) ||
          s.title ||
          (isGeo ? "პოპულარული თავგადასავალი" : "Popular Adventure");

        const resolvedDesc = matchedEvent?.description || s.description || "";
        const resolvedLocation =
          matchedEvent?.city?.name || matchedEvent?.location || s.location || meta.location;
        const resolvedCategory =
          matchedEvent?.category?.name || s.category || meta.category;
        const resolvedPrice = s.price
          ? `${s.price} ₾`
          : matchedEvent?.base_price
          ? `${matchedEvent.base_price} ${isGeo ? "₾-დან" : "₾"}`
          : meta.price;
        const resolvedRating = matchedEvent?.average_rating
          ? Number(matchedEvent.average_rating).toFixed(1)
          : s.rating || meta.rating;

        return {
          id: s.id || index,
          title: resolvedTitle,
          description: resolvedDesc,
          image: getImageUrl(s.image),
          link: s.link || null,
          location: resolvedLocation,
          category: resolvedCategory,
          price: resolvedPrice,
          rating: resolvedRating,
        };
      });
    }

    if (popularEvents && popularEvents.length > 0) {
      return popularEvents.slice(0, 4).map((e, index) => ({
        id: e.id || index,
        title: e.name || e.title || (isGeo ? "პოპულარული აქტივობა" : "Popular Activity"),
        description: e.description || "",
        image: getImageUrl(e.primary_image?.image || e.images?.[0]?.image || e.image),
        link: `/activity/${e.id}`,
        location: e.city?.name || e.location || (isGeo ? "საქართველო" : "Georgia"),
        category: e.category?.name || (isGeo ? "აქტივობა" : "Activity"),
        price: e.base_price
          ? `${e.base_price} ${isGeo ? "₾-დან" : "₾"}`
          : isGeo
          ? "საუკეთესო ფასი"
          : "Best Price",
        rating: e.average_rating ? Number(e.average_rating).toFixed(1) : "4.9",
      }));
    }

    return [];
  }, [slides, popularEvents, popularById, language, isGeo]);

  // Keep activeIndex in bounds when items change
  useEffect(() => {
    if (items.length > 0 && activeIndex >= items.length) {
      setActiveIndex(0);
    }
  }, [items.length, activeIndex]);

  // Auto-sync horizontal slider scroll on mobile/tablet when activeIndex changes
  useEffect(() => {
    const listEl = listRef.current;
    const cardEl = cardRefs.current[activeIndex];
    if (!listEl || !cardEl) return;

    if (listEl.scrollWidth > listEl.clientWidth + 4) {
      const targetLeft =
        cardEl.offsetLeft - (listEl.clientWidth - cardEl.clientWidth) / 2;
      listEl.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: "smooth",
      });
    }
  }, [activeIndex, items.length]);

  const activeSlide = items[activeIndex] || items[0] || null;

  const nextSlide = useCallback(() => {
    if (items.length > 1) {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }
  }, [items.length]);

  const prevSlide = useCallback(() => {
    if (items.length > 1) {
      setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
    }
  }, [items.length]);

  useEffect(() => {
    if (isPaused || items.length <= 1) return;
    timerRef.current = setInterval(() => {
      nextSlide();
    }, 5500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, nextSlide, items.length]);

  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      setIsPaused(true);
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null) return;
    const endX = e.changedTouches && e.changedTouches[0]?.clientX;
    if (typeof endX === "number") {
      const diff = touchStartXRef.current - endX;
      if (diff > 40) {
        nextSlide();
      } else if (diff < -40) {
        prevSlide();
      }
    }
    touchStartXRef.current = null;
    setIsPaused(false);
  };

  const handleNavigate = (link) => {
    if (!link) return;

    if (link.includes("/activity/")) {
      const activityPath = link.substring(link.indexOf("/activity/"));
      navigate(activityPath);
      return;
    }

    if (link.startsWith("http://") || link.startsWith("https://")) {
      if (link.includes("funfinder.ge/activity/")) {
        const activityPath = link.substring(link.indexOf("/activity/"));
        navigate(activityPath);
      } else {
        window.open(link, "_blank", "noopener,noreferrer");
      }
    } else {
      navigate(link);
    }
  };

  if (!activeSlide) return null;

  const sidebarTitleText =
    (t && t("home.popular.title") !== "home.popular.title" ? t("home.popular.title") : null) ||
    ui.popularTitle;

  return (
    <div
      className="hero-showcase-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ===== HERO SHOWCASE GRID ===== */}
      <div className="hero-showcase-grid">
        {/* 1. CLEAN BRIGHT SPOTLIGHT CARD (LEFT / MAIN - Zero overlays on image!) */}
        <div
          className="hero-spotlight-card"
          onClick={() => handleNavigate(activeSlide.link)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Bright, natural image with NO dark overlays or text clutter */}
          <div className="hero-spotlight-media">
            <img
              key={activeSlide.image}
              src={activeSlide.image}
              alt={activeSlide.title}
              className="hero-spotlight-img"
              loading="eager"
              fetchPriority="high"
            />
          </div>

          {/* Clean white info footer cleanly BELOW the photo */}
          <div className="hero-spotlight-info-bar">
            <div className="hero-info-main">
              <div className="hero-info-meta-row">
                <span className="hero-inline-popular">
                  <LocalFireDepartmentIcon sx={{ fontSize: 13 }} />
                  <span>{ui.popularBadge}</span>
                </span>

                {activeSlide.location && (
                  <span className="hero-inline-loc">
                    <LocationOnIcon sx={{ fontSize: 13 }} />
                    <span>{activeSlide.location}</span>
                  </span>
                )}

                {activeSlide.rating && (
                  <span className="hero-inline-rating">★ {activeSlide.rating}</span>
                )}
              </div>

              <h1 className="hero-spotlight-title-clean">{activeSlide.title}</h1>
            </div>

            <div className="hero-info-actions">
              {activeSlide.price && (
                <div className="hero-clean-price">
                  <span className="hero-clean-price-label">{ui.priceLabel}</span>
                  <span className="hero-clean-price-val">{activeSlide.price}</span>
                </div>
              )}

              <button
                type="button"
                className="hero-spotlight-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigate(activeSlide.link);
                }}
              >
                <span>{ui.exploreBtn}</span>
                <ArrowForwardIcon sx={{ fontSize: 17 }} />
              </button>
            </div>
          </div>
        </div>

        {/* 2. POPULAR ACTIVITIES SHOWCASE NAVIGATOR (RIGHT SIDEBAR / MOBILE SLIDER) */}
        {items.length > 1 && (
          <div className="hero-showcase-sidebar">
            <div className="hero-sidebar-header">
              <div className="hero-sidebar-title-wrap">
                <div className="hero-sidebar-fire-badge">
                  <LocalFireDepartmentIcon sx={{ fontSize: 16, color: "#87003A" }} />
                </div>
                <div className="hero-sidebar-title-texts">
                  <span className="hero-sidebar-title">{sidebarTitleText}</span>
                </div>
              </div>

              <div className="hero-sidebar-controls">
                <button
                  type="button"
                  className="hero-ctrl-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevSlide();
                  }}
                  aria-label={ui.prevLabel}
                  title={ui.prevLabel}
                >
                  <ChevronLeftIcon sx={{ fontSize: 17 }} />
                </button>
                <span className="hero-sidebar-counter">
                  {activeIndex + 1} / {items.length}
                </span>
                <button
                  type="button"
                  className="hero-ctrl-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextSlide();
                  }}
                  aria-label={ui.nextLabel}
                  title={ui.nextLabel}
                >
                  <ChevronRightIcon sx={{ fontSize: 17 }} />
                </button>
              </div>
            </div>

            <div className="hero-sidebar-list" ref={listRef}>
              {items.map((item, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <div
                    key={item.id || idx}
                    ref={(el) => {
                      cardRefs.current[idx] = el;
                    }}
                    className={`hero-nav-card ${isActive ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isActive) {
                        handleNavigate(item.link);
                      } else {
                        setActiveIndex(idx);
                      }
                    }}
                  >
                    {isActive && !isPaused && (
                      <div className="hero-nav-progress-bar" />
                    )}

                    <div className="hero-nav-thumb-wrap">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="hero-nav-thumb"
                        loading="lazy"
                      />
                    </div>

                    <div className="hero-nav-info">
                      <div className="hero-nav-category">
                        #{idx + 1} • {item.category}
                      </div>
                      <div className="hero-nav-title">{item.title}</div>
                      <div className="hero-nav-bottom">
                        <span className="hero-nav-price">{item.price}</span>
                        <span className="hero-nav-rating">★ {item.rating}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="hero-nav-arrow-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigate(item.link);
                      }}
                      title={ui.exploreBtn}
                      aria-label={ui.exploreBtn}
                    >
                      <ArrowForwardIcon sx={{ fontSize: 15 }} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ===== 3. TRUST & DISCOVERY VALUE STRIP ===== */}
      <div className="hero-trust-strip">
        <div className="hero-trust-item">
          <div className="hero-trust-icon-box">
            <BoltIcon sx={{ fontSize: 18, color: "#87003A" }} />
          </div>
          <div className="hero-trust-texts">
            <span className="hero-trust-title">{ui.trust1Title}</span>
            <span className="hero-trust-sub">{ui.trust1Sub}</span>
          </div>
        </div>

        <div className="hero-trust-item">
          <div className="hero-trust-icon-box">
            <ShieldIcon sx={{ fontSize: 18, color: "#87003A" }} />
          </div>
          <div className="hero-trust-texts">
            <span className="hero-trust-title">{ui.trust2Title}</span>
            <span className="hero-trust-sub">{ui.trust2Sub}</span>
          </div>
        </div>

        <div className="hero-trust-item">
          <div className="hero-trust-icon-box">
            <StarIcon sx={{ fontSize: 18, color: "#87003A" }} />
          </div>
          <div className="hero-trust-texts">
            <span className="hero-trust-title">{ui.trust3Title}</span>
            <span className="hero-trust-sub">{ui.trust3Sub}</span>
          </div>
        </div>

        <div className="hero-trust-item">
          <div className="hero-trust-icon-box">
            <CreditCardIcon sx={{ fontSize: 18, color: "#87003A" }} />
          </div>
          <div className="hero-trust-texts">
            <span className="hero-trust-title">{ui.trust4Title}</span>
            <span className="hero-trust-sub">{ui.trust4Sub}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainSlider;
