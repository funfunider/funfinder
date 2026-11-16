import React from "react";
import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useLanguage } from "../contexts/LanguageContext";

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  const handleChange = (_, value) => {
    if (!value) return;
    setLanguage(value);
  };

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 20,
        left: 20,
        zIndex: 1100,
        bgcolor: "rgba(255,255,255,0.95)",
        borderRadius: 4,
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        p: 0.5,
      }}
    >
      <ToggleButtonGroup
        size="small"
        exclusive
        value={language}
        onChange={handleChange}
      >
        <ToggleButton value="en" sx={{ py: 0.5, px: 1 }} title="English"><span style={{ fontSize: '1.25rem' }}>🇬🇧</span></ToggleButton>
        <ToggleButton value="ka" sx={{ py: 0.5, px: 1 }} title="Georgian"><span style={{ fontSize: '1.25rem' }}>🇬🇪</span></ToggleButton>
        <ToggleButton value="ru" sx={{ py: 0.5, px: 1 }} title="Russian"><span style={{ fontSize: '1.25rem' }}>🇷🇺</span></ToggleButton>
        <ToggleButton value="hi" sx={{ py: 0.5, px: 1 }} title="Hindi"><span style={{ fontSize: '1.25rem' }}>🇮🇳</span></ToggleButton>
        <ToggleButton value="ar" sx={{ py: 0.5, px: 1 }} title="Arabic"><span style={{ fontSize: '1.25rem' }}>🇦🇪</span></ToggleButton>
        <ToggleButton value="he" sx={{ py: 0.5, px: 1 }} title="Hebrew"><span style={{ fontSize: '1.25rem' }}>🇮🇱</span></ToggleButton>
        <ToggleButton value="tr" sx={{ py: 0.5, px: 1 }} title="Turkish"><span style={{ fontSize: '1.25rem' }}>🇹🇷</span></ToggleButton>
        <ToggleButton value="hy" sx={{ py: 0.5, px: 1 }} title="Armenian"><span style={{ fontSize: '1.25rem' }}>🇦🇲</span></ToggleButton>
        <ToggleButton value="kk" sx={{ py: 0.5, px: 1 }} title="Kazakh"><span style={{ fontSize: '1.25rem' }}>🇰🇿</span></ToggleButton>
        <ToggleButton value="uk" sx={{ py: 0.5, px: 1 }} title="Ukrainian"><span style={{ fontSize: '1.25rem' }}>🇺🇦</span></ToggleButton>
        <ToggleButton value="zh" sx={{ py: 0.5, px: 1 }} title="Chinese"><span style={{ fontSize: '1.25rem' }}>🇨🇳</span></ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}

