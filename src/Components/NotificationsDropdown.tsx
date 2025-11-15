import useNotifications from "../Components/useNotifications";
import { useNavigate } from "react-router-dom";
import { formatTimeAgo } from "../Components/formatDateUtils";

const NotificationsDropdown = () => {
  const { notifications, loading, markAsRead } = useNotifications({
    limit: 10,
    filter: "all",
  });

  const navigate = useNavigate();

  const handleClickImage = (image: any) => {
    const postId = image?.postId;

    if (!postId) {
      console.warn("No valid postId found for navigation.");
      console.log("Invalid image object:", image);
      return;
    }

    navigate(`/Post/${postId}`, {
      state: { fromCollection: true }, // optional
    });
  };

  return (
    <div className="content-notifications-dropdown">
      <div className="notofications-inside-drop">
        <div className="title-notifications">
          <h3>Your Notifications</h3>
        </div>
        <div className="triangle-wrapper">
          <div className="triangle"></div>
        </div>
        <div className="notifications-dropdown">
          {loading && (
            <div
              className="loader"
              style={{ position: "relative", left: "149px", top: "120px" }}
            />
          )}

          {notifications.map((n) => {
            console.log("ProfilePictureId:", n.actor?.prefs?.profilePictureId);

            return (
              <div
                key={n.$id}
                onClick={() => markAsRead(n.$id)}
                style={{ background: n.read ? "#fdfdfd" : "#f5f5f5" }}
                className="notification-message-notif"
              >
                <div className="notif-header">
                  <div className="left-notification">
                    <div className="small-message-notif">
                      <p>
                        <strong>{n.userName}</strong> {n.message}
                      </p>
                    </div>
                    <small className="smal-date-notif">
                      {formatTimeAgo(n.createdAt)}
                    </small>
                  </div>

                  <div className="right-notification">
                    {n.post?.imageFileId && (
                      <img
                        src={`http://localhost:3000/image/${n.post.imageFileId}`}
                        alt="Post Preview"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                        onClick={() => handleClickImage(n.post)}
                        className="main-image-notification"
                      />
                    )}
                    <div className="blur-strip"></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NotificationsDropdown;

