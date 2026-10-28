export interface LoanParameters {
  principal: number; // Montant emprunté en €
  annualRate: number; // Taux d'intérêt annuel en % (ex: 3.65)
  durationYears: number; // Durée en années (ex: 20)
  durationMonths: number; // Durée totale en mois (ex: 240)
  insuranceRate: number; // Taux annuel d'assurance en % (ex: 0.34)
  startDate: string; // Date de début au format YYYY-MM
  insuranceCalculationType: 'initial_principal' | 'remaining_balance'; // Base de calcul assurance
}

export interface ExtraPaymentConfig {
  monthlyExtra: number; // Montant ajouté chaque mois (€)
  startMonth: number; // À partir de quel mois appliquer le supplément (1 = premier mois)
  durationMonths?: number; // Durée en mois de la sur-mensualité (si non défini, s'applique jusqu'au terme du prêt)
  oneTimePayments: OneTimePayment[]; // Remboursements ponctuels exceptionnels
}

export interface OneTimePayment {
  id: string;
  month: number; // Mois d'application (1-indexé)
  amount: number; // Montant en €
  label: string; // Ex: "Prime annuelle", "Héritage", "Vente de véhicule"
}

export interface MonthlyAmortizationRow {
  monthIndex: number; // 1 to totalMonths
  yearNumber: number; // 1, 2, 3...
  date: string; // "MM/YYYY" or "YYYY-MM"
  dateLabel: string; // "Mars 2026"
  basePayment: number; // Mensualité contractuelle hors assurance
  extraPayment: number; // Sur-mensualité ou versement ponctuel ce mois-ci
  totalMonthlyPayment: number; // Mensualité totale payée (hors assurance)
  interestPayment: number; // Part intérêts
  principalPayment: number; // Part amortissement capital
  insurancePayment: number; // Part assurance
  totalWithInsurance: number; // Mensualité + assurance
  remainingPrincipal: number; // Capital restant dû en fin de mois
  cumulativeInterest: number; // Intérêts cumulés depuis le début
  cumulativePrincipal: number; // Capital remboursé cumulé
  cumulativeInsurance: number; // Assurance cumulée
}

export interface YearlyAmortizationRow {
  yearNumber: number;
  calendarYear: number;
  monthsCount: number;
  totalPaid: number;
  principalPaid: number;
  interestPaid: number;
  insurancePaid: number;
  extraPaid: number;
  endRemainingPrincipal: number;
  cumulativeInterest: number;
}

export interface LoanScheduleResult {
  monthlyPaymentWithoutInsurance: number;
  monthlyInsurancePayment: number;
  initialTotalMonthlyPayment: number;
  schedule: MonthlyAmortizationRow[];
  yearlySchedule: YearlyAmortizationRow[];
  actualMonths: number;
  totalInterest: number;
  totalInsurance: number;
  totalCost: number; // Intérêts + Assurance
  totalPaid: number; // Principal + Intérêts + Assurance
  endDate: string; // "MM/YYYY"
  endDateLabel: string; // "Avril 2044"
}

export interface LoanComparison {
  initial: LoanScheduleResult;
  accelerated: LoanScheduleResult;
  monthsSaved: number;
  yearsSavedFormatted: string;
  interestSaved: number;
  insuranceSaved: number;
  totalSaved: number;
  percentDurationReduced: number;
  percentInterestReduced: number;
  extraInvestedTotal: number;
  returnOnInvestmentRatio: number; // Euros économisés par euro supplémentaire injecté
}

export interface ScenarioImpact {
  extraMonthly: number;
  newMonthlyTotal: number;
  monthsSaved: number;
  durationLabel: string;
  interestSaved: number;
  insuranceSaved: number;
  totalSaved: number;
  endDateLabel: string;
  isCurrent: boolean;
}

export interface InvestmentConfig {
  annualReturnRate: number; // Taux de rendement annuel net en % (ex: 4.5)
  startMonth: number; // Mois de départ du placement
  durationMonths: number; // Nombre de mois stipulés pour le placement
}

export interface InvestmentTimelinePoint {
  monthInPlacement: number; // 0, 1, 2...
  loanMonth: number; // Le mois correspondant dans le prêt immobilier
  dateLabel: string; // Ex: "Mars 2028"
  deposited: number;
  cumulativeDeposited: number;
  interestEarned: number;
  balance: number;
}

export interface InvestmentComparisonResult {
  annualReturnRate: number;
  placementStartMonth: number;
  placementDurationMonths: number;
  placementStartDateLabel: string;
  placementEndDateLabel: string;
  // Option 1 : Placer le surplus (sur-mensualité) pendant le nombre de mois stipulé
  investExtraOnly: {
    startMonth: number;
    durationMonths: number;
    startDateLabel: string;
    endDateLabel: string;
    monthlyAmount: number;
    totalDeposited: number;
    interestEarned: number;
    finalCapital: number;
    timeline: InvestmentTimelinePoint[];
  };
  // Option 2 : Rembourser vite (+ΔM), PUIS placer la pleine mensualité libérée pendant les mois gagnés jusqu'au terme initial
  payOffThenInvestFreedMonthly: {
    monthsFreed: number;
    monthlyFreedPayment: number;
    totalDeposited: number;
    interestEarned: number;
    finalCapital: number;
    totalGainWithInterestSaved: number;
  };
  // Taux de rendement neutre (break-even)
  breakEvenRate: number;
}

