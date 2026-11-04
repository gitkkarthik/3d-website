import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/m/", "/q/", "/account", "/admin", "/api/", "/signin", "/render"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
