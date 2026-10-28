import React, { useState } from 'react';
import {
  PiggyBank,
  TrendingUp,
  Percent,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Coins,
  Wallet,
  Scale,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  LoanParameters,
  ExtraPaymentConfig,
  LoanComparison,
} from '../types/loan';
import {
  calculateInvestmentComparison,
  formatCurrency,
  formatDuration,
  addMonthsToDate,
} from '../utils/loanCalculations';

interface InvestmentSimulatorProps {
  params: LoanParameters;
  extraConfig: ExtraPaymentConfig;
  comparison: LoanComparison;
  annualReturnRate: number;
  onReturnRateChange: (rate: number) => void;
  onSyncLoanStartMonth?: (month: number) => void;
}

const PLACEMENT_PRESETS = [
  {
    name: 'Livret A / LDDS',
    rate: 3.0,
    desc: 'Sans risque, garanti par l’État',
    risk: 'Très faible',
  },
  {
    name: 'Fonds Euros / Obligataire',
    rate: 4.0,
    desc: 'Assurance-vie sécurisée',
    risk: 'Faible',
  },
  {
    name: 'SCPI / Immobilier papier',
    rate: 5.5,
    desc: 'Rendement locatif diversifié',
    risk: 'Modéré',
  },
  {
    name: 'ETF Bourse / MSCI World',
    rate: 7.5,
    desc: 'Moyenne historique long terme',
    risk: 'Élevé',
  },
];

const DURATION_PRESETS = [12, 24, 36, 60, 120, 180];
const START_MONTH_PRESETS = [1, 13, 25, 37, 49, 61];

