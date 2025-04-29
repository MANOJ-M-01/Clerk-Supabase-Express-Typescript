import "dotenv/config";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Environment variable "${name}" is required but was not provided.`
    );
  }
  return value;
}

export const config = {
  PORT: (() => {
    const portStr = process.env.PORT || "3001";
    const port = Number(portStr);
    if (isNaN(port) || port <= 0) {
      throw new Error(`Invalid PORT value: ${portStr}`);
    }
    return port;
  })(),

  SUPABASE_URL: requireEnv("SUPABASE_URL"),
  SUPABASE_KEY: requireEnv("SUPABASE_KEY"),

  CLERK_PUBLISHABLE_KEY: requireEnv("CLERK_PUBLISHABLE_KEY"),
  CLERK_SECRET_KEY: requireEnv("CLERK_SECRET_KEY"),
  CLERK_SIGN_IN_URL: requireEnv("CLERK_SIGN_IN_URL"),
};
