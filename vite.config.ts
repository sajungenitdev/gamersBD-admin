import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: "named",
        namedExport: "ReactComponent",
      },
      // Include SVG files
      include: "**/*.svg",
    }),
  ],
  // Optional: Add server configuration for development
  server: {
    port: 3000,
    open: true,
  },
  // Optional: Build optimizations
  build: {
    outDir: "dist",
    sourcemap: true, // Set to false in production if you don't need sourcemaps
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});