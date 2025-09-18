import React from "react";
import ReactDOM from "react-dom";

interface Suggestion {
  $id: string;
  tags: string;
  resultCount: number;
}

interface SearchResultsPageProps {
  suggestions: Suggestion[];
  isTyping: boolean;
  handleSuggestionClick: (suggestion: string) => void;
  container: HTMLElement;
  selectedIndex: number;
}

const SearchResultsPage: React.FC<SearchResultsPageProps> = ({
  suggestions,
  isTyping,
  handleSuggestionClick,
  container,
  selectedIndex,
}) => {
  return ReactDOM.createPortal(
    <div
      className={`section-search ${isTyping ? "typing" : ""}`}
      role="listbox"
      aria-activedescendant={
        selectedIndex >= 0 ? suggestions[selectedIndex]?.$id : undefined
      }
    >
      {suggestions.length > 0 ? (
        <div>
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.$id}
              onClick={() => handleSuggestionClick(suggestion.tags)}
              id={suggestion.$id}
              role="option"
              aria-selected={selectedIndex === index}
              className={`result-text ${
                selectedIndex === index ? "highlighted suggestion selected" : ""
              }`}
            >
              <div className="flex-text">
                <div className="tags-text">{suggestion.tags}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-results">No suggestions found.</div>
      )}
    </div>,
    container
  );
};

export default SearchResultsPage;
