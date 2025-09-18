import React, { useEffect, useRef } from "react";

interface StaticGifProps {
  gifUrl: string;
  alt?: string;
  onClick?: () => void;
  className?: string;
  showGifLabel?: boolean; // ✅ new prop
}

const StaticGif: React.FC<StaticGifProps> = ({
  gifUrl,
  alt,
  onClick,
  className,
  showGifLabel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadImage = async () => {
      try {
        const res = await fetch(`http://localhost:3000/image/${gifUrl}`);
        if (!res.ok) throw new Error("Failed to fetch image");

        const blob = await res.blob();
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        img.crossOrigin = "anonymous";

        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;

          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(img.src);
        };
      } catch (err) {
        console.error("❌ Failed to load image:", err);
      }
    };

    loadImage();
  }, [gifUrl]);

  return (
    <div
      className="gif-container"
      style={{ position: "relative", display: "inline-block" }}
    >
      <canvas
        ref={canvasRef}
        className={className}
        onClick={onClick}
        aria-label={alt}
      />
      {showGifLabel && <span className="gif-badge">GIF</span>}
    </div>
  );
};

export default StaticGif;
