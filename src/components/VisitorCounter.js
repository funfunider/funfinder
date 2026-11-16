import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { FaEye } from "react-icons/fa6";
import { useLanguage } from "../contexts/LanguageContext";

const WORKSPACE = "funfinder";
const COUNTER = "visitors";
const SESSION_KEY = "ff_visitor_counted";
const CACHE_KEY = "ff_visitor_count";
const BASE_COUNT = 500;

export default function VisitorCounter() {
  const { t } = useLanguage();
  const [count, setCount] = useState(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? Number(cached) : BASE_COUNT;
  });

  useEffect(() => {
    const alreadyCounted = sessionStorage.getItem(SESSION_KEY) === "1";
    if (!alreadyCounted) {
      const nextCount = count + 1;
      setCount(nextCount);
      localStorage.setItem(CACHE_KEY, String(nextCount));
      sessionStorage.setItem(SESSION_KEY, "1");
    }
  }, [count]);

  const formatted = count.toLocaleString();

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        mt: 2,
        px: 2,
        py: 0.75,
        borderRadius: 999,
        bgcolor: "rgba(255,255,255,0.12)",
        color: "white",
      }}
      aria-label={t("footer.visitors", { count: formatted })}
    >
      <FaEye />
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {t("footer.visitors", { count: formatted })}
      </Typography>
    </Box>
  );
}
