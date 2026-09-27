import { jsPDF } from 'jspdf'

/** Renders a generated report's plain text into a downloadable PDF, wrapping and paginating as needed. */
export function downloadReportPdf(title: string, reportText: string, filename: string) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 48
  const usableWidth = pageWidth - margin * 2
  let y = margin

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  const titleLines = doc.splitTextToSize(title, usableWidth)
  doc.text(titleLines, margin, y)
  y += titleLines.length * 20 + 16

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  const lineHeight = 15

  for (const paragraph of reportText.split('\n')) {
    const lines = paragraph.length > 0 ? doc.splitTextToSize(paragraph, usableWidth) : ['']
    for (const line of lines) {
      if (y > pageHeight - margin) {
        doc.addPage()
        y = margin
      }
      doc.text(line, margin, y)
      y += lineHeight
    }
  }

  doc.save(filename)
}
