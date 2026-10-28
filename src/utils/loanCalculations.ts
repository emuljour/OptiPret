import {
  LoanParameters,
  ExtraPaymentConfig,
  LoanScheduleResult,
  MonthlyAmortizationRow,
  YearlyAmortizationRow,
  LoanComparison,
  ScenarioImpact,
  InvestmentComparisonResult,
  InvestmentTimelinePoint,
} from '../types/loan';

const MONTH_NAMES_FR = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

const MONTH_NAMES_SHORT_FR = [
  'Janv',
  'Févr',
  'Mars',
  'Avr',
  'Mai',
  'Juin',
  'Juil',
  'Août',
  'Sept',
  'Oct',
  'Nov',
  'Déc',
];

/**
 * Calcule la mensualité hors assurance d'un prêt à taux fixe
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRatePct: number,
  durationMonths: number
): number {
  if (principal <= 0 || durationMonths <= 0) return 0;
  if (annualRatePct <= 0) {
    return principal / durationMonths;
  }
  const monthlyRate = annualRatePct / 100 / 12;
  const payment =
    (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -durationMonths));
  return payment;
}

/**
 * Ajoute n mois à une date de départ YYYY-MM
 */
export function addMonthsToDate(
  startDateStr: string,
  monthsToAdd: number
): { date: string; label: string; year: number; month: number } {
  let [yearStr, monthStr] = (startDateStr || '2026-04').split('-');
  let year = parseInt(yearStr, 10) || 2026;
  let month = parseInt(monthStr, 10) || 4; // 1 to 12

  // monthsToAdd is 0 for first month
  const totalMonths = (year * 12 + (month - 1)) + monthsToAdd;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonthIndex = totalMonths % 12; // 0 to 11

  const mm = String(targetMonthIndex + 1).padStart(2, '0');
  const dateStr = `${targetYear}-${mm}`;
  const label = `${MONTH_NAMES_FR[targetMonthIndex]} ${targetYear}`;

  return {
    date: dateStr,
    label,
    year: targetYear,
    month: targetMonthIndex + 1,
  };
}

/**
 * Génère le tableau d'amortissement complet (mensuel et annuel)
 */
