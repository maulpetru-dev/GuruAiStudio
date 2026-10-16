import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  Header,
  Footer,
  PageNumber
} from 'docx';
import saveAs from 'file-saver';
import { LearningProject, SECTION_METADATA, LearningPackage } from '../types/learning';

interface InlineFormatOptions {
  baseSize?: number;
  baseColor?: string;
  defaultBold?: boolean;
}

/**
 * Parses markdown inline formatting (**bold**, *italic*, ***bolditalic***, `code`)
 * into an array of docx TextRuns, and strips all stray asterisks (* and **) so no
 * star icons appear in the exported Word document.
 */
function parseInlineFormatting(text: string, options: InlineFormatOptions = {}): TextRun[] {
  const { baseSize = 21, baseColor = '1E293B', defaultBold = false } = options;

  if (!text) return [];

  const runs: TextRun[] = [];
  // Tokenizer regex for markdown inline tags
  const tokenRegex = /(\*\*\*[^*]+?\*\*\*|\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`)/g;
  const parts = text.split(tokenRegex);

  for (const part of parts) {
    if (!part) continue;

    if (part.startsWith('***') && part.endsWith('***') && part.length > 6) {
      const inner = part.slice(3, -3).trim().replace(/\*+/g, '');
      if (inner) {
        runs.push(
          new TextRun({
            text: inner,
            bold: true,
            italics: true,
            size: baseSize,
            color: baseColor,
          })
        );
      }
    } else if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      const inner = part.slice(2, -2).trim().replace(/\*+/g, '');
      if (inner) {
        runs.push(
          new TextRun({
            text: inner,
            bold: true,
            size: baseSize,
            color: baseColor,
          })
        );
      }
    } else if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      const inner = part.slice(1, -1).trim().replace(/\*+/g, '');
      if (inner) {
        runs.push(
          new TextRun({
            text: inner,
            italics: true,
            size: baseSize,
            color: baseColor,
          })
        );
      }
    } else if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      const inner = part.slice(1, -1).trim();
      if (inner) {
        runs.push(
          new TextRun({
            text: inner,
            font: 'Consolas',
            size: Math.max(18, baseSize - 2),
            color: '0F172A',
          })
        );
      }
    } else {
      // Plain text: strip any stray or dangling asterisks that teachers reported as star icons
      const cleaned = part.replace(/\*+/g, '');
      if (cleaned) {
        runs.push(
          new TextRun({
            text: cleaned,
            bold: defaultBold,
            size: baseSize,
            color: baseColor,
          })
        );
      }
    }
  }

  if (runs.length === 0) {
    const fallback = text.replace(/\*+/g, '').trim();
    if (fallback) {
      runs.push(
        new TextRun({
          text: fallback,
          bold: defaultBold,
          size: baseSize,
          color: baseColor,
        })
      );
    }
  }

  return runs;
}

/**
 * Checks if a line is a markdown/text table separator (e.g. |---|---| or +---+---+ or -----------)
 */
function isTableSeparatorLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  return (
    /^\|?[\s\-:]+(\|[\s\-:]+)+\|?$/.test(trimmed) ||
    /^[+\-|:=]{4,}$/.test(trimmed) ||
    /^-{4,}$/.test(trimmed) ||
    /^={4,}$/.test(trimmed)
  );
}

/**
 * Checks if a line is a candidate row in a table (contains at least one pipe with cell content)
 */
function isTableRowLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (isTableSeparatorLine(trimmed)) return true;
  if (trimmed.includes('|')) {
    const parts = trimmed.split('|').map((p) => p.trim()).filter(Boolean);
    return parts.length >= 2;
  }
  return false;
}

/**
 * Builds a native docx Table from an array of table lines with emerald header, clean borders,
 * zebra row shading, and padded cells.
 */
function buildDocxTable(tableLines: string[]): Table | null {
  const rawRows: string[][] = [];
  let headerIndex = 0;

  for (let i = 0; i < tableLines.length; i++) {
    const line = tableLines[i].trim();
    if (!line) continue;

    // Pure dash separator line outside markdown pipes (e.g. ------------------)
    if (/^[-=]{4,}$/.test(line)) {
      continue;
    }

    // Markdown separator row |---|---|
    if (isTableSeparatorLine(line)) {
      if (rawRows.length > 0) {
        headerIndex = rawRows.length - 1;
      }
      continue;
    }

    let cells = line.split('|');
    if (line.startsWith('|')) cells.shift();
    if (line.endsWith('|')) cells.pop();

    const cleanCells = cells.map((c) => c.trim().replace(/\*+/g, ''));
    if (cleanCells.some((c) => c.length > 0)) {
      rawRows.push(cleanCells);
    }
  }

  if (rawRows.length === 0) return null;

  const maxCols = Math.max(...rawRows.map((r) => r.length));
  if (maxCols === 0) return null;

  // Normalize column count
  const normalizedRows = rawRows.map((row) => {
    const padded = [...row];
    while (padded.length < maxCols) {
      padded.push('');
    }
    return padded;
  });

  // Calculate proportional column widths
  const firstHeader = (normalizedRows[0]?.[0] || '').toLowerCase();
  const hasNarrowFirstCol =
    maxCols > 2 && (firstHeader === 'no' || firstHeader === 'no.' || firstHeader === '#' || firstHeader === 'aspek');

  const colWidths: number[] = [];
  if (hasNarrowFirstCol && (firstHeader === 'no' || firstHeader === 'no.' || firstHeader === '#')) {
    colWidths.push(8);
    const rem = Math.floor(92 / (maxCols - 1));
    for (let c = 1; c < maxCols; c++) {
      colWidths.push(c === maxCols - 1 ? 100 - 8 - rem * (maxCols - 2) : rem);
    }
  } else if (maxCols === 2) {
    colWidths.push(30, 70);
  } else {
    const std = Math.floor(100 / maxCols);
    for (let c = 0; c < maxCols; c++) {
      colWidths.push(c === maxCols - 1 ? 100 - std * (maxCols - 1) : std);
    }
  }

  const tableRows: TableRow[] = normalizedRows.map((rowCells, rIdx) => {
    const isHeader = rIdx === headerIndex;
    const isZebra = !isHeader && rIdx % 2 === 1;

    const cells: TableCell[] = rowCells.map((cellText, cIdx) => {
      const widthPercent = colWidths[cIdx] || Math.floor(100 / maxCols);

      const runs = parseInlineFormatting(cellText, {
        baseSize: isHeader ? 20 : 19,
        baseColor: isHeader ? '064E3B' : '1E293B',
        defaultBold: isHeader,
      });

      return new TableCell({
        width: { size: widthPercent, type: WidthType.PERCENTAGE },
        shading: {
          fill: isHeader ? 'E6F4EA' : isZebra ? 'F8FAFC' : 'FFFFFF',
          type: ShadingType.CLEAR,
        },
        margins: { top: 120, bottom: 120, left: 160, right: 160 },
        children: [
          new Paragraph({
            alignment:
              isHeader && cIdx === 0 && hasNarrowFirstCol
                ? AlignmentType.CENTER
                : AlignmentType.LEFT,
            children: runs.length > 0 ? runs : [new TextRun({ text: '' })],
            spacing: { line: 260 },
          }),
        ],
      });
    });

    return new TableRow({
      tableHeader: isHeader,
      cantSplit: true,
      children: cells,
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: '064E3B' },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '064E3B' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
    },
    rows: tableRows,
  });
}

/**
 * Converts raw content from a learning package section into rich docx elements
 * (both native Table objects and formatted Paragraphs with no raw asterisks).
 */
function parseContentToDocxElements(rawText: string): (Paragraph | Table)[] {
  if (!rawText || !rawText.trim()) {
    return [new Paragraph({ text: '(Belum ada data)', spacing: { after: 120 } })];
  }

  const elements: (Paragraph | Table)[] = [];
  const lines = rawText.split('\n');

  let tableBuffer: string[] = [];

  const flushTableBuffer = () => {
    if (tableBuffer.length > 0) {
      const table = buildDocxTable(tableBuffer);
      if (table) {
        elements.push(table);
        // Add breathing room after table
        elements.push(new Paragraph({ text: '', spacing: { after: 140 } }));
      } else {
        // Fallback: render buffered lines as paragraphs if not a valid table
        for (const tblLine of tableBuffer) {
          const runs = parseInlineFormatting(tblLine);
          if (runs.length > 0) {
            elements.push(new Paragraph({ children: runs, spacing: { after: 60 } }));
          }
        }
      }
      tableBuffer = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Check if this line is part of a table
    if (isTableRowLine(trimmed)) {
      tableBuffer.push(trimmed);
      continue;
    } else {
      flushTableBuffer();
    }

    if (!trimmed) {
      // Empty line -> add subtle spacing
      elements.push(new Paragraph({ text: '', spacing: { after: 80 } }));
      continue;
    }

    // Check horizontal rules / dividers (---, ***, ___)
    if (/^[-*_]{3,}$/.test(trimmed)) {
      elements.push(
        new Paragraph({
          text: '',
          spacing: { before: 120, after: 120 },
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
          },
        })
      );
      continue;
    }

    // Check Markdown Headings (# , ## , ### , #### )
    if (/^#{1,4}\s+/.test(trimmed)) {
      const level = (trimmed.match(/^#+/) || ['#'])[0].length;
      const headingText = trimmed.replace(/^#{1,4}\s+/, '').replace(/\*+/g, '').trim();
      const runs = parseInlineFormatting(headingText, {
        baseSize: level <= 2 ? 24 : 22,
        baseColor: '064E3B',
        defaultBold: true,
      });

      elements.push(
        new Paragraph({
          children: runs,
          heading: level <= 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
          spacing: { before: level <= 2 ? 240 : 180, after: 80 },
        })
      );
      continue;
    }

    // Check Subheading patterns (A. , B. , 1. , Tahap , SLIDE , SOAL , KUNCI JAWABAN , dsb.)
    const isMajorLabel =
      /^[A-Z]\.\s+/.test(trimmed) ||
      /^Tahap\s+\d+/i.test(trimmed) ||
      /^SLIDE\s+\d+/i.test(trimmed) ||
      /^SOAL\s+\d+/i.test(trimmed) ||
      /^KUNCI JAWABAN/i.test(trimmed) ||
      /^PEMBAHASAN/i.test(trimmed) ||
      /^PETUNJUK/i.test(trimmed) ||
      /^STIMULUS/i.test(trimmed) ||
      /^TUGAS\s+\d+/i.test(trimmed) ||
      (/^Tabel\s+\d+:/i.test(trimmed) && trimmed.length < 80);

    if (isMajorLabel && trimmed.length < 100) {
      const runs = parseInlineFormatting(trimmed, {
        baseSize: 22,
        baseColor: '064E3B',
        defaultBold: true,
      });

      elements.push(
        new Paragraph({
          children: runs,
          spacing: { before: 180, after: 60 },
        })
      );
      continue;
    }

    // Check Bullet lists (* , - , + , • )
    if (/^[\*\-+•]\s+/.test(trimmed)) {
      const bulletContent = trimmed.replace(/^[\*\-+•]\s+/, '');
      const runs = parseInlineFormatting(bulletContent, { baseSize: 21, baseColor: '1E293B' });

      elements.push(
        new Paragraph({
          children: [
            new TextRun({ text: '•  ', bold: true, color: '064E3B', size: 21 }),
            ...runs,
          ],
          indent: { left: 400, hanging: 240 },
          spacing: { after: 60, line: 260 },
        })
      );
      continue;
    }

    // Check Numbered items (e.g. 1. , 2. )
    const numberedMatch = trimmed.match(/^(\d+\.)\s+(.+)$/);
    if (numberedMatch) {
      const numLabel = numberedMatch[1];
      const itemContent = numberedMatch[2];
      const runs = parseInlineFormatting(itemContent, { baseSize: 21, baseColor: '1E293B' });

      elements.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${numLabel} `, bold: true, color: '064E3B', size: 21 }),
            ...runs,
          ],
          indent: { left: 400, hanging: 240 },
          spacing: { after: 60, line: 260 },
        })
      );
      continue;
    }

    // Standard body paragraph
    const runs = parseInlineFormatting(trimmed, { baseSize: 21, baseColor: '1E293B' });
    elements.push(
      new Paragraph({
        children: runs,
        spacing: { after: 80, line: 280 },
      })
    );
  }

  flushTableBuffer();
  return elements;
}

