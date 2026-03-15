import { useStore } from '@nanostores/react';
import { $cart, removeFromCart, updateQuantity, clearCart, calcItemWeight, calcTotalWeight, type CartItem } from '@/stores/cartStore';
import { useState } from 'react';

function formatWeight(kg: number): string {
  return kg >= 1000 ? `${(kg / 1000).toFixed(3)} т` : `${kg.toFixed(2)} кг`;
}

function categoryUrl(item: CartItem): string {
  const map: Record<string, string> = {
    truby: '/truby/',
    shvellery: '/shvellery/',
    dvutavry: '/dvutavry/',
    listy: '/listy/',
    ugolki_ravno: '/ugolki/ravnopolochnye/',
    ugolki_neravno: '/ugolki/neravnopolochnye/',
    shpunt: '/shpunt/',
    armatura: '/armatura/',
    profilnaya_kv: '/profilnaya-truba/kvadratnaya/',
    profilnaya_pr: '/profilnaya-truba/pryamougolnaya/',
    krug: '/krug/',
    kvadrat: '/kvadrat/',
    polosa: '/polosa/',
    'truby-besshovnye': '/truby-besshovnye/',
    'truby-vgp': '/truby-vgp/',
    'dvutavry-8239': '/dvutavry-8239/',
    'shvellery-gnutye': '/shvellery-gnutye/',
  };
  return `${map[item.category] || '/sortament/'}${item.id}`;
}

async function loadCyrillicFont(doc: any): Promise<void> {
  const fontUrl = 'https://cdn.jsdelivr.net/gh/nicholasgasior/gfonts-base64/fonts/pt-sans/pt-sans-400.ttf.base64.txt';
  const boldUrl = 'https://cdn.jsdelivr.net/gh/nicholasgasior/gfonts-base64/fonts/pt-sans/pt-sans-700.ttf.base64.txt';
  try {
    const [regular, bold] = await Promise.all([
      fetch(fontUrl).then((r) => r.text()),
      fetch(boldUrl).then((r) => r.text()),
    ]);
    doc.addFileToVFS('PTSans-Regular.ttf', regular);
    doc.addFont('PTSans-Regular.ttf', 'PTSans', 'normal');
    doc.addFileToVFS('PTSans-Bold.ttf', bold);
    doc.addFont('PTSans-Bold.ttf', 'PTSans', 'bold');
  } catch {
    // fallback — no cyrillic
  }
}

