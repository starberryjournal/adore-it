import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { account, databases, Query } from "../appwrite";
import FollowCollectButton from "./FollowCollectButton";

interface Picture {
  $id: string;
  collectionId: string;
  imageFileId: string;
  fileName: string;
}

interface Props {
  collection: {
    $id: string;
    collectionName: string;
    userName: string;
  };
  recentImages: Picture[];
  followedCollections: string[];
  handleFollow: (collectionId: string) => Promise<void>;
}

const CollectLayout: React.FC<Props> = ({
  collection,
  recentImages,
  followedCollections,
  handleFollow,
}) => {
  const { collectionId } = useParams<{ collectionId: string }>();
  const navigate = useNavigate();
  const filteredImages = recentImages
    .filter((picture) => picture.collectionId === collection.$id)
    .slice(0, 3);

  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const [imageCount, setImageCount] = useState<number>(0);
  const [FollowCount, setFollowCount] = useState<number>(0);
  const [currentUserId, setCurrentUserId] = useState("");
  const [collectionUserId, setCollectionUserId] = useState("");

  const dbId = import.meta.env.VITE_DATABASE_ID;
  const postCollectionId = import.meta.env.VITE_COLLECT_OTHERIMG;
  const creatPost = import.meta.env.VITE_USER_POST_COLLECTION_ID;
  const collectionListId = import.meta.env.VITE_USER_COLLECTION;
  const followsCollectionId = import.meta.env.VITE_USERFOLLOWCOLLECT;

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await account.get();
        setCurrentUserId(user.$id);
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };

    const fetchCounts = async () => {
      setLoading(true);
      try {
        const [imagesFromCreatPost, imagesFromPostCollection] =
          await Promise.all([
            databases.listDocuments(dbId, creatPost, [
              Query.equal("collectionId", collection.$id),
            ]),
            databases.listDocuments(dbId, postCollectionId, [
              Query.equal("collectionId", collection.$id),
            ]),
          ]);

        setImageCount(
          imagesFromCreatPost.documents.length +
            imagesFromPostCollection.documents.length
        );
        // fecth collection followers count
        const Follow = await databases.listDocuments(
          dbId,
          followsCollectionId, // Replace with your user collections collection ID
          [Query.equal("collectionId", collection.$id)]
        );

        setFollowCount(Follow.documents.length);
      } catch (error) {
        console.error("Error fetching counts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
    fetchCurrentUser();
  }, [collection.$id]);

  return (
    <div className="collections-square">
      <div className="collection-size">
        <div
          className="images-collections"
          onClick={() => navigate(`/CollectionImages/${collection.$id}`)}
        >
          {filteredImages.length === 0 ? (
            <div className="no-images-placeholder">No images yet</div>
          ) : filteredImages.length < 3 ? (
            <div className="single-large-image">
              <img
                key={filteredImages[0].$id}
                src={`https://cloud.appwrite.io/v1/storage/buckets/67be51020004776eea1a/files/${filteredImages[0].imageFileId}/view?project=67bc93bc0004228cf938`}
                alt={filteredImages[0].fileName}
              />
            </div>
          ) : (
            <>
              <div className="big-image">
                <img
                  key={filteredImages[0].$id}
                  src={`https://cloud.appwrite.io/v1/storage/buckets/67be51020004776eea1a/files/${filteredImages[0].imageFileId}/view?project=67bc93bc0004228cf938`}
                  alt={filteredImages[0].fileName}
                />
              </div>
              <div className="small-sec-images">
                {filteredImages.slice(1).map((picture) => (
                  <div key={picture.$id} className="small-image">
                    <img
                      src={`https://cloud.appwrite.io/v1/storage/buckets/67be51020004776eea1a/files/${picture.imageFileId}/view?project=67bc93bc0004228cf938`}
                      alt={picture.fileName}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="collection-name">
        <div className="left-collection">
          <div className="name-collect">
            <Link to={`/CollectionImages/${collection.$id}`}>
              {isHovered && followedCollections.includes(collection.$id)
                ? collection.collectionName
                : collection.collectionName}
            </Link>
          </div>
          <div className="Image-Follow">
            <Link to={`/CollectionImages/${collection.$id}`}>
              {imageCount > 0 ? `${imageCount}  ` : "0"}♥ -{" "}
              {FollowCount > 0 ? `${FollowCount} Followers` : "0 Followers"}
            </Link>
          </div>
        </div>
        <div className="right-collection-inside">
          <div className="button-collection-outit">
            <button
              onClick={() =>
                navigate(`/EditCollections/${collection.$id}`, {
                  state: { collection }, // ✅ Correct placement
                })
              }
              className="edit-button"
            >
              Edit Collection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectLayout;
