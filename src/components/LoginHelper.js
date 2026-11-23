import React from 'react';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';

const getLanguage = () => {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem('ff_language') || 'en';
  }
  return 'en';
};

const LoginHelper = () => {
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    const googleToken = credentialResponse.credential;
    try {
      let email = '';
      let name = '';
      let firstname = '';
      let lastname = '';
      let image = '';

      if (googleToken && googleToken.split('.').length === 3) {
        try {
          const base64Url = googleToken.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const payload = JSON.parse(jsonPayload);
          email = payload.email || '';
          name = payload.name || '';
          firstname = payload.given_name || payload.name?.split(' ')[0] || '';
          lastname = payload.family_name || payload.name?.split(' ').slice(1).join(' ') || '';
          image = payload.picture || '';
        } catch (e) {
          console.warn('Could not decode google token locally:', e);
        }
      }

      const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const envUrl = typeof process !== 'undefined' ? process.env?.REACT_APP_API_BASE_URL : undefined;
      const rawBase = envUrl && (isLocal || !envUrl.includes('localhost')) ? envUrl : (isLocal ? 'http://localhost:5000' : 'https://funfinder-front.vercel.app');
      const apiBase = rawBase.replace(/\/+(en|ka|ru|hi|ar|he|tr|hy|kk|uk|zh)?\/?$/, '');
      const res = await axios.post(`${apiBase}/${getLanguage()}/api/v3/auth/google/login`, 
        { 
          token: googleToken,
          email,
          name,
          firstname,
          lastname,
          image
        }, 
        {
          withCredentials: true, 
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      console.log('Login Success:', res.data);
      alert(`Welcome back, ${res.data.firstname || 'User'}!`);
      // Navigate to profile or home after successful registration
      navigate('/profile');
      
    } catch (error) {
      console.error('Login Failed:', error.response ? error.response.data : error.message);
      alert('Login failed. Please try again.');
    }
  };

  const handleGoogleError = (error) => {
    console.error('Google Login Error:', error);
    if (error?.error === 'popup_closed_by_user') {
      // User closed the popup, don't show error
      return;
    }
    alert('Google registration failed. Please make sure your domain is authorized in Google Cloud Console.');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3>Login with Google</h3>
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        useOneTap={false}
        shape="rectangular"
        theme="outline"
        size="large"
        text="signup_with"
      />
    </div>
  );
};

export default LoginHelper;

