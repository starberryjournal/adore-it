import ProfilePicture from "./ProfilePicture";

interface UserProfileProps {
  userName: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ userName }) => {
  return (
    <div>
      <ProfilePicture userName={userName} />
    </div>
  );
};

export default UserProfile;
