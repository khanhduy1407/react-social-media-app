import Layout from "../components/Layout";
import Card from "../components/Card";
import Avatar from "../components/Avatar";
import Link from "next/link";
import PostCard from "../components/PostCard";
import { useRouter } from "next/router";
import FriendInfo from "../components/UserFollowInfo";
import { useEffect, useState } from "react";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import Cover from "../components/Cover";
import ProfileTabs from "../components/ProfileTabs";
import ProfileContent from "../components/ProfileContent";
import { UserContextProvider } from "../contexts/UserContext";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [name, setName] = useState("");
  const [place, setPlace] = useState("");
  const router = useRouter();
  const tab = router?.query?.tab?.[0] || "posts";
  const session = useSession();
  const userId = router.query.id;

  const supabase = useSupabaseClient();

  useEffect(() => {
    if (!userId && !session) {
      return;
    }
    fetchUser();
  }, [userId, session]);

  function fetchUser() {
    supabase
      .from("profiles")
      .select()
      .eq("id", userId)
      .then((result) => {
        if (result.error) {
          throw result.error;
        }
        if (result.data) {
          const profile = result.data[0];
          setProfile(profile);

          // following | followers
          if (profile.followers?.includes(session?.user?.id)) {
            setIsFollowing(true);
          }
        }
      });
  }

  function saveProfile() {
    supabase
      .from("profiles")
      .update({
        name,
        place,
      })
      .eq("id", session.user.id)
      .then((result) => {
        if (!result.error) {
          setProfile((prev) => ({ ...prev, name, place }));
        }
        setEditMode(false);
      });
  }

  const isMyUser = userId === session?.user?.id;

  function handleFollow() {
    if (!isMyUser) {
      // Follow user logic
      supabase
        .from("profiles")
        .update({
          followers: [...(profile.followers || []), session.user.id],
        })
        .eq("id", userId)
        .then((result) => {
          if (!result.error) {
            setIsFollowing(true);
            fetchUser();
          }
        });
      supabase
        .from("profiles")
        .update({
          following: [...(profile.following || []), userId],
        })
        .eq("id", session.user.id)
        .then((result) => {
          if (!result.error) {
            // Successfully followed
          }
        });
    }
  }

  function handleUnfollow() {
    if (!isMyUser) {
      // Unfollow user logic
      supabase
        .from("profiles")
        .update({
          followers: profile.followers.filter(
            (follower) => follower !== session.user.id
          ),
        })
        .eq("id", userId)
        .then((result) => {
          if (!result.error) {
            setIsFollowing(false);
            fetchUser();
          }
        });
      supabase
        .from("profiles")
        .update({
          following: profile.following.filter(
            (following) => following !== userId
          ),
        })
        .eq("id", session.user.id)
        .then((result) => {
          if (!result.error) {
            // Successfully unfollowed
          }
        });
    }
  }

  return (
    <Layout>
      <UserContextProvider>
        <Card noPadding={true}>
          <div className="relative overflow-hidden rounded-md">
            <Cover
              url={profile?.cover}
              editable={isMyUser}
              onChange={fetchUser}
            />
            <div className="absolute top-24 left-4 z-20">
              {profile && (
                <Avatar
                  url={profile.avatar}
                  size={"lg"}
                  editable={isMyUser}
                  onChange={fetchUser}
                />
              )}
            </div>
            <div className="p-4 pt-0 md:pt-4 pb-0">
              <div className="ml-24 md:ml-40 flex justify-between">
                <div>
                  {editMode && (
                    <div>
                      <input
                        type="text"
                        className="border py-2 px-3 rounded-md"
                        placeholder={"Your name"}
                        onChange={(ev) => setName(ev.target.value)}
                        value={name}
                      />
                    </div>
                  )}
                  {!editMode && (
                    <h1 className="text-3xl font-bold">{profile?.name}</h1>
                  )}
                  {!editMode && (
                    <div className="text-gray-500 leading-4">
                      {profile?.place || "Internet"}
                    </div>
                  )}
                  {editMode && (
                    <div>
                      <input
                        type="text"
                        className="border py-2 px-3 rounded-md mt-1"
                        placeholder={"Your location"}
                        onChange={(ev) => setPlace(ev.target.value)}
                        value={place}
                      />
                    </div>
                  )}
                </div>
                <div className="grow">
                  <div className="text-right">
                    {isMyUser && !editMode && (
                      <button
                        onClick={() => {
                          setEditMode(true);
                          setName(profile.name);
                          setPlace(profile.place);
                        }}
                        className="inline-flex mx-1 gap-1 bg-white rounded-md shadow-sm shadow-gray-500 py-1 px-2"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                          />
                        </svg>
                        Sửa hồ sơ
                      </button>
                    )}
                    {isMyUser && editMode && (
                      <button
                        onClick={saveProfile}
                        className="inline-flex mx-1 gap-1 bg-white rounded-md shadow-sm shadow-gray-500 py-1 px-2"
                      >
                        Lưu
                      </button>
                    )}
                    {isMyUser && editMode && (
                      <button
                        onClick={() => setEditMode(false)}
                        className="inline-flex mx-1 gap-1 bg-white rounded-md shadow-sm shadow-gray-500 py-1 px-2"
                      >
                        Hủy
                      </button>
                    )}
                    {!isMyUser && !isFollowing && (
                      <button
                        onClick={() => handleFollow()}
                        className="inline-flex mx-1 gap-1 bg-white rounded-md shadow-sm shadow-gray-500 py-1 px-2"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                          />
                        </svg>
                        Theo dõi
                      </button>
                    )}
                    {!isMyUser && isFollowing && (
                      <button
                        onClick={() => handleUnfollow()}
                        className="inline-flex mx-1 gap-1 bg-red-400 text-white rounded-md shadow-sm shadow-gray-500 py-1 px-2"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                          />
                        </svg>
                        Bỏ theo dõi
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <ProfileTabs active={tab} userId={profile?.id} />
            </div>
          </div>
        </Card>
        <ProfileContent activeTab={tab} userId={userId} />
      </UserContextProvider>
    </Layout>
  );
}