async function exportPDF(items: CartItem[]) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();
  await loadCyrillicFont(doc);
  const now = new Date().toLocaleDateString('ru-RU');
  const hasFont = doc.getFontList()['PTSans'] !== undefined;
  const fontName = hasFont ? 'PTSans' : 'helvetica';

  doc.setFont(fontName, 'bold');
  doc.setFontSize(16);
  if (hasFont) {
    doc.text('Смета металлопроката — nikamet.pro', 105, 16, { align: 'center' });
  } else {
    doc.text('Smeta metalloprokata — nikamet.pro', 105, 16, { align: 'center' });
  }

  doc.setFont(fontName, 'normal');
  doc.setFontSize(10);
  doc.text(now, 105, 24, { align: 'center' });

  const head = [['#', hasFont ? 'Наименование' : 'Name', hasFont ? 'ГОСТ' : 'GOST', hasFont ? 'Кол-во' : 'Qty', hasFont ? 'Ед.' : 'Unit', hasFont ? 'Вес п/м' : 'kg/m', hasFont ? 'Общий вес' : 'Total']];
  const body = items.map((item, i) => [
    String(i + 1),
    item.name,
    item.gost,
    String(item.quantity),
    item.unit,
    item.weightPerMeter.toFixed(2),
    formatWeight(calcItemWeight(item)),
  ]);

  const totalKg = calcTotalWeight(items);

  autoTable(doc, {
    startY: 30,
    head,
    body,
    foot: [['', '', '', '', '', hasFont ? 'ИТОГО:' : 'TOTAL:', formatWeight(totalKg)]],
    theme: 'grid',
    headStyles: { fillColor: [30, 64, 100], fontSize: 9, font: fontName },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 10, font: fontName },
    styles: { fontSize: 8, cellPadding: 3, font: fontName },
    columnStyles: {
      0: { cellWidth: 10 },
      3: { halign: 'center' as const },
      4: { halign: 'center' as const },
      5: { halign: 'right' as const },
      6: { halign: 'right' as const },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFont(fontName, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(150);
  const footerText = hasFont ? 'Сформировано на nikamet.pro — справочник металлопроката' : 'Generated at nikamet.pro';
  doc.text(footerText, 105, finalY, { align: 'center' });

  doc.save(`smeta-nikamet-${now.replace(/\./g, '-')}.pdf`);
}

export default function CartPage() {
  const items = useStore($cart);
  const [showForm, setShowForm] = useState(false);

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4 opacity-30">📋</div>
        <h2 className="text-xl font-bold text-gray-600 mb-2">Смета пуста</h2>
        <p className="text-gray-400 mb-6">Добавьте позиции со страниц продуктов</p>
        <a href="/sortament" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
          Перейти в каталог →
        </a>
      </div>
    );
  }

  const totalKg = calcTotalWeight(items);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-gray-200">
              <th className="text-left px-3 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Наименование</th>
              <th className="text-left px-3 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">ГОСТ</th>
              <th className="text-center px-3 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Кол-во</th>
              <th className="text-center px-3 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Ед.</th>
              <th className="text-right px-3 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Вес п/м</th>
              <th className="text-right px-3 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Общий вес</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={`${item.category}-${item.id}`} className="border-b border-gray-100 hover:bg-blue-50/30">
                <td className="px-3 py-3">
                  <a href={categoryUrl(item)} className="text-blue-700 font-medium hover:underline">
                    {item.name}
                  </a>
                </td>
                <td className="px-3 py-3 text-gray-500 text-xs">{item.gost}</td>
                <td className="px-3 py-3 text-center">
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={item.quantity}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (v > 0) updateQuantity(item.id, item.category, v);
                    }}
                    className="w-20 text-center border border-gray-200 rounded px-2 py-1 text-sm focus:border-blue-400 focus:outline-none"
                  />
                </td>
                <td className="px-3 py-3 text-center text-gray-500">{item.unit}</td>
                <td className="px-3 py-3 text-right font-mono text-gray-600">{item.weightPerMeter.toFixed(2)} кг</td>
                <td className="px-3 py-3 text-right font-mono font-semibold">{formatWeight(calcItemWeight(item))}</td>
                <td className="px-3 py-3 text-center">
                  <button
                    onClick={() => removeFromCart(item.id, item.category)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                    title="Удалить"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-sm text-gray-500">Итого: <strong className="text-gray-900">{items.length} позиций</strong></div>
          <div className="text-2xl font-bold text-blue-900 font-mono">{formatWeight(totalKg)}</div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => exportPDF(items)}
            className="bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <polyline points="9 15 12 18 15 15" />
            </svg>
            Скачать PDF
          </button>

          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-amber-500 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-amber-600 transition-colors text-sm"
          >
            Отправить заявку
          </button>

          <button
            onClick={() => { if (confirm('Очистить всю смету?')) clearCart(); }}
            className="border border-gray-300 text-gray-500 px-4 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-sm"
          >
            Очистить
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mt-6 bg-surface border border-border rounded-xl p-5 max-w-md">
          <h3 className="font-bold mb-3">Отправить смету поставщику</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert('Заявка отправлена! (бэкенд будет подключён позже)');
              setShowForm(false);
            }}
          >
            <div className="space-y-3 mb-4">
              <input type="text" placeholder="Ваше имя" className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <input type="tel" placeholder="+7 (___) ___-__-__" required className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <input type="email" placeholder="Email (необязательно)" className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <button type="submit" className="w-full bg-accent text-white font-semibold py-3 rounded-lg hover:bg-accent-light transition-colors">
              Отправить заявку
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
