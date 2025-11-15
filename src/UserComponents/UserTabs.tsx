import React, { useEffect, useState } from "react";
import { databases, Query } from "../appwrite";
import { QueryTypes } from "appwrite";

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

interface userTabsProps {
  activeTab: string; // Currently active tab
  handleTabClick: (tabName: string) => void; // Function to handle tab change
  userName: string;
}

const UserTabs: React.FC<userTabsProps> = ({
  activeTab,
  handleTabClick,
  userName,
}) => {
  const [imageCount, setImageCount] = useState<number>(0);
  const [collectionCount, setCollectionCount] = useState<number>(0);
  const [likedImageCount, setLikedImageCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [followersCount, setFollowersCount] = useState<number>(0);

  useEffect(() => {
    const fetchCounts = async () => {
      if (!userName) {
        console.error("User object is missing or incomplete:", userName);
        return;
      }

      try {
        const [images, collections, likes, following, followers] =
          await Promise.all([
            databases
              .listDocuments("67bcb64c0027e7eaa736", "67be4e9e001142383751", [
                Query.equal("userName", userName as QueryTypes),
              ])
              .then((res) => res.documents.length),
            databases
              .listDocuments("67bcb64c0027e7eaa736", "67be4fe30038e2f0c316", [
                Query.equal("userName", userName as QueryTypes),
              ])
              .then((res) => res.documents.length),
            databases
              .listDocuments("67bcb64c0027e7eaa736", "67be55c40035f81ed3db", [
                Query.equal("userName", userName as QueryTypes),
              ])
              .then((res) => res.documents.length),
            databases
              .listDocuments("67bcb64c0027e7eaa736", "67c72558000195308e84", [
                Query.equal("userName", userName as QueryTypes),
              ])
              .then((res) => res.documents.length),
            databases
              .listDocuments("67bcb64c0027e7eaa736", "67c72558000195308e84", [
                Query.equal("userName", userName as QueryTypes),
              ])
              .then((res) => res.documents.length),
          ]);

        setImageCount(images);
        setCollectionCount(collections);
        setFollowingCount(following);
        setLikedImageCount(likes);
        setFollowersCount(followers);
      } catch (error) {
        console.error("Error fetching counts:", error);
      }
    };

    fetchCounts();
  }, [userName]);

  return (
    <div className="tabs-container">
      <div className="profile-tabs">
        <div className="tabs-profile">
          <div
            className={`tab2 ${activeTab === "latest" ? "active" : ""}`}
            onClick={() => handleTabClick("latest")}
          >
            {likedImageCount > 0 ? `${likedImageCount} Hearts` : "0 Hearts"}
          </div>
          <div
            className={`tab2 ${activeTab === "collections" ? "active" : ""}`}
            onClick={() => handleTabClick("collections")}
          >
            {collectionCount > 0
              ? `${collectionCount} Collections`
              : "0 Collections"}
          </div>
          <div
            className={`tab2 ${activeTab === "post" ? "active" : ""}`}
            onClick={() => handleTabClick("post")}
          >
            {imageCount > 0 ? `${imageCount} Posts ` : "0 Post"}
          </div>
          <div
            className={`tab2 ${activeTab === "following" ? "active" : ""}`}
            onClick={() => handleTabClick("following")}
          >
            {followingCount > 0
              ? `${followingCount} Following `
              : "0 Following"}
          </div>
          <div
            className={`tab2 ${activeTab === "followers" ? "active" : ""}`}
            onClick={() => handleTabClick("followers")}
          >
            {followersCount > 0
              ? `${followersCount} Followers `
              : "0 Followers"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserTabs;
