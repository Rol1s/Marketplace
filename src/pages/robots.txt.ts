import { SITE } from '@/config/site';

const fallbackUrl = SITE.url.replace(/\/$/, '');

export function GET({ request }: { request: Request }) {
  const baseUrl = (import.meta.env.PUBLIC_SITE_URL || new URL(request.url).origin || fallbackUrl).replace(/\/$/, '');
  const body = `User-agent: *
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Yandex
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Applebot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: ${baseUrl}/sitemap-index.xml
LLMs: ${baseUrl}/llms.txt
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
