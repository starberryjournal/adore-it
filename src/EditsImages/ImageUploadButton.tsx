import React from "react";
import AddAPhotoIcon from "../assets/camera-add-svgrepo-com.svg";

interface Props {
  onFileSelect: (file: File) => void;
  children?: React.ReactNode; // <== to support overlay
  id?: string;
}

const ImageUploadButton: React.FC<Props> = ({
  onFileSelect,
  id = "file-input",
  children,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <input
        id={id}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleChange}
      />
      <label htmlFor={id} style={{ cursor: "pointer" }}>
        {children ?? (
          <div className="hover-background">
            <img
              src={AddAPhotoIcon}
              alt="Upload"
              style={{ width: 20, height: 20, filter: "invert(1)" }}
            />
          </div>
        )}
      </label>
    </div>
  );
};

export default ImageUploadButton;
