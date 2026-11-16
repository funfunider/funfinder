import React, { createContext, useContext, useState, useEffect } from 'react';
import authApiService from '../services/authApi';

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  login: () => {},
  register: () => {},
  loginWithGoogle: () => {},
  logout: () => {},
  updateUser: () => {},
  updateImage: () => {},
  loading: true
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  // Initialize user immediately from localStorage to prevent flash of unauthenticated state
  const [user, setUser] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('ff_user');
        return cached ? JSON.parse(cached) : null;
      }
    } catch {
      // ignore JSON parse error
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const isLoggedIn = 
      (typeof window !== 'undefined') && (
        localStorage.getItem('ff_logged_in') === 'true' ||
        Boolean(localStorage.getItem('ff_token')) ||
        Boolean(localStorage.getItem('customer_token')) ||
        Boolean(localStorage.getItem('token')) ||
        Boolean(localStorage.getItem('customer_session_token')) ||
        document.cookie.includes('customer_session_token')
      );
    
    if (!isLoggedIn) {
      console.log('Skipping auth check - user is guest.');
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      console.log('Checking authentication status...');
      const response = await authApiService.getProfile();
      console.log('Profile check response:', response);
      
      const userData = response?.user || response?.customer || (response?.id || response?.email ? response : null);
      if (userData) {
        const role = response?.role || userData.role || (userData.is_superuser || userData.roles?.includes('admin') ? 'admin' : (userData.is_staff || userData.roles?.includes('staff') ? 'staff' : 'customer'));
        const isAdmin = Boolean(response?.isAdmin ?? (role === 'admin' || userData.is_superuser || userData.roles?.includes('admin')));
        const isStaff = Boolean(response?.isStaff ?? (isAdmin || role === 'staff' || userData.is_staff || userData.roles?.includes('staff')));
        const userInfo = {
          ...userData,
          name: userData.name || `${userData.firstname || ''} ${userData.lastname || ''}`.trim() || userData.username || userData.email,
          role,
          roles: response?.roles || userData.roles || [role],
          permissions: response?.permissions || userData.permissions || [],
          isAdmin,
          isStaff,
          isCustomer: !isAdmin && !isStaff,
          redirectPath: response?.redirect_path || (isAdmin ? '/admin' : (isStaff ? '/staff' : '/profile')),
          loginMethod: userData.loginMethod || "email",
          lastLogin: new Date().toISOString()
        };
        setUser(userInfo);
        localStorage.setItem('ff_logged_in', 'true');
        localStorage.setItem('ff_user', JSON.stringify(userInfo));
        console.log('User authenticated successfully:', userInfo);
      } else {
        console.log('No user data found in profile response');
        setUser(null);
        localStorage.removeItem('ff_logged_in');
        localStorage.removeItem('ff_user');
      }
    } catch (error) {
      console.log('No valid session found:', error.message);
      if (
        error.message?.includes('401') || 
        error.message?.includes('Unauthorized') || 
        error.message?.includes('authentication required')
      ) {
        setUser(null);
        localStorage.removeItem('ff_logged_in');
        localStorage.removeItem('ff_user');
        authApiService.clearToken();
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      console.log('Login attempt with:', credentials);
      const response = await authApiService.login(credentials);
      console.log('Login response:', response);
      
      const userData = response?.user || response?.customer || (response?.id || response?.email ? response : null);
      if (userData) {
        const role = response?.role || userData.role || (userData.is_superuser || userData.roles?.includes('admin') ? 'admin' : (userData.is_staff || userData.roles?.includes('staff') ? 'staff' : 'customer'));
        const isAdmin = Boolean(response?.isAdmin ?? (role === 'admin' || userData.is_superuser || userData.roles?.includes('admin')));
        const isStaff = Boolean(response?.isStaff ?? (isAdmin || role === 'staff' || userData.is_staff || userData.roles?.includes('staff')));
        const token = response?.token || response?.access_token;
        const sessionToken = response?.customer_session_token || response?.admin_session_token || response?.session_token;

        const userInfo = {
          ...userData,
          name: userData.name || `${userData.firstname || ''} ${userData.lastname || ''}`.trim() || userData.username || userData.email,
          role,
          roles: response?.roles || userData.roles || [role],
          permissions: response?.permissions || userData.permissions || [],
          isAdmin,
          isStaff,
          isCustomer: !isAdmin && !isStaff,
          token,
          sessionToken,
          redirectPath: response?.redirect_path || (isAdmin ? '/admin' : (isStaff ? '/staff' : '/profile')),
          loginMethod: "email",
          lastLogin: new Date().toISOString()
        };
        
        setUser(userInfo);
        localStorage.setItem('ff_logged_in', 'true');
        localStorage.setItem('ff_user', JSON.stringify(userInfo));
        console.log('User authenticated successfully:', userInfo);
        return { success: true, user: userInfo, token, session_token: sessionToken, redirect_path: userInfo.redirectPath };
      }
      
      return { success: false, error: 'Login failed - no user data received' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      console.log('Registration attempt with:', userData);
      const response = await authApiService.register(userData);
      console.log('Registration successful:', response);
      
      const userObj = response?.user || response?.customer || (response?.id || response?.email ? response : null);
      if (userObj) {
        const token = response?.token || response?.access_token;
        const sessionToken = response?.customer_session_token || response?.session_token;
        const userInfo = {
          ...userObj,
          name: userObj.name || `${userObj.firstname || ''} ${userObj.lastname || ''}`.trim() || userObj.username || userObj.email,
          role: 'customer',
          roles: ['customer'],
          isAdmin: false,
          isStaff: false,
          isCustomer: true,
          token,
          sessionToken,
          redirectPath: '/profile',
          loginMethod: "email",
          lastLogin: new Date().toISOString()
        };
        setUser(userInfo);
        localStorage.setItem('ff_logged_in', 'true');
        localStorage.setItem('ff_user', JSON.stringify(userInfo));
        return { success: true, user: userInfo, token, session_token: sessionToken };
      }
      
      return { success: true, message: 'Registration successful' };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  const loginWithGoogle = async (googleUserData) => {
    try {
      const response = await authApiService.loginWithGoogle({
        name: googleUserData.name,
        email: googleUserData.email,
        googleId: googleUserData.googleId,
        image: googleUserData.image,
        verified: googleUserData.verified,
        credential: googleUserData.credential,
      });

      const userObj = response?.user || response?.customer || (response?.id || response?.email ? response : null);
      if (userObj) {
        const role = response?.role || userObj.role || (userObj.is_superuser || userObj.roles?.includes('admin') ? 'admin' : (userObj.is_staff || userObj.roles?.includes('staff') ? 'staff' : 'customer'));
        const isAdmin = Boolean(response?.isAdmin ?? (role === 'admin' || userObj.is_superuser || userObj.roles?.includes('admin')));
        const isStaff = Boolean(response?.isStaff ?? (isAdmin || role === 'staff' || userObj.is_staff || userObj.roles?.includes('staff')));
        const token = response?.token || response?.access_token;
        const sessionToken = response?.customer_session_token || response?.admin_session_token || response?.session_token;

        const userInfo = {
          ...userObj,
          name: userObj.name || `${userObj.firstname || ''} ${userObj.lastname || ''}`.trim() || userObj.username || userObj.email,
          role,
          roles: response?.roles || userObj.roles || [role],
          permissions: response?.permissions || userObj.permissions || [],
          isAdmin,
          isStaff,
          isCustomer: !isAdmin && !isStaff,
          token,
          sessionToken,
          redirectPath: response?.redirect_path || (isAdmin ? '/admin' : (isStaff ? '/staff' : '/profile')),
          loginMethod: "google",
          lastLogin: new Date().toISOString(),
        };
        setUser(userInfo);
        localStorage.setItem('ff_logged_in', 'true');
        localStorage.setItem('ff_user', JSON.stringify(userInfo));
        return { success: true, user: userInfo, token, session_token: sessionToken, redirect_path: userInfo.redirectPath };
      }

      return { success: false, error: 'Google login failed - no user data received' };
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, error: error.message || 'Google login failed' };
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out user...');
      await authApiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authApiService.clearToken();
      setUser(null);
      localStorage.removeItem('ff_logged_in');
      localStorage.removeItem('ff_user');
      console.log('User logged out successfully');
    }
  };

  const updateUser = async (userData) => {
    try {
      const payload = {
        firstname: userData.name ?? userData.firstname,
        lastname: userData.lastname,
        email: userData.email,
        mobile: userData.phone ?? userData.mobile,
        country: userData.country,
      };
      Object.keys(payload).forEach(
        (k) => payload[k] === undefined && delete payload[k]
      );

      const response = await authApiService.updateProfile(payload);
      const updated = response?.user || response?.customer || response || {};

      setUser((prev) => {
        const next = {
          ...prev,
          ...payload,
          name: userData.name ?? payload.firstname ?? prev?.name,
          phone: userData.phone ?? payload.mobile ?? prev?.phone,
          ...updated,
        };
        localStorage.setItem('ff_user', JSON.stringify(next));
        return next;
      });
      return { success: true, user: updated };
    } catch (error) {
      console.error('updateUser error:', error);
      return { success: false, error: error.message || 'Update failed' };
    }
  };

  const updateImage = async (imageUrl) => {
    try {
      const response = await authApiService.updateProfile({ image: imageUrl });
      const updated = response?.user || response?.customer || response || {};
      setUser((prev) => {
        const next = { ...prev, image: imageUrl, ...updated };
        localStorage.setItem('ff_user', JSON.stringify(next));
        return next;
      });
      return { success: true };
    } catch (error) {
      console.error('updateImage error:', error);
      setUser((prev) => {
        const next = { ...prev, image: imageUrl };
        localStorage.setItem('ff_user', JSON.stringify(next));
        return next;
      });
      return { success: false, error: error.message || 'Image update failed' };
    }
  };

  const isAdmin = Boolean(user?.isAdmin || user?.role === 'admin' || user?.roles?.includes('admin') || user?.is_superuser);
  const isStaff = Boolean(isAdmin || user?.isStaff || user?.role === 'staff' || user?.roles?.includes('staff') || user?.is_staff);
  const roles = user?.roles || (user ? [user.role || 'customer'] : []);
  const permissions = user?.permissions || [];

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user,
      isAdmin,
      isStaff,
      role: user?.role || (user ? (isAdmin ? 'admin' : (isStaff ? 'staff' : 'customer')) : 'guest'),
      roles,
      permissions,
      sessionId: user?.sessionToken || null,
      hasPermission: (perm) => permissions.includes(perm) || isAdmin,
      refreshSession: checkAuthStatus,
      login, 
      register,
      loginWithGoogle, 
      logout, 
      updateUser, 
      updateImage,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
