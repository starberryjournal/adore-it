import { useState } from "react";

type ImageResult = {
  id: string;
  similarity: number;
};

const FindSimilarImages = () => {
  const [results, setResults] = useState<ImageResult[]>([]);

  const fetchSimilarImages = async () => {
    const embedding = [0.1, 0.2, 0.3]; // Replace with real data later
    try {
      const response = await fetch("http://127.0.0.1:5000/api/similar-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embedding }),
      });
      const data: { similar_images: ImageResult[] } = await response.json(); // Define response type
      setResults(data.similar_images);
    } catch (error) {
      console.error("Error fetching similar images:", error);
    }
  };

  return (
    <div>
      <button onClick={fetchSimilarImages}>Find Similar Images</button>
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

export default FindSimilarImages;
