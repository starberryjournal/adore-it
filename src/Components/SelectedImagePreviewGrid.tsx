import React from "react";
import "./SelectedImagePreviewGrid.css"; // your custom CSS

interface ImagePreview {
  imageUrl: string;
}

interface Props {
  images: ImagePreview[];
}

const SelectedImagePreviewGrid: React.FC<Props> = ({ images }) => {
  const previewImages = images.slice(0, 4);
  const extraCount = images.length - 4;

  return (
    <div className="image-grid-preview">
      {previewImages.map((img, index) => (
        <div key={index} className="image-grid-item">
          <img src={img.imageUrl} alt={`selected-${index}`} />
          {index === 3 && extraCount > 0 && (
            <div className="overlay">+{extraCount}</div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SelectedImagePreviewGrid;
