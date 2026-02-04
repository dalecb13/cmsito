import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getOrCreateTheme } from "@/lib/theme";
import { ThemeForm } from "./theme-form";

const PRESETS = [
  { value: "default", label: "Default" },
  { value: "minimal", label: "Minimal" },
];

export default async function ThemePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "MAINTAINER" && session.user.role !== "OWNER") {
    redirect("/dashboard");
  }

  const theme = await getOrCreateTheme();
  const overrides = (theme.overrides as Record<string, unknown>) ?? {};

  return (
    <main>
      <h1>Theme</h1>
      <p style={{ marginBottom: "1rem" }}>
        <Link href="/dashboard">← Dashboard</Link>
      </p>
      <p style={{ color: "#666", marginBottom: "1rem" }}>
        One global theme for the knowledge base. Used by the SDK when rendering published content.
      </p>
      <ThemeForm
        presets={PRESETS}
        initialPreset={theme.preset}
        initialOverrides={{
          primaryColor: typeof overrides.primaryColor === "string" ? overrides.primaryColor : "",
          fontFamily: typeof overrides.fontFamily === "string" ? overrides.fontFamily : "",
          headingFont: typeof overrides.headingFont === "string" ? overrides.headingFont : "",
        }}
      />
    </main>
  );
}
