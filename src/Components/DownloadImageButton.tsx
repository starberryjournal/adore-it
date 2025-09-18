import React from "react";
import { storage } from "../appwrite"; // Adjust to your setup

interface DownloadButtonProps {
  bucketId: string;
  fileId: string;
  fileName?: string;
  children?: React.ReactNode;
  className?: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({
  bucketId,
  fileId,
  fileName,
  children = "Download",
  className = "",
}) => {
  const handleDownload = async () => {
    try {
      const downloadUrl = await storage.getFileDownload(bucketId, fileId); // ✅ it's a string

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", fileName || "image");
      link.setAttribute("target", "_blank");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <button onClick={handleDownload} className={className}>
      {children}
    </button>
  );
};

export default DownloadButton;
