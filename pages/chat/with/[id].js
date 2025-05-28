import { useRouter } from "next/router";
import Layout from "../../../components/Layout";
import Link from "next/link";
import Card from "../../../components/Card";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import Preloader from "../../../components/Preloader";
import Avatar from "../../../components/Avatar";
import { useEffect, useState } from "react";

export default function ChatWithPage() {
  const router = useRouter();
  const userId = router.query.id;

  const [user, setUser] = useState(null);
  const [isHaveConversation, setHaveConversation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const session = useSession();
  const supabase = useSupabaseClient();

  useEffect(() => {
    if (!userId && !session) return;

    // first check check conversation exists between current user and userId, if not, create a new conversation
    // else if it exists, ridirect to the conversation page
    const fetchConversation = async () => {
      setLoading(true);
      try {
        // Check if conversation exists with the user_1 or user_2 is currentUserId or param id, if exists, redirect to the conversation page
        // else start a new conversation
        const { data: conversation } = await supabase
          .from("chats")
          .select("id, user_1, user_2")
          .or(`user_1.eq.${session.user.id},user_2.eq.${session.user.id}`)
          .or(`user_1.eq.${userId},user_2.eq.${userId}`)
          .single();
        if (conversation) {
          setHaveConversation(true);
          router.push(`/chat/${conversation.id}`);
          return;
        }
        // If no conversation exists, fetch user data
        const { data: userData, error: userError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();
        if (userError) throw userError;
        setUser(userData);
      } catch (error) {
        console.error("Error fetching conversation or user:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConversation();
  }, [userId, session]);

  function sendMessage() {
    if (!message.trim()) {
      alert("Vui lòng nhập nội dung tin nhắn.");
      return;
    }

    // insert message into the database: id | created_at | user_1 | user_2 | messages | last_message
    // with user_1 as the current user and user_2 as the user being chatted with
    // then get the conversation id and redirect to the conversation page
    supabase
      .from("chats")
      .insert({
        user_1: session.user.id,
        user_2: userId,
        messages: [
          {
            content: message,
            sender: session.user.id,
            created_at: new Date().toISOString(),
          },
        ],
        last_message: message,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("Error sending message:", error);
          alert("Không thể gửi tin nhắn. Vui lòng thử lại.");
        } else {
          setMessage(""); // Clear the input
          router.push(`/chat/${data.id}`); // Điều hướng ngay
        }
      });
  }

  return (
    <Layout>
      <div className="flex items-center mb-4">
        <Link
          href="/chat"
          className="text-blue-500 hover:underline flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6 mr-2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
          </svg>
          Trở lại
        </Link>
      </div>
      <Card>
        {loading ? (
          <Preloader />
        ) : (
          <>
            {user ? (
              <>
                <div className="flex items-center gap-2">
                  <h1>Bắt đầu trò chuyện mới với</h1>
                  <Link
                    href={`/profile/${user.id}`}
                    className="flex items-center gap-2"
                  >
                    <Avatar url={user.avatar} size={"sm"} />
                    <h2 className="font-semibold">{user.name}</h2>
                  </Link>
                </div>
                <div className="border grow rounded-full relative mt-4">
                  <input
                    value={message}
                    onChange={(ev) => setMessage(ev.target.value)}
                    className="block w-full p-3 px-4 overflow-hidden h-12 rounded-full"
                    placeholder="Nhập nội dung tin nhắn..."
                  />
                  <button
                    className="absolute top-3 right-3 text-gray-400"
                    onClick={() => sendMessage()}
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
                        d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                      />
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <p className="text-gray-500">Đang tải thông tin trò chuyện...</p>
            )}
          </>
        )}
      </Card>
    </Layout>
  );
}
