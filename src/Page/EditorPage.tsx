import React, { useEffect, useRef, useState } from "react";
import "react-quill-new/dist/quill.snow.css";
import "./Editorpage.css";

import { account, databases, Query, storage } from "../appwrite"; // make sure path matches your project

import { useNavigate } from "react-router-dom";
import Toast from "../Components/Toast";
import CollectLayoutCollect from "../Components/CollectLayoutCollect";

import TiptapEditor from "./TiptapEditor";

interface Collection {
  $id: string;
  collectionName: string;
  // Add other properties your collection uses
}

interface Picture {
  $id: string;
  collectionId: string;
  imageFileId: string;
  fileName: string;
}

interface Preferences {
  bioId: string;
  displayName: string;
  profilePictureId?: string;
  backgroundImageId?: string;
}

interface User {
  $id: string;
  name: string;
  prefs: Preferences;
}

const EditorPage: React.FC = () => {
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [userName, setUserName] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>(""); // Added state for displayName
  const [userId, setUserId] = useState<string | null>(null);

  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>(null);
  const [searchTerm, setSearchTerm] = useState(""); // Track the search input

  const [newCollectionName, setNewCollectionName] = useState<string>("");
  const [coverImageFileId, setCoverImageFileId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const [tagInput, setTagInput] = useState("");
  const [tagError, setTagError] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [, setToast] = useState<{ message: string; type: string } | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [, setAllImages] = useState<Picture[]>([]); // Fetched from collections
  const [showCoverSelector, setShowCoverSelector] = useState(false);
  const [showEditorImageSelector, setShowEditorImageSelector] = useState(false);

  const [, setUser] = useState<User | null>(null);
  const [, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const [collections, setCollections] = useState<any[]>([]);
  const [pendingImageInsertFn, setPendingImageInsertFn] =
    useState<(url: string) => void>();
  const [recentImages, setRecentImages] = useState<any[]>([]);
  const [, setError] = useState<string | null>(null);
  const [isDraft] = useState(false); // To track if content is saved as a draft

  const [draftToDelete, setDraftToDelete] = useState<string | null>(null);

  const [drafts, setDrafts] = useState<any[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<any | null>(null);
  const navigate = useNavigate();
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(
    null
  );
  const [collectionImages, setCollectionImages] = useState<Picture[]>([]);

  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const userArcticles = import.meta.env.VITE_USER_ARTICLES;
  const userPostId = import.meta.env.VITE_USER_POST_COLLECTION_ID;
  const userCollect = import.meta.env.VITE_USER_COLLECTION;
  const postCollectionId = import.meta.env.VITE_COLLECT_OTHERIMG;
  const draftsArticle = import.meta.env.VITE_DRAFTS_ARTICLE;

  const fetchCurrentUser = async () => {
    try {
      const currentUser = await account.get();
      console.log("Current user:", currentUser); // Log current user data
      setUser(currentUser as unknown as User);

      setUserId(currentUser.$id);
      setUserName(currentUser.name);
      setDisplayName(currentUser.prefs.displayName);

      const collectionsResponse = await databases.listDocuments(
        databaseId,
        userCollect,
        [Query.equal("userId", currentUser.$id)]
      );
      setCollections(collectionsResponse.documents);

      const likedCollectionsResponse = await databases.listDocuments(
        databaseId,
        "67be4fe30038e2f0c316", // liked images collection ID
        [Query.orderDesc("$createdAt"), Query.equal("userId", currentUser.$id)]
      );
      setCollections(likedCollectionsResponse.documents);

      const imagesPromises = likedCollectionsResponse.documents.map(
        (collection) => fetchRecentImages(collection.$id)
      );
      const imagesResults = await Promise.all(imagesPromises);
      const combinedImages = imagesResults.flat();
      setRecentImages(combinedImages);
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  useEffect(() => {
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

        // ✅ Call fetchUserImages to populate allImages
        await fetchUserImages();
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

    const fetchUserImages = async () => {
      try {
        const currentUser = await account.get(); // ✅ fetch user explicitly
        const currentUserId = currentUser.$id;

        const postImages = await databases.listDocuments(
          databaseId,
          userPostId,
          [Query.equal("userId", currentUserId)]
        );

        const savedImages = await databases.listDocuments(
          databaseId,
          postCollectionId,
          [Query.equal("userId", currentUserId)]
        );

        const combined = [...postImages.documents, ...savedImages.documents];
        const unique = combined.reduce((acc, doc) => {
          if (doc.imageFileId) {
            acc[doc.imageFileId] = {
              $id: doc.$id,
              collectionId: doc.collectionId,
              imageFileId: doc.imageFileId,
              fileName: doc.fileName ?? "",
            };
          }
          return acc;
        }, {} as Record<string, Picture>);

        setAllImages(Object.values(unique));
      } catch (err) {
        console.error("Failed to load user images:", err);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    fetchUserAndData(); // ✅ Make sure this is called BEFORE the return

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchRecentImages = async (collectionId: string) => {
    try {
      // Fetch both createPost and userAddImgtoCollect
      const [originals, saved] = await Promise.all([
        databases.listDocuments(databaseId, userPostId, [
          Query.equal("collectionId", collectionId),
        ]),
        databases.listDocuments(databaseId, postCollectionId, [
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
  useEffect(() => {
    fetchCurrentUser();
  }, [navigate]);

  useEffect(() => {
    const editor = document.querySelector(".quill-editor .ql-editor");

    if (editor) {
      const observer = new MutationObserver(() => {
        editor.querySelectorAll("img").forEach((img) => {
          img.setAttribute("draggable", "true");
        });
      });

      observer.observe(editor, { childList: true, subtree: true });

      return () => observer.disconnect();
    }
  }, []);

  const fetchImagesByCollection = async (collectionId: string) => {
    try {
      const [originals, saved] = await Promise.all([
        databases.listDocuments(databaseId, userPostId, [
          Query.equal("collectionId", collectionId),
        ]),
        databases.listDocuments(databaseId, postCollectionId, [
          Query.equal("collectionId", collectionId),
        ]),
      ]);

      const combined = [...originals.documents, ...saved.documents];
      const uniqueImages = Object.values(
        combined.reduce((acc, doc) => {
          if (doc.imageFileId) {
            acc[doc.imageFileId] = {
              $id: doc.$id,
              imageFileId: doc.imageFileId,
              fileName: doc.fileName ?? "",
              collectionId: doc.collectionId,
            };
          }
          return acc;
        }, {} as Record<string, Picture>)
      );

      setCollectionImages(uniqueImages);
    } catch (error) {
      console.error("Failed to fetch images from collection:", error);
    }
  };

  // Save Draft to Appwrite Database
  const saveDraft = async () => {
    if (!title || !content) {
      alert("Title and content are required!");
      return;
    }

    setLoading(true);

    try {
      setLoading(false);
      alert("Draft saved successfully!");
    } catch (error: unknown) {
      setLoading(false);
      if (error instanceof Error) {
        alert("Error saving draft: " + error.message);
      } else {
        alert("An unexpected error occurred while saving the draft.");
      }
    }
  };

  // Fetch all Drafts for the user
  const fetchDrafts = async () => {
    const userId = (await account.get()).$id; // Get user ID
    try {
      const response = await databases.listDocuments(
        databaseId, // Replace with your Appwrite database ID
        draftsArticle, // The collection name where drafts are stored
        [Query.equal("userId", userId)] // Fetch drafts for the logged-in user
      );
      setDrafts(response.documents);
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert("Error fetching drafts: " + error.message);
      } else {
        alert("An unexpected error occurred while fetching drafts.");
      }
    }
  };

  // Load a specific Draft into the editor
  const loadDraft = (draft: any) => {
    setTitle(draft.title);
    setContent(draft.content);
    const parsedTags =
      typeof draft.tags === "string" ? draft.tags.split(",") : draft.tags;
    setTags(parsedTags);
    setSelectedDraft(draft);
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const confirmDeleteDraft = async (draftId: string) => {
    try {
      await databases.deleteDocument(databaseId, draftsArticle, draftId);
      setToast({ message: "✅ Draft deleted successfully!", type: "success" });

      setDrafts((prev) => prev.filter((d) => d.$id !== draftId));
      if (selectedDraft?.$id === draftId) {
        setSelectedDraft(null);
        setTitle("");
        setContent("");
        setTags([]);
      }
    } catch (error) {
      console.error("Error deleting draft:", error);
      setToast({ message: "❌ Failed to delete draft.", type: "error" });
    } finally {
      setDraftToDelete(null);
    }
  };

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

  const handleOpenImageSelector = (insertImage: (url: string) => void) => {
    setPendingImageInsertFn(() => insertImage);
    setShowEditorImageSelector(true);
  };

  const handleImageClick = (url: string) => {
    if (pendingImageInsertFn) {
      pendingImageInsertFn(url); // ← inserts into Tiptap
    }
    setShowEditorImageSelector(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const toggleVisibility = () => {
    setIsVisible((prev) => !prev);
  };

  useEffect(() => {
    if (
      showEditorImageSelector &&
      collections.length > 0 &&
      !activeCollectionId
    ) {
      const sortedCollections = [...collections].sort((a, b) =>
        a.collectionName.localeCompare(b.collectionName)
      );
      const firstCollection = sortedCollections[0];
      setActiveCollectionId(firstCollection.$id);
      fetchImagesByCollection(firstCollection.$id);
    }
  }, [showEditorImageSelector, collections]);

  const handlePublish = async () => {
    if (!title || !content) {
      alert("Title and content are required");
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

    let collectionId: string = selectedCollection?.$id || "";

    // Initialize likeCount (set to "0" as a string)
    const likeCount = "0"; // Now a string to match Appwrite's expected type

    // Create a new collection if needed
    if (newCollectionName.trim()) {
      if (newCollectionName.length < 3) {
        alert("Collection name must be at least 3 characters long.");
        return;
      }

      try {
        const newCollectionResponse = await databases.createDocument(
          databaseId,
          userCollect,
          "unique()",
          {
            collectionName: newCollectionName,
            userId: userId,
            userName: userName,
            displayName: displayName,
            collectionId: "",
            createdAt: new Date().toISOString(),
          }
        );
        collectionId = newCollectionResponse.$id;
        console.log("New collection created:", newCollectionResponse);
      } catch (error) {
        console.error("Error creating new collection:", error);
        alert("Failed to create a new collection");
        return;
      }
    }

    setLoading(true);
    let coverUrl = "";

    try {
      const currentUser = await account.get();

      // Upload cover image if provided
      if (coverFile) {
        const fileUpload = await storage.createFile(
          import.meta.env.VITE_BUCKET_POST,
          "unique()",
          coverFile
        );

        const fileId = fileUpload.$id;
        coverUrl = `https://cloud.appwrite.io/v1/storage/buckets/${
          import.meta.env.VITE_BUCKET_POST
        }/files/${fileId}/view?project=${import.meta.env.VITE_PROJECT_ID}`;
      } else if (coverPreview) {
        coverUrl = coverPreview;
      }

      const tagsString = tags.join(", ");

      const contentBlob = new Blob([content], { type: "text/html" });
      const contentFile = new File([contentBlob], "post-content.html", {
        type: "text/html",
      });

      const uploadedContent = await storage.createFile(
        import.meta.env.VITE_BUCKET_POST,
        "unique()",
        contentFile
      );

      const articleDoc = await databases.createDocument(
        databaseId,
        userArcticles,
        "unique()",
        {
          title,
          contentFileId: uploadedContent.$id,
          coverUrl,
          coverImageFileId,
          tags: tagsString,
          authorId: currentUser.$id,
          userName: currentUser.name,
          displayName: currentUser.prefs.displayName,
          likeCount,
          collectionId,
          createdAt: new Date().toISOString(),
        }
      );

      const postId = articleDoc.$id;

      await databases.updateDocument(databaseId, userArcticles, postId, {
        postId,
      });

      // ✅ Delete draft if this was from a draft
      if (selectedDraft?.$id) {
        try {
          await databases.deleteDocument(
            databaseId,
            draftsArticle,
            selectedDraft.$id
          );
          console.log("Draft deleted.");
        } catch (deleteErr) {
          console.warn("Failed to delete draft:", deleteErr);
        }
      }

      setIsLoading(true);
      setToast({ message: "Post created successfully!", type: "success" });
      navigate(`/article/${postId}`);
      setSuccess(true);
    } catch (err) {
      console.error("Publish error:", err);
      alert("Failed to publish post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="editor-container">
      {/* Title */}
      <input
        type="text"
        className="title-input"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* Cover Photo */}
      <div className="cover-photo">
        {coverPreview ? (
          <img src={coverPreview} alt="Cover" className="cover-preview" />
        ) : (
          <label className="cover-upload-label">
            <button onClick={() => setShowCoverSelector(true)}>
              Choose from collection
            </button>
          </label>
        )}
      </div>
      {coverPreview && (
        <button
          className="remove-cover-button"
          onClick={() => {
            setCoverPreview(null);
            setCoverFile(null);
          }}
        >
          X Remove Cover
        </button>
      )}

      {/* Rich Text Editor */}

      <TiptapEditor
        content={content}
        setContent={setContent}
        onOpenImageSelector={handleOpenImageSelector}
      />
      {/* Drafts List */}
      <div className="drafts-list">
        <div onClick={toggleVisibility} className="header-drafts">
          {" "}
          {isVisible ? "" : ""}
          Saved Drafts
        </div>
        {isVisible && (
          <div className="drafts-section">
            {drafts.length > 0 ? (
              <ul className="ul-drafts">
                {drafts.map((draft) => (
                  <li key={draft.$id} style={{ display: "flex" }}>
                    <button
                      onClick={() => loadDraft(draft)}
                      className="button-add-drafts"
                    >
                      {draft.title}

                      <button
                        onClick={() => setDraftToDelete(draft.$id)}
                        className="delete-draft-button"
                        title="Delete draft"
                      >
                        X
                      </button>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No drafts available.</p>
            )}
          </div>
        )}
      </div>
      <div className="left-tag-button">
        <div className="tags-section-add">
          <p>Describe the article with tags:</p>
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
          <Toast message={toastMessage} onClose={() => setToastMessage("")} />
        )}

        <button
          type="button"
          onClick={handleAddTag}
          title="Add Tag"
          className="add-tag-button"
        >
          <img src="./src/assets/SVG/tag-svgrepo-com.svg" alt="svg image" />
        </button>
      </div>

      <div className="main-tags-2">
        {tags.map((tag) => (
          <span key={tag} className="bold-tags">
            <div className="text-tags">{tag} </div>

            <button
              type="button"
              className="tag-deleted"
              onClick={() => handleRemoveTag(tag)}
            >
              x
            </button>
          </span>
        ))}
      </div>

      <div className="middle-bottom-button">
        <button
          className="publish-button"
          onClick={handlePublish}
          disabled={loading}
        >
          {loading ? "Publishing..." : "Publish"}
        </button>

        <button
          className="save-draft-button"
          onClick={saveDraft}
          disabled={loading}
        >
          {isDraft ? "Draft Saved" : "Save as Draft"}
        </button>
      </div>
      {/* Save Draft Button */}

      <div className="over-flow-light-box">
        <div className="right-form">
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
        </div>
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
                        <div className="collections-mini" key={collection.$id}>
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
      </div>

      {/* COVER IMAGE SELECTOR */}
      {showCoverSelector && (
        <div className="image-selector-overlay">
          <div className="image-selector-modal">
            <h3>Select a Cover Photo</h3>

            <div className="image-grid-editor">
              <div className="collection-list-editor">
                <input
                  type="text"
                  placeholder="Search your collections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="collection-search-input"
                />
                <div className="scroll-editor">
                  {collections
                    .sort((a, b) =>
                      a.collectionName.localeCompare(b.collectionName)
                    )
                    .filter((collection) =>
                      collection.collectionName
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
                    )
                    .map((collection) => (
                      <div
                        key={collection.$id}
                        onClick={() => {
                          setActiveCollectionId(collection.$id);
                          fetchImagesByCollection(collection.$id);
                        }}
                        className={`collection-item ${
                          activeCollectionId === collection.$id
                            ? "active-collection"
                            : ""
                        }`}
                      >
                        {collection.collectionName}
                      </div>
                    ))}
                </div>
              </div>

              {activeCollectionId && (
                <div className="image-grid2">
                  {collectionImages.map((img) => {
                    const imageUrl = `https://cloud.appwrite.io/v1/storage/buckets/${
                      import.meta.env.VITE_BUCKET_POST
                    }/files/${img.imageFileId}/view?project=${
                      import.meta.env.VITE_PROJECT_ID
                    }`;

                    return (
                      <img
                        key={img.$id}
                        src={imageUrl}
                        alt={img.fileName}
                        className="selectable-image"
                        onClick={() => {
                          setCoverPreview(imageUrl);
                          setCoverImageFileId(img.imageFileId);
                          setCoverFile(null);
                          setShowCoverSelector(false);
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowCoverSelector(false)}
              className="close-selector"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showEditorImageSelector && (
        <div className="image-selector-overlay">
          <div className="image-selector-modal">
            <h3>Insert Image</h3>
            <div className="image-grid-editor">
              <div className="collection-list-editor">
                <input
                  type="text"
                  placeholder="Search your collections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="collection-search-input"
                />
                <div className="scroll-editor">
                  {collections
                    .sort((a, b) =>
                      a.collectionName.localeCompare(b.collectionName)
                    )
                    .filter((collection) =>
                      collection.collectionName
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
                    )
                    .map((collection) => (
                      <div
                        key={collection.$id}
                        onClick={() => {
                          setActiveCollectionId(collection.$id);
                          fetchImagesByCollection(collection.$id);
                        }}
                        className={`collection-item ${
                          activeCollectionId === collection.$id
                            ? "active-collection"
                            : ""
                        }`}
                      >
                        {collection.collectionName}
                      </div>
                    ))}
                </div>
              </div>

              {activeCollectionId && (
                <div className="image-grid2">
                  {collectionImages.map((img) => {
                    const url = `https://cloud.appwrite.io/v1/storage/buckets/${
                      import.meta.env.VITE_BUCKET_POST
                    }/files/${img.imageFileId}/view?project=${
                      import.meta.env.VITE_PROJECT_ID
                    }`;

                    return (
                      <img
                        key={img.$id}
                        src={url}
                        alt={img.fileName}
                        className="selectable-image"
                        onClick={() => {
                          handleImageClick(url);
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowEditorImageSelector(false)}
              className="close-selector"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {success && (
        <p className="success-msg">✅ Post published successfully!</p>
      )}

      {draftToDelete && (
        <div className="modal-overlay">
          <div className="modal-content-2">
            <p>Are you sure you want to delete this draft?</p>
            <div className="button-deleted-article">
              <button
                onClick={() => confirmDeleteDraft(draftToDelete)}
                style={{
                  backgroundColor: "red",
                  color: "#fff",
                  padding: "9px",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setDraftToDelete(null)}
                style={{
                  backgroundColor: "#E3DFE1ff",
                  color: "#fff",
                  padding: "9px",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorPage;
