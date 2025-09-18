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

const CollectLayoutUserFollow: React.FC<Props> = ({
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

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const [imageCount, setImageCount] = useState<number>(0);
  const [FollowCount, setFollowCount] = useState<number>(0);
  const [currentUserId, setCurrentUserId] = useState("");
  const [collectionUserId, setCollectionUserId] = useState("");

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
      try {
        const [images, Follow] = await Promise.all([
          databases
            .listDocuments("67bcb64c0027e7eaa736", "67be4e9e001142383751", [
              Query.equal("collectionId", collection.$id),
            ])
            .then((res) => res.documents.length),
          databases
            .listDocuments("67bcb64c0027e7eaa736", "67c077a3000cc0e2f3cc", [
              Query.equal("collectionId", collection.$id),
            ])
            .then((res) => res.documents.length),
        ]);

        setImageCount(images);
        setFollowCount(Follow);
      } catch (error) {
        console.error("Error fetching counts:", error);
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
                ? "Followed"
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
          <div className="right-collection">
            <button
              className={
                followedCollections.includes(collection.$id)
                  ? "follow-button followed"
                  : "follow-button"
              }
              onClick={() => handleFollow(collection.$id)}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {followedCollections.includes(collection.$id)
                ? "Unfollow"
                : "Follow"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectLayoutUserFollow;
