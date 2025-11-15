import React, { useEffect, useState } from "react";
import { account, databases, Query } from "../appwrite"; // Import your Appwrite instance
import CollectLayoutCollect from "./CollectLayoutCollect";

interface AddToCollectionProps {
  imageId: string; // ID of the image being added
  userId: string; // ID of the user adding the image
  imageFileId: string; // File ID of the image being added
  postedBy: string; // The original owner of the post
  userCollections: any[]; // User's collections
  imageUrl: string;
  onImageAdded: () => void;
  onClose: () => void;
}
interface Picture {
  $id: string;
  collectionId: string;
  imageFileId: string;
  fileName: string;
}

const AddCollection: React.FC<AddToCollectionProps> = ({
  imageId,
  userId,
  imageFileId,
  userCollections,
  imageUrl,
  onImageAdded,
  onClose,
}) => {
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const addImageCollect = import.meta.env.VITE_USER_ADD_IMAGE_COLLECTION;
  const CollectionUser = import.meta.env.VITE_USER_COLLECTION;
  const userPost = import.meta.env.VITE_USER_POST_COLLECTION_ID;

  const [recentImages, setRecentImages] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [, setUserId] = useState<string>(""); // State for userId
  const [showAlert, setShowAlert] = useState(false);
  const [collectionsWithImages, setCollectionsWithImages] =
    useState(userCollections); // Store collections with images

  const [, setError] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState<string>("");
  const userCollect = import.meta.env.VITE_USER_COLLECTION;
  const [searchTerm, setSearchTerm] = useState(""); // Track the search input

  const dbId = import.meta.env.VITE_DATABASE_ID;
  const postCollectionId = import.meta.env.VITE_COLLECT_OTHERIMG;
  const creatPost = import.meta.env.VITE_USER_POST_COLLECTION_ID;
  const collectionListId = import.meta.env.VITE_USER_COLLECTION;
  const followsCollectionId = import.meta.env.VITE_USERFOLLOWCOLLECT;

  const [userName, setUserName] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>(""); // Added state for displayName
  const [loading, setLoading] = useState<boolean>(true);

  const [isOpen, setIsOpen] = useState(true);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    console.log("User Collections:", userCollections);
  }, [userCollections]);

  const closeLightbox = () => {
    setIsOpen(false);
    onClose(); // ✅ Also close from parent
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await account.get();
        setUserId(user.$id);
        setUserName(user.name); // Fetch and set the user's name
        setDisplayName(user.prefs.displayName); // Fetch and set the user's display name

        // Fetch existing collections
        const collectionsResponse = await databases.listDocuments(
          databaseId, // Replace with your database ID
          userCollect, // Replace with your user collections collection ID
          [Query.equal("userId", user.$id)]
        );
        setCollections(collectionsResponse.documents);
      } catch (error) {
        console.log("User not logged in or error fetching collections");
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const user = await account.get();
        setUserId(user.$id);

        // Fetch collections
        const LatestCollectionsResponse = await databases.listDocuments(
          databaseId, // Replace with your database ID
          collectionListId, // Replace with your liked images collection ID
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
          databases.listDocuments(dbId, creatPost, [
            Query.equal("collectionId", collectionId),
          ]),
          databases.listDocuments(dbId, postCollectionId, [
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

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value.trim();
    setSearchTerm(searchTerm);

    try {
      const existingCollections = await databases.listDocuments(
        databaseId,
        userCollect
      );

      const foundCollection = existingCollections.documents.find(
        (doc) => doc.collectionName.toLowerCase() === searchTerm.toLowerCase()
      );

      if (foundCollection) {
        setSelectedCollection(foundCollection.$id);
        setNewCollectionName("");
        setShowDialog(false); // Close the dialog if a collection exists
      } else {
        setSelectedCollection("");
        setNewCollectionName(searchTerm);
        alert(
          `No collection found with the name "${searchTerm}". Do you want to create one?`
        );
      }
    } catch (error) {
      console.error("Error searching for collections:", error);
    }
  };
  const fetchOriginalPost = async (imageFileId: string) => {
    try {
      const response = await databases.getDocument(
        databaseId,
        userPost,
        imageId
      );
      return response; // Retrieve original post details
    } catch (error) {
      console.error("Error fetching original post:", error);
      return null;
    }
  };

  const createNewCollection = async (collectionName: string) => {
    // Check if collectionName is valid
    if (
      !collectionName ||
      typeof collectionName !== "string" ||
      collectionName.trim() === ""
    ) {
      console.error("Invalid collection name");
      alert("Please provide a valid collection name.");
      return;
    }

    if (!userId || !userName || !displayName) {
      console.error("Missing user info to create collection");
      return;
    }

    try {
      // Check if the collection already exists
      const existingCollections = await databases.listDocuments(
        databaseId,
        userCollect
      );

      const duplicate = existingCollections.documents.find(
        (doc) =>
          doc.collectionName &&
          doc.collectionName.toLowerCase() === collectionName.toLowerCase()
      );

      if (duplicate) {
        console.warn("Collection already exists:", duplicate.$id);
        setSelectedCollection(duplicate.$id); // Select the existing collection
      } else {
        // Create a new collection
        const newCollectionResponse = await databases.createDocument(
          databaseId,
          userCollect,
          "unique()",
          {
            collectionName,
            userId,
            userName,
            displayName,
            createdAt: new Date().toISOString(),
          }
        );

        // Update the document to set collectionId
        await databases.updateDocument(
          databaseId,
          userCollect,
          newCollectionResponse.$id,
          { collectionId: newCollectionResponse.$id }
        );

        setSelectedCollection(newCollectionResponse.$id); // Sync the selected collection state
        console.log("✅ New collection created:", newCollectionResponse);
      }
    } catch (error) {
      console.error("❌ Error creating collection:", error);
      alert("Failed to create collection. Please try again.");
    }
  };

  const handleAddToCollection = async () => {
    // Step 1: Validate input
    if (!selectedCollection && !newCollectionName.trim()) {
      setShowAlert(true);
      console.warn(
        "No collection selected and no new collection name provided."
      );
      return;
    }

    let collectionId = selectedCollection;

    // Step 2: Create new collection if needed
    if (newCollectionName.trim() && !selectedCollection) {
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
          console.warn("Collection already exists:", duplicate.$id);
          collectionId = duplicate.$id;
          setSelectedCollection(duplicate.$id); // Sync state
        } else {
          if (!userId || !userName || !displayName) {
            console.error("Missing user info to create collection");
            return;
          }

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

          // Update the document to set collectionId
          await databases.updateDocument(
            databaseId,
            userCollect,
            newCollectionResponse.$id,
            { collectionId: newCollectionResponse.$id }
          );

          collectionId = newCollectionResponse.$id;
          setSelectedCollection(collectionId); // Sync state
        }
      } catch (error) {
        console.error("Error creating or checking collection:", error);
        alert("Failed to create or retrieve collection.");
        return;
      }
    }

    // Step 3: Validate required data again
    if (!collectionId || !imageId || !imageFileId || !userId) {
      console.error("❌ Missing essential data:", {
        collectionId,
        imageId,
        imageFileId,
        userId,
      });
      return;
    }

    // Step 4: Check if the image already exists in the collection
    try {
      const existingImage = await databases.listDocuments(
        databaseId,
        addImageCollect,
        [
          Query.equal("imageFileId", imageFileId),
          Query.equal("collectionId", collectionId),
        ]
      );

      if (existingImage.documents.length > 0) {
        console.warn("⚠️ Image already exists in this collection.");
        return;
      }

      // Step 5: Fetch original post info
      const originalPostData = await fetchOriginalPost(imageId);
      if (!originalPostData) {
        console.error("Failed to retrieve original post data.");
        return;
      }

      // Step 6: Add image to collection
      await databases.createDocument(databaseId, addImageCollect, "unique()", {
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
      });

      setIsOpen(false);
      onImageAdded();

      console.log("✅ Image successfully added to collection:", {
        collectionId,
        imageId,
      });
    } catch (error) {
      console.error("❌ Error adding image to collection:", error);
      alert("Failed to add image. Please try again.");
    }
  };

  return (
    isOpen && (
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
              <div className="side-image">
                <img src={imageUrl} alt="Image" />
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
                            onClick={() =>
                              setSelectedCollection(collection.$id)
                            }
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
                            // Create a new collection with the search term
                            createNewCollection(searchTerm);
                            setSelectedCollection(""); // Clear selected collection in case the user is making a new one
                          }}
                          className="create-collection-button"
                        >
                          Create "{searchTerm}"
                        </button>
                      </div>
                    )}
                </div>
              </ul>
              {/* Confirmation Button */}
              <button
                onClick={handleAddToCollection}
                disabled={loading || !selectedCollection}
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
    )
  );
};

export default AddCollection;
