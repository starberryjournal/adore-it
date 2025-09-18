import { useState } from "react";

type ImageResult = {
  id: string;
  similarity: number;
};

const UploadAndFindImages = () => {
  const [results, setResults] = useState<ImageResult[]>([]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]; // Use optional chaining in case 'files' is null
    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      // Now you can send the formData to your backend
      try {
        const response = await fetch(
          "http://127.0.0.1:5000/api/upload-and-analyze",
          {
            method: "POST",
            body: formData,
          }
        );
        const data: { similar_images: ImageResult[] } = await response.json(); // Define response type
        console.log(data); // Handle the response

        setResults(data.similar_images);
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    } else {
      console.error("No file selected!");
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileUpload} />
      <ul>
        {results.map((image, index) => (
          <li key={index}>
            ID: {image.id}, Similarity: {image.similarity.toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
};
export default UploadAndFindImages;
