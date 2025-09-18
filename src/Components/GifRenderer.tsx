import React, { useRef, useState, useEffect } from "react";

interface GifRendererProps {
  gifUrl: string;
}

const GifRenderer: React.FC<GifRendererProps> = ({ gifUrl }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isPlaying) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const img = new Image();
      img.src = gifUrl;

      img.onload = () => {
        if (canvas && ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0); // Draw the first frame
        }
      };
    }
  }, [isPlaying, gifUrl]);

  return (
    <div onClick={() => setIsPlaying(!isPlaying)} style={{ cursor: "pointer" }}>
      {isPlaying ? (
        <img src={gifUrl} alt="Playing GIF" />
      ) : (
        <canvas ref={canvasRef} />
      )}
    </div>
  );
};

export default GifRenderer;
