import React, { useState, useMemo } from 'react';
import {
  Table,
  Download,
  FileDown,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  Search,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  MonthlyAmortizationRow,
  YearlyAmortizationRow,
  LoanParameters,
  ExtraPaymentConfig,
} from '../types/loan';
import {
  formatCurrency,
  exportAmortizationToCSV,
} from '../utils/loanCalculations';

interface AmortizationTableProps {
  monthlySchedule: MonthlyAmortizationRow[];
  yearlySchedule: YearlyAmortizationRow[];
  params: LoanParameters;
  extraConfig: ExtraPaymentConfig;
  isAccelerated: boolean;
  onExportPdf?: () => void;
}

export const AmortizationTable: React.FC<AmortizationTableProps> = ({
  monthlySchedule,
  yearlySchedule,
  params,
  extraConfig,
  isAccelerated,
  onExportPdf,
}) => {
  const [viewMode, setViewMode] = useState<'yearly' | 'monthly'>('yearly');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const rowsPerPage = 24; // 2 years per page for monthly

  // Unique calendar years for filter
  const calendarYears = useMemo(() => {
    return Array.from(
      new Set(monthlySchedule.map((r) => r.date.split('-')[0]))
    );
  }, [monthlySchedule]);

  // Filtered monthly rows
  const filteredMonthly = useMemo(() => {
    if (selectedYearFilter === 'all') return monthlySchedule;
    return monthlySchedule.filter((r) => r.date.startsWith(selectedYearFilter));
  }, [monthlySchedule, selectedYearFilter]);

  const totalPages = Math.ceil(filteredMonthly.length / rowsPerPage);
  const paginatedMonthly = useMemo(() => {
    if (selectedYearFilter !== 'all') return filteredMonthly;
    const start = (page - 1) * rowsPerPage;
    return filteredMonthly.slice(start, start + rowsPerPage);
  }, [filteredMonthly, page, rowsPerPage, selectedYearFilter]);

  // Totals for yearly table
  const totalsYearly = useMemo(() => {
    return yearlySchedule.reduce(
      (acc, row) => ({
        totalPaid: acc.totalPaid + row.totalPaid,
        principalPaid: acc.principalPaid + row.principalPaid,
        interestPaid: acc.interestPaid + row.interestPaid,
        insurancePaid: acc.insurancePaid + row.insurancePaid,
        extraPaid: acc.extraPaid + row.extraPaid,
      }),
      {
        totalPaid: 0,
        principalPaid: 0,
        interestPaid: 0,
        insurancePaid: 0,
        extraPaid: 0,
      }
    );
  }, [yearlySchedule]);

  const handleExport = () => {
    exportAmortizationToCSV(
      monthlySchedule,
      params,
      isAccelerated,
      extraConfig.monthlyExtra
    );
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
      {/* Table Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Table className="w-5 h-5 text-indigo-600" />
            Tableau d'Amortissement Détaillé
            {isAccelerated && (
              <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Prêt avec sur-mensualité (+{extraConfig.monthlyExtra} €/m)
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500">
            Échéancier complet mois par mois ou condensé par année
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setViewMode('yearly');
                setSelectedYearFilter('all');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'yearly'
                  ? 'bg-white text-indigo-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vue Annuelle
            </button>
            <button
              type="button"
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'monthly'
                  ? 'bg-white text-indigo-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vue Mensuelle ({monthlySchedule.length} mois)
            </button>
          </div>

          {/* Export Buttons */}
          {onExportPdf && (
            <button
              type="button"
              onClick={onExportPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              title="Télécharger le rapport de simulation complet en PDF"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Télécharger le PDF</span>
            </button>
          )}

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
            title="Télécharger l'échéancier au format Excel / CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter bar for monthly view */}
      {viewMode === 'monthly' && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-slate-600">Filtrer par année :</span>
            <select
              value={selectedYearFilter}
              onChange={(e) => {
                setSelectedYearFilter(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-medium focus:border-indigo-500 outline-none"
            >
              <option value="all">Toutes les années ({monthlySchedule.length} mois)</option>
              {calendarYears.map((yr) => (
                <option key={yr} value={yr}>
                  Année {yr}
                </option>
              ))}
            </select>
          </div>

          {selectedYearFilter === 'all' && totalPages > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500">
                Page {page} / {totalPages} (mois {(page - 1) * rowsPerPage + 1} à{' '}
                {Math.min(page * rowsPerPage, monthlySchedule.length)})
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TABLE CONTENT */}
      {viewMode === 'yearly' ? (
        /* YEARLY TABLE */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 uppercase tracking-wider text-[10px] font-semibold">
                <th className="py-2.5 px-3">Année</th>
                <th className="py-2.5 px-3">Mois</th>
                <th className="py-2.5 px-3 text-right">Amortissement Capital</th>
                <th className="py-2.5 px-3 text-right">Intérêts payés</th>
                <th className="py-2.5 px-3 text-right">Assurance</th>
                {isAccelerated && (
                  <th className="py-2.5 px-3 text-right text-emerald-700">
                    Sur-mensualités
                  </th>
                )}
                <th className="py-2.5 px-3 text-right">Total Annuel</th>
                <th className="py-2.5 px-3 text-right font-bold">
                  Capital Restant Dû
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {yearlySchedule.map((yr) => (
                <tr key={yr.calendarYear} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3 font-bold text-slate-900">
                    {yr.calendarYear}{' '}
                    <span className="text-[10px] text-slate-400 font-normal">
                      (An {yr.yearNumber})
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">
                    {yr.monthsCount} mois
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-slate-800 tabular-nums">
                    {formatCurrency(yr.principalPaid, 2)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-amber-700 font-semibold tabular-nums">
                    {formatCurrency(yr.interestPaid, 2)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-teal-700 tabular-nums">
                    {formatCurrency(yr.insurancePaid, 2)}
                  </td>
                  {isAccelerated && (
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600 tabular-nums">
                      +{formatCurrency(yr.extraPaid, 2)}
                    </td>
                  )}
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900 tabular-nums">
                    {formatCurrency(yr.totalPaid, 2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-indigo-900 tabular-nums">
                    {formatCurrency(yr.endRemainingPrincipal, 2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 bg-slate-100/80 font-bold text-slate-900 text-xs">
                <td className="py-3 px-3">TOTAL</td>
                <td className="py-3 px-3 text-slate-600">
                  {monthlySchedule.length} mois
                </td>
                <td className="py-3 px-3 text-right tabular-nums">
                  {formatCurrency(totalsYearly.principalPaid, 2)}
                </td>
                <td className="py-3 px-3 text-right text-amber-800 tabular-nums">
                  {formatCurrency(totalsYearly.interestPaid, 2)}
                </td>
                <td className="py-3 px-3 text-right text-teal-800 tabular-nums">
                  {formatCurrency(totalsYearly.insurancePaid, 2)}
                </td>
                {isAccelerated && (
                  <td className="py-3 px-3 text-right text-emerald-700 tabular-nums font-black">
                    +{formatCurrency(totalsYearly.extraPaid, 2)}
                  </td>
                )}
                <td className="py-3 px-3 text-right tabular-nums font-black">
                  {formatCurrency(totalsYearly.totalPaid, 2)}
                </td>
                <td className="py-3 px-3 text-right text-emerald-700 font-black">
                  0,00 € (Soldé)
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        /* MONTHLY DETAILED TABLE */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 uppercase tracking-wider text-[10px] font-semibold">
                <th className="py-2.5 px-3">N°</th>
                <th className="py-2.5 px-3">Mois / Date</th>
                <th className="py-2.5 px-3 text-right">Mensualité de base</th>
                {isAccelerated && (
                  <th className="py-2.5 px-3 text-right text-emerald-700">
                    Sur-mensualité
                  </th>
                )}
                <th className="py-2.5 px-3 text-right">Intérêts</th>
                <th className="py-2.5 px-3 text-right">Capital amorti</th>
                <th className="py-2.5 px-3 text-right">Assurance</th>
                <th className="py-2.5 px-3 text-right">Total payé</th>
                <th className="py-2.5 px-3 text-right font-bold">
                  Capital Restant Dû
                </th>
                <th className="py-2.5 px-3 text-right text-slate-400">
                  Cumul Intérêts
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginatedMonthly.map((row) => (
                <tr key={row.monthIndex} className="hover:bg-slate-50/80 transition">
                  <td className="py-2 px-3 text-slate-400 tabular-nums font-mono">
                    #{row.monthIndex}
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-800">
                    {row.dateLabel}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-600 tabular-nums">
                    {formatCurrency(row.basePayment, 2)}
                  </td>
                  {isAccelerated && (
                    <td className="py-2 px-3 text-right font-bold text-emerald-600 tabular-nums">
                      {row.extraPayment > 0
                        ? `+${formatCurrency(row.extraPayment, 2)}`
                        : '—'}
                    </td>
                  )}
                  <td className="py-2 px-3 text-right text-amber-700 font-medium tabular-nums">
                    {formatCurrency(row.interestPayment, 2)}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-800 font-semibold tabular-nums">
                    {formatCurrency(row.principalPayment, 2)}
                  </td>
                  <td className="py-2 px-3 text-right text-teal-700 tabular-nums">
                    {formatCurrency(row.insurancePayment, 2)}
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900 tabular-nums">
                    {formatCurrency(row.totalWithInsurance, 2)}
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-indigo-950 tabular-nums">
                    {formatCurrency(row.remainingPrincipal, 2)}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-400 tabular-nums">
                    {formatCurrency(row.cumulativeInterest, 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
