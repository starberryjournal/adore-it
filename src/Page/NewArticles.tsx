import { Link, useNavigate } from "react-router-dom";
import { databases, Query, storage } from "../appwrite";
import { useEffect, useState } from "react";
import { format } from "date-fns"; // If you're formatting dates

const NewArticles: React.FC = () => {
  const [enrichedArticles, setEnrichedArticles] = useState<any[]>([]);
  const [, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const bucketId = import.meta.env.VITE_BUCKET_PFPBG;
  const postBucket = import.meta.env.VITE_BUCKET_POST;
  const userArticles = import.meta.env.VITE_USER_ARTICLES;
  const userProfiles = import.meta.env.VITE_USER_PREF_COLLECTION_ID;
  const userId = "CURRENT_USER_ID"; // Replace with logic to get user ID

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await databases.listDocuments(
          databaseId,
          userArticles,
          [Query.orderDesc("$createdAt"), Query.limit(3)]
        );

        const enriched = await Promise.all(
          response.documents.map(async (article) => {
            try {
              const res = await databases.listDocuments(
                databaseId,
                userProfiles,
                [Query.equal("userId", article.authorId)]
              );
              const userProfile = res.documents[0] || null;
              console.log("Trying to match authorId:", article.authorId);

              const preview = article.contentFileId
                ? await fetchArticlePreview(article.contentFileId)
                : "";

              return { ...article, userProfile, preview };
            } catch (err) {
              console.error(`Error enriching article ${article.$id}:`, err);
              return { ...article, userProfile: null, preview: "" };
            }
          })
        );

        setEnrichedArticles(enriched);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const fetchArticlePreview = async (fileId: string): Promise<string> => {
    try {
      const fileUrl = storage.getFileView(postBucket, fileId);
      const response = await fetch(fileUrl);
      const html = await response.text();

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      const text = tempDiv.textContent || tempDiv.innerText || "";
      const cleanText = text.replace(/\s+/g, " ").trim();

      return cleanText.length > 100
        ? cleanText.slice(0, 100) + "..."
        : cleanText;
    } catch (err) {
      console.error("Failed to fetch or parse preview:", err);
      return "";
    }
  };

  const getProfilePictureUrl = (fileId: string) => {
    const url = storage.getFileView(bucketId, fileId);
    return url;
  };

  const getFormattedDate = (createdAt?: string) => {
    if (!createdAt) return "Unknown time";
    try {
      return format(new Date(createdAt), "MMMM d, yyyy");
    } catch {
      return "Invalid date";
    }
  };

  const handleUserClick = (post: any) => {
    if (!post) return;
    if (post.userId === userId) {
      navigate(`/Profile/`);
    } else {
      navigate(`/User/${post.userName}`);
    }
  };

  return (
    <div className="articles-sec">
      <div className="title-sec">
        <p>New Articles</p>
      </div>
      <div className="article-sections">
        <div className="sections-2">
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
                        <div className="image-user" onClick={handleUserClick}>
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
                          {getFormattedDate(article.createdAt)}
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
  );
};

export default NewArticles;
