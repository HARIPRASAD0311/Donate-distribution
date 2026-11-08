import React, { useState } from 'react';
import {
  X,
  Download,
  FileText,
  FileSpreadsheet,
  FileCheck2,
  CheckCircle2,
  Printer,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { REPORT_TEMPLATES } from '../data/auditData.js';

/**
 * Section 5: Pre-configured Compliance & Operational Report Generator
 * Exports report templates to PDF, CSV, or Excel formats using real event data.
 */
export function ReportTemplatesModal({
  isOpen,
  onClose,
  onExportReport,
  events = [],
}) {
  const [selectedTemplate, setSelectedTemplate] = useState(REPORT_TEMPLATES[0]);
  const [exportFormat, setExportFormat] = useState('PDF');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(null); // stores { format, count } or null

  if (!isOpen) return null;

  const handlePrint = () => {
    const printContent = `
      <html><head><title>${selectedTemplate.title}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 10px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; }
        th { background: #f0f4f8; font-weight: bold; }
        h1 { font-size: 14px; margin-bottom: 4px; }
        .meta { color: #666; font-size: 9px; margin-bottom: 10px; }
      </style></head>
      <body>
        <h1>ResQNet — ${selectedTemplate.title}</h1>
        <div class="meta">Generated: ${new Date().toISOString()} | Records: ${events.length} | Category: ${selectedTemplate.category}</div>
        <table>
          <tr>${['Event ID','Timestamp','User','Role','Action','Module','Entity','Status','Justification'].map(h=>`<th>${h}</th>`).join('')}</tr>
          ${events.map(e=>`<tr>${[e.id,e.timestamp?.substring(0,16),e.user,e.role,e.action,e.module,e.entityId,e.status,e.reason||''].map(c=>`<td>${c||''}</td>`).join('')}</tr>`).join('')}
        </table>
      </body></html>
    `;
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(printContent);
      w.document.close();
      w.focus();
      w.print();
    }
  };

  const handleDownload = (format) => {
    setExportFormat(format);

    if (format === 'PDF') {
      handlePrint();
      onExportReport?.({
        template: selectedTemplate,
        format,
        filename: `${selectedTemplate.id}_${selectedTemplate.category.replace(/\s+/g, '_')}_${Date.now()}.pdf`,
      });
      setExportSuccess({ format, count: events.length });
      setTimeout(() => setExportSuccess(null), 3000);
      return;
    }

    setIsExporting(true);

    setTimeout(() => {
      setIsExporting(false);

      const filename = `${selectedTemplate.id}_${selectedTemplate.category.replace(/\s+/g, '_')}_${Date.now()}.${format.toLowerCase()}`;
      let blob;

      if (format === 'CSV') {
        const csvRows = [
          ['Event ID', 'Timestamp', 'User', 'Role', 'Action', 'Module', 'Entity Ref', 'Status', 'Operational Justification'],
          ...events.map(e => [
            e.id, e.timestamp, e.user, e.role, e.action, e.module, e.entityId, e.status,
            (e.reason || '').replace(/"/g, '""'),
          ]),
        ];
        const csvContent = csvRows
          .map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
          .join('\n');
        blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      } else {
        // XLSX — generate TSV compatible with Excel/LibreOffice
        const tsvRows = [
          ['ResQNet Humanitarian Operations Report:', selectedTemplate.title],
          [`Generated: ${new Date().toISOString()}`, `Records: ${events.length}`, `Category: ${selectedTemplate.category}`],
          [],
          ['Event ID', 'Timestamp', 'User', 'Role', 'Action', 'Module', 'Entity Ref', 'Status', 'Operational Justification'],
          ...events.map(e => [
            e.id, e.timestamp, e.user, e.role, e.action, e.module, e.entityId, e.status,
            (e.reason || ''),
          ]),
        ];
        const tsvContent = tsvRows.map(row => row.map(c => String(c || '').replace(/\t/g, ' ')).join('\t')).join('\n');
        blob = new Blob([tsvContent], { type: 'text/tab-separated-values;charset=utf-8' });
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onExportReport?.({
        template: selectedTemplate,
        format,
        filename,
      });

      setExportSuccess({ format, count: events.length });
      setTimeout(() => setExportSuccess(null), 3000);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 text-xs">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy-dark/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div className="relative w-full max-w-2xl bg-white border border-brand-border rounded-xl shadow-dropdown overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-surface">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-light text-teal">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-navy-primary">
                  Humanitarian Compliance &amp; Operational Reports
                </h3>
                <StatusBadge variant="teal" size="xs">9 TEMPLATES</StatusBadge>
              </div>
              <p className="text-xs text-text-secondary">
                Generate auditable situation summaries, resource utilization records, and dispatch sheets
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded text-text-secondary hover:text-text-primary">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Success Banner */}
          {exportSuccess && (
            <div className="p-3 rounded-lg bg-status-success-bg border border-status-success-border text-status-success flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                {exportSuccess.format === 'PDF'
                  ? `PDF report opened in print dialog — use "Save as PDF" to save. (${exportSuccess.count} records)`
                  : `${exportSuccess.format} export of ${exportSuccess.count} records downloaded to your device.`}
              </span>
            </div>
          )}

          {/* Template Grid */}
          <div className="space-y-2">
            <span className="font-bold text-navy-primary text-[11px] uppercase tracking-wider font-mono block">
              Select Standard Operational Report Template
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {REPORT_TEMPLATES.map((tmpl) => {
                const isSelected = selectedTemplate.id === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => setSelectedTemplate(tmpl)}
                    className={`
                      p-3 rounded-lg border cursor-pointer transition-all flex flex-col justify-between
                      ${isSelected
                        ? 'border-navy-primary bg-brand-surface ring-1 ring-navy-primary/20 shadow-sm'
                        : 'border-brand-border bg-white hover:border-teal'
                      }
                    `}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] font-bold text-navy-primary">{tmpl.id}</span>
                        <StatusBadge variant="navy" size="xs">{tmpl.category}</StatusBadge>
                      </div>

                      <h4 className="font-bold text-text-primary text-xs mb-1">{tmpl.title}</h4>
                      <p className="text-[11px] text-text-secondary leading-snug line-clamp-2 mb-2">
                        {tmpl.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-brand-border-light flex justify-between items-center text-[10px] font-mono text-text-secondary">
                      <span>{tmpl.period}</span>
                      <span className="text-teal font-semibold">Available</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Template Dossier & Formats */}
          <div className="p-4 rounded-lg bg-brand-bg border border-brand-border space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-text-secondary font-mono block">Selected Export:</span>
                <span className="font-bold text-navy-primary text-xs">{selectedTemplate.title}</span>
              </div>
              <span className="font-mono text-xs text-teal font-bold">{selectedTemplate.id}</span>
            </div>

            <p className="text-xs text-text-primary leading-relaxed">
              {selectedTemplate.description}
            </p>

            {/* Export scope / record count */}
            <div className={`text-[11px] font-mono px-2 py-1.5 rounded border ${
              events.length === 0
                ? 'bg-status-warning-bg border-status-warning-border text-status-warning'
                : 'bg-brand-surface border-brand-border-light text-text-secondary'
            }`}>
              {events.length === 0 ? (
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  No records match current filters. Adjust filters before exporting.
                </span>
              ) : (
                <span>Export scope: <strong className="text-navy-primary">{events.length}</strong> filtered audit records</span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-brand-border-light">
              <span className="font-bold text-text-primary text-[11px]">Choose Export Format:</span>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  icon={FileText}
                  onClick={() => handleDownload('PDF')}
                  disabled={isExporting}
                  title="Opens browser print dialog — use 'Save as PDF' to save"
                >
                  Export PDF
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  icon={FileSpreadsheet}
                  onClick={() => handleDownload('CSV')}
                  disabled={isExporting || events.length === 0}
                >
                  Export CSV
                </Button>

                <Button
                  size="sm"
                  variant="primary"
                  icon={Download}
                  onClick={() => handleDownload('XLSX')}
                  disabled={isExporting || events.length === 0}
                  title="Excel export is a structured TSV compatible with Excel and LibreOffice"
                >
                  {isExporting ? 'Generating...' : 'Export Excel (XLSX)'}
                </Button>
              </div>
            </div>

            {/* Format hints */}
            <div className="text-[10px] text-text-secondary font-mono space-y-0.5 pt-1 border-t border-brand-border-light">
              <div>PDF — Opens browser print dialog. Use &ldquo;Save as PDF&rdquo; to save.</div>
              <div>XLSX — Structured TSV compatible with Excel and LibreOffice.</div>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-brand-border bg-brand-surface flex justify-between items-center font-mono text-[10px] text-text-secondary">
          <span>RESQNET COMPLIANCE REVISION 2026.4</span>
          <Button size="xs" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
