import React from 'react';
import {
  Euro,
  Percent,
  Calendar,
  Shield,
  HelpCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { LoanParameters } from '../types/loan';
import {
  calculateMonthlyPayment,
  formatCurrency,
} from '../utils/loanCalculations';

interface LoanFormProps {
  params: LoanParameters;
  onChange: (updated: Partial<LoanParameters>) => void;
}

const AMOUNT_PRESETS = [100000, 150000, 200000, 250000, 300000, 400000];
const DURATION_PRESETS = [10, 15, 20, 25];

export const LoanForm: React.FC<LoanFormProps> = ({ params, onChange }) => {
  const baseMonthly = calculateMonthlyPayment(
    params.principal,
    params.annualRate,
    params.durationMonths
  );
  const monthlyInsurance =
    (params.principal * (params.insuranceRate / 100)) / 12;
  const totalBaseMonthly = baseMonthly + monthlyInsurance;

  const handleYearsChange = (years: number) => {
    onChange({
      durationYears: years,
      durationMonths: years * 12,
    });
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-black">
              1
            </span>
            Prêt Immobilier de Départ
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Renseignez les conditions de votre crédit initial
          </p>
        </div>

        {/* Live Monthly Base Tag */}
        <div className="text-right">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Mensualité de base
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-slate-900 tabular-nums">
            {formatCurrency(totalBaseMonthly, 2)}
          </span>
          <span className="text-[11px] text-slate-400 block">
            dont {formatCurrency(monthlyInsurance, 2)} ass.
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Montant Emprunté */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="principal"
              className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
            >
              <Euro className="w-3.5 h-3.5 text-indigo-500" />
              Montant du capital emprunté
            </label>
            <span className="text-xs font-bold text-indigo-600 tabular-nums">
              {formatCurrency(params.principal, 0)}
            </span>
          </div>

          <div className="relative">
            <input
              id="principal"
              type="number"
              min="10000"
              max="2000000"
              step="5000"
              value={params.principal || ''}
              onChange={(e) =>
                onChange({ principal: Math.max(0, Number(e.target.value)) })
              }
              className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-900 font-semibold text-sm transition"
              placeholder="Ex : 250000"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">
              EUR
            </span>
          </div>

          {/* Quick chips for amount */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {AMOUNT_PRESETS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => onChange({ principal: amt })}
                className={`text-[11px] font-medium px-2 py-0.5 rounded-md border transition ${
                  params.principal === amt
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {(amt / 1000).toLocaleString('fr-FR')} k€
              </button>
            ))}
          </div>
        </div>

        {/* Taux d'intérêt annuel */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="annualRate"
              className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
            >
              <Percent className="w-3.5 h-3.5 text-indigo-500" />
              Taux d'intérêt nominal (hors assurance)
            </label>
            <span className="text-xs font-bold text-indigo-600 tabular-nums">
              {params.annualRate.toFixed(2)} %
            </span>
          </div>

          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-8 sm:col-span-9">
              <input
                type="range"
                min="0.5"
                max="7.0"
                step="0.05"
                value={params.annualRate}
                onChange={(e) =>
                  onChange({ annualRate: parseFloat(e.target.value) })
                }
                className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>
            <div className="col-span-4 sm:col-span-3 relative">
              <input
                id="annualRate"
                type="number"
                min="0.1"
                max="15"
                step="0.05"
                value={params.annualRate || ''}
                onChange={(e) =>
                  onChange({ annualRate: Math.max(0, Number(e.target.value)) })
                }
                className="w-full pl-2 pr-6 py-1.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none text-slate-900 font-semibold text-xs text-right tabular-nums"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                %
              </span>
            </div>
          </div>
        </div>

        {/* Durée du prêt */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              Durée initiale
            </label>
            <span className="text-xs font-bold text-indigo-600 tabular-nums">
              {params.durationYears} ans ({params.durationMonths} mois)
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 mb-2">
            {DURATION_PRESETS.map((years) => (
              <button
                key={years}
                type="button"
                onClick={() => handleYearsChange(years)}
                className={`py-1.5 text-xs font-semibold rounded-lg border transition text-center ${
                  params.durationYears === years
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {years} ans
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Durée libre :</span>
            <input
              type="number"
              min="1"
              max="40"
              value={params.durationYears || ''}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val > 0) handleYearsChange(val);
              }}
              className="w-20 px-2 py-1 rounded-lg border border-slate-200 text-xs text-center font-semibold focus:border-indigo-500 outline-none"
            />
            <span className="text-xs text-slate-500">années</span>
          </div>
        </div>

        {/* Assurance et Date de début (accordéon / compact) */}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Taux Assurance */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="insuranceRate"
                className="text-[11px] font-semibold text-slate-600 flex items-center gap-1"
                title="Taux annuel moyen de l'assurance emprunteur"
              >
                <Shield className="w-3 h-3 text-indigo-400" />
                Assurance emprunteur
              </label>
              <span className="text-[11px] font-bold text-slate-700">
                {params.insuranceRate.toFixed(2)} %
              </span>
            </div>
            <div className="relative">
              <input
                id="insuranceRate"
                type="number"
                min="0"
                max="3"
                step="0.01"
                value={params.insuranceRate}
                onChange={(e) =>
                  onChange({
                    insuranceRate: Math.max(0, Number(e.target.value)),
                  })
                }
                className="w-full pl-2 pr-6 py-1.5 rounded-lg border border-slate-200 focus:border-indigo-500 text-xs font-semibold text-right"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                %
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Calculée sur le capital initial
            </span>
          </div>

          {/* Date de départ */}
          <div>
            <label
              htmlFor="startDate"
              className="text-[11px] font-semibold text-slate-600 flex items-center gap-1 mb-1"
            >
              <Calendar className="w-3 h-3 text-indigo-400" />
              1ère échéance
            </label>
            <input
              id="startDate"
              type="month"
              value={params.startDate}
              onChange={(e) => onChange({ startDate: e.target.value })}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 focus:border-indigo-500 text-xs font-medium text-slate-700"
            />
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Mois de la première mensualité
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