export async function exportProjectToDocx(project: LearningProject): Promise<void> {
  const { parameters, package: pkg, title } = project;
  const schoolName = parameters.schoolName || 'Satuan Pendidikan';
  const teacherName = parameters.teacherName || 'Guru Mata Pelajaran';
  const nip = parameters.nip ? `NIP. ${parameters.nip}` : '-';
  const headmasterName = parameters.headmasterName || 'Kepala Madrasah / Sekolah';
  const headmasterNip = parameters.headmasterNip ? `NIP. ${parameters.headmasterNip}` : '-';

  // Build Identity Table with clean borders and subtle shading
  const identityRows = [
    ['Satuan Pendidikan', schoolName],
    ['Mata Pelajaran', parameters.subject || '-'],
    ['Fase / Kelas', `${parameters.gradePhase || '-'} (${parameters.level || '-'})`],
    ['Semester / Alokasi Waktu', `${parameters.semester || 'Ganjil'} / ${parameters.timeAllocation || '-'}`],
    ['Topik / Materi Pokok', parameters.topic || '-'],
    ['Model Pembelajaran', parameters.learningModel || 'Problem Based Learning (PBL)'],
    ['Fasilitas & Sarpras', parameters.facilities || 'Ruang kelas, modul cetak'],
    ['Penyusun / NIP', `${teacherName} / ${nip}`],
  ];

  const tableRows = identityRows.map(
    ([label, value]) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: label, bold: true, size: 20, color: '334155' })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: value, size: 20, color: '0F172A' })],
              }),
            ],
          }),
        ],
      })
  );

  const doc = new Document({
    creator: 'GuruAI Studio v0.1',
    title: title,
    description: `Perangkat Pembelajaran ${parameters.subject} - ${parameters.topic}`,
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `${schoolName} · Modul Ajar ${parameters.subject}`,
                    size: 16,
                    color: '64748B',
                    italics: true,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'GuruAI Studio - Halaman ', size: 16, color: '94A3B8' }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: '94A3B8',
                  }),
                  new TextRun({ text: ' dari ', size: 16, color: '94A3B8' }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: '94A3B8',
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Official Header / Kop Sekolah
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: schoolName.toUpperCase(),
                bold: true,
                size: 26,
                color: '064E3B',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'PERANGKAT PEMBELAJARAN (MODUL AJAR KURIKULUM MERDEKA)',
                bold: true,
                size: 24,
                color: '0F172A',
              }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `MATA PELAJARAN: ${(parameters.subject || '').toUpperCase()} · TAHUN AJARAN 2024/2025`,
                size: 20,
                color: '475569',
              }),
            ],
            spacing: { after: 240 },
            border: {
              bottom: { style: BorderStyle.DOUBLE, size: 12, color: '064E3B' },
            },
          }),

          // Section I: Identity Table
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
            children: [
              new TextRun({
                text: 'I. INFORMASI UMUM & IDENTITAS MODUL',
                bold: true,
                size: 24,
                color: '064E3B',
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
            },
            rows: tableRows,
          }),
          new Paragraph({ text: '', spacing: { after: 180 } }),

          // Overview Details
          ...parseContentToDocxElements(pkg.overview),

          // Section II: Objectives & KKTP
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 360, after: 120 },
            children: [
              new TextRun({
                text: 'II. CAPAIAN PEMBELAJARAN, TUJUAN & KKTP',
                bold: true,
                size: 24,
                color: '064E3B',
              }),
            ],
          }),
          ...parseContentToDocxElements(pkg.learningObjectivesDetail),

          // Section III: Meaningful Understanding & Stimulus Questions
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 360, after: 120 },
            children: [
              new TextRun({
                text: 'III. PEMAHAMAN BERMAKNA & PERTANYAAN PEMANTIK',
                bold: true,
                size: 24,
                color: '064E3B',
              }),
            ],
          }),
          ...parseContentToDocxElements(pkg.meaningfulUnderstanding),

          // Section IV: Core Material
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 360, after: 120 },
            children: [
              new TextRun({
                text: 'IV. RINGKASAN MATERI PELAJARAN ESENSIAL',
                bold: true,
                size: 24,
                color: '064E3B',
              }),
            ],
          }),
          ...parseContentToDocxElements(pkg.coreMaterial),

          // Section V: Learning Activities
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 360, after: 120 },
            children: [
              new TextRun({
                text: 'V. RANCANGAN LANGKAH KEGIATAN PEMBELAJARAN',
                bold: true,
                size: 24,
                color: '064E3B',
              }),
            ],
          }),
          ...parseContentToDocxElements(pkg.learningActivities),

          // Section VI: LKPD
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 360, after: 120 },
            children: [
              new TextRun({
                text: 'VI. LEMBAR KERJA PESERTA DIDIK (LKPD)',
                bold: true,
                size: 24,
                color: '064E3B',
              }),
            ],
          }),
          ...parseContentToDocxElements(pkg.studentWorksheet),

          // Section VII: Assessment Plan
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 360, after: 120 },
            children: [
              new TextRun({
                text: 'VII. RENCANA ASESMEN (DIAGNOSTIK, FORMATIF, SUMATIF)',
                bold: true,
                size: 24,
                color: '064E3B',
              }),
            ],
          }),
          ...parseContentToDocxElements(pkg.assessmentPlan),

          // Section VIII: Questions and Answers
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 360, after: 120 },
            children: [
              new TextRun({
                text: 'VIII. BANK SOAL EVALUASI, KUNCI & PEMBAHASAN',
                bold: true,
                size: 24,
                color: '064E3B',
              }),
            ],
          }),
          ...parseContentToDocxElements(pkg.questionsAndAnswers),

          // Section IX: Rubric
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 360, after: 120 },
            children: [
              new TextRun({
                text: 'IX. RUBRIK PENILAIAN AUTENTIK',
                bold: true,
                size: 24,
                color: '064E3B',
              }),
            ],
          }),
          ...parseContentToDocxElements(pkg.scoringRubric),

          // Section X: Presentation Outline
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 360, after: 120 },
            children: [
              new TextRun({
                text: 'X. RANCANGAN BAHAN PRESENTASI (SLIDE GURU)',
                bold: true,
                size: 24,
                color: '064E3B',
              }),
            ],
          }),
          ...parseContentToDocxElements(pkg.presentationOutline),

          // Section XI: Reflection & Follow Up
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 360, after: 120 },
            children: [
              new TextRun({
                text: 'XI. REFLEKSI GURU, REMEDIAL & PENGAYAAN',
                bold: true,
                size: 24,
                color: '064E3B',
              }),
            ],
          }),
          ...parseContentToDocxElements(pkg.reflectionAndFollowUp),

          // Sign-off / Lembar Pengesahan
          new Paragraph({ text: '', spacing: { before: 360, after: 120 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: 'Mengetahui,', size: 20 })],
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: 'Kepala Madrasah / Sekolah,', size: 20 })],
                        spacing: { after: 720 }, // Gap for physical signature
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: headmasterName, bold: true, underline: {}, size: 20 })],
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: headmasterNip, size: 18 })],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `${schoolName.includes('Nganjuk') ? 'Nganjuk' : 'Disahkan di Sekolah'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
                            size: 20,
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: 'Guru Mata Pelajaran,', size: 20 })],
                        spacing: { after: 720 },
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: teacherName, bold: true, underline: {}, size: 20 })],
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: nip, size: 18 })],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeFilename = `Modul_Ajar_${(parameters.subject || 'Mapel').replace(/\s+/g, '_')}_${(parameters.topic || 'Materi').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}.docx`;
  saveAs(blob, safeFilename);
}
