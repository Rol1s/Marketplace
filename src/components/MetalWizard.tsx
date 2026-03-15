import { useState, useMemo, useCallback } from 'react';
import { runWizard, type TaskType, type WizardInput, type ProfileResult } from '@/lib/wizard';
import { runBeamCalc, SCHEME_LABELS, type SupportScheme, type BeamCalcResult } from '@/lib/beam-calc';
import type { Beam, Channel, Pipe } from '@/lib/types';
import BeamSchemeSVG from './BeamSchemeSVG';
import EpureDiagram from './EpureDiagram';
import ProfileSketch from './ProfileSketch';

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
      <path d="M18 8 L22 6" /><path d="M18 12 L22 10" /><path d="M18 16 L22 14" />
    </svg>
  );
}

function IconFence() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="4" y2="28" /><line x1="16" y1="4" x2="16" y2="28" /><line x1="28" y1="6" x2="28" y2="28" />
      <line x1="4" y1="11" x2="28" y2="11" /><line x1="4" y1="18" x2="28" y2="18" />
      <line x1="2" y1="28" x2="30" y2="28" />
    </svg>
  );
}

function IconPipeline() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 16 L10 16" /><path d="M22 16 L30 16" />
      <circle cx="16" cy="16" r="6" /><circle cx="16" cy="16" r="3" strokeDasharray="2 1" />
      <path d="M10 12 L10 20" /><path d="M22 12 L22 20" />
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
  floor: IconBeam, column: IconColumn, fence: IconFence, pipeline: IconPipeline, piles: IconPiles,
};

const TASKS: { id: TaskType; label: string; desc: string }[] = [
  { id: 'floor', label: 'Перекрытие / балка', desc: 'Несущие балки, перекрытия, ригели — изгиб' },
  { id: 'column', label: 'Колонна / стойка', desc: 'Вертикальные стойки — устойчивость (Эйлер)' },
  { id: 'fence', label: 'Ограждение / каркас', desc: 'Лёгкие каркасы, навесы — изгиб' },
  { id: 'pipeline', label: 'Трубопровод', desc: 'Трубы под давление — формула Барлоу' },
  { id: 'piles', label: 'Сваи / фундамент', desc: 'Свайные фундаменты — устойчивость в грунте' },
];

