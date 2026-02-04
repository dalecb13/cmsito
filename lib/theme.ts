import { prisma } from "@/lib/prisma";

const DEFAULT_PRESET = "default";

/** Singleton theme: get the one row or create it. */
export async function getOrCreateTheme() {
  const existing = await prisma.theme.findFirst({ orderBy: { updatedAt: "desc" } });
  if (existing) return existing;
  return prisma.theme.create({
    data: {
      preset: DEFAULT_PRESET,
      overrides: {},
    },
  });
}

export type ThemeOverrides = {
  primaryColor?: string;
  fontFamily?: string;
  headingFont?: string;
  [key: string]: unknown;
};
