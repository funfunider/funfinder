import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('GEL'); // 'GEL' or 'USD'
  const [exchangeRate] = useState(2.7); // Hardcoded fallback rate
  const [loading] = useState(false);
  const [error] = useState(null);

  const toggleCurrency = () => {
    setCurrency(prev => prev === 'GEL' ? 'USD' : 'GEL');
  };

  const convertPrice = (priceInGEL) => {
    if (!priceInGEL || isNaN(priceInGEL)) return priceInGEL;
    
    if (currency === 'USD') {
      // Convert from GEL to USD (divide by rate)
      return (parseFloat(priceInGEL) / exchangeRate).toFixed(2);
    }
    // Return as GEL
    return parseFloat(priceInGEL).toFixed(2);
  };

  const getCurrencySymbol = () => {
    return currency === 'USD' ? '$' : '₾';
  };

  const formatPrice = (priceInGEL) => {
    const convertedPrice = convertPrice(priceInGEL);
    return `${getCurrencySymbol()}${convertedPrice}`;
  };

  const value = {
    currency,
    toggleCurrency,
    convertPrice,
    getCurrencySymbol,
    formatPrice,
    exchangeRate,
    loading,
    error
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