export function generateAmortizationSchedule(
  params: LoanParameters,
  extraConfig?: ExtraPaymentConfig
): LoanScheduleResult {
  const {
    principal,
    annualRate,
    durationMonths,
    insuranceRate,
    startDate,
    insuranceCalculationType,
  } = params;

  if (principal <= 0 || durationMonths <= 0) {
    return {
      monthlyPaymentWithoutInsurance: 0,
      monthlyInsurancePayment: 0,
      initialTotalMonthlyPayment: 0,
      schedule: [],
      yearlySchedule: [],
      actualMonths: 0,
      totalInterest: 0,
      totalInsurance: 0,
      totalCost: 0,
      totalPaid: 0,
      endDate: startDate,
      endDateLabel: '',
    };
  }

  const baseMonthlyPayment = calculateMonthlyPayment(
    principal,
    annualRate,
    durationMonths
  );

  // Assurance mensuelle de base
  const monthlyRate = annualRate / 100 / 12;
  const initialMonthlyInsurance = (principal * (insuranceRate / 100)) / 12;

  const rows: MonthlyAmortizationRow[] = [];
  let remainingPrincipal = principal;
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;
  let cumulativeInsurance = 0;

  const monthlyExtra = extraConfig?.monthlyExtra ?? 0;
  const extraStartMonth = extraConfig?.startMonth ?? 1;
  const oneTimePayments = extraConfig?.oneTimePayments ?? [];

  // Map des versements ponctuels par mois
  const oneTimeMap = new Map<number, number>();
  for (const otp of oneTimePayments) {
    if (otp.amount > 0 && otp.month > 0) {
      oneTimeMap.set(otp.month, (oneTimeMap.get(otp.month) || 0) + otp.amount);
    }
  }

  // Boucle mois par mois (sécurité à 600 mois = 50 ans)
  const maxSafetyMonths = 600;
  let m = 1;

  while (remainingPrincipal > 0.005 && m <= maxSafetyMonths) {
    const dateInfo = addMonthsToDate(startDate, m - 1);

    // Intérêts du mois
    const interestPayment = remainingPrincipal * monthlyRate;

    // Assurance pour ce mois
    let insurancePayment = 0;
    if (insuranceRate > 0) {
      if (insuranceCalculationType === 'remaining_balance') {
        insurancePayment = (remainingPrincipal * (insuranceRate / 100)) / 12;
      } else {
        insurancePayment = initialMonthlyInsurance;
      }
    }

    // Sur-mensualité ce mois-ci
    let currentExtra = 0;
    const extraEndMonth = extraConfig?.durationMonths
      ? extraStartMonth + extraConfig.durationMonths - 1
      : Infinity;

    if (m >= extraStartMonth && m <= extraEndMonth) {
      currentExtra += monthlyExtra;
    }
    const oneTime = oneTimeMap.get(m) || 0;
    currentExtra += oneTime;

    // Mensualité totale voulue (hors assurance)
    let totalTargetPayment = baseMonthlyPayment + currentExtra;

    // Cas de la dernière mensualité : si le capital restant dû + intérêts <= paiement prévu
    let principalPayment = 0;
    let actualBasePayment = baseMonthlyPayment;
    let actualExtraPayment = currentExtra;
    let actualTotalMonthlyPayment = totalTargetPayment;

    const totalDueThisMonth = remainingPrincipal + interestPayment;

    if (totalDueThisMonth <= totalTargetPayment || m === maxSafetyMonths) {
      // Fin du prêt
      principalPayment = remainingPrincipal;
      actualTotalMonthlyPayment = totalDueThisMonth;

      // Répartition entre base et extra
      if (actualTotalMonthlyPayment <= baseMonthlyPayment) {
        actualBasePayment = actualTotalMonthlyPayment;
        actualExtraPayment = 0;
      } else {
        actualBasePayment = baseMonthlyPayment;
        actualExtraPayment = actualTotalMonthlyPayment - baseMonthlyPayment;
      }

      remainingPrincipal = 0;
    } else {
      principalPayment = totalTargetPayment - interestPayment;
      remainingPrincipal -= principalPayment;
    }

    cumulativeInterest += interestPayment;
    cumulativePrincipal += principalPayment;
    cumulativeInsurance += insurancePayment;

    rows.push({
      monthIndex: m,
      yearNumber: Math.ceil(m / 12),
      date: dateInfo.date,
      dateLabel: dateInfo.label,
      basePayment: actualBasePayment,
      extraPayment: actualExtraPayment,
      totalMonthlyPayment: actualTotalMonthlyPayment,
      interestPayment,
      principalPayment,
      insurancePayment,
      totalWithInsurance: actualTotalMonthlyPayment + insurancePayment,
      remainingPrincipal: Math.max(0, remainingPrincipal),
      cumulativeInterest,
      cumulativePrincipal,
      cumulativeInsurance,
    });

    if (remainingPrincipal <= 0.005) {
      break;
    }

    m++;
  }

  // Aggrégation par année
  const yearlyMap = new Map<number, YearlyAmortizationRow>();

  rows.forEach((row) => {
    const calYear = parseInt(row.date.split('-')[0], 10);
    const existing = yearlyMap.get(calYear);

    if (!existing) {
      yearlyMap.set(calYear, {
        yearNumber: row.yearNumber,
        calendarYear: calYear,
        monthsCount: 1,
        totalPaid: row.totalWithInsurance,
        principalPaid: row.principalPayment,
        interestPaid: row.interestPayment,
        insurancePaid: row.insurancePayment,
        extraPaid: row.extraPayment,
        endRemainingPrincipal: row.remainingPrincipal,
        cumulativeInterest: row.cumulativeInterest,
      });
    } else {
      existing.monthsCount += 1;
      existing.totalPaid += row.totalWithInsurance;
      existing.principalPaid += row.principalPayment;
      existing.interestPaid += row.interestPayment;
      existing.insurancePaid += row.insurancePayment;
      existing.extraPaid += row.extraPayment;
      existing.endRemainingPrincipal = row.remainingPrincipal;
      existing.cumulativeInterest = row.cumulativeInterest;
    }
  });

  const yearlySchedule = Array.from(yearlyMap.values());
  const actualMonths = rows.length;
  const lastRow = rows[rows.length - 1];

  return {
    monthlyPaymentWithoutInsurance: baseMonthlyPayment,
    monthlyInsurancePayment: initialMonthlyInsurance,
    initialTotalMonthlyPayment: baseMonthlyPayment + initialMonthlyInsurance,
    schedule: rows,
    yearlySchedule,
    actualMonths,
    totalInterest: cumulativeInterest,
    totalInsurance: cumulativeInsurance,
    totalCost: cumulativeInterest + cumulativeInsurance,
    totalPaid: cumulativePrincipal + cumulativeInterest + cumulativeInsurance,
    endDate: lastRow ? lastRow.date : startDate,
    endDateLabel: lastRow ? lastRow.dateLabel : '',
  };
}

