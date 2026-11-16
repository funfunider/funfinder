import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { IconButton, Tooltip, Box } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  // Scroll to (0, 0) on every route change – run after new page renders
  useEffect(() => {
    const scrollToZero = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const mainContent = document.querySelector('.main-content');
      if (mainContent) mainContent.scrollTop = 0;
    };
    scrollToZero();
    const id = setTimeout(scrollToZero, 0);
    return () => clearTimeout(id);
  }, [location.pathname, location.key]);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 28,
        right: 28,
        zIndex: 1000,
      }}
    >
      <Tooltip title="ზემოთ დაბრუნება">
        <IconButton
          onClick={scrollToTop}
          sx={{
            backgroundColor: '#87003A',
            color: 'white',
            width: 44,
            height: 44,
            boxShadow: '0 4px 16px rgba(135, 0, 58, 0.35)',
            '&:hover': {
              backgroundColor: '#6a002c',
              transform: 'translateY(-3px)',
            },
            transition: 'all 0.25s ease',
          }}
        >
          <KeyboardArrowUpIcon sx={{ fontSize: 24 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default ScrollToTop;

