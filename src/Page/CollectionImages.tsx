import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { account, databases, Query } from "../appwrite";
import FollowCollectButton from "../Components/FollowCollectButton";
import CollectTabs from "../Components/CollectTabs";
import CollectTabsContent from "../Components/CollectTabsContent";

const CollectionImages: React.FC = () => {
  const { collectionId } = useParams<{ collectionId: string }>();
  const [currentUserId, setCurrentUserId] = useState("");
  const [collectionUserId, setCollectionUserId] = useState("");
  const [images, setImages] = useState<any[]>([]);
  const [background, setBackground] = useState<any[]>([]);
  const [, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("CollectionImages");
  const [error, setError] = useState<string | null>(null);
  const [userId] = useState("");
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeletedMessage, setShowDeletedMessage] = useState(false);

  const [deleting, setDeleting] = useState(false);

  // Selection Mode State
  const [selectMode, setSelectMode] = useState(false);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);

  const toggleSelectImage = (imageId: string) => {
    setSelectedImageIds((prev) =>
      prev.includes(imageId)
        ? prev.filter((id) => id !== imageId)
        : [...prev, imageId]
    );
  };

  const handleTabClick = (tabName: string) => setActiveTab(tabName);

  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const userPostId = import.meta.env.VITE_USER_POST_COLLECTION_ID;
  const userPrefs = import.meta.env.VITE_USER_PREF_COLLECTION_ID;
  const userCollect = import.meta.env.VITE_USER_COLLECTION;
  const collectIMG = import.meta.env.VITE_COLLECT_OTHERIMG;
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [collectionId, userId]);

  const fetchData = async () => {
    if (!collectionId) {
      setError("Collection ID is undefined");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [imagesResponse, collectIMGResponse, backgroundResponse] =
        await Promise.all([
          databases.listDocuments(databaseId, userPostId, [
            Query.equal("collectionId", collectionId),
          ]),
          databases.listDocuments(databaseId, collectIMG, [
            Query.equal("collectionId", collectionId),
          ]),
          databases.listDocuments(databaseId, userCollect, [
            Query.equal("collectionId", collectionId),
          ]),
        ]);

      setImages([...imagesResponse.documents, ...collectIMGResponse.documents]);
      setBackground(backgroundResponse.documents);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Error fetching data. Please try again later.");
      setLoading(false);
    } finally {
      setLoading(false); // always end with false
    }
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await account.get();
        setCurrentUserId(user.$id);
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };

    const fetchCollection = async () => {
      try {
        const response = await databases.getDocument(
          databaseId,
          userCollect,
          collectionId || ""
        );
        setCollectionUserId(response.userId);
        setDescription(response.description || "");
      } catch (error) {
        console.error("Error fetching collection:", error);
      }
    };

    fetchCurrentUser();
    if (collectionId) fetchCollection();
  }, [collectionId]);

  const fetchProfilePicture = async () => {
    if (!collectionUserId) return;
    try {
      const response = await databases.listDocuments(databaseId, userPrefs, [
        Query.equal("userId", collectionUserId),
      ]);
      if (response.documents.length > 0) {
        const profileData = response.documents[0];
        const profileImageUrl = `http://localhost:3000/profilePicture/${profileData.profilePictureId}`;
        setUserProfile(profileImageUrl);
      }
    } catch (error) {
      console.error("Error fetching profile picture:", error);
    }
  };

  useEffect(() => {
    if (collectionUserId) fetchProfilePicture();
  }, [collectionUserId]);

  const handleDeleteSelected = async () => {
    setDeleting(true);
    try {
      await Promise.all(
        selectedImageIds.map((imageId) =>
          databases.deleteDocument(databaseId, collectIMG, imageId)
        )
      );

      setImages((prev) =>
        prev.filter((img) => !selectedImageIds.includes(img.$id))
      );

      setSelectedImageIds([]);
      setSelectMode(false);
      setShowConfirmModal(false);
      setShowDeletedMessage(true);
      setTimeout(() => setShowDeletedMessage(false), 3000); // hide after 3s
      await fetchData();
    } catch (error) {
      console.error("Error deleting images:", error);
      alert("Failed to delete images.");
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteConfirm = () => {
    setSelectMode(false); // This hides the select mode UI
    setShowConfirmModal(true); // This shows the confirmation modal
  };

  console.log("Deleted IDs:", selectedImageIds);
  console.log(
    "Before filtering:",
    images.map((i) => i.$id)
  );

  if (loading) return <p>loading</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="container3">
      <div className="top-content">
        <div className="header-one">
          {background.map((image) => (
            <div
              key={image.$id}
              className={`div ${
                !image.backgroundImageId ? "grey-background" : ""
              }`}
            >
              {image.backgroundImageId && (
                <img
                  src={`https://cloud.appwrite.io/v1/storage/buckets/67be51020004776eea1a/files/${image.backgroundImageId}/view?project=67bc93bc0004228cf938`}
                  alt={image.fileName}
                />
              )}
            </div>
          ))}
          <div className="gradients"></div>
        </div>

        <div className="collect-infos">
          <div className="collection-names">
            {background[0]?.collectionName || "Unknown Collection"}
          </div>
          <div className="profile-name">
            {background.map((image) => (
              <div key={image.$id}>
                <p>by @{image.userName}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs and Buttons */}
      <div className="tubms">
        <div className="numbers">
          <CollectTabs
            activeTab={activeTab}
            handleTabClick={handleTabClick}
            collectionId={collectionId as string}
          />
        </div>

        <div className="user-profile-picture">
          {userProfile ? (
            <img
              src={userProfile}
              alt="Profile Picture"
              onError={(e) => (e.currentTarget.src = "/default-profile.jpg")}
            />
          ) : (
            <p>No profile picture available</p>
          )}
        </div>

        <div className="button-collection-outit">
          {currentUserId === collectionUserId ? (
            <>
              <button
                onClick={() => navigate(`/EditCollections/${collectionId}`)}
                className="edit-button"
              >
                Edit Collection
              </button>
              <button
                onClick={() => setSelectMode(!selectMode)}
                className="orgenaze-button"
              >
                <img
                  src="/src/assets/SVG/image-edit-svgrepo-com.svg"
                  alt="svg"
                />
                {selectMode ? "Cancel" : "Organize"}
              </button>
            </>
          ) : (
            <FollowCollectButton
              collectionId={collectionId as string}
              userId={userId}
            />
          )}
        </div>
      </div>

      <div className="uderline-collection"></div>

      {showConfirmModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-deleted">
            <p id="modal-description">
              Are you sure you want to delete {selectedImageIds.length}{" "}
              image(s)?
            </p>
            <div className="modal-deleted-buttons">
              <button onClick={handleDeleteSelected} className="confirm-btn">
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
              <button
                onClick={() => setShowConfirmModal(false)} // Close modal
                className="cancel-btn"
                aria-label="Cancel delete"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div className="overlay-loading">
          <div className="spinner" />
          <p>Deleting images...</p>
        </div>
      )}

      {/* Display the "Deleted" message */}
      {showDeletedMessage && (
        <div className="deleted-toast-box">
          <div className="deleted-toast-box-modal">
            <div className="deleted-toast">✅ Images deleted successfully!</div>
          </div>
        </div>
      )}

      {/* Display images in selection mode */}
      {selectMode ? (
        <div className="lightbox-overlay">
          <div className="lightbox-content">
            <h3>Select Images to Delete</h3>
            <div className="image-grid">
              {images.map((img) => (
                <div
                  key={img.$id}
                  className={`image-box ${
                    selectedImageIds.includes(img.$id) ? "selected" : ""
                  }`}
                  onClick={() => toggleSelectImage(img.$id)}
                >
                  <img
                    src={`https://cloud.appwrite.io/v1/storage/buckets/67be51020004776eea1a/files/${img.imageFileId}/view?project=67bc93bc0004228cf938`}
                    alt="preview"
                    className="preview-thumb"
                  />
                  {selectedImageIds.includes(img.$id) && (
                    <div className="checkmark-overlay">✓</div>
                  )}
                </div>
              ))}
            </div>

            <div className="lightbox-buttons">
              <button
                onClick={openDeleteConfirm}
                disabled={selectedImageIds.length === 0}
                className="delete-btn"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectMode(false)} // Cancel selection mode
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Default content if not in select mode
        <CollectTabsContent
          activeTab={activeTab}
          collectionId={collectionId as string}
          selectMode={selectMode}
          selectedImageIds={selectedImageIds}
          toggleSelectImage={toggleSelectImage}
        />
      )}
    </div>
  );
};

export default CollectionImages;
