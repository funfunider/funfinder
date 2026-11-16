import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Dialog,
} from '@mui/material';
import {
  Close as CloseIcon,
  ArrowBack,
  ArrowForward,
  CheckCircle,
  ExploreOutlined,
} from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';

const FirstTimeGuide = ({ open, onClose, steps, onComplete }) => {
  const { language } = useLanguage();
  const isKa = language === 'ka';

  const fallbackSteps = useMemo(
    () => [
      {
        title: isKa ? 'რჩეული თავგადასავლები' : 'Featured Adventures',
        content: isKa
          ? 'აღმოაჩინეთ საქართველოს საუკეთესო ტურები და აქტივობები ერთ სივრცეში.'
          : 'Discover top adventures and activities across Georgia in one place.',
      },
      {
        title: isKa ? 'ფილტრაცია და ძებნა' : 'Filters & Search',
        content: isKa
          ? 'გამოიყენეთ ქალაქის ფილტრები და საძიებო ველი სასურველი ტურის მარტივად საპოვნელად.'
          : 'Use city pills and search to easily find your desired tour.',
      },
      {
        title: isKa ? 'მარტივი ონლაინ ჯავშანი' : 'Easy Online Booking',
        content: isKa
          ? 'აირჩიეთ სასურველი დრო, დაჯავშნეთ ონლაინ და მიიღეთ მყისიერი ელექტრონული ვაუჩერი.'
          : 'Select your preferred time slot, book online, and get an instant e-voucher.',
      },
    ],
    [isKa]
  );

  const activeSteps = steps && steps.length > 0 ? steps : fallbackSteps;

  const [activeStep, setActiveStep] = useState(0);
  const [targetElement, setTargetElement] = useState(null);

  useEffect(() => {
    if (open && activeSteps.length > 0) {
      setActiveStep(0);
      highlightTarget(activeSteps[0]);
    }
    return () => {
      removeHighlight();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open && activeSteps[activeStep]) {
      highlightTarget(activeSteps[activeStep]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, open]);

  const highlightTarget = (step) => {
    if (step?.target) {
      const element = document.querySelector(step.target);
      if (element) {
        setTargetElement(element);
        const isFixed = window.getComputedStyle(element).position === 'fixed';
        if (!isFixed) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        element.style.transition = 'all 0.3s ease';
        element.style.boxShadow =
          '0 0 0 4px rgba(135, 0, 58, 0.45), 0 8px 28px rgba(135, 0, 58, 0.25)';
        element.style.zIndex = '13001';
      }
    }
  };

  const removeHighlight = () => {
    if (targetElement) {
      targetElement.style.boxShadow = '';
      targetElement.style.zIndex = '';
      targetElement.style.animation = '';
    }
  };

  const handleNext = () => {
    removeHighlight();
    if (activeStep === activeSteps.length - 1) {
      handleComplete();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    removeHighlight();
    setActiveStep((prev) => Math.max(0, prev - 1));
  };

  const handleComplete = () => {
    removeHighlight();
    if (onComplete) {
      onComplete();
    }
    if (onClose) {
      onClose();
    }
  };

  const handleSkip = () => {
    removeHighlight();
    if (onComplete) {
      onComplete();
    }
    if (onClose) {
      onClose();
    }
  };

  if (!open || activeSteps.length === 0) return null;

  const currentStep = activeSteps[activeStep] || activeSteps[0];
  const isLastStep = activeStep === activeSteps.length - 1;

  return (
    <Dialog
      open={open}
      onClose={handleSkip}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          width: 'calc(100% - 32px)',
          maxWidth: 420,
          m: 2,
          borderRadius: '22px',
          overflow: 'hidden',
          bgcolor: '#ffffff',
          border: '1px solid rgba(135, 0, 58, 0.14)',
          boxShadow: '0 24px 60px rgba(17, 24, 39, 0.28)',
        },
      }}
      sx={{
        zIndex: 15000,
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(15, 23, 42, 0.62)',
          backdropFilter: 'blur(4px)',
        },
      }}
    >
      {/* Top Brand Header Banner */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #87003A 0%, #5c0027 100%)',
          px: 2.5,
          pt: 2.25,
          pb: 2,
          color: '#ffffff',
          position: 'relative',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1,
            mb: 1.75,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: '10px',
                bgcolor: 'rgba(255, 255, 255, 0.16)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ExploreOutlined sx={{ fontSize: 20, color: '#ffffff' }} />
            </Box>
            <Box>
              <Typography
                component="h2"
                sx={{
                  color: '#ffffff !important',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  lineHeight: 1.25,
                  letterSpacing: '-0.2px',
                }}
              >
                {isKa ? 'მოგესალმებით Funfinder-ზე! 👋' : 'Welcome to Funfinder! 👋'}
              </Typography>
              <Typography
                sx={{
                  color: 'rgba(255, 255, 255, 0.85) !important',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  mt: 0.25,
                }}
              >
                {isKa
                  ? `ნაბიჯი ${activeStep + 1} / ${activeSteps.length}`
                  : `Step ${activeStep + 1} of ${activeSteps.length}`}
              </Typography>
            </Box>
          </Box>

          <IconButton
            onClick={handleSkip}
            size="small"
            aria-label="Close guide"
            sx={{
              color: '#ffffff',
              bgcolor: 'rgba(255, 255, 255, 0.12)',
              width: 32,
              height: 32,
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.24)' },
            }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* Clean Stepper Indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {activeSteps.map((_, index) => {
            const isCompleted = index < activeStep;
            const isCurrent = index === activeStep;
            return (
              <React.Fragment key={index}>
                <Box
                  onClick={() => {
                    removeHighlight();
                    setActiveStep(index);
                  }}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor:
                      isCurrent || isCompleted
                        ? '#ffffff'
                        : 'rgba(255, 255, 255, 0.22)',
                    color: isCurrent || isCompleted ? '#87003A' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: isCurrent
                      ? '0 0 0 3px rgba(255, 255, 255, 0.28)'
                      : 'none',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  {isCompleted ? (
                    <CheckCircle sx={{ fontSize: 18, color: '#87003A' }} />
                  ) : (
                    index + 1
                  )}
                </Box>
                {index < activeSteps.length - 1 && (
                  <Box
                    sx={{
                      flex: 1,
                      height: 3,
                      borderRadius: 2,
                      bgcolor:
                        index < activeStep
                          ? '#ffffff'
                          : 'rgba(255, 255, 255, 0.25)',
                      transition: 'background-color 0.25s ease',
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </Box>
      </Box>

      {/* Main Content Area (Clean White Surface matching Site Cards) */}
      <Box sx={{ px: 2.5, py: 2.5, bgcolor: '#ffffff' }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1.25,
            py: 0.4,
            mb: 1.25,
            borderRadius: '20px',
            bgcolor: 'rgba(135, 0, 58, 0.08)',
            color: '#87003A',
            fontSize: '0.75rem',
            fontWeight: 700,
          }}
        >
          <span>
            {isKa ? `გზამკვლევი • 0${activeStep + 1}` : `Quick Guide • 0${activeStep + 1}`}
          </span>
        </Box>

        <Typography
          component="h3"
          sx={{
            color: '#111827 !important',
            fontWeight: 800,
            fontSize: '1.15rem',
            lineHeight: 1.3,
            mb: 1,
          }}
        >
          {currentStep?.title}
        </Typography>

        <Typography
          sx={{
            color: '#4b5563 !important',
            fontSize: '0.92rem',
            lineHeight: 1.6,
            fontWeight: 500,
          }}
        >
          {currentStep?.content}
        </Typography>

        {currentStep?.image && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <img
              src={currentStep.image}
              alt={currentStep.title}
              style={{ maxWidth: '100%', borderRadius: 12 }}
            />
          </Box>
        )}
      </Box>

      {/* Bottom Action Bar (Single-Row Mobile Friendly) */}
      <Box
        sx={{
          px: 2.5,
          py: 1.75,
          bgcolor: '#f8f9fa',
          borderTop: '1px solid #eef0f3',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Button
          onClick={handleSkip}
          size="small"
          sx={{
            color: '#6b7280',
            fontWeight: 600,
            fontSize: '0.84rem',
            px: 1.25,
            py: 0.75,
            minWidth: 'auto',
            whiteSpace: 'nowrap',
            borderRadius: '10px',
            '&:hover': {
              bgcolor: 'rgba(17, 24, 39, 0.05)',
              color: '#111827',
            },
          }}
        >
          {isKa ? 'გამოტოვება' : 'Skip Tour'}
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {activeStep > 0 && (
            <Button
              onClick={handleBack}
              size="small"
              startIcon={<ArrowBack sx={{ fontSize: '16px !important' }} />}
              sx={{
                color: '#374151',
                borderColor: '#d1d5db',
                bgcolor: '#ffffff',
                border: '1px solid #e5e7eb',
                fontWeight: 600,
                fontSize: '0.84rem',
                px: 1.5,
                py: 0.75,
                minWidth: 'auto',
                whiteSpace: 'nowrap',
                borderRadius: '10px',
                '&:hover': {
                  bgcolor: '#f3f4f6',
                  borderColor: '#cbd5e1',
                },
              }}
            >
              {isKa ? 'უკან' : 'Back'}
            </Button>
          )}

          <Button
            onClick={handleNext}
            variant="contained"
            size="small"
            endIcon={
              isLastStep ? (
                <CheckCircle sx={{ fontSize: '16px !important' }} />
              ) : (
                <ArrowForward sx={{ fontSize: '16px !important' }} />
              )
            }
            sx={{
              bgcolor: '#87003A',
              color: '#ffffff !important',
              fontWeight: 700,
              fontSize: '0.86rem',
              px: 2,
              py: 0.85,
              minWidth: 'auto',
              whiteSpace: 'nowrap',
              borderRadius: '10px',
              boxShadow: '0 4px 12px rgba(135, 0, 58, 0.28)',
              '&:hover': {
                bgcolor: '#6a002c',
                boxShadow: '0 6px 16px rgba(135, 0, 58, 0.38)',
              },
            }}
          >
            {isLastStep
              ? isKa
                ? 'დაწყება'
                : 'Get Started'
              : isKa
              ? 'შემდეგი'
              : 'Next'}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default FirstTimeGuide;
