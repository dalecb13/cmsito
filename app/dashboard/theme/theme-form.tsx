"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PresetOption {
  value: string;
  label: string;
}

interface ThemeFormProps {
  presets: PresetOption[];
  initialPreset: string;
  initialOverrides: {
    primaryColor: string;
    fontFamily: string;
    headingFont: string;
  };
}

export function ThemeForm({
  presets,
  initialPreset,
  initialOverrides,
}: ThemeFormProps) {
  const router = useRouter();
  const [preset, setPreset] = useState(initialPreset);
  const [primaryColor, setPrimaryColor] = useState(initialOverrides.primaryColor);
  const [fontFamily, setFontFamily] = useState(initialOverrides.fontFamily);
  const [headingFont, setHeadingFont] = useState(initialOverrides.headingFont);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const overrides: Record<string, string> = {};
    if (primaryColor.trim()) overrides.primaryColor = primaryColor.trim();
    if (fontFamily.trim()) overrides.fontFamily = fontFamily.trim();
    if (headingFont.trim()) overrides.headingFont = headingFont.trim();
    const res = await fetch("/api/theme", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preset: preset.trim(), overrides }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to save theme");
      return;
    }
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 480 }}
    >
      <label>
        Preset
        <select
          value={preset}
          onChange={(e) => setPreset(e.target.value)}
          style={{ display: "block", width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
        >
          {presets.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Primary color (e.g. #2563eb or blue)
        <input
          type="text"
          value={primaryColor}
          onChange={(e) => setPrimaryColor(e.target.value)}
          placeholder="#2563eb"
          style={{ display: "block", width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
        />
      </label>
      <label>
        Body font family (e.g. system-ui, Georgia)
        <input
          type="text"
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          placeholder="system-ui"
          style={{ display: "block", width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
        />
      </label>
      <label>
        Heading font family (e.g. system-ui, Georgia)
        <input
          type="text"
          value={headingFont}
          onChange={(e) => setHeadingFont(e.target.value)}
          placeholder="system-ui"
          style={{ display: "block", width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
        />
      </label>
      {error && <p style={{ color: "crimson", margin: 0 }}>{error}</p>}
      <button type="submit" disabled={loading} style={{ padding: "0.5rem 1rem", alignSelf: "flex-start" }}>
        {loading ? "Saving…" : "Save theme"}
      </button>
    </form>
  );
}
