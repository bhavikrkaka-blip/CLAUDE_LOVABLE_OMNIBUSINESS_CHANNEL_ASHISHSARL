import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

function sitemapPlugin(): Plugin {
  return {
    name: "generate-sitemap",
    apply: "build",
    async closeBundle() {
      try {
        const projectId = "utpgshbwuidnfgvzuacv";
        const url = `https://${projectId}.supabase.co/functions/v1/sitemap`;
        const res = await fetch(url);
        if (res.ok) {
          const xml = await res.text();
          const fs = await import("fs");
          fs.writeFileSync(path.resolve(__dirname, "dist/sitemap.xml"), xml);
          console.log("✅ sitemap.xml generated successfully");
        } else {
          console.warn("⚠️ Failed to fetch sitemap:", res.status);
        }
      } catch (e) {
        console.warn("⚠️ Sitemap generation skipped:", e);
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger(), sitemapPlugin()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
