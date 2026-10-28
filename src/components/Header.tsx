import React from 'react';
import {
  Calculator,
  RotateCcw,
  FileDown,
  Sparkles,
  TrendingDown,
  Building2,
  Home,
  KeyRound,
} from 'lucide-react';
import { LoanParameters, ExtraPaymentConfig } from '../types/loan';

interface HeaderProps {
  onApplyPreset: (params: LoanParameters, extra: ExtraPaymentConfig) => void;
  onReset: () => void;
  onExportPdf: () => void;
}

export const PRESETS = [
  {
    name: 'Résidence principale (25 ans)',
    icon: Home,
    description: '250 000 € à 3,60% sur 25 ans (+100 €/m)',
    params: {
      principal: 250000,
      annualRate: 3.6,
      durationYears: 25,
      durationMonths: 300,
      insuranceRate: 0.32,
      startDate: new Date().toISOString().slice(0, 7),
      insuranceCalculationType: 'initial_principal' as const,
    },
    extra: {
      monthlyExtra: 100,
      startMonth: 1,
      oneTimePayments: [],
    },
  },
  {
    name: 'Premier Achat (20 ans)',
    icon: KeyRound,
    description: '180 000 € à 3,40% sur 20 ans (+75 €/m)',
    params: {
      principal: 180000,
      annualRate: 3.4,
      durationYears: 20,
      durationMonths: 240,
      insuranceRate: 0.28,
      startDate: new Date().toISOString().slice(0, 7),
      insuranceCalculationType: 'initial_principal' as const,
    },
    extra: {
      monthlyExtra: 75,
      startMonth: 1,
      oneTimePayments: [],
    },
  },
  {
    name: 'Investissement Locatif (15 ans)',
    icon: Building2,
    description: '120 000 € à 3,85% sur 15 ans (+150 €/m)',
    params: {
      principal: 120000,
      annualRate: 3.85,
      durationYears: 15,
      durationMonths: 180,
      insuranceRate: 0.35,
      startDate: new Date().toISOString().slice(0, 7),
      insuranceCalculationType: 'initial_principal' as const,
    },
    extra: {
      monthlyExtra: 150,
      startMonth: 1,
      oneTimePayments: [],
    },
  },
];

export const Header: React.FC<HeaderProps> = ({
  onApplyPreset,
  onReset,
  onExportPdf,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  OptiPrêt
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <TrendingDown className="w-3 h-3" />
                  Accélérateur d'Épargne
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Simulateur de prêt immobilier & outil d'optimisation par sur-mensualité
              </p>
            </div>
          </div>

          {/* Quick Presets & Actions */}
          <div className="flex items-center flex-wrap gap-2 no-print">
            <div className="hidden lg:flex items-center gap-1.5 mr-2 bg-slate-100/80 p-1 rounded-lg border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500 px-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                Exemples :
              </span>
              {PRESETS.map((preset, idx) => {
                const IconComponent = preset.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onApplyPreset(preset.params, preset.extra)}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-medium transition shadow-xs border border-slate-200"
                    title={preset.description}
                  >
                    <IconComponent className="w-3.5 h-3.5 text-slate-500" />
                    <span>{preset.name.split(' (')[0]}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onExportPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              title="Générer et télécharger le rapport complet en PDF"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Télécharger le PDF</span>
            </button>

            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition cursor-pointer"
              title="Réinitialiser les paramètres"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Réinitialiser</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
