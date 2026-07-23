// jsPDF (+jspdf-autotable when a table is present) — dynamically imported,
// same "only fetch on click" pattern as the exceljs export on the Sales
// Report page (see buildSalesReportWorkbook in MwasalatAdminSalesReportPage.jsx).
// Known v1 limitation: core jsPDF has no Arabic text shaping/BiDi without
// embedding a Unicode Arabic font, so this renders solidly for English
// answers only — Arabic PDF export is a fast-follow, not this pass.
const INK_RGB = [35, 24, 26]; // mwasalatInk-500

export async function downloadAiAnswerPdf({ question, answer, table, chart }) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();

  const marginX = 14;
  const pageWidth = doc.internal.pageSize.getWidth() - marginX * 2;
  let y = 18;

  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Mwasalat AI Assistant', marginX, y);
  y += 10;

  if (question) {
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Question', marginX, y);
    y += 5;
    doc.setFont(undefined, 'normal');
    const questionLines = doc.splitTextToSize(question, pageWidth);
    doc.text(questionLines, marginX, y);
    y += questionLines.length * 5 + 4;
  }

  doc.setFont(undefined, 'bold');
  doc.text('Answer', marginX, y);
  y += 5;
  doc.setFont(undefined, 'normal');
  const plainAnswer = (answer ?? '').replace(/\*\*/g, '');
  const answerLines = doc.splitTextToSize(plainAnswer, pageWidth);
  doc.text(answerLines, marginX, y);
  y += answerLines.length * 5 + 6;

  if (chart?.series?.length) {
    doc.setFont(undefined, 'bold');
    doc.text(chart.title || 'Chart data', marginX, y);
    y += 6;
    doc.setFont(undefined, 'normal');
    chart.series.forEach((point) => {
      doc.text(`${point.label}: ${point.value}${chart.unit ? ` ${chart.unit}` : ''}`, marginX, y);
      y += 5;
    });
    y += 4;
  }

  if (table?.rows?.length) {
    const { default: autoTable } = await import('jspdf-autotable');
    autoTable(doc, {
      startY: y,
      head: [table.columns ?? []],
      body: table.rows ?? [],
      styles: { fontSize: 9 },
      headStyles: { fillColor: INK_RGB },
    });
  }

  doc.save(`mwasalat-ai-answer-${Date.now()}.pdf`);
}
