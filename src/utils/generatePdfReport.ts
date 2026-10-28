import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  LoanParameters,
  ExtraPaymentConfig,
  LoanComparison,
  InvestmentComparisonResult,
} from '../types/loan';
import { formatCurrency, formatDuration } from './loanCalculations';

export function generatePdfReport(
  params: LoanParameters,
  extraConfig: ExtraPaymentConfig,
  comparison: LoanComparison,
  annualReturnRate: number,
  investment: InvestmentComparisonResult
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor: [number, number, number] = [79, 70, 229]; // Indigo #4F46E5
  const emeraldColor: [number, number, number] = [16, 185, 129]; // Emerald #10B981
  const darkTextColor: [number, number, number] = [30, 41, 59]; // Slate 800
  const lightBg: [number, number, number] = [248, 250, 252]; // Slate 50

  const { initial, accelerated, monthsSaved, yearsSavedFormatted, interestSaved, totalSaved } = comparison;
  const hasExtra = extraConfig.monthlyExtra > 0 || (extraConfig.oneTimePayments && extraConfig.oneTimePayments.length > 0);

  // --- HEADER SECTION ---
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('OptiPrêt', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text("Rapport d'aide à la décision : Prêt immobilier, Sur-mensualité & Placement", 14, 18);

  const todayStr = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`Édité le ${todayStr}`, 196, 15, { align: 'right' });

  let y = 32;

  // --- SECTION 1: CONDITIONS DU PRÊT INITIAL ---
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('1. Conditions du Prêt Immobilier Initial', 14, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    head: [['Paramètre', 'Valeur contractuelle']],
    body: [
      ['Capital emprunté', formatCurrency(params.principal, 0)],
      ['Taux nominal annuel (hors assurance)', `${params.annualRate.toFixed(2)} %`],
      ['Durée contractuelle', `${params.durationYears} ans (${params.durationMonths} mois)`],
      ['Assurance emprunteur', `${params.insuranceRate.toFixed(2)} % annuel`],
      ['Mensualité initiale de base (hors ass.)', formatCurrency(initial.monthlyPaymentWithoutInsurance, 2)],
      ['Mensualité totale initiale (avec ass.)', formatCurrency(initial.initialTotalMonthlyPayment, 2)],
      ['Coût total des intérêts (sans sur-mensualité)', formatCurrency(initial.totalInterest, 0)],
      ['Date prévue de fin de prêt initiale', initial.endDateLabel || '—'],
    ],
    theme: 'striped',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { textColor: darkTextColor, fontSize: 8.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 100 },
      1: { cellWidth: 80, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  // @ts-ignore (lastAutoTable is added dynamically by jspdf-autotable)
  y = doc.lastAutoTable.finalY + 8;

  // --- SECTION 2: SYNTHÈSE DÉCISIONNELLE DE L'ACCÉLÉRATION ---
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text("2. Impact de la Sur-Mensualité (Aide à la Décision)", 14, y);
  y += 5;

  const startMonthNum = extraConfig.startMonth || 1;
  const startMonthDate = investment.placementStartDateLabel;
  const durationLabel = extraConfig.durationMonths ? `${extraConfig.durationMonths} mois` : 'Tout le reste du prêt';

  autoTable(doc, {
    startY: y,
    head: [['Indicateur d’optimisation', 'Résultat de la simulation']],
    body: [
      ['Montant supplémentaire ajouté', `+${formatCurrency(extraConfig.monthlyExtra, 0)} / mois`],
      ['Mois de démarrage de la sur-mensualité', `Mois N° ${startMonthNum} (${startMonthDate})`],
      ['Durée d’application de l’effort', durationLabel],
      ['Nouvelle mensualité totale payée', formatCurrency(initial.initialTotalMonthlyPayment + extraConfig.monthlyExtra, 2)],
      ['TEMPS GAGNÉ SUR LE CRÉDIT', hasExtra ? `${yearsSavedFormatted} (${monthsSaved} mois de moins)` : '0 mois'],
      ['NOUVELLE DATE DE LIBÉRATION DU PRÊT', hasExtra ? accelerated.endDateLabel : initial.endDateLabel],
      ['INTÉRÊTS ÉCONOMISÉS', hasExtra ? `${formatCurrency(interestSaved, 0)} (-${comparison.percentInterestReduced.toFixed(1)}%)` : '0 €'],
      ['GAIN GLOBAL NET (avec assurance économisée)', hasExtra ? formatCurrency(totalSaved, 0) : '0 €'],
    ],
    theme: 'striped',
    headStyles: { fillColor: emeraldColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { textColor: darkTextColor, fontSize: 8.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 100 },
      1: { cellWidth: 80, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  // @ts-ignore
  y = doc.lastAutoTable.finalY + 8;

  // --- SECTION 3: ARBITRAGE PLACEMENT DU CAPITAL SUPPLÉMENTAIRE ---
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text("3. Simulation du Placement du Surplus d'Épargne (Sans inflation)", 14, y);
  y += 5;

  const { investExtraOnly, breakEvenRate } = investment;
  const isPlacementBetter = annualReturnRate > breakEvenRate;

  autoTable(doc, {
    startY: y,
    head: [['Paramètre du placement', 'Résultat']],
    body: [
      ['Taux de rendement annuel net retenu', `${annualReturnRate.toFixed(2)} % / an`],
      ['Période de placement stipulée', `${formatDuration(investment.placementDurationMonths)} (du mois ${investment.placementStartMonth} à ${investment.placementEndDateLabel})`],
      ['Montant mensuel placé', `${formatCurrency(extraConfig.monthlyExtra, 0)} / mois`],
      ['Total du capital versé', formatCurrency(investExtraOnly.totalDeposited, 0)],
      ['Intérêts composés générés (plus-value)', `+${formatCurrency(investExtraOnly.interestEarned, 0)}`],
      ['CAPITAL FINAL CONSTITUÉ DISPONIBLE', formatCurrency(investExtraOnly.finalCapital, 0)],
      ['Taux pivot d’équilibre (Taux prêt + assurance)', `${breakEvenRate.toFixed(2)} %`],
      ['Arbitrage recommandé', isPlacementBetter
        ? `Placer génère +${formatCurrency(investExtraOnly.interestEarned - interestSaved, 0)} de plus que rembourser`
        : `Rembourser le prêt est plus rentable (+${formatCurrency(interestSaved - investExtraOnly.interestEarned, 0)} garantis)`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { textColor: darkTextColor, fontSize: 8.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 100 },
      1: { cellWidth: 80, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  // --- PAGE 2: TABLEAU D'AMORTISSEMENT ANNUEL ---
  doc.addPage();

  // Header on Page 2
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 16, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text("OptiPrêt — Tableau d'Amortissement Annuel Synthétique", 14, 11);
  doc.setFontSize(8);
  doc.text(`Page 2 / 2`, 196, 11, { align: 'right' });

  y = 24;
  doc.setTextColor(...darkTextColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(
    hasExtra
      ? `Échéancier avec sur-mensualité (+${extraConfig.monthlyExtra} €/mois à partir du mois ${startMonthNum})`
      : 'Échéancier contractuel de base',
    14,
    y
  );
  y += 4;

  const currentSchedule = hasExtra ? accelerated : initial;
  const rows = currentSchedule.yearlySchedule.map((yr) => [
    `${yr.calendarYear} (An ${yr.yearNumber})`,
    `${yr.monthsCount} mois`,
    formatCurrency(yr.principalPaid, 2),
    formatCurrency(yr.interestPaid, 2),
    formatCurrency(yr.insurancePaid, 2),
    hasExtra ? `+${formatCurrency(yr.extraPaid, 2)}` : '—',
    formatCurrency(yr.totalPaid, 2),
    formatCurrency(yr.endRemainingPrincipal, 2),
  ]);

  // Totals row
  const totals = currentSchedule.yearlySchedule.reduce(
    (acc, yr) => ({
      principal: acc.principal + yr.principalPaid,
      interest: acc.interest + yr.interestPaid,
      insurance: acc.insurance + yr.insurancePaid,
      extra: acc.extra + yr.extraPaid,
      total: acc.total + yr.totalPaid,
    }),
    { principal: 0, interest: 0, insurance: 0, extra: 0, total: 0 }
  );

  autoTable(doc, {
    startY: y,
    head: [
      [
        'Année',
        'Mois',
        'Capital Amorti',
        'Intérêts',
        'Assurance',
        'Sur-mensualité',
        'Total Payé',
        'Capital Restant Dû',
      ],
    ],
    body: rows,
    foot: [
      [
        'TOTAL',
        `${currentSchedule.actualMonths} mois`,
        formatCurrency(totals.principal, 2),
        formatCurrency(totals.interest, 2),
        formatCurrency(totals.insurance, 2),
        hasExtra ? `+${formatCurrency(totals.extra, 2)}` : '—',
        formatCurrency(totals.total, 2),
        '0,00 € (Soldé)',
      ],
    ],
    theme: 'striped',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { textColor: darkTextColor, fontSize: 7.5 },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 8 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right', fontStyle: 'bold' },
      7: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  // Footer note
  // @ts-ignore
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : 270;
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Note : Document de simulation financière indicatif établi selon les formules légales françaises d’amortissement à taux fixe.',
    14,
    Math.min(finalY, 285)
  );

  // Download PDF
  const filename = `Rapport_OptiPret_${params.principal}e_${params.annualRate}pct_${
    hasExtra ? `surmensualite_${extraConfig.monthlyExtra}e` : 'initial'
  }.pdf`;
  doc.save(filename);
}
