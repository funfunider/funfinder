import React, { useState } from "react";
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
  Alert,
  FormControlLabel,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import { useLanguageNavigate } from "../../hooks/useLanguageNavigate";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import GoogleLogin from "../../components/GoogleLogin";

const Login = () => {
  const navigate = useLanguageNavigate();
  const { language } = useLanguage();
  const isKa = language === "ka";
  const { login, loginWithGoogle } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!form.email || !form.password) {
      setError(isKa ? "გთხოვთ შეავსოთ ყველა ველი" : "Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      const result = await login({
        email: form.email.trim(),
        password: form.password,
      });
      if (result.success) {
        const user = result.user || {};
        const role = user.role || (user.isAdmin ? 'admin' : (user.isStaff ? 'staff' : 'customer'));
        const token = result.token || user.token;
        const sessionToken = result.session_token || user.sessionToken;

        if (role === 'admin' || user.isAdmin) {
          navigate("/admin");
          return;
        } else if (role === 'staff' || user.isStaff) {
          navigate("/staff");
          return;
        } else {
          navigate("/profile");
          return;
        }
      } else {
        setError(
          result.error ||
            (isKa
              ? "ელ-ფოსტა ან პაროლი არასწორია"
              : "Incorrect email or password")
        );
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err?.message ||
        (isKa
          ? "ავტორიზაციის შეცდომა. გთხოვთ სცადოთ მოგვიანებით."
          : "Error logging in. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (userData) => {
    const result = await loginWithGoogle(userData);
    if (result.success) {
      const user = result.user || {};
      const role = user.role || (user.isAdmin ? 'admin' : (user.isStaff ? 'staff' : 'customer'));
      const token = result.token || user.token;
      const sessionToken = result.session_token || user.sessionToken;

      if (role === 'admin' || user.isAdmin) {
        navigate("/admin");
        return;
      } else if (role === 'staff' || user.isStaff) {
        navigate("/staff");
        return;
      } else {
        navigate("/profile");
        return;
      }
    } else {
      setError(
        result.error ||
          (isKa ? "Google-ით ავტორიზაცია ვერ მოხერხდა" : "Google login failed")
      );
    }
  };

  const handleGoogleError = (err) => {
    setError(
      isKa
        ? "Google ავტორიზაციის შეცდომა"
        : "Google authorization failed"
    );
    console.error("Google login error:", err);
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
      py: 1.5,
      px: 1,
      fontSize: "0.95rem",
      fontWeight: 500,
      color: "#1e293b",
      width: "100%",
    },
    "& .MuiInputLabel-root": {
      color: "#64748b",
      fontWeight: 500,
      fontSize: "0.95rem",
      "&.Mui-focused": {
        color: "#87003a",
        fontWeight: 600,
      },
    },
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "calc(100vh - 180px)",
        py: { xs: 5, md: 8 },
        px: 2,
        position: "relative",
        background: "radial-gradient(1000px circle at 50% 15%, rgba(135, 0, 58, 0.04) 0%, rgba(248, 250, 252, 0.95) 70%, #f1f5f9 100%)",
      }}
    >
      {/* Decorative ambient background glows */}
      <Box
        sx={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: { xs: 300, md: 540 },
          height: { xs: 300, md: 540 },
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(135, 0, 58, 0.06) 0%, transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <Card
        sx={{
          maxWidth: 440,
          width: "100%",
          borderRadius: "24px",
          boxShadow: "0 20px 48px -12px rgba(15, 23, 42, 0.09), 0 0 0 1px rgba(226, 232, 240, 0.8)",
          backgroundColor: "#ffffff",
          position: "relative",
          zIndex: 1,
          overflow: "hidden",
        }}
      >
        {/* Top accent gradient line */}
        <Box
          sx={{
            height: 5,
            width: "100%",
            background: "linear-gradient(90deg, #87003a 0%, #d9005e 50%, #f43f5e 100%)",
          }}
        />

        <CardContent sx={{ p: { xs: 3, sm: 4.5 } }}>
          {/* Header & Logo */}
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
              <LockOutlinedIcon sx={{ fontSize: 28 }} />
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
              {isKa ? "მოგესალმებით!" : "Welcome back"}
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
                ? "შეიყვანეთ მონაცემები თქვენს ანგარიშში შესასვლელად"
                : "Sign in to access your adventure bookings & tickets"}
            </Typography>
          </Box>

          {/* Error Alert */}
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

          <form onSubmit={handleSubmit} noValidate>
            {/* Email Field */}
            <Box sx={{ mb: 2 }}>
              <Typography
                component="label"
                htmlFor="login-email"
                sx={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#334155",
                  mb: 0.75,
                }}
              >
                {isKa ? "ელ-ფოსტა" : "Email address"}
              </Typography>
              <TextField
                id="login-email"
                fullWidth
                name="email"
                type="email"
                placeholder={isKa ? "თქვენი ელ-ფოსტა..." : "name@example.com"}
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                sx={inputStyles}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon sx={{ color: "#94a3b8", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Password Field */}
            <Box sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 0.75,
                }}
              >
                <Typography
                  component="label"
                  htmlFor="login-password"
                  sx={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "#334155",
                  }}
                >
                  {isKa ? "პაროლი" : "Password"}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#87003a",
                    fontWeight: 600,
                    cursor: "pointer",
                    "&:hover": { textDecoration: "underline" },
                  }}
                  onClick={() => alert(isKa ? "პაროლის აღსადგენად დაუკავშირდით მხარდაჭერას: support@funfinder.ge" : "To reset your password, contact support: support@funfinder.ge")}
                >
                  {isKa ? "დაგავიწყდათ პაროლი?" : "Forgot password?"}
                </Typography>
              </Box>

              <TextField
                id="login-password"
                fullWidth
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder={isKa ? "შეიყვანეთ პაროლი..." : "Enter your password"}
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
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
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                        aria-label="toggle password visibility"
                        sx={{ color: "#94a3b8", mr: 0.5 }}
                      >
                        {showPassword ? (
                          <VisibilityOff sx={{ fontSize: 20 }} />
                        ) : (
                          <Visibility sx={{ fontSize: 20 }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Remember Me */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 3,
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    size="small"
                    sx={{
                      color: "#cbd5e1",
                      "&.Mui-checked": { color: "#87003a" },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: "#475569", fontSize: "0.86rem", fontWeight: 500 }}>
                    {isKa ? "დამიმახსოვრე" : "Remember me"}
                  </Typography>
                }
              />
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              endIcon={!loading && <ArrowForwardIcon sx={{ fontSize: 18 }} />}
              sx={{
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
                  <span>{isKa ? "შესვლა..." : "Signing in..."}</span>
                </Box>
              ) : (
                isKa ? "შესვლა" : "Sign in"
              )}
            </Button>
          </form>

          {/* Divider */}
          <Box sx={{ display: "flex", alignItems: "center", my: 3 }}>
            <Divider sx={{ flexGrow: 1, borderColor: "#e2e8f0" }} />
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
            <Divider sx={{ flexGrow: 1, borderColor: "#e2e8f0" }} />
          </Box>

          {/* Google Login */}
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />

          {/* Register Footer */}
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
              {isKa ? "არ გაქვთ ანგარიში? " : "Don't have an account? "}
              <Box
                component="span"
                onClick={() => navigate("/register")}
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
                {isKa ? "დარეგისტრირდით" : "Sign up"}
              </Box>
            </Typography>
          </Box>

          {/* Trust / Security Badge */}
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
              {isKa ? "დაცული და დაშიფრული კავშირი" : "Secure 256-bit SSL encrypted connection"}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
