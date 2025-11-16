import React, { useEffect, useRef, useState } from "react";
import { account, databases, Query } from "../appwrite";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useCurrentUser } from "../Components/useCurrentUser";

import ViewIcon from "/src/assets/SVG/inspect-svgrepo-com.svg";
import HeartCopyIcon from "/src/assets/SVG/HeartIconcopycopy.svg";
import CorbeilIcon from "/src/assets/SVG/delete-svgrepo-com.svg";

import CollectLayout from "../Components/CollectLayout";
import AddToCollection from "../Components/AddToCollection";
import LikeCollectShare from "../Components/LikeCollectShare";
import FollowUserButton from "../Components/FollowUserButton";
import StaticGif from "../Components/StaticGif";
import Pagination from "../Components/Pagination";

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
  likeCount?: string | number;
}

interface AppImage {
  $id: string;
  imageFileId: string;
  fileName: string;
  postId: string;
  createdAt: string;
  collectionId: string;
  userName: string;
  collectionName: string;
  links: string;
  tags: string;
  postedBy: string;
  likeCount: string | number;
}

interface Picture {
  $id: string;
  collectionId: string;
  imageFileId: string;
  fileName: string;
}

interface Preferences {
  bioId: string;
  displayName: string;
  profilePictureId?: string;
  backgroundImageId?: string;
}

interface User {
  $id: string;
  name: string;
  userName: string;
  displayName: string;
  prefs: Preferences;
}

interface TabsContentProps {
  activeTab: string; // Currently active tab
}

const TabsContent: React.FC<TabsContentProps> = ({ activeTab }) => {
  return (
    <div className="tab-content2">
      {activeTab === "latest" && <LatestLikedPictures />}
      {activeTab === "collections" && <Collections />}
      {activeTab === "post" && <UserPosts />}
      {activeTab === "following" && <UserFollowing />}
      {activeTab === "followers" && <UserFollowers />}
    </div>
  );
};

