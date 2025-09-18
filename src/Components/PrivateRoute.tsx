import React from "react";
import { Navigate, RouteProps } from "react-router-dom";
import { account } from "../appwrite";

const PrivateRoute: React.FC<RouteProps> = ({ element }) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(
    null
  );

  React.useEffect(() => {
    const checkUser = async () => {
      try {
        await account.get();
        setIsAuthenticated(true);
      } catch (err) {
        setIsAuthenticated(false);
      }
    };

    checkUser();
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>; // Show a loading indicator while checking authentication
  }

  return isAuthenticated ? element : <Navigate to="/SignIn" />;
};

export default PrivateRoute;
