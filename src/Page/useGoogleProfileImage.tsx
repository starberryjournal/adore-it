import { account, storage, databases } from "../appwrite"; // adjust imports

export async function uploadGoogleAvatar({
  bucketId,
  databaseId,
  collectionId,
}: {
  bucketId: string;
  databaseId: string;
  collectionId: string;
  defaultBackgroundImageId: string;
}) {
  try {
    const user = await account.get();
    const session = await account.getSession("current");
    const defaultProfilePictureId = "67bcb7f900374bd0324e";
    const defaultBackgroundImageId = "67bcb808000adb02953e";
    if (!session.providerAccessToken) return null;

    const googleProfile = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${session.providerAccessToken}` },
      }
    ).then((res) => res.json());

    const profileImageUrl = googleProfile.picture;
    if (!profileImageUrl) return null;

    // Skip if already set
    if (user.prefs?.profilePictureId) {
      return user.prefs.profilePictureId;
    }

    const res = await fetch(profileImageUrl);
    if (!res.ok) throw new Error("Failed to download Google image");
    const blob = await res.blob();

    const fileName = `${user.$id}-google-avatar.jpg`;
    const file = new File([blob], fileName, { type: blob.type });

    const uploaded = await storage.createFile(bucketId, "unique()", file);

    const prefsDocId = "unique()";
    await databases.createDocument(databaseId, collectionId, prefsDocId, {
      userId: user.$id,
      followId: user.$id,
      userName: user.name,
      bioId: "",
      profilePictureId: defaultProfilePictureId,
      backgroundImageId: defaultBackgroundImageId,
    });

    await account.updatePrefs({
      prefsDocId,
      bioId: "",
      profilePictureId: defaultProfilePictureId,
      backgroundImageId: defaultBackgroundImageId,
    });

    console.log("Google profile image uploaded and linked!");
    return uploaded.$id;
  } catch (err) {
    console.error("Error uploading Google avatar:", err);
    return null;
  }
}
