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
  const pageH = doc.internal.pageSize.getHeight();
  const margem = 12;
  let y = margem;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de produção", margem, y);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("Elgin · CETEVA", pageW - margem, y, { align: "right" });
  doc.setTextColor(0);
  y += 6;

  doc.setFontSize(9);
  doc.text(`Período: ${relatorio.periodo.descricao}`, margem, y);
  y += 7;

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

  const gap = 2.5;
  const cardW = (pageW - margem * 2 - gap * 3) / 4;
  const cardH = 16;

  cards.forEach((card, i) => {
    const x = margem + i * (cardW + gap);
    doc.setFillColor(...card.cor);
    doc.roundedRect(x, y, cardW, cardH, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.text(doc.splitTextToSize(card.titulo, cardW - 4), x + cardW / 2, y + 5, {
      align: "center",
    });
    doc.setFontSize(14);
    doc.text(card.valor, x + cardW / 2, y + 12.5, { align: "center" });
  });

  doc.setTextColor(0);
  y += cardH + 6;

  doc.setFillColor(37, 99, 235);
  doc.rect(margem, y, pageW - margem * 2, 5.5, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("DESEMPENHO POR MÁQUINA", margem + 2, y + 4);
  doc.setTextColor(0);
  y += 7;

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
    margin: { left: margem, right: margem },
    styles: { fontSize: 8, cellPadding: 1.8, valign: "middle", lineWidth: 0.1 },
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

  y = doc.lastAutoTable.finalY + 5;

  doc.setFillColor(37, 99, 235);
  doc.rect(margem, y, pageW - margem * 2, 5.5, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("ANÁLISE DE FALHAS POR CATEGORIA", margem + 2, y + 4);
  doc.setTextColor(0);
  y += 7;

  const espacoRestante = pageH - margem - y;
  const linhasCategoria = relatorio.categoriasFalha.length + 1;
  const alturaLinha = Math.min(5.2, Math.max(4.2, (espacoRestante - 4) / linhasCategoria));

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
    margin: { left: margem, right: margem, bottom: margem },
    tableWidth: pageW - margem * 2,
    styles: {
      fontSize: 7.5,
      cellPadding: 1.4,
      valign: "middle",
      lineWidth: 0.1,
      minCellHeight: alturaLinha,
    },
    pageBreak: "avoid",
    rowPageBreak: "avoid",
    showHead: "firstPage",
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
