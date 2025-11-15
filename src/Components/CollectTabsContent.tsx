import React, { useEffect, useState } from "react";
import { account, databases, Query } from "../appwrite";
import { useNavigate } from "react-router-dom";

import FollowUserButton from "./FollowUserButton";
import { useCurrentUser } from "../Components/useCurrentUser";
import LikeCollectShare from "./LikeCollectShare";
import { formatDistanceToNow } from "date-fns";

import ViewIcon from "/src/assets/SVG/inspect-svgrepo-com.svg";
import StaticGif from "./StaticGif";

interface Post {
  $id: string;
  imageFileId?: string;
  followId?: string;
  $createdAt?: string;
  userId?: string;
  tags?: string;
  userName?: string;
  displayName?: string;
  profilePictureId?: string;
  collectionName?: string;
  description?: string;
  postId?: string;
  collectionId?: string;
  imageId?: string;
  links?: string;
  fileName?: string;
  createdAt?: string;
  postedBy?: string; // Add posted by to the interface
  likeCount?: string;
}
interface CollectTabsContentProps {
  activeTab: string;
  collectionId: string;
  selectMode: boolean;
  selectedImageIds: string[];
  toggleSelectImage: (imageId: string) => void;
}

interface CollectionFollowersProps {
  collectionId: string;
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

const CollectTabsContent: React.FC<CollectTabsContentProps> = ({
  activeTab,
  collectionId,
  selectMode,
  selectedImageIds,
  toggleSelectImage,
}) => {
  const { user: currentUser } = useCurrentUser();

  return (
    <div className="tab-content">
      {activeTab === "CollectionImages" && (
        <CollectionImages
          collectionId={collectionId}
          selectMode={selectMode}
          selectedImageIds={selectedImageIds}
          toggleSelectImage={toggleSelectImage}
        />
      )}
      {activeTab === "CollectionFollowers" && (
        <CollectionFollowers
          collectionId={collectionId}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

const CollectionImages: React.FC<{
  collectionId: string;
  selectMode: boolean;
  selectedImageIds: string[];
  toggleSelectImage: (imageId: string) => void;
}> = ({ collectionId, selectMode, selectedImageIds, toggleSelectImage }) => {
  const [loading, setLoading] = useState(true);

  const { user: currentUser } = useCurrentUser();
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<any[]>([]);
  const [description, setDescription] = useState<string | null>(null);

  const [fadingImages] = useState<string[]>([]); // ✅ NEW
  const [, setUserProfile] = useState<Post | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [showBackToTop, setShowBackToTop] = useState(false);

  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const userPostId = import.meta.env.VITE_USER_POST_COLLECTION_ID;
  const otherCollection = import.meta.env.VITE_USER_COLLECTION;
  const otherImagesCollect = import.meta.env.VITE_USER_ADD_IMAGE_COLLECTION;
  const userPrefCollection = import.meta.env.VITE_USER_PREF_COLLECTION_ID;

  const navigate = useNavigate();

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const user = await account.get();
        const userId = user.$id;

        const [originalImages, savedImages] = await Promise.all([
          databases.listDocuments(databaseId, userPostId, [
            Query.equal("collectionId", collectionId),
          ]),
          databases.listDocuments(databaseId, otherImagesCollect, [
            Query.equal("collectionId", collectionId),
          ]),
        ]);

        const combined = [
          ...originalImages.documents,
          ...savedImages.documents,
        ];

        const filtered = combined
          .filter((img) => img.imageFileId && img.collectionId === collectionId)
          .reduce((acc: Record<string, any>, image) => {
            acc[image.imageFileId] = image;
            return acc;
          }, {});

        const sorted = Object.values(filtered).sort(
          (a: any, b: any) =>
            new Date(b.collectionCreatedAt || b.createdAt || 0).getTime() -
            new Date(a.collectionCreatedAt || a.createdAt || 0).getTime()
        );

        // ✅ Add profile info to each image/post
        const enrichedWithProfile = await Promise.all(
          sorted.map(async (post: any) => {
            try {
              const profileRes = await databases.listDocuments(
                databaseId,
                userPrefCollection, // this must be defined earlier
                [Query.equal("userId", post.userId)]
              );

              const profileDoc = profileRes.documents[0];
              const profilePictureId = profileDoc?.profilePictureId || "";

              return {
                ...post,
                profilePictureId,
                displayName: profileDoc?.displayName ?? "",
                bio: profileDoc?.bio ?? "",
              };
            } catch (error) {
              console.warn("Failed to fetch profile for user:", post.userId);
              return { ...post, profilePictureId: "" };
            }
          })
        );

        setImages(enrichedWithProfile);
        setLoading(false);
      } catch (err) {
        console.error("Error loading images", err);
        setError("Failed to load images.");
        setLoading(false);
      }
    };

    const fetchDescription = async () => {
      try {
        const res = await databases.listDocuments(
          databaseId,
          otherCollection, // possibly a different ID
          [Query.equal("collectionId", collectionId)]
        );

        const descriptionDoc = res.documents[0]; // Add validation if needed
        setDescription(descriptionDoc?.description || null);
      } catch (error) {
        console.error("Failed to fetch collection description", error);
        setError("Failed to load description.");
      }
    };

    fetchImages();
    fetchDescription();
  }, [collectionId]);

  // Fetch current user's profile
  useEffect(() => {
    if (!userId) return;

    const fetchUserProfile = async () => {
      try {
        const response = await databases.listDocuments(
          databaseId,
          userPrefCollection,
          [Query.equal("userId", userId)]
        );

        if (response.documents.length > 0) {
          const doc = response.documents[0];
          setUserProfile({
            ...doc,
            profilePictureId: doc.profilePictureId || "",
          });
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    };

    fetchUserProfile();
  }, [userId]);

  const getTimeAgo = (date?: string) =>
    date
      ? formatDistanceToNow(new Date(date), { addSuffix: true }).replace(
          "about ",
          ""
        )
      : "Unknown time";

  const handleClickImage = (image: any) => {
    const postId = image?.postId;

    if (!postId) {
      console.warn("No valid postId found for navigation.");
      console.log("Invalid image object:", image);
      return;
    }

    navigate(`/Post/${postId}`, {
      state: { fromCollection: true }, // optional
    });
  };

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 300);

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  if (loading) return <span className="loader"></span>;
  if (error) return <p>{error}</p>;

  return (
    <div className="collection-images-container">
      <div className="description-section-collection">
        {loading ? (
          <p className="description-text">Loading description...</p>
        ) : description ? (
          <p className="description-text">{description}</p>
        ) : (
          <p className="description-text">No description found.</p>
        )}
      </div>

      <div className="mini-collect">
        {images.map((post) => (
          <div
            key={post.$id}
            className={`image-item ${
              selectedImageIds.includes(post.$id) &&
              fadingImages.includes(post.$id)
                ? "fade-out"
                : ""
            }`}
          >
            <div className="d">
              {selectMode && (
                <input
                  type="checkbox"
                  checked={selectedImageIds.includes(post.$id)}
                  onChange={() => toggleSelectImage(post.$id)}
                />
              )}

              <div className="hover-info">
                <div className="header-username">
                  <div className="left-pfp">
                    <div className="image-pfp">
                      {post.profilePictureId ? (
                        <img
                          src={`http://localhost:3000/profilePicture/${post.profilePictureId}`}
                          alt={`${post.userName}'s profile`}
                        />
                      ) : (
                        <p>No profile picture available.</p>
                      )}
                    </div>

                    <div className="user-date">
                      <div className="user-name">
                        <p>
                          <span
                            onClick={() => navigate(`/User/${post.userName}`)}
                            style={{ cursor: "pointer" }}
                          >
                            {post.userName || "Unknown"}
                          </span>
                        </p>
                      </div>
                      <div className="time">{getTimeAgo(post.createdAt)}</div>
                    </div>
                  </div>

                  <div className="follow-id">
                    <FollowUserButton
                      followId={post.followId ?? ""}
                      userId={post.userId ?? ""}
                      currentUser={currentUser}
                    />
                  </div>
                </div>
                <div
                  className="left-saved"
                  onClick={() => handleClickImage(post)}
                  title="View post?"
                  style={{
                    left: "264px",
                    bottom: "20px",
                  }}
                >
                  <img
                    src={ViewIcon}
                    alt="svg image"
                    style={{
                      width: "79px",
                      height: "89px",
                      objectFit: "cover",
                      opacity: "0",
                    }}
                  />
                </div>
                <div className="middle-heart-center">
                  <LikeCollectShare
                    imageId={post.imageId ?? ""}
                    postId={post.postId ?? ""}
                    likedOwnerId={currentUser?.$id ?? ""}
                    likeCount={Number(post.likeCount ?? 0)}
                    imageFileId={post.imageFileId ?? ""}
                    image={{
                      $id: post.imageId ?? "",
                      imageFileId: post.imageFileId ?? "",
                      fileName: post.fileName ?? "",
                      postId: post.postId ?? "",
                      createdAt: post.createdAt ?? "",
                      collectionId: post.collectionId ?? "",
                      userName: post.userName ?? "",
                      collectionName: post.collectionName ?? "",
                      tags: post.tags ?? "",
                      postedBy: post.userName ?? "",
                      userId: post.userId ?? "",
                      likeCount: Number(post.likeCount ?? 0),
                    }}
                    userName={post.userName ?? ""}
                    createdAt={post.createdAt ?? ""}
                    displayName={post.displayName ?? ""}
                    tags={post.tags ?? ""}
                    description={post.description ?? ""}
                    imageUrl={`http://localhost:3000/image/${post.imageFileId}`}
                    onActionClick={(e) => e.stopPropagation()}
                    userId={post.userId ?? ""}
                  />
                </div>

                <div className="saved-share-image">
                  <div
                    className="left-saved"
                    onClick={() => handleClickImage(post)}
                    title="View post?"
                    style={{
                      left: "264px",
                      bottom: "20px",
                    }}
                  >
                    <img
                      src={ViewIcon}
                      alt="svg image"
                      style={{
                        width: "79px",
                        height: "79px",
                        objectFit: "cover",
                        opacity: "0",
                      }}
                    />
                  </div>
                </div>
              </div>
              {post.imageFileId &&
                (post.fileName?.toLowerCase().endsWith(".gif") ? (
                  <StaticGif
                    gifUrl={post.imageFileId}
                    alt="Post"
                    onClick={() => handleClickImage(post)}
                    showGifLabel
                    className="second-mini-collect"
                  />
                ) : (
                  <img
                    src={`http://localhost:3000/image/${post.imageFileId}`}
                    alt="Post"
                    onClick={() => handleClickImage(post)}
                    className="second-mini-collect"
                  />
                ))}
            </div>
          </div>
        ))}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            style={{
              position: "fixed",
              bottom: 30,
              right: 20,
              padding: "10px 15px",
              fontSize: 14,
              background: "#333",
              color: "#fff",
              border: "none",
              borderRadius: 30,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              zIndex: 1000,
            }}
            aria-label="Back to top"
          >
            ↑ Top
          </button>
        )}
      </div>
    </div>
  );
};

