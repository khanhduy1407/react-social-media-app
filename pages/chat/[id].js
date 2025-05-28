import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Card from "../../components/Card";
import Preloader from "../../components/Preloader";
import Link from "next/link";
import Layout from "../../components/Layout";
import Avatar from "../../components/Avatar";

export default function ConversationPage() {
  const router = useRouter();
  const chatId = router.query.id;

  const [currentUser, setCurrentUser] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(null);

  const session = useSession();
  const supabase = useSupabaseClient();

  useEffect(() => {
    if (!chatId && !session) return;

    fetchConversation();

    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chats",
          filter: `id=eq.${chatId}`,
        },
        (payload) => {
          const updatedMessages = payload.new.messages;
          setMessages([...updatedMessages].reverse());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, session]);

  async function fetchConversation() {
    setLoading(true);
    try {
      // Check if conversation exists with the id, then check if user_1 or user_2 not equal to current user to get the user data
      const { data: conversation, error: conversationError } = await supabase
        .from("chats")
        .select("id, user_1, user_2")
        .eq("id", chatId)
        .single();
      if (conversationError) throw conversationError;
      if (!conversation) {
        console.error("Conversation not found");
        return;
      }
      const otherUserId =
        conversation.user_1 === session.user.id
          ? conversation.user_2
          : conversation.user_1;
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", otherUserId)
        .single();
      if (userError) throw userError;
      setUser(userData);
      // fetch current user data
      const { data: currentUserData, error: currentUserError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      if (currentUserError) throw currentUserError;
      setCurrentUser(currentUserData);
      setLoading(false);
      // Load messages for the conversation
      await loadMessages();
    } catch (error) {
      console.error("Error fetching conversation or user:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages() {
    setLoadingMessages(true);
    try {
      const { data, error: messagesError } = await supabase
        .from("chats")
        .select("messages")
        .eq("id", chatId);
      if (messagesError) throw messagesError;
      setMessages([...data[0].messages].reverse());
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  }

  async function sendMessage() {
    if (!message.trim()) return;

    const newMessage = {
      sender: session.user.id,
      content: message,
      created_at: new Date().toISOString(),
    };

    try {
      // Update the messages array in the chat
      const { data, error } = await supabase
        .from("chats")
        .update({
          messages: [...([...messages].reverse() || []), newMessage],
          last_message: message,
          updated_at: new Date().toISOString(),
        })
        .eq("id", chatId)
        .select("messages")
        .single();

      if (error) throw error;

      setMessages([...data.messages].reverse());
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
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
                  <h1>Đang trò chuyện với</h1>
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
                <div className="mt-4">
                  {loadingMessages ? (
                    <Preloader />
                  ) : (
                    <div className="flex flex-col gap-4">
                      {messages.map((msg, index) => (
                        // Display each message: avatar, content, and timestamp
                        // if msg.sender is the current user, align right and avatar right of the message
                        // else align left and avatar left of the message
                        <div
                          key={index}
                          className={`flex items-start gap-2 ${
                            msg.sender === session.user.id
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          {msg.sender !== session.user.id && (
                            <Avatar url={user.avatar} size={"sm"} />
                          )}
                          <div
                            className={`p-3 rounded-lg ${
                              msg.sender === session.user.id
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            <p>{msg.content}</p>
                            <span
                              className={
                                msg.sender === session.user.id
                                  ? "text-xs text-white"
                                  : "text-xs text-gray-500"
                              }
                            >
                              {new Date(msg.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                          {msg.sender === session.user.id && (
                            <Avatar url={currentUser.avatar} size={"sm"} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
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
