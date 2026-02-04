import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const LIMIT = 50;

export default async function AuditLogPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "MAINTAINER" && session.user.role !== "OWNER") {
    redirect("/dashboard");
  }

  const logs = await prisma.auditLog.findMany({
    take: LIMIT,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true, name: true } },
    },
  });

  return (
    <main>
      <h1>Audit log</h1>
      <p style={{ marginBottom: "1rem" }}>
        <Link href="/dashboard">← Dashboard</Link>
      </p>
      {logs.length === 0 ? (
        <p>No audit events yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "system-ui", fontSize: "0.9rem" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid #eee" }}>
              <th style={{ padding: "0.5rem" }}>When</th>
              <th style={{ padding: "0.5rem" }}>User</th>
              <th style={{ padding: "0.5rem" }}>Action</th>
              <th style={{ padding: "0.5rem" }}>Resource</th>
              <th style={{ padding: "0.5rem" }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "0.5rem", whiteSpace: "nowrap" }}>
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td style={{ padding: "0.5rem" }}>
                  {log.user.name ?? log.user.email}
                </td>
                <td style={{ padding: "0.5rem" }}>{log.action.replace(/_/g, " ")}</td>
                <td style={{ padding: "0.5rem" }}>
                  {log.resourceType}
                  {log.resourceId ? ` (${log.resourceId.slice(0, 8)}…)` : ""}
                </td>
                <td style={{ padding: "0.5rem", color: "#666" }}>
                  {log.metadata && typeof log.metadata === "object" && "slug" in log.metadata
                    ? `/${String((log.metadata as { slug?: string }).slug)}`
                    : log.metadata
                      ? JSON.stringify(log.metadata)
                      : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
