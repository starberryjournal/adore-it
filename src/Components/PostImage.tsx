import React, { useState, useEffect, useRef } from "react";
import { databases, Query } from "../appwrite";
import { useNavigate } from "react-router-dom";

import "../Components/TablePage.css";
import FollowUserButton from "./FollowUserButton";
import { formatDistanceToNow } from "date-fns";
import { useCurrentUser } from "./useCurrentUser";
import LikeCollectShare from "./LikeCollectShare";
import StaticGif from "./StaticGif";
import Pagination from "./Pagination";

import ViewIcon from "/src/assets/SVG/inspect-svgrepo-com.svg";

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

const PAGE_SIZE = 12;

const Tabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState("latest");

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="tabs-containers">
      <div className="tab-user-search">
        <div className="tittle-sec">
          <p>New</p>
        </div>

        <div className="stuck-tabs2">
          <div
            className={`tabs6 ${activeTab === "latest" ? "active" : ""}`}
            onClick={() => handleTabClick("latest")}
          >
            Hearts
          </div>
          <div
            className={`tabs6 ${activeTab === "popular" ? "active" : ""}`}
            onClick={() => handleTabClick("popular")}
          >
            Images
          </div>
          <div
            className={`tabs6 ${activeTab === "collections" ? "active" : ""}`}
            onClick={() => handleTabClick("collections")}
          >
            last week
          </div>
          <div
            className={`tabs6 ${activeTab === "hearers" ? "active" : ""}`}
            onClick={() => handleTabClick("hearers")}
          >
            last month
          </div>
        </div>
      </div>

      <div className="tab-contentss">
        {activeTab === "latest" && <LatestPictures />}
        {activeTab === "popular" && <PopularPictures />}
        {activeTab === "collections" && <Collections />}
        {activeTab === "hearers" && <Hearters />}
      </div>
    </div>
  );
};

