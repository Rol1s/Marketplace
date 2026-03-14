/**
 * Cloudflare Worker: receives form POST and sends to Telegram.
 *
 * Deploy: npx wrangler deploy worker/form-handler.ts
 *
 * Environment variables (set via wrangler secret):
 *   TELEGRAM_BOT_TOKEN - Bot API token
 *   TELEGRAM_CHAT_ID   - Chat ID to send notifications to
 */

interface Env {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
}

interface FormData {
  name?: string;
  phone: string;
  message?: string;
  source?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': 'https://nikamet.pro',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const data: FormData = await request.json();

      if (!data.phone || data.phone.trim().length < 7) {
        return new Response(JSON.stringify({ error: 'Phone required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const text = [
        '🔔 Новая заявка с nikamet.pro',
        '',
        `👤 Имя: ${data.name || 'Не указано'}`,
        `📞 Телефон: ${data.phone}`,
        `💬 Сообщение: ${data.message || '—'}`,
        `📍 Страница: ${data.source || '—'}`,
        '',
        `🕐 ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`,
      ].join('\n');

      const telegramUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
      await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text,
          parse_mode: 'HTML',
        }),
      });

      return new Response(JSON.stringify({ ok: true }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'https://nikamet.pro',
        },
      });
    } catch {
      return new Response(JSON.stringify({ error: 'Internal error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