const SCHEME_OPTIONS: { id: SupportScheme; label: string }[] = [
  { id: 'simple', label: 'Шарнир — шарнир' },
  { id: 'cantilever', label: 'Консоль' },
  { id: 'fixed-fixed', label: 'Заделка — заделка' },
  { id: 'fixed-pinned', label: 'Заделка — шарнир' },
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

// ─── Step-by-step calculation block ────────────────────────

function StepCalcBlock({ result, input, calcResult }: {
  result: ProfileResult;
  input: WizardInput;
  calcResult?: BeamCalcResult;
}) {
  const isBending = result.calcMode === 'bending';
  const isBuckling = result.calcMode === 'buckling';

  if (isBending && calcResult) {
    const span = input.spanM || 6;
    const gf = input.gammaF || 1.0;
    const loadKgM2 = (input.loadKgM2 || 400) * gf;
    const spacing = input.spacingM || 1;
    const qKgM = loadKgM2 * spacing + result.weight;
    const deflRatio = input.task === 'floor' ? 250 : 200;

    return (
      <div className="text-xs space-y-2 font-mono bg-gray-50 rounded-lg p-3">
        <div className="font-bold text-sm font-sans text-gray-700 mb-2">Пошаговый расчёт</div>
        <div><span className="text-gray-500">1. Погонная нагрузка:</span> q = {loadKgM2.toFixed(0)} × {spacing} + {result.weight.toFixed(1)} = <strong>{qKgM.toFixed(1)} кг/м</strong></div>
        <div><span className="text-gray-500">2. M_max =</span> {calcResult.Mmax.toFixed(2)} кН·м</div>
        <div><span className="text-gray-500">3. σ_max = M / Wx =</span> {calcResult.sigmaMax.toFixed(1)} МПа {calcResult.strengthOk ? '≤' : '>'} {calcResult.sigmaAllow} МПа — <strong className={calcResult.strengthOk ? 'text-green-700' : 'text-red-600'}>{calcResult.strengthOk ? 'проходит' : 'не проходит'}</strong></div>
        <div><span className="text-gray-500">4. f_max =</span> {calcResult.fmax.toFixed(2)} мм, f_lim = L/{deflRatio} = {calcResult.fLimit.toFixed(1)} мм — <strong className={calcResult.deflectionOk ? 'text-green-700' : 'text-red-600'}>{calcResult.deflectionOk ? 'проходит' : 'не проходит'}</strong></div>
        <div><span className="text-gray-500">5. Q_max =</span> {calcResult.Qmax.toFixed(2)} кН</div>
      </div>
    );
  }

  if (isBuckling) {
    const height = input.heightM || 3;
    const axialKN = input.axialForceKN || 100;
    const mu = input.task === 'piles' ? 2.0 : 1.0;
    const lambdaStr = result.slenderness ? result.slenderness.toFixed(0) : '—';

    return (
      <div className="text-xs space-y-2 font-mono bg-gray-50 rounded-lg p-3">
        <div className="font-bold text-sm font-sans text-gray-700 mb-2">Пошаговый расчёт</div>
        <div><span className="text-gray-500">1. Расчётная длина:</span> L_ef = μ × L = {mu} × {height} = <strong>{(mu * height).toFixed(1)} м</strong></div>
        <div><span className="text-gray-500">2. N_cr =</span> π²·E·I / L_ef² = <strong>{result.keyMetric.toFixed(1)} кН</strong></div>
        <div><span className="text-gray-500">3. Запас:</span> N_cr / N = {result.keyMetric.toFixed(1)} / {axialKN} = <strong>{result.safetyFactor.toFixed(2)}</strong></div>
        <div><span className="text-gray-500">4. Гибкость λ =</span> {lambdaStr} {result.slenderness && result.slenderness > 200
          ? <strong className="text-red-600">&gt; 200 — слишком гибкий!</strong>
          : <strong className="text-green-700">≤ 200 — OK</strong>
        }</div>
      </div>
    );
  }

  // Pressure
  return (
    <div className="text-xs space-y-2 font-mono bg-gray-50 rounded-lg p-3">
      <div className="font-bold text-sm font-sans text-gray-700 mb-2">Пошаговый расчёт</div>
      <div><span className="text-gray-500">1. P_max = 2·s·Ry / D =</span> <strong>{result.keyMetric.toFixed(2)} МПа</strong></div>
      <div><span className="text-gray-500">2. Запас:</span> P_max / P = {result.safetyFactor.toFixed(2)}</div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────

export default function MetalWizard({ beams, channels, pipes }: Props) {
  const [step, setStep] = useState(1);
  const [task, setTask] = useState<TaskType | null>(null);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  // Bending params
  const [spanM, setSpanM] = useState('6');
  const [loadKgM2, setLoadKgM2] = useState('400');
  const [spacingM, setSpacingM] = useState('1');
  const [scheme, setScheme] = useState<SupportScheme>('simple');
  const [gammaF, setGammaF] = useState('1.2');

  // Buckling params
  const [heightM, setHeightM] = useState('3');
  const [axialForceKN, setAxialForceKN] = useState('100');

  // Pressure params
  const [pressureMPa, setPressureMPa] = useState('1.0');

  const input: WizardInput = {
    task: task || 'floor',
    scheme,
    gammaF: parseFloat(gammaF) || 1.2,
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
  }, [task, step, spanM, loadKgM2, spacingM, pressureMPa, heightM, axialForceKN, scheme, gammaF]);

  const isBending = task === 'floor' || task === 'fence';
  const isBuckling = task === 'column' || task === 'piles';
  const isPressure = task === 'pipeline';

  const deflRatio = task === 'floor' ? 250 : 200;

  // Beam calc for expanded row
  const expandedCalcResult = useMemo<BeamCalcResult | undefined>(() => {
    if (!expandedSlug || !isBending) return undefined;
    const r = results.find((res) => res.slug === expandedSlug);
    if (!r || !r.dims.Ix || !r.dims.Wx) return undefined;

    const gf = parseFloat(gammaF) || 1.2;
    const loadKgM2Val = (parseFloat(loadKgM2) || 400) * gf;
    const spacingVal = parseFloat(spacingM) || 1;
    const qKgM = loadKgM2Val * spacingVal + r.weight;

    return runBeamCalc({
      scheme,
      spanM: parseFloat(spanM) || 6,
      qKgM,
      IxCm4: r.dims.Ix,
      WxCm3: r.dims.Wx,
      deflRatio,
    });
  }, [expandedSlug, results, scheme, spanM, loadKgM2, spacingM, gammaF, deflRatio, isBending]);

  // ─── PDF ────────────────────────────────────────────────

  const generateReport = useCallback(async () => {
    if (results.length === 0) return;
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

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

    // Task header
    doc.setFont(fn, 'bold');
    doc.setFontSize(11);
    doc.text(hasFont ? `Задача: ${taskLabel}` : `Task: ${taskLabel}`, 14, 34);

    doc.setFont(fn, 'normal');
    doc.setFontSize(10);
    let y = 42;

    if (isBending) {
      const schemeLabel = SCHEME_LABELS[scheme];
      doc.text(hasFont ? `Схема: ${schemeLabel}` : `Scheme: ${schemeLabel}`, 14, y); y += 6;
      doc.text(hasFont ? `Пролёт: ${spanM} м` : `Span: ${spanM} m`, 14, y); y += 6;
      doc.text(hasFont ? `Нагрузка: ${loadKgM2} кг/м² × γf=${gammaF}` : `Load: ${loadKgM2} kg/m2 × gf=${gammaF}`, 14, y); y += 6;
      doc.text(hasFont ? `Шаг: ${spacingM} м` : `Spacing: ${spacingM} m`, 14, y); y += 6;
      doc.text(hasFont ? `Предел прогиба: L/${deflRatio}` : `Deflection limit: L/${deflRatio}`, 14, y); y += 6;

      // Draw beam scheme in PDF
      const bx1 = 14;
      const bx2 = 120;
      const by = y + 12;
      doc.setDrawColor(0);
      doc.setLineWidth(0.8);
      doc.line(bx1, by, bx2, by);

      if (scheme === 'simple' || scheme === 'fixed-pinned') {
        // Left support
        if (scheme === 'fixed-pinned') {
          doc.setLineWidth(1);
          doc.line(bx1, by - 5, bx1, by + 5);
          for (let i = -4; i <= 4; i += 2) doc.line(bx1, by + i, bx1 - 3, by + i + 2);
        } else {
          doc.triangle(bx1, by, bx1 - 4, by + 7, bx1 + 4, by + 7, 'S');
        }
        // Right support — always pinned
        doc.triangle(bx2, by, bx2 - 4, by + 7, bx2 + 4, by + 7, 'S');
      } else if (scheme === 'cantilever') {
        doc.setLineWidth(1);
        doc.line(bx1, by - 5, bx1, by + 5);
        for (let i = -4; i <= 4; i += 2) doc.line(bx1, by + i, bx1 - 3, by + i + 2);
      } else {
        // fixed-fixed
        doc.setLineWidth(1);
        doc.line(bx1, by - 5, bx1, by + 5);
        for (let i = -4; i <= 4; i += 2) doc.line(bx1, by + i, bx1 - 3, by + i + 2);
        doc.line(bx2, by - 5, bx2, by + 5);
        for (let i = -4; i <= 4; i += 2) doc.line(bx2, by + i, bx2 + 3, by + i + 2);
      }

      // Load arrows
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(0.3);
      const arrN = 6;
      const arrStep = (bx2 - bx1) / arrN;
      doc.line(bx1, by - 10, bx2, by - 10);
      for (let i = 0; i <= arrN; i++) {
        const ax = bx1 + i * arrStep;
        doc.line(ax, by - 10, ax, by - 2);
      }
      doc.setFont(fn, 'bold');
      doc.setFontSize(7);
      doc.setTextColor(37, 99, 235);
      doc.text(`q = ${loadKgM2}×${spacingM} кг/м`, (bx1 + bx2) / 2, by - 12, { align: 'center' });
      doc.text(`L = ${spanM} м`, (bx1 + bx2) / 2, by + 14, { align: 'center' });

      doc.setTextColor(0);
      doc.setDrawColor(0);
      y = by + 22;
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

    // Cross-section sketch for the first profile
    const first = results[0];
    if (first) {
      const sketchX = 140;
      const sketchY = 34;
      doc.setFont(fn, 'normal');
      doc.setFontSize(8);
      doc.text(first.profile, sketchX, sketchY);

      if (first.category === 'dvutavry' && first.dims.h && first.dims.b) {
        const sx = sketchX + 10;
        const sy = sketchY + 10;
        const scale = 0.15;
        const hh = (first.dims.h * scale) / 2;
        const bb = (first.dims.b * scale) / 2;
        doc.setLineWidth(0.5);
        doc.rect(sx - bb, sy - hh, bb * 2, first.dims.t! * scale);
        doc.rect(sx - bb, sy + hh - first.dims.t! * scale, bb * 2, first.dims.t! * scale);
        doc.rect(sx - first.dims.s! * scale / 2, sy - hh + first.dims.t! * scale, first.dims.s! * scale, hh * 2 - first.dims.t! * scale * 2);
        doc.setFontSize(6);
        doc.text(`h=${first.dims.h}, b=${first.dims.b}`, sx, sy + hh + 6, { align: 'center' });
      } else if (first.category === 'truby' && first.dims.diameter) {
        const sx = sketchX + 10;
        const sy = sketchY + 14;
        doc.setLineWidth(0.5);
        doc.circle(sx, sy, 8, 'S');
        doc.circle(sx, sy, 5, 'S');
        doc.setFontSize(6);
        doc.text(`D=${first.dims.diameter}, s=${first.dims.wall}`, sx, sy + 14, { align: 'center' });
      }
    }

    // Results table
    const head = isBending
      ? [['#', hasFont ? 'Профиль' : 'Profile', 'кг/м', 'Wx', hasFont ? 'Запас' : 'SF', hasFont ? 'Прогиб' : 'Defl.', hasFont ? 'Статус' : 'Status']]
      : isBuckling
        ? [['#', hasFont ? 'Профиль' : 'Profile', 'кг/м', 'N_cr', 'λ', hasFont ? 'Запас' : 'SF', hasFont ? 'Статус' : 'Status']]
        : [['#', hasFont ? 'Профиль' : 'Profile', 'кг/м', 'P_max', hasFont ? 'Запас' : 'SF', hasFont ? 'Статус' : 'Status']];

    const body = results.slice(0, 15).map((r, i) => {
      const statusText = r.status === 'ok' ? (hasFont ? 'Подходит' : 'OK')
        : r.status === 'excess' ? (hasFont ? 'С запасом' : 'Excess')
        : (hasFont ? 'Не проходит' : 'Fail');
      const base = [String(i + 1), r.profile, r.weight.toFixed(2)];
      if (isBending) {
        return [...base, r.keyMetric.toFixed(1), `${r.safetyFactor.toFixed(2)}x`, `${r.deflectionMm.toFixed(1)}/${r.deflectionLimitMm.toFixed(0)}`, statusText];
      }
      if (isBuckling) {
        return [...base, r.keyMetric.toFixed(1), r.slenderness ? r.slenderness.toFixed(0) : '—', `${r.safetyFactor.toFixed(2)}x`, statusText];
      }
      return [...base, r.keyMetric.toFixed(1), `${r.safetyFactor.toFixed(2)}x`, statusText];
    });

    autoTable(doc, {
      startY: y,
      head,
      body,
      theme: 'grid',
      headStyles: { fillColor: [30, 64, 100], fontSize: 8, font: fn },
      styles: { fontSize: 7, cellPadding: 2, font: fn },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 8;

    // Formulas block for bending
    if (isBending && first) {
      doc.setFont(fn, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80);
      const schemeLabel = SCHEME_LABELS[scheme];
      const formulaLines = [
        `Схема: ${schemeLabel} | Ry = 210 МПа | E = 2,06×10⁵ МПа`,
        `σ = M_max / Wx ≤ Ry | f = f_max ≤ L/${deflRatio}`,
      ];
      formulaLines.forEach((line, i) => {
        doc.text(hasFont ? line : line, 14, finalY + i * 5);
      });
      doc.setTextColor(0);
    }

    // Disclaimer
    const discY = isBending ? finalY + 14 : finalY + 4;
    doc.setFont(fn, 'normal');
    doc.setFontSize(7);
    doc.setTextColor(130);
    const disc = hasFont
      ? 'Расчёт выполнен по упрощённой методике. Для ответственных конструкций — проверка по СП 16.13330.'
      : 'Simplified calculation. Verify per SP 16.13330 for critical structures.';
    doc.text(disc, 14, discY, { maxWidth: 180 });

    doc.save(`raschet-nikamet-${now.replace(/\./g, '-')}.pdf`);
  }, [results, task, spanM, loadKgM2, spacingM, pressureMPa, heightM, axialForceKN, scheme, gammaF, deflRatio, isBending, isBuckling]);

  // ─── Render ─────────────────────────────────────────────

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

      {/* Step 2: Parameters */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              {task && (() => { const Icon = TASK_ICONS[task]; return <span className="text-primary"><Icon /></span>; })()}
              {TASKS.find(t => t.id === task)?.label}
            </h3>

            {isBending && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm font-medium text-text-muted">Схема опирания</span>
                    <select
                      value={scheme}
                      onChange={(e) => setScheme(e.target.value as SupportScheme)}
                      className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none bg-white"
                    >
                      {SCHEME_OPTIONS.map((o) => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                      ))}
                    </select>
                  </label>
                  <InputField
                    label="Коэфф. надёжности γf"
                    hint="СП 20.13330"
                    value={gammaF} onChange={setGammaF} min="1.0" max="1.5" step="0.05"
                  />
                </div>
              </>
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
            <button onClick={() => { setExpandedSlug(null); setStep(3); }} className="bg-primary text-white font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-primary/90 transition-colors">
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
                  <strong>{SCHEME_LABELS[scheme]}</strong>
                  <span className="text-blue-500 mx-2">·</span>
                  Пролёт <strong>{spanM} м</strong>, нагрузка <strong>{loadKgM2} кг/м²</strong> × γf={gammaF}, шаг <strong>{spacingM} м</strong>
                  <span className="text-blue-500 mx-2">·</span>
                  <span className="text-xs">прогиб ≤ L/{deflRatio}</span>
                </>
              )}
              {isBuckling && (
                <>
                  {task === 'piles' ? 'Свободная длина' : 'Высота'} <strong>{heightM} м</strong>,
                  осевая сила <strong>{axialForceKN} кН</strong>
                  {task === 'piles' && <span className="text-xs ml-2">(μ = 2.0)</span>}
                  <span className="text-blue-500 mx-2">·</span>
                  <span className="text-xs">устойчивость по Эйлеру + гибкость λ ≤ 200</span>
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
                    {isBuckling && <th className="text-center px-3 py-2 text-xs uppercase text-gray-500">λ</th>}
                    <th className="text-center px-3 py-2 text-xs uppercase text-gray-500">Статус</th>
                    <th className="px-2 py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => {
                    const isExpanded = expandedSlug === r.slug;
                    const lambdaBad = r.slenderness && r.slenderness > 200;
                    return (
                      <>
                        <tr
                          key={`${r.category}-${r.slug}`}
                          onClick={() => setExpandedSlug(isExpanded ? null : r.slug)}
                          className={`border-b border-gray-100 hover:bg-blue-50/30 cursor-pointer transition-colors ${
                            isBending && !r.deflectionOk ? 'bg-red-50/40' : ''
                          } ${lambdaBad ? 'bg-red-50/40' : ''} ${isExpanded ? 'bg-blue-50/50' : ''}`}
                        >
                          <td className="px-3 py-2">
                            <a href={r.url} onClick={(e) => e.stopPropagation()} className="text-blue-700 font-medium hover:underline">{r.profile}</a>
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
                          {isBuckling && (
                            <td className="px-3 py-2 text-center">
                              <span className={`font-mono text-xs ${lambdaBad ? 'text-red-600 font-bold' : 'text-green-700'}`}>
                                {r.slenderness?.toFixed(0) || '—'}
                              </span>
                            </td>
                          )}
                          <td className="px-3 py-2 text-center">{statusBadge(r.status)}</td>
                          <td className="px-2 py-2 text-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform inline-block ${isExpanded ? 'rotate-180' : ''}`}>
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${r.category}-${r.slug}-detail`}>
                            <td colSpan={isBending ? 8 : isBuckling ? 8 : 7} className="p-0">
                              <div className="bg-gray-50/80 border-t border-b border-blue-200 p-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {/* Column 1: Scheme SVG + Epure (bending only) */}
                                  <div className="space-y-3">
                                    {isBending && (
                                      <>
                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Схема нагружения</div>
                                        <BeamSchemeSVG scheme={scheme} spanM={parseFloat(spanM) || 6} qLabel={`q = ${loadKgM2}×${spacingM} кг/м`} />
                                        {expandedCalcResult && (
                                          <>
                                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-2">Эпюры M, Q, f</div>
                                            <EpureDiagram diagram={expandedCalcResult.diagram} spanM={parseFloat(spanM) || 6} />
                                          </>
                                        )}
                                      </>
                                    )}
                                    {!isBending && (
                                      <div className="text-xs text-gray-400 italic">Диаграммы — только для изгиба</div>
                                    )}
                                  </div>

                                  {/* Column 2: Cross-section */}
                                  <div className="flex flex-col items-center">
                                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Сечение</div>
                                    <ProfileSketch
                                      category={r.category}
                                      h={r.dims.h}
                                      b={r.dims.b}
                                      s={r.dims.s}
                                      t={r.dims.t}
                                      diameter={r.dims.diameter}
                                      wall={r.dims.wall}
                                    />
                                    <div className="text-xs text-gray-500 mt-1">{r.profile}</div>
                                  </div>

                                  {/* Column 3: Step-by-step calc */}
                                  <div>
                                    <StepCalcBlock
                                      result={r}
                                      input={input}
                                      calcResult={isBending ? expandedCalcResult : undefined}
                                    />
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            {isBending && `Расчёт по прочности (σ ≤ Ry) и прогибу (f ≤ L/${deflRatio}). Схема: ${SCHEME_LABELS[scheme]}. Ry = 210 МПа (Ст3), E = 2,06×10⁵ МПа. γf = ${gammaF}.`}
            {isBuckling && `Расчёт устойчивости по Эйлеру: N_cr = π²EI/(μL)². E = 2,06×10⁵ МПа${task === 'piles' ? ', μ = 2.0 (консоль)' : ', μ = 1.0'}. Проверка гибкости λ ≤ 200 по СП 16.13330.`}
            {isPressure && 'Формула Барлоу: P = 2·s·[σ]/D. Ry = 210 МПа (Ст3).'}
            {' '}Для ответственных конструкций — проверка по СП 16.13330.
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button onClick={() => { setStep(1); setExpandedSlug(null); }} className="border border-border px-5 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors">
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
