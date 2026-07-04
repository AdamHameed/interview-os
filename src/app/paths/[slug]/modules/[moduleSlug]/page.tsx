import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LegacyPathModulePage({
  params,
}: {
  params: Promise<{ slug: string; moduleSlug: string }>;
}) {
  const { slug, moduleSlug } = await params;
  const membership = await db.learningPathModule.findFirst({
    where: {
      path: { slug, isPublished: true },
      module: { slug: moduleSlug, isPublished: true },
    },
  });
  if (!membership) notFound();
  redirect(`/modules/${moduleSlug}`);
}
