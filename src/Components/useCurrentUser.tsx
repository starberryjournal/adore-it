// src/hooks/useCurrentUser.ts
import { useEffect, useState } from "react";
import { account } from "../appwrite";

interface Preferences {
  bioId: string;
  displayName: string;
  profilePictureId?: string;
  backgroundImageId?: string;
}

interface User {
  $id: string;
  name: string;
  userName: string;
  displayName: string;
  prefs: Preferences;
}

export const useCurrentUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const rawUser = await account.get();
        const reshapedUser: User = {
          $id: rawUser.$id,
          name: rawUser.name,
          userName: rawUser.prefs?.userName ?? "",
          displayName: rawUser.prefs?.displayName ?? "",
          prefs: {
            bioId: rawUser.prefs?.bioId ?? "",
            displayName: rawUser.prefs?.displayName ?? "",
            profilePictureId: rawUser.prefs?.profilePictureId,
            backgroundImageId: rawUser.prefs?.backgroundImageId,
          },
        };
        setUser(reshapedUser);
      } catch (err) {
        console.error("Error fetching current user:", err);
        setError("Failed to load user.");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading, error };
};
