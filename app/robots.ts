import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/artists", "/categories", "/opportunities"],
        disallow: [
          "/opportunities/business-gigs",
          "/opportunities/business-gigs/",
          "/dashboard",
          "/dashboard/",
          "/admin",
          "/admin/",
          "/auth",
          "/auth/",
        ],
      },
    ],
  };
}
