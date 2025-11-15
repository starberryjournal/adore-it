import React, { useState } from "react";
import "./DragFileUploader.css";

const DragFileUploader = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        const fileType = file.type;

        if (fileType === "image/gif") {
          const img = document.createElement("img");
          img.src = reader.result as string;

          img.onload = () => {
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");

            canvas.width = img.width;
            canvas.height = img.height;

            if (context) {
              context.drawImage(img, 0, 0);
              const pngUrl = canvas.toDataURL("image/png");
              setImagePreview(pngUrl);
            } else {
              alert("Canvas context not supported in your browser.");
            }
          };
        } else {
          setImagePreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      const event = {
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(event); // Reuse existing logic
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <div
      className={`drop-zone ${dragOver ? "drag-over" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <img
        src="https://www.svgrepo.com/show/474161/cloud-upload.svg"
        alt="Upload"
        className="upload-icon"
      />
      <p>Drop file here</p>
      <span>OR</span>
      <label className="upload-btn">
        Upload File
        <input type="file" onChange={handleFileChange} hidden />
      </label>
      <p className="file-types">Only PNG, JPG and PDF files are supported</p>
      {selectedFile && (
        <p className="selected-file">Selected: {selectedFile.name}</p>
      )}
      {imagePreview && (
        <img
          src={imagePreview}
          alt="Preview"
          className="preview-image"
          style={{ marginTop: "10px", maxWidth: "100%" }}
        />
      )}
    </div>
  );
};

export default DragFileUploader;
