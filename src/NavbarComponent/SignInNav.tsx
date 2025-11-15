import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { account } from "../appwrite";
import "./SignInNav.css";
import SearchBar from "./SearchBar";
import NotificationsDropdown from "../Components/NotificationsDropdown";
import useNotifications from "../Components/useNotifications"; // adjust path as needed

import BellIcon from "/src/assets/SVG/bell-svgrepo-com.svg"; // Use import for consistency
import HomeIcon from "/src/assets/SVG/house-property-svgrepo-com.svg";
import GridIcon from "/src/assets/SVG/square-4-grid-svgrepo-com.svg";
import SquareIcon from "/src/assets/SVG/add-square-svgrepo-com.svg";
import LogoIcon from "/src/assets/SVG/JEKIFFELOGO2.png";

interface Preferences {
  bioId: string;
  profilePictureId?: string;
  backgroundImageId?: string;
}

interface User {
  $id: string;
  name: string;
  prefs: Preferences;
}

export default function SignInNav() {
  const [user, setUser] = useState<User | null>(null);
  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const collectPost = import.meta.env.VITE_USER_POST_COLLECTION_ID;
  const userCollect = import.meta.env.VITE_USER_COLLECTION;
  const navigate = useNavigate();
  const { notifications } = useNotifications({ filter: "unread" });
  const unreadCount = notifications.length;
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchCurrentUser = async () => {
    try {
      const user = await account.get();
      console.log("User data:", user);
      setUser(user as unknown as User);
    } catch (error) {
      console.error("Error fetching current user:", error);
      navigate("/SignIn"); // Redirect to sign-in page if fetching user data fails
    }
  };

  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
      console.log("User logged out successfully");
      alert("You have been logged out successfully!");
      navigate("/SignIn"); // Redirect to sign-in page
      window.location.reload(); // Refresh the page
    } catch (err: any) {
      console.error("Error logging out:", err);
      alert("Logout failed: " + err.message); // Display error message
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!user) {
    return <p>Loading user data...</p>;
  }

  return (
    <div className="navbar">
      <div className="heading">
        <div className="header-left">
          <NavLink to="/home">
            <div className="header-logo">
              <img src={LogoIcon} alt="image logo" />
            </div>
          </NavLink>

          <div className="home">
            <NavLink
              to="/home"
              className={({ isActive }) =>
                isActive ? "nav-link activee" : "nav-link"
              }
            >
              <div className="svg">
                <img src={HomeIcon} alt="svg" />
                home
              </div>
              <span className="uder-line"></span>
            </NavLink>
          </div>

          <div
            className="discovery
          "
          >
            <NavLink
              to="/Discovery"
              className={({ isActive }) =>
                isActive ? "nav-link activee" : "nav-link"
              }
            >
              <div className="svg">
                <img src={GridIcon} alt="svg" />
                <p>discovery</p>
              </div>
            </NavLink>
            <span className="uder-line"></span>
          </div>

          <div
            className="Article
          "
          >
            <NavLink
              to="/Editor"
              className={({ isActive }) =>
                isActive ? "nav-link activee" : "nav-link"
              }
            >
              <div className="svg">
                <svg width="23px" height="23px" viewBox="0 0 24 24">
                  <g
                    id="🔍-Product-Icons"
                    stroke="none"
                    stroke-width="1"
                    fill="none"
                    fill-rule="evenodd"
                  >
                    <g
                      id="ic_fluent_edit_24_regular"
                      fill="#4E4E4E"
                      fill-rule="nonzero"
                    >
                      <path
                        d="M21.0303301,2.96966991 C22.4277928,4.36713263 22.4277928,6.63286737 21.0303301,8.03033009 L9.06200371,19.9986565 C8.78512854,20.2755316 8.44079112,20.4753584 8.06302761,20.5783848 L2.94733805,21.9735729 C2.38746387,22.1262658 1.87373417,21.6125361 2.02642713,21.0526619 L3.4216152,15.9369724 C3.52464161,15.5592089 3.72446837,15.2148715 4.00134354,14.9379963 L15.9696699,2.96966991 C17.3671326,1.5722072 19.6328674,1.5722072 21.0303301,2.96966991 Z M15.0001717,6.06057288 L5.06200371,15.9986565 C4.96971199,16.0909482 4.90310306,16.2057273 4.86876093,16.3316485 L3.81891446,20.1810855 L7.6683515,19.1312391 C7.79427267,19.0968969 7.90905181,19.030288 8.00134354,18.9379963 L17.9391717,8.99957288 L15.0001717,6.06057288 Z M17.0303301,4.03033009 L16.0601717,4.99957288 L18.9991717,7.93957288 L19.9696699,6.96966991 C20.7813462,6.15799363 20.7813462,4.84200637 19.9696699,4.03033009 C19.1579936,3.21865381 17.8420064,3.21865381 17.0303301,4.03033009 Z"
                        id="🎨-Color"
                      ></path>
                    </g>
                  </g>
                </svg>
                <p>Article</p>
              </div>
            </NavLink>
            <span className="uder-line"></span>
          </div>
        </div>

        <div className="middle">
          <SearchBar
            databaseId={databaseId}
            postCollectionId={collectPost}
            otherCollectionIds={[userCollect]}
          />
        </div>

        <div className="header-right">
          <div className="notification-message" ref={dropdownRef}>
            <div
              className="icon-to-open-notications"
              onMouseEnter={() => setShowNotifications(true)}
            >
              <img src={BellIcon} alt="Notifications" />
              {unreadCount > 0 && (
                <span className="notif-count">{unreadCount}</span>
              )}
            </div>

            {showNotifications && (
              <div
                className="dropdown-wrapper"
                onMouseLeave={() => setShowNotifications(false)}
              >
                <NotificationsDropdown />
              </div>
            )}
          </div>

          <NavLink to="/CreatePost">
            <button className="add-image">
              <img src={SquareIcon} alt="svg image" />
              New Post
            </button>
          </NavLink>
          <div className="user-profile">
            <NavLink to="/Profile">
              {user.prefs.profilePictureId && (
               <img
                  src={`https://nyc.cloud.appwrite.io/v1/storage/buckets/68c473a000124c872ebd/files/${user.prefs.profilePictureId}/view?project=68c41ac8003cc08ef7d6`}
                  alt="Profile"
                />
              )}
            </NavLink>
          </div>

          <button onClick={handleLogout} className="signt-out">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

}

