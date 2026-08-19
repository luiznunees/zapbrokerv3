import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/login",
          "/signup",
          "/dashboard",
          "/onboarding",
          "/auth",
          "/checkout",
          "/assinar",
          "/admin",
          "/forgot-password",
          "/reset-password",
          "/corretores",
          "/demo",
        ],
      },
    ],
    sitemap: "https://zapbroker.dev/sitemap.xml",
  };
}