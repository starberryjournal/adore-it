import React from "react";
import { storage } from "../appwrite";

interface BagUploadProps {
  onUpload: (fileId: string) => void;
}

const BagUpload: React.FC<BagUploadProps> = ({ onUpload }) => {
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const response = await storage.createFile(
          "67c08a9900141b07dd43",
          "unique()",
          file
        );
        console.log("File uploaded successfully:", response);
        onUpload(response.$id);
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }
  };

  return <input type="file" onChange={handleFileChange} />;
};

export default BagUpload;
