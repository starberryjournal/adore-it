import React, { useEffect, useState } from "react";
import { databases, Query } from "../appwrite";

interface TabsProps {
  activeTab: string; // Currently active tab
  handleTabClick: (tabName: string) => void; // Function to handle tab change
  collectionId: string;
}

const CollectTabs: React.FC<TabsProps> = ({
  activeTab,
  handleTabClick,
  collectionId,
}) => {
 // const [imageCount, setImageCount] = useState<number>(0);
  //const [collectionCount, setCollectionCount] = useState<number>(0);
  //const [likedImageCount, setLikedImageCount] = useState<number>(0);
  const [, setError] = useState<string | null>(null);

  const dbId = import.meta.env.VITE_DATABASE_ID;
  const postCollectionId = import.meta.env.VITE_COLLECT_OTHERIMG;
  const creatPost = import.meta.env.VITE_USER_POST_COLLECTION_ID;
  const followsCollectionId = import.meta.env.VITE_USERFOLLOWCOLLECT;

  const [, setLoading] = useState<boolean>(true);
  const [images, setImages] = useState<any[]>([]);
  const [userId] = useState<string>(""); // State for userId
  const [followers, setFollowers] = useState<string[]>([]);
  useEffect(() => {
    if (!collectionId) {
      setError("Collection ID is undefined");
      setLoading(false);
      return;
    }

    const fetchImages = async () => {
      try {
        const [userImagesResponse, savedImagesResponse] = await Promise.all([
          databases.listDocuments(
            dbId,
            creatPost, // createPost
            [Query.equal("collectionId", collectionId)]
          ),
          databases.listDocuments(dbId, postCollectionId, [
            Query.equal("collectionId", collectionId),
          ]),
        ]);

        const combinedImages = [
          ...userImagesResponse.documents,
          ...savedImagesResponse.documents,
        ];

        const validImages = combinedImages.filter((image) => image.imageFileId);

        const sortedImages = validImages.sort(
          (a, b) =>
            new Date(b.createdAt || b.collectionCreatedAt).getTime() -
            new Date(a.createdAt || a.collectionCreatedAt).getTime()
        );

        setImages(sortedImages);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching images", error);
        setError("Error fetching images. Please try again later.");
        setLoading(false);
      }
    };

    const fetchFollowers = async () => {
      try {
        const response = await databases.listDocuments(
          dbId, // Replace with your Appwrite database ID
          followsCollectionId, // Replace with your follows collection ID
          [Query.equal("collectionId", collectionId)]
        );
        setFollowers(response.documents.map((doc) => doc.userId));
      } catch (error) {
        setError("Failed to fetch followers.");
      }
    };

    fetchImages();
    fetchFollowers();
  }, [collectionId, userId]);

  return (
    <div className="tabs-container">
      <div className="profile-tabs">
        <div className="tabs-collect">
          <div
            className={`tab3 ${
              activeTab === "CollectionImages" ? "active" : ""
            }`}
            onClick={() => handleTabClick("CollectionImages")}
          >
            {images.length} Hearts
          </div>
          <div
            className={`tab3 ${
              activeTab === "CollectionFollowers" ? "active" : ""
            }`}
            onClick={() => handleTabClick("CollectionFollowers")}
          >
            {followers.length} Followers
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectTabs;