/**
 * Compare le prêt initial et le prêt accéléré avec sur-mensualité
 */
export function compareLoans(
  params: LoanParameters,
  extraConfig: ExtraPaymentConfig
): LoanComparison {
  const initial = generateAmortizationSchedule(params);
  const accelerated = generateAmortizationSchedule(params, extraConfig);

  const monthsSaved = Math.max(0, initial.actualMonths - accelerated.actualMonths);
  const interestSaved = Math.max(0, initial.totalInterest - accelerated.totalInterest);
  const insuranceSaved = Math.max(0, initial.totalInsurance - accelerated.totalInsurance);
  const totalSaved = interestSaved + insuranceSaved;

  const percentDurationReduced =
    initial.actualMonths > 0 ? (monthsSaved / initial.actualMonths) * 100 : 0;
  const percentInterestReduced =
    initial.totalInterest > 0 ? (interestSaved / initial.totalInterest) * 100 : 0;

  // Montant total du supplément injecté
  const extraInvestedTotal = accelerated.schedule.reduce(
    (acc, row) => acc + row.extraPayment,
    0
  );

  // Pour chaque euro supplémentaire investi dans la mensualité, combien d'intérêts a-t-on sauvé ?
  const returnOnInvestmentRatio =
    extraInvestedTotal > 0 ? interestSaved / extraInvestedTotal : 0;

  return {
    initial,
    accelerated,
    monthsSaved,
    yearsSavedFormatted: formatDuration(monthsSaved),
    interestSaved,
    insuranceSaved,
    totalSaved,
    percentDurationReduced,
    percentInterestReduced,
    extraInvestedTotal,
    returnOnInvestmentRatio,
  };
}

/**
 * Formate une durée en mois en texte français ("3 ans et 2 mois", "10 mois", "1 an")
 */
export function formatDuration(totalMonths: number): string {
  if (totalMonths <= 0) return '0 mois';
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (years === 0) {
    return `${months} mois`;
  }
  if (months === 0) {
    return years === 1 ? '1 an' : `${years} ans`;
  }
  return `${years} an${years > 1 ? 's' : ''} et ${months} mois`;
}

/**
 * Formate un nombre en Euros (€)
 */
export function formatCurrency(
  val: number,
  decimals: number = 0,
  includeSymbol: boolean = true
): string {
  if (isNaN(val) || val === null || val === undefined) {
    return includeSymbol ? '0 €' : '0';
  }
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);

  return includeSymbol ? `${formatted} €` : formatted;
}

/**
 * Formate un pourcentage
 */
export function formatPercent(val: number, decimals: number = 2): string {
  if (isNaN(val)) return '0 %';
  return `${new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val)} %`;
}

/**
 * Calcule une matrice d'impacts pour plusieurs montants de sur-mensualité
 */
