import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPage = Number(e.target.value);
    onPageChange(selectedPage);
  };

  return (
    <div className="paginitiaon">
      <span>Page</span>
      <select
        value={currentPage}
        onChange={handleSelectChange}
        style={{
          padding: "4px 8px",
          borderRadius: 4,
          border: "1px solid #ccc",
          width: "29px",
          marginLeft: "9px",
          marginRight: "9px",
        }}
      >
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
          <option key={pageNum} value={pageNum}>
            {pageNum}
          </option>
        ))}
      </select>
      <span>of {totalPages}</span>
    </div>
  );
};

export default Pagination;
