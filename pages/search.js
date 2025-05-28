import Link from "next/link";
import Card from "../components/Card";
import Layout from "../components/Layout";
import { UserContextProvider } from "../contexts/UserContext";
import { useEffect, useState } from "react";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import Avatar from "../components/Avatar";

export default function SearchPage() {
  const [searchUsers, setSearchUsers] = useState("");
  const [users, setUsers] = useState([]);

  const session = useSession();
  const supabase = useSupabaseClient();

  function findUser(e) {
    e.preventDefault();

    if (searchUsers.length < 3) {
      alert("Vui lòng nhập ít nhất 3 ký tự");
      return;
    }
    // find users's name not equal to the current user
    supabase
      .from("profiles")
      .select()
      .ilike("name", `%${searchUsers}%`)
      .neq("id", session.user.id) // Exclude current user
      .then((result) => {
        if (result.error) {
          throw result.error;
        }
        if (result.data) {
          setUsers(result.data);
        }
      });
  }

  return (
    <Layout>
      <UserContextProvider>
        <Card>
          <div className="border grow rounded-full relative">
            <form onSubmit={findUser}>
              <input
                value={searchUsers}
                onChange={(ev) => setSearchUsers(ev.target.value)}
                className="block w-full p-3 px-4 overflow-hidden h-12 rounded-full"
                placeholder="Tìm kiếm người dùng"
              />
            </form>
            <button
              className="absolute top-3 right-3 text-gray-400"
              onClick={(e) => findUser(e)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </button>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            {users.length > 0 ? (
              users.map((user, index) => (
                <Link
                  href={`/profile/${user.id}`}
                  className="flex items-center gap-2 p-3 cursor-pointer rounded-md hover:bg-blue-300 hover:bg-opacity-10 transition-all hover:scale-110 hover:shadow-md shadow-gray-300"
                  key={index}
                >
                  <Avatar url={user?.avatar} size={"sm"} />
                  <div>
                    <h1 className="text-sm font-bold">{user?.name}</h1>
                  </div>
                </Link>
              ))
            ) : searchUsers.length > 0 ? (
              <div className="text-gray-400 p-3">
                Nhấn tìm kiếm để xem kết quả
              </div>
            ) : (
              <div className="text-gray-400 p-3">
                Nhập tên người dùng để tìm kiếm
              </div>
            )}
          </div>
        </Card>
      </UserContextProvider>
    </Layout>
  );
}
