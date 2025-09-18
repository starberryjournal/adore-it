import React, { useEffect, useState } from "react";
import { account, databases, Query } from "../appwrite";
import CollectLayoutSame from "./CollectLayoutSame";

interface Picture {
  $id: string;
  collectionId: string;
  imageFileId: string;
  fileName: string;
}

interface CollectionData {
  $id: string;
  collectionName: string;
  userName: string;
  postIds: string[];
  recentImages?: Picture[]; // ✅ attach images directly
}

interface Props {
  postId: string;
}

const ImageCollectionInfo: React.FC<Props> = ({ postId }) => {
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [followedCollections, setFollowedCollections] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const dbId = import.meta.env.VITE_DATABASE_ID;
  const postCollectionId = import.meta.env.VITE_COLLECT_OTHERIMG;
  const creatPost = import.meta.env.VITE_USER_POST_COLLECTION_ID;
  const collectionListId = import.meta.env.VITE_USER_COLLECTION;
  const followsCollectionId = import.meta.env.VITE_USERFOLLOWCOLLECT;

  useEffect(() => {
    if (!postId) return;

    const fetchRecentImages = async (collectionId: string) => {
      try {
        // Fetch both createPost and userAddImgtoCollect
        const [originals, saved] = await Promise.all([
          databases.listDocuments(dbId, creatPost, [
            Query.equal("collectionId", collectionId),
          ]),
          databases.listDocuments(dbId, postCollectionId, [
            Query.equal("collectionId", collectionId),
          ]),
        ]);

        const combined = [...originals.documents, ...saved.documents];

        // De-duplicate by imageFileId
        const uniqueMap = combined.reduce((acc, doc) => {
          if (doc.imageFileId) acc[doc.imageFileId] = doc;
          return acc;
        }, {} as Record<string, any>);

        const recent = Object.values(uniqueMap)
          .sort(
            (a, b) =>
              new Date(b.collectionCreatedAt || b.$createdAt).getTime() -
              new Date(a.collectionCreatedAt || a.$createdAt).getTime()
          )
          .slice(0, 3);

        return recent.map((doc) => ({
          $id: doc.$id,
          collectionId: doc.collectionId,
          imageFileId: doc.imageFileId,
          fileName: doc.fileName ?? "",
        })) as Picture[];
      } catch (error) {
        console.error("Error fetching recent images:", error);
        return [];
      }
    };

    const fetchCollectionsAndImages = async () => {
      setLoading(true);
      try {
        const user = await account.get();
        const currentUserId = user.$id;
        setCurrentUserId(currentUserId);

        const collectionsMap = new Map<string, CollectionData>();

        // 🔹 STEP 1: Fetch original post and its collection
        const originalPost = await databases.getDocument(
          dbId,
          creatPost,
          postId
        );
        const originalCollectionId = originalPost.collectionId;

        if (!originalCollectionId) {
          console.warn("⚠️ No collectionId found in original post");
        } else {
          try {
            const originalCollectionDoc = await databases.getDocument(
              dbId,
              collectionListId,
              originalCollectionId
            );

            const originalImages = await fetchRecentImages(
              originalCollectionId
            );

            collectionsMap.set(originalCollectionId, {
              $id: originalCollectionDoc.$id,
              collectionName: originalCollectionDoc.collectionName,
              userName: originalCollectionDoc.userName,
              postIds: originalCollectionDoc.postIds,
              recentImages: originalImages,
            });
          } catch (err) {
            console.warn(
              `⚠️ Failed to fetch collection with ID ${originalCollectionId}`,
              err
            );
          }
        }

        // 🔹 STEP 2: Fetch user-added mappings for this postId
        const mappingsResponse = await databases.listDocuments(
          dbId,
          postCollectionId,
          [Query.equal("postId", postId)]
        );
        console.log(
          "📌 Post saved in user collections (mappings):",
          mappingsResponse.documents
        );

        const userAddedCollectionIds = mappingsResponse.documents.map(
          (doc) => doc.collectionId
        );

        const userCollectionDocs = await Promise.all(
          userAddedCollectionIds.map(async (id) => {
            if (collectionsMap.has(id)) return null;
            try {
              const doc = await databases.getDocument(
                dbId,
                collectionListId,
                id
              );
              const images = await fetchRecentImages(id);
              return {
                $id: doc.$id,
                collectionName: doc.collectionName,
                userName: doc.userName,
                postIds: doc.postIds,
                recentImages: images,
              };
            } catch (err: any) {
              if (err.code === 404) {
                console.warn(`❌ Collection ${id} no longer exists. Skipping.`);
              } else {
                console.error(`Error fetching collection ${id}`, err);
              }
              return null;
            }
          })
        );

        userCollectionDocs.forEach((col) => {
          if (col) collectionsMap.set(col.$id, col);
        });

        // 🔹 STEP 4: Fetch followed collections
        const followsResponse = await databases.listDocuments(
          dbId,
          followsCollectionId,
          [Query.equal("userId", currentUserId)]
        );

        const followedIds = followsResponse.documents.map(
          (doc) => doc.collectionId
        );

        // 🔹 Set state
        const final = Array.from(collectionsMap.values());
        setCollections(final);
        setFollowedCollections(followedIds);
      } catch (error) {
        setError("Something went wrong while loading collections.");
      } finally {
        setLoading(false);
      }
    };

    fetchCollectionsAndImages();
  }, [postId]);

  const handleFollow = async (collectionId: string) => {
    try {
      if (followedCollections.includes(collectionId)) {
        const response = await databases.listDocuments(
          dbId,
          followsCollectionId,
          [Query.equal("collectionId", collectionId)]
        );
        const followDoc = response.documents[0];
        if (followDoc) {
          await databases.deleteDocument(
            dbId,
            followsCollectionId,
            followDoc.$id
          );
          setFollowedCollections(
            followedCollections.filter((id) => id !== collectionId)
          );
        }
      } else {
        await databases.createDocument(dbId, followsCollectionId, "unique()", {
          collectionId,
          userId: currentUserId, // Add this field
        });

        setFollowedCollections([...followedCollections, collectionId]);
      }
    } catch (err) {
      console.error("Error updating follow state:", err);
      setError("Couldn't update follow status.");
    }
  };

  return (
    <div className="collection-in">
      {loading && <p>Loading...</p>}
      {!loading && collections.length === 0 && <p>No collections found.</p>}

      <div className="div-middle">
        <div className="left">
          <p>This image is in {collections.length} collections</p>
        </div>
        <div className="right">
          <div className="top-center-collect">
            {!loading && collections.length > 3 && (
              <button
                onClick={() => setShowAll((prev) => !prev)}
                className="view-all-button"
              >
                {showAll ? "Show Less" : "View All Collections"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bottom-center">
        <div className="picture-square-collect">
          {!loading &&
            collections
              .slice(0, showAll ? collections.length : 3)
              .map((collection) => (
                <CollectLayoutSame
                  key={collection.$id}
                  collection={collection}
                  recentImages={collection.recentImages ?? []}
                  followedCollections={followedCollections}
                  handleFollow={handleFollow}
                />
              ))}
        </div>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default ImageCollectionInfo;
