import Link from "next/link";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>Tiny CMS</h1>
      <p>Control panel and wiki knowledge base.</p>
      {session ? (
        <p>
          <Link href="/dashboard">Go to dashboard</Link>
        </p>
      ) : (
        <p>
          <Link href="/login">Sign in</Link> or <Link href="/signup">Sign up</Link>
        </p>
      )}
    </main>
  );
}
