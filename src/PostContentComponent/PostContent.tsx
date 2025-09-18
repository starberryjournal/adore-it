import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { account, databases, Query } from "../appwrite";
import "./PostContent.css";
import FollowUserButton from "../Components/FollowUserButton";
import LikAndCollect from "../Components/LikeAndCollect";
import StaticGif from "../Components/StaticGif";
import ImageCollectionInfo from "../Components/ImageCollectionInfo";
import { format } from "date-fns";
import { useCurrentUser } from "../Components/useCurrentUser";
import { useNavigation } from "../Components/NavigationContext";

interface State {
  $createdAt: string;
  likedBy?: any[];
  likeCount?: string | number;
  description: string;
  imageSrc: string;
  tags: string;
  userName: string;
  followId: string;
  collectionName: string;
  displayName: string;
  postId: string;
  image: string;
  imageId: string;
  userId: string;
  links: string;
  id: string;
  $id: string;
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
  displayName: string;
  prefs: Preferences;
}

interface Post {
  $id: string;
  imageFileId?: string;
  followId?: string;
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
  fileName?: string;
  createdAt?: string;
  likedBy?: any[];
  postedBy?: string;
  currentUser?: string;
  imageSrc?: string;
  likeCount?: string | number;
  links?: string;
  $createdAt?: string;
  id?: string;
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
  likeCount: string;
}

