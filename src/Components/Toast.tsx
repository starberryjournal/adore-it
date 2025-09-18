import React, { useEffect, useState } from "react";
import "./Toast.css";

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number; // Optional prop to customize duration (in ms)
}

const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 3000 }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
    }, duration - 300); // start fade 300ms before dismissal

    const removeTimer = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
    };
  }, [onClose, duration]);

  const handleManualClose = () => {
    setFadeOut(true);
    setTimeout(onClose, 300); // allow fade animation before removal
  };
  return (
    <div className="toast-backdrop" onClick={handleManualClose}>
      <div
        className={`toast-box ${fadeOut ? "fade-out" : "fade-in"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <p>{message}</p>
        <button className="toast-close" onClick={handleManualClose}>
          ×
        </button>
      </div>
    </div>
  );
};

export default Toast;
