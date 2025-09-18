import React, { useEffect, useState } from "react";

interface AlertProps {
  message: string;
  onClose: () => void;
}

const SavedImageAlert: React.FC<AlertProps> = ({ message, onClose }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade-out before removing
    const fadeTimeout = setTimeout(() => setFadeOut(true), 2000); // fade after 2 sec
    const removeTimeout = setTimeout(onClose, 2800); // remove after animation

    return () => {
      clearTimeout(fadeTimeout);
      clearTimeout(removeTimeout);
    };
  }, [onClose]);

  return (
    <div className={`alert-overlay ${fadeOut ? "fade-out" : ""}`}>
      <div className="alert-box">
        <p>{message}</p>
        <button onClick={onClose}>OK</button>
      </div>
    </div>
  );
};

export default SavedImageAlert;
