import { useEffect, useState, useCallback } from "react";
import { databases, account, Query, client, storage } from "../appwrite";
import { Models } from "appwrite";

// Types
type Notification = {
  userName: string;
  $id: string;
  recipientId: string;
  actorId: string;
  postId: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  imageFileId: string;
  profilePictureId: string;
  post?: Post | null;
  actor?: User | null;
};

type Post = {
  $id: string;
  imageFileId?: string;
  profilePictureId?: string;
  imageId?: string;
};

interface Preferences {
  bioId: string;
  displayName: string;
  profilePictureId?: string;
  backgroundImageId?: string;
}

interface User {
  $id: string;
  userName: string;
  displayName: string;
  prefs: Preferences;
}

type UseNotificationsOptions = {
  limit?: number;
  filter?: "all" | "unread";
};

const useNotifications = ({
  limit = 10,
  filter = "all",
}: UseNotificationsOptions = {}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const POSTS_COLLECTION_ID = import.meta.env.VITE_USER_POST_COLLECTION_ID;
  const USERS_COLLECTION_ID = import.meta.env.VITE_USER_PREF_COLLECTION_ID;
  const NOTIFICATIONS_COLLECTION_ID = import.meta.env.VITE_NOTIFICATIONS;
  const STORAGE_BUCKET_ID = import.meta.env.VITE_BUCKET_PFPBG;

  useEffect(() => {
    account.get().then((user) => {
      setCurrentUserId(user.$id);
    });
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    let isMounted = true;

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const queries = [
          Query.equal("recipientId", currentUserId),
          Query.limit(limit),
          Query.offset(page * limit),
          Query.orderDesc("createdAt"),
        ];

        if (filter === "unread") {
          queries.push(Query.equal("read", false));
        }

        const res = await databases.listDocuments(
          databaseId,
          NOTIFICATIONS_COLLECTION_ID,
          queries
        );

        const newItems = await Promise.all(
          res.documents.map(async (doc) => {
            let post: Post | null = null;
            let actor: User | null = null;

            try {
              if (doc.postId) {
                post = (await databases.getDocument(
                  databaseId,
                  POSTS_COLLECTION_ID,
                  doc.postId
                )) as Post;
              }
            } catch {
              console.warn(`Post ${doc.postId} not found`);
            }

            try {
              if (doc.actorId) {
                actor = (await databases.getDocument(
                  databaseId,
                  USERS_COLLECTION_ID,
                  doc.actorId
                )) as unknown as User;
              }
            } catch {
              console.warn(`User ${doc.actorId} not found`);
            }

            return {
              $id: doc.$id,
              recipientId: doc.recipientId,
              actorId: doc.actorId,
              postId: doc.postId,
              type: doc.type,
              message: doc.message,
              userName: doc.userName,
              read: doc.read,
              createdAt: doc.createdAt,
              imageFileId: doc.imageFileId,
              profilePictureId: doc.profilePictureId,
              post,
              actor,
            };
          })
        );

        if (isMounted) {
          const combined = [...notifications, ...newItems];
          const unread = combined.filter((n) => !n.read).length;
          setNotifications(combined);
          setUnreadCount(unread);
          setHasMore(res.documents.length === limit);
        }
      } catch (err) {
        setError("Failed to fetch notifications.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchNotifications();

    return () => {
      isMounted = false;
    };
  }, [currentUserId, page, filter]);

  useEffect(() => {
    if (!currentUserId) return;

    const unsubscribe = client.subscribe(
      `databases.${databaseId}.collections.${NOTIFICATIONS_COLLECTION_ID}.documents`,
      async (res) => {
        if (
          res.events.includes("databases.*.collections.*.documents.*.create")
        ) {
          const doc = res.payload as Models.Document;
          if (doc.recipientId === currentUserId) {
            let post: Post | null = null;
            let actor: User | null = null;

            try {
              if (doc.postId) {
                post = (await databases.getDocument(
                  databaseId,
                  POSTS_COLLECTION_ID,
                  doc.postId
                )) as Post;
              }
            } catch {}

            try {
              if (doc.actorId) {
                actor = (await databases.getDocument(
                  databaseId,
                  USERS_COLLECTION_ID,
                  doc.actorId
                )) as unknown as User;
              }
            } catch {}

            const newNotif: Notification = {
              $id: doc.$id,
              recipientId: doc.recipientId,
              actorId: doc.actorId,
              postId: doc.postId,
              type: doc.type,
              message: doc.message,
              userName: doc.userName,
              read: doc.read,
              createdAt: doc.createdAt,
              imageFileId: doc.imageFileId,
              profilePictureId: doc.profilePictureId,
              post,
              actor,
            };

            setNotifications((prev) => {
              if (prev.some((n) => n.$id === newNotif.$id)) return prev;
              return [newNotif, ...prev];
            });

            if (!doc.read) {
              setUnreadCount((prev) => prev + 1);
            }
          }
        }
      }
    );

    return () => unsubscribe();
  }, [currentUserId]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await databases.updateDocument(
          databaseId,
          NOTIFICATIONS_COLLECTION_ID,
          notificationId,
          {
            read: true,
          }
        );

        setNotifications((prev) =>
          prev.map((n) => (n.$id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        console.error("Failed to mark notification as read");
      }
    },
    [databaseId, NOTIFICATIONS_COLLECTION_ID]
  );

  return {
    notifications,
    loading,
    error,
    hasMore,
    unreadCount,
    loadMore: () => setPage((p) => p + 1),
    markAsRead,
  };
};

export default useNotifications;
