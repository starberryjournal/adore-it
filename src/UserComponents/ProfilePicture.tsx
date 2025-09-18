import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { account } from "../appwrite";
import "./ProfilePicture.css";
import Tabs from "./Tabs";
import TabsContent from "./TabsContent";

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

const ProfilePicture: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("latest");
  const handleTabClick = (tabName: string) => {
    setActiveTab(tabName);
  };

  const fetchCurrentUser = async () => {
    try {
      const currentUser = await account.get();
      console.log("Current user:", currentUser); // Log current user data
      setUser(currentUser as unknown as User);
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, [navigate]);

  if (!user) {
    return <p>Loading user data...</p>;
  }

  return (
    <div className="container2">
      <div className="inside-container">
        <div className="header-one">
          {user.prefs.backgroundImageId && (
            <img
              src={`https://cloud.appwrite.io/v1/storage/buckets/67bcb7d50038b0f4f5ba/files/${user.prefs.backgroundImageId}/view?project=67bc93bc0004228cf938`}
              alt="Background"
            />
          )}
          <div className="line-gradients"></div>
        </div>
      </div>

      <div className="infodump">
        <div className="left-infomat">
          <div className="imageprofile">
            {user.prefs.profilePictureId && (
              <img
                src={`https://cloud.appwrite.io/v1/storage/buckets/67bcb7d50038b0f4f5ba/files/${user.prefs.profilePictureId}/view?project=67bc93bc0004228cf938`}
                alt="Profile"
              />
            )}
          </div>

          <div className="infomat">
            <div className="informat1">
              <div className="usernameme">
                <p>{user.prefs.displayName}</p>
              </div>
            </div>
            <div className="informat2">
              <div className="header-nav">
                <Tabs
                  activeTab={activeTab}
                  handleTabClick={handleTabClick}
                  user={user}
                />
              </div>
              <button
                onClick={() => navigate("/EditProfile")}
                className="seetings-web"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>
        <div className="uderline-profile"></div>

        <div className="users-infos">
          <div className="profile-quotes">
            <div className="bio">
              <p>{user.prefs.bioId}</p>
            </div>
            <div className="username">
              <p>@{user.name}</p>
            </div>
          </div>
        </div>
      </div>

      <TabsContent activeTab={activeTab} />
    </div>
  );
};

export default ProfilePicture;