const LatestLikedPictures: React.FC = () => {
  const [latestLikedPictures, setLatestLikedPictures] = useState<Post[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [selectedPostsForModal, setSelectedPostsForModal] = useState<Post[]>(
    []
  );

  const { user: currentUser } = useCurrentUser();
  const [user, setUser] = useState<User | null>(null);
  const [hoverInfoVisible, setHoverInfoVisible] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeletedMessage, setShowDeletedMessage] = useState(false);
  const [refreshGallery, setRefreshGallery] = useState(false);
  const [, setIsReloading] = useState(false);

  const [userCollections, setUserCollections] = useState<any[]>([]);
  const [showAddCollectionModal, setShowAddCollectionModal] = useState(false);
  const [, setSelectedImageForModal] = useState<Post | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [likedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [, setUserProfile] = useState<Post | null>(null);

  const [, setLikedCollect] = useState<AppImage[]>([]);

  const [isAddingToCollection] = useState(false);

  const dbId = import.meta.env.VITE_DATABASE_ID;
  const userLikes = import.meta.env.VITE_USERL_IKE;
  const userPostCollection = import.meta.env.VITE_USER_POST_COLLECTION_ID;
  const collectionListId = import.meta.env.VITE_USER_COLLECTION;
  const userPrefCollection = import.meta.env.VITE_USER_PREF_COLLECTION_ID;

  const navigate = useNavigate();

  useEffect(() => {
    const fetchLatestLikedPictures = async () => {
      try {
        const user = await account.get();
        const userId = user.$id;
        setUserId(userId);

        // Fetch liked pictures without search query
        const response = await databases.listDocuments(
          dbId,
          userLikes, // Liked posts collection
          [Query.orderDesc("$createdAt"), Query.equal("userId", userId)]
        );

        // Fetch liked pictures based on the search query (tags or description)
        const searchResponse = await databases.listDocuments(
          dbId,
          userLikes, // Liked posts collection
          [
            Query.or([
              Query.search("tags", searchQuery), // Search tags field
              Query.search("description", searchQuery), // Search description field
            ]),
          ]
        );

        // Merge the results: Combine the search result and the normal result
        const mergedDocuments = [
          ...response.documents,
          ...searchResponse.documents.filter(
            (searchDoc: any) =>
              !response.documents.some(
                (existingDoc: any) => existingDoc.$id === searchDoc.$id
              )
          ),
        ];

        // Set the documents in state after merging
        setLatestLikedPictures(
          mergedDocuments.map((doc: any) => ({
            $id: doc.$id,
            tags: doc.tags,
            imageFileId: doc.imageFileId,
            userId: doc.userId,
            followId: doc.followId,
            imageId: doc.imageId,
            description: doc.description,
            likeCount: doc.likeCount,
            userName: doc.userName,
            createdAt: doc.createdAt || doc.$createdAt,
            $createdAt: doc.createdAt || doc.$createdAt,
          }))
        );
      } catch (error) {
        console.error("Error fetching liked pictures:", error);
      }
    };

    const fetchCurrentUser = async () => {
      try {
        const currentUser = await account.get();

        setUser(currentUser as unknown as User);
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };

    fetchLatestLikedPictures();
    fetchCurrentUser();
  }, [searchQuery]); // Depend on searchQuery to refetch when it changes

  useEffect(() => {
    const fetchUserCollections = async () => {
      setLoading(true);
      try {
        const res = await databases.listDocuments(dbId, collectionListId, [
          Query.equal("userId", userId),
        ]);
        setUserCollections(res.documents); // ✅ make sure this is called
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch collections", err);
        setLoading(false);
      }
    };

    if (userId) fetchUserCollections();
  }, [userId]); // ✅ must depend on userId

  // Fetch current user's profile
  useEffect(() => {
    if (!userId) return;

    const fetchUserProfile = async () => {
      try {
        const response = await databases.listDocuments(
          dbId,
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

  // The fetchLikedImages function is triggered by the refreshGallery flag
  useEffect(() => {
    if (refreshGallery) {
      fetchLikedImages(); // Trigger the image fetch when refreshGallery is true
      // Add a timeout before resetting to give some delay if needed
      const timeout = setTimeout(() => {
        setRefreshGallery(false); // Reset the refresh flag after the fetch
      }, 1500); // Adjust timeout as needed

      // Cleanup timeout
      return () => clearTimeout(timeout);
    }
  }, [refreshGallery]); // Depend on refreshGallery to trigger the re-fetch

  // Fetch liked images when likedImages are updated
  useEffect(() => {
    if (likedImages.length > 0) {
      fetchLikedImages(); // Trigger fetching when likedImages are updated
    }
  }, [likedImages]); // Re-run when likedImages change

  const fetchLikedImages = async () => {
    setLoading(true);
    try {
      const likedDocs = await Promise.all(
        likedImages.map((id) =>
          databases.getDocument(dbId, userPostCollection, id)
        )
      );

      const likedData: AppImage[] = likedDocs.map((doc: any) => ({
        $id: doc.$id,
        imageFileId: doc.imageFileId || "",
        fileName: doc.fileName || "",
        postId: doc.postId || "",
        createdAt: doc.createdAt || "",
        collectionId: doc.collectionId || "",
        collectionName: doc.collectionName || "",
        userName: doc.userName || "",
        links: doc.links || "",
        tags: doc.tags || "",
        postedBy: doc.postedBy || "",
        likeCount: doc.likeCount || 0,
      }));

      setLikedCollect(likedData); // Update state with fetched images
    } catch (err) {
      console.error("Error fetching liked images:", err);
      alert("Failed to fetch liked images.");
    } finally {
      setLoading(false);
      setRefreshGallery(false); // Reset refreshGallery after fetching
    }
  };

  // Handle image deletion
  const handleDeleteSelectedImages = async () => {
    setIsDeleting(true);
    const notFoundImageIds: string[] = [];
    const successfullyDeletedImageIds: string[] = [];

    try {
      const deletePromises = selectedImageIds.map(async (imageId) => {
        try {
          const response = await databases.listDocuments(dbId, userLikes, [
            Query.equal("imageId", imageId),
          ]);

          if (response.documents.length > 0) {
            const document = response.documents[0];
            const documentId = document.$id;

            await databases.deleteDocument(dbId, userLikes, documentId);
            successfullyDeletedImageIds.push(imageId);
          } else {
            notFoundImageIds.push(imageId);
          }
        } catch (error) {
          console.error(`Error deleting image ${imageId}:`, error);
          notFoundImageIds.push(imageId);
        }
      });

      await Promise.all(deletePromises);

      // Update state after deletion
      setSelectedImageIds((prev) =>
        prev.filter((id) => !successfullyDeletedImageIds.includes(id))
      );

      setLikedCollect((prev) =>
        prev.filter((img) => !successfullyDeletedImageIds.includes(img.$id))
      );

      // Provide feedback
      if (successfullyDeletedImageIds.length > 0) {
        setShowDeletedMessage(true);
        setTimeout(() => setShowDeletedMessage(false), 2000);
        setIsReloading(true);
      }

      if (notFoundImageIds.length > 0) {
        alert(
          `Some images could not be found and were not deleted: ${notFoundImageIds.join(
            ", "
          )}`
        );
      }

      setSelectedImageIds([]); // Clear selected images
      setRefreshGallery(true); // Trigger re-fetch after deletion
      window.location.reload(); // Refresh the page
    } catch (error) {
      console.error("Error deleting images:", error);
      alert("An unexpected error occurred while deleting images.");
    } finally {
      setIsDeleting(false);
      setLoading(false);
    }
  };

  const toggleSelectImage = (imageId: string) => {
    setSelectedImageIds(
      (prev) =>
        prev.includes(imageId)
          ? prev.filter((id) => id !== imageId) // Deselect if already selected
          : [...prev, imageId] // Select if not already selected
    );
  };

  const handleImageClick = (post: any) => {
    const imageId = post?.imageId;

    if (!imageId) {
      console.warn("No valid postId found for navigation.");
      console.log("Invalid image object:", post);
      return;
    }

    navigate(`/Post/${imageId}`, {
      state: { fromCollection: true }, // optional
    });
  };

  const handleAddToCollection = async () => {
    if (selectedImageIds.length === 0) {
      alert("Please select exactly one image to add.");
      return;
    }
    const selectedPosts = latestLikedPictures.filter(
      (p) =>
        typeof p.imageId === "string" && selectedImageIds.includes(p.imageId)
    );

    if (selectedPosts.length === 0) {
      alert("Selected images not found.");
      return;
    }

    setSelectedImageForModal(null); // Clear single-image state if using
    setShowAddCollectionModal(true);
    setSelectedPostsForModal(selectedPosts); // create this state
  };

  // Format date into relative time
  const getTimeAgo = (date?: string) =>
    date
      ? formatDistanceToNow(new Date(date), { addSuffix: true }).replace(
          "about ",
          ""
        )
      : "Unknown time";

  if (latestLikedPictures.length === 0) {
    return <span className="loader"></span>;
  }

  if (loading) return <span className="loader"></span>;
  return (
    <div className="fd">
      <div className="middle-bar">
        <div className="middle-nav">
          <img src={HeartCopyIcon} alt="" />
          <input
            type="text"
            placeholder={`Search ${currentUser?.name}'s hearts`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="toolbar-2">
          {selectMode && selectedImageIds.length > 0 && (
            <div className="action-buttons">
              {isAddingToCollection ? (
                <div className="page-loader">
                  <span className="loader"></span>
                  <p>Adding images...</p>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleAddToCollection}
                    className="add-to-collection-btn"
                    disabled={isAddingToCollection} // Disable the button while loading
                  >
                    Add to Collection
                  </button>
                  <button
                    onClick={handleDeleteSelectedImages} // Triggers the deletion of selected images
                    className="delete-selected-btn" // You can style this button with this class
                    disabled={isDeleting} // Disable the button if deletion is in progress
                  >
                    <img
                      src={CorbeilIcon}
                      alt="svg deleted"
                      style={{
                        width: "39px",
                        height: "39px",
                        objectFit: "cover",
                        alignItems: "center",
                      }}
                    />
                  </button>
                </>
              )}
            </div>
          )}
          <button
            onClick={() => {
              setSelectMode(!selectMode);
              if (selectMode) {
                setHoverInfoVisible(true); // Show hover-info again when canceling
              } else {
                setHoverInfoVisible(false); // Hide hover-info when enabling select mode
              }
            }}
            className="select-toggle-btn"
          >
            <img
              src={
                selectMode
                  ? "src/assets/SVG/dismiss-svgrepo-comCopie.svg"
                  : "/src/assets/SVG/magic-wand-svgrepo-com.svg"
              }
              alt={selectMode ? "Cancel" : "Select Images"}
              className="button-icon"
            />
          </button>
        </div>
      </div>
      <div className="gallery">
        {latestLikedPictures.filter((post) => {
          if (!searchQuery) return true; // show all if no search query

          return (
            post.tags?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.description?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }).length === 0 ? (
          <p>No results found.</p>
        ) : (
          latestLikedPictures
            .filter((post) => {
              if (!searchQuery) return true;
              return (
                post.tags?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.description
                  ?.toLowerCase()
                  .includes(searchQuery.toLowerCase())
              );
            })
            .map((post) => {
              const isSelected = selectedImageIds.includes(post?.imageId!);

              return (
                <div
                  key={post.$id}
                  className={`image-wrapper2 ${
                    selectMode && isSelected ? "selected" : ""
                  }`}
                  onClick={() => {
                    if (selectMode) {
                      toggleSelectImage(post?.imageId!); // Only toggle selection if in select mode
                    }
                  }}
                >
                  {/* Conditionally render hover-info */}
                  {hoverInfoVisible && (
                    <div className="hover-info">
                      <div className="header-username">
                        <div className="left-pfp">
                          <div className="image-pfp">
                            {user?.prefs.profilePictureId && (
                              <img
                                src={`https://cloud.appwrite.io/v1/storage/buckets/67bcb7d50038b0f4f5ba/files/${user.prefs.profilePictureId}/view?project=67bc93bc0004228cf938`}
                                alt="Profile"
                              />
                            )}
                          </div>

                          <div className="user-date">
                            <div className="user-name">
                              <p>
                                <span
                                  onClick={() =>
                                    navigate(`/User/${post.userName}`)
                                  }
                                  style={{ cursor: "pointer" }}
                                >
                                  {user?.name || "Unknown"}
                                </span>
                              </p>
                            </div>
                            <div className="time">
                              {getTimeAgo(post.$createdAt)}
                            </div>
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
                        onClick={() => handleImageClick(post)}
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
                    </div>
                  )}

                  {/* Image display (gif or static image) */}
                  {post.imageFileId &&
                    (post.fileName?.toLowerCase().endsWith(".gif") ? (
                      <div className="dx">
                        <StaticGif
                          gifUrl={post.imageFileId}
                          alt="Post"
                          showGifLabel
                          className="imagess image-collect"
                        />
                        {selectMode && isSelected && (
                          <div className="check-icon">✔</div>
                        )}
                      </div>
                    ) : (
                      <div className="dx">
                        <img
                          src={`https://cloud.appwrite.io/v1/storage/buckets/67be51020004776eea1a/files/${post.imageFileId}/view?project=67bc93bc0004228cf938`}
                          alt="Post"
                          className="imagess image-collect"
                        />
                        {selectMode && isSelected && (
                          <div className="check-icon">✔</div>
                        )}
                      </div>
                    ))}
                </div>
              );
            })
        )}
      </div>

      {showDeletedMessage && (
        <div className="deleted-toast-box2">
          <div className="deleted-toast-box-modal2">
            <div className="deleted-toast">✅ Images deleted successfully!</div>
          </div>
        </div>
      )}

      {isDeleting && <span className="loader"></span>}

      {showAddCollectionModal && selectedPostsForModal.length > 0 && (
        <AddToCollection
          images={selectedPostsForModal.map((post) => ({
            imageId: post.imageId ?? "",
            imageFileId: post.imageFileId!,
            imageUrl: `https://cloud.appwrite.io/v1/storage/buckets/67be51020004776eea1a/files/${post.imageFileId}/view?project=67bc93bc0004228cf938`,
            postedBy: post.userId ?? "Unknown",
          }))}
          userId={userId}
          userCollections={userCollections}
          onClose={() => {
            setShowAddCollectionModal(false);
            setSelectedImageIds([]);
            setSelectedPostsForModal([]);
            setSelectMode(false);
          }}
          onImageAdded={() => {
            setShowAddCollectionModal(false);
            setSelectedImageIds([]);
            setSelectedPostsForModal([]);
            setSelectMode(false);
          }}
        />
      )}
    </div>
  );
};

const Collections: React.FC = () => {
  const [collections, setCollections] = useState<any[]>([]);
  const [recentImages, setRecentImages] = useState<any[]>([]);
  const [followedCollections, setFollowedCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  const dbId = import.meta.env.VITE_DATABASE_ID;
  const creatPost = import.meta.env.VITE_USER_POST_COLLECTION_ID;
  const postCollectionId = import.meta.env.VITE_USER_ADD_IMAGE_COLLECTION;
  const userCollection = import.meta.env.VITE_USER_COLLECTION;

  const collectionListId = import.meta.env.VITE_USER_COLLECTION;

  const [, setError] = useState<string | null>(null);
  const [, setUserId] = useState<string>(""); // State for userId

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const user = await account.get();
        setUserId(user.$id);

        // Fetch collections
        const LatestCollectionsResponse = await databases.listDocuments(
          dbId, // Replace with your database ID
          userCollection, // Replace with your liked images collection ID
          [Query.orderDesc("$createdAt"), Query.equal("userId", user.$id)]
        );
        setCollections(LatestCollectionsResponse.documents);

        // Fetch recent images for each collection
        const imagesPromises = LatestCollectionsResponse.documents.map(
          (collection) => fetchRecentImages(collection.$id)
        );

        // Combine all recent images into one array
        const imagesResults = await Promise.all(imagesPromises);
        const combinedImages = imagesResults.flat(); // Flatten the array of arrays
        setRecentImages(combinedImages);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Error fetching data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    const fetchRecentImages = async (collectionId: string) => {
      try {
        // Fetch both createPost and userAddImgtoCollect
        const [originals, saved] = await Promise.all([
          databases.listDocuments(dbId, creatPost, [
            Query.equal("collectionId", collectionId),
          ]),
          databases.listDocuments(dbId, postCollectionId, [
            Query.equal("collectionId", collectionId),
          ]),
        ]);

        const combined = [...originals.documents, ...saved.documents];

        // De-duplicate by imageFileId
        const uniqueMap = combined.reduce((acc, doc) => {
          if (doc.imageFileId) acc[doc.imageFileId] = doc;
          return acc;
        }, {} as Record<string, any>);

        const recent = Object.values(uniqueMap)
          .sort(
            (a, b) =>
              new Date(b.collectionCreatedAt || b.$createdAt).getTime() -
              new Date(a.collectionCreatedAt || a.$createdAt).getTime()
          )
          .slice(0, 3);

        return recent.map((doc) => ({
          $id: doc.$id,
          collectionId: doc.collectionId,
          imageFileId: doc.imageFileId,
          fileName: doc.fileName ?? "",
        })) as Picture[];
      } catch (error) {
        console.error("Error fetching recent images:", error);
        return [];
      }
    };

    fetchData();
  }, []);

  const handleDeleteCollection = async (collectionId: string) => {
    setLoading(true);
    try {
      await databases.deleteDocument(dbId, collectionListId, collectionId);
      setCollections(collections.filter((c) => c.$id !== collectionId));
    } catch (error) {
      console.error("Error deleting collection:", error);
      setError("Failed to delete collection. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (collectionId: string) => {
    setLoading(true);
    try {
      if (followedCollections.includes(collectionId)) {
        const followResponse = await databases.listDocuments(
          "679e85270039aff62112",
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
          setLoading(false);
          return;
        }
      } else {
        await databases.createDocument(
          "67bcb64c0027e7eaa736",
          "67be4fe30038e2f0c316",
          "unique()",
          {
            collectionId: collectionId,
          }
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
  if (loading) return <span className="loader"></span>;
  return (
    <div
      className="d"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
      }}
    >
      <div
        className="g"
        style={{ display: "flex", gap: "790px", alignItems: "center" }}
      >
        <div
          className="middle-nav"
          style={{ position: "relative", left: "490px", height: "40px" }}
        >
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search collections..."
          />
        </div>
        <button
          onClick={() => setShowDelete(!showDelete)}
          className="select-toggle-btn"
        >
          <img
            src={
              showDelete
                ? "src/assets/SVG/dismiss-svgrepo-comCopie.svg"
                : "src/assets/SVG/magic-wand-svgrepo-com.svg"
            }
            alt={showDelete ? "Cancel" : "Organize"}
            className="button-icon"
          />
        </button>
      </div>

      <div className="gallery">
        {collections
          .filter((collection) =>
            collection.collectionName
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase())
          )
          .map((collection) => {
            const collectionRecentImages = recentImages.filter(
              (image) => image.collectionId === collection.$id
            );

            return (
              <div className="collections" key={collection.$id}>
                <CollectLayout
                  collection={collection}
                  recentImages={collectionRecentImages}
                  followedCollections={followedCollections}
                  handleFollow={handleFollow}
                />
                {showDelete && (
                  <button
                    onClick={() => handleDeleteCollection(collection.$id)}
                    style={{
                      marginTop: "10px",
                      backgroundColor: "red",
                      color: "white",
                      padding: "5px 10px",
                      borderRadius: "4px",
                    }}
                  >
                    Delete Collection
                  </button>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

const UserPosts: React.FC = () => {
  const [UserPosts, setUserPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages] = useState(1);
  const pageRef = useRef<number>(0);

  const [, setUser] = useState<User | null>(null);
  const [loading] = useState(false);
  const dbId = import.meta.env.VITE_DATABASE_ID;
  const userPostCollection = import.meta.env.VITE_USER_POST_COLLECTION_ID;

  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const [showBackToTop, setShowBackToTop] = useState(false);

  const [] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10; // Number of posts per page

  const fetchUserPosts = async () => {
    if (loading || !hasMore) return;

    try {
      const currentUser = (await account.get()) as unknown as User;
      setUser(currentUser);

      const response = await databases.listDocuments(dbId, userPostCollection, [
        Query.orderDesc("$createdAt"),
        Query.equal("userId", currentUser.$id),
        Query.limit(limit),
        Query.offset(pageRef.current * limit),
      ]);

      const newPosts = response.documents.map((doc: any) => ({
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

      setUserPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.$id));
        const uniquePosts = newPosts.filter((p) => !existingIds.has(p.$id));
        return [...prev, ...uniquePosts];
      });

      if (newPosts.length < limit) {
        setHasMore(false);
      }

      pageRef.current += 1;
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
    }
  };

  useEffect(() => {
    let throttleTimeout: NodeJS.Timeout | null = null;

    const handleScroll = () => {
      if (throttleTimeout || loading || !hasMore) return;

      throttleTimeout = setTimeout(() => {
        throttleTimeout = null;

        const nearBottom =
          window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 100;

        if (nearBottom) {
          fetchUserPosts();
        }
      }, 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore]);

  useEffect(() => {
    fetchUserPosts(); // Load first page
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageChange = (pageIndex: number) => {
    setCurrentPage(pageIndex);
    scrollToTop(); // Optional: scroll to top on page change
  };

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 300);

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleImageClick = (post: Post) => {
    console.log("Post followId: ", post.followId);
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
        id: post.$id, // Pass the ID of the current image
      },
    });
  };

  if (loading) return <span className="loader"></span>;

  return (
    <div
      className="d"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
      }}
    >
      <div className="middle-nav">
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by tags or description"
        />
      </div>
      <div className="gallery">
        {UserPosts.length === 0 ? (
          <p>No posts yet.</p>
        ) : (
          UserPosts.filter(
            (post) =>
              post.tags?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              post.description?.toLowerCase().includes(searchTerm.toLowerCase())
          ).map((post) => (
            <div key={post.$id} className="post-picture">
              {post.imageFileId &&
                (post.fileName?.toLowerCase().endsWith(".gif") ? (
                  <StaticGif
                    gifUrl={post.imageFileId}
                    alt="Post"
                    onClick={() => handleImageClick(post)}
                    showGifLabel
                    className="image-collect"
                  />
                ) : (
                  <img
                    src={`https://cloud.appwrite.io/v1/storage/buckets/67be51020004776eea1a/files/${post.imageFileId}/view?project=67bc93bc0004228cf938`}
                    alt="Post"
                    onClick={() => handleImageClick(post)}
                    className="image-collect"
                  />
                ))}
            </div>
          ))
        )}
      </div>
      {loading && hasMore && (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <span style={{ fontSize: "14px", color: "#888" }}>
            Loading more posts...
          </span>
        </div>
      )}

      <div className="">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages || 1}
          onPageChange={handlePageChange}
        />

        {showBackToTop && (
          <button
            type="button"
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

const UserFollowing: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [followers, setFollowers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const userFollowUser = import.meta.env.VITE_USERFOLLOWUSER;
  const prefCollection = import.meta.env.VITE_USER_PREF_COLLECTION_ID;

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const userData = await account.get();
        setCurrentUser(userData as unknown as User);
      } catch (error) {
        console.error("Error fetching current user:", error);
        setError("You must be logged in to see followers.");
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const fetchFollowers = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Grab the follower relationships
        const rels = await databases.listDocuments(databaseId, userFollowUser, [
          Query.equal("currentUserId", currentUser.$id),
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
            <FollowUserButton
              followId={user.userId} // the person who follows you
              userId={currentUser.$id} // you, for follow/unfollow logic
              currentUser={currentUser}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const UserFollowers: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [followers, setFollowers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const userFollowUser = import.meta.env.VITE_USERFOLLOWUSER;
  const prefCollection = import.meta.env.VITE_USER_PREF_COLLECTION_ID;

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const userData = await account.get();
        setCurrentUser(userData as unknown as User);
      } catch (error) {
        console.error("Error fetching current user:", error);
        setError("You must be logged in to see followers.");
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const fetchFollowers = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Grab the follower relationships
        const rels = await databases.listDocuments(databaseId, userFollowUser, [
          Query.equal("followId", currentUser.$id),
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
            <FollowUserButton
              followId={user.userId} // the person who follows you
              userId={currentUser.$id} // you, for follow/unfollow logic
              currentUser={currentUser}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default TabsContent;
