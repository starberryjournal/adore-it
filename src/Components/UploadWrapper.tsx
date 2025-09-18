import { useState } from "react";
import DragFileUploader from "./DragFileUploader";
import CreatePost from "../Page/CreatePost";

const UploadWrapper = () => {
  const [isImageUploaded, setIsImageUploaded] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);

  return (
    <div>
      {!isImageUploaded ? (
        <DragFileUploader
          setIsImageUploaded={setIsImageUploaded}
          setImageData={setImageData}
        />
      ) : (
        <CreatePost imageData={imageData!} />
      )}
    </div>
  );
};

export default UploadWrapper;
