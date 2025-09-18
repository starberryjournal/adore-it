import React, { useEffect, useState } from "react";
import { account, databases, Query } from "../appwrite"; // Import your Appwrite instance
import CollectLayoutCollect from "./CollectLayoutCollect";
import SelectedImagePreviewGrid from "./SelectedImagePreviewGrid";

interface AddToCollectionProps {
  images: {
    imageId: string;
    imageFileId: string;
    imageUrl: string;
    postedBy: string;
  }[];
  userId: string;
  userCollections: any[];
  onImageAdded: () => void;
  onClose: () => void;
}

interface Picture {
  $id: string;
  collectionId: string;
  imageFileId: string;
  fileName: string;
}

const AddToCollection: React.FC<AddToCollectionProps> = ({
  images,
  userId,
  userCollections,
  onImageAdded,
  onClose,
}) => {
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const addImageCollect = import.meta.env.VITE_USER_ADD_IMAGE_COLLECTION;
  const postCollectionId = import.meta.env.VITE_COLLECT_OTHERIMG;
  const creatPost = import.meta.env.VITE_USER_POST_COLLECTION_ID;
  const userCollect = import.meta.env.VITE_USER_COLLECTION;

  const [recentImages, setRecentImages] = useState<any[]>([]);
  const [, setUserId] = useState<string>(""); // State for userId
  const [collections, setCollections] = useState<any[]>(userCollections || []);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isOpen, setIsOpen] = useState(true);

  const [newCollectionName, setNewCollectionName] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const closeLightbox = () => {
    setIsOpen(false);
    onClose(); // ✅ Also close from parent
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const user = await account.get();
        setUserId(user.$id);

        // Fetch collections
        const LatestCollectionsResponse = await databases.listDocuments(
          databaseId, // Replace with your database ID
          userCollect, // Replace with your liked images collection ID
          [Query.orderDesc("$createdAt"), Query.equal("userId", user.$id)]
        );
        setCollections(LatestCollectionsResponse.documents);

        // Fetch recent images for each collection
        const imagesPromises = LatestCollectionsResponse.documents.map(
          (collection) => fetchRecentImages(collection.$id)
        );

        // Combine all recent images into one array
        const imagesResults = await Promise.all(imagesPromises);
        const combinedImages = imagesResults.flat(); // Flatten the array of arrays
        setRecentImages(combinedImages);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Error fetching data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    const fetchRecentImages = async (collectionId: string) => {
      setLoading(true);
      try {
        // Fetch both createPost and userAddImgtoCollect
        const [originals, saved] = await Promise.all([
          databases.listDocuments(databaseId, creatPost, [
            Query.equal("collectionId", collectionId),
          ]),
          databases.listDocuments(databaseId, postCollectionId, [
            Query.equal("collectionId", collectionId),
          ]),
        ]);

        const combined = [...originals.documents, ...saved.documents];

        // De-duplicate by imageFileId
        const uniqueMap = combined.reduce((acc, doc) => {
          if (doc.imageFileId) acc[doc.imageFileId] = doc;
          return acc;
        }, {} as Record<string, any>);

        const recent = Object.values(uniqueMap)
          .sort(
            (a, b) =>
              new Date(b.collectionCreatedAt || b.$createdAt).getTime() -
              new Date(a.collectionCreatedAt || a.$createdAt).getTime()
          )
          .slice(0, 3);

        return recent.map((doc) => ({
          $id: doc.$id,
          collectionId: doc.collectionId,
          imageFileId: doc.imageFileId,
          fileName: doc.fileName ?? "",
        })) as Picture[];
      } catch (error) {
        console.error("Error fetching recent images:", error);
        return [];
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchOriginalPost = async (imageId: string) => {
    try {
      const userPost = import.meta.env.VITE_USER_POST_COLLECTION_ID;
      const response = await databases.getDocument(
        databaseId,
        userPost,
        imageId
      );
      return response;
    } catch (error) {
      console.error("Error fetching original post:", error);
      return null;
    }
  };

  const handleAddToCollection = async () => {
    if (!selectedCollection && !newCollectionName.trim()) {
      setError("Please select a collection or enter a new collection name.");
      return;
    }

    setLoading(true);
    setError(null);

    let collectionId = selectedCollection;

    // Validate new collection name before creating it
    if (newCollectionName.trim() && !selectedCollection) {
      if (newCollectionName.trim().length === 0) {
        setError("Collection name cannot be empty.");
        setLoading(false);
        return;
      }

      try {
        const existingCollections = await databases.listDocuments(
          databaseId,
          userCollect
        );

        const duplicate = existingCollections.documents.find(
          (doc) =>
            doc.collectionName.toLowerCase() === newCollectionName.toLowerCase()
        );

        if (duplicate) {
          collectionId = duplicate.$id;
          setSelectedCollection(duplicate.$id);
        } else {
          // Create new collection
          const user = await account.get();
          const userName = user.name || "";
          const displayName = user.prefs?.displayName || "";

          const newCollectionResponse = await databases.createDocument(
            databaseId,
            userCollect,
            "unique()",
            {
              collectionName: newCollectionName,
              userId,
              userName,
              displayName,
              createdAt: new Date().toISOString(),
            }
          );

          // Update collectionId field
          await databases.updateDocument(
            databaseId,
            userCollect,
            newCollectionResponse.$id,
            {
              collectionId: newCollectionResponse.$id,
            }
          );

          collectionId = newCollectionResponse.$id;
          setSelectedCollection(collectionId);
        }
      } catch (error) {
        setError("Failed to create or get collection.");
        setLoading(false);
        return;
      }
    }

    if (!collectionId) {
      setError("No collection selected or created.");
      setLoading(false);
      return;
    }

    try {
      // Add images to collection
      for (const img of images) {
        const { imageId, imageFileId } = img;

        // Check if image already in collection
        const existingImage = await databases.listDocuments(
          databaseId,
          addImageCollect,
          [
            Query.equal("imageFileId", imageFileId),
            Query.equal("collectionId", collectionId),
          ]
        );

        if (existingImage.documents.length > 0) {
          console.warn(`Image ${imageId} already exists in collection.`);
          continue; // skip duplicates
        }

        // Fetch original post details
        const originalPostData = await fetchOriginalPost(imageId);
        if (!originalPostData) {
          console.warn(`Could not fetch original post for image ${imageId}`);
          continue;
        }

        // Add image to collection
        await databases.createDocument(
          databaseId,
          addImageCollect,
          "unique()",
          {
            collectionId,
            imageId: originalPostData.imageId,
            imageFileId: originalPostData.imageFileId,
            userId: originalPostData.userId,
            postedBy: originalPostData.postedBy,
            tags: originalPostData.tags,
            links: originalPostData.links,
            postId: originalPostData.postId,
            userName: originalPostData.userName,
            displayName: originalPostData.displayName,
            followId: originalPostData.followId,
            fileName: originalPostData.fileName,
            description: originalPostData.description,
            createdAt: new Date().toISOString(),
          }
        );
      }

      setLoading(false);
      onImageAdded();
      onClose();
    } catch (error) {
      console.error("Error adding images to collection:", error);
      setError("Failed to add images. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      <div className="inside-modal">
        <div className="top-text-coll">
          <div className="left-t">
            <h3>Add Image to Collections</h3>
          </div>
          <div className="exit-sec" onClick={closeLightbox}>
            <img
              src="/src/assets/SVG/dismiss-svgrepo-com.svg"
              alt="svg image"
            />
          </div>
        </div>

        <div className="modal-content">
          <div className="left-s">
            {/* Show thumbnails of all selected images */}
            <div className="selected-images-preview">
              {images.length > 0 && (
                <div className="mb-4 flex justify-center">
                  <SelectedImagePreviewGrid
                    images={images.map((img) => ({
                      imageUrl: img.imageUrl,
                    }))}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="right-s">
            <div className="search-bar-collect">
              <input
                type="text"
                placeholder="Search collections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="svg-search-coll">
                <img
                  src="/src/assets/SVG/search-svgrepo-com.svg"
                  alt="svg image"
                />
              </div>
            </div>

            <ul className="list-collect">
              {collections.length === 0 && loading && (
                <span className="loader"></span>
              )}
              <div className="collection-area">
                {collections
                  .filter((collection) =>
                    collection.collectionName
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
                  )
                  .map((collection) => {
                    const collectionRecentImages = recentImages.filter(
                      (image) => image.collectionId === collection.$id
                    );

                    return (
                      <div key={collection.$id} className="collections-mini">
                        <div
                          onClick={() => setSelectedCollection(collection.$id)}
                          className={
                            selectedCollection === collection.$id
                              ? "selected-collect"
                              : ""
                          }
                        >
                          <CollectLayoutCollect
                            collection={collection}
                            recentImages={collectionRecentImages}
                          />
                        </div>
                      </div>
                    );
                  })}

                {/* If no exact match found, show create option */}
                {searchTerm &&
                  !collections.some(
                    (c) =>
                      c.collectionName.toLowerCase() ===
                      searchTerm.toLowerCase()
                  ) && (
                    <div className="no-results">
                      <p className="not-found-message">
                        ❗ Collection "{searchTerm}" not found.
                      </p>
                      <button
                        onClick={() => {
                          setNewCollectionName(searchTerm);
                          setSelectedCollection("");
                          handleAddToCollection();
                        }}
                        className="create-collection-button"
                      >
                        ➕ Create "{searchTerm}"
                      </button>
                    </div>
                  )}
              </div>
            </ul>
            {/* Confirmation Button */}
            <button
              onClick={handleAddToCollection}
              disabled={!selectedCollection}
              className={`saved-collect-button ${
                selectedCollection ? "active" : ""
              }`}
            >
              Add to Collection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddToCollection;
