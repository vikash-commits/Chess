import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // If you're using React

export default defineConfig({
  plugins: [react()], // Add any plugins you're using, like for React
  build: {
    outDir: "dist", // The output directory for the build files
  },
  // Optional: If your app is served from a subpath, you might need to set `base`
  // base: '/your-subpath/',
});
