import { useState, useEffect } from "react";
import { account, databases } from "../appwrite"; // adjust the import as necessary
import { Query } from "appwrite";

interface FollowCollectButtonProps {
  collectionId: string;
  userId: string; // Ensure this represents the collection's owner
}

const FollowCollectButton: React.FC<FollowCollectButtonProps> = ({
  collectionId,
  userId,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followedCollections, setFollowedCollections] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showFollowButton, setShowFollowButton] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>(""); // Added state for displayName

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = await account.get();
        setCurrentUserId(currentUser.$id);
        setUserName(currentUser.name); // Fetch and set the user's name
        setDisplayName(currentUser.prefs.displayName); // Fetch and set the user's display name

        const response = await databases.listDocuments(
          "67bcb64c0027e7eaa736",
          "67c077a3000cc0e2f3cc",
          [Query.equal("userId", currentUser.$id)]
        );

        setFollowedCollections(
          response.documents.map((doc) => doc.collectionId)
        );

        // Ensure users can't follow their own collections
        setShowFollowButton(currentUser.$id !== userId);
      } catch (error) {
        setError("Failed to fetch user data.");
      }
    };

    fetchUserData();
  }, [userId]);

  const handleFollowToggle = async () => {
    if (!currentUserId) return;

    setLoading(true);
    try {
      const isFollowing = followedCollections.includes(collectionId);

      if (isFollowing) {
        const followRecord = await databases.listDocuments(
          "67bcb64c0027e7eaa736",
          "67c077a3000cc0e2f3cc",
          [
            Query.equal("userId", currentUserId),
            Query.equal("collectionId", collectionId),
          ]
        );

        if (followRecord.documents.length > 0) {
          await databases.deleteDocument(
            "67bcb64c0027e7eaa736",
            "67c077a3000cc0e2f3cc",
            followRecord.documents[0].$id
          );

          setFollowedCollections(
            followedCollections.filter((id) => id !== collectionId)
          );
        }
      } else {
        await databases.createDocument(
          "67bcb64c0027e7eaa736",
          "67c077a3000cc0e2f3cc",
          "unique()",
          {
            userId: currentUserId,
            userName: userName,
            displayName: displayName,
            collectionId,
          }
        );

        setFollowedCollections([...followedCollections, collectionId]);
      }
    } catch (error) {
      setError("Error following/unfollowing collection. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="follow-button">
      {showFollowButton && (
        <button
          onClick={handleFollowToggle}
          className={
            followedCollections.includes(collectionId)
              ? "Button-Followed"
              : "Button-Unfollowed"
          }
          disabled={loading}
        >
          {followedCollections.includes(collectionId)
            ? "Unfollow Collection"
            : "Follow Collection"}
        </button>
      )}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default FollowCollectButton;
