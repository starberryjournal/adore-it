import { databases } from "../appwrite";

type NotificationInput = {
  recipientId: string;
  actorId: string;
  postId: string;
};

const createNotification = async ({
  recipientId,
  actorId,
  postId,
}: NotificationInput) => {
  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const userNotififcations = import.meta.env.VITE_NOTIFICATIONS;

  await databases.createDocument(databaseId, userNotififcations, "unique()", {
    recipientId,
    actorId,
    postId,
    type: "like",
    message: "liked your post",
    read: false,
    createdAt: new Date().toISOString(),
  });
};

export default createNotification;
