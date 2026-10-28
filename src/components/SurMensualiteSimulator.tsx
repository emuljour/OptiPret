import React, { useState } from 'react';
import {
  Zap,
  Plus,
  Coins,
  ArrowRight,
  Sparkles,
  CalendarCheck,
  Trash2,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ExtraPaymentConfig, OneTimePayment } from '../types/loan';
import { formatCurrency, addMonthsToDate } from '../utils/loanCalculations';

interface SurMensualiteSimulatorProps {
  baseMonthlyWithInsurance: number;
  config: ExtraPaymentConfig;
  onChange: (updated: Partial<ExtraPaymentConfig>) => void;
  maxRecommendedExtra?: number;
  startDate?: string;
  totalLoanMonths?: number;
}

const EXTRA_PRESETS = [25, 50, 75, 100, 150, 200, 300, 500];

export const SurMensualiteSimulator: React.FC<SurMensualiteSimulatorProps> = ({
  baseMonthlyWithInsurance,
  config,
  onChange,
  maxRecommendedExtra = 1000,
  startDate = '2026-04',
  totalLoanMonths = 300,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [oneTimeAmount, setOneTimeAmount] = useState<number>(5000);
  const [oneTimeMonth, setOneTimeMonth] = useState<number>(12);
  const [oneTimeLabel, setOneTimeLabel] = useState<string>('Prime annuelle');

  const startMonth = config.startMonth || 1;
  const startDateInfo = addMonthsToDate(startDate, startMonth - 1);

  const newTotalMonthly = baseMonthlyWithInsurance + config.monthlyExtra;

  const handleSliderChange = (val: number) => {
    onChange({ monthlyExtra: val });
  };

  const handleAddOneTime = () => {
    if (oneTimeAmount <= 0) return;
    const newPayment: OneTimePayment = {
      id: Math.random().toString(36).substring(2, 9),
      amount: oneTimeAmount,
      month: oneTimeMonth,
      label: oneTimeLabel || 'Versement ponctuel',
    };
    onChange({
      oneTimePayments: [...config.oneTimePayments, newPayment],
    });
  };

  const handleRemoveOneTime = (id: string) => {
    onChange({
      oneTimePayments: config.oneTimePayments.filter((p) => p.id !== id),
    });
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-indigo-500/20 relative overflow-hidden">
      {/* Background glowing ambient effect */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-indigo-800/40 gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 mb-1">
            <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            Effet Levier & Accélérateur
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-500 text-white text-xs font-black">
              2
            </span>
            Sur-Mensualité : Montant à ajouter
          </h2>
          <p className="text-xs text-indigo-200/80">
            Augmentez votre mensualité pour écourter le prêt et supprimer des milliers d'euros d'intérêts
          </p>
        </div>

        {/* Live Total Monthly Highlight */}
        <div className="bg-indigo-950/70 border border-indigo-700/50 rounded-xl p-3 text-right">
          <div className="text-[11px] text-indigo-300 font-medium">
            Nouvelle mensualité
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 tabular-nums">
            {formatCurrency(newTotalMonthly, 2)}
          </div>
          <div className="text-[10px] text-slate-300">
            {formatCurrency(baseMonthlyWithInsurance, 2)} +{' '}
            <span className="text-emerald-300 font-bold">
              {formatCurrency(config.monthlyExtra, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Slider & Input */}
      <div className="space-y-4 relative z-10">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="monthlyExtraInput"
              className="text-xs sm:text-sm font-semibold text-indigo-100 flex items-center gap-1.5"
            >
              <Coins className="w-4 h-4 text-emerald-400" />
              Montant supplémentaire ajouté chaque mois
            </label>
            <div className="flex items-center gap-1">
              <span className="text-xl sm:text-2xl font-extrabold text-emerald-400 tabular-nums">
                +{formatCurrency(config.monthlyExtra, 0)}
              </span>
              <span className="text-xs text-indigo-300 font-medium">/ mois</span>
            </div>
          </div>

          {/* Interactive Range Slider */}
          <div className="pt-2 pb-1">
            <input
              type="range"
              min="0"
              max={Math.max(500, maxRecommendedExtra)}
              step="5"
              value={config.monthlyExtra}
              onChange={(e) => handleSliderChange(Number(e.target.value))}
              className="w-full h-3 bg-indigo-950/80 rounded-lg appearance-none cursor-pointer accent-emerald-400 border border-indigo-700/60 focus:outline-none"
            />
            <div className="flex justify-between text-[10px] text-indigo-300 font-medium mt-1">
              <span>0 € (Standard)</span>
              <span>+100 €</span>
              <span>+250 €</span>
              <span>+500 €</span>
              <span>+{Math.max(500, maxRecommendedExtra)} €</span>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <span className="text-xs text-indigo-300 font-medium mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              Tests rapides :
            </span>
            {EXTRA_PRESETS.map((amt) => {
              const isSelected = config.monthlyExtra === amt;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => onChange({ monthlyExtra: amt })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20 font-bold scale-105'
                      : 'bg-indigo-900/60 text-indigo-200 border-indigo-700/60 hover:bg-indigo-800 hover:text-white'
                  }`}
                >
                  +{amt} €
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => onChange({ monthlyExtra: 0 })}
              className={`px-2 py-1 rounded-lg text-xs transition border ${
                config.monthlyExtra === 0
                  ? 'bg-indigo-800 text-white border-indigo-600 font-bold'
                  : 'text-indigo-400 border-transparent hover:text-white'
              }`}
            >
              Réinitialiser à 0
            </button>
          </div>
        </div>

        {/* Accordion: Options Avancées (Date de démarrage, Remboursement ponctuel) */}
        <div className="pt-2 border-t border-indigo-800/40">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-xs font-semibold text-indigo-200 hover:text-white transition py-1"
          >
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              Options avancées (Début différé de la sur-mensualité & versements ponctuels)
              {config.oneTimePayments.length > 0 && (
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                  {config.oneTimePayments.length} versement(s)
                </span>
              )}
            </span>
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4 text-indigo-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-indigo-400" />
            )}
          </button>

          {showAdvanced && (
            <div className="mt-3 space-y-4 bg-indigo-950/50 p-3.5 rounded-xl border border-indigo-800/60">
              {/* Mois de départ de la surmensualité */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-indigo-200 font-medium">
                    Appliquer la sur-mensualité à partir de :
                  </label>
                  <span className="text-[11px] font-bold text-emerald-300">
                    Mois {startMonth} ({startDateInfo.label})
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => onChange({ startMonth: 1 })}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition ${
                      startMonth === 1
                        ? 'bg-emerald-500 text-slate-900 border-emerald-400 font-bold'
                        : 'bg-indigo-900/40 text-indigo-200 border-indigo-700/50 hover:bg-indigo-800'
                    }`}
                  >
                    Dès le début (Mois 1)
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ startMonth: 13 })}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition ${
                      startMonth === 13
                        ? 'bg-emerald-500 text-slate-900 border-emerald-400 font-bold'
                        : 'bg-indigo-900/40 text-indigo-200 border-indigo-700/50 hover:bg-indigo-800'
                    }`}
                  >
                    Après 1 an (Mois 13)
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ startMonth: 25 })}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition ${
                      startMonth === 25
                        ? 'bg-emerald-500 text-slate-900 border-emerald-400 font-bold'
                        : 'bg-indigo-900/40 text-indigo-200 border-indigo-700/50 hover:bg-indigo-800'
                    }`}
                  >
                    Après 2 ans (Mois 25)
                  </button>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-indigo-300">Mois :</span>
                    <input
                      type="number"
                      min="1"
                      max={totalLoanMonths}
                      value={startMonth}
                      onChange={(e) =>
                        onChange({
                          startMonth: Math.max(1, Number(e.target.value)),
                        })
                      }
                      className="w-16 bg-indigo-900/80 border border-indigo-700 rounded-lg px-2 py-1 text-xs text-white text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Durée d'application de la surmensualité */}
              <div className="pt-2 border-t border-indigo-800/40">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-indigo-200 font-medium">
                    Durée de la sur-mensualité :
                  </label>
                  <span className="text-[11px] font-bold text-indigo-300">
                    {config.durationMonths
                      ? `${config.durationMonths} mois`
                      : 'Jusqu’à la fin du prêt'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => onChange({ durationMonths: undefined })}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition ${
                      !config.durationMonths
                        ? 'bg-emerald-500 text-slate-900 border-emerald-400 font-bold'
                        : 'bg-indigo-900/40 text-indigo-200 border-indigo-700/50 hover:bg-indigo-800'
                    }`}
                  >
                    Tout le reste du prêt
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ durationMonths: 36 })}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition ${
                      config.durationMonths === 36
                        ? 'bg-emerald-500 text-slate-900 border-emerald-400 font-bold'
                        : 'bg-indigo-900/40 text-indigo-200 border-indigo-700/50 hover:bg-indigo-800'
                    }`}
                  >
                    36 mois (3 ans)
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ durationMonths: 60 })}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition ${
                      config.durationMonths === 60
                        ? 'bg-emerald-500 text-slate-900 border-emerald-400 font-bold'
                        : 'bg-indigo-900/40 text-indigo-200 border-indigo-700/50 hover:bg-indigo-800'
                    }`}
                  >
                    60 mois (5 ans)
                  </button>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-indigo-300">Mois :</span>
                    <input
                      type="number"
                      min="1"
                      max={totalLoanMonths}
                      placeholder="Tous"
                      value={config.durationMonths || ''}
                      onChange={(e) =>
                        onChange({
                          durationMonths: e.target.value
                            ? Math.max(1, Number(e.target.value))
                            : undefined,
                        })
                      }
                      className="w-16 bg-indigo-900/80 border border-indigo-700 rounded-lg px-2 py-1 text-xs text-white text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Remboursement ponctuel exceptionnel */}
              <div className="pt-2 border-t border-indigo-800/40">
                <label className="text-xs text-indigo-200 font-medium block mb-1.5">
                  Ajouter un remboursement ponctuel (ex: prime, donation, épargne) :
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Libellé (ex: Prime fin d'année)"
                      value={oneTimeLabel}
                      onChange={(e) => setOneTimeLabel(e.target.value)}
                      className="w-full bg-indigo-900/60 border border-indigo-700/60 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-indigo-400"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      step="500"
                      placeholder="Montant €"
                      value={oneTimeAmount || ''}
                      onChange={(e) => setOneTimeAmount(Number(e.target.value))}
                      className="w-full bg-indigo-900/60 border border-indigo-700/60 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-indigo-400 text-right"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Mois N°"
                      title="Numéro du mois dans le prêt (ex: 24)"
                      value={oneTimeMonth || ''}
                      onChange={(e) => setOneTimeMonth(Number(e.target.value))}
                      className="w-16 bg-indigo-900/60 border border-indigo-700/60 rounded-lg px-2 py-1.5 text-xs text-white text-center"
                    />
                    <button
                      type="button"
                      onClick={handleAddOneTime}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold px-2 py-1.5 flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Ajouter
                    </button>
                  </div>
                </div>

                {/* Liste des versements ponctuels */}
                {config.oneTimePayments.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {config.oneTimePayments.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between text-xs bg-indigo-900/40 px-2.5 py-1 rounded-lg border border-indigo-800/40"
                      >
                        <span className="text-indigo-200">
                          <span className="font-semibold text-white">
                            {p.label}
                          </span>{' '}
                          (au mois {p.month}) :{' '}
                          <span className="text-emerald-300 font-bold">
                            {formatCurrency(p.amount, 0)}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveOneTime(p.id)}
                          className="text-red-400 hover:text-red-300 p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
