import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const BOT_TOKEN = import.meta.env.TG_BOT_TOKEN;
  const CHAT_ID = import.meta.env.TG_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    return new Response(JSON.stringify({ error: 'Telegram not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { name, phone, message, source } = body as {
      name?: string;
      phone?: string;
      message?: string;
      source?: string;
    };

    if (!phone?.trim()) {
      return new Response(JSON.stringify({ error: 'Phone required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const text = [
      '📩 Новая заявка с nikamet.pro',
      '',
      `👤 Имя: ${name || '—'}`,
      `📞 Телефон: ${phone}`,
      `💬 Сообщение: ${message || '—'}`,
      `📄 Страница: ${source || '—'}`,
      '',
      `🕐 ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`,
    ].join('\n');

    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: 'HTML',
      }),
    });

    if (!tgRes.ok) {
      const err = await tgRes.text();
      return new Response(JSON.stringify({ error: 'Telegram error', details: err }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
