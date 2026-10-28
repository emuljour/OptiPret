/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { LoanForm } from './components/LoanForm';
import { SurMensualiteSimulator } from './components/SurMensualiteSimulator';
import { DecisionMetrics } from './components/DecisionMetrics';
import { ChartsComparison } from './components/ChartsComparison';
import { ScenarioMatrix } from './components/ScenarioMatrix';
import { AmortizationTable } from './components/AmortizationTable';
import { AdvisorNotes } from './components/AdvisorNotes';
import { InvestmentSimulator } from './components/InvestmentSimulator';
import { LoanParameters, ExtraPaymentConfig } from './types/loan';
import {
  compareLoans,
  formatCurrency,
  calculateInvestmentComparison,
} from './utils/loanCalculations';
import { generatePdfReport } from './utils/generatePdfReport';
import { Check, Sparkles, PiggyBank, ArrowDownUp, ShieldCheck } from 'lucide-react';

const DEFAULT_PARAMS: LoanParameters = {
  principal: 250000,
  annualRate: 3.6,
  durationYears: 25,
  durationMonths: 300,
  insuranceRate: 0.32,
  startDate: new Date().toISOString().slice(0, 7),
  insuranceCalculationType: 'initial_principal',
};

const DEFAULT_EXTRA: ExtraPaymentConfig = {
  monthlyExtra: 100,
  startMonth: 1,
  oneTimePayments: [],
};

