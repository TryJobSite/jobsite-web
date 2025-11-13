const zod = require('zod');

const envSchema = zod.object({
  NEXT_PUBLIC_API: zod.string().optional(),
  // GOOGLE_CLIENT_ID: zod.string(),
  // GOOGLE_CLIENT_SECRET: zod.string(),
  // NEXTAUTH_SECRET: zod.string(),
  // NEXTAUTH_URL: zod.string().optional(),
});
module.exports = envSchema;
