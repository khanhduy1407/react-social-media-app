import { createContext, useEffect, useState } from "react";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
  const session = useSession();
  const supabase = useSupabaseClient();
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    if (!session) {
      return;
    }
    supabase
      .from("profiles")
      .select()
      .eq("id", session.user.id)
      .then((result) => {
        setProfile(result.data?.[0]);
      });
  }, [session]);
  return (
    <UserContext.Provider value={{ profile }}>{children}</UserContext.Provider>
  );
}
