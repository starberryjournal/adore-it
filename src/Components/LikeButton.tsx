import React, { useEffect, useState } from "react";
import { databases, Query } from "../appwrite";
import HeartIcon from "../assets/HeartIcon.svg";
import HeartOutlineIcon from "../assets/HeartOutlineIcon.svg";
import { User } from "../Components/types";
import SavedImageAlert from "../Components/SavedImageAlert"; // adjust path if needed

interface LikeButtonProps {
  likedOwnerId: string;
  userName: string;
  displayName: string;
  userId: string;
  imageFileId: string;
  description: string;
  tags: string;
  postedBy: string;
  imageId: string;
  postId: string;
  currentUser: User | null;
  likeCount: number | string | null;
  onLikeUpdate: (newLikeCount: number) => void;
}

const LikeButton: React.FC<LikeButtonProps> = ({
  userName,
  displayName,
  imageFileId,
  description,
  tags,
  postedBy,
  postId,
  imageId,
  userId,
  currentUser,
  likeCount,
  onLikeUpdate,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const likeCollectionId = import.meta.env.VITE_USERL_IKE;
  const postCollectionId = import.meta.env.VITE_USER_POST_COLLECTION_ID;
  const notificationsCollectionId = import.meta.env.VITE_NOTIFICATIONS;

  const currentLikeCount = parseInt(likeCount?.toString() || "0");

  // ✅ Check if current user already liked this image
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!currentUser) return;

      try {
        const res = await databases.listDocuments(
          databaseId,
          likeCollectionId,
          [
            Query.equal("imageId", imageId),
            Query.equal("postId", postId),
            Query.equal("likedOwnerId", currentUser.$id),
          ]
        );
        setIsLiked(res.total > 0);
      } catch (error) {
        console.error("Error checking like status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkLikeStatus();
  }, [currentUser, imageId, postId]);

  const handleLike = async () => {
    if (!currentUser || isProcessing) return;

    setIsProcessing(true);
    let newCount = currentLikeCount;

    try {
      if (!isLiked) {
        setIsLiked(true);
        newCount += 1;
        setAnimate(true); // 🔥 Trigger animation
        setShowAlert(true); // ✅ Show alert

        await Promise.all([
          databases.updateDocument(databaseId, postCollectionId, imageId, {
            likeCount: newCount.toString(),
          }),
          databases.createDocument(databaseId, likeCollectionId, "unique()", {
            imageId,
            likedOwnerId: currentUser.$id,
            imageFileId,
            userId,
            userName,
            displayName,
            postId,
            likedBy: currentUser.name,
            postedBy,
            description,
            likeCount: newCount.toString(),
            tags,
            followId: currentUser.$id,
            createdAt: new Date().toISOString(),
          }),
        ]);

        await databases.createDocument(
          databaseId,
          notificationsCollectionId,
          "unique()",
          {
            recipientId: userId,
            actorId: currentUser.$id,
            postId: imageId,
            type: "like",
            message: `liked your post.`,
            read: false,
            createdAt: new Date().toISOString(),
            imageFileId,
            userName: currentUser.name,
          }
        );
      } else {
        setIsLiked(false);
        newCount = Math.max(0, newCount - 1);
        setAnimate(true); // 🔥 Also animate unliking

        const likeDoc = await databases.listDocuments(
          databaseId,
          likeCollectionId,
          [
            Query.equal("imageId", imageId),
            Query.equal("postId", postId),
            Query.equal("likedOwnerId", currentUser.$id),
          ]
        );

        await Promise.all([
          databases.updateDocument(databaseId, postCollectionId, imageId, {
            likeCount: newCount.toString(),
          }),
          likeDoc.total > 0 &&
            databases.deleteDocument(
              databaseId,
              likeCollectionId,
              likeDoc.documents[0].$id
            ),
        ]);
      }

      onLikeUpdate(newCount);
    } catch (error) {
      console.error("Like/unlike failed:", error);
      setIsLiked((prev) => !prev); // rollback
    } finally {
      setTimeout(() => setAnimate(false), 400); // 🧼 Reset animation
      setIsProcessing(false);
    }
  };

  return (
    <div className="like-and-count">
      {showAlert && (
        <SavedImageAlert
          message="You liked this post!"
          onClose={() => setShowAlert(false)}
        />
      )}

      <button
        onClick={handleLike}
        className="liked-button"
        aria-label={isLiked ? "Unlike image" : "Like image"}
      >
        <img
          src={isLiked ? HeartIcon : HeartOutlineIcon}
          alt={isLiked ? "Liked" : "Not liked"}
          className={animate ? "like-bounce" : ""}
          style={{
            opacity: isProcessing ? 0.5 : 1,
            pointerEvents: isProcessing ? "none" : "auto",
          }}
        />
      </button>
      <p className="number-count">{currentLikeCount} Hearts</p>
    </div>
  );
};

export default LikeButton;
