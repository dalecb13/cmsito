import Link from "next/link";

export default function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "system-ui", padding: "1rem 2rem" }}>
      <nav style={{ display: "flex", gap: "1.5rem", marginBottom: "1.5rem", borderBottom: "1px solid #eee", paddingBottom: "0.5rem" }}>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/dashboard/articles">Articles</Link>
        <Link href="/dashboard/audit">Audit log</Link>
        <Link href="/dashboard/theme">Theme</Link>
      </nav>
      {children}
    </div>
  );
}
