import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const BOT_TOKEN = process.env.TG_BOT_TOKEN;
  const CHAT_ID = process.env.TG_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    return res.status(500).json({ error: 'Telegram not configured' });
  }

  try {
    const { name, phone, message, product, source } = req.body ?? {};

    if (!phone?.trim()) {
      return res.status(400).json({ error: 'Phone required' });
    }

    const text = [
      '📩 Новая заявка с nikamet.pro',
      '',
      `👤 Имя: ${name || '—'}`,
      `📞 Телефон: ${phone}`,
      product ? `🔩 Продукт: ${product}` : null,
      message ? `💬 Комментарий: ${message}` : null,
      `📄 Страница: ${source || '—'}`,
      '',
      `🕐 ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`,
    ].filter(Boolean).join('\n');

    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text }),
    });

    if (!tgRes.ok) {
      const err = await tgRes.text();
      return res.status(502).json({ error: 'Telegram error', details: err });
    }

    return res.status(200).json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
}
