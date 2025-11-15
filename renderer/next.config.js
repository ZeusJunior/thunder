const { version } = require("../package.json");

/** @type {import('next').NextConfig} */
module.exports = {
  output: "export",
  distDir: process.env.NODE_ENV === "production" ? "../app" : ".next",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  env: {
    VERSION: version,
  },
  webpack: (config) => {
    return config;
  },
};
