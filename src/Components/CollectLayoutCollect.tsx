import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { databases, Query } from "../appwrite";

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
}

const CollectLayoutCollect: React.FC<Props> = ({
  collection,
  recentImages,
}) => {
  const filteredImages = recentImages
    .filter((picture) => picture.collectionId === collection.$id)
    .slice(0, 3);

  const [imageCount, setImageCount] = useState<number>(0);
  const [FollowCount, setFollowCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [images, setImages] = useState<any[]>([]);

  const dbId = import.meta.env.VITE_DATABASE_ID;
  const postCollectionId = import.meta.env.VITE_COLLECT_OTHERIMG;
  const creatPost = import.meta.env.VITE_USER_POST_COLLECTION_ID;

  console.log("Filtered Images:", filteredImages);

  useEffect(() => {
    const fetchCounts = async () => {
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
        console.log("User posts:", imagesFromCreatPost);
        console.log("Added images:", imagesFromPostCollection);
      } catch (error) {
        console.error("Error fetching counts:", error);
      }
    };

    fetchCounts();
  }, [collection.$id]);

  return (
    <div className="collections-square-add">
      <div className="add-2-collections">
        {filteredImages.length === 0 ? (
          <div className="no-images-placeholder">No images yet</div>
        ) : filteredImages.length < 3 ? (
          <div className="single-large-image-2">
            <img
              key={filteredImages[0].$id}
              src={`https://cloud.appwrite.io/v1/storage/buckets/67be51020004776eea1a/files/${filteredImages[0].imageFileId}/view?project=67bc93bc0004228cf938`}
              alt={filteredImages[0].fileName}
            />
          </div>
        ) : (
          <>
            {filteredImages.length > 0 && (
              <div className="big-image-2">
                <img
                  key={filteredImages[0].$id}
                  src={`https://cloud.appwrite.io/v1/storage/buckets/67be51020004776eea1a/files/${filteredImages[0].imageFileId}/view?project=67bc93bc0004228cf938`}
                  alt={filteredImages[0].fileName}
                />
              </div>
            )}
            <div className="small-sec-images-2">
              {filteredImages.slice(1).map((picture) => (
                <div key={picture.$id} className="small-image-2">
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
      <div className="bottom-top-div">
        <div className="collect-name">
          <p>{collection.collectionName}</p>
        </div>
        <div className="Image-Follow-two">
          {imageCount > 0 ? `${imageCount}  ` : "0"}♥{" "}
        </div>
      </div>
    </div>
  );
};

export default CollectLayoutCollect;
