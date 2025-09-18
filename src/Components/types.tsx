export interface Preferences {
  userName: string;
  displayName: string;
  bioId: string;
  profilePictureId?: string;
  backgroundImageId?: string;
  followId?: string;
}

export interface User {
  $id: string;
  name: string;
  userName: string;
  displayName: string;
  prefs: Preferences;
}

export interface AppImage {
  $id: string;
  imageFileId: string;
  fileName: string;
  postId: string;
  createdAt: string;
  collectionId: string;
  userName: string;
  collectionName: string;
  links: string;
  tags: string;
  postedBy: string;
  likeCount: string;
}

export interface Post {
  $id: string;
  imageFileId?: string;
  followId?: string;
  userId?: string;
  tags?: string;
  userName?: string;
  displayName?: string;
  profilePictureId?: string;
  collectionName?: string;
  description?: string;
  postId?: string;
  collectionId?: string;
  imageId?: string;
  fileName?: string;
  createdAt?: string;
  likedBy?: any[];
  postedBy?: string;
  imageSrc?: string;
  likeCount?: string | number;
  links?: string;
  id?: string;
  $createdAt?: string;
}
