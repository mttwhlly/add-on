// src/components/ToastNotification.tsx - Simple version
import { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  visible: boolean;
  onHide: () => void;
}

export function ToastNotification({ 
  message, 
  type = 'info', 
  duration = 3000, 
  visible, 
  onHide 
}: ToastProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onHide();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onHide]);

  const getToastColor = () => {
    switch (type) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getToastIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  if (!visible) return null;

  return (
    <View className={`absolute top-12 left-4 right-4 ${getToastColor()} rounded-lg p-4 shadow-lg z-50 flex-row items-center justify-between`}>
      <View className="flex-row items-center flex-1">
        <Text className="text-white text-lg mr-3">{getToastIcon()}</Text>
        <Text className="text-white font-medium flex-1">{message}</Text>
      </View>
      <TouchableOpacity onPress={onHide} className="ml-3">
        <Text className="text-white font-bold text-lg">×</Text>
      </TouchableOpacity>
    </View>
  );
}

// src/hooks/use-toast.tsx - Simple version
import { useState, useCallback } from 'react';

interface ToastState {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'info',
  });

  const showToast = useCallback((
    message: string, 
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    duration: number = 3000
  ) => {
    setToast({
      visible: true,
      message,
      type,
      duration,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message: string, duration?: number) => {
    showToast(message, 'error', duration);
  }, [showToast]);

  return {
    toast,
    showToast,
    hideToast,
    showSuccess,
    showError,
  };
};