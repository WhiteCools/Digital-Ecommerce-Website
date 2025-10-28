import { useState, useCallback } from 'react';

let toastId = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3000, extraData = {}) => {
    const id = toastId++;
    const newToast = { id, message, type, duration, ...extraData };
    
    setToasts((prev) => [...prev, newToast]);
    
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message, duration, extraData) => {
    return addToast(message, 'success', duration, extraData);
  }, [addToast]);

  const error = useCallback((message, duration, extraData) => {
    return addToast(message, 'error', duration, extraData);
  }, [addToast]);

  const info = useCallback((message, duration, extraData) => {
    return addToast(message, 'info', duration, extraData);
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
  };
};