const LatestPictures: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useCurrentUser();

  const [posts, setPosts] = useState<Post[]>([]);
  const [, setUserProfile] = useState<Post | null>(null);
  const [, setLikedCollect] = useState<AppImage[]>([]);
  const [likedImages] = useState<string[]>([]);
  const [userId] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [lastDocument, setLastDocument] = useState<any | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPostCount, setTotalPostCount] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const [useInfiniteScroll, setUseInfiniteScroll] = useState(true);

  const loaderRef = useRef<HTMLDivElement | null>(null);

  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const userPostCollection = import.meta.env.VITE_USERL_IKE;
  const userPrefCollection = import.meta.env.VITE_USER_PREF_COLLECTION_ID;
  const likeCollectionId = import.meta.env.VITE_USERL_IKE;
  const totalPages = Math.ceil(totalPostCount / PAGE_SIZE);

  // Format date into relative time
  const getTimeAgo = (date?: string) =>
    date
      ? formatDistanceToNow(new Date(date), { addSuffix: true }).replace(
          "about ",
          ""
        )
      : "Unknown time";

  // -------------------- Utility Functions --------------------
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0); // midnight

  const fetchAllPosts = async () => {
    const queries = [
      Query.orderDesc("likeCount"),
      Query.orderDesc("createdAt"),
    ]; // No limit
    const { posts } = await fetchPosts(queries);
    setPosts(posts);
  };

  const enrichPostWithProfile = async (post: any) => {
    try {
      const profileRes = await databases.listDocuments(
        databaseId,
        userPrefCollection,
        [Query.equal("userId", post.userId)]
      );
      const profilePictureId = profileRes.documents[0]?.profilePictureId ?? "";
      return { ...post, profilePictureId };
    } catch {
      return { ...post, profilePictureId: "" };
    }
  };

  const fetchPosts = async (
    queries: any[]
  ): Promise<{ posts: any[]; lastDoc: any }> => {
    const res = await databases.listDocuments(
      databaseId,
      userPostCollection,
      queries
    );
    const enrichedPosts = await Promise.all(
      res.documents.map(enrichPostWithProfile)
    );
    const lastDoc = res.documents.at(-1);
    return { posts: enrichedPosts, lastDoc };
  };

  // -------------------- Fetch Posts By Page --------------------
  const fetchPostsByPage = async (page: number) => {
    setLoading(true);
    setHasMore(true);
    let allPosts: any[] = [];
    let lastDoc = null;

    for (let i = 1; i <= page; i++) {
      const queries = [Query.limit(PAGE_SIZE), Query.orderDesc("createdAt")];
      if (lastDoc) queries.push(Query.cursorAfter(lastDoc.$id));

      const { posts, lastDoc: newLastDoc } = await fetchPosts(queries);

      if (posts.length === 0) {
        setHasMore(false);
        break;
      }

      allPosts = posts;
      lastDoc = newLastDoc;
    }

    setPosts(allPosts);
    setLastDocument(lastDoc);
    setCurrentPage(page);
    setLoading(false);
  };

  // -------------------- Fetch More Posts --------------------
  const fetchMorePosts = async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    const queries = [Query.limit(PAGE_SIZE), Query.orderDesc("createdAt")];
    if (lastDocument) queries.push(Query.cursorAfter(lastDocument.$id));

    try {
      const { posts, lastDoc } = await fetchPosts(queries);

      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.$id));
        const newPosts = posts.filter((p) => !existingIds.has(p.$id));
        return [...prev, ...newPosts];
      });

      setLastDocument(lastDoc);
      setCurrentPage((prev) => prev + 1);
      setHasMore(posts.length >= PAGE_SIZE);
    } catch (err) {
      console.error("Error fetching more posts:", err);
    } finally {
      setLoading(false);
    }
  };

  // -------------------- Fetch Total Count --------------------
  useEffect(() => {
    const fetchTotalCount = async () => {
      try {
        const res = await databases.listDocuments(
          databaseId,
          userPostCollection,
          []
        );
        setTotalPostCount(res.total ?? 0);
      } catch (e) {
        console.error("Error fetching total count:", e);
      }
    };
    fetchTotalCount();
  }, []);

  // -------------------- Initial Load --------------------
  useEffect(() => {
    fetchPostsByPage(1);
  }, []);

  useEffect(() => {
    fetchAllPosts();
  }, []);

  // -------------------- Infinite Scroll --------------------
  useEffect(() => {
    if (!useInfiniteScroll || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          fetchMorePosts();
        }
      },
      { root: null, rootMargin: "0px", threshold: 1.0 }
    );

    const target = loaderRef.current;
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
      observer.disconnect();
    };
  }, [hasMore, loading, useInfiniteScroll]);

  // -------------------- Fetch User Profile --------------------
  useEffect(() => {
    if (!userId) return;

    const fetchUserProfile = async () => {
      try {
        const response = await databases.listDocuments(
          databaseId,
          userPrefCollection,
          [Query.equal("userId", userId)]
        );
        const doc = response.documents[0];
        if (doc) {
          setUserProfile({
            ...doc,
            profilePictureId: doc.profilePictureId ?? "",
          });
        }
        console.log("Fetching profile for userId:", userId);
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    };

    fetchUserProfile();
  }, [userId]);

  // -------------------- Fetch Liked Images --------------------
  useEffect(() => {
    if (likedImages.length === 0) return;

    const fetchLikedImages = async () => {
      setLoading(true);
      try {
        const likedDocs = await Promise.all(
          likedImages.map((id) =>
            databases.getDocument(databaseId, likeCollectionId, id)
          )
        );

        const likedData: AppImage[] = likedDocs.map((doc: any) => ({
          $id: doc.$id,
          imageFileId: doc.imageFileId ?? "",
          fileName: doc.fileName ?? "",
          postId: doc.postId ?? "",
          createdAt: doc.createdAt ?? "",
          collectionId: doc.collectionId ?? "",
          collectionName: doc.collectionName ?? "",
          userName: doc.userName ?? "",
          links: doc.links ?? "",
          tags: doc.tags ?? "",
          postedBy: doc.postedBy ?? "",
          likeCount: doc.likeCount ?? 0,
        }));

        setLikedCollect(likedData);
      } catch (err) {
        console.error("Error fetching liked images:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedImages();
  }, [likedImages]);

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

  // Pagination button clicked
  const handlePageChange = (page: number) => {
    const clampedPage = Math.min(Math.max(1, page), totalPages || 1);
    setUseInfiniteScroll(false);
    fetchPostsByPage(clampedPage);
    scrollToTop();
  };

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 300);

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const pageRefs = useRef(new Map<number, HTMLElement>());

  const observePage = (el: HTMLElement | null, pageNum: number) => {
    if (el && !pageRefs.current.has(pageNum)) {
      pageRefs.current.set(pageNum, el);
      observerRef.current?.observe(el);
    }
  };
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageEntry = [...pageRefs.current.entries()].find(
              ([_, el]) => el === entry.target
            );
            if (pageEntry) {
              setCurrentPage(pageEntry[0]);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.5, // At least 50% of the post block should be visible
      }
    );

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="d">
      <div className="gallery">
        {posts.map((post, index) => {
          const isPageStart = index % PAGE_SIZE === 0;
          const pageNum = Math.floor(index / PAGE_SIZE) + 1;

          return (
            <div
              key={post.$id}
              className="post-picture1"
              ref={isPageStart ? (el) => observePage(el, pageNum) : null}
            >
              <div className="d">
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
                      {currentUser && post.userId !== currentUser.$id && (
                        <FollowUserButton
                          followId={post.userId ?? ""}
                          userId={currentUser.$id ?? ""}
                          currentUser={currentUser}
                        />
                      )}
                    </div>
                  </div>

                  <div
                    className="left-saved"
                    onClick={() => handleImageClick(post)}
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
                      onClick={() => handleImageClick(post)}
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
                      src={`http://localhost:3000/image/${post.imageFileId}`}
                      alt="Post"
                      onClick={() => handleImageClick(post)}
                      className="image-collect"
                    />
                  ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="">
        <div ref={loaderRef} style={{ height: 1 }} />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages || 1}
          onPageChange={handlePageChange}
        />

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

const PopularPictures: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useCurrentUser();

  const [posts, setPosts] = useState<Post[]>([]);
  const [, setUserProfile] = useState<Post | null>(null);
  const [, setLikedCollect] = useState<AppImage[]>([]);
  const [likedImages] = useState<string[]>([]);
  const [userId] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [lastDocument, setLastDocument] = useState<any | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPostCount, setTotalPostCount] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const [useInfiniteScroll, setUseInfiniteScroll] = useState(true);

  const loaderRef = useRef<HTMLDivElement | null>(null);

  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const userPostCollection = import.meta.env.VITE_USER_POST_COLLECTION_ID;
  const userPrefCollection = import.meta.env.VITE_USER_PREF_COLLECTION_ID;
  const likeCollectionId = import.meta.env.VITE_USERL_IKE;
  const totalPages = Math.ceil(totalPostCount / PAGE_SIZE);

  // Format date into relative time
  const getTimeAgo = (date?: string) =>
    date
      ? formatDistanceToNow(new Date(date), { addSuffix: true }).replace(
          "about ",
          ""
        )
      : "Unknown time";

  // -------------------- Utility Functions --------------------
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const startTimestamp = Math.floor(startOfYesterday.getTime() / 1000); // midnight yesterday
  const endTimestamp = Math.floor(startOfToday.getTime() / 1000); // midnight today

  const fetchAllPosts = async () => {
    const queries = [Query.between("$createdAt", startTimestamp, endTimestamp)]; // No limit
    const { posts } = await fetchPosts(queries);
    setPosts(posts);
  };

  const enrichPostWithProfile = async (post: any) => {
    try {
      const profileRes = await databases.listDocuments(
        databaseId,
        userPrefCollection,
        [Query.equal("userId", post.userId)]
      );
      const profilePictureId = profileRes.documents[0]?.profilePictureId ?? "";
      return { ...post, profilePictureId };
    } catch {
      return { ...post, profilePictureId: "" };
    }
  };

  const fetchPosts = async (
    queries: any[]
  ): Promise<{ posts: any[]; lastDoc: any }> => {
    const res = await databases.listDocuments(
      databaseId,
      userPostCollection,
      queries
    );
    const enrichedPosts = await Promise.all(
      res.documents.map(enrichPostWithProfile)
    );
    const lastDoc = res.documents.at(-1);
    return { posts: enrichedPosts, lastDoc };
  };

  // -------------------- Fetch Posts By Page --------------------
  const fetchPostsByPage = async (page: number) => {
    setLoading(true);
    setHasMore(true);
    let allPosts: any[] = [];
    let lastDoc = null;

    for (let i = 1; i <= page; i++) {
      const queries = [Query.limit(PAGE_SIZE), Query.orderDesc("createdAt")];
      if (lastDoc) queries.push(Query.cursorAfter(lastDoc.$id));

      const { posts, lastDoc: newLastDoc } = await fetchPosts(queries);

      if (posts.length === 0) {
        setHasMore(false);
        break;
      }

      allPosts = posts;
      lastDoc = newLastDoc;
    }

    setPosts(allPosts);
    setLastDocument(lastDoc);
    setCurrentPage(page);
    setLoading(false);
  };

  // -------------------- Fetch More Posts --------------------
  const fetchMorePosts = async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    const queries = [Query.limit(PAGE_SIZE), Query.orderDesc("createdAt")];
    if (lastDocument) queries.push(Query.cursorAfter(lastDocument.$id));

    try {
      const { posts, lastDoc } = await fetchPosts(queries);

      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.$id));
        const newPosts = posts.filter((p) => !existingIds.has(p.$id));
        return [...prev, ...newPosts];
      });

      setLastDocument(lastDoc);
      setCurrentPage((prev) => prev + 1);
      setHasMore(posts.length >= PAGE_SIZE);
    } catch (err) {
      console.error("Error fetching more posts:", err);
    } finally {
      setLoading(false);
    }
  };

  // -------------------- Fetch Total Count --------------------
  useEffect(() => {
    const fetchTotalCount = async () => {
      try {
        const res = await databases.listDocuments(
          databaseId,
          userPostCollection,
          []
        );
        setTotalPostCount(res.total ?? 0);
      } catch (e) {
        console.error("Error fetching total count:", e);
      }
    };
    fetchTotalCount();
  }, []);

  // -------------------- Initial Load --------------------
  useEffect(() => {
    fetchPostsByPage(1);
  }, []);

  useEffect(() => {
    fetchAllPosts();
  }, []);

  // -------------------- Infinite Scroll --------------------
  useEffect(() => {
    if (!useInfiniteScroll || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          fetchMorePosts();
        }
      },
      { root: null, rootMargin: "0px", threshold: 1.0 }
    );

    const target = loaderRef.current;
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
      observer.disconnect();
    };
  }, [hasMore, loading, useInfiniteScroll]);

  // -------------------- Fetch User Profile --------------------
  useEffect(() => {
    if (!userId) return;

    const fetchUserProfile = async () => {
      try {
        const response = await databases.listDocuments(
          databaseId,
          userPrefCollection,
          [Query.equal("userId", userId)]
        );
        const doc = response.documents[0];
        if (doc) {
          setUserProfile({
            ...doc,
            profilePictureId: doc.profilePictureId ?? "",
          });
        }
        console.log("Fetching profile for userId:", userId);
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    };

    fetchUserProfile();
  }, [userId]);

  // -------------------- Fetch Liked Images --------------------
  useEffect(() => {
    if (likedImages.length === 0) return;

    const fetchLikedImages = async () => {
      setLoading(true);
      try {
        const likedDocs = await Promise.all(
          likedImages.map((id) =>
            databases.getDocument(databaseId, likeCollectionId, id)
          )
        );

        const likedData: AppImage[] = likedDocs.map((doc: any) => ({
          $id: doc.$id,
          imageFileId: doc.imageFileId ?? "",
          fileName: doc.fileName ?? "",
          postId: doc.postId ?? "",
          createdAt: doc.createdAt ?? "",
          collectionId: doc.collectionId ?? "",
          collectionName: doc.collectionName ?? "",
          userName: doc.userName ?? "",
          links: doc.links ?? "",
          tags: doc.tags ?? "",
          postedBy: doc.postedBy ?? "",
          likeCount: doc.likeCount ?? 0,
        }));

        setLikedCollect(likedData);
      } catch (err) {
        console.error("Error fetching liked images:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedImages();
  }, [likedImages]);

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

  // Pagination button clicked
  const handlePageChange = (page: number) => {
    const clampedPage = Math.min(Math.max(1, page), totalPages || 1);
    setUseInfiniteScroll(false);
    fetchPostsByPage(clampedPage);
    scrollToTop();
  };

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 300);

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const pageRefs = useRef(new Map<number, HTMLElement>());

  const observePage = (el: HTMLElement | null, pageNum: number) => {
    if (el && !pageRefs.current.has(pageNum)) {
      pageRefs.current.set(pageNum, el);
      observerRef.current?.observe(el);
    }
  };
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageEntry = [...pageRefs.current.entries()].find(
              ([_, el]) => el === entry.target
            );
            if (pageEntry) {
              setCurrentPage(pageEntry[0]);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.5, // At least 50% of the post block should be visible
      }
    );

    return () => observerRef.current?.disconnect();
  }, []);
  return (
    <div className="d">
      <div className="gallery">
        {posts.map((post, index) => {
          const isPageStart = index % PAGE_SIZE === 0;
          const pageNum = Math.floor(index / PAGE_SIZE) + 1;

          return (
            <div
              key={post.$id}
              className="post-picture1"
              ref={isPageStart ? (el) => observePage(el, pageNum) : null}
            >
              <div className="d">
                <div className="hover-info">
                  <div className="header-username">
                    <div className="left-pfp">
                      <div className="image-pfp">
                        {post.profilePictureId ? (
                          <img
                            src={`https://cloud.appwrite.io/v1/storage/buckets/67bcb7d50038b0f4f5ba/files/${post.profilePictureId}/view?project=67bc93bc0004228cf938`}
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
                      {currentUser && post.userId !== currentUser.$id && (
                        <FollowUserButton
                          followId={post.userId ?? ""}
                          userId={currentUser.$id ?? ""}
                          currentUser={currentUser}
                        />
                      )}
                    </div>
                  </div>

                  <div
                    className="left-saved"
                    onClick={() => handleImageClick(post)}
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
                      onClick={() => handleImageClick(post)}
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
            </div>
          );
        })}
      </div>
      <div className="">
        <div ref={loaderRef} style={{ height: 1 }} />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages || 1}
          onPageChange={handlePageChange}
        />

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

const Collections: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useCurrentUser();

  const [posts, setPosts] = useState<Post[]>([]);
  const [, setUserProfile] = useState<Post | null>(null);
  const [, setLikedCollect] = useState<AppImage[]>([]);
  const [likedImages] = useState<string[]>([]);
  const [userId] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [lastDocument, setLastDocument] = useState<any | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPostCount, setTotalPostCount] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [useInfiniteScroll, setUseInfiniteScroll] = useState(true);

  const loaderRef = useRef<HTMLDivElement | null>(null);

  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const userPostCollection = import.meta.env.VITE_USER_POST_COLLECTION_ID;
  const userPrefCollection = import.meta.env.VITE_USER_PREF_COLLECTION_ID;
  const likeCollectionId = import.meta.env.VITE_USERL_IKE;
  const totalPages = Math.ceil(totalPostCount / PAGE_SIZE);

  // Format date into relative time
  const getTimeAgo = (date?: string) =>
    date
      ? formatDistanceToNow(new Date(date), { addSuffix: true }).replace(
          "about ",
          ""
        )
      : "Unknown time";

  // -------------------- Utility Functions --------------------
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0); // midnight
  const startTimestamp = Math.floor(startOfToday.getTime() / 1000); // convert to seconds

  const fetchAllPosts = async () => {
    const queries = [Query.greaterThanEqual("$createdAt", startTimestamp)]; // No limit
    const { posts } = await fetchPosts(queries);
    setPosts(posts);
  };

  const enrichPostWithProfile = async (post: any) => {
    try {
      const profileRes = await databases.listDocuments(
        databaseId,
        userPrefCollection,
        [Query.equal("userId", post.userId)]
      );
      const profilePictureId = profileRes.documents[0]?.profilePictureId ?? "";
      return { ...post, profilePictureId };
    } catch {
      return { ...post, profilePictureId: "" };
    }
  };

  const fetchPosts = async (
    queries: any[]
  ): Promise<{ posts: any[]; lastDoc: any }> => {
    const res = await databases.listDocuments(
      databaseId,
      userPostCollection,
      queries
    );
    const enrichedPosts = await Promise.all(
      res.documents.map(enrichPostWithProfile)
    );
    const lastDoc = res.documents.at(-1);
    return { posts: enrichedPosts, lastDoc };
  };

  // -------------------- Fetch Posts By Page --------------------
  const fetchPostsByPage = async (page: number) => {
    setLoading(true);
    setHasMore(true);
    let allPosts: any[] = [];
    let lastDoc = null;

    for (let i = 1; i <= page; i++) {
      const queries = [Query.limit(PAGE_SIZE), Query.orderDesc("createdAt")];
      if (lastDoc) queries.push(Query.cursorAfter(lastDoc.$id));

      const { posts, lastDoc: newLastDoc } = await fetchPosts(queries);

      if (posts.length === 0) {
        setHasMore(false);
        break;
      }

      allPosts = posts;
      lastDoc = newLastDoc;
    }

    setPosts(allPosts);
    setLastDocument(lastDoc);
    setCurrentPage(page);
    setLoading(false);
  };

  // -------------------- Fetch More Posts --------------------
  const fetchMorePosts = async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    const queries = [Query.limit(PAGE_SIZE), Query.orderDesc("createdAt")];
    if (lastDocument) queries.push(Query.cursorAfter(lastDocument.$id));

    try {
      const { posts, lastDoc } = await fetchPosts(queries);

      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.$id));
        const newPosts = posts.filter((p) => !existingIds.has(p.$id));
        return [...prev, ...newPosts];
      });

      setLastDocument(lastDoc);
      setCurrentPage((prev) => prev + 1);
      setHasMore(posts.length >= PAGE_SIZE);
    } catch (err) {
      console.error("Error fetching more posts:", err);
    } finally {
      setLoading(false);
    }
  };

  // -------------------- Fetch Total Count --------------------
  useEffect(() => {
    const fetchTotalCount = async () => {
      try {
        const res = await databases.listDocuments(
          databaseId,
          userPostCollection,
          []
        );
        setTotalPostCount(res.total ?? 0);
      } catch (e) {
        console.error("Error fetching total count:", e);
      }
    };
    fetchTotalCount();
  }, []);

  // -------------------- Initial Load --------------------
  useEffect(() => {
    fetchPostsByPage(1);
  }, []);

  useEffect(() => {
    fetchAllPosts();
  }, []);

  // -------------------- Infinite Scroll --------------------
  useEffect(() => {
    if (!useInfiniteScroll || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          fetchMorePosts();
        }
      },
      { root: null, rootMargin: "0px", threshold: 1.0 }
    );

    const target = loaderRef.current;
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
      observer.disconnect();
    };
  }, [hasMore, loading, useInfiniteScroll]);

  // -------------------- Fetch User Profile --------------------
  useEffect(() => {
    if (!userId) return;

    const fetchUserProfile = async () => {
      try {
        const response = await databases.listDocuments(
          databaseId,
          userPrefCollection,
          [Query.equal("userId", userId)]
        );
        const doc = response.documents[0];
        if (doc) {
          setUserProfile({
            ...doc,
            profilePictureId: doc.profilePictureId ?? "",
          });
        }
        console.log("Fetching profile for userId:", userId);
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    };

    fetchUserProfile();
  }, [userId]);

  // -------------------- Fetch Liked Images --------------------
  useEffect(() => {
    if (likedImages.length === 0) return;

    const fetchLikedImages = async () => {
      setLoading(true);
      try {
        const likedDocs = await Promise.all(
          likedImages.map((id) =>
            databases.getDocument(databaseId, likeCollectionId, id)
          )
        );

        const likedData: AppImage[] = likedDocs.map((doc: any) => ({
          $id: doc.$id,
          imageFileId: doc.imageFileId ?? "",
          fileName: doc.fileName ?? "",
          postId: doc.postId ?? "",
          createdAt: doc.createdAt ?? "",
          collectionId: doc.collectionId ?? "",
          collectionName: doc.collectionName ?? "",
          userName: doc.userName ?? "",
          links: doc.links ?? "",
          tags: doc.tags ?? "",
          postedBy: doc.postedBy ?? "",
          likeCount: doc.likeCount ?? 0,
        }));

        setLikedCollect(likedData);
      } catch (err) {
        console.error("Error fetching liked images:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedImages();
  }, [likedImages]);

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

  // Pagination button clicked
  const handlePageChange = (page: number) => {
    const clampedPage = Math.min(Math.max(1, page), totalPages || 1);
    setUseInfiniteScroll(false);
    fetchPostsByPage(clampedPage);
    scrollToTop();
  };

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 300);

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const pageRefs = useRef(new Map<number, HTMLElement>());

  const observePage = (el: HTMLElement | null, pageNum: number) => {
    if (el && !pageRefs.current.has(pageNum)) {
      pageRefs.current.set(pageNum, el);
      observerRef.current?.observe(el);
    }
  };
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageEntry = [...pageRefs.current.entries()].find(
              ([_, el]) => el === entry.target
            );
            if (pageEntry) {
              setCurrentPage(pageEntry[0]);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.5, // At least 50% of the post block should be visible
      }
    );

    return () => observerRef.current?.disconnect();
  }, []);
  return (
    <div className="d">
      <div className="gallery">
        {posts.map((post, index) => {
          const isPageStart = index % PAGE_SIZE === 0;
          const pageNum = Math.floor(index / PAGE_SIZE) + 1;

          return (
            <div
              key={post.$id}
              className="post-picture1"
              ref={isPageStart ? (el) => observePage(el, pageNum) : null}
            >
              <div className="d">
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
                      {currentUser && post.userId !== currentUser.$id && (
                        <FollowUserButton
                          followId={post.userId ?? ""}
                          userId={currentUser.$id ?? ""}
                          currentUser={currentUser}
                        />
                      )}
                    </div>
                  </div>

                  <div
                    className="left-saved"
                    onClick={() => handleImageClick(post)}
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
                      onClick={() => handleImageClick(post)}
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
                      src={`http://localhost:3000/image/${post.imageFileId}`}
                      alt="Post"
                      onClick={() => handleImageClick(post)}
                      className="image-collect"
                    />
                  ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="">
        <div ref={loaderRef} style={{ height: 1 }} />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages || 1}
          onPageChange={handlePageChange}
        />

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

const Hearters: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useCurrentUser();

  const [posts, setPosts] = useState<Post[]>([]);
  const [, setUserProfile] = useState<Post | null>(null);
  const [, setLikedCollect] = useState<AppImage[]>([]);
  const [likedImages] = useState<string[]>([]);
  const [userId] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [lastDocument, setLastDocument] = useState<any | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPostCount, setTotalPostCount] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const [useInfiniteScroll, setUseInfiniteScroll] = useState(true);

  const loaderRef = useRef<HTMLDivElement | null>(null);

  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const userPostCollection = import.meta.env.VITE_USER_POST_COLLECTION_ID;
  const userPrefCollection = import.meta.env.VITE_USER_PREF_COLLECTION_ID;
  const likeCollectionId = import.meta.env.VITE_USERL_IKE;
  const totalPages = Math.ceil(totalPostCount / PAGE_SIZE);

  // Format date into relative time
  const getTimeAgo = (date?: string) =>
    date
      ? formatDistanceToNow(new Date(date), { addSuffix: true }).replace(
          "about ",
          ""
        )
      : "Unknown time";

  // -------------------- Utility Functions --------------------
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0); // midnight
  const startTimestamp = Math.floor(startOfToday.getTime() / 1000); // convert to seconds

  const fetchAllPosts = async () => {
    const queries = [Query.greaterThanEqual("$createdAt", startTimestamp)]; // No limit
    const { posts } = await fetchPosts(queries);
    setPosts(posts);
  };

  const enrichPostWithProfile = async (post: any) => {
    try {
      const profileRes = await databases.listDocuments(
        databaseId,
        userPrefCollection,
        [Query.equal("userId", post.userId)]
      );
      const profilePictureId = profileRes.documents[0]?.profilePictureId ?? "";
      return { ...post, profilePictureId };
    } catch {
      return { ...post, profilePictureId: "" };
    }
  };

  const fetchPosts = async (
    queries: any[]
  ): Promise<{ posts: any[]; lastDoc: any }> => {
    const res = await databases.listDocuments(
      databaseId,
      userPostCollection,
      queries
    );
    const enrichedPosts = await Promise.all(
      res.documents.map(enrichPostWithProfile)
    );
    const lastDoc = res.documents.at(-1);
    return { posts: enrichedPosts, lastDoc };
  };

  // -------------------- Fetch Posts By Page --------------------
  const fetchPostsByPage = async (page: number) => {
    setLoading(true);
    setHasMore(true);
    let allPosts: any[] = [];
    let lastDoc = null;

    for (let i = 1; i <= page; i++) {
      const queries = [Query.limit(PAGE_SIZE), Query.orderDesc("createdAt")];
      if (lastDoc) queries.push(Query.cursorAfter(lastDoc.$id));

      const { posts, lastDoc: newLastDoc } = await fetchPosts(queries);

      if (posts.length === 0) {
        setHasMore(false);
        break;
      }

      allPosts = posts;
      lastDoc = newLastDoc;
    }

    setPosts(allPosts);
    setLastDocument(lastDoc);
    setCurrentPage(page);
    setLoading(false);
  };

  // -------------------- Fetch More Posts --------------------
  const fetchMorePosts = async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    const queries = [Query.limit(PAGE_SIZE), Query.orderDesc("createdAt")];
    if (lastDocument) queries.push(Query.cursorAfter(lastDocument.$id));

    try {
      const { posts, lastDoc } = await fetchPosts(queries);

      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.$id));
        const newPosts = posts.filter((p) => !existingIds.has(p.$id));
        return [...prev, ...newPosts];
      });

      setLastDocument(lastDoc);
      setCurrentPage((prev) => prev + 1);
      setHasMore(posts.length >= PAGE_SIZE);
    } catch (err) {
      console.error("Error fetching more posts:", err);
    } finally {
      setLoading(false);
    }
  };

  // -------------------- Fetch Total Count --------------------
  useEffect(() => {
    const fetchTotalCount = async () => {
      try {
        const res = await databases.listDocuments(
          databaseId,
          userPostCollection,
          []
        );
        setTotalPostCount(res.total ?? 0);
      } catch (e) {
        console.error("Error fetching total count:", e);
      }
    };
    fetchTotalCount();
  }, []);

  // -------------------- Initial Load --------------------
  useEffect(() => {
    fetchPostsByPage(1);
  }, []);

  useEffect(() => {
    fetchAllPosts();
  }, []);

  // -------------------- Infinite Scroll --------------------
  useEffect(() => {
    if (!useInfiniteScroll || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          fetchMorePosts();
        }
      },
      { root: null, rootMargin: "0px", threshold: 1.0 }
    );

    const target = loaderRef.current;
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
      observer.disconnect();
    };
  }, [hasMore, loading, useInfiniteScroll]);

  // -------------------- Fetch User Profile --------------------
  useEffect(() => {
    if (!userId) return;

    const fetchUserProfile = async () => {
      try {
        const response = await databases.listDocuments(
          databaseId,
          userPrefCollection,
          [Query.equal("userId", userId)]
        );
        const doc = response.documents[0];
        if (doc) {
          setUserProfile({
            ...doc,
            profilePictureId: doc.profilePictureId ?? "",
          });
        }
        console.log("Fetching profile for userId:", userId);
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    };

    fetchUserProfile();
  }, [userId]);

  // -------------------- Fetch Liked Images --------------------
  useEffect(() => {
    if (likedImages.length === 0) return;

    const fetchLikedImages = async () => {
      setLoading(true);
      try {
        const likedDocs = await Promise.all(
          likedImages.map((id) =>
            databases.getDocument(databaseId, likeCollectionId, id)
          )
        );

        const likedData: AppImage[] = likedDocs.map((doc: any) => ({
          $id: doc.$id,
          imageFileId: doc.imageFileId ?? "",
          fileName: doc.fileName ?? "",
          postId: doc.postId ?? "",
          createdAt: doc.createdAt ?? "",
          collectionId: doc.collectionId ?? "",
          collectionName: doc.collectionName ?? "",
          userName: doc.userName ?? "",
          links: doc.links ?? "",
          tags: doc.tags ?? "",
          postedBy: doc.postedBy ?? "",
          likeCount: doc.likeCount ?? 0,
        }));

        setLikedCollect(likedData);
      } catch (err) {
        console.error("Error fetching liked images:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedImages();
  }, [likedImages]);

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

  // Pagination button clicked
  const handlePageChange = (page: number) => {
    const clampedPage = Math.min(Math.max(1, page), totalPages || 1);
    setUseInfiniteScroll(false);
    fetchPostsByPage(clampedPage);
    scrollToTop();
  };

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 300);

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const pageRefs = useRef(new Map<number, HTMLElement>());

  const observePage = (el: HTMLElement | null, pageNum: number) => {
    if (el && !pageRefs.current.has(pageNum)) {
      pageRefs.current.set(pageNum, el);
      observerRef.current?.observe(el);
    }
  };
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageEntry = [...pageRefs.current.entries()].find(
              ([_, el]) => el === entry.target
            );
            if (pageEntry) {
              setCurrentPage(pageEntry[0]);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.5, // At least 50% of the post block should be visible
      }
    );

    return () => observerRef.current?.disconnect();
  }, []);
  return (
    <div className="d">
      <div className="gallery">
        {posts.map((post, index) => {
          const isPageStart = index % PAGE_SIZE === 0;
          const pageNum = Math.floor(index / PAGE_SIZE) + 1;

          return (
            <div
              key={post.$id}
              className="post-picture1"
              ref={isPageStart ? (el) => observePage(el, pageNum) : null}
            >
              <div className="d">
                <div className="hover-info">
                  <div className="header-username">
                    <div className="left-pfp">
                      <div className="image-pfp">
                        {post.profilePictureId ? (
                          <img
                            src={`https://cloud.appwrite.io/v1/storage/buckets/67bcb7d50038b0f4f5ba/files/${post.profilePictureId}/view?project=67bc93bc0004228cf938`}
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
                      {currentUser && post.userId !== currentUser.$id && (
                        <FollowUserButton
                          followId={post.userId ?? ""}
                          userId={currentUser.$id ?? ""}
                          currentUser={currentUser}
                        />
                      )}
                    </div>
                  </div>

                  <div
                    className="left-saved"
                    onClick={() => handleImageClick(post)}
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
                      onClick={() => handleImageClick(post)}
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
                      src={`http://localhost:3000/image/${post.imageFileId}`}
                      alt="Post"
                      onClick={() => handleImageClick(post)}
                      className="image-collect"
                    />
                  ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="">
        <div ref={loaderRef} style={{ height: 1 }} />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages || 1}
          onPageChange={handlePageChange}
        />

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

export default Tabs;
