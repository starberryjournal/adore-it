import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { databases, Query } from "../appwrite";
import useDebounce from "./useDebouce"; // Make sure this is correctly implemented
import "./SearchBar.css";
import SearchResultsPage from "../Components/SearchResultsPage";

import SearchIcon from "../assets/SVG/search-svgrepo-com.svg"; // Use import for consistency

interface SearchBarProps {
  databaseId: string;
  postCollectionId: string;
  otherCollectionIds: string[];
}

interface Suggestion {
  $id: string;
  tags: string;
  resultCount: number;
}

const SearchBar: React.FC<SearchBarProps> = ({
  databaseId,
  postCollectionId,
  otherCollectionIds,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isResultPage, setIsResultPage] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();


  const fetchSuggestions = useCallback(
    async (term: string) => {
      if (term.trim().length === 0) {
        setSuggestions([]);
        return;
      }

      try {
        const queries = [
          Query.or([
            Query.search("tags", term),
            Query.search("description", term),
          ]),
        ];

        const response = await databases.listDocuments(
          databaseId,
          postCollectionId,
          queries
        );

        const documents = response.documents;

        // Extract matching individual tags from results
        const allMatchingTags: string[] = [];

        for (const doc of documents) {
          // 1. Extract & filter matching tags
          const tags =
            doc.tags
              ?.split(",")
              .map((tag: string) => tag.trim())
              .filter((tag: string) =>
                tag.toLowerCase().includes(term.toLowerCase())
              ) || [];

          allMatchingTags.push(...tags);
        }

        // Remove duplicates
        const uniqueTags = Array.from(new Set(allMatchingTags));

        // Convert to Suggestion format
        const filteredSuggestions: Suggestion[] = uniqueTags.map((tag, i) => ({
          $id: `${i}`, // dummy ID
          tags: tag,
          resultCount: 1,
        }));

        setSuggestions(filteredSuggestions);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      }
    },
    [databaseId, postCollectionId]
  );

  const debouncedFetchSuggestions = useDebounce(fetchSuggestions, 300);

  useEffect(() => {
    debouncedFetchSuggestions(searchTerm);
  }, [searchTerm, debouncedFetchSuggestions]);

  const handleSearch = async (selectedTerm: string) => {
    if (!selectedTerm.trim()) return;

    try {
      const queries = [Query.search("tags", selectedTerm)];

      const postResponse = await databases.listDocuments(
        databaseId,
        postCollectionId,
        queries
      );

      const otherResponses = await Promise.all(
        otherCollectionIds.map((collectionId) =>
          databases.listDocuments(databaseId, collectionId, queries)
        )
      );

      const allResults = [postResponse, ...otherResponses].flatMap(
        (res) => res.documents as unknown as Suggestion[]
      );

      setIsTyping(false);
      setIsResultPage(true);
      navigate("/results", {
        state: {
          results: allResults,
          searchTerm: selectedTerm,
          hideSearchSection: true,
        },
      });
    } catch (error) {
      console.error("Error fetching search results:", error);
      setIsTyping(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsTyping(value.length > 0);
    setIsResultPage(false);
    setSelectedSuggestionIndex(-1);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSearch(suggestion);
  };

  const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && selectedSuggestionIndex === -1) {
      handleSearch(searchTerm);
    }
  };

  const handleKeyNavigation = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) =>
        Math.min(prev + 1, suggestions.length - 1)
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      handleSearch(suggestions[selectedSuggestionIndex].tags);
    }
  };

  useEffect(() => {
    const selected = document.querySelector(".suggestion.selected");
    selected?.scrollIntoView({ block: "nearest" });
  }, [selectedSuggestionIndex]);

  return (
    <>
      <div className="search-sections" ref={resultsContainerRef}>
        <div className={`middle-nav ${isTyping ? "typing" : ""}`}>
          <img src={SearchIcon} alt="Search" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              handleKeyNavigation(e);
              handleInputKeyPress(e);
            }}
            placeholder="Search..."
            className={isTyping ? "typing" : ""}
          />
        </div>
      </div>

      {isTyping && !isResultPage && (
        <>
          {suggestions.length > 0 ? (
            <SearchResultsPage
              suggestions={suggestions}
              isTyping={isTyping}
              handleSuggestionClick={handleSuggestionClick}
              container={resultsContainerRef.current!}
              selectedIndex={selectedSuggestionIndex}
            />
          ) : (
            <div></div>
          )}
        </>
      )}
    </>
  );
};

export default SearchBar;

