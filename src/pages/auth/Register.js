import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  InputAdornment,
  IconButton,
  Divider,
  Autocomplete,
  Alert,
  CircularProgress,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Stack,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import PublicIcon from '@mui/icons-material/Public';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import { useLanguageNavigate } from '../../hooks/useLanguageNavigate';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import GoogleLogin from '../../components/GoogleLogin';
import apiService from '../../services/api';

const COUNTRIES = [
  'Georgia', 'United States', 'United Kingdom', 'Germany', 'France', 'Israel', 'Turkey', 'Ukraine', 'Poland', 'Kazakhstan',
  'Armenia', 'Azerbaijan', 'Italy', 'Spain', 'Netherlands', 'Canada', 'Australia', 'United Arab Emirates', 'Saudi Arabia',
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Austria',
  'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon',
  'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
  'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt',
  'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'Gabon',
  'Gambia', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
  'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
  'Jamaica', 'Japan', 'Jordan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos',
  'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi',
  'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova',
  'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal',
  'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau',
  'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Portugal', 'Qatar', 'Romania',
  'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Senegal',
  'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea',
  'South Sudan', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan',
  'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkmenistan', 'Tuvalu',
  'Uganda', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela',
  'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

const Register = () => {
  const navigate = useLanguageNavigate();
  const { language } = useLanguage();
  const isKa = language === 'ka';
  const { register, loginWithGoogle, sendRegisterOtp, verifyRegisterOtp } = useAuth();

  const [form, setForm] = useState({ 
    firstname: '', 
    lastname: '', 
    email: '', 
    password: '', 
    confirm: '',
    country: 'Georgia',
    mobile: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Verification States
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleGoogleSuccess = async (userData) => {
    const result = await loginWithGoogle(userData);
    if (result.success) {
      navigate('/profile');
    } else {
      setError(
        result.error ||
          (isKa ? 'Google-ით რეგისტრაცია ვერ მოხერხდა' : 'Google registration failed')
      );
    }
  };

  const handleGoogleError = (err) => {
    setError(
      isKa
        ? 'Google ავტორიზაციის შეცდომა'
        : 'Google authorization failed'
    );
    console.error('Google register error:', err);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!form.firstname || !form.lastname || !form.email || !form.password || !form.confirm || !form.country || !form.mobile) {
      setError(isKa ? 'გთხოვთ შეავსოთ ყველა აუცილებელი ველი' : 'Please fill in all required fields');
      setLoading(false);
      return;
    }
    if (form.password !== form.confirm) {
      setError(isKa ? 'პაროლები არ ემთხვევა ერთმანეთს' : 'Passwords do not match');
      setLoading(false);
      return;
    }
    if (form.password.length < 6) {
      setError(isKa ? 'პაროლი უნდა შედგებოდეს მინიმუმ 6 სიმბოლოსგან' : 'Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const registrationData = {
      firstname: form.firstname.trim(),
      lastname: form.lastname.trim(),
      email: form.email.trim(),
      password: form.password,
      country: form.country,
      mobile: form.mobile.trim(),
      phone: form.mobile.trim()
    };

    try {
      const result = await sendRegisterOtp(registrationData);
      if (result.success) {
        setOtpDialogOpen(true);
        setResendCooldown(60);
        setOtpError('');
        setOtpCode('');
      } else {
        setError(
          result.error ||
          (isKa ? 'ვერიფიკაციის კოდის გაგზავნა ვერ მოხერხდა. სცადეთ სხვა მონაცემები.' : 'Failed to send verification code. Please check your data.')
        );
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(
        err?.message ||
        (isKa ? 'ვერიფიკაციის კოდის გაგზავნა ვერ მოხერხდა. სცადეთ სხვა ელ-ფოსტა.' : 'Failed to send verification code.')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!otpCode || otpCode.trim().length < 6) {
      setOtpError(isKa ? 'გთხოვთ შეიყვანოთ 6-ნიშნა კოდი' : 'Please enter the 6-digit code');
      return;
    }

    setOtpLoading(true);
    setOtpError('');

    try {
      const result = await verifyRegisterOtp(form.email.trim(), otpCode.trim());
      if (result.success) {
        setOtpDialogOpen(false);
        setSuccess(isKa ? 'ელ-ფოსტა დადასტურდა! რეგისტრაცია წარმატებით დასრულდა. გადამისამართება...' : 'Email verified! Registered successfully. Redirecting...');
        setTimeout(() => {
          navigate('/profile');
        }, 1200);
      } else {
        setOtpError(result.error || (isKa ? 'არასწორი კოდი. გთხოვთ გადაამოწმოთ.' : 'Invalid code. Please try again.'));
      }
    } catch (err) {
      console.error('Verify OTP error:', err);
      setOtpError(err?.message || (isKa ? 'კოდის შემოწმება ვერ მოხერხდა' : 'Failed to verify code'));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setOtpError('');
    try {
      const registrationData = {
        firstname: form.firstname.trim(),
        lastname: form.lastname.trim(),
        email: form.email.trim(),
        password: form.password,
        country: form.country,
        mobile: form.mobile.trim(),
        phone: form.mobile.trim()
      };
      const result = await sendRegisterOtp(registrationData);
      if (result.success) {
        setResendCooldown(60);
      } else {
        setOtpError(result.error || (isKa ? 'ხელახლა გაგზავნა ვერ მოხერხდა' : 'Failed to resend code'));
      }
    } catch (err) {
      setOtpError(err.message || (isKa ? 'ხელახლა გაგზავნა ვერ მოხერხდა' : 'Failed to resend code'));
    }
  };

  const inputStyles = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "14px",
      backgroundColor: "#f8fafc",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      "& fieldset": {
        borderColor: "#e2e8f0",
        borderWidth: "1.5px",
      },
      "&:hover fieldset": {
        borderColor: "#cbd5e1",
      },
      "&.Mui-focused": {
        backgroundColor: "#ffffff",
        boxShadow: "0 0 0 4px rgba(135, 0, 58, 0.08)",
        "& fieldset": {
          borderColor: "#87003a",
          borderWidth: "2px",
        },
      },
      "& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active": {
        WebkitBoxShadow: "0 0 0 1000px #f8fafc inset !important",
        WebkitTextFillColor: "#1e293b !important",
        caretColor: "#1e293b !important",
        transition: "background-color 5000s ease-in-out 0s",
      },
      "&.Mui-focused input:-webkit-autofill": {
        WebkitBoxShadow: "0 0 0 1000px #ffffff inset !important",
      },
    },
    "& .MuiInputBase-input": {
      py: 1.4,
      px: 1,
      fontSize: "0.93rem",
      fontWeight: 500,
      color: "#1e293b",
      width: "100%",
    },
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "calc(100vh - 180px)",
        py: { xs: 4, md: 7 },
        px: 2,
        position: "relative",
        background: "radial-gradient(1100px circle at 50% 15%, rgba(135, 0, 58, 0.04) 0%, rgba(248, 250, 252, 0.95) 70%, #f1f5f9 100%)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "8%",
          left: "50%",
          transform: "translateX(-50%)",
          width: { xs: 320, md: 600 },
          height: { xs: 320, md: 600 },
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(135, 0, 58, 0.06) 0%, transparent 70%)",
          filter: "blur(45px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <Card
        sx={{
          maxWidth: 540,
          width: "100%",
          borderRadius: "24px",
          boxShadow: "0 20px 48px -12px rgba(15, 23, 42, 0.09), 0 0 0 1px rgba(226, 232, 240, 0.8)",
          backgroundColor: "#ffffff",
          position: "relative",
          zIndex: 1,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            height: 5,
            width: "100%",
            background: "linear-gradient(90deg, #87003a 0%, #d9005e 50%, #f43f5e 100%)",
          }}
        />

        <CardContent sx={{ p: { xs: 3, sm: 4.5 } }}>
          {/* Header */}
          <Box sx={{ textAlign: "center", mb: 3.5 }}>
            <Box
              sx={{
                width: 54,
                height: 54,
                borderRadius: "16px",
                background: "linear-gradient(135deg, rgba(135, 0, 58, 0.1) 0%, rgba(217, 0, 94, 0.15) 100%)",
                color: "#87003a",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
                boxShadow: "0 4px 12px rgba(135, 0, 58, 0.1)",
              }}
            >
              <HowToRegOutlinedIcon sx={{ fontSize: 28 }} />
            </Box>

            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.5px",
                fontSize: { xs: "1.45rem", sm: "1.65rem" },
                mb: 0.8,
              }}
            >
              {isKa ? "რეგისტრაცია" : "Create Account"}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: "#64748b",
                fontSize: "0.92rem",
                lineHeight: 1.4,
              }}
            >
              {isKa
                ? "შემოუერთდით Funfinder-ს და დაჯავშნეთ საუკეთესო თავგადასავლები"
                : "Join Funfinder to book and experience Georgia's best adventures"}
            </Typography>
          </Box>

          {/* Feedback Alerts */}
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2.5,
                borderRadius: "12px",
                fontSize: "0.88rem",
                border: "1px solid #fecaca",
                backgroundColor: "#fef2f2",
              }}
            >
              {error}
            </Alert>
          )}

          {success && (
            <Alert
              severity="success"
              sx={{
                mb: 2.5,
                borderRadius: "12px",
                fontSize: "0.88rem",
                border: "1px solid #a7f3d0",
                backgroundColor: "#ecfdf5",
              }}
            >
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2}>
              {/* First Name */}
              <Grid item xs={12} sm={6}>
                <Typography
                  component="label"
                  sx={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", mb: 0.5 }}
                >
                  {isKa ? "სახელი" : "First name"} *
                </Typography>
                <TextField
                  fullWidth
                  name="firstname"
                  placeholder={isKa ? "თქვენი სახელი" : "John"}
                  value={form.firstname}
                  onChange={handleChange}
                  sx={inputStyles}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineIcon sx={{ color: "#94a3b8", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Last Name */}
              <Grid item xs={12} sm={6}>
                <Typography
                  component="label"
                  sx={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", mb: 0.5 }}
                >
                  {isKa ? "გვარი" : "Last name"} *
                </Typography>
                <TextField
                  fullWidth
                  name="lastname"
                  placeholder={isKa ? "თქვენი გვარი" : "Doe"}
                  value={form.lastname}
                  onChange={handleChange}
                  sx={inputStyles}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineIcon sx={{ color: "#94a3b8", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Email */}
              <Grid item xs={12}>
                <Typography
                  component="label"
                  sx={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", mb: 0.5 }}
                >
                  {isKa ? "ელ-ფოსტა" : "Email address"} *
                </Typography>
                <TextField
                  fullWidth
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={handleChange}
                  sx={inputStyles}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlinedIcon sx={{ color: "#94a3b8", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Phone */}
              <Grid item xs={12} sm={6}>
                <Typography
                  component="label"
                  sx={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", mb: 0.5 }}
                >
                  {isKa ? "ტელეფონი" : "Phone number"} *
                </Typography>
                <TextField
                  fullWidth
                  name="mobile"
                  type="tel"
                  placeholder="+995 5xx xx xx xx"
                  value={form.mobile}
                  onChange={handleChange}
                  sx={inputStyles}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneOutlinedIcon sx={{ color: "#94a3b8", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Country */}
              <Grid item xs={12} sm={6}>
                <Typography
                  component="label"
                  sx={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", mb: 0.5 }}
                >
                  {isKa ? "ქვეყანა" : "Country"} *
                </Typography>
                <Autocomplete
                  options={COUNTRIES}
                  value={form.country || 'Georgia'}
                  onChange={(_, newValue) => {
                    setForm((prev) => ({ ...prev, country: newValue || '' }));
                    setError('');
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      sx={inputStyles}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <PublicIcon sx={{ color: "#94a3b8", fontSize: 20 }} />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Password */}
              <Grid item xs={12} sm={6}>
                <Typography
                  component="label"
                  sx={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", mb: 0.5 }}
                >
                  {isKa ? "პაროლი" : "Password"} *
                </Typography>
                <TextField
                  fullWidth
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  sx={inputStyles}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ color: "#94a3b8", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((s) => !s)}
                          edge="end"
                          size="small"
                          sx={{ color: "#94a3b8", mr: 0.5 }}
                        >
                          {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Confirm Password */}
              <Grid item xs={12} sm={6}>
                <Typography
                  component="label"
                  sx={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", mb: 0.5 }}
                >
                  {isKa ? "გაიმეორეთ პაროლი" : "Confirm password"} *
                </Typography>
                <TextField
                  fullWidth
                  name="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.confirm}
                  onChange={handleChange}
                  sx={inputStyles}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ color: "#94a3b8", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirm((s) => !s)}
                          edge="end"
                          size="small"
                          sx={{ color: "#94a3b8", mr: 0.5 }}
                        >
                          {showConfirm ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              endIcon={!loading && <ArrowForwardIcon sx={{ fontSize: 18 }} />}
              sx={{
                mt: 3,
                py: 1.5,
                borderRadius: "14px",
                background: "linear-gradient(135deg, #87003a 0%, #aa0049 100%)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.98rem",
                textTransform: "none",
                boxShadow: "0 8px 20px rgba(135, 0, 58, 0.28)",
                transition: "all 0.25s ease",
                "&:hover": {
                  background: "linear-gradient(135deg, #9e0044 0%, #c40054 100%)",
                  boxShadow: "0 12px 26px rgba(135, 0, 58, 0.38)",
                  transform: "translateY(-1.5px)",
                },
                "&:active": {
                  transform: "translateY(0)",
                },
                "&:disabled": {
                  background: "#e2e8f0",
                  color: "#94a3b8",
                  boxShadow: "none",
                },
              }}
            >
              {loading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  <span>{isKa ? "რეგისტრაცია..." : "Registering..."}</span>
                </Box>
              ) : (
                isKa ? "ანგარიშის შექმნა" : "Create Account"
              )}
            </Button>
          </form>

          {/* Divider */}
          <Box sx={{ display: 'flex', alignItems: 'center', my: 3 }}>
            <Divider sx={{ flexGrow: 1, borderColor: '#e2e8f0' }} />
            <Typography
              variant="caption"
              sx={{
                px: 2,
                color: "#94a3b8",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                fontSize: "0.75rem",
              }}
            >
              {isKa ? "ან გააგრძელეთ" : "Or continue with"}
            </Typography>
            <Divider sx={{ flexGrow: 1, borderColor: '#e2e8f0' }} />
          </Box>

          {/* Google Registration */}
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text={isKa ? "Google-ით რეგისტრაცია" : "Sign up with Google"}
          />

          {/* Login Footer */}
          <Box
            sx={{
              mt: 3.5,
              pt: 2.5,
              borderTop: "1px solid #f1f5f9",
              textAlign: "center",
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: "#64748b", fontSize: "0.9rem" }}
            >
              {isKa ? "უკვე გაქვთ ანგარიში? " : "Already have an account? "}
              <Box
                component="span"
                onClick={() => navigate('/login')}
                sx={{
                  color: "#87003a",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "color 0.2s",
                  "&:hover": {
                    color: "#aa0049",
                    textDecoration: "underline",
                  },
                }}
              >
                {isKa ? "ავტორიზაცია" : "Log in"}
              </Box>
            </Typography>
          </Box>

          {/* Security Badge */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.8,
              mt: 2.5,
              color: "#94a3b8",
            }}
          >
            <VerifiedUserOutlinedIcon sx={{ fontSize: 15, color: "#10b981" }} />
            <Typography variant="caption" sx={{ fontSize: "0.76rem", fontWeight: 500 }}>
              {isKa ? "თქვენი მონაცემები საიმედოდაა დაცული" : "Your data is strictly encrypted & secured"}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* OTP Verification Dialog */}
      <Dialog
        open={otpDialogOpen}
        onClose={() => {}}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 1.5,
            textAlign: 'center'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: '#EDE9FE', color: '#6E3FF3', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
            <EmailOutlinedIcon sx={{ fontSize: 32 }} />
          </Box>
          <Typography variant="h6" fontWeight={800} color="#1E1B4B">
            {isKa ? 'ელ-ფოსტის დადასტურება' : 'Verify Your Email'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {isKa ? '6-ნიშნა ვერიფიკაციის კოდი გამოგზავნილია მისამართზე:' : 'A 6-digit verification code has been sent to:'}
            <br />
            <strong style={{ color: '#3A1D94' }}>{form.email}</strong>
          </Typography>

          {otpError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.85rem' }}>
              {otpError}
            </Alert>
          )}

          <TextField
            autoFocus
            fullWidth
            placeholder="• • • • • •"
            value={otpCode}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              setOtpCode(val);
              if (otpError) setOtpError('');
            }}
            inputProps={{
              maxLength: 6,
              inputMode: 'numeric',
              style: {
                textAlign: 'center',
                letterSpacing: '12px',
                fontSize: '26px',
                fontWeight: 800,
                color: '#3A1D94'
              }
            }}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                bgcolor: '#F8FAFC'
              }
            }}
          />

          <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
            <Typography variant="caption" color="text.secondary">
              {isKa ? 'არ მიგიღიათ კოდი?' : 'Didn’t get the code?'}
            </Typography>
            <Button
              size="small"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0}
              sx={{ textTransform: 'none', fontWeight: 700, color: '#6E3FF3', p: 0, minWidth: 'auto' }}
            >
              {resendCooldown > 0
                ? `${isKa ? 'ხელახლა გაგზავნა' : 'Resend in'} (${resendCooldown}s)`
                : (isKa ? 'ხელახლა გაგზავნა' : 'Resend code')}
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, flexDirection: 'column', gap: 1 }}>
          <Button
            fullWidth
            variant="contained"
            disabled={otpLoading || otpCode.length < 6}
            onClick={handleVerifyOtpSubmit}
            sx={{
              bgcolor: '#3A1D94',
              '&:hover': { bgcolor: '#2A146C' },
              borderRadius: 3,
              py: 1.2,
              fontWeight: 700,
              textTransform: 'none'
            }}
          >
            {otpLoading ? <CircularProgress size={24} color="inherit" /> : (isKa ? 'დადასტურება' : 'Verify & Continue')}
          </Button>
          <Button
            size="small"
            onClick={() => setOtpDialogOpen(false)}
            sx={{ color: '#64748B', textTransform: 'none', fontSize: 13 }}
          >
            {isKa ? 'მონაცემების შეცვლა' : 'Change information'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Register;