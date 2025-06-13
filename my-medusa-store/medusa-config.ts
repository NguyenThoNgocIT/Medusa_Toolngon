const { loadEnv, defineConfig, Modules, ContainerRegistrationKeys } = require('@medusajs/framework/utils');

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
  jobs: [
    {
      resolve: "./src/jobs/sync-products-from-erp",
      options: {},
    },
  ],
  modules: [
    // User Module - với jwt_secret 
    {
      resolve: "@medusajs/medusa/user",
      options: {
        jwt_secret: process.env.JWT_SECRET || "supersecret",
      },
    },
    // Cache Module - cần thiết cho Auth
    {
      resolve: "@medusajs/medusa/cache-inmemory",
    },
    // Auth Module
    {
      resolve: "@medusajs/medusa/auth",
      dependencies: [Modules.CACHE, ContainerRegistrationKeys.LOGGER],
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/auth-emailpass",
            id: "emailpass",
          },
        ],
      },
    },
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
    // EXISTING: Odoo JSON-RPC Module
    {
      resolve: "./src/modules/odoo",
      options: {
        url: process.env.ODOO_URL,
        dbName: process.env.ODOO_DB_NAME,
        username: process.env.ODOO_USERNAME,
        apiKey: process.env.ODOO_API_KEY,
      },
    },
    // NEW: Odoo REST API Module
    {
      resolve: "./src/modules/odoo_rest",
      options: {
        // odoo_base_url: process.env.ODOO_BASE_URL, // http://localhost:8069
        // api_key: process.env.ODOO_REST_API_KEY,   // REST API key từ odoo-rest-api module
        odoo_base_url: process.env.ODOO_BASE_URL,
    db: process.env.ODOO_DB_NAME,
    username: process.env.ODOO_USERNAME,
    password: process.env.ODOO_PASSWORD,
      },
    },
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
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_API_KEY,
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/notification-sendgrid",
            id: "sendgrid",
            options: {
              channels: ["email"],
              api_key: process.env.SENDGRID_API_KEY,
              from: process.env.SENDGRID_FROM,
            },
          },
        ],
      },
    },
    {
      resolve: "./src/modules/algolia",
      options: {
        appId: process.env.ALGOLIA_APP_ID,
        apiKey: process.env.ALGOLIA_API_KEY,
        productIndexName: process.env.ALGOLIA_PRODUCT_INDEX_NAME,
      },
    },
  ],
})