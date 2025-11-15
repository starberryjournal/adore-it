import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { databases, Query } from "../appwrite"; // Assuming you use Appwrite for fetching data
import "./ProfilePicture.css";
import UserTabs from "./UserTabs";
import UserTabsContent from "./UserTabsContent";
import { QueryTypes } from "appwrite";
import FollowUserButton from "../Components/FollowUserButton";
import { useCurrentUser } from "../Components/useCurrentUser";

interface Preferences {
  $id: string;
  userName: string;
  bioId: string;
  displayName: string;
  profilePictureId?: string;
  backgroundImageId?: string;
}



const Profile: React.FC = () => {
  const { userName } = useParams() as { userName: string };
  const location = useLocation();
  const { user: currentUser } = useCurrentUser();

  const [selectedUserPrefs, setSelectedUserPrefs] =
    useState<Preferences | null>(null);
  const [activeTab, setActiveTab] = useState("latest");
  const { followId, userId } = location.state || {}; // Extract state from navigation


  const handleTabClick = (tabName: string) => {
    setActiveTab(tabName);
  };

  const fetchUserData = async () => {
    if (!userName) {
      console.error("userName is undefined");
      return;
    }

    try {
      const userPrefsResponse = await databases.listDocuments(
        "67bcb64c0027e7eaa736", // Your database ID
        "67bcb6c50015bf805517", // Your users collection ID
        [Query.equal("userName", userName as QueryTypes)] // Ensure this matches your schema
      );

      if (userPrefsResponse.documents.length > 0) {
        const userPrefs = userPrefsResponse
          .documents[0] as unknown as Preferences;
        console.log("User preferences fetched:", userPrefs);
        setSelectedUserPrefs(userPrefs);
      } else {
        console.error("Preferences not found for the user.");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };
  useEffect(() => {
    fetchUserData();
  }, [userName]);

  return (
    <div className="container2">
      <div className="inside-container">
        <div className="header-one">
          {selectedUserPrefs?.backgroundImageId && (
            <img
              src={`https://cloud.appwrite.io/v1/storage/buckets/67bcb7d50038b0f4f5ba/files/${selectedUserPrefs.backgroundImageId}/view?project=67bc93bc0004228cf938`}
              alt="Background"
            />
          )}
          <div className="line-gradients"></div>
        </div>
      </div>

      <div className="infodump">
        <div className="left-infomat">
          <div className="imageprofile">
            {selectedUserPrefs?.profilePictureId && (
              <img
                src={`https://cloud.appwrite.io/v1/storage/buckets/67bcb7d50038b0f4f5ba/files/${selectedUserPrefs.profilePictureId}/view?project=67bc93bc0004228cf938`}
                alt="Profile"
                onError={(e) => (e.currentTarget.src = "/default-profile.jpg")}
              />
            )}
          </div>

          <div className="infomat">
            <div className="informat1">
              <div className="usernameme">
                <p>{selectedUserPrefs?.displayName}</p>
              </div>
              <div className="follow-id">
                {currentUser && userId !== currentUser.$id && (
                  <FollowUserButton
                    followId={followId ?? ""}
                    userId={userId ?? ""}
                    currentUser={currentUser}
                  />
                )}
              </div>
            </div>
            <div className="informat2">
              <div className="header-nav">
                <UserTabs
                  activeTab={activeTab}
                  handleTabClick={handleTabClick}
                  userName={userName}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="uderline-profile"></div>

        <div className="users-infos">
          <div className="profile-quotes">
            <div className="bio">
              {selectedUserPrefs?.bioId ? (
                <p>{selectedUserPrefs.bioId}</p>
              ) : (
                <p>No bio available.</p>
              )}
            </div>
            <div className="username">
              <p>@{selectedUserPrefs?.userName}</p>
            </div>
          </div>
        </div>
      </div>

      <UserTabsContent activeTab={activeTab} userName={userName} />
    </div>
  );
};

export default Profile;

