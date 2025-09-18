import React, { useState, useCallback, useEffect } from "react";
import Cropper, { Area } from "react-easy-crop";

import Slider from "@mui/material/Slider";
import Button from "@mui/material/Button";

import getCroppedImg from "./cropUtils";

interface ImageCropperProps {
  file: File;
  onComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
  aspect: number;
  croppingType: "profile" | "background";
}

const ImageCropper: React.FC<ImageCropperProps> = ({
  file,
  onComplete,
  onCancel,
  aspect,
  croppingType,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");

  // Load image from file on first render
  useEffect(() => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
      setZoom(1); // Reset zoom when new image loads
      setCrop({ x: 0, y: 0 }); // Reset crop
    };
    reader.readAsDataURL(file);
  }, [file]);

  const onCropComplete = useCallback((_: any, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  useEffect(() => {
    console.log("Cropping Type:", croppingType);
    console.log("Aspect Ratio:", aspect);
  }, [croppingType, aspect]);

  const handleDone = async () => {
    if (!croppedAreaPixels) return;
    const croppedBlob = await getCroppedImg(imageUrl, croppedAreaPixels);
    onComplete(croppedBlob);
  };

  return (
    <div style={{ padding: "1rem" }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: croppingType === "background" ? 300 : 400,
          background: "#333",
        }}
      >
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <Slider
        value={zoom}
        min={1}
        max={3}
        step={0.1}
        onChange={(_, value) => setZoom(value as number)}
        sx={{ mt: 3 }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "10px",
          marginTop: "1rem",
        }}
      >
        <Button variant="outlined" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleDone}>
          Apply
        </Button>
      </div>
    </div>
  );
};

export default ImageCropper;
