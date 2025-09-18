import React, { createContext, useContext, useState, ReactNode } from "react";

// Step 1: Define types
type ToastType = "success" | "error" | "info";

interface ToastData {
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: ToastData | null;
  setToast: (toast: ToastData | null) => void;
}

// Step 2: Create the context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Step 3: ToastProvider
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<ToastData | null>(null);

  return (
    <ToastContext.Provider value={{ toast, setToast }}>
      {children}
    </ToastContext.Provider>
  );
};

// Step 4: useToast hook
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  const { setToast } = context;

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  return { showToast };
};
