import { auth } from "@/auth";
import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <main>
      <h1>Dashboard</h1>
      <p>
        Signed in as {session.user.email} (role: {session.user.role})
      </p>
      <form action={signOutAction}>
        <button type="submit">Sign out</button>
      </form>
      <p style={{ marginTop: "1rem" }}>
        <Link href="/dashboard/articles">Manage articles</Link>
      </p>
      <p>
        <Link href="/">Home</Link>
      </p>
    </main>
  );
}
