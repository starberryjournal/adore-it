import React, { useEffect, useState } from "react";
import { account, databases, Query } from "../appwrite";
import AddCollection from "./AddCollections";
import SavedImageAlert from "./SavedImageAlert";
import { User } from "./types";
import LikeButtonSmall from "./LikeButtonSmall";

interface AppImage {
  $id: string;
  imageFileId: string;
  fileName: string;
  postId: string;
  createdAt: string;
  collectionId: string;
  userName: string;
  collectionName: string;
  userId: string;
  tags: string;
  postedBy: string;
  likeCount: number;
}

interface LikendCollectProps {
  image: AppImage;
  imageId: string;
  userName: string;
  userId: string;
  postId: string;
  displayName: string;
  likedOwnerId: string;
  description: string;
  tags: string;
  likedBy?: string;
  likeCount: number;
  imageFileId: string;
  imageUrl: string;
  createdAt: string;
  onActionClick?: (e: React.MouseEvent) => void;
}

const LikeCollectShare: React.FC<LikendCollectProps> = ({
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
  onActionClick,
}) => {
  const [liked, setLiked] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [, setLoadingCollections] = useState(false);
  const [likeCount, setLikeCount] = useState<number>(initialLikeCount || 0);
  const [showAlert, setShowAlert] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const likeCollectionId = import.meta.env.VITE_USERL_IKE;
  const collectionFromUsers = import.meta.env.VITE_USER_COLLECTION;

  // ✅ Fetch current Appwrite user
  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const user = await account.get();

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
            followId: prefs.followId,
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
    if (!currentUser || !imageId) return;

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
    setLiked((prev) => !prev); // or setLiked(true/false) depending on your logic
    setLikeCount(newLikeCount);
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

      <div className="left-riht">
        <div className="left">
          <LikeButtonSmall
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
      </div>
      <div className="BOTTOM">
        {liked && (
          <>
            <button
              className="open-add-3"
              onClick={(e) => {
                onActionClick?.(e);
                setIsLightboxOpen(true); // ✅ Always set this to open modal
              }}
            >
              <img
                src="/src/assets/SVG/save-copy-svgrepo-comcopy.svg"
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
  );
};

export default LikeCollectShare;
