import Link from "next/link";
import Avatar from "./Avatar";

export default function UserFollowInfo({ user }) {
  return (
    <Link href={`/profile/${user.id}`} className="flex gap-2 items-center">
      <Avatar url={user.avatar} size="sm" />
      <div>
        <h3 className="font-bold text-1/2xl">{user.name}</h3>
      </div>
    </Link>
  );
}
