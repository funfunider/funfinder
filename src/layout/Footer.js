import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import { Link as RouterLink } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import VisitorCounter from "../components/VisitorCounter";
import logo from "../assets/logo.jpg";

import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

export default function Footer() {
  const { t, language, getLocalizedPath } = useLanguage();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "#18191c",
        color: "#9ca3af",
        pt: { xs: 5, md: 7 },
        pb: 4,
        borderTop: "1px solid #27272a",
      }}
    >
      <Container maxWidth={false} sx={{ maxWidth: 1360, mx: "auto", px: { xs: 2.5, sm: 3, md: 4 } }}>
        <Grid container spacing={4} sx={{ mb: 5 }}>
          {/* Column 1: Brand Info */}
          <Grid item xs={12} sm={6} md={3.5}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
              <img src={logo} alt="Funfinder" style={{ width: 38, height: 38, borderRadius: 10 }} />
              <Typography variant="h5" fontWeight={800} color="#ffffff" letterSpacing="-0.5px">
                Funfinder
              </Typography>
            </Box>

            <Typography variant="body2" sx={{ color: "#9ca3af", mb: 2.5, lineHeight: 1.6, pr: { md: 2 } }}>
              {language === "ka"
                ? "Funfinder — ემოციები, თავგადასავლები და საუკეთესო აქტივობები საქართველოში. შეიძინეთ ბილეთები ონლაინ მარტივად და უსაფრთხოდ."
                : "Funfinder — Emotions, adventures, and the best activities in Georgia. Book tickets online easily and securely."}
            </Typography>

            <Typography variant="caption" sx={{ color: "#6b7280", display: "block" }}>
              info@funfinder.ge • +995 593 76 27 27
            </Typography>
          </Grid>

          {/* Column 2: Categories */}
          <Grid item xs={6} sm={6} md={2.5}>
            <Typography variant="subtitle1" fontWeight={700} color="#ffffff" sx={{ mb: 2 }}>
              {language === "ka" ? "აქტივობები" : "Categories"}
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
              <Typography
                component={RouterLink}
                to={getLocalizedPath("/water-activities")}
                sx={{ color: "#9ca3af", textDecoration: "none", fontSize: "14px", "&:hover": { color: "#ffffff" } }}
              >
                {language === "ka" ? "ზღვისა და წყლის ტურები" : "Sea & Water Tours"}
              </Typography>
              <Typography
                component={RouterLink}
                to={getLocalizedPath("/parachute")}
                sx={{ color: "#9ca3af", textDecoration: "none", fontSize: "14px", "&:hover": { color: "#ffffff" } }}
              >
                {language === "ka" ? "პარაგლაიდინგი & პარაშუტი" : "Paragliding & Parachute"}
              </Typography>
              <Typography
                component={RouterLink}
                to={getLocalizedPath("/quad-tours")}
                sx={{ color: "#9ca3af", textDecoration: "none", fontSize: "14px", "&:hover": { color: "#ffffff" } }}
              >
                {language === "ka" ? "კვადროციკლების ტურები" : "Quad Bike Tours"}
              </Typography>
              <Typography
                component={RouterLink}
                to={getLocalizedPath("/jeep-tours")}
                sx={{ color: "#9ca3af", textDecoration: "none", fontSize: "14px", "&:hover": { color: "#ffffff" } }}
              >
                {language === "ka" ? "ჯიპ ტურები მთაში" : "Mountain Jeep Tours"}
              </Typography>
              <Typography
                component={RouterLink}
                to={getLocalizedPath("/rafting")}
                sx={{ color: "#9ca3af", textDecoration: "none", fontSize: "14px", "&:hover": { color: "#ffffff" } }}
              >
                {language === "ka" ? "რაფტინგი მდინარეზე" : "White Water Rafting"}
              </Typography>
              <Typography
                component={RouterLink}
                to={getLocalizedPath("/hiking")}
                sx={{ color: "#9ca3af", textDecoration: "none", fontSize: "14px", "&:hover": { color: "#ffffff" } }}
              >
                {language === "ka" ? "სამთო ლაშქრობები" : "Mountain Hiking"}
              </Typography>
            </Box>
          </Grid>

          {/* Column 3: Customer Care & Legal */}
          <Grid item xs={6} sm={6} md={2.5}>
            <Typography variant="subtitle1" fontWeight={700} color="#ffffff" sx={{ mb: 2 }}>
              {language === "ka" ? "ინფორმაცია" : "Information"}
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
              <Typography
                component={RouterLink}
                to={getLocalizedPath("/tickets")}
                sx={{ color: "#9ca3af", textDecoration: "none", fontSize: "14px", "&:hover": { color: "#ffffff" } }}
              >
                {t("nav.tickets") || "ბილეთები"}
              </Typography>
              <Typography
                component={RouterLink}
                to={getLocalizedPath("/about")}
                sx={{ color: "#9ca3af", textDecoration: "none", fontSize: "14px", "&:hover": { color: "#ffffff" } }}
              >
                {t("nav.about") || "ჩვენს შესახებ"}
              </Typography>
              <Typography
                component={RouterLink}
                to={getLocalizedPath("/contact")}
                sx={{ color: "#9ca3af", textDecoration: "none", fontSize: "14px", "&:hover": { color: "#ffffff" } }}
              >
                {t("nav.contact") || "კონტაქტი"}
              </Typography>
              <Typography
                component={RouterLink}
                to={getLocalizedPath("/rules")}
                sx={{ color: "#9ca3af", textDecoration: "none", fontSize: "14px", "&:hover": { color: "#ffffff" } }}
              >
                {t("nav.rules") || "წესები და პირობები"}
              </Typography>
              <Typography
                component={RouterLink}
                to={getLocalizedPath("/privacy")}
                sx={{ color: "#9ca3af", textDecoration: "none", fontSize: "14px", "&:hover": { color: "#ffffff" } }}
              >
                {t("nav.privacy") || "კონფიდენციალურობა"}
              </Typography>
              <Typography
                component={RouterLink}
                to={getLocalizedPath("/restrictions")}
                sx={{ color: "#9ca3af", textDecoration: "none", fontSize: "14px", "&:hover": { color: "#ffffff" } }}
              >
                {t("nav.restrictions") || "შეზღუდვები"}
              </Typography>
            </Box>
          </Grid>

          {/* Column 4: Contact & Socials */}
          <Grid item xs={12} sm={6} md={3.5}>
            <Typography variant="subtitle1" fontWeight={700} color="#ffffff" sx={{ mb: 2 }}>
              {language === "ka" ? "კონტაქტი & მხარდაჭერა" : "Contact & Support"}
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 2.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                <PhoneIcon sx={{ fontSize: 18, color: "#87003A" }} />
                <Typography variant="body2" color="#d1d5db">
                  +995 593 76 27 27
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                <WhatsAppIcon sx={{ fontSize: 18, color: "#10b981" }} />
                <Typography variant="body2" color="#d1d5db">
                  +995 571 92 50 05 (WhatsApp)
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                <EmailIcon sx={{ fontSize: 18, color: "#87003A" }} />
                <Typography variant="body2" color="#d1d5db">
                  info@funfinder.ge
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                <LocationOnIcon sx={{ fontSize: 18, color: "#87003A" }} />
                <Typography variant="body2" color="#d1d5db">
                  {language === "ka" ? "ბათუმი, თბილისი, საქართველო" : "Batumi, Tbilisi, Georgia"}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <VisitorCounter />
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ borderColor: "#27272a", mb: 3 }} />

        {/* Bottom Bar: Copyright & Terms */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            textAlign: { xs: "center", sm: "left" },
          }}
        >
          <Typography variant="body2" sx={{ color: "#6b7280", fontSize: "13px" }}>
            © {new Date().getFullYear()} Funfinder. {language === "ka" ? "ყველა უფლება დაცულია." : "All rights reserved."}
          </Typography>

          <Box sx={{ display: "flex", gap: 2.5, flexWrap: "wrap", justifyContent: "center" }}>
            <Typography
              component={RouterLink}
              to={getLocalizedPath("/rules")}
              sx={{ color: "#6b7280", textDecoration: "none", fontSize: "13px", "&:hover": { color: "#ffffff" } }}
            >
              Terms of Service
            </Typography>
            <Typography
              component={RouterLink}
              to={getLocalizedPath("/privacy")}
              sx={{ color: "#6b7280", textDecoration: "none", fontSize: "13px", "&:hover": { color: "#ffffff" } }}
            >
              Privacy Policy
            </Typography>
            <Typography
              component={RouterLink}
              to={getLocalizedPath("/contact")}
              sx={{ color: "#6b7280", textDecoration: "none", fontSize: "13px", "&:hover": { color: "#ffffff" } }}
            >
              Support
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
