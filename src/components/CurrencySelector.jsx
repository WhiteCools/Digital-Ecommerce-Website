import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

const CurrencySelector = () => {
  const { currency, changeCurrency, availableCurrencies, countryCode } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      {/* Currency Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1.5 px-2.5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors text-sm"
      >
        <Globe className="w-4 h-4" />
        <span className="font-semibold">{currency}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white">
                <div className="flex items-center space-x-2">
                  <Globe className="w-5 h-5" />
                  <div>
                    <p className="font-bold text-sm">Select Currency</p>
                    <p className="text-xs text-white/80">Auto-detected: {countryCode}</p>
                  </div>
                </div>
              </div>

              {/* Currency List */}
              <div className="max-h-96 overflow-y-auto">
                {availableCurrencies.map(({ code, symbol, rate }) => (
                  <button
                    key={code}
                    onClick={() => {
                      changeCurrency(code);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      currency === code ? 'bg-red-50 dark:bg-red-900/20' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{symbol}</span>
                      <div className="text-left">
                        <p className="font-bold text-sm text-gray-800 dark:text-gray-200">{code}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Rate: {rate.toFixed(2)}</p>
                      </div>
                    </div>
                    {currency === code && (
                      <Check className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                  </button>
                ))}
              </div>

              {/* Info */}
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  💡 Prices converted from USD. Actual payment in USD.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CurrencySelector;