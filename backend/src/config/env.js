import 'dotenv/config';

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
};

export function validateEnv() {
  const missing = [];

  if (!env.databaseUrl) missing.push('DATABASE_URL');
  if (!env.jwtSecret) missing.push('JWT_SECRET');

  if (missing.length > 0) {
    const message = `Missing environment variables: ${missing.join(', ')}`;
    if (env.nodeEnv === 'production') {
      throw new Error(message);
    }
    console.warn(`${message}. Some features may not work until they are configured.`);
  }
}
