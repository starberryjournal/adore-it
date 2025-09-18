import React, { createContext, useContext, useState, ReactNode } from "react";

type ToastType = "success" | "error" | "info";

interface ToastData {
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: ToastData | null;
  setToast: (toast: ToastData | null) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// 1. ToastProvider
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<ToastData | null>(null);

  return (
    <ToastContext.Provider value={{ toast, setToast }}>
      {children}
    </ToastContext.Provider>
  );
};

// 2. useToast hook (put it below the provider)
export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  const { toast, setToast } = context;

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3000); // auto-dismiss after 3s
  };

  return { toast, showToast }; // <-- return both!
};
