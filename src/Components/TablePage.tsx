import React, { useState, useEffect } from "react";
import { databases, Query, storage } from "../appwrite";
import { Link, useNavigate } from "react-router-dom";

import "../components/TablePage.css";
import ImageLayout from "./CollectFollowLayout";
import FollowUserButton from "./FollowUserButton";
import { format, formatDistanceToNow } from "date-fns";
import { useCurrentUser } from "./useCurrentUser";
import LikeCollectShare from "./LikeCollectShare";
import ViewIcon from "/src/assets/SVG/inspect-svgrepo-com.svg";

interface TabsProps {
  searchTerm: string;
}

interface Post {
  $id: string; // Unique identifier
  imageFileId?: string; // Optional image file ID
  textContent?: string; // Optional text content
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

const Tabs: React.FC<TabsProps> = ({ searchTerm }) => {
  const [activeTab, setActiveTab] = useState("latest");

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="tabs-containers">
      <div className="tab-user-search">
        <p className="title-main">Results for "{searchTerm}"</p>

        <div className="stuck-tabs">
          <div
            className={`tabs5 ${activeTab === "latest" ? "active" : ""}`}
            onClick={() => handleTabClick("latest")}
          >
            Recent images "{searchTerm}"
          </div>
          <div
            className={`tabs5 ${activeTab === "popular" ? "active" : ""}`}
            onClick={() => handleTabClick("popular")}
          >
            Popular images "{searchTerm}"
          </div>
          <div
            className={`tabs5 ${activeTab === "article" ? "active" : ""}`}
            onClick={() => handleTabClick("article")}
          >
            article "{searchTerm}"
          </div>
          <div
            className={`tabs5 ${activeTab === "collections" ? "active" : ""}`}
            onClick={() => handleTabClick("collections")}
          >
            Collections
          </div>
          <div
            className={`tabs5 ${activeTab === "hearers" ? "active" : ""}`}
            onClick={() => handleTabClick("hearers")}
          >
            Hearters
          </div>
        </div>
      </div>

      <div className="tab-contentss">
        {activeTab === "latest" && <LatestPictures searchTerm={searchTerm} />}
        {activeTab === "popular" && <PopularPictures searchTerm={searchTerm} />}
        {activeTab === "article" && <PopularArticles searchTerm={searchTerm} />}
        {activeTab === "collections" && <Collections searchTerm={searchTerm} />}
        {activeTab === "hearers" && <Hearters searchTerm={searchTerm} />}
      </div>
    </div>
  );
};

