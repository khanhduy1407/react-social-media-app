import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import Card from "../../components/Card";
import PostCard from "../../components/PostCard";
import Preloader from "../../components/Preloader";
import { UserContextProvider } from "../../contexts/UserContext";

export default function SinglePostPage() {
  const router = useRouter();
  const postId = router.query.id;

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  const supabase = useSupabaseClient();

  useEffect(() => {
    if (!postId) return;

    loadPostData().then(() => {});
  }, [postId]);

  async function loadPostData() {
    const { data: postData } = await supabase
      .from("posts")
      .select(
        "id, content, photos, created_at, parent, from, profiles(id, avatar, name)"
      )
      .eq("id", postId);
    setPost(postData[0]);
    setLoading(false);
  }

  return (
    <Layout>
      <UserContextProvider>
        {loading ? (
          <Card>
            <Preloader />
          </Card>
        ) : (
          <>{post ? <PostCard {...post} /> : <p>Post not found</p>}</>
        )}
      </UserContextProvider>
    </Layout>
  );
}
