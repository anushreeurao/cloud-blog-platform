import type { MetadataRoute } from "next";
import { getAllPublishedSlugs } from "@/services/posts";
import { getSiteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const baseRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/auth`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/dashboard`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/media`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${siteUrl}/u`, changeFrequency: "weekly", priority: 0.7 },
  ];

  let posts = [] as Awaited<ReturnType<typeof getAllPublishedSlugs>>;
  try {
    posts = await getAllPublishedSlugs();
  } catch {
    posts = [];
  }

  const postRoutes = posts.map((post) => ({
    url: `${siteUrl}/posts/${post.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...baseRoutes, ...postRoutes];
}
