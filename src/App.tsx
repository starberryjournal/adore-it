import { useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { account } from "./appwrite";
import Navbar from "./NavbarComponent/Navbar";
import SignInNav from "./NavbarComponent/SignInNav";
import Register from "./Page/Register";
import SignIn from "./Page/SignIn";
import Home from "./Page/Home";
import PrivateRoute from "./Components/PrivateRoute";
import UserProfile from "./UserComponents/ProfilePicture";
import EditProfile from "./Page/EditProfile";
import ProfilePicture from "./UserComponents/ProfilePicture";
import CreatePost from "./Page/CreatePost";
import UsersPosts from "./UserComponents/UsersPosts";
import CollectionImages from "./Page/CollectionImages";
import TagPosts from "./Page/TagPosts";
import PostList from "./Components/PostList";
import Discovery from "./Page/Discovery";
import PostContent from "./PostContentComponent/PostContent";
import TablePage from "./Components/TablePage";
import ResultsPage from "./Components/ResultPage";
import EditCollection from "./Page/EditCollection";
import SearchBar from "./NavbarComponent/SearchBar";
import FindSimilarImages from "./FindSimilarImages";
import Profile from "./UserComponents/Profile";
import ForgotPassword from "./Page/ForgotPassword";
import ToastComponent from "./Components/ToastComponent";
import EditorPage from "./Page/EditorPage";
import UserArticles from "./Page/UserArticles";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const location = useLocation();

  const shouldHideNavbar = [
    "/SignIn",
    "/Register",
    "/forgot-password",
  ].includes(location.pathname);

  useEffect(() => {
    const checkUser = async () => {
      try {
        await account.get();
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const handleLogout = () => setIsAuthenticated(false);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="App">
      {!shouldHideNavbar && (isAuthenticated ? <SignInNav /> : <Navbar />)}

      <Routes>
        <Route path="/SignIn" element={<SignIn />} />
        <Route
          path="/home"
          element={<PrivateRoute element={<Home onLogout={handleLogout} />} />}
        />
        <Route path="/Register" element={<Register />} />
        <Route path="/Profile" element={<UserProfile />} />
        <Route path="/User/:userName" element={<Profile />} />
        <Route path="/Discovery" element={<Discovery onLogout={() => {}} />} />
        <Route path="/FindSimilarImages" element={<FindSimilarImages />} />
        <Route path="/CreatePost" element={<CreatePost />} />
        <Route path="/UsersPosts" element={<UsersPosts />} />
        <Route path="/Pictureprofile" element={<ProfilePicture />} />
        <Route
          path="/CollectionImages/:collectionId"
          element={<CollectionImages />}
        />
        <Route
          path="/EditCollections/:collectionId"
          element={<EditCollection />}
        />
        <Route path="/Post/:id" element={<PostContent />} />
        <Route path="/EditProfile" element={<EditProfile />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/TagPosts/:tag" element={<TagPosts />} />

        <Route
          path="/TablePage"
          element={<TablePage searchTerm="searchTerm" />}
        />
        <Route path="/article/:postId" element={<UserArticles />} />

        <Route
          path="/"
          element={
            <SearchBar
              databaseId="67bcb64c0027e7eaa736"
              postCollectionId="67be4e9e001142383751"
              otherCollectionIds={["67be4fe30038e2f0c316"]}
            />
          }
        />
        <Route path="/PostList" element={<PostList />} />
        <Route path="/Editor" element={<EditorPage />} />
        <Route path="/results" element={<ResultsPage />} />
      </Routes>

      <ToastComponent />
    </div>
  );
}

export default App;