export const InvestmentSimulator: React.FC<InvestmentSimulatorProps> = ({
  params,
  extraConfig,
  comparison,
  annualReturnRate,
  onReturnRateChange,
  onSyncLoanStartMonth,
}) => {
  // Mois où démarre l'augmentation / placement (défaut sur extraConfig.startMonth ou 1)
  const [startMonth, setStartMonth] = useState<number>(extraConfig.startMonth || 1);

  // Nombre de mois stipulés pour le placement
  const remainingDefault = Math.max(1, params.durationMonths - (extraConfig.startMonth || 1) + 1);
  const [durationMonths, setDurationMonths] = useState<number>(
    extraConfig.durationMonths || remainingDefault
  );

  // Calcul du placement commençant au mois stipulé pour la durée choisie
  const investment = calculateInvestmentComparison(
    params,
    extraConfig,
    annualReturnRate,
    comparison,
    startMonth,
    durationMonths
  );

  const { investExtraOnly, breakEvenRate } = investment;

  // Compare placement return vs loan interest rate
  const loanTotalRate = params.annualRate + params.insuranceRate;
  const isPlacementBetter = annualReturnRate > loanTotalRate;

  // Multiplier on capital
  const multiplier =
    investExtraOnly.totalDeposited > 0
      ? investExtraOnly.finalCapital / investExtraOnly.totalDeposited
      : 1;

  // Start & End date information
  const startDateInfo = addMonthsToDate(params.startDate, startMonth - 1);
  const endDateInfo = addMonthsToDate(
    params.startDate,
    startMonth + durationMonths - 1
  );

  // Chart data: MUST strictly begin at startMonth!
  // timeline[0] is Month 0 of placement at startMonth
  // timeline[k] is Month k of placement (loanMonth = startMonth + k - 1)
  const chartData = investExtraOnly.timeline.map((pt) => {
    return {
      loanMonthNumber: pt.loanMonth,
      monthInPlacement: pt.monthInPlacement,
      // Short label for X-Axis
      tickLabel:
        pt.monthInPlacement === 0
          ? `Début (Mois ${pt.loanMonth})`
          : pt.monthInPlacement % 12 === 0
          ? `+${pt.monthInPlacement / 12} an${pt.monthInPlacement / 12 > 1 ? 's' : ''}`
          : `+${pt.monthInPlacement}m`,
      fullDateLabel: pt.dateLabel,
      'Capital versé': pt.cumulativeDeposited,
      'Intérêts composés': pt.interestEarned,
      'Capital Total': pt.balance,
    };
  });

  const handleStartMonthChange = (m: number) => {
    const validM = Math.max(1, Math.min(params.durationMonths, m));
    setStartMonth(validM);
    if (onSyncLoanStartMonth) {
      onSyncLoanStartMonth(validM);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-6">
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-1">
            <PiggyBank className="w-3.5 h-3.5 text-blue-600" />
            Simulation d'Épargne & Arbitrage Patrimonial
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            Placer le capital en plus pendant une durée stipulée
          </h2>
          <p className="text-xs text-slate-500">
            Simulez le placement de votre sur-mensualité (+
            {formatCurrency(extraConfig.monthlyExtra, 0)}/mois) à partir d'un mois précis et sur une durée déterminée (sans inflation)
          </p>
        </div>

        {/* Big result highlight */}
        <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-xl p-3 sm:p-4 text-right shadow-sm shrink-0">
          <span className="text-[11px] text-blue-200 font-medium block">
            Capital Final Constitué
          </span>
          <span className="text-xl sm:text-2xl font-black text-amber-300 tabular-nums block">
            {formatCurrency(investExtraOnly.finalCapital, 0)}
          </span>
          <span className="text-[10px] text-blue-200 block">
            dont {formatCurrency(investExtraOnly.interestEarned, 0)} d'intérêts générés
          </span>
        </div>
      </div>

      {/* PARAMETERS GRID: 1. Mois de début, 2. Nombre de mois de placement, 3. Taux de rendement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Param 1: Mois de début de la sur-mensualité */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              1. Mois de début de l'augmentation :
            </label>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
              Mois N° {startMonth} ({startDateInfo.label})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max={params.durationMonths}
              value={startMonth}
              onChange={(e) => handleStartMonthChange(Number(e.target.value))}
              className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-sm text-indigo-700 text-center focus:border-indigo-500 outline-none"
            />
            <span className="text-xs text-slate-500">
              ème mois du prêt ({startMonth === 1 ? 'dès le début' : `${Math.floor((startMonth - 1) / 12)} an(s) après`})
            </span>
          </div>

          {/* Quick Start Month chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {START_MONTH_PRESETS.filter((m) => m <= params.durationMonths).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleStartMonthChange(m)}
                className={`text-[11px] font-medium px-2 py-0.5 rounded-md border transition ${
                  startMonth === m
                    ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {m === 1 ? 'Dès le début' : `An ${Math.floor((m - 1) / 12) + 1} (Mois ${m})`}
              </button>
            ))}
          </div>
        </div>

        {/* Param 2: Nombre de mois stipulés pour le placement */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              2. Nombre de mois de placement :
            </label>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
              {formatDuration(durationMonths)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max={600}
              value={durationMonths}
              onChange={(e) => setDurationMonths(Math.max(1, Number(e.target.value)))}
              className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-sm text-blue-700 text-center focus:border-blue-500 outline-none"
            />
            <span className="text-xs text-slate-500">
              mois (jusqu'en {endDateInfo.label})
            </span>
          </div>

          {/* Quick Duration chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {DURATION_PRESETS.map((dm) => (
              <button
                key={dm}
                type="button"
                onClick={() => setDurationMonths(dm)}
                className={`text-[11px] font-medium px-2 py-0.5 rounded-md border transition ${
                  durationMonths === dm
                    ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {dm < 12 ? `${dm}m` : `${dm / 12} an${dm / 12 > 1 ? 's' : ''} (${dm}m)`}
              </button>
            ))}
            <button
              type="button"
              onClick={() =>
                setDurationMonths(
                  Math.max(1, params.durationMonths - startMonth + 1)
                )
              }
              className={`text-[11px] font-medium px-2 py-0.5 rounded-md border transition ${
                durationMonths === Math.max(1, params.durationMonths - startMonth + 1)
                  ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              Reste du prêt ({Math.max(1, params.durationMonths - startMonth + 1)}m)
            </button>
          </div>
        </div>
      </div>

      {/* Param 3: Taux de rendement annuel net & Presets */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label
            htmlFor="returnRateInput"
            className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-1.5"
          >
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            3. Taux de rendement annuel net du placement :
          </label>
          <div className="flex items-center gap-2">
            <input
              id="returnRateInput"
              type="number"
              min="0"
              max="20"
              step="0.1"
              value={annualReturnRate || ''}
              onChange={(e) =>
                onReturnRateChange(Math.max(0, Number(e.target.value)))
              }
              className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-sm text-emerald-700 text-right focus:border-emerald-500 outline-none"
            />
            <span className="text-xs font-bold text-slate-600">% / an net</span>
          </div>
        </div>

        {/* Range Slider */}
        <div>
          <input
            type="range"
            min="0.5"
            max="12.0"
            step="0.1"
            value={annualReturnRate}
            onChange={(e) => onReturnRateChange(Number(e.target.value))}
            className="w-full h-2.5 bg-slate-200 rounded-lg cursor-pointer accent-emerald-600 focus:outline-none"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-medium mt-1">
            <span>0.5% (Sécurisé)</span>
            <span>3% (Livret A)</span>
            <span>5% (SCPI / Mixte)</span>
            <span>7.5% (Bourse / ETF)</span>
            <span>12% (Dynamique)</span>
          </div>
        </div>

        {/* Asset Presets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {PLACEMENT_PRESETS.map((p) => {
            const isSelected = annualReturnRate === p.rate;
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => onReturnRateChange(p.rate)}
                className={`p-2 rounded-xl text-left border transition ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold ${
                      isSelected ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {p.name}
                  </span>
                  <span
                    className={`text-xs font-extrabold ${
                      isSelected ? 'text-amber-300' : 'text-emerald-600'
                    }`}
                  >
                    {p.rate}%
                  </span>
                </div>
                <div
                  className={`text-[10px] mt-0.5 truncate ${
                    isSelected ? 'text-emerald-100' : 'text-slate-500'
                  }`}
                >
                  {p.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards: Epargne constituée */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
            <Coins className="w-4 h-4 text-slate-600" />
            Total capital versé sur la période
          </span>
          <div className="text-xl font-black text-slate-900 tabular-nums">
            {formatCurrency(investExtraOnly.totalDeposited, 0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {extraConfig.monthlyExtra} € × {durationMonths} mois
          </div>
        </div>

        <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-200">
          <span className="text-xs font-semibold text-blue-700 flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Intérêts générés (sans inflation)
          </span>
          <div className="text-xl font-black text-blue-700 tabular-nums">
            +{formatCurrency(investExtraOnly.interestEarned, 0)}
          </div>
          <div className="text-[11px] text-blue-600 mt-1">
            Plus-value des intérêts composés à {annualReturnRate}%
          </div>
        </div>

        <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-200">
          <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5 mb-1">
            <Wallet className="w-4 h-4 text-emerald-600" />
            Effet multiplicateur
          </span>
          <div className="text-xl font-black text-emerald-700 tabular-nums">
            × {multiplier.toFixed(2)}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1">
            1 € placé devient {multiplier.toFixed(2)} €
          </div>
        </div>
      </div>

      {/* Visual Chart of Capital Accumulation — Strictly starting at startMonth */}
      <div className="border border-slate-200 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-3 border-b border-slate-100 gap-2">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Courbe d'accumulation du placement (Départ : {startDateInfo.label})
            </h4>
            <p className="text-[11px] text-slate-500">
              La courbe démarre au <strong className="text-slate-800">Mois N° {startMonth} ({startDateInfo.label})</strong> et progresse pendant <strong className="text-slate-800">{durationMonths} mois</strong> jusqu'en <strong className="text-slate-800">{endDateInfo.label}</strong>.
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
              Période : {formatDuration(durationMonths)}
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorGain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="tickLabel"
                interval="preserveStartEnd"
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <YAxis
                tickFormatter={(val) => `${Math.round(val / 1000)}k€`}
                tick={{ fontSize: 11, fill: '#64748b' }}
                width={48}
              />
              <Tooltip
                formatter={(val: any, name: any) => [
                  formatCurrency(Number(val), 0),
                  name,
                ]}
                labelFormatter={(_, items) => {
                  const pt = items?.[0]?.payload;
                  return pt
                    ? `${pt.fullDateLabel} — ${pt.monthInPlacement > 0 ? `Mois ${pt.monthInPlacement} du placement` : 'Point de départ'}`
                    : '';
                }}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area
                type="monotone"
                dataKey="Capital versé"
                stackId="1"
                stroke="#3B82F6"
                fill="url(#colorDeposits)"
              />
              <Area
                type="monotone"
                dataKey="Intérêts composés"
                stackId="1"
                stroke="#10B981"
                fill="url(#colorGain)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Decision Arbitrage Card: Placer vs Rembourser */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-5 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Scale className="w-5 h-5 text-amber-400" />
          <h4 className="text-sm font-bold text-white">
            Arbitrage Décisionnel : Faut-il Placer le surplus ou Rembourser le prêt ?
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Stratégie A : Rembourser par anticipation */}
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Stratégie A : Rembourser le prêt
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full text-[10px]">
                100% Garanti & Net
              </span>
            </div>
            <p className="text-slate-300">
              En injectant les <strong>+{formatCurrency(extraConfig.monthlyExtra, 0)}/mois</strong> dans vos mensualités à partir du mois {startMonth} :
            </p>
            <ul className="space-y-1 text-slate-200">
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">✔</span>
                <span>
                  Économie d'intérêts bancaires :{' '}
                  <strong className="text-white">
                    {formatCurrency(comparison.interestSaved, 0)}
                  </strong>
                </span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">✔</span>
                <span>
                  Temps gagné :{' '}
                  <strong className="text-white">
                    {comparison.yearsSavedFormatted}
                  </strong>{' '}
                  de mensualités en moins
                </span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">✔</span>
                <span>
                  Équivalent placement net garanti à :{' '}
                  <strong className="text-emerald-300">
                    {loanTotalRate.toFixed(2)} % / an
                  </strong>
                </span>
              </li>
            </ul>
          </div>

          {/* Stratégie B : Placer l'argent */}
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-400 uppercase tracking-wider text-[11px] flex items-center gap-1">
                <Coins className="w-4 h-4" /> Stratégie B : Épargner à {annualReturnRate}%
              </span>
              <span className="bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded-full text-[10px]">
                Épargne disponible
              </span>
            </div>
            <p className="text-slate-300">
              En plaçant les <strong>+{formatCurrency(extraConfig.monthlyExtra, 0)}/mois</strong> pendant {durationMonths} mois (dès le mois {startMonth}) :
            </p>
            <ul className="space-y-1 text-slate-200">
              <li className="flex items-center gap-1.5">
                <span className="text-blue-400 font-bold">✔</span>
                <span>
                  Capital final disponible :{' '}
                  <strong className="text-white">
                    {formatCurrency(investExtraOnly.finalCapital, 0)}
                  </strong>
                </span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-blue-400 font-bold">✔</span>
                <span>
                  Intérêts générés :{' '}
                  <strong className="text-emerald-300">
                    +{formatCurrency(investExtraOnly.interestEarned, 0)}
                  </strong>
                </span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-blue-400 font-bold">✔</span>
                <span>
                  Liquidité : capital disponible immédiatement à la fin des {durationMonths} mois
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Verdict Box */}
        <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-amber-300">💡 Le Verdict Chiffré :</span>{' '}
            {isPlacementBetter ? (
              <span className="text-slate-200">
                Avec un taux de placement à <strong>{annualReturnRate}%</strong> supérieur au coût du crédit (<strong>{loanTotalRate.toFixed(2)}%</strong>), placer le surplus génère{' '}
                <strong className="text-emerald-400">
                  +{formatCurrency(investExtraOnly.interestEarned - comparison.interestSaved, 0)}
                </strong>{' '}
                de plus que l'économie d'intérêts du prêt.
              </span>
            ) : (
              <span className="text-slate-200">
                Le coût de votre crédit (<strong>{loanTotalRate.toFixed(2)}%</strong> avec assurance) est supérieur au rendement de votre placement (<strong>{annualReturnRate}%</strong>). Rembourser votre prêt vous fait gagner{' '}
                <strong className="text-emerald-400">
                  +{formatCurrency(comparison.interestSaved - investExtraOnly.interestEarned, 0)}
                </strong>{' '}
                avec un rendement garanti à 100% !
              </span>
            )}
          </div>
          <div className="shrink-0 bg-indigo-900/60 px-3 py-1.5 rounded-lg border border-indigo-700 text-center">
            <span className="text-[10px] text-indigo-300 block">Taux pivot d'équilibre</span>
            <span className="font-extrabold text-white text-xs">{loanTotalRate.toFixed(2)} % net</span>
          </div>
        </div>
      </div>
    </div>
  );
};