const CollectionFollowers: React.FC<CollectionFollowersProps> = ({
  collectionId,
  currentUser,
}) => {
  // Early return if no currentUser
  if (!currentUser) {
    return <p>Please log in to see followers.</p>;
  }

  const [followers, setFollowers] = useState<any[]>([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [collectionUserId, setCollectionUserId] = useState<string>("");
  const [userProfile, setUserProfile] = useState<string | null>(null);

  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const userFollowCollect = import.meta.env.VITE_USERFOLLOWCOLLECT;
  const prefCollection = import.meta.env.VITE_USER_PREF_COLLECTION_ID;

  useEffect(() => {
    if (!collectionId) {
      setError("Collection ID is undefined");
      setLoading(false);
      return;
    }

    const fetchFollowers = async () => {
      try {
        const response = await databases.listDocuments(
          databaseId,
          userFollowCollect,
          [Query.equal("collectionId", collectionId)]
        );

        const userIds = response.documents.map((doc) => doc.userId);

        // Fetch user information for all followers
        const userDetails = await Promise.all(
          userIds.map(async (userId) => {
            const userResponse = await databases.listDocuments(
              databaseId,
              prefCollection,
              [Query.equal("userId", userId)]
            );

            return userResponse.documents[0];
          })
        );

        setFollowers(userDetails);
      } catch (error) {
        setError("Failed to fetch followers.");
      } finally {
        setLoading(false);
      }
    };

    fetchFollowers();
  }, [collectionId]);

  const fetchCollectionOwner = async () => {
    if (!collectionId) return;

    try {
      const response = await databases.listDocuments(
        databaseId,
        userFollowCollect,
        [Query.equal("collectionId", collectionId)]
      );

      if (response.documents.length > 0) {
        setCollectionUserId(response.documents[0].userId);
      }
    } catch (error) {
      console.error("Error fetching collection owner:", error);
    }
  };

  const fetchProfilePicture = async () => {
    if (!collectionUserId) return;

    try {
      const response = await databases.listDocuments(
        databaseId,
        prefCollection,
        [Query.equal("userId", collectionUserId)]
      );

      if (response.documents.length > 0) {
        const profileData = response.documents[0];
        const profileImageUrl = `https://cloud.appwrite.io/v1/storage/buckets/67bcb7d50038b0f4f5ba/files/${profileData.profilePictureId}/view?project=67bc93bc0004228cf938`;
        setUserProfile(profileImageUrl);
      } else {
        console.log("No profile picture found for this user.");
      }
    } catch (error) {
      console.error("Error fetching profile picture:", error);
    }
  };

  useEffect(() => {
    fetchCollectionOwner();
  }, [collectionId]);

  useEffect(() => {
    if (collectionUserId) {
      fetchProfilePicture();
    }
  }, [collectionUserId]);

  if (loading) return <span className="loader"></span>;
  if (error) return <p>{error}</p>;

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
                  src={`https://cloud.appwrite.io/v1/storage/buckets/67bcb7d50038b0f4f5ba/files/${user.profilePictureId}/view?project=67bc93bc0004228cf938`}
                  alt={`${user.displayName}'s Profile`}
                  onError={(e) => {
                    e.currentTarget.src = "/default-profile.jpg";
                  }}
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
            <FollowUserButton
              followId={user.userId} // Assuming you want to follow this user by userId
              userId={user.userId}
              currentUser={currentUser}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default CollectTabsContent;
