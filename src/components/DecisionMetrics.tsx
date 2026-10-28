import React, { useEffect, useRef } from 'react';
import {
  Clock,
  TrendingDown,
  Calendar,
  Sparkles,
  Award,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Percent,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LoanComparison } from '../types/loan';
import { formatCurrency, formatDuration } from '../utils/loanCalculations';

interface DecisionMetricsProps {
  comparison: LoanComparison;
}

export const DecisionMetrics: React.FC<DecisionMetricsProps> = ({
  comparison,
}) => {
  const {
    initial,
    accelerated,
    monthsSaved,
    yearsSavedFormatted,
    interestSaved,
    insuranceSaved,
    totalSaved,
    percentDurationReduced,
    percentInterestReduced,
    extraInvestedTotal,
    returnOnInvestmentRatio,
  } = comparison;

  const hasExtra = monthsSaved > 0 || interestSaved > 0;
  const prevSavedRef = useRef<number>(0);

  useEffect(() => {
    // Trigger confetti once if savings jump significantly (> 10 000 €)
    if (
      totalSaved >= 10000 &&
      prevSavedRef.current < 10000 &&
      typeof confetti === 'function'
    ) {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#10B981', '#6366F1', '#3B82F6'],
        });
      } catch (e) {
        // ignore
      }
    }
    prevSavedRef.current = totalSaved;
  }, [totalSaved]);

  return (
    <div className="space-y-4">
      {/* Banner / Hero Insight */}
      <div
        className={`rounded-2xl p-5 border transition-all ${
          hasExtra
            ? 'bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-100/50 border-emerald-200 shadow-sm'
            : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                hasExtra
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Synthèse Décisionnelle
                </span>
                {hasExtra && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
                    <Sparkles className="w-3 h-3 text-emerald-700" />-
                    {percentDurationReduced.toFixed(0)}% de durée
                  </span>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
                {hasExtra ? (
                  <>
                    Vous gagnez{' '}
                    <span className="text-emerald-700 underline decoration-emerald-400 decoration-2">
                      {yearsSavedFormatted}
                    </span>{' '}
                    et économisez{' '}
                    <span className="text-emerald-700 underline decoration-emerald-400 decoration-2">
                      {formatCurrency(totalSaved, 0)}
                    </span>{' '}
                    au total !
                  </>
                ) : (
                  'Aucune sur-mensualité appliquée pour le moment'
                )}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {hasExtra
                  ? `Votre prêt prendra fin en ${accelerated.endDateLabel} au lieu de ${initial.endDateLabel}.`
                  : 'Ajustez le curseur ci-dessus pour observer le gain de temps et les intérêts économisés.'}
              </p>
            </div>
          </div>

          {/* Quick ROI ratio pill */}
          {hasExtra && extraInvestedTotal > 0 && (
            <div className="bg-white/90 backdrop-blur rounded-xl p-3 border border-emerald-200 text-right shrink-0">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Rendement de l'effort
              </span>
              <span className="text-base font-extrabold text-emerald-700 tabular-nums block">
                +{(returnOnInvestmentRatio * 100).toFixed(0)} %
              </span>
              <span className="text-[10px] text-slate-500">
                1 € injecté = {(1 + returnOnInvestmentRatio).toFixed(2)} € de coût
                évité
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 4 Core Decision KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Gain de temps */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              Temps gagné
            </span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {monthsSaved} mois de moins
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">
            {yearsSavedFormatted}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span>{initial.actualMonths} mois</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
            <span className="font-bold text-emerald-700">
              {accelerated.actualMonths} mois restants
            </span>
          </div>
        </div>

        {/* Card 2: Intérêts économisés */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-indigo-600" />
              Intérêts économisés
            </span>
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
              -{percentInterestReduced.toFixed(1)} %
            </span>
          </div>
          <div className="text-2xl font-black text-indigo-600 tracking-tight tabular-nums">
            {formatCurrency(interestSaved, 0)}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Coût intérêts initial :</span>
            <span className="font-semibold text-slate-700">
              {formatCurrency(initial.totalInterest, 0)}
            </span>
          </div>
        </div>

        {/* Card 3: Date de fin du prêt */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-600" />
              Fin du prêt avancée
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              {hasExtra ? 'Accélérée' : 'Normale'}
            </span>
          </div>
          <div className="text-xl font-black text-slate-900 tracking-tight">
            {accelerated.endDateLabel || '—'}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span>Initiale :</span>
            <span className="line-through text-slate-400">
              {initial.endDateLabel}
            </span>
          </div>
        </div>

        {/* Card 4: Assurance économisée & Gain total */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              Gain Global (avec ass.)
            </span>
            <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
              Total net
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-600 tracking-tight tabular-nums">
            {formatCurrency(totalSaved, 0)}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>dont assurance :</span>
            <span className="font-semibold text-teal-700">
              {formatCurrency(insuranceSaved, 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
