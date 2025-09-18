import React, { useState, useEffect } from "react";
import { databases, Query } from "../appwrite";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import "../Components/tagPost.css";
import { useNavigation } from "../Components/NavigationContext";

import TagIcon from "/src/assets/SVG/tag-svgrepo-com.svg"; // Use import for consistency
import StaticGif from "../Components/StaticGif";
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

const TagPosts: React.FC = () => {
  const { tag } = useParams<{ tag: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const navigate = useNavigate();
  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const userPostId = import.meta.env.VITE_USER_POST_COLLECTION_ID;
  const imageCount = posts.filter((post) => post.imageFileId).length;
  const { setIsNavigating } = useNavigation();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsResponse = await databases.listDocuments(
          databaseId,
          userPostId,
          [Query.search("tags", tag!), Query.orderDesc("createdAt")]
        );
        const postsData = postsResponse.documents.map((doc: any) => ({
          $id: doc.$id,
          tags: doc.tags,
          imageFileId: doc.imageFileId,
          userId: doc.userId,
        })) as Post[];
        setPosts(postsData);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };

    fetchPosts();
  }, [tag]);

  const bannerPost = posts.length > 0 ? posts[0] : null;

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

  return (
    <div className="container2">
      {/* Banner Section */}
      {bannerPost?.imageFileId && (
        <div className="border-banner-tag">
          <img
            src={`https://cloud.appwrite.io/v1/storage/buckets/67be51020004776eea1a/files/${bannerPost.imageFileId}/view?project=67bc93bc0004228cf938`}
            alt="Banner"
            onClick={() => handleImageClick(bannerPost)}
            style={{
              width: "1360px",
              height: "auto",
              maxHeight: "410px",
              objectFit: "cover",
            }}
          />
          <div className="line-gradients-white"></div>
        </div>
      )}

      <div className="middle-tag-info">
        <div className="left-info-tag">
          <img
            src={TagIcon}
            alt="svg"
            style={{
              width: "20px",
              height: "20px",
              objectFit: "cover",
            }}
          />
          <h3 style={{ paddingLeft: "10px" }}> {tag}</h3>
          <p
            style={{
              paddingLeft: "10px",
              paddingRight: "10px",
              objectFit: "cover",
            }}
          >
            |
          </p>
          <div className="number-of-post">
            <p>{imageCount}</p>
          </div>
        </div>
        <div className="right-side-infos">
          <div className="follow-tag-button">Follow Channel</div>
        </div>
      </div>
      <div
        className="CONTENT-TAG-POST"
        style={{ position: "relative", bottom: "90px" }}
      >
        <div className="gallery">
          {posts.length === 0 ? (
            <p>No posts found with this tag.</p>
          ) : (
            posts.map((post) => (
              <div
                key={post.$id}
                style={{ marginBottom: "16px" }}
                className="post-picture"
              >
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
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TagPosts;
