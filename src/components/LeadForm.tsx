import { useState, type FormEvent } from 'react';

interface LeadFormProps {
  product?: string;
  source?: string;
}

const API_URL = '/api/lead';

export default function LeadForm({ product = '', source = '' }: LeadFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;

    setStatus('loading');
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          message: message || undefined,
          product: product || undefined,
          source: source || window.location.pathname,
        }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <div className="w-10 h-10 mx-auto mb-2 text-green-600">
          <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="20" cy="20" r="16" /><path d="M12 20l6 6 10-12" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-green-800">Заявка отправлена</h3>
        <p className="text-sm text-green-700 mt-1">Мы свяжемся с вами в ближайшее время</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-5">
      {product && (
        <div className="mb-4 bg-primary/5 border border-primary/20 rounded-lg p-3">
          <span className="text-xs text-text-muted block">Вы запрашиваете:</span>
          <span className="text-sm font-bold text-primary">{product}</span>
        </div>
      )}

      <div className="space-y-3 mb-4">
        <label className="block">
          <span className="text-sm text-text-muted">Имя</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ваше имя"
            className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-sm text-text-muted">
            Телефон <span className="text-accent">*</span>
          </span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 (___) ___-__-__"
            required
            className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-sm text-text-muted">Комментарий</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            placeholder="Длина, количество, город доставки..."
            className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none resize-none"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-accent text-white font-semibold py-3 px-6 rounded-lg hover:bg-accent-light transition-colors disabled:opacity-50"
      >
        {status === 'loading' ? 'Отправка...' : 'Отправить заявку'}
      </button>

      {status === 'error' && (
        <p className="text-sm text-red-600 mt-2 text-center">
          Ошибка отправки. Попробуйте ещё раз.
        </p>
      )}

      <p className="text-xs text-text-muted mt-3 text-center">
        Нажимая кнопку, вы соглашаетесь на обработку персональных данных
      </p>
    </form>
  );
}
