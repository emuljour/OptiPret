import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';
import { TrendingDown, PieChart as PieIcon, LineChart as ChartLine } from 'lucide-react';
import { LoanComparison } from '../types/loan';
import { formatCurrency } from '../utils/loanCalculations';

interface ChartsComparisonProps {
  comparison: LoanComparison;
}

export const ChartsComparison: React.FC<ChartsComparisonProps> = ({
  comparison,
}) => {
  const [activeTab, setActiveTab] = useState<'balance' | 'cost'>('balance');

  const { initial, accelerated } = comparison;

  // Prepare data for Capital Restant Dû over years
  // Sample every year (or start of every 12 months)
  const maxMonths = Math.max(initial.actualMonths, accelerated.actualMonths);
  const totalYears = Math.ceil(maxMonths / 12);

  const balanceData = [];

  // Year 0 (start)
  balanceData.push({
    yearLabel: 'Début',
    initialBalance: initial.schedule[0]
      ? initial.schedule[0].remainingPrincipal + initial.schedule[0].principalPayment
      : 0,
    acceleratedBalance: accelerated.schedule[0]
      ? accelerated.schedule[0].remainingPrincipal + accelerated.schedule[0].principalPayment
      : 0,
  });

  for (let y = 1; y <= totalYears; y++) {
    const targetMonth = y * 12;
    // Initial balance at end of this year
    const initialRow =
      initial.schedule[Math.min(targetMonth - 1, initial.schedule.length - 1)];
    const acceleratedRow =
      targetMonth <= accelerated.schedule.length
        ? accelerated.schedule[targetMonth - 1]
        : null;

    balanceData.push({
      yearLabel: `An ${y}`,
      initialBalance: initialRow ? Math.round(initialRow.remainingPrincipal) : 0,
      acceleratedBalance: acceleratedRow
        ? Math.round(acceleratedRow.remainingPrincipal)
        : 0,
    });
  }

  // Data for cost breakdown comparison
  const costData = [
    {
      category: 'Prêt Initial',
      Capital: initial.schedule.reduce((acc, r) => acc + r.principalPayment, 0),
      Intérêts: Math.round(initial.totalInterest),
      Assurance: Math.round(initial.totalInsurance),
    },
    {
      category: 'Prêt Accéléré',
      Capital: accelerated.schedule.reduce(
        (acc, r) => acc + r.principalPayment,
        0
      ),
      Intérêts: Math.round(accelerated.totalInterest),
      Assurance: Math.round(accelerated.totalInsurance),
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-indigo-600" />
            Visualisation Comparative de l'Amortissement
          </h3>
          <p className="text-xs text-slate-500">
            Comparez visuellement la vitesse de désendettement et le coût global
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('balance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'balance'
                ? 'bg-white text-indigo-600 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ChartLine className="w-3.5 h-3.5" />
            Capital Restant Dû (CRD)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cost')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'cost'
                ? 'bg-white text-indigo-600 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            Coût Total & Intérêts
          </button>
        </div>
      </div>

      {activeTab === 'balance' ? (
        <div>
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={balanceData}
                margin={{ top: 10, right: 15, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorInit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#94A3B8" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="yearLabel"
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
                    name === 'initialBalance'
                      ? 'CRD Prêt Initial'
                      : 'CRD avec Sur-mensualité',
                  ]}
                  labelFormatter={(lbl) => `Échéance : ${lbl}`}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(value) =>
                    value === 'initialBalance'
                      ? 'Capital restant dû initial'
                      : 'Capital restant dû avec sur-mensualité'
                  }
                  iconType="circle"
                />
                <Area
                  type="monotone"
                  dataKey="initialBalance"
                  stroke="#94A3B8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#colorInit)"
                />
                <Area
                  type="monotone"
                  dataKey="acceleratedBalance"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorAcc)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-500 text-center mt-2 italic">
            La courbe verte montre à quelle vitesse votre dette diminue et atteint 0 € bien avant l'échéance initiale en pointillés gris.
          </p>
        </div>
      ) : (
        <div>
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={costData}
                margin={{ top: 10, right: 15, left: 10, bottom: 0 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  tickFormatter={(val) => `${Math.round(val / 1000)}k€`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  tick={{ fontSize: 12, fill: '#334155', fontWeight: 600 }}
                  width={110}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    formatCurrency(Number(val), 0),
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <Bar
                  dataKey="Capital"
                  stackId="a"
                  fill="#3B82F6"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="Intérêts"
                  stackId="a"
                  fill="#F59E0B"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="Assurance"
                  stackId="a"
                  fill="#10B981"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap items-center justify-around gap-2 text-xs pt-3 border-t border-slate-100 text-slate-600">
            <div>
              <span className="font-semibold text-slate-800">Coût total initial :</span>{' '}
              {formatCurrency(initial.totalCost, 0)}
            </div>
            <div>
              <span className="font-semibold text-slate-800">Nouveau coût total :</span>{' '}
              <span className="text-emerald-700 font-bold">
                {formatCurrency(accelerated.totalCost, 0)}
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-800">Économie nette :</span>{' '}
              <span className="text-emerald-600 font-extrabold">
                -{formatCurrency(comparison.totalSaved, 0)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
