import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { databases, storage, Query } from "../appwrite";

const EditCollection: React.FC = () => {
  const { collectionId } = useParams<{ collectionId: string }>();
  const [collectionName, setCollectionName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [collectionImages, setCollectionImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [characterCount, setCharacterCount] = useState<number>(0);
  const navigate = useNavigate();
  const maxLength = 500;

  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const userPostId = import.meta.env.VITE_USER_POST_COLLECTION_ID;
  const postCollectionId = import.meta.env.VITE_COLLECT_OTHERIMG;

  // Fetch collection details
  useEffect(() => {
    const fetchCollection = async () => {
      try {
        if (!collectionId) {
          setError("Missing collection ID.");
          return;
        }

        const response = await databases.getDocument(
          "67bcb64c0027e7eaa736", // Your DB ID
          "67be4fe30038e2f0c316", // Your Collection collection
          collectionId
        );

        setCollectionName(response.collectionName || "");
        setDescription(response.description || "");
        setSelectedImageId(response.backgroundImageId || null);
      } catch (error: any) {
        console.error("Error fetching collection:", error.message || error);
        setError("Failed to load collection data.");
      }
    };

    const fetchCollectionImages = async () => {
      try {
        if (!collectionId) return;

        // Rename here to avoid redeclaration issues
        const [originalsRes, savedRes] = await Promise.all([
          databases.listDocuments(databaseId, userPostId, [
            Query.equal("collectionId", collectionId),
          ]),
          databases.listDocuments(databaseId, postCollectionId, [
            Query.equal("collectionId", collectionId),
          ]),
        ]);

        const originals = originalsRes.documents;
        const saved = savedRes.documents;

        // Map original images by $id
        const originalMap = originals.reduce((acc, doc) => {
          acc[doc.$id] = doc;
          return acc;
        }, {} as Record<string, any>);

        // Merge both sets, attaching original imageFileId if needed
        const combined = [
          ...originals,
          ...saved.map((doc) => {
            const original = originalMap[doc.originalImageId];
            return {
              ...doc,
              imageFileId: original?.imageFileId || doc.imageFileId, // use fallback if missing
            };
          }),
        ];

        // Deduplicate by imageFileId
        const uniqueMap: Record<string, any> = {};
        for (const doc of combined) {
          if (doc.imageFileId) uniqueMap[doc.imageFileId] = doc;
        }

        const uniqueImages = Object.values(uniqueMap);
        setCollectionImages(uniqueImages);
      } catch (err) {
        console.error("Error fetching images from collection", err);
      }
    };

    if (collectionId) {
      fetchCollection();
      fetchCollectionImages();
    }
  }, [collectionId]);

  useEffect(() => {
    setCharacterCount(description.length);
  }, [description]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!collectionId) {
      console.error("Missing collectionId — can't update");
      setError("Internal error: no collection ID");
      setLoading(false);
      return;
    }

    try {
      console.log("Trying to update with:", {
        collectionName,
        description,
        backgroundImageId: selectedImageId || undefined,
      });

      await databases.updateDocument(
        "67bcb64c0027e7eaa736",
        "67be4fe30038e2f0c316",
        collectionId,
        {
          collectionName,
          description,
          backgroundImageId: selectedImageId || undefined,
        }
      );

      console.log("Update successful!");
      setLoading(false);
      navigate(`/CollectionImages/${collectionId}`);
    } catch (error: any) {
      console.error("Error updating collection:", error.message || error);
      setError("Failed to update collection.");
      setLoading(false);
    }
  };

  return (
    <div className="container3">
      <h2>Edit Collection</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit} className="forum-collection">
        <div className="left-side-edit">
          <label className="labelName">
            <p className="main-title">Choose Background Image:</p>
            <div className="image-grid1">
              {collectionImages.length === 0 && (
                <p>No images in this collection yet.</p>
              )}
              <div className="image-grid3">
                {collectionImages.length === 0 && (
                  <p>No images in this collection yet.</p>
                )}
                {collectionImages.map((img) => {
                  const viewUrl = storage.getFileView(
                    "67be51020004776eea1a",
                    img.imageFileId
                  );
                  const isSelected = selectedImageId === img.imageFileId;

                  return (
                    <div
                      key={img.$id}
                      className={`image-wrapper ${
                        isSelected ? "selected" : ""
                      }`}
                      onClick={() => setSelectedImageId(img.imageFileId)}
                    >
                      <img
                        src={viewUrl}
                        alt="Preview"
                        className="selectable-image"
                      />
                      {isSelected && <div className="badge">Selected</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </label>
          {selectedImageId && (
            <button
              type="button"
              className="remove-button"
              onClick={() => setSelectedImageId(null)}
            >
              Remove Background Image
            </button>
          )}
        </div>
        <div className="right-side-edit">
          <label className="labelName">
            <p className="main-title">Collection Name:</p>
            <input
              type="text"
              className="Name"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
            />
          </label>

          <label className="labelName">
            <p className="main-title">Description:</p>
            <textarea
              value={description}
              placeholder="About the collection"
              className="description"
              maxLength={maxLength}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
            <div className="count">
              {characterCount}/{maxLength}
            </div>
            {characterCount >= maxLength && (
              <div style={{ color: "red" }}>
                You have reached the character limit!
              </div>
            )}
          </label>
          <button className="saved-button" type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditCollection;
