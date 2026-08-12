import { env } from "cloudflare:workers";

type AdminLoginRateLimiter = {
  limit(options: { key: string }): Promise<{ success: boolean }>;
};

export function getAdminLoginRateLimiter(): AdminLoginRateLimiter | undefined {
  return (env as unknown as { ADMIN_LOGIN_RATE_LIMITER?: AdminLoginRateLimiter })
    .ADMIN_LOGIN_RATE_LIMITER;
}
