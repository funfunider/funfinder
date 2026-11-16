import React from "react";
import "./Categories.css";
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import KayakingIcon from '@mui/icons-material/Kayaking';
import ParaglidingIcon from '@mui/icons-material/Paragliding';
import SportsMotorsportsIcon from '@mui/icons-material/SportsMotorsports';
import WavesIcon from '@mui/icons-material/Waves';
import TerrainIcon from '@mui/icons-material/Terrain';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import HikingIcon from '@mui/icons-material/Hiking';
import { Link } from 'react-router-dom';
import { useLanguage } from "../contexts/LanguageContext";
import { Box, Typography, Container, Grid, Card, CardContent } from "@mui/material";

const adventureCategories = [
  { name: 'პარაგლაიდინგი', nameEn: 'Paragliding', icon: <ParaglidingIcon sx={{ fontSize: 40, color: '#87003A' }} />, path: '/parachute', count: 12 },
  { name: 'იახტები და კატერები', nameEn: 'Yachts & Boats', icon: <DirectionsBoatIcon sx={{ fontSize: 40, color: '#0284c7' }} />, path: '/yacht', count: 8 },
  { name: 'სამთო რაფტინგი', nameEn: 'Rafting', icon: <KayakingIcon sx={{ fontSize: 40, color: '#16a34a' }} />, path: '/rafting', count: 6 },
  { name: 'ზღვის მოტოციკლი', nameEn: 'Jet Ski', icon: <SportsMotorsportsIcon sx={{ fontSize: 40, color: '#d97706' }} />, path: '/sea-moto', count: 10 },
  { name: 'კვადროციკლები', nameEn: 'Quad Tours', icon: <TwoWheelerIcon sx={{ fontSize: 40, color: '#87003A' }} />, path: '/quad-tours', count: 14 },
  { name: '4x4 ჯიპ ტურები', nameEn: 'Jeep Safaris', icon: <DirectionsCarIcon sx={{ fontSize: 40, color: '#ea580c' }} />, path: '/jeep-tours', count: 9 },
  { name: 'მოტო ტურები', nameEn: 'Enduro & Moto', icon: <SportsMotorsportsIcon sx={{ fontSize: 40, color: '#7c3aed' }} />, path: '/moto-tours', count: 7 },
  { name: 'ველო ტურები', nameEn: 'Bicycles', icon: <DirectionsBikeIcon sx={{ fontSize: 40, color: '#059669' }} />, path: '/bicycles', count: 5 },
  { name: 'სამთო ლაშქრობა', nameEn: 'Hiking', icon: <HikingIcon sx={{ fontSize: 40, color: '#b45309' }} />, path: '/hiking', count: 11 },
];

const Categories = () => {
  const { language, getLocalizedPath } = useLanguage();
  const isKa = language === 'ka';

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h5" fontWeight={800} color="#0f172a" mb={3} textAlign="center">
          {isKa ? 'აქტივობების კატეგორიები' : 'Adventure Categories'}
        </Typography>

        <Grid container spacing={2.5}>
          {adventureCategories.map((cat, idx) => (
            <Grid item xs={6} sm={4} md={2.4} key={idx}>
              <Link to={getLocalizedPath(cat.path)} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2.5,
                    borderRadius: 3.5,
                    border: '1px solid rgba(0, 0, 0, 0.07)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
                    transition: 'all 0.25s ease',
                    textAlign: 'center',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 28px rgba(135, 0, 58, 0.12)',
                      borderColor: 'rgba(135, 0, 58, 0.3)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: '#f8fafc',
                      mb: 1.5,
                    }}
                  >
                    {cat.icon}
                  </Box>
                  <Typography variant="subtitle2" fontWeight={700} color="#0f172a" sx={{ fontSize: '0.92rem', mb: 0.5 }}>
                    {isKa ? cat.name : cat.nameEn}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {cat.count} {isKa ? 'აქტივობა' : 'tours'}
                  </Typography>
                </Card>
              </Link>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Categories;
