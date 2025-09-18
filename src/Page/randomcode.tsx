import { useState, useEffect } from "react";
import { account, databases } from "../appwrite"; // adjust the import as necessary
import { Query } from "appwrite";
import { useNavigate } from "react-router-dom";

interface FollowUserButtonProps {
  followId: string;
  userId: string; // Changed from postUserId to userId
}

const FollowUserButton: React.FC<FollowUserButtonProps> = ({
  followId = "default-follow-id",
  userId = "default-user-id",
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followUserId, setFollowUserId] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await account.get();
        setCurrentUser(user.$id);
      } catch (error) {
        console.error("Error fetching current user", error);
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchFollowedUsers = async () => {
      try {
        const user = await account.get();
        const response = await databases.listDocuments(
          "67bcb64c0027e7eaa736",
          "67bcb6c50015bf805517",
          [Query.equal("userId", user.$id)]
        );
        setFollowUserId(response.documents.map((doc) => doc.followId));
      } catch (error) {
        console.error("Error fetching followed users", error);
        setError("Failed to fetch followed users");
      }
    };

    fetchFollowedUsers();
  }, []);

  const handleFollow = async (followId: string) => {
    setLoading(true);
    try {
      const user = await account.get();

      if (!user || !user.$id) {
        throw new Error("Failed to get current user.");
      }

      const isFollowing = followUserId.includes(followId);

      if (isFollowing) {
        const followResponse = await databases.listDocuments(
          "67bcb64c0027e7eaa736",
          "67c72558000195308e84",
          [Query.equal("userId", user.$id), Query.equal("followId", followId)]
        );

        const followUser = followResponse.documents[0]?.$id;
        if (followUser) {
          await databases.deleteDocument(
            "67bcb64c0027e7eaa736",
            "67c72558000195308e84",
            followUser
          );
          setFollowUserId(followUserId.filter((id) => id !== followId));
        }
      } else {
        await databases.createDocument(
          "67bcb64c0027e7eaa736",
          "67c72558000195308e84",
          "unique()",
          {
            userId: user.$id,
            followId: followId,
          }
        );
        setFollowUserId([...followUserId, followId]);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error following/unfollowing collection", error);
      setError(
        "Error following/unfollowing collection. Please try again later."
      );
      setLoading(false);
    }
  };

  const goToProfile = () => {
    navigate(`/Profile/${currentUser}`);
  };

  if (currentUser === userId) {
    return null; // Do not render anything if currentUser is viewing their own post
  }

  return (
    <div className="follow-button">
      <button
        onClick={() => handleFollow(followId)}
        className="Button-Followed"
        disabled={loading}
      >
        {followUserId.includes(followId) ? "Unfollow" : "Follow"}
      </button>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default FollowUserButton;
