import { useState, useMemo, useCallback } from 'react';
import { runWizard, type TaskType, type WizardInput, type ProfileResult } from '@/lib/wizard';
import type { Beam, Channel, Pipe } from '@/lib/types';

interface Props {
  beams: Beam[];
  channels: Channel[];
  pipes: Pipe[];
}

// ─── SVG Icons ─────────────────────────────────────────────

function IconBeam() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="13" width="28" height="6" rx="1" />
      <line x1="4" y1="22" x2="4" y2="28" />
      <line x1="28" y1="22" x2="28" y2="28" />
      <line x1="2" y1="28" x2="8" y2="28" />
      <line x1="26" y1="28" x2="30" y2="28" />
      <path d="M10 13 L16 6 L22 13" strokeDasharray="2 2" />
    </svg>
  );
}

function IconColumn() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="12" y="4" width="8" height="24" rx="1" />
      <line x1="8" y1="4" x2="24" y2="4" />
      <line x1="8" y1="28" x2="24" y2="28" />
      <path d="M16 8 L16 24" strokeDasharray="3 2" />
      <path d="M18 8 L22 6" />
      <path d="M18 12 L22 10" />
      <path d="M18 16 L22 14" />
    </svg>
  );
}

function IconFence() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="4" y2="28" />
      <line x1="16" y1="4" x2="16" y2="28" />
      <line x1="28" y1="6" x2="28" y2="28" />
      <line x1="4" y1="11" x2="28" y2="11" />
      <line x1="4" y1="18" x2="28" y2="18" />
      <line x1="2" y1="28" x2="30" y2="28" />
    </svg>
  );
}

function IconPipeline() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 16 L10 16" />
      <path d="M22 16 L30 16" />
      <circle cx="16" cy="16" r="6" />
      <circle cx="16" cy="16" r="3" strokeDasharray="2 1" />
      <path d="M10 12 L10 20" />
      <path d="M22 12 L22 20" />
    </svg>
  );
}

function IconPiles() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="12" x2="30" y2="12" />
      <rect x="6" y="12" width="4" height="18" rx="0.5" />
      <rect x="14" y="12" width="4" height="18" rx="0.5" />
      <rect x="22" y="12" width="4" height="18" rx="0.5" />
      <rect x="4" y="6" width="24" height="6" rx="1" />
      <path d="M12 4 L16 2 L20 4" />
    </svg>
  );
}

const TASK_ICONS: Record<TaskType, () => JSX.Element> = {
  floor: IconBeam,
  column: IconColumn,
  fence: IconFence,
  pipeline: IconPipeline,
  piles: IconPiles,
};

const TASKS: { id: TaskType; label: string; desc: string }[] = [
  { id: 'floor', label: 'Перекрытие / балка', desc: 'Несущие балки, перекрытия, ригели — изгиб' },
  { id: 'column', label: 'Колонна / стойка', desc: 'Вертикальные стойки — устойчивость (Эйлер)' },
  { id: 'fence', label: 'Ограждение / каркас', desc: 'Лёгкие каркасы, навесы — изгиб' },
  { id: 'pipeline', label: 'Трубопровод', desc: 'Трубы под давление — формула Барлоу' },
  { id: 'piles', label: 'Сваи / фундамент', desc: 'Свайные фундаменты — устойчивость в грунте' },
];

function statusBadge(status: string) {
  if (status === 'ok') return <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded">Подходит</span>;
  if (status === 'excess') return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded">С запасом</span>;
  return <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-0.5 rounded">Не проходит</span>;
}

function InputField({ label, hint, value, onChange, min, max, step }: {
  label: string; hint?: string; value: string; onChange: (v: string) => void;
  min?: string; max?: string; step?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-text-muted">{label}</span>
      {hint && <span className="text-xs text-gray-400 ml-1">({hint})</span>}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min} max={max} step={step}
        className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
    </label>
  );
}