export function calculateScenarioMatrix(
  params: LoanParameters,
  currentExtraMonthly: number
): ScenarioImpact[] {
  const presets = [25, 50, 75, 100, 150, 200, 250, 300, 400, 500];

  // Inclure aussi currentExtraMonthly s'il n'est pas déjà dans les presets et > 0
  const uniqueAmounts = Array.from(
    new Set(
      [
        ...presets,
        ...(currentExtraMonthly > 0 ? [Math.round(currentExtraMonthly)] : []),
      ].sort((a, b) => a - b)
    )
  );

  const initial = generateAmortizationSchedule(params);

  return uniqueAmounts.map((extra) => {
    const accelerated = generateAmortizationSchedule(params, {
      monthlyExtra: extra,
      startMonth: 1,
      oneTimePayments: [],
    });

    const monthsSaved = Math.max(0, initial.actualMonths - accelerated.actualMonths);
    const interestSaved = Math.max(
      0,
      initial.totalInterest - accelerated.totalInterest
    );
    const insuranceSaved = Math.max(
      0,
      initial.totalInsurance - accelerated.totalInsurance
    );

    return {
      extraMonthly: extra,
      newMonthlyTotal:
        initial.monthlyPaymentWithoutInsurance +
        extra +
        initial.monthlyInsurancePayment,
      monthsSaved,
      durationLabel: formatDuration(monthsSaved),
      interestSaved,
      insuranceSaved,
      totalSaved: interestSaved + insuranceSaved,
      endDateLabel: accelerated.endDateLabel,
      isCurrent: Math.round(currentExtraMonthly) === extra,
    };
  });
}

/**
 * Exporte le tableau d'amortissement au format CSV
 */
