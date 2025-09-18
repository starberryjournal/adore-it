import { useState, useEffect } from "react";
import { account, databases } from "../appwrite";
import { Query } from "appwrite";

interface FollowUserButtonProps {
  followId: string; // the user being followed (target)
  userId: string; // the current logged-in user's ID
  currentUser: {
    $id: string;
    name: string;
    userName: string;
    displayName: string;
    prefs: {
      bioId: string;
      displayName: string;
      profilePictureId?: string;
      backgroundImageId?: string;
    };
  } | null;
}

const FollowUserButton: React.FC<FollowUserButtonProps> = ({
  followId,
  userId,
  currentUser,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followUserIds, setFollowUserIds] = useState<string[]>([]);
  const [userName, setUserName] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>(""); // Added state for displayName
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const userFollowuser = import.meta.env.VITE_USERFOLLOWUSER;
  const usersCollectionId = import.meta.env.VITE_USER_PREF_COLLECTION_ID;

  useEffect(() => {
    const fetchFollowedUsers = async () => {
      const currentUser = await account.get();
      setCurrentUserId(currentUser.$id);
      setUserName(currentUser.name); // Fetch and set the user's name
      setDisplayName(currentUser.prefs.displayName); // Fetch and set the user's display name
      if (!currentUser) return;
      try {
        const response = await databases.listDocuments(
          databaseId,
          userFollowuser,
          [Query.equal("userId", currentUser.$id)]
        );
        setFollowUserIds(response.documents.map((doc) => doc.followId));
      } catch (error) {
        setError("Failed to fetch followed users");
      }
    };

    fetchFollowedUsers();
  }, [currentUser]);

  const checkFollowStatus = async (
    userId: string,
    followId: string
  ): Promise<boolean> => {
    if (!userId || !followId) return false;

    try {
      const followResponse = await databases.listDocuments(
        databaseId,
        userFollowuser,
        [Query.equal("userId", userId), Query.equal("followId", followId)]
      );
      return followResponse.documents.length > 0;
    } catch {
      return false;
    }
  };

  const handleFollow = async (followId: string) => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const isFollowing = await checkFollowStatus(currentUser.$id, followId);

      if (isFollowing) {
        const response = await databases.listDocuments(
          databaseId,
          userFollowuser,
          [
            Query.equal("userId", currentUser.$id),
            Query.equal("followId", followId),
          ]
        );

        const docId = response.documents[0]?.$id;
        if (docId) {
          await databases.deleteDocument(databaseId, userFollowuser, docId);
          setFollowUserIds((prev) => prev.filter((id) => id !== followId));
        }
      } else {
        const response = await databases.listDocuments(
          databaseId,
          usersCollectionId,
          [Query.equal("userId", followId)]
        );
        const followUserDoc = response.documents[0];

        const followedUserName = followUserDoc.userName ?? "Unknown";
        const followedDisplayName = followUserDoc.displayName ?? "Anonymous";

        await databases.createDocument(databaseId, userFollowuser, "unique()", {
          userId: currentUser.$id,
          currentUserId: currentUser.$id,
          userName: followedUserName,
          displayName: followedDisplayName,
          followId,
          createdAt: new Date().toISOString(),
        });
        setFollowUserIds((prev) => [...prev, followId]);
      }
    } catch {
      setError("Error following/unfollowing user.");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || currentUser.$id === followId) return null;

  return (
    <div className="follow-button">
      <button
        onClick={() => handleFollow(followId)}
        className={
          followUserIds.includes(followId) ? "Unfollow-user" : "Follow-user"
        }
        disabled={loading}
      >
        {followUserIds.includes(followId) ? "Unfollow" : "Follow"}
      </button>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default FollowUserButton;
