import React, { useEffect, useState } from "react";
import { account, databases, Query } from "../appwrite";
import LikeButton from "./LikeButton";
import AddCollection from "./AddCollections";
import SavedImageAlert from "./SavedImageAlert";

interface AppImage {
  $id: string;
  imageFileId: string;
  fileName: string;
  userId: string;
  postId: string;
  createdAt: string;
  collectionId: string;
  userName: string;
  collectionName: string;
  tags: string;
  postedBy: string;
  likeCount: number;
  description: string;
}

interface LikendCollectProps {
  image: AppImage;
  imageId: string;
  userName: string;
  userId: string;
  displayName: string;
  likedBy?: string;
  likedOwnerId: string;
  likeCount: number;
  imageFileId: string;
  description: string;
  tags: string;
  postId: string;
  imageUrl: string;
}

interface Preferences {
  $id: string;
  userName: string;
  bioId: string;
  displayName: string;
  profilePictureId?: string;
  backgroundImageId?: string;
}

interface User {
  $id: string;
  name: string;
  userName: string;
  displayName: string;
  prefs: Preferences;
}

const LikAndCollect: React.FC<LikendCollectProps> = ({
  imageId,
  image,
  userId,
  likedOwnerId,
  userName,
  displayName,
  postId,
  imageUrl,
  likeCount: initialLikeCount,
  imageFileId,
  description,
  tags,
}) => {
  const [liked, setLiked] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [, setLoadingCollections] = useState(false);
  const [likeCount, setLikeCount] = useState<number>(initialLikeCount || 0);
  const [showAlert, setShowAlert] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [, setSelectedUserPrefs] =
    useState<Preferences | null>(null);
  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const likeCollectionId = import.meta.env.VITE_USERL_IKE;
  const userPrefs = import.meta.env.VITE_USER_PREF_COLLECTION_ID;
  const collectionFromUsers = import.meta.env.VITE_USER_COLLECTION;
  // ✅ Fetch current Appwrite user

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const user = await account.get();
        const userPrefsResponse = await databases.listDocuments(
          databaseId, // Your database ID
          userPrefs, // Your users collection ID
          [Query.equal("userId", user.$id)] // Ensure this matches your schema
        );

        if (userPrefsResponse.documents.length > 0) {
          const userPrefs = userPrefsResponse
            .documents[0] as unknown as Preferences;
          console.log("User preferences fetched:", userPrefs);
          setSelectedUserPrefs(userPrefs);
        } else {
          console.error("Preferences not found for the user.");
        }

        const prefs = user.prefs ?? {};
        const reshapedUser: User = {
          $id: user.$id,
          name: user.name,
          displayName: prefs.displayName ?? "",
          prefs: {
            userName: prefs.userName ?? "",
            displayName: prefs.displayName ?? "",
            bioId: prefs.bioId ?? "",
            profilePictureId: prefs.profilePictureId,
            backgroundImageId: prefs.backgroundImageId,
            $id: user.$id,
          },
          userName: user.name,
        };

        setCurrentUser(reshapedUser);
      } catch (err) {
        console.error("Failed to fetch user account", err);
      }
    };

    fetchAccount();
  }, []);

  // ✅ Check like status and fetch collections
  useEffect(() => {
    if (!currentUser || !imageId || !postId) return;

    const fetchData = async () => {
      setLoadingCollections(true);
      try {
        const likeRes = await databases.listDocuments(
          databaseId,
          likeCollectionId,
          [
            Query.equal("likedOwnerId", currentUser.$id),
            Query.equal("imageId", imageId),
            Query.equal("postId", postId),
          ]
        );
        const isLiked = likeRes.documents.length > 0;
        setLiked(isLiked);

        if (isLiked) {
          const collRes = await databases.listDocuments(
            databaseId,
            collectionFromUsers, // Your collection table ID
            [Query.equal("userId", currentUser.$id)]
          );
          setCollections(collRes.documents);
        }
      } catch (err) {
        console.error("Error loading like status/collections", err);
      } finally {
        setLoadingCollections(false);
      }
    };

    fetchData();
  }, [currentUser, imageId]);

  const handleLikeUpdate = (newLikeCount: number) => {
    setLiked((prev) => !prev);
    setLikeCount(newLikeCount);
  };

  const openLightbox = () => {
    setIsLightboxOpen(true);
  };

  if (!image || !image.$id || !likedOwnerId || !currentUser || !postId)
    return null;

  return (
    <div>
      {showAlert && (
        <SavedImageAlert
          message="Image added successfully!"
          onClose={() => setShowAlert(false)}
        />
      )}

      <div className="left-riht2">
        <div className="left">
          <LikeButton
            imageId={imageId}
            likeCount={likeCount}
            onLikeUpdate={handleLikeUpdate}
            likedOwnerId={currentUser.$id}
            postId={postId}
            imageFileId={imageFileId}
            postedBy={image.postedBy}
            userName={userName}
            displayName={displayName}
            currentUser={currentUser}
            userId={userId}
            description={description}
            tags={(tags || []) as string} // Pass actual tags from postId
          />
        </div>

        <div className="right">
          {liked && (
            <>
              <button className="open-add-2" onClick={openLightbox}>
                <img
                  src="/src/assets/SVG/save-copy-svgrepo-com.svg"
                  alt="save"
                />
                Add to collections
              </button>

              {isLightboxOpen && (
                <AddCollection
                  onImageAdded={() => {
                    setShowAlert(true);
                    setIsLightboxOpen(false); // ✅ Close after add
                  }}
                  imageId={imageId}
                  userId={currentUser.$id}
                  imageFileId={imageFileId}
                  postedBy={image.postedBy}
                  userCollections={collections}
                  onClose={() => setIsLightboxOpen(false)}
                  imageUrl={imageUrl}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LikAndCollect;
