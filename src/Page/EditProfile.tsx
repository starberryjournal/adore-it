import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { account, databases, storage, Query } from "../appwrite";
import ImageCropper from "../EditsImages/ImageCropper"; // assumes you created this
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import ImageUploadButton from "../EditsImages/ImageUploadButton";

const EditProfile: React.FC = () => {
  const [userName, setUserName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bioId, setBio] = useState("");
  const [profilePictureId, setProfilePictureId] = useState("");
  const [backgroundImageId, setBackgroundImageId] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");

  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const userPost = import.meta.env.VITE_USER_POST_COLLECTION_ID;
  const [croppingFile, setCroppingFile] = useState<File | null>(null);
  const [croppingType, setCroppingType] = useState<
    "profile" | "background" | null
  >(null);

  const maxLength = 130,
    maxLength2 = 65,
    maxLength3 = 100;
  const isFormValid = userName && displayName && bioId;

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = await account.get();
      setUserName(user.name || "");
      setDisplayName(user.prefs.displayName || "");
      setBio(user.prefs.bioId || "");
      setProfilePictureId(user.prefs.profilePictureId || "");
      setBackgroundImageId(user.prefs.backgroundImageId || "");

      if (user.prefs.profilePictureId) {
        const url = storage
          .getFileView("67bcb7d50038b0f4f5ba", user.prefs.profilePictureId)
          .toString();
        setProfilePictureUrl(url);
      }
      if (user.prefs.backgroundImageId) {
        const url = storage
          .getFileView("67bcb7d50038b0f4f5ba", user.prefs.backgroundImageId)
          .toString();
        setBackgroundImageUrl(url);
      }
    };
    fetchUserData();
  }, []);

  const fetchDocumentIdByUserName = async (name: string) => {
    const res = await databases.listDocuments(
      databaseId,
      "67bcb6c50015bf805517",
      [Query.equal("userName", name)]
    );
    return res.documents[0]?.$id || null;
  };
  const updateUserPreferences = async (name: string, prefs: any) => {
    const docId = await fetchDocumentIdByUserName(name);
    if (docId) {
      await databases.updateDocument(
        databaseId,
        "67bcb6c50015bf805517",
        docId,
        prefs
      );
    }
  };

  const updateCreatePosts = async (
    userId: string,
    newDisplayName: string,
    newUserName: string
  ) => {
    const res = await databases.listDocuments(
      databaseId,
      userPost, // your collection ID for createPost entries
      [Query.equal("userId", userId)]
    );

    const updates = res.documents.map((doc) =>
      databases.updateDocument(databaseId, userPost, doc.$id, {
        displayName: newDisplayName,
        userName: newUserName,
      })
    );

    try {
      await Promise.all(updates);
      console.log("Posts successfully updated");
    } catch (error) {
      console.error("Error updating posts:", error);
    }
  };

  const handleSave = async () => {
    const user = await account.get();

    await account.updateName(userName); // 🔧 Updates the system name field

    await account.updatePrefs({
      bioId,
      displayName,
      userName,
      profilePictureId,
      backgroundImageId,
    });

    await updateUserPreferences(user.name, {
      bioId,
      displayName,
      profilePictureId,
      backgroundImageId,
    });

    await updateCreatePosts(user.$id, displayName, userName);

    navigate("/Profile");
  };

  const handleSelectFile = (type: "profile" | "background", file: File) => {
    setCroppingFile(file);
    setCroppingType(type);
  };

  const handleCroppedImage = async (blob: Blob) => {
    const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });
    const uploaded = await storage.createFile(
      "67bcb7d50038b0f4f5ba",
      "unique()",
      file
    );
    const url = storage
      .getFileView("67bcb7d50038b0f4f5ba", uploaded.$id)
      .toString();

    if (croppingType === "profile") {
      setProfilePictureId(uploaded.$id);
      setProfilePictureUrl(url);
    } else {
      setBackgroundImageId(uploaded.$id);
      setBackgroundImageUrl(url);
    }

    setCroppingFile(null);
    setCroppingType(null);
  };

  const aspect = croppingType === "background" ? 16 / 9 : 1;

  return (
    <div className="container2">
      <div className="inside-container">
        <div className="header-one">
          {backgroundImageUrl ? (
            <img
              src={backgroundImageUrl}
              alt="Background"
              className="background-preview"
            />
          ) : (
            <p>No background image</p>
          )}
          <div className="line-gradients" />
        </div>
      </div>

      <div className="infodump">
        <div className="left-infomat">
          <div className="imageprofile">
            {profilePictureUrl ? (
              <img
                src={profilePictureUrl}
                alt="Profile"
                className="profile-preview"
              />
            ) : (
              <p>No profile picture</p>
            )}
          </div>
          <div className="infomat">
            <div className="informat1">
              <div className="display-name">
                <label className="display-name-color">
                  Display Name ({displayName.length}/{maxLength2})
                </label>
                <input
                  value={displayName}
                  className="Input-display-name"
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={maxLength2}
                />
              </div>
              <label>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <ImageUploadButton
                    id="background-upload"
                    onFileSelect={(file) =>
                      handleSelectFile("background", file)
                    }
                  />
                </div>
              </label>
            </div>
            <div className="lefts-side">
              <div className="add-picture-icon">
                <label>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <ImageUploadButton
                      id="profile-upload"
                      onFileSelect={(file) => handleSelectFile("profile", file)}
                    />
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div className="uderline-profile"></div>
        <div className="display-infos">
          <div className="bio-user">
            <div className="bio-label">
              <label>
                Bio ({bioId.length}/{maxLength})
              </label>
            </div>
            <div className="input-bio">
              <input
                value={bioId}
                onChange={(e) => setBio(e.target.value)}
                maxLength={maxLength}
              />
            </div>
          </div>
          <div className="userName-user-info">
            <label>
              User Name ({userName.length}/{maxLength3})
            </label>
            <input
              value={userName}
              className="input-username-info"
              onChange={(e) => setUserName(e.target.value)}
              maxLength={maxLength3}
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={!isFormValid}
        className="button-submit"
      >
        Save
      </button>

      <Dialog
        open={!!croppingFile && !!croppingType}
        onClose={() => {
          setCroppingFile(null);
          setCroppingType(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          {croppingFile && croppingType && (
            <ImageCropper
              key={`${croppingType}-${croppingFile?.name}`} // 👈 ensures a full remount every time
              file={croppingFile}
              croppingType={croppingType}
              aspect={croppingType === "background" ? 16 / 9 : 1}
              onCancel={() => {
                setCroppingFile(null);
                setCroppingType(null);
              }}
              onComplete={handleCroppedImage}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditProfile;
