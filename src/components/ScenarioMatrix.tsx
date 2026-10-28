import React from 'react';
import {
  SlidersHorizontal,
  ArrowRight,
  Sparkles,
  Check,
  TrendingDown,
} from 'lucide-react';
import { LoanParameters, ScenarioImpact } from '../types/loan';
import {
  calculateScenarioMatrix,
  formatCurrency,
} from '../utils/loanCalculations';

interface ScenarioMatrixProps {
  params: LoanParameters;
  currentExtra: number;
  onSelectExtra: (extra: number) => void;
}

export const ScenarioMatrix: React.FC<ScenarioMatrixProps> = ({
  params,
  currentExtra,
  onSelectExtra,
}) => {
  const scenarios = calculateScenarioMatrix(params, currentExtra);

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
            Matrice Décisionnelle : Quel effort pour quel gain ?
          </h3>
          <p className="text-xs text-slate-500">
            Comparez immédiatement différents montants d'effort mensuel et cliquez pour l'appliquer
          </p>
        </div>
        <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full self-start sm:self-auto">
          Cliquez sur une ligne pour tester
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
              <th className="py-2.5 px-3">Sur-mensualité</th>
              <th className="py-2.5 px-3">Nouvelle mensualité</th>
              <th className="py-2.5 px-3">Temps gagné</th>
              <th className="py-2.5 px-3 text-right">Intérêts économisés</th>
              <th className="py-2.5 px-3 text-right">Gain global net</th>
              <th className="py-2.5 px-3">Fin du prêt</th>
              <th className="py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {scenarios.map((sc) => {
              const isSelected = sc.isCurrent;
              return (
                <tr
                  key={sc.extraMonthly}
                  onClick={() => onSelectExtra(sc.extraMonthly)}
                  className={`cursor-pointer transition ${
                    isSelected
                      ? 'bg-emerald-50/80 hover:bg-emerald-100/70 font-semibold text-emerald-950'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      +{formatCurrency(sc.extraMonthly, 0)}/m
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold tabular-nums">
                    {formatCurrency(sc.newMonthlyTotal, 2)}
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5" />
                      {sc.durationLabel}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-extrabold text-indigo-700 tabular-nums">
                    {formatCurrency(sc.interestSaved, 0)}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-emerald-600 tabular-nums">
                    {formatCurrency(sc.totalSaved, 0)}
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {sc.endDateLabel}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3" /> Actif
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-0.5"
                      >
                        Tester <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