export function exportAmortizationToCSV(
  schedule: MonthlyAmortizationRow[],
  params: LoanParameters,
  isAccelerated: boolean,
  extraAmount: number
): void {
  const headers = [
    'Mois',
    'Date',
    'Mensualité contractuelle (€)',
    'Sur-mensualité (€)',
    'Total mensualité hors ass. (€)',
    'Part Intérêts (€)',
    'Part Capital amorti (€)',
    'Assurance (€)',
    'Total avec assurance (€)',
    'Capital restant dû (€)',
    'Cumul Intérêts (€)',
  ];

  const rowsData = schedule.map((row) => [
    row.monthIndex,
    row.dateLabel,
    row.basePayment.toFixed(2).replace('.', ','),
    row.extraPayment.toFixed(2).replace('.', ','),
    row.totalMonthlyPayment.toFixed(2).replace('.', ','),
    row.interestPayment.toFixed(2).replace('.', ','),
    row.principalPayment.toFixed(2).replace('.', ','),
    row.insurancePayment.toFixed(2).replace('.', ','),
    row.totalWithInsurance.toFixed(2).replace('.', ','),
    row.remainingPrincipal.toFixed(2).replace('.', ','),
    row.cumulativeInterest.toFixed(2).replace('.', ','),
  ]);

  const csvContent =
    'sep=;\n' +
    [
      `# Simulation OptiPrêt - ${
        isAccelerated
          ? `Prêt avec sur-mensualité (+${extraAmount} €/mois)`
          : 'Prêt initial de base'
      }`,
      `# Montant emprunté : ${params.principal} € | Taux : ${params.annualRate}% | Durée : ${params.durationYears} ans (${params.durationMonths} mois) | Assurance : ${params.insuranceRate}%`,
      headers.join(';'),
      ...rowsData.map((e) => e.join(';')),
    ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `tableau_amortissement_${params.principal}e_${params.annualRate}pct_${
      isAccelerated ? `surmensualite_${extraAmount}e` : 'initial'
    }.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Calcule l'épargne constituée en plaçant le capital supplémentaire (sur-mensualité)
 * en commençant au mois stipulé et pour la durée de mois choisie (sans inflation)
 */
export function calculateInvestmentComparison(
  params: LoanParameters,
  extraConfig: ExtraPaymentConfig,
  annualReturnRatePct: number,
  comparison: LoanComparison,
  customStartMonth?: number,
  customDurationMonths?: number
): InvestmentComparisonResult {
  // Le mois où démarre l'augmentation de la mensualité / placement (1-indexé)
  const startMonth = Math.max(1, customStartMonth ?? extraConfig.startMonth ?? 1);

  // Durée en mois stipulée pour le placement
  // Par défaut : la durée restante du prêt depuis startMonth
  const remainingLoanMonths = Math.max(1, params.durationMonths - startMonth + 1);
  const durationMonths = Math.max(
    1,
    customDurationMonths ?? extraConfig.durationMonths ?? remainingLoanMonths
  );

  const monthlyExtra = extraConfig.monthlyExtra;
  const monthlyRate =
    annualReturnRatePct > 0 ? annualReturnRatePct / 100 / 12 : 0;

  const startDateInfo = addMonthsToDate(params.startDate, startMonth - 1);
  const endDateInfo = addMonthsToDate(
    params.startDate,
    startMonth + durationMonths - 2
  );

  // Le point de départ (Mois 0 du placement = exact mois de mise en place)
  const timeline: InvestmentTimelinePoint[] = [
    {
      monthInPlacement: 0,
      loanMonth: startMonth,
      dateLabel: `${startDateInfo.label} (Mois ${startMonth})`,
      deposited: 0,
      cumulativeDeposited: 0,
      interestEarned: 0,
      balance: 0,
    },
  ];

  let balance = 0;
  let totalDeposited = 0;

  for (let k = 1; k <= durationMonths; k++) {
    const loanM = startMonth + k - 1;
    const dateInfo = addMonthsToDate(params.startDate, loanM - 1);

    const interestThisMonth = balance * monthlyRate;
    balance += interestThisMonth;

    let deposit = monthlyExtra;
    // Versements ponctuels enregistrés ce mois-ci
    const oneTime = (extraConfig.oneTimePayments || [])
      .filter((p) => p.month === loanM)
      .reduce((sum, p) => sum + p.amount, 0);
    deposit += oneTime;

    balance += deposit;
    totalDeposited += deposit;
    const cumulativeInterest = Math.max(0, balance - totalDeposited);

    timeline.push({
      monthInPlacement: k,
      loanMonth: loanM,
      dateLabel: `${dateInfo.label} (Mois ${loanM})`,
      deposited: deposit,
      cumulativeDeposited: totalDeposited,
      interestEarned: cumulativeInterest,
      balance: Math.round(balance),
    });
  }

  const interestEarned = Math.max(0, balance - totalDeposited);

  // Option 2 : Rembourser par anticipation avec la sur-mensualité,
  // PUIS une fois le prêt soldé (mois gagnés), placer la mensualité libérée complète jusqu'au terme initial !
  const monthsFreed = comparison.monthsSaved;
  const monthlyFreedPayment =
    comparison.initial.initialTotalMonthlyPayment + monthlyExtra;
  let balanceFreed = 0;
  let depositedFreed = 0;

  for (let m = 1; m <= monthsFreed; m++) {
    const interestThisMonth = balanceFreed * monthlyRate;
    balanceFreed += interestThisMonth + monthlyFreedPayment;
    depositedFreed += monthlyFreedPayment;
  }
  const interestEarnedFreed = Math.max(0, balanceFreed - depositedFreed);

  // Taux de break-even approximatif (taux du crédit + assurance)
  const breakEvenRate = params.annualRate + params.insuranceRate;

  return {
    annualReturnRate: annualReturnRatePct,
    placementStartMonth: startMonth,
    placementDurationMonths: durationMonths,
    placementStartDateLabel: startDateInfo.label,
    placementEndDateLabel: endDateInfo.label,
    investExtraOnly: {
      startMonth,
      durationMonths,
      startDateLabel: startDateInfo.label,
      endDateLabel: endDateInfo.label,
      monthlyAmount: monthlyExtra,
      totalDeposited,
      interestEarned,
      finalCapital: balance,
      timeline,
    },
    payOffThenInvestFreedMonthly: {
      monthsFreed,
      monthlyFreedPayment,
      totalDeposited: depositedFreed,
      interestEarned: interestEarnedFreed,
      finalCapital: balanceFreed,
      totalGainWithInterestSaved: balanceFreed + comparison.interestSaved,
    },
    breakEvenRate,
  };
}

