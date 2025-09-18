import React, { useState, useEffect } from "react";
import { databases, account, Query } from "../appwrite"; // Import your Appwrite instance
import { useNavigate } from "react-router-dom";
import LikeButton from "../Components/LikeButton";
import AddToCollection from "../Components/AddToCollection";

interface AppImage {
  $id: string;
  imageFileId: string;
  fileName: string;
  createdAt: string;
  collectionId: string;
  userName: string;
  collectionName: string;
  tags: string; // Add tags to the interface
  postedBy: string; // Add posted by to the interface
  likeCount: string; // Add likeCount to the interface
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
  likeCount?: string;
}

const FollowCollect: React.FC = () => {
  const navigate = useNavigate();
  const [followedImages, setFollowedImages] = useState<AppImage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [likedImages, setLikedImages] = useState<string[]>([]); // State for liked images
  const [userCollections, setUserCollections] = useState<any[]>([]);
  const [userId, setUserId] = useState<string>(""); // State for userId
  const [userProfiles, setUserProfiles] = useState<Record<string, string>>({});

  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const userPost = import.meta.env.VITE_USER_POST_COLLECTION_ID;
  const userPref = import.meta.env.VITE_USER_PREF_COLLECTION_ID;

  useEffect(() => {
    const fetchFollowedCollectionsAndImages = async () => {
      try {
        const user = await account.get();
        setUserId(user.$id);

        // Step 1: Get followed collections
        const followsResponse = await databases.listDocuments(
          "67bcb64c0027e7eaa736", // Your database ID
          "67c077a3000cc0e2f3cc", // Your follows collection ID
          [Query.equal("userId", user.$id)]
        );

        const followedCollectionIds = followsResponse.documents.map(
          (doc) => doc.collectionId
        );

        let allImages: AppImage[] = [];

        // Step 2: Get posts from each followed collection
        for (const collectionId of followedCollectionIds) {
          const imagesResponse = await databases.listDocuments(
            "67bcb64c0027e7eaa736", // Your database ID
            "67be4e9e001142383751", // Your Posts collection ID
            [Query.equal("collectionId", collectionId)]
          );

          const imageDocs = imagesResponse.documents.map((doc) => ({
            $id: doc.$id,
            imageFileId: doc.imageFileId,
            fileName: doc.fileName,
            createdAt: doc.createdAt,
            collectionId: doc.collectionId,
            userName: doc.userName,
            collectionName: doc.collectionName,
            profilePictureId: doc.profilePictureId,
            tags: doc.tags,
            postedBy: doc.postedBy,
            likeCount: doc.likeCount,
          })) as AppImage[];

          allImages.push(...imageDocs);
        }

        // Step 3: Sort images by newest first
        const sortedImages = allImages.sort(
          (a, b) =>
            new Date(b.createdAt ?? "").getTime() -
            new Date(a.createdAt ?? "").getTime()
        );

        setFollowedImages(sortedImages);

        // Step 4: Get unique user IDs of post owners
        const uniqueUserIds = [
          ...new Set(allImages.map((img) => img.postedBy)),
        ];

        const profilesMap: Record<string, string> = {};

        // Step 5: Fetch profile pictures for each unique user
        await Promise.all(
          uniqueUserIds.map(async (uid) => {
            try {
              const response = await databases.listDocuments(
                databaseId,
                userPref,
                [Query.equal("userId", uid)]
              );
              if (response.documents.length > 0) {
                profilesMap[uid] = response.documents[0].profilePictureId;
              }
            } catch (err) {
              console.warn(`Failed to fetch profile for user ${uid}`, err);
            }
          })
        );

        setUserProfiles(profilesMap);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching followed collections and images", error);
        setError("Error fetching data. Please try again later.");
        setLoading(false);
      }
    };

    fetchFollowedCollectionsAndImages();
  }, []);

  useEffect(() => {
    const fetchUserCollections = async () => {
      try {
        const user = await account.get();

        const collectionsResponse = await databases.listDocuments(
          "67bcb64c0027e7eaa736", // Replace with your database ID
          "67be4fe30038e2f0c316", // Replace with your user collections collection ID
          [Query.equal("userId", user.$id)]
        );
        setUserCollections(collectionsResponse.documents);
      } catch (error) {
        console.error("Error fetching user collections", error);
      }
    };

    fetchUserCollections();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <div>
        {followedImages.map((image) => {
          const imageUrl = `https://cloud.appwrite.io/v1/storage/buckets/67be51020004776eea1a/files/${image.imageFileId}/view?project=67bc93bc0004228cf938`;
          return (
            <div key={image.$id} style={{ marginBottom: "20px" }}>
              Tags:{" "}
              {(image.tags ?? "").split(", ").map((tag, index) => (
                <span key={tag}>
                  <span
                    style={{
                      cursor: "pointer",
                      color: "blue",
                    }}
                    onClick={() => navigate(`/TagPosts/${tag.trim()}`)}
                  >
                    {tag.trim()}
                  </span>
                  {index < (image.tags ?? "").split(", ").length - 1 && ", "}{" "}
                </span>
              ))}
              <img
                src={imageUrl}
                alt={image.fileName}
                onError={(e) =>
                  console.error("Error loading image:", e, imageUrl)
                }
                style={{ display: "block", margin: "0 auto" }} // Center the image
              />
              <p>
                Posted by:{" "}
                <span
                  style={{ cursor: "pointer", color: "blue" }}
                  onClick={() => navigate(`/Pictureprofile/${image.userName}`)}
                >
                  {image.userName || "Unknown"}
                </span>
              </p>
              <div className="image-pfp">
                {userProfiles[image.postedBy] ? (
                  <img
                    src={`http://localhost:3000/profilePicture/${userProfiles.profilePictureId}`}
                    alt="Profile"
                  />
                ) : (
                  <p>No profile picture available.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FollowCollect;
