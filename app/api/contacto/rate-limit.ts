import { env } from "cloudflare:workers";

type ContactRateLimiter = {
  limit(options: { key: string }): Promise<{ success: boolean }>;
};

export function getContactRateLimiter(): ContactRateLimiter | undefined {
  return (env as unknown as { CONTACT_RATE_LIMITER?: ContactRateLimiter })
    .CONTACT_RATE_LIMITER;
}
