import React, { useEffect, useState } from "react";
import { databases, Query } from "../appwrite";
import { useNavigate } from "react-router-dom";
import { QueryTypes } from "appwrite";
import CollectLayoutUserFollow from "../Components/CollectLayoutUserFollow";
import FollowUserButton from "../Components/FollowUserButton";
import { useCurrentUser } from "../Components/useCurrentUser";

interface Post {
  $id: string;
  tags?: string;
  imageFileId?: string;
  followId?: string;
  userId: string;
  imageId: string;
  userName: string;
  description: string;
  likeCount: string;
}

interface userTabsContentProps {
  activeTab: string; // Currently active tab
  userName: string;
}

interface PostProps {
  userName: string; // Currently active tab
}

const UserTabsContent: React.FC<userTabsContentProps> = ({
  activeTab,
  userName,
}) => {
  return (
    <div className="tab-content">
      {activeTab === "latest" && <LatestLikedPictures userName={userName} />}
      {activeTab === "collections" && <Collections userName={userName} />}
      {activeTab === "post" && <UserPosts userName={userName} />}
      {activeTab === "following" && <UserFollowing userName={userName} />}
      {activeTab === "followers" && <UserFollowers userName={userName} />}
    </div>
  );
};

const LatestLikedPictures: React.FC<PostProps> = ({ userName }) => {
  const [LatestLikedPictures, setLatestLikedPictures] = useState<Post[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLatestLikedPictures = async () => {
      try {
        if (!userName) {
          console.error("userName is undefined");
          return;
        }

        const userPostsResponse = await databases.listDocuments(
          "67bcb64c0027e7eaa736",
          "67be55c40035f81ed3db",
          [
            Query.orderDesc("$createdAt"),
            Query.equal("userName", userName as QueryTypes),
          ]
        );

        if (
          !userPostsResponse.documents ||
          userPostsResponse.documents.length === 0
        ) {
          console.warn("No liked pictures found.");
          setLatestLikedPictures([]);
          return;
        }

        const postsData = userPostsResponse.documents.map((doc: any) => ({
          $id: doc.$id,
          tags: doc.tags,
          imageFileId: doc.imageFileId,
          userId: doc.userId,
          followId: doc.followId,
          imageId: doc.imageId,
          description: doc.description,
          likeCount: doc.likeCount,
          userName: doc.userName,
        }));

        setLatestLikedPictures(postsData);
      } catch (error) {
        console.error("Error fetching liked pictures:", error);
        setLatestLikedPictures([]); // Reset data on error
      }
    };

    fetchLatestLikedPictures();
  }, [userName]);

  const handleImageClick = (post: Post) => {
    navigate(`/Post/${post.$id}`, {
      state: {
        imageSrc: `https://cloud.appwrite.io/v1/storage/buckets/67be51020004776eea1a/files/${post.imageFileId}/view?project=67bc93bc0004228cf938`,
        ...post,
      },
    });
  };

  if (LatestLikedPictures.length === 0) {
    return <p>No liked pictures found for {userName}.</p>;
  }

  return (
    <div className="gallery">
      {LatestLikedPictures.map((post) => (
        <div key={post.$id} className="post-picture">
          {post.imageFileId && (
            <img
              src={`https://cloud.appwrite.io/v1/storage/buckets/67be51020004776eea1a/files/${post.imageFileId}/view?project=67bc93bc0004228cf938`}
              alt="Post"
              onClick={() => handleImageClick(post)}
            />
          )}
        </div>
      ))}
    </div>
  );
};

