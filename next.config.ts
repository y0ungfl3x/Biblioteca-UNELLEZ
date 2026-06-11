import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hay un package-lock.json suelto en el home del usuario que hace que
  // Turbopack infiera mal la raíz del workspace (rompe watching y caché).
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
