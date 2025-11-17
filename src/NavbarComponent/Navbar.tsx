import { Link, NavLink } from "react-router-dom";
import "./SignInNav.css";
import SearchBar from "./SearchBar";

export default function Navbar() {
  return (
    <div className="navbar">
      <div className="heading">
        <div className="header-left">
          <div className="header-logo">
            <img src="./src/assets/SVG/logoweheartit.svg" alt="image logo" />
          </div>
          <div
            className="discovery
          "
          >
            <NavLink
              to="/DiscoveryIn"
              className={({ isActive }) =>
                isActive ? "nav-link activee" : "nav-link"
              }
            >
              <div className="svg">
                <img
                  src="./src/assets/SVG/square-4-grid-svgrepo-com.svg"
                  alt="svg"
                />
                <p>discovery</p>
              </div>
            </NavLink>
            <span className="uder-line"></span>
          </div>
        </div>
        <div className="middle">
          <SearchBar
            databaseId={"67bcb64c0027e7eaa736"}
            postCollectionId={"67be4e9e001142383751"}
            otherCollectionIds={["67be4fe30038e2f0c316"]}
          />
        </div>
        <div
          className="header-right
        "
        >
          <Link to="/SignIn" className="signt-out">
            Login
          </Link>

          <Link to="/Register">Sign Up</Link>
        </div>
      </div>
    </div>
  );
}
