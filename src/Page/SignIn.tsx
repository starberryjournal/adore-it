import React, { useState } from "react";
import { account } from "../appwrite";
import { Link, useNavigate } from "react-router-dom";
import EyeOpen from "../assets/EyeShowSvgrepoCom.svg";
import EyeClosed from "../assets/EyeHideSvgrepoCom.svg";
import enveLope from "/src/assets/SVG/envelope-svgrepo-com (1).svg";
import lockUp from "/src/assets/SVG/lock-svgrepo-com.svg";

const SignIn: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [, setUserName] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const isFormValid = email && password;

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setError(""); // Clear any previous error message
      const session = await account.createEmailPasswordSession(email, password);

      // Fetch user data
      const user = await account.get();
      setUserName(user.name); // Set the user's name

      if (session) {
        navigate("/home"); // Redirect to home page
        window.location.reload(); // Refresh the page
      } else {
        throw new Error("Sign-in failed");
      }
    } catch (err: any) {
      setError("Sign-in failed: " + err.message);
    }
  };

  return (
    <div className="outside-sign-in">
      <div className="SignIn">
        <div className="inside-SignIn">
          <div className="box-inside-SignIn">
            <div className="header-welcome">
              <h2>Welcome to j'ADORE!</h2>
              <p>Sign back in</p>
            </div>

            <div className="form-register">
              <form onSubmit={handleSignIn} className="formulation">
                <div className="centre-side2">
                  <img
                    src={enveLope}
                    alt="envelope svg"
                    className="mini-svg"
                  />
                  <input
                    type="email"
                    value={email}
                    placeholder="Email"
                    className="button-signIn"
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="middle-center-side">
                  <div className="centre-side2">
                    <img
                      src={lockUp}
                      alt="password"
                      className="mini-svg"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      placeholder="Password"
                      className="button-signIn"
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="toggle-password"
                    >
                      <img
                        src={showPassword ? EyeClosed : EyeOpen}
                        alt={showPassword ? "Hide password" : "Show password"}
                        className="eye-icon"
                      />
                    </button>
                  </div>
                </div>

                <div className="text-disclaimer">
                  <p>
                    By clicking Log In, or continuing with one of the options
                    below, you agree to the Terms of Service and Privacy Policy
                    of ADORE!
                  </p>
                </div>

                <button
                  type="submit"
                  className={`button-submit ${isFormValid ? "active" : ""}`}
                  disabled={!isFormValid}
                >
                  Sign In
                </button>
                <div className="forget-password">
                  <Link to="/forgot-password">Forgot your password?</Link>
                </div>
              </form>
            </div>

            <div className="link-under">
              No account yet?
              <Link to="/Register">Sign Up!</Link>
            </div>
          </div>
        </div>
      </div>

      {error && <p>{error}</p>}
    </div>
  );
};

export default SignIn;
