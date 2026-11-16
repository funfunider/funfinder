import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Drawer from "@mui/material/Drawer";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

import SearchIcon from "@mui/icons-material/Search";
import LanguageIcon from "@mui/icons-material/Language";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MapIcon from "@mui/icons-material/Map";
import ContactMailIcon from "@mui/icons-material/ContactMail";
import GavelIcon from "@mui/icons-material/Gavel";
import SecurityIcon from "@mui/icons-material/Security";
import InfoIcon from "@mui/icons-material/Info";
import LogoutIcon from "@mui/icons-material/Logout";
import HistoryIcon from "@mui/icons-material/History";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import Park from "@mui/icons-material/Park";
import SailingIcon from "@mui/icons-material/Sailing";
import DirectionsBoat from "@mui/icons-material/DirectionsBoat";
import DirectionsBoatFilledIcon from "@mui/icons-material/DirectionsBoatFilled";
import RowingIcon from "@mui/icons-material/Rowing";
import BeachAccess from "@mui/icons-material/BeachAccess";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import ElectricBikeIcon from "@mui/icons-material/ElectricBike";
import TwoWheeler from "@mui/icons-material/TwoWheeler";
import DirectionsCar from "@mui/icons-material/DirectionsCar";
import DirectionsRun from "@mui/icons-material/DirectionsRun";
import Speed from "@mui/icons-material/Speed";
import SnowmobileIcon from "@mui/icons-material/Snowmobile";
import VideogameAssetIcon from "@mui/icons-material/VideogameAsset";
import LocalBarIcon from "@mui/icons-material/LocalBar";
import { GiHorseHead } from "react-icons/gi";
import { MdParagliding } from "react-icons/md";

import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { useCategoryList } from "../hooks/useApi";
import logo from "../assets/logo.jpg";
import zip from "./zip.png";
import "./Nav.css";

// Helper function to get icon for category
export const getCategoryIcon = (categoryName) => {
  if (!categoryName) return <Park sx={{ fontSize: 18 }} />;
  const cat = categoryName.toLowerCase();
  switch (cat) {
    case "yacht":
      return <SailingIcon sx={{ fontSize: 18 }} />;
    case "speed boat":
      return <DirectionsBoat sx={{ fontSize: 18 }} />;
    case "rafting":
      return <RowingIcon sx={{ fontSize: 18 }} />;
    case "parachute":
    case "paragliding":
    case "skydiving":
      return <MdParagliding size={18} />;
    case "jetcar":
    case "sea moto":
      return <Speed sx={{ fontSize: 18 }} />;
    case "hydrocycle":
    case "cutter":
      return <BeachAccess sx={{ fontSize: 18 }} />;
    case "quadro tours":
    case "quad tours":
    case "quad":
      return <ElectricBikeIcon sx={{ fontSize: 18 }} />;
    case "moto tour":
    case "moto tours":
      return <TwoWheeler sx={{ fontSize: 18 }} />;
    case "jeep tours":
    case "jeep":
      return <DirectionsCar sx={{ fontSize: 18 }} />;
    case "hiking":
      return <DirectionsRun sx={{ fontSize: 18 }} />;
    case "karting":
      return <Speed sx={{ fontSize: 18 }} />;
    case "zipline":
      return <img src={zip} width={20} height={18} alt="Zipline" />;
    case "horse":
      return <GiHorseHead size={18} />;
    case "airsoft":
      return <VideogameAssetIcon sx={{ fontSize: 18 }} />;
    case "snowmobile":
      return <SnowmobileIcon sx={{ fontSize: 18 }} />;
    case "ship":
      return <DirectionsBoatFilledIcon sx={{ fontSize: 18 }} />;
    case "beach":
      return <BeachAccessIcon sx={{ fontSize: 18 }} />;
    case "night club":
      return <LocalBarIcon sx={{ fontSize: 18 }} />;
    default:
      return <Park sx={{ fontSize: 18 }} />;
  }
};

