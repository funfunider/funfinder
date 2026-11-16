import React, { useRef, useState, useMemo, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Popover from "@mui/material/Popover";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import CloseIcon from "@mui/icons-material/Close";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { useLanguage } from "../contexts/LanguageContext";

const KA_MONTHS_FULL = [
  "იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი",
  "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"
];
const EN_MONTHS_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const RU_MONTHS_FULL = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

const KA_DAYS_SHORT = ["ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ", "კვი"];
const EN_DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const RU_DAYS_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export default function DateFilterStrip({ selectedDate, onSelectDate }) {
  const { language } = useLanguage();
  const scrollContainerRef = useRef(null);

  // Full Calendar Popover Anchor
  const [calendarAnchor, setCalendarAnchor] = useState(null);
  const isCalendarOpen = Boolean(calendarAnchor);

  // Current year & month being viewed in full calendar
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(() => today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => today.getMonth());

  // Synchronize viewYear & viewMonth when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      const parts = selectedDate.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (!isNaN(y) && !isNaN(m)) {
          setViewYear(y);
          setViewMonth(m);
        }
      }
    }
  }, [selectedDate]);

  // Localized months and days
  const monthNames = language === "ka" ? KA_MONTHS_FULL : language === "ru" ? RU_MONTHS_FULL : EN_MONTHS_FULL;
  const weekdayNames = language === "ka" ? KA_DAYS_SHORT : language === "ru" ? RU_DAYS_SHORT : EN_DAYS_SHORT;

  // Generate 60 days for continuous horizontal scrolling
  const daysList = useMemo(() => {
    const list = [];
    const kaDays = ["კვი", "ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ"];
    const enDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const ruDays = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

    const kaMonthsShort = ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"];
    const enMonthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const ruMonthsShort = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

    let lastMonthIdx = -1;

    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const dayOfWeek = d.getDay();
      const dayNum = d.getDate();
      const monthIdx = d.getMonth();
      const year = d.getFullYear();

      const dateString = `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;

      let dayLabel = "";
      if (i === 0) {
        dayLabel = language === "ka" ? "დღეს" : language === "ru" ? "Сегодня" : "Today";
      } else if (i === 1) {
        dayLabel = language === "ka" ? "ხვალ" : language === "ru" ? "Заვტრა" : "Tmrw";
      } else {
        dayLabel = language === "ka" ? kaDays[dayOfWeek] : language === "ru" ? ruDays[dayOfWeek] : enDays[dayOfWeek];
      }

      const monthLabel = language === "ka" ? kaMonthsShort[monthIdx] : language === "ru" ? ruMonthsShort[monthIdx] : enMonthsShort[monthIdx];
      const isNewMonth = monthIdx !== lastMonthIdx && i > 0;
      lastMonthIdx = monthIdx;

      list.push({
        dateString,
        dayNum,
        dayLabel,
        monthLabel,
        monthIdx,
        year,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        isNewMonth,
      });
    }

    return list;
  }, [language, today]);

  const handleScroll = (direction) => {
    if (scrollContainerRef.current) {
      const offset = direction === "left" ? -320 : 320;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  // Check if selectedDate is outside the 60 days
  const isSelectedOutsideStrip = useMemo(() => {
    if (!selectedDate) return false;
    return !daysList.some((item) => item.dateString === selectedDate);
  }, [selectedDate, daysList]);

  // Calendar navigation
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    onSelectDate(dateStr);
    setCalendarAnchor(null);
  };

  // Full Month Grid Generator
  const calendarGrid = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    // Monday as first day of week: (dayOfWeek + 6) % 7
    const firstDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells = [];

    // Leading days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      cells.push({
        dayNum: daysInPrevMonth - i,
        isCurrentMonth: false,
        isPast: true,
      });
    }

    // Days in current month
    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    for (let day = 1; day <= daysInMonth; day++) {
      const currentCellDate = new Date(viewYear, viewMonth, day);
      const isPast = currentCellDate.getTime() < todayZero;
      const isToday =
        viewYear === today.getFullYear() &&
        viewMonth === today.getMonth() &&
        day === today.getDate();
      const dateString = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayOfWeek = (currentCellDate.getDay() + 6) % 7; // 0=Mon, 5=Sat, 6=Sun
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

      cells.push({
        dayNum: day,
        dateString,
        isCurrentMonth: true,
        isPast,
        isToday,
        isWeekend,
        isSelected: selectedDate === dateString,
      });
    }

    // Trailing days from next month to make complete 7-day rows
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      cells.push({
        dayNum: i,
        isCurrentMonth: false,
        isPast: false,
      });
    }

    return cells;
  }, [viewYear, viewMonth, today, selectedDate]);

  // Formatted selected date text for display
  const selectedDateFormatted = useMemo(() => {
    if (!selectedDate) return null;
    const [y, m, d] = selectedDate.split("-");
    const mIdx = parseInt(m, 10) - 1;
    const monthName = monthNames[mIdx] || m;
    return `${parseInt(d, 10)} ${monthName}, ${y}`;
  }, [selectedDate, monthNames]);

  return (
    <Box sx={{ width: { xs: "calc(100% + 32px)", sm: "100%" }, mx: { xs: -2, sm: 0 }, mb: 3 }}>
      {/* ===== DATE FILTER STRIP BAR ===== */}
      <Box
        sx={{
          width: "100%",
          boxSizing: "border-box",
          bgcolor: "#f0f2f5",
          borderRadius: { xs: 0, sm: "16px" },
          p: { xs: "8px 12px", sm: 1.25 },
          display: "flex",
          alignItems: "center",
          gap: { xs: 0.75, sm: 1 },
          userSelect: "none",
          borderTop: "1px solid #e2e4e8",
          borderBottom: "1px solid #e2e4e8",
          borderLeft: { xs: "none", sm: "1px solid #e2e4e8" },
          borderRight: { xs: "none", sm: "1px solid #e2e4e8" },
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
        }}
      >
        {/* Full Calendar Trigger Button (Left) */}
        <Tooltip title={language === "ka" ? "სრული კალენდარი" : "Full Calendar"}>
          <Button
            onClick={(e) => setCalendarAnchor(e.currentTarget)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 0.35, sm: 0.75 },
              bgcolor: isCalendarOpen ? "#87003A" : "#ffffff",
              color: isCalendarOpen ? "#ffffff" : "#1e293b",
              minWidth: { xs: 44, sm: "auto" },
              px: { xs: 1, sm: 1.5 },
              py: 0.8,
              height: 56,
              borderRadius: "12px",
              border: isCalendarOpen ? "1px solid #87003A" : "1px solid #e2e8f0",
              boxShadow: isCalendarOpen ? "0 4px 14px rgba(135,0,58,0.25)" : "0 1px 4px rgba(0,0,0,0.05)",
              flexShrink: 0,
              textTransform: "none",
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: isCalendarOpen ? "#87003A" : "#ffffff",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                borderColor: "#87003A",
              },
            }}
          >
            <CalendarMonthIcon sx={{ fontSize: 20, color: isCalendarOpen ? "#ffffff" : "#87003A" }} />
            <Box sx={{ display: { xs: "none", sm: "flex" }, flexDirection: "column", alignItems: "flex-start", lineHeight: 1.1 }}>
              <Typography sx={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: isCalendarOpen ? "#ffffff" : "#64748b" }}>
                {monthNames[viewMonth]}
              </Typography>
              <Typography sx={{ fontSize: "13px", fontWeight: 800, color: isCalendarOpen ? "#ffffff" : "#0f172a" }}>
                {viewYear}
              </Typography>
            </Box>
            <KeyboardArrowDownIcon sx={{ fontSize: 18, color: isCalendarOpen ? "#ffffff" : "#64748b" }} />
          </Button>
        </Tooltip>

        {/* Scroll Left Button */}
        <IconButton
          size="small"
          onClick={() => handleScroll("left")}
          sx={{
            display: { xs: "none", sm: "inline-flex" },
            bgcolor: "#ffffff",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            width: 32,
            height: 32,
            flexShrink: 0,
            "&:hover": { bgcolor: "#f8f9fa", borderColor: "#cbd5e1" },
            border: "1px solid #e2e8f0",
          }}
          aria-label="Previous days"
        >
          <ChevronLeftIcon fontSize="small" />
        </IconButton>

        {/* Scrollable Days Container */}
        <Box
          ref={scrollContainerRef}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 0.75, sm: 1 },
            overflowX: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            "&::-webkit-scrollbar": { display: "none" },
            py: 0.5,
            px: { xs: 0.25, sm: 0.5 },
            flex: 1,
            minWidth: 0,
          }}
        >
          {/* "All" Dates Pill */}
          <Box
            onClick={() => onSelectDate(null)}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minWidth: { xs: 52, sm: 60 },
              height: 56,
              borderRadius: "12px",
              cursor: "pointer",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              bgcolor: selectedDate === null ? "#87003A" : "#ffffff",
              color: selectedDate === null ? "#ffffff" : "#374151",
              boxShadow: selectedDate === null ? "0 4px 14px rgba(135,0,58,0.28)" : "0 1px 3px rgba(0,0,0,0.05)",
              border: selectedDate === null ? "1px solid #87003A" : "1px solid #e2e8f0",
              flexShrink: 0,
              "&:hover": {
                transform: "translateY(-2px)",
                bgcolor: selectedDate === null ? "#87003A" : "#f9fafb",
                boxShadow: "0 6px 14px rgba(0,0,0,0.08)",
              },
            }}
          >
            <Typography sx={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
              {language === "ka" ? "ყველა" : "All"}
            </Typography>
            <Typography sx={{ fontSize: "16px", fontWeight: 800 }}>∞</Typography>
          </Box>

          {/* If a custom selected date is outside the 60-day range, display it as a special active pill */}
          {isSelectedOutsideStrip && selectedDate && (
            <Box
              onClick={() => onSelectDate(null)}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minWidth: { xs: 68, sm: 76 },
                height: 56,
                borderRadius: "12px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                bgcolor: "#87003A",
                color: "#ffffff",
                boxShadow: "0 4px 14px rgba(135,0,58,0.35)",
                border: "1px solid #87003A",
                flexShrink: 0,
                px: 1,
                position: "relative",
              }}
            >
              <Typography sx={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", opacity: 0.9 }}>
                {language === "ka" ? "არჩეული" : "Selected"}
              </Typography>
              <Typography sx={{ fontSize: "14px", fontWeight: 800 }}>
                {selectedDate.slice(5)}
              </Typography>
              <CloseIcon sx={{ fontSize: 13, position: "absolute", top: 3, right: 3, opacity: 0.8 }} />
            </Box>
          )}

          {/* 60 Scrollable Days */}
          {daysList.map((item) => {
            const isSelected = selectedDate === item.dateString;

            return (
              <React.Fragment key={item.dateString}>
                {/* Month Separator Badge when scrolling into new month */}
                {item.isNewMonth && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      px: 1,
                      py: 0.5,
                      borderRadius: "8px",
                      bgcolor: "rgba(135, 0, 58, 0.08)",
                      border: "1px dashed rgba(135, 0, 58, 0.3)",
                      flexShrink: 0,
                      height: 54,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "11px",
                        fontWeight: 800,
                        color: "#87003A",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        writingMode: "vertical-rl",
                        transform: "rotate(180deg)",
                      }}
                    >
                      {item.monthLabel}
                    </Typography>
                  </Box>
                )}

                <Box
                  onClick={() => onSelectDate(isSelected ? null : item.dateString)}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: { xs: 46, sm: 54 },
                    height: 56,
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    bgcolor: isSelected ? "#87003A" : "#ffffff",
                    color: isSelected ? "#ffffff" : item.isWeekend ? "#87003A" : "#2d3139",
                    boxShadow: isSelected ? "0 4px 14px rgba(135,0,58,0.3)" : "0 1px 3px rgba(0,0,0,0.05)",
                    border: isSelected ? "1px solid #87003A" : "1px solid #e2e8f0",
                    flexShrink: 0,
                    "&:hover": {
                      transform: "translateY(-2px)",
                      bgcolor: isSelected ? "#87003A" : "#fafafa",
                      borderColor: isSelected ? "#87003A" : "#cbd5e1",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "11px",
                      fontWeight: 600,
                      opacity: isSelected ? 0.95 : 0.75,
                      lineHeight: 1.1,
                      mb: 0.2,
                    }}
                  >
                    {item.dayLabel}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "17px",
                      fontWeight: 800,
                      lineHeight: 1.1,
                    }}
                  >
                    {item.dayNum}
                  </Typography>
                </Box>
              </React.Fragment>
            );
          })}
        </Box>

        {/* Scroll Right Button */}
        <IconButton
          size="small"
          onClick={() => handleScroll("right")}
          sx={{
            display: { xs: "none", sm: "inline-flex" },
            bgcolor: "#ffffff",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            width: 32,
            height: 32,
            flexShrink: 0,
            "&:hover": { bgcolor: "#f8f9fa", borderColor: "#cbd5e1" },
            border: "1px solid #e2e8f0",
          }}
          aria-label="Next days"
        >
          <ChevronRightIcon fontSize="small" />
        </IconButton>

        {/* "Full Calendar" button on right */}
        <Button
          onClick={(e) => setCalendarAnchor(e.currentTarget)}
          variant="contained"
          size="small"
          startIcon={<EventAvailableIcon sx={{ fontSize: 17 }} />}
          sx={{
            display: { xs: "none", md: "inline-flex" },
            bgcolor: "#87003A",
            color: "#ffffff",
            fontWeight: 700,
            fontSize: "12px",
            px: 2,
            height: 40,
            borderRadius: "10px",
            textTransform: "none",
            whiteSpace: "nowrap",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(135,0,58,0.25)",
            "&:hover": {
              bgcolor: "#6b002e",
              boxShadow: "0 4px 12px rgba(135,0,58,0.35)",
            },
          }}
        >
          {language === "ka" ? "სრული კალენდარი" : "Full Calendar"}
        </Button>
      </Box>

      {/* ===== FULL CALENDAR POPOVER ===== */}
      <Popover
        open={isCalendarOpen}
        anchorEl={calendarAnchor}
        onClose={() => setCalendarAnchor(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        PaperProps={{
          sx: {
            mt: 1.5,
            p: 2.5,
            width: { xs: 320, sm: 380 },
            borderRadius: "20px",
            boxShadow: "0 20px 48px -10px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(226, 232, 240, 0.9)",
            bgcolor: "#ffffff",
          },
        }}
      >
        {/* Calendar Header with Month/Year Switcher */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CalendarMonthIcon sx={{ color: "#87003A", fontSize: 22 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a", fontSize: "1.05rem" }}>
              {monthNames[viewMonth]} {viewYear}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={handlePrevMonth}
              sx={{
                bgcolor: "#f8fafc",
                border: "1px solid #e2e8f0",
                "&:hover": { bgcolor: "#f1f5f9" },
              }}
              aria-label="Previous month"
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>

            <IconButton
              size="small"
              onClick={handleNextMonth}
              sx={{
                bgcolor: "#f8fafc",
                border: "1px solid #e2e8f0",
                "&:hover": { bgcolor: "#f1f5f9" },
              }}
              aria-label="Next month"
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Quick Presets Row */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 2, flexWrap: "wrap" }}>
          <Chip
            label={language === "ka" ? "ყველა" : "All"}
            size="small"
            onClick={() => {
              onSelectDate(null);
              setCalendarAnchor(null);
            }}
            variant={selectedDate === null ? "filled" : "outlined"}
            sx={{
              fontWeight: 700,
              fontSize: "11px",
              cursor: "pointer",
              bgcolor: selectedDate === null ? "#87003A" : "transparent",
              color: selectedDate === null ? "#ffffff" : "#475569",
              borderColor: "#cbd5e1",
            }}
          />
          <Chip
            label={language === "ka" ? "დღეს" : "Today"}
            size="small"
            onClick={handleJumpToToday}
            variant="outlined"
            sx={{
              fontWeight: 600,
              fontSize: "11px",
              cursor: "pointer",
              borderColor: "#cbd5e1",
              "&:hover": { bgcolor: "#f8fafc" },
            }}
          />
          <Chip
            label={language === "ka" ? "ხვალ" : "Tomorrow"}
            size="small"
            onClick={() => {
              const tmrw = new Date();
              tmrw.setDate(tmrw.getDate() + 1);
              const dStr = `${tmrw.getFullYear()}-${String(tmrw.getMonth() + 1).padStart(2, "0")}-${String(tmrw.getDate()).padStart(2, "0")}`;
              onSelectDate(dStr);
              setCalendarAnchor(null);
            }}
            variant="outlined"
            sx={{
              fontWeight: 600,
              fontSize: "11px",
              cursor: "pointer",
              borderColor: "#cbd5e1",
              "&:hover": { bgcolor: "#f8fafc" },
            }}
          />
          <Chip
            label={language === "ka" ? "ამ უქმეებზე" : "This Weekend"}
            size="small"
            onClick={() => {
              const d = new Date();
              const day = d.getDay(); // 0 is Sunday, 6 is Saturday
              const diff = (6 - day + 7) % 7;
              d.setDate(d.getDate() + (diff === 0 ? 0 : diff));
              const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              onSelectDate(dStr);
              setCalendarAnchor(null);
            }}
            variant="outlined"
            sx={{
              fontWeight: 600,
              fontSize: "11px",
              cursor: "pointer",
              borderColor: "#cbd5e1",
              "&:hover": { bgcolor: "#f8f9fa" },
            }}
          />
        </Box>

        {/* Weekday Names Header (Mon - Sun) */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 0.5,
            textAlign: "center",
            mb: 1,
            borderBottom: "1px solid #f1f5f9",
            pb: 0.75,
          }}
        >
          {weekdayNames.map((name, idx) => {
            const isWeekend = idx === 5 || idx === 6;
            return (
              <Typography
                key={name}
                variant="caption"
                sx={{
                  fontWeight: 700,
                  fontSize: "11px",
                  color: isWeekend ? "#87003A" : "#64748b",
                  textTransform: "uppercase",
                }}
              >
                {name}
              </Typography>
            );
          })}
        </Box>

        {/* Days Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 0.75,
            mb: 2,
          }}
        >
          {calendarGrid.map((cell, idx) => {
            if (!cell.isCurrentMonth) {
              return (
                <Box
                  key={`empty-${idx}`}
                  sx={{
                    height: 38,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#cbd5e1",
                    fontSize: "12px",
                    fontWeight: 500,
                  }}
                >
                  {cell.dayNum}
                </Box>
              );
            }

            const { dateString, dayNum, isPast, isToday, isWeekend, isSelected } = cell;

            return (
              <Box
                key={dateString}
                onClick={() => {
                  if (isPast) return;
                  onSelectDate(isSelected ? null : dateString);
                  setCalendarAnchor(null);
                }}
                sx={{
                  height: 38,
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: isPast ? "default" : "pointer",
                  fontSize: "13px",
                  fontWeight: isSelected || isToday ? 800 : 600,
                  transition: "all 0.15s ease",
                  bgcolor: isSelected ? "#87003A" : isToday ? "rgba(135,0,58,0.08)" : "transparent",
                  color: isSelected
                    ? "#ffffff"
                    : isPast
                    ? "#cbd5e1"
                    : isWeekend
                    ? "#87003A"
                    : "#1e293b",
                  border: isSelected
                    ? "1px solid #87003A"
                    : isToday
                    ? "1.5px solid #87003A"
                    : "1px solid transparent",
                  boxShadow: isSelected ? "0 4px 10px rgba(135,0,58,0.3)" : "none",
                  "&:hover": {
                    bgcolor: isPast ? "transparent" : isSelected ? "#87003A" : "#f1f5f9",
                    transform: isPast ? "none" : "scale(1.05)",
                  },
                }}
              >
                {dayNum}
              </Box>
            );
          })}
        </Box>

        {/* Footer with Selected Date & Clear */}
        <Box
          sx={{
            pt: 1.5,
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: "#64748b", fontSize: "11px", fontWeight: 600 }}>
              {selectedDate
                ? (language === "ka" ? `არჩეულია: ${selectedDateFormatted}` : `Selected: ${selectedDateFormatted}`)
                : (language === "ka" ? "თარიღი არ არის არჩეული" : "No date selected")}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {selectedDate && (
              <Button
                size="small"
                startIcon={<RestartAltIcon sx={{ fontSize: 15 }} />}
                onClick={() => {
                  onSelectDate(null);
                  setCalendarAnchor(null);
                }}
                sx={{
                  color: "#ef4444",
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "none",
                  p: 0.5,
                }}
              >
                {language === "ka" ? "გასუფთავება" : "Clear"}
              </Button>
            )}

            <Button
              size="small"
              onClick={() => setCalendarAnchor(null)}
              variant="outlined"
              sx={{
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: "8px",
                borderColor: "#e2e8f0",
                color: "#1e293b",
                py: 0.4,
                px: 1.5,
              }}
            >
              {language === "ka" ? "დახურვა" : "Close"}
            </Button>
          </Box>
        </Box>
      </Popover>
    </Box>
  );
}
