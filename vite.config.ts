import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: "autoUpdate",
    manifest: {
      id: "/",
      name: "DisciplineU",
      short_name: "DisciplineU",
      description:
        "An AI personal transformation coach that turns who you want to become into a daily plan.",
      lang: "en",
      dir: "ltr",
      categories: ["productivity", "lifestyle", "health"],
      theme_color: "#0b0b0e",
      background_color: "#0b0b0e",
      display: "standalone",
      display_override: ["standalone"],
      orientation: "portrait",
      scope: "/",
      start_url: "/app",
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
      shortcuts: [
        {
          name: "Today",
          short_name: "Today",
          description: "Jump to today's plan",
          url: "/app",
          icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
        },
        {
          name: "New goal",
          short_name: "New goal",
          description: "Turn an intention into a daily plan",
          url: "/app/new",
          icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
        },
      ],
    },
  }), cloudflare()],
});