const Collections: React.FC<PostProps> = ({ userName }) => {
  const [collections, setCollections] = useState<any[]>([]);
  const [recentImages, setRecentImages] = useState<any[]>([]);
  const [followedCollections, setFollowedCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!userName) {
          console.error("userName is undefined");
          setError("Invalid userName provided.");
          setLoading(false);
          return;
        }

        setLoading(true);

        // Fetch collections
        const LatestCollectionsResponse = await databases.listDocuments(
          "67bcb64c0027e7eaa736", // Your database ID
          "67be4fe30038e2f0c316", // Your collections collection ID
          [
            Query.orderDesc("$createdAt"),
            Query.equal("userName", userName as QueryTypes),
          ]
        );
        setCollections(LatestCollectionsResponse.documents);

        // Fetch recent images for each collection
        const imagesPromises = LatestCollectionsResponse.documents.map(
          (collection) => fetchRecentImages(collection.$id)
        );

        const imagesResults = await Promise.all(imagesPromises);
        const combinedImages = imagesResults.flat(); // Flatten the array of arrays
        setRecentImages(combinedImages);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Error fetching data. Please try again later.");
        setLoading(false);
      }
    };

    const fetchRecentImages = async (collectionId: string) => {
      try {
        const response = await databases.listDocuments(
          "67bcb64c0027e7eaa736", // Your database ID
          "67be4e9e001142383751", // Your posts collection ID
          [
            Query.equal("collectionId", collectionId),
            Query.orderDesc("$createdAt"),
            Query.limit(3), // Limit to the 3 most recent images
          ]
        );

        return response.documents; // Returns an array of the 3 most recent documents
      } catch (error) {
        console.error("Error fetching recent images:", error);
        return [];
      }
    };

    fetchData();
  }, [userName]); // Refetch data if userName changes

  const handleFollow = async (collectionId: string) => {
    setLoading(true);
    try {
      if (followedCollections.includes(collectionId)) {
        // Unfollow logic
        const followResponse = await databases.listDocuments(
          "67bcb64c0027e7eaa736",
          "67afc75e00049aff55fa",
          [Query.equal("collectionId", collectionId)]
        );

        const followId =
          followResponse.documents.length > 0
            ? followResponse.documents[0].$id
            : null;

        if (followId) {
          await databases.deleteDocument(
            "67bcb64c0027e7eaa736",
            "67be4fe30038e2f0c316",
            followId
          );
          setFollowedCollections(
            followedCollections.filter((id) => id !== collectionId)
          );
        }
      } else {
        // Follow logic
        await databases.createDocument(
          "67bcb64c0027e7eaa736",
          "67be4fe30038e2f0c316",
          "unique()",
          { collectionId }
        );
        setFollowedCollections([...followedCollections, collectionId]);
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

  if (loading) {
    return <p>Loading collections...</p>;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  return (
    <div className="gallery">
      {collections.map((collection) => {
        // Filter recent images for this collection
        const collectionRecentImages = recentImages.filter(
          (image) => image.collectionId === collection.$id
        );

        return (
          <div className="collections" key={collection.$id}>
            <div className="search-bar">
              <input type="search" name="" id="" />
            </div>
            <div className="collections">
              <CollectLayoutUserFollow
                collection={collection}
                recentImages={collectionRecentImages} // Pass the filtered images
                followedCollections={followedCollections}
                handleFollow={handleFollow}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const UserPosts: React.FC<PostProps> = ({ userName }) => {
  const [posts, setPosts] = useState<Post[]>([]); // Consolidated single state
  const [loading, setLoading] = useState<boolean>(true); // To manage the loading state
  const [error, setError] = useState<string | null>(null); // To handle errors
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        if (!userName) {
          console.error("userName is undefined");
          setError("Invalid userName provided.");
          setLoading(false);
          return;
        }

        const userPostsResponse = await databases.listDocuments(
          "67bcb64c0027e7eaa736", // Replace with your database ID
          "67be4e9e001142383751", // Replace with your posts collection ID
          [
            Query.orderDesc("$createdAt"),
            Query.equal("userName", userName as QueryTypes),
          ]
        );

        const postsData = userPostsResponse.documents.map((doc: any) => ({
          $id: doc.$id,
          tags: doc.tags,
          imageFileId: doc.imageFileId,
          userId: doc.userId,
          followId: doc.followId,
          imageId: doc.imageId,
          description: doc.description,
          likeCount: doc.likeCount,
          userName: doc.userName,
        }));

        setPosts(postsData); // Save fetched posts
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user posts:", error);
        setError("Error fetching user posts. Please try again later.");
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, [userName]); // Refetch when userName changes

  const handleImageClick = (post: Post) => {
    console.log("Navigating to post with followId: ", post.followId);
    navigate(`/Post/${post.$id}`, {
      state: {
        imageSrc: `https://cloud.appwrite.io/v1/storage/buckets/67be51020004776eea1a/files/${post.imageFileId}/view?project=67bc93bc0004228cf938`,
        tags: post.tags ?? "",
        userName: post.userName,
        userId: post.userId,
        followId: post.followId,
        description: post.description,
        likeCount: post.likeCount,
        imageId: post.imageId,
        id: post.$id,
      },
    });
  };

  if (loading) {
    return <p>Loading posts...</p>; // Display loading state
  }

  if (error) {
    return <p className="error">{error}</p>; // Display errors
  }

  if (posts.length === 0) {
    return <p>No posts found for {userName}.</p>; // Handle empty posts
  }

  return (
    <div className="gallery">
      {posts.map((post) => (
        <div key={post.$id} className="post-picture">
          {post.imageFileId && (
            <img
              src={`https://cloud.appwrite.io/v1/storage/buckets/67be51020004776eea1a/files/${post.imageFileId}/view?project=67bc93bc0004228cf938`}
              alt="User Post"
              onClick={() => handleImageClick(post)}
            />
          )}
        </div>
      ))}
    </div>
  );
};

const UserFollowing: React.FC<PostProps> = ({ userName }) => {
  const { user: currentUser } = useCurrentUser();
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const userFollowUser = import.meta.env.VITE_USERFOLLOWUSER;
  const prefCollection = import.meta.env.VITE_USER_PREF_COLLECTION_ID;

  useEffect(() => {
    if (!userName) {
      setError("Invalid userName provided.");
      setLoading(false);
      return;
    }

    const fetchFollowing = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Grab the "following" relationships
        const rels = await databases.listDocuments(databaseId, userFollowUser, [
          Query.equal("userName", userName), // who this profile follows
        ]);
        const followingIds = rels.documents.map((doc) => doc.followUserId);

        if (followingIds.length === 0) {
          setFollowing([]);
          return;
        }

        // 2. Fetch all followed user profiles
        const profiles = await Promise.all(
          followingIds.map(async (id) => {
            const res = await databases.listDocuments(
              databaseId,
              prefCollection,
              [Query.equal("userId", id)]
            );
            return res.documents[0] ?? null;
          })
        );

        setFollowing(profiles.filter(Boolean));
      } catch (err) {
        console.error("Error loading following:", err);
        setError("Failed to load following list.");
      } finally {
        setLoading(false);
      }
    };

    fetchFollowing();
  }, [userName]);

  if (loading) return <span className="loader" />;
  if (error) return <p>{error}</p>;

  return (
    <div className="following-section">
      {following.map((user) => (
        <div className="follow-section" key={user.userId}>
          <div
            className="follow-left-side"
            onClick={() => navigate(`/User/${user.userName}`)}
          >
            <div className="follow-user-profile-picture">
              {user.profilePictureId ? (
                <img
                  src={`https://cloud.appwrite.io/v1/storage/buckets/${databaseId}/files/${
                    user.profilePictureId
                  }/view?project=${import.meta.env.VITE_PROJECT_ID}`}
                  alt={`${user.displayName}'s Profile`}
                  onError={(e) =>
                    (e.currentTarget.src = "/default-profile.jpg")
                  }
                />
              ) : (
                <p>No profile picture</p>
              )}
            </div>
            <div className="user-info">
              <p>
                <strong>{user.displayName}</strong>
              </p>
              <p className="user-place">@{user.userName}</p>
            </div>
          </div>
          <div className="follow-right-side">
            {currentUser && user.userId !== currentUser.$id && (
              <FollowUserButton
                followId={user.userId}
                userId={currentUser.$id}
                currentUser={currentUser}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const UserFollowers: React.FC<PostProps> = ({ userName }) => {
  const { user: currentUser } = useCurrentUser();
  const [followers, setFollowers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const userFollowUser = import.meta.env.VITE_USERFOLLOWUSER;
  const prefCollection = import.meta.env.VITE_USER_PREF_COLLECTION_ID;

  useEffect(() => {
    if (!userName) {
      setError("Invalid userName provided.");
      setLoading(false);
      return;
    }

    const fetchFollowers = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Grab the follower relationships
        const rels = await databases.listDocuments(databaseId, userFollowUser, [
          Query.equal("userName", userName as QueryTypes),
        ]);
        const followerIds = rels.documents.map((doc) => doc.userId);

        if (followerIds.length === 0) {
          setFollowers([]);
          return;
        }

        // 2. Fetch all follower profiles in one go
        const profiles = await Promise.all(
          followerIds.map((id) =>
            databases
              .listDocuments(databaseId, prefCollection, [
                Query.equal("userId", id),
              ])
              .then((res) => res.documents[0])
          )
        );

        setFollowers(profiles);
      } catch (err) {
        console.error("Error loading followers:", err);
        setError("Failed to load your followers.");
      } finally {
        setLoading(false);
      }
    };

    fetchFollowers();
  }, [currentUser]);

  if (loading) return <span className="loader" />;
  if (error) return <p>{error}</p>;
  if (!currentUser) return null;

  return (
    <div className="followers-section">
      {followers.map((user) => (
        <div className="follow-section" key={user.userId}>
          <div
            className="follow-left-side"
            onClick={() => navigate(`/User/${user.userName}`)}
          >
            <div className="follow-user-profile-picture">
              {user.profilePictureId ? (
                <img
                  src={`http://localhost:3000/profilePicture/${user.profilePictureId}`}
                  alt={`${user.displayName}'s Profile`}
                  onError={(e) =>
                    (e.currentTarget.src = "/default-profile.jpg")
                  }
                />
              ) : (
                <p>No profile picture</p>
              )}
            </div>

            <div className="user-info">
              <p>
                <strong>{user.displayName}</strong>
              </p>
              <p className="user-place">@{user.userName}</p>
            </div>
          </div>
          <div className="follow-right-side">
            {currentUser && user.userId !== currentUser.$id && (
              <FollowUserButton
                followId={user.userId}
                userId={currentUser.$id}
                currentUser={currentUser}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserTabsContent;
