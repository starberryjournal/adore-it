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
  tags: string; // Add tags to the interface
  postedBy: string; // Add posted by to the interface
  likeCount: number; // Add likeCount to the interface
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
  postedBy?: string; // Add posted by to the interface
  likeCount?: number;
}

const FollowCollect: React.FC = () => {
  const navigate = useNavigate();
  const [followedImages, setFollowedImages] = useState<AppImage[]>([]);
  const [followedUsers, setFollowedUsers] = useState<AppImage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { isNavigating, setIsNavigating } = useNavigation();

  const [posts, setPosts] = useState<Post[]>([]);
  const [likedImages, setLikedImages] = useState<string[]>([]); // State for liked images
  const [userCollections, setUserCollections] = useState<any[]>([]);
  const [userId, setUserId] = useState<string>(""); // State for userId
  const [userProfile, setUserProfile] = useState<any>(null);
  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const followCollect = import.meta.env.VITE_USERFOLLOWCOLLECT;
  const userPost = import.meta.env.VITE_USER_POST_COLLECTION_ID;
  const collectionId = import.meta.env.VITE_USER_PREF_COLLECTION_ID;
  const userCollection = import.meta.env.VITE_USER_COLLECTION;
  const userLikes = import.meta.env.VITE_USERL_IKE;
  const userFollowuser = import.meta.env.VITE_USERFOLLOWUSER;

  useEffect(() => {
    const fetchFollowedCollectionsAndImages = async () => {
      try {
        const user = await account.get();
        setUserId(user.$id);

        // Step 1: Get followed collections
        const followsResponse = await databases.listDocuments(
          databaseId,
          followCollect,
          [Query.equal("userId", user.$id)]
        );

        const followedCollectionIds = followsResponse.documents.map(
          (doc) => doc.collectionId
        );

        // ✅ Step 2: Fetch collection names
        const collectionDocsRes = await databases.listDocuments(
          databaseId,
          userCollection, // your collectionListId collection
          [Query.equal("$id", followedCollectionIds)]
        );

        const collectionMap: Record<string, string> = {};
        collectionDocsRes.documents.forEach((doc) => {
          collectionMap[doc.$id] = doc.collectionName || "Untitled Collection";
        });

        let allImages: AppImage[] = [];

        // Step 3: Get posts from each followed collection
        for (const collectionId of followedCollectionIds) {
          const imagesResponse = await databases.listDocuments(
            databaseId,
            userPost,
            [Query.equal("collectionId", collectionId)]
          );

          const imageDocs = imagesResponse.documents.map((doc) => ({
            $id: doc.$id,
            imageFileId: doc.imageFileId,
            fileName: doc.fileName,
            createdAt: doc.createdAt,
            collectionId: doc.collectionId,
            userName: doc.userName,
            collectionName:
              collectionMap[doc.collectionId] || "Unknown Collection", // ✅
            profilePictureId: doc.profilePictureId,
            tags: doc.tags,
            postedBy: doc.postedBy,
            displayName: doc.displayName,
            description: doc.description,
            likeCount: doc.likeCount,
          })) as AppImage[];

          allImages.push(...imageDocs);
        }

        // Step 4: Sort images by newest first
        const sortedImages = allImages.sort(
          (a, b) =>
            new Date(b.createdAt ?? "").getTime() -
            new Date(a.createdAt ?? "").getTime()
        );

        setFollowedImages(sortedImages);

        // Step 5: Get unique post owner user IDs
        const uniqueUserIds = [
          ...new Set(allImages.map((img) => img.postedBy)),
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
        setLoading(false);
      } catch (error) {
        console.error("Error fetching followed collections and images", error);
        setError("Error fetching data. Please try again later.");
        setLoading(false);
      }
    };
    fetchFollowedCollectionsAndImages();
  }, []);

  const getFormattedDate = (createdAt?: string) => {
    if (!createdAt) return "Unknown time";
    try {
      return format(new Date(createdAt), "MMMM d, yyyy 'at' h:mm a");
    } catch {
      return "Invalid date";
    }
  };

  const getRelativeTime = (dateString?: string) => {
    if (!dateString) return "Unknown time";

    const date = new Date(dateString);
    const now = new Date();

    const diffHours = differenceInHours(now, date);

    if (diffHours < 1) {
      // Less than 1 hour ago: show minutes ago
      return formatDistanceToNow(date, { addSuffix: true });
    } else if (diffHours < 24) {
      // Less than 24 hours but more than 1 hour: show hours ago
      return formatDistanceToNow(date, { addSuffix: true });
    } else {
      // More than 24 hours ago: show exact date
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
          $createdAt: post.$createdAt, // Optional: to have access to both if needed

          id: post.$id, // Pass the ID of the current image
        },
      });
    }, 100);
  };

  const handleUserClick = (image: AppImage) => {
    if (image.postedBy === userId) {
      navigate(`/Profile/`, {
        state: { userId, followId: image.collectionId }, // or image.followId if you store that
      });
    } else {
      navigate(`/User/${image.userName}`, {
        state: { userId: image.postedBy, followId: image.collectionId },
      });
    }
  };

  if (loading)
    return (
      <div className="center-right-now">
        <span className="loader"></span>{" "}
      </div>
    );
  if (error) return <p>{error}</p>;

  return (
    <div>
      <div>
        {followedImages.map((image) => {
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
                    <div className="text-phares-info">
                      New Heart in{" "}
                      <p
                        className="color-link-collection"
                        onClick={() =>
                          navigate(`/CollectionImages/${image.collectionId}`)
                        }
                      >
                        {image.collectionName}
                      </p>
                    </div>
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
        })}
      </div>
    </div>
  );
};

export default FollowCollect;
