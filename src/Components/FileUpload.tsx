import React from "react";

interface FileUploadProps {
  onSelect: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onSelect }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelect(file);
    }
  };

  return <input type="file" accept="image/*" onChange={handleChange} />;
};

export default FileUpload;
