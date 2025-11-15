import React, { useState, useEffect } from "react";
import { databases, account, Query } from "../appwrite"; // Import your Appwrite instance
import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNow, differenceInHours } from "date-fns";
import LikAndCollect from "./LikeAndCollect";
import { useNavigation } from "../Components/NavigationContext";

import StaticGif from "./StaticGif";

interface AppImage {
  description: string;
  profilePictureId: string;
  $id: string;
  userId: string;
  imageFileId: string;
  fileName: string;
  createdAt: string;
  collectionId: string;
  userName: string;
  collectionName: string;
  displayName: string;
  tags: string;
  postedBy: string;
  likeCount: number;
  likedByUserId?: string | null;
  likedByUserName?: string;
  likedByDisplayName?: string;
  likedByProfilePictureId?: string | null;
}

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
  postedBy?: string;
  likeCount?: number;
}

const FollowUser: React.FC = () => {
  const navigate = useNavigate();
  const [followedUsers, setFollowedUsers] = useState<AppImage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { setIsNavigating } = useNavigation();

  const [userId] = useState<string>(""); // State for userId
  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const userPost = import.meta.env.VITE_USER_POST_COLLECTION_ID;
  const collectionId = import.meta.env.VITE_USER_PREF_COLLECTION_ID;
  const userLikes = import.meta.env.VITE_USERL_IKE;
  const userFollowuser = import.meta.env.VITE_USERFOLLOWUSER;

  useEffect(() => {
    const fetchLikedImagesByFollowedUsers = async () => {
      setLoading(true);
      try {
        const user = await account.get();
        setCurrentUserId(user.$id); // Set current user ID

        // 1. Get users the current user follows
        const followRes = await databases.listDocuments(
          databaseId,
          userFollowuser,
          [Query.equal("userId", user.$id)]
        );
        const followedUserIds = followRes.documents.map((doc) => doc.followId);
        if (followedUserIds.length === 0) {
          setFollowedUsers([]);
          return;
        }
        console.log("Follow Res:", followRes.documents);
        // 2. Get likes from those followed users
        const likesRes = await databases.listDocuments(databaseId, userLikes, [
          ...followedUserIds.map((id) => Query.equal("userId", id)),
        ]);
        console.log("Followed User IDs:", followedUserIds.length);
        console.log("Likes Count:", likesRes.documents.length);

        if (likesRes.documents.length === 0) {
          setFollowedUsers([]); // Already doing this ✔️
          setLoading(false); // 👍 Don't forget to stop the spinner
          return; // Stop further execution
        }

        // 3. Get the liked image IDs
        const likedImageIds = likesRes.documents.map((d) => d.imageId);

        // 4. Fetch the image posts by likedImageIds
        const imagesRes = await databases.listDocuments(databaseId, userPost, [
          Query.equal("$id", likedImageIds),
        ]);
        console.log("Images Found:", imagesRes.documents.length);

        if (imagesRes.documents.length === 0) {
          setFollowedUsers([]);
          return;
        }

        // Step 5: Get unique post owner user IDs
        const uniqueUserIds = [
          ...new Set(imagesRes.documents.map((img) => img.postedBy)),
        ];

        const profilesMap: Record<string, string> = {};

        // Step 6: Fetch each user's profilePictureId
        await Promise.all(
          uniqueUserIds.map(async (uid) => {
            try {
              const profileRes = await databases.listDocuments(
                databaseId,
                collectionId,
                [Query.equal("userId", uid)]
              );

              if (profileRes.documents.length > 0) {
                profilesMap[uid] = profileRes.documents[0].profilePictureId;
              }
            } catch (err) {
              console.warn(`Failed to fetch profile for user ${uid}`, err);
            }
          })
        );

        setUserProfile(profilesMap);

        // 7. Build your liked images array with liker info merged
        const combinedImages: AppImage[] = imagesRes.documents.map(
          (imageDoc) => {
            // Find all likes for this image by followed users

            return {
              profilePictureId: imageDoc.profilePictureId ?? "",
              $id: imageDoc.$id,
              imageFileId: imageDoc.imageFileId ?? "",
              fileName: imageDoc.fileName ?? "",
              createdAt: imageDoc.createdAt ?? "",
              collectionId: imageDoc.collectionId ?? "",
              userName: imageDoc.userName ?? "",
              collectionName: imageDoc.collectionName ?? "",
              displayName: imageDoc.displayName ?? "",
              tags: imageDoc.tags ?? "",
              postedBy: imageDoc.postedBy ?? "",
              description: imageDoc.description ?? "",
              userId: imageDoc.userId ?? "",

              likeCount: Number(imageDoc.likeCount ?? 0),
            };
          }
        );

        // Filter out current user's own posts
        const filteredImages = combinedImages.filter((image) => {
          console.log("Image postedBy:", image.postedBy);
          return image.postedBy !== currentUserId;
        });

        console.log("Sample Combined Image:", combinedImages[0]);
        console.log("Current User ID:", currentUserId);

        setFollowedUsers(filteredImages);
      } catch (error) {
        console.error("Error fetching liked images by followed users:", error);
        setError("Could not load liked images.");
      } finally {
        setLoading(false);
      }
    };

    fetchLikedImagesByFollowedUsers();
  }, [currentUserId]); // Add currentUserId to dependencies to re-fetch if needed

 

  const getRelativeTime = (dateString?: string) => {
    if (!dateString) return "Unknown time";

    const date = new Date(dateString);
    const now = new Date();

    const diffHours = differenceInHours(now, date);

    if (diffHours < 1) {
      return formatDistanceToNow(date, { addSuffix: true });
    } else if (diffHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true });
    } else {
      return format(date, "MMMM d, yyyy");
    }
  };

  const handleImageClick = (post: Post) => {
    setIsNavigating(true);
    setTimeout(() => {
      navigate(`/Post/${post.$id}`, {
        state: {
          imageSrc: `http://localhost:3000/image/${post.imageFileId}`,
          tags: post.tags ?? "",
          userName: post.userName,
          imageFileId: post.imageFileId,
          userId: post.userId,
          followId: post.followId,
          description: post.description,
          likeCount: post.likeCount,
          imageId: post.imageId,
          postedBy: post.postedBy,
          createdAt: post.createdAt || post.$createdAt,
          $createdAt: post.$createdAt,
          id: post.$id,
        },
      });
    }, 100);
  };

  const handleUserClick = (image: AppImage) => {
    if (image.postedBy === userId) {
      navigate(`/Profile/`, {
        state: { userId, followId: image.collectionId },
      });
    } else {
      navigate(`/User/${image.userName}`, {
        state: { userId: image.postedBy, followId: image.collectionId },
      });
    }
  };

  // Handle loading and error states
  if (loading) {
    return (
      <div className="center-right-now">
        <span className="loader"></span>{" "}
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
      </div>
    );
  }
  return (
    <div>
      <div>
        {followedUsers.length > 0 ? (
          followedUsers.map((image) => {
            const imageUrl = `https://cloud.appwrite.io/v1/storage/buckets/67be51020004776eea1a/files/${image.imageFileId}/view?project=67bc93bc0004228cf938`;
            return (
              <div
                key={image.$id}
                style={{ marginBottom: "20px", width: "690px" }}
                className="content-follow"
              >
                <div className="left-photos">
                  <div className="image-pfp-content">
                    {userProfile?.[image.postedBy] ? (
                      <img
                        src={`http://localhost:3000/profilePicture/${
                          userProfile[image.postedBy]
                        }`}
                        onClick={() => handleUserClick(image)}
                        alt="Profile"
                      />
                    ) : (
                      <p>No profile picture available.</p>
                    )}
                  </div>
                </div>
                <div className="right-side-follow-collect">
                  <div className="center-right-side">
                    <div className="top-infows">
                      <div
                        className="user-name-content"
                        onClick={() => handleUserClick(image)}
                      >
                        <p className="display-name-content">
                          <span>{image.displayName || "Unknown"}</span>
                        </p>
                        <p className="user-userName-content">
                          {" "}
                          <span style={{ cursor: "pointer", color: "#818181" }}>
                            {image.userName || "Unknown"}
                          </span>
                        </p>
                      </div>
                      <div className="left-more">
                        <img
                          src="/src/assets/SVG/more-svgrepo-com.svg"
                          alt="Back"
                          className="svg-exit"
                        />
                      </div>
                    </div>
                    <div className="bottom-info-user">
                      <div className="text-phares-info">New Heart</div>
                    </div>

                    <div className="liked-and-collect-content">
                      {image.$id && image.postedBy && (
                        <LikAndCollect
                          imageId={image.$id}
                          likedOwnerId={image.postedBy} // ✅ This is the poster’s ID
                          postId={image.$id}
                          likeCount={Number(image.likeCount ?? 0)}
                          imageFileId={image.imageFileId ?? ""}
                          image={{
                            $id: image.$id,
                            imageFileId: image.imageFileId ?? "",
                            fileName: image.fileName ?? "",
                            postId: image.$id ?? "",
                            createdAt: image.createdAt ?? "",
                            collectionId: image.collectionId ?? "",
                            userName: image.userName ?? "",
                            collectionName: image.collectionName ?? "",
                            description: image.description ?? "",
                            tags: image.tags ?? "",
                            postedBy: image.userName ?? "",
                            userId: image.userId ?? "",
                            likeCount: Number(image.likeCount ?? 0),
                          }}
                          userName={image.userName ?? ""}
                          displayName={image.displayName ?? ""}
                          imageUrl={imageUrl ?? ""}
                          userId={image.userId ?? ""}
                          tags={image.tags ?? ""}
                          description={image.description ?? ""}
                        />
                      )}
                      <div className="time">
                        <p>{getRelativeTime(image.createdAt)}</p>
                      </div>
                    </div>
                    <div className="main-image-home">
                      <div className="inside-main-home">
                        {image.imageFileId &&
                          (image.fileName?.toLowerCase().endsWith(".gif") ? (
                            <StaticGif
                              gifUrl={image.imageFileId}
                              alt="Post"
                              onClick={() => handleImageClick(image)}
                              showGifLabel={image.fileName
                                ?.toLowerCase()
                                .endsWith(".gif")}
                              className="main-image-home"
                            />
                          ) : (
                            <img
                              src={imageUrl}
                              alt="Post"
                              onClick={() => handleImageClick(image)}
                              className="main-image-home"
                            />
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <p>Users you follow haven’t hearts any posts yet 💤</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowUser;