const LANGUAGES = [
  { code: "ka", label: "ქართული", flag: "🇬🇪" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "hy", label: "Հայերեն", flag: "🇦🇲" },
  { code: "kk", label: "Қазақша", flag: "🇰🇿" },
  { code: "uk", label: "Українська", flag: "🇺🇦" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ar", label: "العربية", flag: "🇦🇪" },
  { code: "he", label: "עברית", flag: "🇮🇱" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { language, setLanguage, t, getLocalizedPath } = useLanguage();
  const { currency, toggleCurrency, getCurrencySymbol } = useCurrency();
  const { data: categories } = useCategoryList();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [langAnchor, setLangAnchor] = useState(null);
  const [userAnchor, setUserAnchor] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  // Detect scroll to add slight shadow like TKT.GE
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(getLocalizedPath(`/?q=${encodeURIComponent(searchQuery.trim())}`));
    setMobileSearchOpen(false);
  };

  const handleLanguageChange = (code) => {
    setLanguage(code);
    setLangAnchor(null);
  };

  const handleLogout = () => {
    logout();
    setUserAnchor(null);
  };

  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const getNavLabel = (key, fallbackEn, fallbackKa) => {
    const val = t(key);
    if (!val || val === key) {
      return language === "ka" ? fallbackKa : fallbackEn;
    }
    return val;
  };

  // Helper function to translate category names
  const translateCategoryName = (categoryName) => {
    if (!categoryName) return "";
    const normalized = categoryName.toLowerCase().trim();
    if (normalized.includes("parachute")) return t("category.parachute") || "პარაშუტი";
    if (normalized.includes("yacht")) return t("category.yacht") || "იახტა";
    if (normalized.includes("rafting")) return t("category.rafting") || "რაფტინგი";
    if (normalized.includes("seamoto") || normalized.includes("sea moto") || normalized.includes("sea-moto")) return t("category.seaMoto") || "ზღვის მოტო";
    if (normalized.includes("quad") || normalized.includes("quadro")) return t("category.quadTours") || "კვადრო ტურები";
    if (normalized.includes("moto tour") || normalized.includes("mototour")) return t("category.motoTours") || "მოტო ტურები";
    if (normalized.includes("jeep")) return t("category.jeepTours") || "ჯიპ ტურები";
    if (normalized.includes("hiking")) return t("category.hiking") || "ლაშქრობა";
    if (normalized.includes("bicycle") || normalized.includes("vip car")) return t("category.bicycles") || "ველოსიპედები";
    if (normalized.includes("zipline")) return t("category.zipline") || "ზიპლაინი";
    if (normalized.includes("paragliding")) return t("category.paragliding") || "პარაგლაიდინგი";
    if (normalized.includes("horse")) return "ცხენოსნობა";
    return categoryName;
  };

  // Predefined primary category quick links matching TKT.GE style
  const primaryCategoryPills = useMemo(() => {
    const isKa = language === "ka";
    const list = [
      { id: "all", name: isKa ? "ყველა" : "All", path: "/" },
      { id: "tickets", name: isKa ? "ბილეთები" : "Tickets", path: "/tickets", icon: <ConfirmationNumberIcon sx={{ fontSize: 16 }} /> },
      { id: "water", name: isKa ? "ზღვის ტურები" : "Sea Tours", path: "/water-activities", icon: <SailingIcon sx={{ fontSize: 16 }} /> },
      { id: "land", name: isKa ? "სამთო ტურები" : "Mountain Tours", path: "/land-activities", icon: <DirectionsCar sx={{ fontSize: 16 }} /> },
      { id: "quad", name: isKa ? "კვადრო" : "Quad Bikes", path: "/quad-tours", icon: <ElectricBikeIcon sx={{ fontSize: 16 }} /> },
      { id: "jeep", name: isKa ? "ჯიპ ტური" : "Jeep Safari", path: "/jeep-tours", icon: <DirectionsCar sx={{ fontSize: 16 }} /> },
      { id: "parachute", name: isKa ? "პარაგლაიდინგი" : "Paragliding", path: "/parachute", icon: <MdParagliding size={16} /> },
      { id: "rafting", name: isKa ? "რაფტინგი" : "Rafting", path: "/rafting", icon: <RowingIcon sx={{ fontSize: 16 }} /> },
      { id: "nearby", name: isKa ? "ახლოს" : "Nearby", path: "/nearby-activities", icon: <LocationOnIcon sx={{ fontSize: 16 }} /> },
    ];

    if (categories && categories.length > 0) {
      categories.slice(0, 6).forEach((cat) => {
        if (!list.some((item) => item.name.toLowerCase() === cat.name.toLowerCase())) {
          list.push({
            id: cat.id,
            name: translateCategoryName(cat.name),
            path: `/category/${cat.id}`,
            icon: getCategoryIcon(cat.name),
          });
        }
      });
    }

    return list;
  }, [categories, t, language]);

  return (
    <header className={`tkt-header ${scrolled ? "scrolled" : ""}`}>
      {/* Main Top Navigation Row */}
      <div className="tkt-navbar-row">
        {/* Left: Brand Logo & Title */}
        <Link to={getLocalizedPath("/")} className="tkt-brand">
          <img src={logo} alt="Funfinder" className="tkt-brand-logo" />
          <h1 className="tkt-brand-title">
            Funfinder
          </h1>
        </Link>

        {/* Center: Search Bar (Desktop) */}
        <form className={`tkt-search-wrapper ${mobileSearchOpen ? "mobile-open" : ""}`} onSubmit={handleSearchSubmit}>
          <input
            type="text"
            className="tkt-search-input"
            placeholder={language === "ka" ? "ძებნა..." : "Search adventures, events, tours..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="tkt-search-icon-btn" aria-label="Search">
            <SearchIcon sx={{ fontSize: 20 }} />
          </button>
        </form>

        {/* Right Actions */}
        <div className="tkt-actions">
          {/* Mobile Search Toggle */}
          <IconButton
            size="small"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            sx={{ display: { xs: "flex", md: "none" }, color: "#333" }}
            aria-label="Search"
          >
            <SearchIcon />
          </IconButton>

          {/* Currency Toggle Pill */}
          <Tooltip title={`Switch Currency (${currency})`}>
            <button
              type="button"
              className="tkt-action-btn"
              onClick={toggleCurrency}
              aria-label="Toggle currency"
            >
              <span className="tkt-currency-badge">{getCurrencySymbol()}</span>
              <span>{currency}</span>
            </button>
          </Tooltip>

          {/* Language Selector Dropdown (TKT.GE style) */}
          <button
            type="button"
            className="tkt-action-btn"
            onClick={(e) => setLangAnchor(e.currentTarget)}
            aria-label="Select language"
          >
            <LanguageIcon sx={{ fontSize: 18, color: "#6e7178" }} />
            <span>{currentLangObj.label}</span>
            <KeyboardArrowDownIcon sx={{ fontSize: 16, color: "#8e9095" }} />
          </button>

          <Menu
            anchorEl={langAnchor}
            open={Boolean(langAnchor)}
            onClose={() => setLangAnchor(null)}
            className="tkt-user-menu"
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            {LANGUAGES.map((item) => (
              <MenuItem
                key={item.code}
                selected={language === item.code}
                onClick={() => handleLanguageChange(item.code)}
                sx={{
                  display: "flex",
                  gap: 1.5,
                  alignItems: "center",
                  fontWeight: language === item.code ? 700 : 500,
                  color: language === item.code ? "#87003A" : "inherit",
                }}
              >
                <span style={{ fontSize: "1.2rem" }}>{item.flag}</span>
                <span>{item.label}</span>
              </MenuItem>
            ))}
          </Menu>

          {/* User Account / Sign In */}
          {user ? (
            <>
              <button
                type="button"
                className="tkt-action-btn tkt-action-btn-primary"
                onClick={(e) => setUserAnchor(e.currentTarget)}
                style={{ padding: "0 10px 0 6px" }}
              >
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    bgcolor: "rgba(255,255,255,0.25)",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                  }}
                >
                  {user.name ? user.name[0].toUpperCase() : "U"}
                </Avatar>
                <span style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.name || t("nav.profile") || "User"}
                </span>
                <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
              </button>

              <Menu
                anchorEl={userAnchor}
                open={Boolean(userAnchor)}
                onClose={() => setUserAnchor(null)}
                className="tkt-user-menu"
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <MenuItem
                  component={Link}
                  to={getLocalizedPath("/profile")}
                  onClick={() => setUserAnchor(null)}
                >
                  <AccountCircleIcon fontSize="small" sx={{ color: "#87003A" }} />
                  {t("nav.profile") || "პროფილი"}
                </MenuItem>
                <MenuItem
                  component={Link}
                  to={getLocalizedPath("/booking-history")}
                  onClick={() => setUserAnchor(null)}
                >
                  <HistoryIcon fontSize="small" sx={{ color: "#87003A" }} />
                  {t("nav.bookingHistory") || "ჯავშნების ისტორია"}
                </MenuItem>
                {(user.isAdmin || user.role === 'admin' || user.roles?.includes('admin')) && (
                  <MenuItem
                    component={Link}
                    to="/admin"
                    onClick={() => setUserAnchor(null)}
                    sx={{ color: '#87003A !important', fontWeight: 700 }}
                  >
                    <AdminPanelSettingsIcon fontSize="small" sx={{ color: "#87003A" }} />
                    {language === 'ka' ? 'ადმინ პანელი' : 'Admin Dashboard'}
                  </MenuItem>
                )}
                {(user.isStaff || user.role === 'staff' || user.roles?.includes('staff')) && (
                  <MenuItem
                    component={Link}
                    to="/staff"
                    onClick={() => setUserAnchor(null)}
                    sx={{ color: '#0284c7 !important', fontWeight: 600 }}
                  >
                    <BadgeOutlinedIcon fontSize="small" sx={{ color: "#0284c7" }} />
                    {language === 'ka' ? 'სტაფის პანელი' : 'Staff Dashboard'}
                  </MenuItem>
                )}
                <Divider sx={{ my: 0.5 }} />
                <MenuItem onClick={handleLogout} sx={{ color: "#ef4444 !important" }}>
                  <LogoutIcon fontSize="small" />
                  {t("nav.logout") || "გამოსვლა"}
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Link
              to={getLocalizedPath("/login")}
              className="tkt-action-btn tkt-action-btn-primary"
              aria-label="Sign in"
            >
              <PersonOutlineIcon sx={{ fontSize: 18 }} />
              <span>{language === "ka" ? "შესვლა" : "Sign In"}</span>
            </Link>
          )}

          {/* Mobile Menu Hamburger */}
          <IconButton
            size="small"
            onClick={() => setMobileDrawerOpen(true)}
            sx={{ display: { xs: "flex", md: "none" }, color: "#333", p: 0.75 }}
            aria-label="Open navigation menu"
          >
            <MenuIcon />
          </IconButton>
        </div>
      </div>

      {/* TKT.GE Secondary Category Sub-Header */}
      <nav className="tkt-category-bar" aria-label="Category navigation">
        <div className="tkt-category-container">
          {primaryCategoryPills.map((pill) => {
            const isHome = pill.path === "/" && (location.pathname === "/" || location.pathname === `/${language}`);
            const isActive = isHome || (pill.path !== "/" && location.pathname.includes(pill.path));

            return (
              <Link
                key={pill.id}
                to={getLocalizedPath(pill.path)}
                className={`tkt-cat-pill ${isActive ? "active" : ""}`}
              >
                {pill.icon && <span className="tkt-cat-icon">{pill.icon}</span>}
                <span>{pill.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Modern Slide-out Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 320,
            maxWidth: "85vw",
            bgcolor: "#ffffff",
            p: 2.5,
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <img src={logo} alt="Funfinder" style={{ width: 34, height: 34, borderRadius: 8 }} />
            <Typography variant="h6" fontWeight={800} color="#87003A">
              Funfinder
            </Typography>
          </Box>
          <IconButton onClick={() => setMobileDrawerOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Currency & Language Row in Mobile Drawer */}
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            onClick={toggleCurrency}
            sx={{
              borderColor: "#e2e4e8",
              color: "#87003A",
              fontWeight: 700,
              borderRadius: 2,
            }}
          >
            {getCurrencySymbol()} {currency}
          </Button>

          <Button
            fullWidth
            variant="outlined"
            size="small"
            onClick={(e) => setLangAnchor(e.currentTarget)}
            startIcon={<LanguageIcon sx={{ fontSize: 16 }} />}
            sx={{
              borderColor: "#e2e4e8",
              color: "#333",
              fontWeight: 600,
              borderRadius: 2,
            }}
          >
            {currentLangObj.label}
          </Button>
        </Box>

        <List sx={{ p: 0, flex: 1, overflowY: "auto" }}>
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              to={getLocalizedPath("/")}
              onClick={() => setMobileDrawerOpen(false)}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: "#87003A" }}>
                <Park fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={getNavLabel("nav.mainHeader", "Home", "მთავარი")} primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }} />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              to={getLocalizedPath("/tickets")}
              onClick={() => setMobileDrawerOpen(false)}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: "#87003A" }}>
                <ConfirmationNumberIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={getNavLabel("nav.tickets", "Tickets", "ბილეთები")} primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }} />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              to={getLocalizedPath("/water-activities")}
              onClick={() => setMobileDrawerOpen(false)}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: "#87003A" }}>
                <SailingIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={getNavLabel("nav.allWaterActivities", "Water Activities", "საზღვაო აქტივობები")} primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }} />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              to={getLocalizedPath("/land-activities")}
              onClick={() => setMobileDrawerOpen(false)}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: "#87003A" }}>
                <DirectionsCar fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={getNavLabel("nav.allLandActivities", "Mountain & Land Tours", "სამთო ტურები")} primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }} />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              to={getLocalizedPath("/nearby-activities")}
              onClick={() => setMobileDrawerOpen(false)}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: "#87003A" }}>
                <LocationOnIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={getNavLabel("nav.nearby", "Nearby Activities", "აქტივობები რუკაზე")} primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }} />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              to={getLocalizedPath("/map-demo")}
              onClick={() => setMobileDrawerOpen(false)}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: "#87003A" }}>
                <MapIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={getNavLabel("nav.map", "Interactive Map", "ინტერაქტიული რუკა")} primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }} />
            </ListItemButton>
          </ListItem>

          <Divider sx={{ my: 1.5 }} />

          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              to={getLocalizedPath("/restrictions")}
              onClick={() => setMobileDrawerOpen(false)}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: "#666" }}>
                <SecurityIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={getNavLabel("restrictions.pageTitle", "Restrictions", "შეზღუდვები")} primaryTypographyProps={{ fontSize: 13.5 }} />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              to={getLocalizedPath("/rules")}
              onClick={() => setMobileDrawerOpen(false)}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: "#666" }}>
                <GavelIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={getNavLabel("nav.rules", "Rules & Terms", "წესები და პირობები")} primaryTypographyProps={{ fontSize: 13.5 }} />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              to={getLocalizedPath("/contact")}
              onClick={() => setMobileDrawerOpen(false)}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: "#666" }}>
                <ContactMailIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={getNavLabel("nav.contact", "Contact", "კონტაქტი")} primaryTypographyProps={{ fontSize: 13.5 }} />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              to={getLocalizedPath("/about")}
              onClick={() => setMobileDrawerOpen(false)}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: "#666" }}>
                <InfoIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={getNavLabel("about.title", "About Us", "ჩვენს შესახებ")} primaryTypographyProps={{ fontSize: 13.5 }} />
            </ListItemButton>
          </ListItem>
        </List>

        <Divider sx={{ my: 2 }} />

        {user ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              component={Link}
              to={getLocalizedPath("/profile")}
              onClick={() => setMobileDrawerOpen(false)}
              sx={{ borderColor: "#87003A", color: "#87003A", fontWeight: 700, borderRadius: 2 }}
            >
              {user.name || t("nav.profile")}
            </Button>
            {(user.isAdmin || user.role === 'admin' || user.roles?.includes('admin')) && (
              <Button
                fullWidth
                variant="contained"
                component={Link}
                to="/admin"
                onClick={() => setMobileDrawerOpen(false)}
                startIcon={<AdminPanelSettingsIcon />}
                sx={{ bgcolor: "#87003A", color: "#fff", fontWeight: 700, borderRadius: 2, '&:hover': { bgcolor: '#6a002c' } }}
              >
                {language === 'ka' ? 'ადმინ პანელი' : 'Admin Dashboard'}
              </Button>
            )}
            {(user.isStaff || user.role === 'staff' || user.roles?.includes('staff')) && (
              <Button
                fullWidth
                variant="outlined"
                component={Link}
                to="/staff"
                onClick={() => setMobileDrawerOpen(false)}
                startIcon={<BadgeOutlinedIcon />}
                sx={{ borderColor: "#0284c7", color: "#0284c7", fontWeight: 700, borderRadius: 2 }}
              >
                {language === 'ka' ? 'სტაფის პანელი' : 'Staff Dashboard'}
              </Button>
            )}
            <Button
              fullWidth
              variant="text"
              color="error"
              onClick={() => {
                handleLogout();
                setMobileDrawerOpen(false);
              }}
              sx={{ fontWeight: 600 }}
            >
              {t("nav.logout") || "გამოსვლა"}
            </Button>
          </Box>
        ) : (
          <Button
            fullWidth
            variant="contained"
            component={Link}
            to={getLocalizedPath("/login")}
            onClick={() => setMobileDrawerOpen(false)}
            sx={{
              bgcolor: "#87003A",
              color: "#fff",
              fontWeight: 700,
              borderRadius: 2,
              py: 1.2,
              "&:hover": { bgcolor: "#6a002c" },
            }}
          >
            {language === "ka" ? "შესვლა / რეგისტრაცია" : "Sign In / Register"}
          </Button>
        )}
      </Drawer>
    </header>
  );
}
