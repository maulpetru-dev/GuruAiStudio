import React, { useState } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  Table as TableIcon,
  Lightbulb,
  BookOpen,
  Presentation,
  Compass,
  FileText,
  School,
  ChevronDown,
  ChevronUp,
  Award
} from 'lucide-react';
import { LearningPackage, LearningParameters, SECTION_METADATA } from '../types/learning';

interface DocumentPreviewProps {
  sectionKey: keyof LearningPackage;
  content: string;
  parameters: LearningParameters;
}

/**
 * Renders inline text with bold (**text**), italic (*text*), code (`text`),
 * and removes all stray asterisks (* and **) so no star symbols appear.
 */
function renderInlineFormatted(text: string): React.ReactNode {
  if (!text) return null;

  const tokenRegex = /(\*\*\*[^*]+?\*\*\*|\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith('***') && part.endsWith('***') && part.length > 6) {
      const inner = part.slice(3, -3).trim().replace(/\*+/g, '');
      return (
        <strong key={index} className="font-extrabold italic text-slate-950">
          {inner}
        </strong>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      const inner = part.slice(2, -2).trim().replace(/\*+/g, '');
      return (
        <strong key={index} className="font-bold text-slate-950">
          {inner}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      const inner = part.slice(1, -1).trim().replace(/\*+/g, '');
      return (
        <em key={index} className="italic text-slate-800">
          {inner}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      const inner = part.slice(1, -1).trim();
      return (
        <code key={index} className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs text-emerald-900 border border-slate-200">
          {inner}
        </code>
      );
    }

    // Plain text: strip any stray or dangling asterisks
    const cleaned = part.replace(/\*+/g, '');
    return <span key={index}>{cleaned}</span>;
  });
}

/**
 * Full parser and renderer for rich text blocks with Markdown tables, headings,
 * numbered lists, and bullet points.
 */
export const FormattedContent: React.FC<{ content: string }> = ({ content }) => {
  if (!content || !content.trim()) {
    return <p className="text-slate-400 italic">(Belum ada konten pada bagian ini)</p>;
  }

  const lines = content.split('\n');
  const renderedElements: React.ReactNode[] = [];
  let tableBuffer: string[] = [];

  const flushTableBuffer = (keyPrefix: number) => {
    if (tableBuffer.length > 0) {
      const rawRows: string[][] = [];
      let headerIndex = 0;

      for (const line of tableBuffer) {
        const trimmed = line.trim();
        if (!trimmed || /^[-=]{4,}$/.test(trimmed)) continue;

        // Separator row |---|---|
        if (/^\|?[\s\-:]+(\|[\s\-:]+)+\|?$/.test(trimmed)) {
          if (rawRows.length > 0) headerIndex = rawRows.length - 1;
          continue;
        }

        let cells = trimmed.split('|');
        if (trimmed.startsWith('|')) cells.shift();
        if (trimmed.endsWith('|')) cells.pop();

        const cleanCells = cells.map((c) => c.trim());
        if (cleanCells.some((c) => c.length > 0)) {
          rawRows.push(cleanCells);
        }
      }

      if (rawRows.length > 0) {
        const maxCols = Math.max(...rawRows.map((r) => r.length));

        renderedElements.push(
          <div key={`table-wrapper-${keyPrefix}`} className="my-5 overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              <thead>
                {rawRows.slice(0, headerIndex + 1).map((row, rIdx) => (
                  <tr key={`th-row-${rIdx}`} className="bg-emerald-900 text-white font-bold">
                    {row.map((cell, cIdx) => (
                      <th
                        key={`th-${cIdx}`}
                        className="px-3.5 py-3 border border-emerald-800 text-xs font-bold tracking-wide"
                      >
                        {renderInlineFormatted(cell)}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {rawRows.slice(headerIndex + 1).map((row, rIdx) => (
                  <tr
                    key={`tb-row-${rIdx}`}
                    className={`transition-colors hover:bg-emerald-50/40 ${
                      rIdx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'
                    }`}
                  >
                    {row.map((cell, cIdx) => (
                      <td
                        key={`td-${cIdx}`}
                        className="px-3.5 py-2.5 border border-slate-200 text-slate-800 align-top leading-relaxed"
                      >
                        {renderInlineFormatted(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      tableBuffer = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Check if line contains pipes for table
    const isTblLine =
      /^\|?[\s\-:]+(\|[\s\-:]+)+\|?$/.test(trimmed) ||
      (trimmed.includes('|') && trimmed.split('|').filter(Boolean).length >= 2);

    if (isTblLine) {
      tableBuffer.push(trimmed);
      continue;
    } else {
      flushTableBuffer(i);
    }

    if (!trimmed) {
      renderedElements.push(<div key={`spacer-${i}`} className="h-2" />);
      continue;
    }

    // Dividers (---, ***, ___)
    if (/^[-*_]{3,}$/.test(trimmed)) {
      renderedElements.push(<hr key={`hr-${i}`} className="my-4 border-slate-200" />);
      continue;
    }

    // Markdown Headings (# , ## , ### )
    if (/^#{1,4}\s+/.test(trimmed)) {
      const level = (trimmed.match(/^#+/) || ['#'])[0].length;
      const text = trimmed.replace(/^#{1,4}\s+/, '').replace(/\*+/g, '');
      if (level <= 2) {
        renderedElements.push(
          <h4 key={`h-${i}`} className="text-base sm:text-lg font-extrabold text-emerald-950 mt-5 mb-2 pb-1 border-b border-emerald-100">
            {renderInlineFormatted(text)}
          </h4>
        );
      } else {
        renderedElements.push(
          <h5 key={`h-${i}`} className="text-sm sm:text-base font-bold text-emerald-900 mt-4 mb-1.5">
            {renderInlineFormatted(text)}
          </h5>
        );
      }
      continue;
    }

    // Major subheadings (A. , B. , Tahap , SLIDE , SOAL , etc.)
    const isMajorHeading =
      /^[A-Z]\.\s+/.test(trimmed) ||
      /^Tahap\s+\d+/i.test(trimmed) ||
      /^SLIDE\s+\d+/i.test(trimmed) ||
      /^SOAL\s+\d+/i.test(trimmed) ||
      /^KUNCI JAWABAN/i.test(trimmed) ||
      /^PEMBAHASAN/i.test(trimmed) ||
      (/^Tabel\s+\d+:/i.test(trimmed) && trimmed.length < 90);

    if (isMajorHeading && trimmed.length < 100) {
      renderedElements.push(
        <div key={`subhead-${i}`} className="text-sm font-bold text-emerald-900 mt-4 mb-1">
          {renderInlineFormatted(trimmed)}
        </div>
      );
      continue;
    }

    // Bullet items (* , - , + , • )
    if (/^[\*\-+•]\s+/.test(trimmed)) {
      const bulletContent = trimmed.replace(/^[\*\-+•]\s+/, '');
      renderedElements.push(
        <div key={`bullet-${i}`} className="flex items-start gap-2.5 my-1 text-slate-800 pl-2">
          <span className="text-emerald-700 font-bold leading-relaxed select-none">•</span>
          <div className="flex-1 leading-relaxed">{renderInlineFormatted(bulletContent)}</div>
        </div>
      );
      continue;
    }

    // Numbered items (1. , 2. )
    const numberedMatch = trimmed.match(/^(\d+\.)\s+(.+)$/);
    if (numberedMatch) {
      renderedElements.push(
        <div key={`num-${i}`} className="flex items-start gap-2.5 my-1.5 text-slate-800 pl-1">
          <span className="font-bold text-emerald-900 select-none min-w-[20px]">{numberedMatch[1]}</span>
          <div className="flex-1 leading-relaxed">{renderInlineFormatted(numberedMatch[2])}</div>
        </div>
      );
      continue;
    }

    // Standard body paragraph
    renderedElements.push(
      <p key={`p-${i}`} className="my-1.5 text-slate-800 leading-relaxed text-xs sm:text-sm">
        {renderInlineFormatted(trimmed)}
      </p>
    );
  }

  flushTableBuffer(lines.length);
  return <div className="space-y-1">{renderedElements}</div>;
};

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  sectionKey,
  content,
  parameters,
}) => {
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});

  const toggleAnswer = (idx: number) => {
    setRevealedAnswers((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Helper to render questions and answers in dedicated interactive accordion cards
  if (sectionKey === 'questionsAndAnswers') {
    const questions = content.split(/(?=SOAL\s+\d+|Soal\s+\d+|^\d+\.\s+)/gm).filter(Boolean);

    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-900 text-white font-bold">
              ?
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-950">Bank Soal & Kunci Pembahasan</h4>
              <p className="text-xs text-emerald-800">
                Uji pemahaman siswa dengan butir soal berjenjang (LOTS/HOTS) yang selaras dengan TP.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold bg-white px-3 py-1 rounded-full text-emerald-900 border border-emerald-200 shadow-2xs">
            {questions.length} Butir Soal
          </span>
        </div>

        <div className="space-y-4">
          {questions.map((qText, idx) => {
            const hasAnswer = qText.includes('KUNCI JAWABAN') || qText.includes('Kunci Jawaban');
            let questionPart = qText;
            let answerPart = '';

            if (hasAnswer) {
              const parts = qText.split(/KUNCI JAWABAN:|Kunci Jawaban:/i);
              questionPart = parts[0];
              answerPart = parts.slice(1).join('KUNCI JAWABAN:');
            }

            const isRevealed = !!revealedAnswers[idx];

            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden transition-all hover:border-emerald-300"
              >
                <div className="p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-md bg-emerald-900 text-white">
                      Nomor {idx + 1}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">
                      Tingkat Kognitif: {qText.includes('HOTS') || qText.includes('C4') ? 'HOTS (Analisis)' : 'C2 - C3 (Aplikasi)'}
                    </span>
                  </div>

                  <div className="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">
                    <FormattedContent content={questionPart.trim()} />
                  </div>
                </div>

                {hasAnswer && (
                  <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleAnswer(idx)}
                      className="flex items-center justify-between w-full text-left text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                        <span>{isRevealed ? 'Sembunyikan Kunci & Pembahasan' : 'Lihat Kunci Jawaban & Pembahasan Rasional'}</span>
                      </span>
                      {isRevealed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    {isRevealed && (
                      <div className="mt-3 pt-3 border-t border-emerald-100 text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200">
                        <strong className="text-emerald-950 block mb-1">KUNCI JAWABAN & PEMBAHASAN:</strong>
                        <FormattedContent content={answerPart.trim()} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Scoring Rubric with rich table display
  if (sectionKey === 'scoringRubric') {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-900 text-white">
              <TableIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Rubrik Penilaian Autentik Kurikulum Merdeka</h3>
              <p className="text-xs text-slate-500">Matriks 4 tingkat ketercapaian performa belajar peserta didik.</p>
            </div>
          </div>

          <FormattedContent content={content} />
        </div>
      </div>
    );
  }

  // Presentation Outline Slides
  if (sectionKey === 'presentationOutline') {
    const slideBlocks = content.split(/(?=SLIDE\s+\d+|Slide\s+\d+)/i).filter(Boolean);

    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Presentation className="h-6 w-6 text-emerald-800" />
            <div>
              <h4 className="text-sm font-bold text-emerald-950">Garis Besar Slide Tayang Guru</h4>
              <p className="text-xs text-emerald-800">
                Rancangan materi proyektor/layar untuk memfasilitasi interaksi kelas.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold bg-white px-3 py-1 rounded-full text-emerald-900 border border-emerald-200">
            {slideBlocks.length} Slide
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {slideBlocks.map((slide, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-emerald-600 transition-all"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2 border-b border-slate-100 pb-2">
                  <span className="font-bold font-mono text-emerald-800 uppercase tracking-wide">
                    Slide {idx + 1}
                  </span>
                  <span>Materi Guru</span>
                </div>
                <FormattedContent content={slide.trim()} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default Editorial Folio View for text sections
  return (
    <article className="max-w-3xl mx-auto space-y-6">
      {/* Official Section Banner */}
      <div className="border-b border-emerald-900/10 pb-4">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
          <span>{parameters.schoolName || 'Madrasah/Sekolah'}</span>
          <span aria-hidden="true">·</span>
          <span>{parameters.subject}</span>
          <span aria-hidden="true">·</span>
          <span>{parameters.gradePhase}</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
          {SECTION_METADATA[sectionKey].title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {SECTION_METADATA[sectionKey].subtitle}
        </p>
      </div>

      {/* Styled Document Content with Table & Formatting parser */}
      <div className="font-sans">
        <FormattedContent content={content} />
      </div>
    </article>
  );
};
