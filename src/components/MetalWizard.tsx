import { useState, useMemo } from 'react';
import { selectBeams, selectChannels, selectPipes, type TaskType, type WizardInput, type ProfileResult } from '@/lib/wizard';
import type { Beam, Channel, Pipe } from '@/lib/types';

interface Props {
  beams: Beam[];
  channels: Channel[];
  pipes: Pipe[];
}

const TASKS: { id: TaskType; label: string; icon: string; desc: string }[] = [
  { id: 'floor', label: 'Перекрытие / балка', icon: '🏗️', desc: 'Несущие балки, перекрытия, ригели' },
  { id: 'column', label: 'Колонна / стойка', icon: '🏢', desc: 'Вертикальные стойки и колонны' },
  { id: 'fence', label: 'Ограждение / каркас', icon: '🏠', desc: 'Лёгкие каркасы, ограждения, навесы' },
  { id: 'pipeline', label: 'Трубопровод', icon: '🔧', desc: 'Трубы под давление, теплосети' },
  { id: 'piles', label: 'Сваи / фундамент', icon: '⚙️', desc: 'Свайные фундаменты, опоры' },
];

function statusBadge(status: string) {
  if (status === 'ok') return <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded">Подходит</span>;
  if (status === 'excess') return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded">С запасом</span>;
  return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded">На пределе</span>;
}

export default function MetalWizard({ beams, channels, pipes }: Props) {
  const [step, setStep] = useState(1);
  const [task, setTask] = useState<TaskType | null>(null);
  const [spanM, setSpanM] = useState('6');
  const [loadKgM2, setLoadKgM2] = useState('400');
  const [spacingM, setSpacingM] = useState('1');
  const [pressureMPa, setPressureMPa] = useState('1.0');

  const input: WizardInput = {
    task: task || 'floor',
    spanM: parseFloat(spanM) || 6,
    loadKgM2: parseFloat(loadKgM2) || 400,
    spacingM: parseFloat(spacingM) || 1,
    pressureMPa: parseFloat(pressureMPa) || 1,
  };

  const results = useMemo<ProfileResult[]>(() => {
    if (!task || step < 3) return [];
    if (task === 'pipeline') return selectPipes(pipes, input).slice(0, 15);
    const beamResults = selectBeams(beams, input);
    const channelResults = selectChannels(channels, input);
    if (task === 'floor' || task === 'column') return [...beamResults, ...channelResults].sort((a, b) => a.weight - b.weight).slice(0, 20);
    return channelResults.slice(0, 15);
  }, [task, step, spanM, loadKgM2, spacingM, pressureMPa]);

  const isPipeline = task === 'pipeline';

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
          {TASKS.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTask(t.id); setStep(2); }}
              className={`text-left p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                task === t.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="text-2xl mb-2">{t.icon}</div>
              <div className="font-bold text-sm">{t.label}</div>
              <div className="text-xs text-text-muted mt-1">{t.desc}</div>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Parameters */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="font-bold mb-4">
              {isPipeline ? 'Параметры трубопровода' : 'Параметры конструкции'}
            </h3>

            {!isPipeline ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label>
                  <span className="text-sm text-text-muted">Пролёт, м</span>
                  <input type="number" value={spanM} onChange={(e) => setSpanM(e.target.value)}
                    min="1" max="24" step="0.5"
                    className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                </label>
                <label>
                  <span className="text-sm text-text-muted">Нагрузка, кг/м²</span>
                  <input type="number" value={loadKgM2} onChange={(e) => setLoadKgM2(e.target.value)}
                    min="50" max="5000" step="50"
                    className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                </label>
                <label>
                  <span className="text-sm text-text-muted">Шаг балок, м</span>
                  <input type="number" value={spacingM} onChange={(e) => setSpacingM(e.target.value)}
                    min="0.3" max="6" step="0.1"
                    className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                </label>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label>
                  <span className="text-sm text-text-muted">Рабочее давление, МПа</span>
                  <input type="number" value={pressureMPa} onChange={(e) => setPressureMPa(e.target.value)}
                    min="0.1" max="50" step="0.1"
                    className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                </label>
              </div>
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
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="text-sm text-blue-800">
              {!isPipeline ? (
                <>Пролёт <strong>{spanM} м</strong>, нагрузка <strong>{loadKgM2} кг/м²</strong>, шаг <strong>{spacingM} м</strong></>
              ) : (
                <>Давление <strong>{pressureMPa} МПа</strong></>
              )}
              <button onClick={() => setStep(2)} className="ml-3 text-blue-600 underline text-xs">изменить</button>
            </div>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-10 text-text-muted">
              <p className="text-lg font-bold">Подходящих профилей не найдено</p>
              <p className="text-sm mt-1">Попробуйте уменьшить нагрузку или пролёт</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="text-left px-3 py-2 text-xs uppercase text-gray-500">Профиль</th>
                    {!isPipeline && <th className="text-right px-3 py-2 text-xs uppercase text-gray-500">Wx, см³</th>}
                    <th className="text-right px-3 py-2 text-xs uppercase text-gray-500">Масса, кг/м</th>
                    <th className="text-center px-3 py-2 text-xs uppercase text-gray-500">Запас</th>
                    <th className="text-center px-3 py-2 text-xs uppercase text-gray-500">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={`${r.category}-${r.slug}`} className="border-b border-gray-100 hover:bg-blue-50/30">
                      <td className="px-3 py-2">
                        <a href={r.url} className="text-blue-700 font-medium hover:underline">{r.profile}</a>
                      </td>
                      {!isPipeline && <td className="px-3 py-2 text-right font-mono">{r.Wx.toFixed(1)}</td>}
                      <td className="px-3 py-2 text-right font-mono">{r.weight.toFixed(2)}</td>
                      <td className="px-3 py-2 text-center font-mono font-bold">{r.safetyFactor.toFixed(2)}x</td>
                      <td className="px-3 py-2 text-center">{statusBadge(r.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            Расчёт выполнен по упрощённой методике для однопролётных балок с равномерной нагрузкой.
            Расчётное сопротивление Ry = 210 МПа (Ст3). Для ответственных конструкций обязательна проверка по СП 16.13330.
          </div>

          <button onClick={() => setStep(1)} className="border border-border px-5 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            ← Новый подбор
          </button>
        </div>
      )}
    </div>
  );
}
