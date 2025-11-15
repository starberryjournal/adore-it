import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { account, databases, Query, storage } from "../appwrite"; // adjust path as needed
import "./UserArticles.css";
import { format } from "date-fns";
import FollowUserButton from "../Components/FollowUserButton";

import HeartIcon from "../assets/HeartIcon.svg";
import HeartOutlineIcon from "../assets/HeartOutlineIcon.svg";

const UserArticles: React.FC = () => {
  const { postId } = useParams(); // get postId from URL
  const [post, setPost] = useState<any>(null);

  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [, setSimilarArticles] = useState<any[]>([]);

  const [, setUserName] = useState<string | null>(null);
  const [, setDisplayName] = useState<string>(""); // Added state for displayName
  const [userId, setUserId] = useState<string | null>(null);
  const [, setCollectionName] = useState<string | null>(null);
  const [collection, setCollection] = useState<any>(null);
  const [enrichedArticles, setEnrichedArticles] = useState<any[]>([]);
  const [likeCount, setLikeCount] = useState<number>(0); // Local state to hold the like count
  const [isLiked, setIsLiked] = useState<boolean>(false); // State to track if the article is liked

  const navigate = useNavigate();

  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const bucketId = import.meta.env.VITE_BUCKET_PFPBG;

  const userArticles = import.meta.env.VITE_USER_ARTICLES;
  const userLikesArticles = import.meta.env.VITE_USERLIKE_ARTICLE;

  const userCollect = import.meta.env.VITE_USER_COLLECTION;
  const collectionId = import.meta.env.VITE_USER_PREF_COLLECTION_ID;
  const fetchPostById = async (postId: string) => {
    try {
      const fetchedPost = await databases.getDocument(
        databaseId,
        userArticles,
        postId
      );
      setPost(fetchedPost);

      // Set the like count from fetched post
      setLikeCount(parseInt(fetchedPost.likeCount) || 0); // Default to 0 if no like count

      // Check if the current user has liked the article
      const currentUser = await account.get();
      const hasUserLiked = fetchedPost.likedBy?.includes(currentUser.$id);
      setIsLiked(hasUserLiked);

      // Only fetch collection name if collectionId exists
      if (fetchedPost.collectionId) {
        fetchCollectionName(fetchedPost.collectionId);
      }

      // Use authorId for profile fetching instead of username
      if (fetchedPost.authorId) {
        fetchUserProfile(fetchedPost.authorId); // authorId is treated as userId now
      }

      console.log("Fetched post:", fetchedPost);
      console.log("Collection ID in post:", fetchedPost.collectionId);
    } catch (err) {
      console.error("Error fetching post:", err);
      setError("Failed to load post");
    }
  };

  const fetchCollectionName = async (collectionId: string) => {
    if (!collectionId) return; // prevent call with undefined
    try {
      const collectionDoc = await databases.getDocument(
        databaseId,
        userCollect,
        collectionId
      );
      setCollection(collectionDoc);
      setCollectionName(collectionDoc.collectionName);
      console.log("userCollect from env:", userCollect);
    } catch (err) {
      console.error("Error fetching collection:", err);
      setCollectionName(null);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const currentUser = await account.get();
      setCurrentUser(currentUser);
      setUserId(currentUser.$id);
      setUserName(currentUser.name);
      setDisplayName(currentUser.prefs.displayName);

      const res = await databases.listDocuments(databaseId, collectionId, [
        Query.equal("userId", userId), // now matching against userId field
      ]);
      setUserProfile(res.documents[0] || null);

      console.log("Fetched user profile by ID:", res.documents[0]);
    } catch (err) {
      console.error("Error fetching user profile by ID:", err);
    }
  };

  const fetchSimilarArticles = async (tags: string[]) => {
    if (!tags.length) return;

    try {
      const response = await databases.listDocuments(databaseId, userArticles, [
        Query.limit(5),
        Query.orderDesc("$createdAt"),
      ]);

      const filtered = response.documents.filter((doc) => doc.$id !== postId);
      setSimilarArticles(filtered);

      // Fetch user profiles for each article and its preview
      const enriched = await Promise.all(
        filtered.map(async (article) => {
          try {
            const res = await databases.listDocuments(
              databaseId,
              collectionId,
              [Query.equal("userId", article.authorId)]
            );
            const userProfile = res.documents[0] || null;
            console.log("Fetched user profile:", userProfile);

            const preview = article.contentFileId
              ? await fetchArticlePreview(article.contentFileId)
              : "";

            return { ...article, userProfile, preview }; // Use local variable here
          } catch (err) {
            console.error(
              `Error fetching profile for ${article.authorId}:`,
              err
            );
            return { ...article, userProfile: null, preview: "" };
          }
        })
      );

      setEnrichedArticles(enriched); // Set the enriched articles with previews
    } catch (err) {
      console.error("Error fetching similar articles:", err);
    }
  };

  useEffect(() => {
    if (post?.tags) {
      const tagList = post.tags.split(",").map((tag: string) => tag.trim());
      fetchSimilarArticles(tagList);
    }
  }, [post]);

  const handleLikeClick = async () => {
    try {
      const currentUser = await account.get();

      if (!postId) {
        console.error("postId is undefined");
        alert("Error: No postId available");
        return;
      }

      // Get the current post details
      const currentPost = await databases.getDocument(
        databaseId,
        userArticles,
        postId
      );

      // Get the list of users who have liked the post
      const currentLikedBy = currentPost.likedBy || "";
      const likedByArray = currentLikedBy.split(",").filter(Boolean);

      if (!isLiked) {
        // Liking the post
        if (likedByArray.includes(currentUser.$id)) {
          alert("You’ve already liked this post.");
          return;
        }

        // Add the user to the likedBy array
        likedByArray.push(currentUser.$id);
        const updatedLikedBy = likedByArray.join(",");
        const newLikeCount = parseInt(currentPost.likeCount || "0") + 1;

        // Update the post with the new like count and likedBy array
        await databases.updateDocument(databaseId, userArticles, postId, {
          likeCount: newLikeCount.toString(),
          likedBy: updatedLikedBy,
        });

        // Create a new like document for the user
        await databases.createDocument(
          databaseId,
          userLikesArticles,
          "unique()",
          {
            likedBy: currentUser.name,
            postId: postId,
            likeCount: newLikeCount.toString(),
            createdAt: new Date().toISOString(),
            followId: currentUser.$id,
            imageFileId: post.coverUrl,
            postedBy: post.userName,
          }
        );

        // Update the state
        setIsLiked(true);
        setLikeCount(newLikeCount);

        console.log("Like document created:", {
          likedBy: currentUser.name,
          postId: postId,
          likeCount: newLikeCount.toString(),
          createdAt: new Date().toISOString(),
          followId: currentUser.$id,
          imageFileId: post.coverUrl,
          postedBy: post.userName,
        });
      } else {
        // Unliking the post
        const newLikedByArray = likedByArray.filter(
          (id: string) => id !== currentUser.$id
        );
        const updatedLikedBy = newLikedByArray.join(",");
        const newLikeCount = Math.max(
          0,
          parseInt(currentPost.likeCount || "0") - 1
        );

        // Update the post with the new like count and likedBy array
        await databases.updateDocument(databaseId, userArticles, postId, {
          likeCount: newLikeCount.toString(),
          likedBy: updatedLikedBy,
        });

        // Find the like document associated with this user and post
        const likeDocument = await databases.listDocuments(
          databaseId,
          userLikesArticles,
          [
            Query.equal("followId", currentUser.$id),
            Query.equal("postId", postId),
          ]
        );

        if (likeDocument.documents.length > 0) {
          const likeDocId = likeDocument.documents[0].$id; // Get the document ID
          console.log("Deleting like document with ID:", likeDocId);

          // Delete the "like" document using its unique ID
          await databases.deleteDocument(
            databaseId,
            userLikesArticles,
            likeDocId
          );
        } else {
          console.log("No like document found for this user and post.");
        }

        // Update the state
        setIsLiked(false);
        setLikeCount(newLikeCount);
      }
    } catch (error) {
      console.error("Error liking/unliking article:", error);
      alert("Failed to like/unlike the article");
    }
  };

  useEffect(() => {
    if (postId) {
      fetchPostById(postId);
    }
  }, [postId]);

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

  const fetchHtmlContent = async (fileId: string) => {
    try {
      const fileUrl = storage.getFileView(
        import.meta.env.VITE_BUCKET_POST,
        fileId
      );
      const response = await fetch(fileUrl);
      const html = await response.text();
      setHtmlContent(html);
    } catch (err) {
      console.error("Failed to load HTML content:", err);
      setHtmlContent("<p>Failed to load content.</p>");
    }
  };

  useEffect(() => {
    if (post?.contentFileId) {
      fetchHtmlContent(post.contentFileId);
    }
  }, [post]);

  const getFormattedDate2 = (createdAt?: string) => {
    if (!createdAt) return "Unknown time";
    try {
      return format(new Date(createdAt), "MMMM d, yyyy");
    } catch {
      return "Invalid date";
    }
  };

  const handleUserClick = () => {
    if (!post) return; // prevent null access

    if (post.userId === userId) {
      navigate(`/Profile/`);
    } else {
      navigate(`/User/${post.userName}`);
    }
  };

  if (error) return <div>{error}</div>;
  if (!post) return <div>Loading post...</div>;

  return (
    <div className="container4">
      <div className="inside-articles">
        <div className="articles-photos">
          {post.coverUrl && (
            <img src={post.coverUrl} alt="Cover" className="cover" />
          )}
        </div>
        <div className="bottom-articles">
          <div className="left">
            <div className="like-section">
              {currentUser && post.userId !== currentUser.$id && (
                <button
                  onClick={handleLikeClick}
                  className="liked-button-2"
                  disabled={false} // Button is never disabled now, users can toggle the like
                  style={{ color: isLiked ? "red" : "blue" }}
                  title={
                    isLiked
                      ? "You’ve liked this post"
                      : "Click to like this post"
                  }
                >
                  <img
                    src={isLiked ? HeartIcon : HeartOutlineIcon}
                    alt={isLiked ? "Liked" : "Not liked"}
                  />
                </button>
              )}

              <p>
                {likeCount} {likeCount === 1 ? "Hearts" : "Hearts"}
              </p>
            </div>
          </div>
          <div className="right-articles">
            <div className="header-and-articles">
              <div className="header-article">
                <h1>{post.title}</h1>
              </div>
              <div className="by-articles-author">
                <div className="by-credit-author">
                  <div className="image-user" onClick={handleUserClick}>
                    {userProfile?.profilePictureId && (
                      <img
                        src={
                          userProfile?.profilePictureId
                            ? getProfilePictureUrl(userProfile.profilePictureId)
                            : "/default-avatar.png"
                        }
                        alt="Profile"
                        onError={(e) =>
                          (e.currentTarget.src = "/default-avatar.png")
                        }
                        className="profile-picture"
                      />
                    )}
                  </div>
                  <div className="user-images">
                    <h4
                      onClick={handleUserClick}
                      style={{ position: "relative", top: "4px" }}
                    >
                      {post.userName || "Unnamed Collection"}
                    </h4>
                    <p style={{ position: "relative", bottom: "4px" }}>
                      {userProfile?.bioId || "unknow bio"}
                    </p>
                  </div>
                </div>
                <div className="follow-id">
                  {currentUser &&
                    post.authorId &&
                    post.authorId !== currentUser.$id && (
                      <FollowUserButton
                        followId={post.authorId ?? ""}
                        userId={currentUser.$id ?? ""}
                        currentUser={currentUser}
                      />
                    )}
                </div>
              </div>
            </div>

            <div className="articles-info-stuf">
              <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </div>
            <div className="tags-post-dates">
              <div className="insider-both">
                <div className="d">
                  <p>
                    {" "}
                    {post.tags.split(",").map((tag: string, index: number) => (
                      <span key={index} className="tags-style-article">
                        {tag.trim()}{" "}
                      </span>
                    ))}
                  </p>
                </div>
              </div>
            </div>

            <div className="date-posted-on">
              posted to{" "}
              {collection ? (
                <Link
                  to={`/CollectionImages/${collection.$id}`}
                  style={{ color: "#4a4a4a", textDecoration: "underline" }}
                >
                  <p>{collection.collectionName || "Unnamed Collection"}</p>
                </Link>
              ) : (
                <span>Collection: Not found</span>
              )}
              on{" "}
              <div className="time" style={{ color: "#4a4a4a" }}>
                {post.createdAt ? (
                  <p>{getFormattedDate2(post.createdAt)}</p>
                ) : (
                  <p>Loading time...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="similaire-articles">
        <div className="articles-sec">
          <div className="titles-sec">Similar Articles</div>
          <div className="article-sections">
            <div className="sections">
              {enrichedArticles.length > 0 ? (
                enrichedArticles.map((article) => {
                  return (
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
                            <div
                              className="image-user"
                              onClick={handleUserClick}
                            >
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

                            {/* Render preview for the current article from enrichedArticles */}
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
                  );
                })
              ) : (
                <p>No similar articles found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserArticles;
