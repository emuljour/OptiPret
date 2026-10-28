import React from 'react';
import {
  Lightbulb,
  CheckCircle,
  HelpCircle,
  PiggyBank,
  FileText,
  Percent,
} from 'lucide-react';
import { LoanParameters } from '../types/loan';

interface AdvisorNotesProps {
  params: LoanParameters;
}

export const AdvisorNotes: React.FC<AdvisorNotesProps> = ({ params }) => {
  return (
    <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-800">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">
            Guide Décisionnel & Conseils d'Expert
          </h3>
          <p className="text-xs text-slate-400">
            Ce que votre banquier ne vous dit pas toujours sur l'accélération d'un prêt
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Conseil 1 */}
        <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1.5">
            <FileText className="w-4 h-4" />
            Clause de Modularité Gratuite
          </div>
          <p className="text-slate-300 leading-relaxed">
            La quasi-totalité des contrats de prêt immobilier en France comportent une{' '}
            <strong className="text-white">clause de modularité d'échéances</strong>.
            Elle vous permet souvent d'augmenter votre mensualité de 10% à 30% par an sans aucun frais ni avenant notarié !
          </p>
        </div>

        {/* Conseil 2 */}
        <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
          <div className="flex items-center gap-1.5 text-indigo-400 font-semibold mb-1.5">
            <PiggyBank className="w-4 h-4" />
            Rendement garanti sans risque
          </div>
          <p className="text-slate-300 leading-relaxed">
            Rembourser du capital sur un crédit à{' '}
            <strong className="text-white">{params.annualRate.toFixed(2)}%</strong>{' '}
            équivaut mathématiquement à un placement financier garanti à ce taux,{' '}
            <strong className="text-white">net d'impôts et sans prélèvements sociaux</strong>.
          </p>
        </div>

        {/* Conseil 3 */}
        <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1.5">
            <Percent className="w-4 h-4" />
            Taux d'endettement (35% max)
          </div>
          <p className="text-slate-300 leading-relaxed">
            Assurez-vous que l'augmentation de la mensualité respecte votre budget et le seuil HCSF de 35% de vos revenus mensuels, tout en conservant une épargne de précaution de 3 à 6 mois de dépenses.
          </p>
        </div>
      </div>
    </div>
  );
};
