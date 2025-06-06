const { loadEnv, defineConfig } = require('@medusajs/framework/utils');

loadEnv(process.env.NODE_ENV || 'development', process.cwd());

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS,
      adminCors: process.env.ADMIN_CORS,
      authCors: process.env.AUTH_CORS,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  modules: [
    {
      resolve: "@medusajs/medusa/analytics",
      options: {
        providers: [
          {
            resolve: "./src/modules/segment",
            id: "segment",
            options: {
              writeKey: process.env.SEGMENT_WRITE_KEY || "",
            },
          },
        ],
      },
    },
    {
      resolve: "./src/modules/odoo",
      options: {
        url: process.env.ODOO_URL,
        dbName: process.env.ODOO_DB_NAME,
        username: process.env.ODOO_USERNAME,
        apiKey: process.env.ODOO_API_KEY,
      },
    },
    // Thêm module Contentful vào đây
    {
      resolve: "./src/modules/contentful",
      options: {
        management_access_token: process.env.CONTENTFUL_MANAGEMENT_ACCESS_TOKEN,
        delivery_token: process.env.CONTENTFUL_DELIVERY_TOKEN,
        space_id: process.env.CONTENTFUL_SPACE_ID,
        environment: process.env.CONTENTFUL_ENVIRONMENT,
        default_locale: "en-US",
      },
    },
  ],
});
