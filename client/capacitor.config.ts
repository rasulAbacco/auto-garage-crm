import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.example.app",
  appName: "The Motor Desk",
  webDir: "dist",
  plugins: {
    StatusBar: {
      overlay: false,
    },
  },
};

export default config;
