import React from "react";
import TabletPage from "../Components/TablePage";
import { useLocation } from "react-router-dom";
import "./ResultPage.css";

const ResultsPage: React.FC = () => {
  const location = useLocation();
  const { searchTerm } = location.state || { searchTerm: "" };

  return (
    <div className="page-header">
      <TabletPage searchTerm={searchTerm} />
    </div>
  );
};

export default ResultsPage;
