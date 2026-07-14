import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Planisher — Construction planning",
    short_name: "Planisher",
    description: "Keep construction projects, tasks, field updates, and activity in one calm plan.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    background_color: "#f4f7f3",
    theme_color: "#174d3a",
    orientation: "portrait-primary",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/planisher-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/planisher-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
