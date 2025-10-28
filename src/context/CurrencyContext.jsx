import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const CurrencyContext = createContext(null);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};

// Exchange rates (base: USD)
const EXCHANGE_RATES = {
  USD: 1,
  MYR: 4.72,
  EUR: 0.92,
  GBP: 0.79,
  SGD: 1.34,
  JPY: 149.50,
  AUD: 1.52,
  CAD: 1.36,
  CNY: 7.24,
  THB: 34.50,
};

// Country to currency mapping
const COUNTRY_CURRENCY_MAP = {
  MY: 'MYR',
  US: 'USD',
  GB: 'GBP',
  EU: 'EUR',
  SG: 'SGD',
  JP: 'JPY',
  AU: 'AUD',
  CA: 'CAD',
  CN: 'CNY',
  TH: 'THB',
  // Default for other countries
  DEFAULT: 'USD',
};

// Currency symbols
const CURRENCY_SYMBOLS = {
  USD: '$',
  MYR: 'RM',
  EUR: '€',
  GBP: '£',
  SGD: 'S$',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  CNY: '¥',
  THB: '฿',
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);
  const [countryCode, setCountryCode] = useState('US');

  // Detect user location and set currency
  useEffect(() => {
    detectUserCurrency();
  }, []);

  const detectUserCurrency = async () => {
    try {
      setLoading(true);
      
      // Try to get user location from IP
      const response = await axios.get('https://ipapi.co/json/');
      const data = response.data;
      
      console.log('🌍 User location detected:', {
        country: data.country_name,
        countryCode: data.country_code,
        ip: data.ip,
        city: data.city,
      });

      setCountryCode(data.country_code);
      
      // Get currency for country
      const detectedCurrency = COUNTRY_CURRENCY_MAP[data.country_code] || COUNTRY_CURRENCY_MAP.DEFAULT;
      
      // Check if user has saved preference
      const savedCurrency = localStorage.getItem('preferredCurrency');
      if (savedCurrency && EXCHANGE_RATES[savedCurrency]) {
        setCurrency(savedCurrency);
        console.log('✅ Using saved currency:', savedCurrency);
      } else {
        setCurrency(detectedCurrency);
        localStorage.setItem('preferredCurrency', detectedCurrency);
        console.log('✅ Auto-detected currency:', detectedCurrency);
      }
    } catch (error) {
      console.error('❌ Failed to detect location:', error);
      // Fallback to saved or default currency
      const savedCurrency = localStorage.getItem('preferredCurrency') || 'USD';
      setCurrency(savedCurrency);
    } finally {
      setLoading(false);
    }
  };

  // Convert price from USD to selected currency
  const convertPrice = (usdPrice) => {
    const rate = EXCHANGE_RATES[currency] || 1;
    return usdPrice * rate;
  };

  // Format price with currency symbol
  const formatPrice = (usdPrice, showSymbol = true) => {
    const converted = convertPrice(usdPrice);
    const symbol = CURRENCY_SYMBOLS[currency] || '$';
    
    // Format based on currency
    let formatted;
    if (currency === 'JPY' || currency === 'CNY') {
      // No decimals for Yen
      formatted = Math.round(converted).toLocaleString();
    } else {
      formatted = converted.toFixed(2);
    }
    
    return showSymbol ? `${symbol}${formatted}` : formatted;
  };

  // Change currency manually
  const changeCurrency = (newCurrency) => {
    if (EXCHANGE_RATES[newCurrency]) {
      setCurrency(newCurrency);
      localStorage.setItem('preferredCurrency', newCurrency);
      console.log('✅ Currency changed to:', newCurrency);
    }
  };

  // Get all available currencies
  const availableCurrencies = Object.keys(EXCHANGE_RATES).map(code => ({
    code,
    symbol: CURRENCY_SYMBOLS[code],
    rate: EXCHANGE_RATES[code],
  }));

  const value = {
    currency,
    countryCode,
    loading,
    convertPrice,
    formatPrice,
    changeCurrency,
    availableCurrencies,
    exchangeRates: EXCHANGE_RATES,
    currencySymbol: CURRENCY_SYMBOLS[currency],
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export default CurrencyContext;