export default function App() {
  const [params, setParams] = useState<LoanParameters>(DEFAULT_PARAMS);
  const [extraConfig, setExtraConfig] =
    useState<ExtraPaymentConfig>(DEFAULT_EXTRA);
  const [scheduleMode, setScheduleMode] = useState<'accelerated' | 'initial'>(
    'accelerated'
  );
  const [annualReturnRate, setAnnualReturnRate] = useState<number>(5.0);
  const [activeTab, setActiveTab] = useState<'loan' | 'investment' | 'all'>('all');

  // Core comparative calculation
  const comparison = useMemo(() => {
    return compareLoans(params, extraConfig);
  }, [params, extraConfig]);

  const handleUpdateParams = (updated: Partial<LoanParameters>) => {
    setParams((prev) => ({ ...prev, ...updated }));
  };

  const handleUpdateExtra = (updated: Partial<ExtraPaymentConfig>) => {
    setExtraConfig((prev) => ({ ...prev, ...updated }));
  };

  const handleApplyPreset = (
    newParams: LoanParameters,
    newExtra: ExtraPaymentConfig
  ) => {
    setParams(newParams);
    setExtraConfig(newExtra);
  };

  const handleReset = () => {
    setParams(DEFAULT_PARAMS);
    setExtraConfig(DEFAULT_EXTRA);
    setAnnualReturnRate(5.0);
  };

  const handleExportPdf = () => {
    try {
      const startM = extraConfig.startMonth || 1;
      const defaultRemaining = Math.max(1, params.durationMonths - startM + 1);
      const durM = extraConfig.durationMonths || defaultRemaining;

      const investment = calculateInvestmentComparison(
        params,
        extraConfig,
        annualReturnRate,
        comparison,
        startM,
        durM
      );
      generatePdfReport(params, extraConfig, comparison, annualReturnRate, investment);
    } catch (err) {
      console.error('Erreur génération PDF:', err);
    }
  };

  // Schedule to display in the table
  const currentScheduleResult =
    scheduleMode === 'accelerated'
      ? comparison.accelerated
      : comparison.initial;

  return (
    <div className="min-h-screen bg-slate-100/60 flex flex-col font-sans">
      <Header
        onApplyPreset={handleApplyPreset}
        onReset={handleReset}
        onExportPdf={handleExportPdf}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Intro banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm no-print">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300" />
                Simulateur d'accélération d'emprunt & placement du capital
              </h2>
              <p className="text-xs sm:text-sm text-indigo-100/90 mt-0.5 max-w-3xl">
                Configurez votre prêt, simulez l'impact d'une sur-mensualité (temps gagné, intérêts économisés)
                et comparez avec le placement de ce même capital au taux de votre choix pendant la durée du crédit.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-indigo-950/60 border border-indigo-700/60 rounded-xl px-3 py-2 shrink-0">
              <span className="text-xs text-indigo-200">Sur-mensualité active :</span>
              <span className="text-sm font-black text-emerald-400">
                +{formatCurrency(extraConfig.monthlyExtra, 0)}/mois
              </span>
            </div>
          </div>
        </div>

        {/* View Mode Filter Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-2 no-print bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 px-2">
            Affichage :
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Vue Complète (Prêt + Épargne)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('loan')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'loan'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Accélération & Amortissement
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('investment')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'investment'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <PiggyBank className="w-3.5 h-3.5" />
              Placer le capital en plus ({annualReturnRate}%)
            </button>
          </div>
        </div>

        {/* Top Grid: Inputs (Left) and Decision KPIs + Charts (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form & Simulator (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <LoanForm params={params} onChange={handleUpdateParams} />

            <SurMensualiteSimulator
              baseMonthlyWithInsurance={
                comparison.initial.initialTotalMonthlyPayment
              }
              config={extraConfig}
              onChange={handleUpdateExtra}
              startDate={params.startDate}
              totalLoanMonths={params.durationMonths}
            />
          </div>

          {/* Right Column: Decision Dashboard & Graphs (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* KPI Cards */}
            <DecisionMetrics comparison={comparison} />

            {/* Interactive Charts */}
            <ChartsComparison comparison={comparison} />

            {/* Decision Matrix Table */}
            <ScenarioMatrix
              params={params}
              currentExtra={extraConfig.monthlyExtra}
              onSelectExtra={(amt) => handleUpdateExtra({ monthlyExtra: amt })}
            />
          </div>
        </div>

        {/* Investment of Extra Capital Simulator Section */}
        {(activeTab === 'investment' || activeTab === 'all') && (
          <div className="pt-2">
            <InvestmentSimulator
              params={params}
              extraConfig={extraConfig}
              comparison={comparison}
              annualReturnRate={annualReturnRate}
              onReturnRateChange={setAnnualReturnRate}
              onSyncLoanStartMonth={(month) =>
                handleUpdateExtra({ startMonth: month })
              }
            />
          </div>
        )}

        {/* Full-width Section: Amortization Schedule */}
        {(activeTab === 'loan' || activeTab === 'all') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 pt-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Tableau d'Amortissement
                </h2>
                <p className="text-xs text-slate-500">
                  Consultez le détail des mensualités, intérêts, assurances et capital restant dû
                </p>
              </div>

              {/* Switch between viewing initial vs accelerated schedule */}
              <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setScheduleMode('accelerated')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    scheduleMode === 'accelerated'
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Check
                    className={`w-3.5 h-3.5 ${
                      scheduleMode === 'accelerated' ? 'inline' : 'hidden'
                    }`}
                  />
                  Avec sur-mensualité (+{extraConfig.monthlyExtra} €/m)
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleMode('initial')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    scheduleMode === 'initial'
                      ? 'bg-slate-800 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Prêt standard initial (sans sur-mensualité)
                </button>
              </div>
            </div>

            <AmortizationTable
              monthlySchedule={currentScheduleResult.schedule}
              yearlySchedule={currentScheduleResult.yearlySchedule}
              params={params}
              extraConfig={extraConfig}
              isAccelerated={scheduleMode === 'accelerated' && extraConfig.monthlyExtra > 0}
              onExportPdf={handleExportPdf}
            />
          </div>
        )}

        {/* Advisor Notes Section */}
        <AdvisorNotes params={params} />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="font-semibold text-slate-700">
            OptiPrêt © {new Date().getFullYear()} — Outil d'aide à la décision financière & calculs d'amortissement
          </div>
          <div className="text-slate-400 text-[11px]">
            Simulations indicatives basées sur un amortissement constant à taux fixe et calculs d'intérêts composés sans inflation. Vérifiez les conditions auprès de votre établissement financier.
          </div>
        </div>
      </footer>
    </div>
  );
}

