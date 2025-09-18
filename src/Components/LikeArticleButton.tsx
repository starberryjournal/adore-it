import React, { useEffect, useState } from "react";
import { databases, Query } from "../appwrite";
import HeartIcon from "../assets/HeartIcon.svg";
import HeartOutlineIcon from "../assets/HeartOutlineIcon.svg";
import SavedImageAlert from "../Components/SavedImageAlert"; // adjust path if needed

interface LikeButtonProps {
  imageFileId: string;
  postedBy: string;
  postId: string;
  currentUser: any;
  likeCount: number;
  onLikeUpdate: (newCount: number) => void;
}

const LikeArticleButton: React.FC<LikeButtonProps> = ({
  imageFileId,
  postedBy,
  postId,
  currentUser,
  likeCount,
  onLikeUpdate,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentLikeCount, setCurrentLikeCount] = useState(likeCount);

  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const likeCollectionId = import.meta.env.VITE_USERLIKE_ARTICLE;
  const postCollectionId = import.meta.env.VITE_USER_POST_COLLECTION_ID;
  const notificationsCollectionId = import.meta.env.VITE_NOTIFICATIONS;

  const isOwner = currentUser?.$id === postedBy; // Check if current user is post owner

  // ✅ Check if current user already liked this image
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!currentUser) return;

      try {
        const res = await databases.listDocuments(
          databaseId,
          likeCollectionId,
          [
            Query.equal("postId", postId),
            Query.equal("userId", currentUser.$id),
          ]
        );
        setIsLiked(res.total > 0);
      } catch (error) {
        console.error("Error checking like status:", error);
        setError("Unable to fetch like status.");
      } finally {
        setIsLoading(false);
      }
    };

    checkLikeStatus();
  }, [currentUser, postId]);

  const handleLike = async () => {
    if (!currentUser || isProcessing || isOwner) return; // Prevent liking if the user is the post owner

    setIsProcessing(true);
    let updatedCount = currentLikeCount;

    try {
      if (!isLiked) {
        setIsLiked(true);
        updatedCount += 1;
        setAnimate(true); // 🔥 Trigger animation
        setShowAlert(true); // ✅ Show alert

        await Promise.all([
          // Create the like document
          databases.createDocument(databaseId, likeCollectionId, "unique()", {
            userId: currentUser.$id,
            postId,
            likedBy: currentUser.name,
            postedBy, // Ensure this is the author of the post
            followId: currentUser.$id,
            createdAt: new Date().toISOString(),
          }),

          // Create the notification
          databases.createDocument(
            databaseId,
            notificationsCollectionId,
            "unique()",
            {
              recipientId: postedBy, // This is the post author's user ID
              actorId: currentUser.$id,
              postId,
              type: "like",
              message: `liked your article.`,
              read: false,
              createdAt: new Date().toISOString(),
              imageFileId,
              userName: currentUser.name,
            }
          ),
        ]);
      } else {
        setIsLiked(false);
        updatedCount = Math.max(0, updatedCount - 1);
        setAnimate(true); // 🔥 Animate unliking

        const likeDoc = await databases.listDocuments(
          databaseId,
          likeCollectionId,
          [
            Query.equal("postId", postId),
            Query.equal("userId", currentUser.$id),
          ]
        );

        await Promise.all([
          likeDoc.total > 0 &&
            databases.deleteDocument(
              databaseId,
              likeCollectionId,
              likeDoc.documents[0].$id
            ),
        ]);
      }

      // Optionally update the like count in the post document
      await databases.updateDocument(
        databaseId,
        postCollectionId,
        postId, // Ensure this is the correct post ID
        { likeCount: updatedCount }
      );

      // Update the local state for the like count
      setCurrentLikeCount(updatedCount);
      onLikeUpdate(updatedCount); // Notify parent component
    } catch (error) {
      console.error("Like/unlike failed:", error);
      setIsLiked((prev) => !prev); // Rollback state if failed
      setError("Something went wrong while liking/unliking the post.");
    } finally {
      setTimeout(() => setAnimate(false), 400); // 🧼 Reset animation
      setIsProcessing(false);
    }
  };

  return (
    <div className="like-and-count">
      {error && <div className="error-message">{error}</div>}

      {showAlert && (
        <SavedImageAlert
          message="You liked this post!"
          onClose={() => setShowAlert(false)}
        />
      )}

      {isLoading ? (
        <div className="spinner">...</div> // Show a loading spinner while checking like status
      ) : (
        <button
          onClick={handleLike}
          disabled={isProcessing || isOwner}
          className="liked-button"
          aria-label={isLiked ? "Unlike image" : "Like image"}
          title={isOwner ? "You can't like your own post" : ""}
        >
          {isProcessing ? (
            <div className="spinner">...</div> // Replace with your own spinner component
          ) : (
            <img
              src={isLiked ? HeartIcon : HeartOutlineIcon}
              alt={isLiked ? "Liked" : "Not liked"}
              className={animate ? "like-bounce" : ""}
              style={{
                opacity: isProcessing ? 0.5 : 1,
                pointerEvents: isProcessing ? "none" : "auto",
              }}
            />
          )}
        </button>
      )}

      <p className="number-count">{currentLikeCount} Hearts</p>
    </div>
  );
};

export default LikeArticleButton;