const LatestPictures: React.FC<{ searchTerm: string }> = ({ searchTerm }) => {
  const [latestPictures, setLatestPictures] = useState<Post[]>([]);
  const { user: currentUser } = useCurrentUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);

  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const userPostCollection = import.meta.env.VITE_USER_POST_COLLECTION_ID;
  const userPrefCollection = import.meta.env.VITE_USER_PREF_COLLECTION_ID;

  const enrichPostWithProfile = async (post: any) => {
    try {
      const profileRes = await databases.listDocuments(
        databaseId,
        userPrefCollection,
        [Query.equal("userId", post.userId)]
      );
      const profilePictureId = profileRes.documents[0]?.profilePictureId ?? "";
      console.log(profileRes);
      return { ...post, profilePictureId };
    } catch {
      return { ...post, profilePictureId: "" };
    }
  };

  useEffect(() => {
    const fetchLatestPictures = async () => {
      setLoading(true); // Start loading
      try {
        const response = await databases.listDocuments(
          databaseId,
          userPostCollection,
          [
            Query.orderDesc("$createdAt"),
            Query.or([
              Query.search("tags", searchTerm),
              Query.search("description", searchTerm),
            ]),
          ]
        );

        const enrichedPosts = await Promise.all(
          response.documents.map(enrichPostWithProfile)
        );
        setLatestPictures(enrichedPosts);
        const lastDoc = response.documents.at(-1);
        return { latestPictures: enrichedPosts, lastDoc };
      } catch (error) {
        console.error("Error fetching latest pictures:", error);
      } finally {
        setLoading(false); // End loading
      }
    };

    fetchLatestPictures();
  }, [searchTerm]);

  // Format date into relative time
  const getTimeAgo = (date?: string) =>
    date
      ? formatDistanceToNow(new Date(date), { addSuffix: true }).replace(
          "about ",
          ""
        )
      : "Unknown time";

  if (loading) {
    return (
      <div className="page-loader">
        <span className="loader"></span>
      </div>
    );
  }

  const handleImageClick = (post: Post) => {
    console.log("Post followId: ", post.followId);
    navigate(`/Post/${post.$id}`, {
      state: {
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
        id: post.$id,
      },
    });
  };

  if (latestPictures.length === 0) {
    return <p>No pictures found matching "{searchTerm}".</p>;
  }

  return (
    <div className="d">
      <div className="picture-square">
        {latestPictures.map((picture) => (
          <div key={picture.$id} className="image-over">
            <div className="hover-info">
              <div className="header-username">
                <div className="left-pfp">
                  <div className="image-pfp">
                    {picture.profilePictureId ? (
                      <img
                        src={`http://localhost:3000/profilePicture/${picture.profilePictureId}`}
                        alt={`${picture.userName}'s profile`}
                      />
                    ) : (
                      <p>No profile picture available.</p>
                    )}
                  </div>
                  <div className="user-date">
                    <div className="user-name">
                      <p>
                        <span
                          onClick={() => navigate(`/User/${picture.userName}`)}
                          style={{ cursor: "pointer" }}
                        >
                          {picture.userName || "Unknown"}
                        </span>
                      </p>
                    </div>
                    <div className="time">{getTimeAgo(picture.createdAt)}</div>
                  </div>
                </div>

                <div className="follow-id">
                  {currentUser && picture.userId !== currentUser.$id && (
                    <FollowUserButton
                      followId={picture.userId ?? ""}
                      userId={currentUser.$id ?? ""}
                      currentUser={currentUser}
                    />
                  )}
                </div>
              </div>

              <div
                className="left-saved"
                onClick={() => handleImageClick(picture)}
                style={{ left: "264px", bottom: "20px" }}
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
                  imageId={picture.imageId ?? ""}
                  postId={picture.postId ?? ""}
                  likedOwnerId={currentUser?.$id ?? ""}
                  likeCount={Number(picture.likeCount ?? 0)}
                  imageFileId={picture.imageFileId ?? ""}
                  image={{
                    $id: picture.imageId ?? "",
                    imageFileId: picture.imageFileId ?? "",
                    fileName: picture.fileName ?? "",
                    postId: picture.postId ?? "",
                    createdAt: picture.createdAt ?? "",
                    collectionId: picture.collectionId ?? "",
                    userName: picture.userName ?? "",
                    collectionName: picture.collectionName ?? "",
                    tags: picture.tags ?? "",
                    postedBy: picture.userName ?? "",
                    userId: picture.userId ?? "",
                    likeCount: Number(picture.likeCount ?? 0),
                  }}
                  userName={picture.userName ?? ""}
                  createdAt={picture.createdAt ?? ""}
                  displayName={picture.displayName ?? ""}
                  tags={picture.tags ?? ""}
                  description={picture.description ?? ""}
                  imageUrl={`http://localhost:3000/image/${picture.imageFileId}`}
                  onActionClick={(e) => e.stopPropagation()}
                  userId={picture.userId ?? ""}
                />
              </div>

              <div className="saved-share-image">
                <div
                  className="left-saved"
                  onClick={() => handleImageClick(picture)}
                  style={{ left: "264px", bottom: "20px" }}
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
            {picture.imageFileId && (
              <img
                src={`https://cloud.appwrite.io/v1/storage/buckets/67be51020004776eea1a/files/${picture.imageFileId}/view?project=67bc93bc0004228cf938`}
                alt={picture.fileName}
                onClick={() => handleImageClick(picture)}
                className="image-collect"
              />
            )}{" "}
            <div className="hover-add-board">
              <p>{picture.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PopularPictures: React.FC<{ searchTerm: string }> = ({ searchTerm }) => {
  const [popularPictures, setPopularPictures] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { user: currentUser } = useCurrentUser();
  const navigate = useNavigate();
  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const userPostCollection = import.meta.env.VITE_USERL_IKE;
  const userPrefCollection = import.meta.env.VITE_USER_PREF_COLLECTION_ID;

  // Format date into relative time
  const getTimeAgo = (date?: string) =>
    date
      ? formatDistanceToNow(new Date(date), { addSuffix: true }).replace(
          "about ",
          ""
        )
      : "Unknown time";

  const enrichPostWithProfile = async (post: any) => {
    try {
      const profileRes = await databases.listDocuments(
        databaseId,
        userPrefCollection,
        [Query.equal("userId", post.userId)]
      );
      const profilePictureId = profileRes.documents[0]?.profilePictureId ?? "";
      console.log(profileRes);
      return { ...post, profilePictureId };
    } catch {
      return { ...post, profilePictureId: "" };
    }
  };

  useEffect(() => {
    const fetchPopularPictures = async () => {
      setLoading(true);
      try {
        const response = await databases.listDocuments(
          databaseId,
          userPostCollection,
          [
            Query.orderDesc("likeCount"),
            Query.or([
              Query.search("tags", searchTerm),
              Query.search("description", searchTerm),
            ]),
          ]
          // Assuming you have a 'likes' field
        );
        const enrichedPosts = await Promise.all(
          response.documents.map(enrichPostWithProfile)
        );
        setPopularPictures(enrichedPosts);
        const lastDoc = response.documents.at(-1);
        return { popularPictures: enrichedPosts, lastDoc };
      } catch (error) {
        console.error("Error fetching popular pictures:", error);
      } finally {
        setLoading(false); // End loading
      }
    };

    fetchPopularPictures();
  }, [searchTerm]);

  const handleImageClick = (post: Post) => {
    console.log("Post followId: ", post.followId);
    navigate(`/Post/${post.$id}`, {
      state: {
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
        id: post.$id,
      },
    });
  };

  if (loading) {
    return (
      <div className="page-loader">
        <span className="loader"></span>
      </div>
    );
  }

  if (popularPictures.length === 0) {
    return <p>No pictures found matching "{searchTerm}".</p>;
  }

  return (
    <div className="picture-square">
      {popularPictures.map((picture) => (
        <div key={picture.$id} className="image-over">
          <div className="hover-info">
            <div className="header-username">
              <div className="left-pfp">
                <div className="image-pfp">
                  {picture.profilePictureId ? (
                    <img
                      src={`http://localhost:3000/profilePicture/${picture.profilePictureId}`}
                      alt={`${picture.userName}'s profile`}
                    />
                  ) : (
                    <p>No profile picture available.</p>
                  )}
                </div>
                <div className="user-date">
                  <div className="user-name">
                    <p>
                      <span
                        onClick={() => navigate(`/User/${picture.userName}`)}
                        style={{ cursor: "pointer" }}
                      >
                        {picture.userName || "Unknown"}
                      </span>
                    </p>
                  </div>
                  <div className="time">{getTimeAgo(picture.createdAt)}</div>
                </div>
              </div>

              <div className="follow-id">
                {currentUser && picture.userId !== currentUser.$id && (
                  <FollowUserButton
                    followId={picture.userId ?? ""}
                    userId={currentUser.$id ?? ""}
                    currentUser={currentUser}
                  />
                )}
              </div>
            </div>

            <div
              className="left-saved"
              onClick={() => handleImageClick(picture)}
              style={{ left: "264px", bottom: "20px" }}
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
                imageId={picture.imageId ?? ""}
                postId={picture.postId ?? ""}
                likedOwnerId={currentUser?.$id ?? ""}
                likeCount={Number(picture.likeCount ?? 0)}
                imageFileId={picture.imageFileId ?? ""}
                image={{
                  $id: picture.imageId ?? "",
                  imageFileId: picture.imageFileId ?? "",
                  fileName: picture.fileName ?? "",
                  postId: picture.postId ?? "",
                  createdAt: picture.createdAt ?? "",
                  collectionId: picture.collectionId ?? "",
                  userName: picture.userName ?? "",
                  collectionName: picture.collectionName ?? "",
                  tags: picture.tags ?? "",
                  postedBy: picture.userName ?? "",
                  userId: picture.userId ?? "",
                  likeCount: Number(picture.likeCount ?? 0),
                }}
                userName={picture.userName ?? ""}
                createdAt={picture.createdAt ?? ""}
                displayName={picture.displayName ?? ""}
                tags={picture.tags ?? ""}
                description={picture.description ?? ""}
                imageUrl={`http://localhost:3000/image/${picture.imageFileId}`}
                onActionClick={(e) => e.stopPropagation()}
                userId={picture.userId ?? ""}
              />
            </div>

            <div className="saved-share-image">
              <div
                className="left-saved"
                onClick={() => handleImageClick(picture)}
                style={{ left: "264px", bottom: "20px" }}
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
          {picture.imageFileId && (
            <img
              src={`https://cloud.appwrite.io/v1/storage/buckets/67be51020004776eea1a/files/${picture.imageFileId}/view?project=67bc93bc0004228cf938`}
              alt={picture.fileName}
              onClick={() => handleImageClick(picture)}
              className="image-collect"
            />
          )}
        </div>
      ))}
    </div>
  );
};

const PopularArticles: React.FC<{ searchTerm: string }> = ({ searchTerm }) => {
  const [popularArticles, setPopularArticles] = useState<any[]>([]);
  const [enrichedArticles, setEnrichedArticles] = useState<any[]>([]);

  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const bucketId = import.meta.env.VITE_BUCKET_PFPBG;
  const collectionId = import.meta.env.VITE_USER_PREF_COLLECTION_ID;
  const userArticle = import.meta.env.VITE_USER_ARTICLES;
  const [loading, setLoading] = useState<boolean>(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchPopularArticles = async () => {
      setLoading(true);
      try {
        const response = await databases.listDocuments(
          databaseId,
          userArticle,
          [Query.orderDesc("likeCount"), Query.search("tags", searchTerm)]
          // Assuming you have a 'likes' field
        );
        setPopularArticles(response.documents);

        // Remove the filter if you're not using postId
        const filtered = response.documents; // Keep all articles

        setPopularArticles(filtered);

        // Fetch user profiles for each article and its preview
        const enriched = await Promise.all(
          filtered.map(async (article) => {
            try {
              const res = await databases.listDocuments(
                databaseId,
                collectionId,
                [Query.equal("userName", article.userName)]
              );
              const userProfile = res.documents[0] || null;
              console.log("Fetched user profile:", userProfile);

              const preview = article.contentFileId
                ? await fetchArticlePreview(article.contentFileId)
                : "";

              return { ...article, userProfile, preview }; // Use local variable here
            } catch (err) {
              console.error(
                `Error fetching profile for ${article.userName}:`,
                err
              );
              return { ...article, userProfile: null, preview: "" };
            }
          })
        );
        setEnrichedArticles(enriched); // Set the enriched articles with previews
      } catch (error) {
        console.error("Error fetching popular pictures:", error);
      } finally {
        setLoading(false); // End loading
      }
    };

    fetchPopularArticles();
  }, [searchTerm]);

  const cleanText = (html: string): string => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText || "";
    return text.replace(/\s+/g, " ").trim(); // collapse and trim whitespace
  };

  const fetchArticlePreview = async (fileId: string): Promise<string> => {
    try {
      const fileUrl = storage.getFileView(
        import.meta.env.VITE_BUCKET_POST,
        fileId
      );
      const response = await fetch(fileUrl);
      const html = await response.text();

      // Strip HTML tags and clean the text
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      const text = tempDiv.textContent || tempDiv.innerText || "";

      // Clean and truncate
      const cleanText = text.replace(/\s+/g, " ").trim();
      return cleanText.length > 100
        ? cleanText.slice(0, 100) + "..."
        : cleanText; // Show up to 200 characters
    } catch (err) {
      console.error("Failed to fetch or parse preview:", err);
      return "";
    }
  };

  const getProfilePictureUrl = (fileId: string) => {
    const url = storage.getFileView(bucketId, fileId);
    return url;
  };

  const getFormattedDate2 = (createdAt?: string) => {
    if (!createdAt) return "Unknown time";
    try {
      return format(new Date(createdAt), "MMMM d, yyyy");
    } catch {
      return "Invalid date";
    }
  };

  const handleImageClick = (post: Post) => {
    console.log("Post followId: ", post.followId);
    navigate(`/Post/${post.$id}`, {
      state: {
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
        id: post.$id,
      },
    });
  };

  if (loading) {
    return (
      <div className="page-loader">
        <span className="loader"></span>
      </div>
    );
  }

  if (popularArticles.length === 0) {
    return <p>No Article found matching "{searchTerm}".</p>;
  }

  return (
    <div className="picture-square">
      {enrichedArticles.length === 0 ? (
        <p>No articles available.</p>
      ) : (
        enrichedArticles.map((article) => {
          if (!article) return null; // Avoid rendering null articles
          return (
            <div key={article.$id}>
              <div>
                <div key={article.$id} className="articles-sections">
                  <Link to={`/article/${article.$id}`}>
                    {article.coverUrl && (
                      <img
                        src={article.coverUrl}
                        alt={article.title}
                        className="thumbnail"
                      />
                    )}
                    <div className="header-hearts">
                      <div className="user-picture">
                        <div className="image-user">
                          <img
                            src={
                              article.userProfile?.profilePictureId
                                ? getProfilePictureUrl(
                                    article.userProfile.profilePictureId
                                  )
                                : "/default-avatar.png"
                            }
                            alt="Profile"
                            onError={(e) =>
                              (e.currentTarget.src = "/default-avatar.png")
                            }
                            className="profile-picture"
                          />
                        </div>
                      </div>
                      <div className="hearts">
                        {article.likeCount}{" "}
                        <p style={{ paddingLeft: "6px" }}>HEARTS</p>
                      </div>
                    </div>
                    <div className="bottom-article">
                      <div className="captions-resume">
                        <div className="title-articles">
                          <h4>{article.title}</h4>
                        </div>
                        {article.preview && (
                          <p className="card-preview">{article.preview}</p>
                        )}
                      </div>

                      <div
                        className="d"
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          position: "relative",
                        }}
                      >
                        <p style={{ color: "#595959" }}>
                          By {article.userName}
                        </p>
                        <p style={{ color: "#595959" }}>
                          {getFormattedDate2(article.createdAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

const Collections: React.FC<{ searchTerm: string }> = ({ searchTerm }) => {
  const [collections, setCollections] = useState<any[]>([]);
  const [recentImages, setRecentImages] = useState<any[]>([]);
  const [followedCollections, setFollowedCollections] = useState<any[]>([]);

  const [, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCollections = async () => {
      setLoading(true);
      try {
        const response = await databases.listDocuments(
          "67bcb64c0027e7eaa736",
          "67be4fe30038e2f0c316", // Replace with your collections collection ID
          [
            Query.search("collectionName", searchTerm), // Search within the collection name field
          ]
        );
        setCollections(response.documents);
      } catch (error) {
        console.error("Error fetching collections:", error);
      } finally {
        setLoading(false); // End loading
      }
    };

    const fetchRecentImages = async (collectionId: string) => {
      try {
        const response = await databases.listDocuments(
          "67bcb64c0027e7eaa736",
          "67be4e9e001142383751", // Replace with your posts collection ID
          [
            Query.equal("collectionId", collectionId),
            Query.orderDesc("$createdAt"), // Order by creation date in descending order
          ]
        );
        return response.documents;
      } catch (error) {
        console.error("Error fetching recent images:", error);
        return [];
      }
    };

    const fetchCollectionsAndImages = async () => {
      try {
        const collectionsResponse = await databases.listDocuments(
          "67bcb64c0027e7eaa736",
          "67be4fe30038e2f0c316",
          [
            Query.search("collectionName", searchTerm), // Search within the collection name field
          ]
        );
        setCollections(collectionsResponse.documents);

        const recentImagesPromises = collectionsResponse.documents.map(
          (collection) => fetchRecentImages(collection.$id)
        );
        const recentImagesArray = await Promise.all(recentImagesPromises);
        const combinedImages = recentImagesArray.flat();
        setRecentImages(combinedImages);

        // Fetch followed collections
        const followsResponse = await databases.listDocuments(
          "67bcb64c0027e7eaa736",
          "67c077a3000cc0e2f3cc"
        );
        setFollowedCollections(
          followsResponse.documents.map((doc) => doc.collectionId)
        );
        setLoading(false);
      } catch (error) {
        console.error("Error fetching collections, images, and follows", error);
        setError("Error fetching data. Please try again later.");
        setLoading(false);
      }
    };

    fetchCollections();
    fetchCollectionsAndImages();
  }, [searchTerm]);

  const handleFollow = async (collectionId: string) => {
    setLoading(true);
    try {
      if (followedCollections.includes(collectionId)) {
        const followResponse = await databases.listDocuments(
          "67bcb64c0027e7eaa736",
          "67c077a3000cc0e2f3cc",
          [Query.equal("collectionId", collectionId)]
        );

        const followId =
          followResponse.documents.length > 0
            ? followResponse.documents[0].$id
            : null;
        if (followId) {
          await databases.deleteDocument(
            "67bcb64c0027e7eaa736",
            "67c077a3000cc0e2f3cc",
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
          "67c077a3000cc0e2f3cc",
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

  if (loading) {
    return (
      <div className="page-loader">
        <span className="loader"></span>
      </div>
    );
  }

  if (collections.length === 0) {
    return <p>No Collection found matching "{searchTerm}".</p>;
  }

  return (
    <div className="picture-square">
      {collections.map((collection) => (
        <ImageLayout
          key={collection.$id}
          collection={collection}
          recentImages={recentImages}
          followedCollections={followedCollections}
          handleFollow={handleFollow}
        />
      ))}
    </div>
  );
};

const Hearters: React.FC<{ searchTerm: string }> = ({ searchTerm }) => {
  const [hearers, setHearers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [posts, setPosts] = useState<Post[]>([]); // Consolidated single state

  const { user: currentUser } = useCurrentUser();
  const navigate = useNavigate();

  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const bucketId = import.meta.env.VITE_BUCKET_PFPBG;
  const userPostsCollect = import.meta.env.VITE_USER_POST_COLLECTION_ID;
  const userCollect = import.meta.env.VITE_USER_PREF_COLLECTION_ID;

  useEffect(() => {
    const fetchHearters = async () => {
      setLoading(true); // Start loading

      try {
        const response = await databases.listDocuments(
          databaseId,
          userCollect,
          [Query.search("userName", searchTerm)]
        );

        const users = response.documents;

        // For each user, fetch their 4 recent posts
        const userWithPosts = await Promise.all(
          users.map(async (user) => {
            const postsResponse = await databases.listDocuments(
              databaseId,
              userPostsCollect,
              [Query.equal("userId", user.$id), Query.orderDesc("$createdAt")]
            );
            console.log("Posts response:", postsResponse);

            const postsData = postsResponse.documents.map((doc: any) => ({
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
            return {
              ...user,
              recentPosts: postsResponse.documents,
            };
          })
        );

        setHearers(userWithPosts);
      } catch (error) {
        console.error("Error fetching hearters with posts:", error);
      } finally {
        setLoading(false); // End loading
      }
    };

    fetchHearters();
  }, [searchTerm]);

  const handleImageClick = (post: Post) => {
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
  };

  if (hearers.length === 0) {
    return <p>No Hearters found matching "{searchTerm}".</p>;
  }

  const handleUserClick = (hearter: any) => {
    // Use the userId from the clicked user (hearter)
    if (hearter.userId === currentUser?.$id) {
      navigate(`/Profile/`, {
        state: { userId: hearter.userId, followId: hearter.followId },
      });
    } else {
      navigate(`/User/${hearter.userName}`, {
        state: { userId: hearter.userId, followId: hearter.followId },
      });
    }
  };

  if (loading) {
    return (
      <div className="page-loader">
        <span className="loader"></span>
      </div>
    );
  }

  return (
    <div>
      {hearers.map((hearter) => (
        <div key={hearter.$id}>
          <div className="user-side-infos">
            <div
              className="left-side-profile-username"
              onClick={() => handleUserClick(hearter)}
            >
              <div className="le6t">
                {hearter.profilePictureId && (
                  <img
                    src={`https://cloud.appwrite.io/v1/storage/buckets/67bcb7d50038b0f4f5ba/files/${hearter.profilePictureId}/view?project=67bc93bc0004228cf938`}
                    alt={`${hearter.displayName}'s Profile`}
                  />
                )}
              </div>
              <div className="r1ght">
                <div style={{ cursor: "pointer" }}>
                  <div className="top">{hearter.displayName}</div>
                  <div className="bottom">(@{hearter.userName})</div>
                </div>
              </div>
            </div>

            <div className="follow-id">
              {currentUser && hearter.userId !== currentUser.$id && (
                <FollowUserButton
                  followId={hearter.followId ?? ""}
                  userId={hearter.userId ?? ""}
                  currentUser={currentUser}
                />
              )}
            </div>
          </div>

          <div className="recent-posts">
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
        </div>
      ))}
    </div>
  );
};

export default Tabs;
