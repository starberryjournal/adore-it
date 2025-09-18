import React, { useEffect, useState } from "react";
import { useToast } from "./ToastContext";
import "./Toast.css";

const ToastComponent: React.FC = () => {
  const { toast } = useToast();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (toast) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 3000); // auto-dismiss
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!toast || !visible) return null;

  return (
    <div className={`toast-backdrop ${toast.type}`}>
      <div className="toast-message">{toast.message}</div>
    </div>
  );
};

export default ToastComponent;
