import { useEffect, useState } from "react";
import { databases } from "../appwrite";
import { Link } from "react-router-dom";
import NewArticles from "./NewArticles";
import PostImage from "../Components/PostImage";

type Channel = {
  $id: string;
  collectionName: string;
  backgroundImageId: string;
  // Add any other fields you expect on each document
};

const Discovery: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);

  const [channels, setChannels] = useState<Channel[]>([]);

  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const userCollect = import.meta.env.VITE_USER_COLLECTION;

  const documentIds = [
    "687fdf9f0033be213536",
    "68806191003db3cf1a9c",
    "6880622f000c70895736",
    "6880aa7c0013a19458d5",
    "6880aa990038cdd8e886",
    "6880aabd002ed9c74423",
    "6880ab2400328646582a",
  ];

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const promises = documentIds.map((id) =>
          databases.getDocument(databaseId, userCollect, id)
        );
        const responses = await Promise.all(promises);
        const typedChannels: Channel[] = responses.map((doc) => ({
          $id: doc.$id,
          collectionName: doc.collectionName, // ensure this exists
          backgroundImageId: doc.backgroundImageId,
          // map other fields as needed
        }));
        setChannels(typedChannels);
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);
  if (loading) return <span className="loader"></span>;
  return (
    <div className="container4">
      <div className="navigate-sec-prev">
        <div className="navigate-section">
          <div className="left-article">
            <NewArticles />
          </div>
          <div className="right-channels">
            <div className="inside-channels">
              <div className="titles-sec">
                <p>Channels of the week</p>
              </div>
              <div className="channels0ne">
                {channels.map((channel) => (
                  <div key={channel.$id} className="chanelsinsider">
                    <Link to={`/CollectionImages/${channel.$id}`}>
                      <img
                        src={`https://cloud.appwrite.io/v1/storage/buckets/67be51020004776eea1a/files/${channel.backgroundImageId}/view?project=67bc93bc0004228cf938`}
                        alt=""
                      />
                      <div className="channels-tittles">
                        <p>{channel.collectionName}</p>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <PostImage />
    </div>
  );
};

export default Discovery;
