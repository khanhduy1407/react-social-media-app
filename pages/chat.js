import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import Card from "../components/Card";
import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import Avatar from "../components/Avatar";
import Link from "next/link";
import ReactTimeAgo from "react-time-ago";

export default function ChatPage() {
  const [searchUsers, setSearchUsers] = useState("");
  const [searchConversations, setSearchConversations] = useState("");
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);

  const session = useSession();
  const supabase = useSupabaseClient();

  useEffect(() => {
    if (!session) {
      return;
    }

    fetchAllConversations();
  }, [session]);

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

  async function fetchAllConversations() {
    try {
      // id | created_at | user_1 | user_2 | messages | last_message
      // find all conversations where user_1 or user_2 is the current user
      const { data, error } = await supabase
        .from("chats")
        .select()
        .or(`user_1.eq.${session.user.id},user_2.eq.${session.user.id}`);

      if (error) throw error;

      // Tạo danh sách các promise để lấy thông tin user
      const conversationsWithUser = await Promise.all(
        data.map(async (conversation) => {
          // Process conversations data
          // get user_1 or user_2 if is not current user info from "profiles" table
          const otherUserId =
            conversation.user_1 === session.user.id
              ? conversation.user_2
              : conversation.user_1;

          const { data: userData, error: userError } = await supabase
            .from("profiles")
            .select()
            .eq("id", otherUserId)
            .single();

          if (userError) throw userError;

          return {
            ...conversation,
            user: userData,
          };
        })
      );

      setConversations(conversationsWithUser);
    } catch (err) {
      console.error("Lỗi khi lấy hội thoại:", err);
    }
  }

  return (
    <Layout>
      <h1 className="text-6xl mb-4 text-gray-300">Trò chuyện</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                  href={`/chat/with/${user.id}`}
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
        <Card>
          <div className="border grow rounded-full relative">
            <form onSubmit={findUser}>
              <input
                value={searchConversations}
                onChange={(ev) => setSearchConversations(ev.target.value)}
                className="block w-full p-3 px-4 overflow-hidden h-12 rounded-full"
                placeholder="Tìm kiếm hội thoại"
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
            {conversations.length > 0 ? (
              conversations.map((cvs, index) => (
                <Link
                  href={`/chat/${cvs.id}`}
                  className="flex items-center gap-2 p-3 cursor-pointer rounded-md hover:bg-blue-300 hover:bg-opacity-10 transition-all hover:scale-110 hover:shadow-md shadow-gray-300"
                  key={index}
                >
                  <Avatar url={cvs.user.avatar} size={"sm"} />
                  <div>
                    <h1 className="text-sm font-bold">{cvs.user.name}</h1>
                    <p className="text-gray-400 text-xs">
                      {cvs.last_message ? (
                        cvs.last_message.length > 50 ? (
                          <>
                            {cvs.last_message.slice(0, 50)} ... -{" "}
                            <ReactTimeAgo
                              date={new Date(cvs.updated_at).getTime()}
                            />
                          </>
                        ) : (
                          <>
                            {cvs.last_message} -{" "}
                            <ReactTimeAgo
                              date={new Date(cvs.updated_at).getTime()}
                            />
                          </>
                        )
                      ) : (
                        "Chưa có tin nhắn nào"
                      )}
                    </p>
                  </div>
                </Link>
              ))
            ) : searchConversations.length > 0 ? (
              <div className="text-gray-400 p-3">
                Nhấn tìm kiếm để xem kết quả
              </div>
            ) : (
              <div className="text-gray-400 p-3">Bạn chưa có hội thoại nào</div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
