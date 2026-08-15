interface VercelRequest {
  method?: string;
  body?: unknown;
}

interface VercelResponse {
  setHeader(name: string, value: string): void;
  status(code: number): VercelResponse;
  json(body: unknown): unknown;
}

const MAX_FIELD_LENGTH = 600;
const MIN_SUBMIT_DELAY_MS = 1200;
const RECENT_LEADS = new Map<string, number>();

function asText(value: unknown, maxLength = MAX_FIELD_LENGTH): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function normalizePhone(value: string): string {
  return value.replace(/[^\d+]/g, '');
}

function isLikelyPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 16;
}

function isDuplicate(key: string): boolean {
  const now = Date.now();
  const last = RECENT_LEADS.get(key);

  for (const [itemKey, timestamp] of RECENT_LEADS) {
    if (now - timestamp > 10 * 60 * 1000) {
      RECENT_LEADS.delete(itemKey);
    }
  }

  if (last && now - last < 60 * 1000) return true;
  RECENT_LEADS.set(key, now);
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Cache-Control', 'no-store');

  const BOT_TOKEN = process.env.TG_BOT_TOKEN;
  const CHAT_ID = process.env.TG_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    return res.status(500).json({ error: 'Telegram not configured' });
  }

  try {
    const body = typeof req.body === 'object' && req.body !== null ? req.body as Record<string, unknown> : {};
    const name = asText(body.name, 80);
    const phone = asText(body.phone, 40);
    const message = asText(body.message);
    const product = asText(body.product, 160);
    const source = asText(body.source, 300);
    const website = asText(body.website, 120);
    const startedAt = Number(body.startedAt);

    if (website) {
      return res.status(200).json({ ok: true });
    }

    if (Number.isFinite(startedAt) && Date.now() - startedAt < MIN_SUBMIT_DELAY_MS) {
      return res.status(400).json({ error: 'Form submitted too quickly' });
    }

    if (!phone) {
      return res.status(400).json({ error: 'Phone required' });
    }

    if (!isLikelyPhone(phone)) {
      return res.status(400).json({ error: 'Invalid phone' });
    }

    const normalizedPhone = normalizePhone(phone);
    const duplicateKey = `${normalizedPhone}:${source || 'unknown'}`;
    if (isDuplicate(duplicateKey)) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    const text = [
      '📩 Новая заявка с rus-metall.pro',
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
      return res.status(502).json({ error: 'Notification delivery failed' });
    }

    return res.status(200).json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
}
