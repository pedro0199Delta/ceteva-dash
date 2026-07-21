import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { RelatorioData } from "@/lib/domain/relatorio";

function fmtNum(n: number): string {
  return n.toLocaleString("pt-BR");
}

function fmtPct(n: number): string {
  return (
    n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%"
  );
}

function labelMaquina(id: string): string {
  return id === "—" ? "Sem máq." : id;
}

function nomeArquivo(): string {
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return `relatorio-ceteva-${stamp}.pdf`;
}

function desenharBarra(
  doc: jsPDF,
  x: number,
  y: number,
  largura: number,
  altura: number,
  pct: number,
  cor: [number, number, number],
) {
  const preenchido = Math.max(0, Math.min(largura, largura * (pct / 100)));
  doc.setFillColor(230, 235, 245);
  doc.rect(x, y, largura, altura, "F");
  if (preenchido > 0) {
    doc.setFillColor(...cor);
    doc.rect(x, y, preenchido, altura, "F");
  }
}

export function exportarRelatorioPdf(
  relatorio: RelatorioData,
  maxFalhasCategoria: number,
): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 14;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de produção", 14, y);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("Elgin · CETEVA", pageW - 14, y, { align: "right" });
  doc.setTextColor(0);
  y += 8;

  doc.setFontSize(10);
  doc.text(`Período: ${relatorio.periodo.descricao}`, 14, y);
  y += 10;

  const cards = [
    {
      titulo: "TOTAL DE UNIDADES TESTADAS",
      valor: fmtNum(relatorio.resumo.total),
      cor: [59, 130, 246] as [number, number, number],
    },
    {
      titulo: "UNIDADES APROVADAS",
      valor: fmtNum(relatorio.resumo.aprovados),
      cor: [21, 128, 61] as [number, number, number],
    },
    {
      titulo: "UNIDADES REPROVADAS",
      valor: fmtNum(relatorio.resumo.reprovados),
      cor: [220, 38, 38] as [number, number, number],
    },
    {
      titulo: "TAXA GERAL DE APROVAÇÃO",
      valor: fmtPct(relatorio.resumo.taxa),
      cor: [124, 58, 237] as [number, number, number],
    },
  ];

  const gap = 3;
  const cardW = (pageW - 28 - gap * 3) / 4;
  const cardH = 22;

  cards.forEach((card, i) => {
    const x = 14 + i * (cardW + gap);
    doc.setFillColor(...card.cor);
    doc.roundedRect(x, y, cardW, cardH, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(doc.splitTextToSize(card.titulo, cardW - 4), x + cardW / 2, y + 6, {
      align: "center",
    });
    doc.setFontSize(16);
    doc.text(card.valor, x + cardW / 2, y + 16, { align: "center" });
  });

  doc.setTextColor(0);
  y += cardH + 10;

  doc.setFillColor(37, 99, 235);
  doc.rect(14, y, pageW - 28, 7, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("DESEMPENHO POR MÁQUINA", 16, y + 5);
  doc.setTextColor(0);
  y += 9;

  const maquinaBody =
    relatorio.maquinas.length === 0
      ? [["—", "0", "0", "0", "", "0,0%"]]
      : relatorio.maquinas.map((m) => [
          m.label,
          fmtNum(m.testados),
          fmtNum(m.aprovados),
          fmtNum(m.reprovados),
          "",
          fmtPct(m.participacaoFalhas),
        ]);

  autoTable(doc, {
    startY: y,
    head: [
      [
        "Máquina",
        "Testados",
        "Aprovados",
        "Reprovados",
        "Taxa de aprovação",
        "Participação nas falhas",
      ],
    ],
    body: maquinaBody,
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9, cellPadding: 2.5, valign: "middle" },
    headStyles: {
      fillColor: [243, 246, 252],
      textColor: [86, 98, 125],
      fontStyle: "bold",
    },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
      5: { halign: "right" },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didDrawCell: (data) => {
      if (data.section !== "body" || data.column.index !== 4) return;
      const maquina = relatorio.maquinas[data.row.index];
      if (!maquina) return;

      const { x, y: cy, width, height } = data.cell;
      const barW = width - 22;
      desenharBarra(doc, x + 2, cy + height / 2 - 1.2, barW, 2.4, maquina.taxa, [37, 99, 235]);
      doc.setFontSize(8);
      doc.setTextColor(0);
      doc.text(fmtPct(maquina.taxa), x + width - 2, cy + height / 2 + 1, { align: "right" });
    },
  });

  y = doc.lastAutoTable.finalY + 10;

  if (y > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage();
    y = 14;
  }

  doc.setFillColor(37, 99, 235);
  doc.rect(14, y, pageW - 28, 7, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("ANÁLISE DE FALHAS POR CATEGORIA", 16, y + 5);
  doc.setTextColor(0);
  y += 9;

  const colsMaquina = relatorio.maquinaIds.map(labelMaquina);
  const headCategorias = ["Categoria", ...colsMaquina, "Total", "% do total de falhas"];
  const idxTotal = headCategorias.length - 2;

  const categoriaBody = relatorio.categoriasFalha.map((c) => [
    c.label,
    ...relatorio.maquinaIds.map((id) => fmtNum(c.porMaquina[id] ?? 0)),
    "",
    fmtPct(c.percentualFalhas),
  ]);

  autoTable(doc, {
    startY: y,
    head: [headCategorias],
    body: categoriaBody,
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8, cellPadding: 2.5, valign: "middle" },
    headStyles: {
      fillColor: [243, 246, 252],
      textColor: [86, 98, 125],
      fontStyle: "bold",
    },
    columnStyles: Object.fromEntries(
      [...relatorio.maquinaIds.keys()].map((i) => [i + 1, { halign: "right" as const }]),
    ),
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didDrawCell: (data) => {
      if (data.section !== "body" || data.column.index !== idxTotal) return;
      const cat = relatorio.categoriasFalha[data.row.index];
      if (!cat) return;

      const pctBar =
        maxFalhasCategoria > 0 ? (cat.total / maxFalhasCategoria) * 100 : 0;
      const { x, y: cy, width, height } = data.cell;
      const barW = width - 14;
      desenharBarra(doc, x + 2, cy + height / 2 - 1.2, barW, 2.4, pctBar, [217, 119, 6]);
      doc.setFontSize(8);
      doc.setTextColor(0);
      doc.text(fmtNum(cat.total), x + width - 2, cy + height / 2 + 1, { align: "right" });
    },
  });

  doc.save(nomeArquivo());
}