export default function MetalWizard({ beams, channels, pipes }: Props) {
  const [step, setStep] = useState(1);
  const [task, setTask] = useState<TaskType | null>(null);

  const [spanM, setSpanM] = useState('6');
  const [loadKgM2, setLoadKgM2] = useState('400');
  const [spacingM, setSpacingM] = useState('1');
  const [pressureMPa, setPressureMPa] = useState('1.0');
  const [heightM, setHeightM] = useState('3');
  const [axialForceKN, setAxialForceKN] = useState('100');

  const input: WizardInput = {
    task: task || 'floor',
    spanM: parseFloat(spanM) || 6,
    loadKgM2: parseFloat(loadKgM2) || 400,
    spacingM: parseFloat(spacingM) || 1,
    pressureMPa: parseFloat(pressureMPa) || 1,
    heightM: parseFloat(heightM) || 3,
    axialForceKN: parseFloat(axialForceKN) || 100,
  };

  const results = useMemo<ProfileResult[]>(() => {
    if (!task || step < 3) return [];
    return runWizard(beams, channels, pipes, input);
  }, [task, step, spanM, loadKgM2, spacingM, pressureMPa, heightM, axialForceKN]);

  const isBending = task === 'floor' || task === 'fence';
  const isBuckling = task === 'column' || task === 'piles';
  const isPressure = task === 'pipeline';

  const deflRatioLabel = task === 'floor' ? '250' : '200';

  const generateReport = useCallback(async () => {
    if (results.length === 0) return;
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    const doc = new jsPDF();
    let hasFont = false;
    try {
      const [regular, bold] = await Promise.all([
        fetch('https://cdn.jsdelivr.net/gh/nicholasgasior/gfonts-base64/fonts/pt-sans/pt-sans-400.ttf.base64.txt').then(r => r.text()),
        fetch('https://cdn.jsdelivr.net/gh/nicholasgasior/gfonts-base64/fonts/pt-sans/pt-sans-700.ttf.base64.txt').then(r => r.text()),
      ]);
      doc.addFileToVFS('PTSans-Regular.ttf', regular);
      doc.addFont('PTSans-Regular.ttf', 'PTSans', 'normal');
      doc.addFileToVFS('PTSans-Bold.ttf', bold);
      doc.addFont('PTSans-Bold.ttf', 'PTSans', 'bold');
      hasFont = true;
    } catch { /* fallback */ }

    const fn = hasFont ? 'PTSans' : 'helvetica';
    const now = new Date().toLocaleDateString('ru-RU');
    const taskLabel = TASKS.find(t => t.id === task)?.label || '';

    doc.setFont(fn, 'bold');
    doc.setFontSize(14);
    doc.text(hasFont ? 'Расчёт подбора металлопроката' : 'Metal Selection Report', 105, 16, { align: 'center' });

    doc.setFont(fn, 'normal');
    doc.setFontSize(9);
    doc.text(`nikamet.pro | ${now}`, 105, 22, { align: 'center' });

    doc.setFont(fn, 'bold');
    doc.setFontSize(11);
    doc.text(hasFont ? `Задача: ${taskLabel}` : `Task: ${taskLabel}`, 14, 34);

    doc.setFont(fn, 'normal');
    doc.setFontSize(10);
    let y = 42;
    if (isBending) {
      doc.text(hasFont ? `Пролёт: ${spanM} м` : `Span: ${spanM} m`, 14, y); y += 6;
      doc.text(hasFont ? `Нагрузка: ${loadKgM2} кг/м²` : `Load: ${loadKgM2} kg/m2`, 14, y); y += 6;
      doc.text(hasFont ? `Шаг: ${spacingM} м` : `Spacing: ${spacingM} m`, 14, y); y += 6;
      doc.text(hasFont ? `Предел прогиба: L/${deflRatioLabel}` : `Deflection limit: L/${deflRatioLabel}`, 14, y); y += 6;
    } else if (isBuckling) {
      doc.text(hasFont ? `Высота: ${heightM} м` : `Height: ${heightM} m`, 14, y); y += 6;
      doc.text(hasFont ? `Осевая сила: ${axialForceKN} кН` : `Axial force: ${axialForceKN} kN`, 14, y); y += 6;
      if (task === 'piles') {
        doc.text(hasFont ? 'Коэфф. длины μ = 2.0 (консоль в грунте)' : 'Length factor: 2.0', 14, y); y += 6;
      }
    } else {
      doc.text(hasFont ? `Давление: ${pressureMPa} МПа` : `Pressure: ${pressureMPa} MPa`, 14, y); y += 6;
    }

    y += 4;
    const head = isBending
      ? [['#', hasFont ? 'Профиль' : 'Profile', hasFont ? 'Масса, кг/м' : 'kg/m', 'Wx', hasFont ? 'Запас' : 'SF', hasFont ? 'Прогиб, мм' : 'Defl.', hasFont ? 'Статус' : 'Status']]
      : isBuckling
        ? [['#', hasFont ? 'Профиль' : 'Profile', hasFont ? 'Масса, кг/м' : 'kg/m', 'N_cr, kN', hasFont ? 'Запас' : 'SF', hasFont ? 'Статус' : 'Status']]
        : [['#', hasFont ? 'Профиль' : 'Profile', hasFont ? 'Масса, кг/м' : 'kg/m', 'P_max, MPa', hasFont ? 'Запас' : 'SF', hasFont ? 'Статус' : 'Status']];

    const body = results.slice(0, 15).map((r, i) => {
      const statusText = r.status === 'ok' ? (hasFont ? 'Подходит' : 'OK')
        : r.status === 'excess' ? (hasFont ? 'С запасом' : 'Excess')
        : (hasFont ? 'Не проходит' : 'Fail');
      const base = [String(i + 1), r.profile, r.weight.toFixed(2)];
      if (isBending) {
        return [...base, r.keyMetric.toFixed(1), `${r.safetyFactor.toFixed(2)}x`, `${r.deflectionMm.toFixed(1)}/${r.deflectionLimitMm.toFixed(0)}`, statusText];
      }
      return [...base, r.keyMetric.toFixed(1), `${r.safetyFactor.toFixed(2)}x`, statusText];
    });

    (doc as any).autoTable({
      startY: y,
      head,
      body,
      theme: 'grid',
      headStyles: { fillColor: [30, 64, 100], fontSize: 8, font: fn },
      styles: { fontSize: 7, cellPadding: 2, font: fn },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont(fn, 'normal');
    doc.setFontSize(7);
    doc.setTextColor(130);
    const disc = hasFont
      ? 'Расчёт выполнен по упрощённой методике. Ry=210 МПа (Ст3), E=2.06×10⁵ МПа. Для ответственных конструкций — проверка по СП 16.13330.'
      : 'Simplified calculation. Ry=210 MPa, E=2.06e5 MPa. Verify per SP 16.13330 for critical structures.';
    doc.text(disc, 14, finalY, { maxWidth: 180 });

    doc.save(`raschet-nikamet-${now.replace(/\./g, '-')}.pdf`);
  }, [results, task, spanM, loadKgM2, spacingM, pressureMPa, heightM, axialForceKN, deflRatioLabel, isBending, isBuckling]);

  return (
    <div>
      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => s < step && setStep(s)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                s === step ? 'bg-primary text-white' : s < step ? 'bg-primary/20 text-primary cursor-pointer' : 'bg-gray-100 text-gray-400'
              }`}
            >{s}</button>
            {s < 3 && <div className={`w-8 h-0.5 ${s < step ? 'bg-primary' : 'bg-gray-200'}`} />}
          </div>
        ))}
        <span className="ml-2 text-sm text-text-muted">
          {step === 1 && 'Выберите задачу'}
          {step === 2 && 'Укажите параметры'}
          {step === 3 && 'Результаты подбора'}
        </span>
      </div>

      {/* Step 1: Task selection */}
      {step === 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TASKS.map((t) => {
            const Icon = TASK_ICONS[t.id];
            return (
              <button
                key={t.id}
                onClick={() => { setTask(t.id); setStep(2); }}
                className={`text-left p-4 rounded-xl border-2 transition-all hover:shadow-md group ${
                  task === t.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-primary/70 group-hover:text-primary transition-colors mb-2">
                  <Icon />
                </div>
                <div className="font-bold text-sm">{t.label}</div>
                <div className="text-xs text-text-muted mt-1">{t.desc}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Step 2: Parameters (task-specific) */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              {task && (() => { const Icon = TASK_ICONS[task]; return <span className="text-primary"><Icon /></span>; })()}
              {TASKS.find(t => t.id === task)?.label}
            </h3>

            {isBending && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InputField label="Пролёт, м" value={spanM} onChange={setSpanM} min="1" max="24" step="0.5" />
                <InputField
                  label={task === 'fence' ? 'Ветровая нагрузка, кг/м²' : 'Нагрузка, кг/м²'}
                  hint={task === 'fence' ? '40–120' : '200–800'}
                  value={loadKgM2} onChange={setLoadKgM2} min="20" max="5000" step="10"
                />
                <InputField
                  label={task === 'fence' ? 'Шаг стоек, м' : 'Шаг балок, м'}
                  value={spacingM} onChange={setSpacingM} min="0.3" max="6" step="0.1"
                />
              </div>
            )}

            {isBuckling && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label={task === 'piles' ? 'Свободная длина сваи, м' : 'Высота колонны, м'}
                  hint={task === 'piles' ? 'от грунта до ростверка' : 'между опорами'}
                  value={heightM} onChange={setHeightM} min="1" max="30" step="0.5"
                />
                <InputField
                  label="Осевая сжимающая сила, кН"
                  hint="1 тонна ≈ 10 кН"
                  value={axialForceKN} onChange={setAxialForceKN} min="10" max="10000" step="10"
                />
              </div>
            )}

            {isPressure && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="Рабочее давление, МПа"
                  hint="1 атм ≈ 0.1 МПа"
                  value={pressureMPa} onChange={setPressureMPa} min="0.1" max="50" step="0.1"
                />
              </div>
            )}

            {isBuckling && task === 'piles' && (
              <p className="text-xs text-text-muted mt-3">
                Для свай в грунте коэффициент расчётной длины μ = 2.0 (консольная схема).
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="border border-border px-5 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors">
              ← Назад
            </button>
            <button onClick={() => setStep(3)} className="bg-primary text-white font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-primary/90 transition-colors">
              Подобрать профиль →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Input summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="text-sm text-blue-800">
              {isBending && (
                <>
                  Пролёт <strong>{spanM} м</strong>, нагрузка <strong>{loadKgM2} кг/м²</strong>, шаг <strong>{spacingM} м</strong>
                  <span className="text-blue-500 mx-2">·</span>
                  <span className="text-xs">прогиб ≤ L/{deflRatioLabel}</span>
                </>
              )}
              {isBuckling && (
                <>
                  {task === 'piles' ? 'Свободная длина' : 'Высота'} <strong>{heightM} м</strong>,
                  осевая сила <strong>{axialForceKN} кН</strong>
                  {task === 'piles' && <span className="text-xs ml-2">(μ = 2.0)</span>}
                  <span className="text-blue-500 mx-2">·</span>
                  <span className="text-xs">устойчивость по Эйлеру</span>
                </>
              )}
              {isPressure && (
                <>Давление <strong>{pressureMPa} МПа</strong></>
              )}
              <button onClick={() => setStep(2)} className="ml-3 text-blue-600 underline text-xs">изменить</button>
            </div>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-10 text-text-muted">
              <p className="text-lg font-bold">Подходящих профилей не найдено</p>
              <p className="text-sm mt-1">Попробуйте изменить параметры</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="text-left px-3 py-2 text-xs uppercase text-gray-500">Профиль</th>
                    <th className="text-right px-3 py-2 text-xs uppercase text-gray-500">
                      {results[0]?.keyMetricLabel || '—'}
                    </th>
                    <th className="text-right px-3 py-2 text-xs uppercase text-gray-500">Масса, кг/м</th>
                    <th className="text-center px-3 py-2 text-xs uppercase text-gray-500">Запас</th>
                    {isBending && <th className="text-center px-3 py-2 text-xs uppercase text-gray-500">Прогиб</th>}
                    <th className="text-center px-3 py-2 text-xs uppercase text-gray-500">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr
                      key={`${r.category}-${r.slug}`}
                      className={`border-b border-gray-100 hover:bg-blue-50/30 ${isBending && !r.deflectionOk ? 'bg-red-50/40' : ''}`}
                    >
                      <td className="px-3 py-2">
                        <a href={r.url} className="text-blue-700 font-medium hover:underline">{r.profile}</a>
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{r.keyMetric.toFixed(1)}</td>
                      <td className="px-3 py-2 text-right font-mono">{r.weight.toFixed(2)}</td>
                      <td className="px-3 py-2 text-center font-mono font-bold">{r.safetyFactor.toFixed(2)}x</td>
                      {isBending && (
                        <td className="px-3 py-2 text-center">
                          <span className={`font-mono text-xs ${r.deflectionOk ? 'text-green-700' : 'text-red-600 font-bold'}`}>
                            {r.deflectionMm.toFixed(1)}
                          </span>
                          <span className="text-gray-400 text-xs mx-0.5">/</span>
                          <span className="text-gray-500 text-xs">{r.deflectionLimitMm.toFixed(0)}</span>
                        </td>
                      )}
                      <td className="px-3 py-2 text-center">{statusBadge(r.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            {isBending && `Расчёт по прочности (σ ≤ Ry) и прогибу (f ≤ L/${deflRatioLabel}). Ry = 210 МПа (Ст3), E = 2,06×10⁵ МПа.`}
            {isBuckling && `Расчёт устойчивости по Эйлеру: N_cr = π²EI/(μL)². E = 2,06×10⁵ МПа${task === 'piles' ? ', μ = 2.0 (консоль)' : ', μ = 1.0'}.`}
            {isPressure && 'Формула Барлоу: P = 2·s·[σ]/D. Ry = 210 МПа (Ст3).'}
            {' '}Для ответственных конструкций — проверка по СП 16.13330.
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setStep(1)} className="border border-border px-5 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors">
              ← Новый подбор
            </button>
            {results.length > 0 && (
              <button
                onClick={generateReport}
                className="border border-primary text-primary px-5 py-2.5 rounded-lg text-sm hover:bg-primary/5 transition-colors font-medium flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                Скачать расчёт PDF
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
