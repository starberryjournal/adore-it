import { useEffect, useState } from "react";
import { account } from "../appwrite";
import { useNavigate } from "react-router-dom";
import FollowCollect from "../Components/FollowCollect";
import "./Homepage.css";
import FollowUser from "../Components/FollowUser";

interface HomeProps {
  onLogout: () => void;
}

const Home: React.FC<HomeProps> = () => {
  const navigate = useNavigate();
  const [, setUserName] = useState<string>("");
  const [activePage, setActivePage] = useState<number>(1);
  const [showBackToTop, setShowBackToTop] = useState(false);


  useEffect(() => {
    // Fetch user data when the component mounts (if already signed in)
    const fetchUserData = async () => {
      try {
        const user = await account.get();
        console.log("User data:", user);
        setUserName(user.name); // Set the user's name
      } catch (err) {
        console.error("Error fetching user data:", err);
        navigate("/SignIn"); // Redirect to sign-in page if fetching user data fails
      }
    };

    fetchUserData();
  }, [navigate]);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 300);

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);


  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const handleToggle = (pageNumber: number) => {
    // Explicitly type pageNumber as a number
    setActivePage(pageNumber); // Set active page based on button clicked
  };



  return (
    <div className="background-color">
    
      <div className="div-content-home">
        <div className="left-side-home">
          {activePage === 1 && (
            <div>
              <FollowCollect />
            </div>
          )}
          {activePage === 2 && (
            <div>
              <FollowUser />
            </div>
          )}

          {activePage === 3 && (
            <div>
              <h2>Content of Page 3</h2>
              <p>This is the content for page 3.</p>
            </div>
          )}
        </div>
        <div className="right-side-home">
          <div className="top-conetent-home">
            <button
              onClick={() => handleToggle(1)}
              className={`button-6 ${activePage === 1 ? "focused" : ""}`}
            >
              <svg
                width="20px"
                height="20px"
                viewBox="0 0 28 28"
                style={{ marginRight: "3px" }}
              >
                <path
                  d="M18.75 22C20.5449 22 22 20.5449 22 18.75L22 10.75C22 8.95508 20.5449 7.5 18.75 7.5H17.5V9H18.75C19.7165 9 20.5 9.7835 20.5 10.75L20.5 18.75C20.5 19.7165 19.7165 20.5 18.75 20.5L10.75 20.5C9.7835 20.5 9 19.7165 9 18.75V17.5H7.5V18.75C7.5 20.5449 8.95507 22 10.75 22L18.75 22Z"
                  className="icon-svg"
                  fill="currentColor"
                ></path>{" "}
                <path
                  d="M13.25 16.5C15.0449 16.5 16.5 15.0449 16.5 13.25L16.5 5.25C16.5 3.45508 15.0449 2 13.25 2L5.25 2C3.45508 2 2 3.45508 2 5.25L2 13.25C2 15.0449 3.45507 16.5 5.25 16.5L13.25 16.5ZM15 13.25C15 14.2165 14.2165 15 13.25 15L12.4692 15L15 12.4692V13.25ZM15 10.469L10.469 15L8.46901 15L15 8.46901L15 10.469ZM6.34769 15L5.25 15C5.01854 15 4.79757 14.9551 4.59534 14.8734L14.8734 4.59535C14.9551 4.79757 15 5.01854 15 5.25V6.34769L6.34769 15ZM3.57829 13.7692C3.52741 13.6051 3.5 13.4308 3.5 13.25L3.5 11.969L11.969 3.5L13.25 3.5C13.4308 3.5 13.6051 3.52741 13.7692 3.5783L3.57829 13.7692ZM3.5 9.84766L3.5 7.96898L7.96898 3.5L9.84766 3.5L3.5 9.84766ZM3.5 5.84766L3.5 5.25C3.5 4.2835 4.2835 3.5 5.25 3.5H5.84766L3.5 5.84766Z"
                  className="icon-svg"
                  fill="currentColor"
                ></path>{" "}
              </svg>
              Collection
            </button>

            <button
              onClick={() => handleToggle(2)}
              className={`button-6 ${activePage === 2 ? "focused" : ""}`}
            >
              <svg
                width="20px"
                height="20px"
                viewBox="0 0 28 28"
                style={{ marginRight: "3px" }}
              >
                <path
                  d="M4,16 L15,16.001 C16.0538182,16.001 16.9181157,16.8164855 16.9945109,17.8516842 L17,18.001 L17,20.5 C16.999,24.7 12.713,26 9.5,26 C6.35126,26 2.1710504,24.75148 2.00510151,20.7485328 L2,20.5 L2,18 C2,16.9461818 2.81639669,16.0818843 3.85080841,16.0054891 L4,16 Z M24,16 L24.1491916,16.0054891 C25.1318827,16.0780645 25.9178153,16.8617218 25.9939518,17.8434235 L26,18 L26,20 C25.999,23.759 22.57,25 20,25 C18.942,25 17.741,24.785 16.691,24.275 C17.009,23.897 17.278,23.477 17.488,23.007 C18.4456,23.427 19.4789867,23.4924578 19.9157784,23.4993188 L20.2043433,23.4963225 C21.2400556,23.4606629 24.334766,23.1116572 24.4936471,20.2325914 L24.5,20 L24.5,18 C24.5,17.7546667 24.3222222,17.5504198 24.0895748,17.5080604 L24,17.5 L17.949,17.501 C17.865,16.999625 17.6554375,16.5434219 17.3544785,16.1605273 L17.22,16.001 L24,16 Z M4,17.5 L3.899344,17.51 C3.77496,17.53528 3.69,17.6028 3.646,17.646 C3.6028,17.69 3.53528,17.77432 3.51,17.89896 L3.5,18 L3.5,20.5 C3.5,21.839 4.087,22.829 5.295,23.525 C6.29135714,24.1007143 7.68434694,24.4479337 9.15851093,24.4945991 L9.5,24.5 L9.93487113,24.4897846 C11.4554554,24.4219073 15.3140372,23.9331951 15.4935181,20.7322803 L15.5,20.499 L15.5,18.001 C15.5,17.7565556 15.3222222,17.5516173 15.0895748,17.5090933 L15,17.501 L4,17.5 Z M9.5,3 C12.538,3 15,5.463 15,8.5 C15,11.537 12.538,14 9.5,14 C6.462,14 4,11.537 4,8.5 C4,5.463 6.462,3 9.5,3 Z M20.5,5 C22.985,5 25,7.015 25,9.5 C25,11.985 22.985,14 20.5,14 C18.015,14 16,11.985 16,9.5 C16,7.015 18.015,5 20.5,5 Z M9.5,4.5 C7.294,4.5 5.5,6.294 5.5,8.5 C5.5,10.706 7.294,12.5 9.5,12.5 C11.706,12.5 13.5,10.706 13.5,8.5 C13.5,6.294 11.706,4.5 9.5,4.5 Z M20.5,6.5 C18.846,6.5 17.5,7.846 17.5,9.5 C17.5,11.154 18.846,12.5 20.5,12.5 C22.154,12.5 23.5,11.154 23.5,9.5 C23.5,7.846 22.154,6.5 20.5,6.5 Z"
                  className="icon-svg"
                  fill="currentColor"
                ></path>
              </svg>
              Following
            </button>

            <button
              onClick={() => handleToggle(3)}
              className={`button-6 ${activePage === 3 ? "focused" : ""}`}
            >
              <svg
                width="20px"
                height="20px"
                viewBox="0 0 24 24"
                style={{ marginRight: "3px" }}
              >
                <path
                  d="M19.75,2 C20.9926407,2 22,3.00735931 22,4.25 L22,9.71195771 C22,10.5737738 21.6576992,11.4003037 21.0483777,12.0097741 L12.5473442,20.5128837 C11.2778881,21.7797729 9.22213817,21.7806673 7.95097797,20.5142825 L3.48927551,16.0592499 C2.21880658,14.7912535 2.21717852,12.7333756 3.48549701,11.4631582 L11.9851607,2.95333557 C12.5947699,2.34296602 13.422034,2 14.2846894,2 L19.75,2 Z M19.75,3.5 L14.2846894,3.5 C13.8201826,3.5 13.3747328,3.68467401 13.0464816,4.01333454 L4.53430434,12.5358177 L4.53430434,12.5358177 C3.86407752,13.2207041 3.86916592,14.3191439 4.54902203,14.9976769 L9.0102422,19.4522286 C9.6951129,20.134526 10.8034812,20.1340438 11.4871562,19.4517518 L19.987588,10.9492434 C20.3156842,10.6210671 20.5,10.1760125 20.5,9.71195771 L20.5,4.25 C20.5,3.83578644 20.1642136,3.5 19.75,3.5 Z M16.9999743,5.50218109 C17.8283872,5.50218109 18.4999486,6.17374246 18.4999486,7.00215539 C18.4999486,7.83056832 17.8283872,8.50212969 16.9999743,8.50212969 C16.1715614,8.50212969 15.5,7.83056832 15.5,7.00215539 C15.5,6.17374246 16.1715614,5.50218109 16.9999743,5.50218109 Z"
                  className="icon-svg"
                  fill="currentColor"
                ></path>
              </svg>
              Channels
            </button>
          </div>
        </div>
      </div>
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          style={{
            position: "fixed",
            bottom: 30,
            right: 20,
            padding: "10px 15px",
            fontSize: 14,
            background: "#333",
            color: "#fff",
            border: "none",
            borderRadius: 30,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            zIndex: 1000,
          }}
          aria-label="Back to top"
        >
          ↑ Top
        </button>
      )}
    </div>
  );
};

export default Home;
