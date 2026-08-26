import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { forgePlugin } from "./forge-plugin.ts"

export default defineConfig({
  base: process.env.BASE_PATH || "/",
  plugins: [react(), forgePlugin()],
  server: { port: 5173, host: true },
})
