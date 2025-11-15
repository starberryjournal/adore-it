import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { storage, databases, account, Query } from "../appwrite";
import CollectLayoutCollect from "../Components/CollectLayoutCollect";
import "../Components/DragFileUploader.css";
import Toast from "../Components/Toast";

interface Collection {
  $id: string;
  collectionName: string;
  // Add other properties your collection uses
}

type Channel = {
  $id: string;
  collectionName: string;
  // Add any other fields you expect on each document
};

const CreatePost: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>(""); // Added state for displayName

  const [collections, setCollections] = useState<any[]>([]);
  const [description, setDescription] = useState<string>("");
  const [links, setLinks] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState(""); // Track the search input
  const [recentImages, setRecentImages] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [showChannels, setShowChannels] = useState(false);
  const [tagError, setTagError] = useState(false);

  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>(null);

  const [newCollectionName, setNewCollectionName] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isFormValid = Boolean((file || imagePreview) && tags.length > 0);

  const [tagInput, setTagInput] = useState("");
 
  const tagInputRef = useRef<HTMLInputElement>(null);
  const [, setError] = useState<string | null>(null);
  const [isImageUploaded, setIsImageUploaded] = useState(false);
  const [, setToast] = useState<{ message: string; type: string } | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [, setUploadedFileId] = useState("");
  const [, setIsUrlUploadReady] = useState(false);
  const [usedTags, setUsedTags] = useState<any[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);

  const [loading, setLoading] = useState(true);

  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const userPost = import.meta.env.VITE_USER_POST_COLLECTION_ID;
  const userCollect = import.meta.env.VITE_USER_COLLECTION;
  const buketPost = import.meta.env.VITE_BUCKET_POST;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentImages = async (collectionId: string) => {
      try {
        const response = await databases.listDocuments(
          databaseId,
          userPost, // posts collection ID
          [
            Query.equal("collectionId", collectionId),
            Query.orderDesc("$createdAt"),
            Query.limit(3),
          ]
        );
        return response.documents;
      } catch (error) {
        console.error("Error fetching recent images:", error);
        return [];
      }
    };

    const fetchUserAndData = async () => {
      try {
        const user = await account.get();
        setUserId(user.$id);
        setUserName(user.name);
        setDisplayName(user.prefs.displayName);

        const collectionsResponse = await databases.listDocuments(
          databaseId,
          userCollect,
          [Query.equal("userId", user.$id)]
        );
        setCollections(collectionsResponse.documents);

        const likedCollectionsResponse = await databases.listDocuments(
          databaseId,
          "67be4fe30038e2f0c316", // liked images collection ID
          [Query.orderDesc("$createdAt"), Query.equal("userId", user.$id)]
        );
        setCollections(likedCollectionsResponse.documents);

        const imagesPromises = likedCollectionsResponse.documents.map(
          (collection) => fetchRecentImages(collection.$id)
        );
        const imagesResults = await Promise.all(imagesPromises);
        const combinedImages = imagesResults.flat();
        setRecentImages(combinedImages);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Error fetching data. Please try again later.");
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDialog(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    fetchUserAndData(); // ✅ Make sure this is called BEFORE the return

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const user = await account.get();
        setUserId(user.$id);

        const response = await databases.listDocuments(databaseId, userPost, [
          Query.equal("userId", user.$id),
          Query.limit(100),
        ]);

        const allTags = response.documents
          .map((doc) =>
            (doc.tags?.split(",") || []).map((tag: string) => tag.trim())
          )
          .flat()
          .filter(
            (tag: string, index: number, self: string[]) =>
              tag && self.indexOf(tag) === index
          );
        setUsedTags(allTags);
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    };

    fetchTags();
  }, []);

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

  useEffect(() => {
    if (tagError && tagInputRef.current) {
      tagInputRef.current.focus();
    }
  }, [tagError]);

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);

    if (e.target.value.trim()) {
      setTagError(false); // ✅ Clear tag error on typing
    }
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();

    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
      setTagError(false); // ✅ Clear error when valid tag is added
    }
  };
  const filteredUsedTags = usedTags.filter((tag: string) =>
    tag.toLowerCase().includes(tagInput.toLowerCase())
  );

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };
  const handleAddTagFromSuggestion = (suggestedTag: string) => {
    if (!tags.includes(suggestedTag)) {
      setTags((prevTags) => [...prevTags, suggestedTag]);
    }
    setTagInput(""); // Clear input after adding
    setTagError(false); // Reset error state if needed
  };



  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFile(file);
    setIsImageUploaded(true);

    const reader = new FileReader();
    reader.onloadend = () => {
      const fileType = file.type;

      if (fileType === "image/gif") {
        const img = document.createElement("img");
        img.src = reader.result as string;

        img.onload = () => {
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          if (context) {
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0);
            const pngUrl = canvas.toDataURL("image/png");
            setImagePreview(pngUrl);
          }
        };
      } else {
        setImagePreview(reader.result as string);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      const event = {
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileUpload(event); // Reuse existing logic and set image uploaded
    }
  };

  // URL Change Handler
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  // URL Submit Handler: Fetch image from URL and display preview
  const handleUrlSubmit = async () => {
    console.log("Submitting image URL:", imageUrl);

    if (!imageUrl || imageUrl.trim() === "") {
      alert("Please provide a valid image URL!");
      return;
    }
    setIsLoading(true); // 🚀 Start loading

    try {
      const response = await fetch("http://localhost:3000/uploadImageFromUrl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        throw new Error(`Failed to upload image: ${response.statusText}`);
      }

      const { fileId, imageUrl: uploadedUrl } = await response.json();

      // ✅ Update the state to show preview and trigger form expansion
      setUploadedFileId(fileId);
      setImagePreview(uploadedUrl);
      setIsImageUploaded(true);
      setIsUrlUploadReady(true); // ✅ Set to true on successful upload
      console.log("Image uploaded successfully:", fileId);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error uploading image:", error.message);
        alert("Failed to upload image. Please check the console.");
      } else {
        console.error("Unknown error:", error);
        alert("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false); // ✅ End loading
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imagePreview) {
      setToastMessage("Please upload an image or paste a valid image URL.");
      setTimeout(() => setToastMessage(""), 1000);
      return;
    }

    if (tags.length === 0) {
      setTagError(true);
      setToastMessage(
        "To help others discover your image, please include at least one relevant tag."
      );
      return;
    } else {
      setTagError(false);
    }

    setIsLoading(true);

    let collectionId: string = selectedCollection?.$id || "";

    if (newCollectionName.trim()) {
      try {
        const newCollectionResponse = await databases.createDocument(
          databaseId,
          userCollect,
          "unique()",
          {
            collectionName: newCollectionName,
            userId,
            userName,
            displayName,
            collectionId: "",
            createdAt: new Date().toISOString(),
          }
        );
        collectionId = newCollectionResponse.$id;
      } catch (error) {
        console.error("Error creating new collection:", error);
        alert("Failed to create a new collection");
        return;
      }
    }

    try {
      setToast({ message: "Creating your post...", type: "loading" });

      let fileId = "";
      let newFileName = "";

      // Upload image from preview URL
      const imageResponse = await fetch(imagePreview);
      if (!imageResponse.ok) {
        throw new Error("Failed to fetch the image from the URL.");
      }

      const imageBlob = await imageResponse.blob();
      const mimeType = imageBlob.type; // e.g. "image/png"
      const extension = mimeType.split("/")[1]; // e.g. "png"
      const randomNumber = Math.floor(Math.random() * 1000000000);
      newFileName = `image-${randomNumber}.${extension}`;

      const file = new File([imageBlob], newFileName, { type: mimeType });

      const fileResponse = await storage.createFile(
        buketPost,
        "unique()",
        file
      );
      fileId = fileResponse.$id;

      console.log(
        "Image from preview uploaded. ID:",
        fileId,
        "FileName:",
        newFileName
      );

      if (userId && userName) {
        const tagsString = tags.join(", ");
        const postDetails = {
          tags: tagsString,
          imageFileId: fileId,
          userId,
          imageId: "$id",
          links: links.trim() ? links : null,
          postId: "$id",
          postedBy: "$id",
          followId: "$id",
          description,
          userName,
          displayName,
          collectionId,
          fileName: newFileName,
          createdAt: new Date().toISOString(),
        };

        const postResponses = await databases.createDocument(
          databaseId,
          userPost,
          "unique()",
          postDetails
        );

        const postId = postResponses.$id;
        const createdAt = postResponses.createdAt;
        const $createdAt = postResponses.$createdAt;

        await databases.updateDocument(databaseId, userPost, postId, {
          postId,
          imageId: postId,
          followId: userId,
          postedBy: userId,
        });

        await databases.updateDocument(databaseId, userCollect, collectionId, {
          collectionId,
          createdAt: new Date().toISOString(),
        });

        setToast({ message: "Post created successfully!", type: "success" });

        setTimeout(() => {
          setToast(null);
          navigate(`/Post/${postId}`, {
            state: {
              imageSrc: `http://localhost:3000/image/${fileId}`,
              tags: tagsString,
              userName,
              imageFileId: fileId,
              userId,
              followId: userId,
              description,
              imageId: postId,
              postedBy: userId,
              links,
              createdAt: createdAt || $createdAt,
              $createdAt: $createdAt,
            },
          });
        }, 1500);
      } else {
        alert("User not logged in");
      }
    } catch (error) {
      setToast({ message: "Failed to create post.", type: "error" });
      setTimeout(() => setToast(null), 2500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container2">
      <div className="">
        {toastMessage && (
          <Toast message={toastMessage} onClose={() => setToastMessage("")} />
        )}

        <form onSubmit={handleSubmit} className="input-files-creat">
          {isLoading && (
            <div className="page-loader">
              <span className="loader"></span>
            </div>
          )}
          <div className="left-side-info">
            {!isImageUploaded && (
              <div className="words-nd-upload">
                <h1>Upload images that inspire!</h1>
                <div className="left-collage">
                  <div
                    className={`drop-zone ${dragOver ? "drag-over" : ""}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onChange={handleFileUpload}
                    onDrop={handleDrop}
                  >
                    <img
                      src="/src/assets/SVG/dock-svgrepo-com.svg"
                      alt="Upload"
                      className="upload-icon"
                    />
                    <p>Drop file here</p>
                    <span>OR</span>
                    <label className="upload-btn">
                      Upload File
                      <input
                        type="file"
                        accept=".jpg,.png,.gif,.jpeg"
                        onChange={handleFileUpload}
                        hidden
                      />
                    </label>
                    <p className="file-types">
                      Only PNG, JPG, JPEG and GIF files are supported
                    </p>
                  </div>
                  {/* Image URL Input Section */}
                  <div className="url-image">
                    <div className="url-text">
                      <p>Or paste an image URL here:</p>
                      <input
                        type="text"
                        value={imageUrl}
                        onChange={handleUrlChange}
                        placeholder="Enter image URL"
                        style={{ borderBottom: "1px solid #FF79C6" }}
                      />
                    </div>

                    <button
                      onClick={handleUrlSubmit}
                      disabled={!imageUrl.trim()}
                      className="submit-button-url"
                    >
                      Load Image
                    </button>
                  </div>
                </div>
                <div className="right-time">
                  <div className="upload-letter">
                    <p>
                      jeKiffe is a community for authentic, creative expression
                      fueled by human creativity and perspective. To maintain
                      these values,<b>AI-generated images are not permitted</b>{" "}
                      . Thank you for your understanding!
                    </p>
                    <p className="lien-regle">Read our policy for more</p>
                  </div>
                </div>
              </div>
            )}

            <div className="left-form">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Image Preview"
                  className="image-previews"
                />
              )}
            </div>
          </div>

          {isImageUploaded && (
            <div className="right-form">
              <div>
                <label>collection:</label>
                <button
                  type="button"
                  onClick={() => setShowDialog(!showDialog)}
                  className="ChooseACollection"
                >
                  {selectedCollection
                    ? selectedCollection.collectionName
                    : "Choose a Collection"}
                </button>

                {showDialog && (
                  <div className="choose-collect" ref={dropdownRef}>
                    <div className="search-bar-collect">
                      <input
                        type="text"
                        placeholder="Search collections..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <div className="svg-search-coll">
                        <img
                          src="/src/assets/SVG/search-svgrepo-com.svg"
                          alt="svg image"
                        />
                      </div>
                    </div>
                    <ul className="list-collect-create">
                      <div className="collection-area">
                        {collections
                          .filter((collection) =>
                            collection.collectionName
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase())
                          )
                          .map((collection) => {
                            const collectionRecentImages = recentImages.filter(
                              (image) => image.collectionId === collection.$id
                            );

                            return (
                              <div
                                className="collections-mini"
                                key={collection.$id}
                              >
                                <div
                                  onClick={() => {
                                    setSelectedCollection(collection);
                                    setShowDialog(false);
                                  }}
                                  className={
                                    selectedCollection?.$id === collection.$id
                                      ? "selected-collect"
                                      : ""
                                  }
                                >
                                  <CollectLayoutCollect
                                    collection={collection}
                                    recentImages={collectionRecentImages}
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </ul>
                  </div>
                )}
              </div>
              <div>
                <h4 onClick={() => setShowChannels(!showChannels)}>Channel</h4>

                {showChannels && (
                  <div className="seleted-channels">
                    <div className="inside-channels">
                      {loading ? (
                        <p>Loading documents...</p>
                      ) : channels.length > 0 ? (
                        channels.map((channel) => (
                          <div
                            key={channel.$id}
                            onClick={() => {
                              setSelectedCollection(channel);
                              setShowChannels(false);
                            }}
                            className={
                              selectedCollection?.$id === channel.$id
                                ? "selected-collect-2 "
                                : "channels-hover"
                            }
                          >
                            <p>{channel.collectionName}</p>
                            {/* Add more fields as needed */}
                          </div>
                        ))
                      ) : (
                        <p>No documents found.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="create-new">Create new collection:</label>
                <input
                  type="text"
                  value={newCollectionName}
                  className="new-collection-name"
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="New collection name"
                />
              </div>
              <div className="descriptions">
                <textarea
                  placeholder="Add description"
                  value={description}
                  className="add-descriptions"
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="add-link-to">
                <label>Include a Link:</label>
                <input
                  type="text"
                  value={links}
                  onChange={(e) => setLinks(e.target.value)}
                  placeholder="Enter a URL"
                />
              </div>

              <div className="left-tag-button">
                <div className="tags-section-add">
                  <p>Describe the image with tags:</p>
                  <input
                    type="text"
                    placeholder="Add a tag"
                    value={tagInput}
                    ref={tagInputRef}
                    className="tags-sections-add"
                    style={{
                      border: tagError ? "2px solid red" : "1px solid #ccc", // ✅ Show red only if tagError is true
                    }}
                    onChange={handleTagInputChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />

                  {tagError && (
                    <p className="error-message">Please add at least one tag</p>
                  )}
                </div>
                {toastMessage && (
                  <Toast
                    message={toastMessage}
                    onClose={() => setToastMessage("")}
                  />
                )}

                <button
                  type="button"
                  onClick={handleAddTag}
                  title="Add Tag"
                  className="add-tag-button"
                >
                  <img
                    src="./src/assets/SVG/tag-svgrepo-com.svg"
                    alt="svg image"
                  />
                </button>
              </div>
              {tagInput.trim() && filteredUsedTags.length > 0 && (
                <div className="tag-suggestions">
                  <p className="used-tags-title">Tags matching your input:</p>
                  <div className="main-tags">
                    {filteredUsedTags.map((tag) => (
                      <span
                        key={tag}
                        className="bold-tags"
                        onClick={() => {
                          setTagInput("");
                          handleAddTagFromSuggestion(tag);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="main-tags">
                {" "}
                {tags.map((tag) => (
                  <span key={tag} className="bold-tags">
                    {" "}
                    <div className="text-tags">{tag} </div>{" "}
                    <button
                      type="button"
                      className="tag-deleted"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {" "}
                      x{" "}
                    </button>{" "}
                  </span>
                ))}{" "}
              </div>

              <button
                type="submit"
                className="post-button"
                onClick={handleSubmit}
                disabled={!isFormValid || isLoading}
                style={{
                  opacity: !isFormValid || isLoading ? 0.5 : 1,
                  cursor: !isFormValid || isLoading ? "not-allowed" : "pointer",
                }}
              >
                {isLoading ? "Uploading..." : "Post"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
