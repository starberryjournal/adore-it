import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

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
  recentImages: Picture[]; // ✅ Add this line
  followedCollections: string[];
  handleFollow: (collectionId: string) => Promise<void>;
}

const CollectLayoutSame: React.FC<Props> = ({
  collection,
  recentImages,
  followedCollections,
  handleFollow,
}) => {
  const navigate = useNavigate();
  const filteredImages = recentImages.slice(0, 3);
  const [isHovered, setIsHovered] = useState(false);
  //const [imageCount, setImageCount] = useState<number>(0);
  //const [followCount, setFollowCount] = useState<number>(0);

  return (
    <div className="collections-square-collect">
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
          <div className="creator-name">
            <p
              onClick={() =>
                navigate(`/ViewUserProfile/${collection.userName}`)
              }
              className="creator-name"
            >
              @{collection.userName}
            </p>
          </div>
        </div>
        <div className="right-collection">
          <button
            className={
              followedCollections.includes(collection.$id)
                ? "follow-button followed"
                : "follow-button"
            }
            onClick={() => handleFollow(collection.$id)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {followedCollections.includes(collection.$id)
              ? "Unfollow"
              : "Follow"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollectLayoutSame;
