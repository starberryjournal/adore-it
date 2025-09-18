import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { databases, Query } from "../appwrite";

interface Post {
  $id: string;
  tags?: string;
  imageFileId?: string;
  userId: string;
  userName: string;
}

interface User {
  $id: string;
  name: string;
  userId: string;
  userName: string;
}

const UsersPosts: React.FC = () => {
  const { userName } = useParams<{ userName: string }>();
  const [] = useState<string>("");
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [, setCollections] = useState<any[]>([]);

  const fetchUserData = async () => {
    if (!userName) {
      console.error("userName is undefined");
      return;
    }

    try {
      const postsResponse = await databases.listDocuments(
        "67bcb64c0027e7eaa736", // Database ID
        "67be4e9e001142383751", // Posts Collection ID
        [Query.equal("userName", userName)]
      );

      // Fetch the user's collections
      const collectionsResponse = await databases.listDocuments(
        "67bcb64c0027e7eaa736", // Replace with your database ID
        "67be4fe30038e2f0c316", // Replace with your user collections collection ID
        [Query.equal("userName", userName)]
      );
      setCollections(collectionsResponse.documents);
      console.log("User collections:", collectionsResponse.documents);

      const userPosts = postsResponse.documents as unknown as Post[];
      if (userPosts.length > 0) {
        const user = userPosts[0];
        console.log("User data fetched:", user);
        setUser(user as unknown as User); // Type assertion if needed
        setPosts(userPosts);
      } else {
        console.error("User not found");
      }
    } catch (error) {
      console.error("Error fetching user data or posts:", error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [userName]);

  if (!user) {
    return <p>Loading user data...</p>;
  }

  return (
    <div>
      <h3>Posts</h3>
      {posts.length === 0 ? (
        <p>No posts yet.</p>
      ) : (
        posts.map((post) => (
          <div key={post.$id}>
            <p>
              Tags:{" "}
              {(post.tags ?? "").split(", ").map((tag, index) => (
                <span key={tag}>
                  <span
                    style={{ cursor: "pointer", color: "blue" }}
                    onClick={() => navigate(`/TagPosts/${tag}`)}
                  >
                    {tag}
                  </span>
                  {index < (post.tags ?? "").split(", ").length - 1 && ", "}
                </span>
              ))}
            </p>
            {post.imageFileId && (
              <img
                src={`https://cloud.appwrite.io/v1/storage/buckets/67be51020004776eea1a/files/${post.imageFileId}/view?project=67bc93bc0004228cf938`}
                alt="Post"
              />
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default UsersPosts;