const PostContent: React.FC = () => {
  const { id: currentPostId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as State;
  const { user: currentUser } = useCurrentUser();
  const { isNavigating, setIsNavigating } = useNavigation();

  const [currentPost, setCurrentPost] = useState<Post>({
    ...state,
    id: state.id,
    createdAt: state.$createdAt,
    imageSrc: state.imageSrc,
  });

  const [isPageLoading, setIsPageLoading] = useState(true);
  const [relatedImages, setRelatedImages] = useState<Post[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [likedImages, setLikedImages] = useState<string[]>([]);
  const [likedCollect, setLikedCollect] = useState<AppImage[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [showActionMenu, setShowActionMenu] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [similarImages, setSimilarImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const userPostId = import.meta.env.VITE_USER_POST_COLLECTION_ID;
  const collectionId = import.meta.env.VITE_USER_PREF_COLLECTION_ID;

  if (!currentPostId) {
    return <p>Post not found.</p>; // or redirect, or loading spinner
  }

  const updateCurrentPost = async (postId: string) => {
    try {
      const doc = await databases.getDocument(databaseId, userPostId, postId);
      setCurrentPost({
        ...doc,
        id: doc.$id,
        imageSrc: `http://localhost:3000/image/${doc.imageFileId}`,
        createdAt: doc.createdAt || doc.$createdAt,
      });
      const postLinks = doc.links;
      setLinks(
        typeof postLinks === "string" ? postLinks.split(", ") : postLinks || []
      );
    } catch (err) {
      console.error("Error updating current post:", err);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const user = await account.get();
        setUserId(user.$id);

        // 🔹 Always fetch the post from Appwrite using currentPostId (even if you passed state)
        const postDoc = await databases.getDocument(
          databaseId,
          userPostId,
          currentPostId
        );

        setCurrentPost({
          ...postDoc,
          id: postDoc.$id,
          imageSrc: `http://localhost:3000/image/${postDoc.imageFileId}`,
          createdAt: postDoc.createdAt || postDoc.$createdAt,
        });

        // 🔹 Load links
        const postLinks = postDoc.links;
        setLinks(
          typeof postLinks === "string"
            ? postLinks.split(", ")
            : postLinks || []
        );

        // 🔹 Related images by tag
        const allPosts = await databases.listDocuments(databaseId, userPostId, [
          Query.orderDesc("createdAt"),
          Query.limit(100), // Adjust as needed
        ]);
        if (postDoc.tags) {
          const tagsArray: string[] = postDoc.tags
            .split(",")
            .map((tag: string) => tag.trim().toLowerCase())
            .filter((tag: string) => tag.length > 0);

          const filtered = allPosts.documents
            .filter((doc) => {
              if (doc.$id === postDoc.$id) return false;

              const docTags = doc.tags
                ?.split(",")
                .map((tag: string) => tag.trim().toLowerCase());

              // Count how many tags match
              const matchCount = tagsArray.filter((tag) =>
                docTags?.includes(tag)
              ).length;

              // Only keep posts with two or more matches
              return matchCount >= 2;
            })
            .map((doc) => ({
              ...doc,
              imageSrc: `http://localhost:3000/image/${doc.imageFileId}`,
            }));

          setRelatedImages(filtered);
        }

        // 🔹 User profile info
        const profileRes = await databases.listDocuments(
          databaseId,
          collectionId,
          [Query.equal("userId", postDoc.userId)]
        );
        setUserProfile(profileRes.documents[0] || null);

        // 🔹 Likes (to get liked imageIds and details)
        const likedRes = await databases.listDocuments(databaseId, userPostId, [
          Query.equal("userId", user.$id),
          Query.equal("postId", currentPostId),
        ]);

        const imageIds = likedRes.documents.map((doc) => doc.imageId);
        setLikedImages(imageIds);

        const likedDetails = await Promise.all(
          imageIds.map((id) =>
            databases.getDocument(databaseId, userPostId, id)
          )
        );

        const likedMapped: AppImage[] = likedDetails.map((doc) => ({
          $id: doc.$id,
          imageFileId: doc.imageFileId,
          fileName: doc.fileName,
          postId: doc.postId,
          createdAt: doc.createdAt,
          collectionId: doc.collectionId,
          userName: doc.userName,
          collectionName: doc.collectionName,
          tags: doc.tags,
          links: doc.links,
          postedBy: doc.postedBy,
          likeCount: doc.likeCount,
        }));

        setLikedCollect(likedMapped);
      } catch (err) {
        console.error("Error loading post data:", err);
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchAll();
  }, [currentPostId]);

  useEffect(() => {
    if (!isPageLoading && isNavigating) {
      setIsNavigating(false);
    }
  }, [isPageLoading, isNavigating]);

  if (!currentPostId) {
    return <p>Post not found.</p>;
  }

  if (isPageLoading || !currentUser || !currentPost.userId) {
    return (
      <div className="page-loader">
        <span className="loader"></span>
      </div>
    );
  }

  const getFormattedDate = (createdAt?: string) => {
    if (!createdAt) return "Unknown time";
    try {
      return format(new Date(createdAt), "MMMM d, yyyy 'at' h:mm a");
    } catch {
      return "Invalid date";
    }
  };

  const handleUserClick = () => {
    if (state.userId === userId) {
      navigate(`/Profile/`, { state: { userId, followId: state.followId } });
    } else {
      navigate(`/User/${currentPost.userName}`, {
        state: { userId, followId: currentPost.followId },
      });
    }
  };

  const nextImage = () => {
    const idx = relatedImages.findIndex((p) => p.$id === currentPost.id);
    const nextIdx = (idx + 1) % relatedImages.length;
    updateCurrentPost(relatedImages[nextIdx].$id);
  };

  const prevImage = () => {
    const idx = relatedImages.findIndex((p) => p.$id === currentPost.id);
    const prevIdx = idx === 0 ? relatedImages.length - 1 : idx - 1;
    updateCurrentPost(relatedImages[prevIdx].$id);
  };

  const handleDeletePost = async () => {
    if (!currentPost?.id || currentUser?.$id !== currentPost.userId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this post?"
    );
    if (!confirmed) return;

    try {
      await databases.deleteDocument(databaseId, userPostId, currentPost.id);
      navigate("/Profile", { state: { userId: currentUser.$id } }); // or any other route
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Failed to delete the post. Please try again.");
    }
  };

  const handleImageClick = (post: Post) => {
    setIsPageLoading(true); // <-- Trigger loading immediately
    setIsNavigating(true);

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });

      navigate(`/Post/${post.$id}`, {
        state: {
          ...post,
          imageSrc: `http://localhost:3000/image/${post.imageFileId}`,
          id: post.$id,
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
        },
      });
    }, 100); // small delay to ensure loader and scroll work
  };

  return (
    <div className="background-color">
      {isNavigating && (
        <div className="page-loader-overlay">
          <span className="loader"></span>
        </div>
      )}
      <div className="container3">
        <div className="contents-container">
          <div className="top-contenent">
            <div className="left-side-cont">
              <button onClick={() => navigate(-1)} className="boutton-exit">
                <img
                  src="/src/assets/SVG/dismiss-svgrepo-comCopie.svg"
                  alt="Back"
                  className="svg-exit"
                />
              </button>
            </div>

            <div className="center-side">
              <div className="middle-side">
                <div className="top-content-user">
                  <div className="user-div">
                    <div className="left-user-info" onClick={handleUserClick}>
                      <div className="profile-picture">
                        {userProfile?.profilePictureId && (
                          <img
                            src={`http://localhost:3000/profilePicture/${userProfile.profilePictureId}`}
                            alt="Profile"
                          />
                        )}
                      </div>
                      <div
                        className="user-Namea"
                        onClick={() =>
                          navigate(`/User/${currentPost.userName}`)
                        }
                      >
                        <p>{currentPost.displayName}</p>
                        <p className="under-username">
                          @{currentPost.userName}
                        </p>
                      </div>
                    </div>
                    <div className="follow-id">
                      {currentUser &&
                        currentPost.userId !== currentUser.$id && (
                          <FollowUserButton
                            followId={currentPost.followId ?? ""}
                            userId={currentPost.userId ?? ""}
                            currentUser={currentUser}
                          />
                        )}
                    </div>
                  </div>

                  <div className="post-descriptions">
                    <p>{currentPost.description}</p>
                  </div>

                  <div className="post-link">
                    {links.map((link, idx) => (
                      <a
                        key={idx}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link}
                      </a>
                    ))}
                  </div>
                  <div className="liked-and-collect">
                    {currentPost.imageId &&
                      currentPost.userId &&
                      currentPost.postId && (
                        <LikAndCollect
                          imageId={currentPost.imageId}
                          likedOwnerId={currentUser.$id} // ✅ This is the poster’s ID
                          postId={currentPost.$id}
                          likeCount={Number(currentPost.likeCount ?? 0)}
                          imageFileId={currentPost.imageFileId ?? ""}
                          image={{
                            $id: currentPost.imageId,
                            imageFileId: currentPost.imageFileId ?? "",
                            fileName: currentPost.fileName ?? "",
                            postId: currentPost.$id ?? "",
                            createdAt: currentPost.createdAt ?? "",
                            collectionId: currentPost.collectionId ?? "",
                            userName: currentPost.userName ?? "",
                            collectionName: currentPost.collectionName ?? "",
                            description: currentPost.description ?? "",
                            tags: currentPost.tags ?? "",
                            postedBy: currentPost.userName ?? "",
                            userId: currentPost.userId ?? "",
                            likeCount: Number(currentPost.likeCount ?? 0),
                          }}
                          userName={currentPost.userName ?? ""}
                          displayName={currentPost.displayName ?? ""}
                          imageUrl={currentPost.imageSrc ?? ""}
                          userId={currentPost.userId ?? ""}
                          tags={currentPost.tags ?? ""}
                          description={currentPost.description ?? ""}
                        />
                      )}
                    <div className="d">
                      <button
                        className="edit-post-button"
                        onClick={() => setShowActionMenu((prev) => !prev)}
                      >
                        <svg
                          width="27px"
                          height="27px"
                          viewBox="0 -0.5 49 49"
                          fill="none"
                        >
                          <path
                            d="M15.7515 24C15.7515 25.7949 14.2964 27.25 12.5015 27.25C10.7065 27.25 9.25146 25.7949 9.25146 24C9.25146 22.2051 10.7065 20.75 12.5015 20.75C14.2964 20.75 15.7515 22.2051 15.7515 24Z"
                            fill="#212121"
                          />
                          <path
                            d="M27.2515 24C27.2515 25.7949 25.7964 27.25 24.0015 27.25C22.2065 27.25 20.7515 25.7949 20.7515 24C20.7515 22.2051 22.2065 20.75 24.0015 20.75C25.7964 20.75 27.2515 22.2051 27.2515 24Z"
                            fill="#212121"
                          />
                          <path
                            d="M35.5015 27.25C37.2964 27.25 38.7515 25.7949 38.7515 24C38.7515 22.2051 37.2964 20.75 35.5015 20.75C33.7065 20.75 32.2515 22.2051 32.2515 24C32.2515 25.7949 33.7065 27.25 35.5015 27.25Z"
                            fill="#212121"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                {showActionMenu && (
                  <div className="open-action">
                    <div className="inside-action-open">
                      {currentUser?.$id === currentPost.userId && (
                        <div
                          className="sections-open"
                          onClick={() => {
                            setShowActionMenu(false);
                            setTimeout(() => setShowDeleteModal(true), 200);
                          }}
                        >
                          <p style={{ color: "#f60000ff" }}>Deleted</p>
                        </div>
                      )}

                      {currentUser?.$id === currentPost.userId && (
                        <div
                          className="sections-open"
                          onClick={() => {
                            setShowActionMenu(false); // hide the dropdown
                            setShowEditPanel(true); // show the modify panel
                          }}
                        >
                          Modify
                        </div>
                      )}

                      <div className="sections-open">Share</div>
                      <div
                        className="sections-open"
                        onClick={() => setShowActionMenu(false)}
                      >
                        Cancel
                      </div>
                    </div>
                  </div>
                )}

                {showDeleteModal && (
                  <div className="modal-overlay2">
                    <div className="modal2">
                      <h2>Delete Post</h2>
                      <p>
                        Are you sure you want to delete this post? This action
                        cannot be undone.
                      </p>
                      <div className="modal-buttons2">
                        <button
                          className="confirm-btn"
                          onClick={async () => {
                            if (!currentPost?.id) return; // ✅ Prevent undefined error

                            setIsDeleting(true);
                            try {
                              await databases.deleteDocument(
                                databaseId,
                                userPostId,
                                currentPost.id
                              );
                              navigate("/Profile", {
                                state: { userId: currentUser?.$id },
                              });
                            } catch (err) {
                              console.error("Error deleting post:", err);
                              alert("Failed to delete the post.");
                            } finally {
                              setIsDeleting(false);
                              setShowDeleteModal(false);
                            }
                          }}
                          disabled={isDeleting}
                        >
                          {isDeleting ? "Deleting..." : "Yes, delete"}
                        </button>
                        <button
                          className="cancel-btn"
                          onClick={() => setShowDeleteModal(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {showEditPanel && (
                  <div className="edit-modal-overlay">
                    <div className="edit-modal">
                      <h2>Edit Post</h2>

                      <label>Description</label>
                      <textarea
                        value={currentPost.description}
                        onChange={(e) =>
                          setCurrentPost((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                      />

                      <label>Tags (comma separated)</label>
                      <input
                        type="text"
                        value={currentPost.tags}
                        onChange={(e) =>
                          setCurrentPost((prev) => ({
                            ...prev,
                            tags: e.target.value,
                          }))
                        }
                      />

                      <label>Links (comma separated)</label>
                      <input
                        type="text"
                        value={links.join(", ")}
                        onChange={(e) =>
                          setLinks(
                            e.target.value.split(",").map((s) => s.trim())
                          )
                        }
                      />

                      <div className="edit-buttons">
                        <button
                          className="save-btn"
                          onClick={async () => {
                            try {
                              await databases.updateDocument(
                                databaseId,
                                userPostId,
                                currentPost.id!,
                                {
                                  description: currentPost.description,
                                  tags: currentPost.tags,
                                  links: links.join(", "),
                                }
                              );
                              setShowSuccessModal(true);
                              setTimeout(
                                () => setShowSuccessModal(false),
                                3000
                              ); // auto-close after 3s

                              setShowEditPanel(false);
                            } catch (err) {
                              console.error("Error updating post:", err);
                              alert("Failed to update post.");
                            }
                          }}
                        >
                          Save Changes
                        </button>
                        <button
                          className="cancel-btn"
                          onClick={() => setShowEditPanel(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {showSuccessModal && (
                  <div className="modal-overlay2">
                    <div className="modal2">
                      <h3>Post Updated</h3>
                      <p>Your post was updated successfully.</p>
                      <button
                        className="confirm-btn"
                        onClick={() => setShowSuccessModal(false)}
                      >
                        OK
                      </button>
                    </div>
                  </div>
                )}

                <div className="main-image">
                  <div className="image-center">
                    <img src={currentPost.imageSrc} alt="Post" />
                  </div>
                </div>
              </div>
            </div>

            <div className="right-side">
              <div className="left-right-swit">
                <button onClick={prevImage} className="left-arrow-2">
                  ←
                </button>
                <button onClick={nextImage} className="right-arrow-2">
                  →
                </button>
              </div>
              <div className="tags-right">
                <div className="tags-sections">
                  <div className="top-tag">Tagged with</div>
                  <div className="tags-side">
                    {currentPost.tags
                      ?.split(", ")
                      .filter((tag) => tag.trim() !== "")
                      .map((tag: string) => (
                        <span
                          key={tag}
                          className="tags-style"
                          onClick={() => navigate(`/TagPosts/${tag}`)}
                        >
                          {tag}
                        </span>
                      ))}
                  </div>
                </div>
              </div>

              <div className="time">
                {currentPost.createdAt ? (
                  <p>{getFormattedDate(currentPost.createdAt)}</p>
                ) : (
                  <p>Loading time...</p>
                )}
              </div>
            </div>
          </div>
          <div className="bottom-content">
            <div className="bottom-1">
              <div className="image-in-collection">
                {currentPost?.$id && (
                  <ImageCollectionInfo postId={currentPost.$id} />
                )}
              </div>
            </div>
            {relatedImages.length > 0 && (
              <div className="">
                <div className="bottom-2">
                  <h2>You might like these too</h2>
                  <div className="more-images">
                    {relatedImages.map((post) =>
                      post.fileName?.toLowerCase().endsWith(".gif") ? (
                        <StaticGif
                          gifUrl={post.imageFileId!}
                          alt="Post"
                          onClick={() => handleImageClick(post)}
                          showGifLabel={post.fileName
                            ?.toLowerCase()
                            .endsWith(".gif")}
                          className="image-collect"
                        />
                      ) : (
                        <img
                          src={`http://localhost:3000/image/${post.imageFileId}`}
                          alt="Post"
                          onClick={() => handleImageClick(post)}
                          className="image-collect"
                        />
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostContent;
