'use client';

import type { Task } from '@/types/task';

export async function exportToPDF(
  tasks: Task[],
  projectName: string,
  projectDescription: string
): Promise<void> {
  // Dynamically import jsPDF to avoid SSR issues
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Header
  doc.setFontSize(20);
  doc.setTextColor(41, 37, 36); // stone-800
  doc.text(projectName, 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(120, 113, 108); // stone-500
  doc.text(projectDescription, 14, 28);

  // Statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'complete').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress').length;
  const notStartedTasks = tasks.filter((t) => t.status === 'not-started').length;
  const avgProgress = tasks.length > 0
    ? Math.round(tasks.reduce((acc, t) => acc + t.progress, 0) / tasks.length)
    : 0;

  doc.setFontSize(9);
  doc.setTextColor(87, 83, 78); // stone-600
  doc.text(
    `Total: ${totalTasks} | Completed: ${completedTasks} | In Progress: ${inProgressTasks} | Not Started: ${notStartedTasks} | Avg. Progress: ${avgProgress}%`,
    14,
    36
  );

  // Task Table
  const tableData = tasks.map((task, index) => [
    (index + 1).toString(),
    task.name,
    formatDate(task.startDate),
    formatDate(task.endDate),
    getDurationDays(task.startDate, task.endDate).toString(),
    `${task.progress}%`,
    formatStatus(task.status),
    task.dependencies?.length || 0,
  ]);

  autoTable(doc, {
    startY: 42,
    head: [['#', 'Task Name', 'Start Date', 'End Date', 'Days', 'Progress', 'Status', 'Deps']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [41, 37, 36], // stone-800
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [68, 64, 60], // stone-700
    },
    alternateRowStyles: {
      fillColor: [250, 250, 249], // stone-50
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 70 },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 15 },
      5: { cellWidth: 20 },
      6: { cellWidth: 25 },
      7: { cellWidth: 15 },
    },
    didDrawCell: (data) => {
      // Color code status column
      if (data.column.index === 6 && data.section === 'body') {
        const status = tasks[data.row.index]?.status;
        if (status === 'complete') {
          doc.setTextColor(13, 148, 136); // teal-600
        } else if (status === 'in-progress') {
          doc.setTextColor(234, 88, 12); // orange-600
        } else {
          doc.setTextColor(244, 63, 94); // rose-500
        }
      }
    },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(168, 162, 158); // stone-400
    doc.text(
      `Generated on ${new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })} | Page ${i} of ${pageCount}`,
      14,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      'Gantt Project Manager',
      doc.internal.pageSize.width - 14,
      doc.internal.pageSize.height - 10,
      { align: 'right' }
    );
  }

  // Save
  doc.save(`${projectName.replace(/\s+/g, '-').toLowerCase()}-report.pdf`);
}

function formatDate(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getDurationDays(start: Date | string, end: Date | string): number {
  const startDate = start instanceof Date ? start : new Date(start);
  const endDate = end instanceof Date ? end : new Date(end);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

function formatStatus(status: string): string {
  switch (status) {
    case 'complete':
      return 'Complete';
    case 'in-progress':
      return 'In Progress';
    case 'not-started':
      return 'Not Started';
    default:
      return status;
  }
}

// Print function
export function printGanttChart(): void {
  const chartElement = document.getElementById('gantt-chart-container');
  if (!chartElement) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const styles = Array.from(document.styleSheets)
    .map((styleSheet) => {
      try {
        return Array.from(styleSheet.cssRules)
          .map((rule) => rule.cssText)
          .join('\n');
      } catch (e) {
        return '';
      }
    })
    .join('\n');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Gantt Chart - Print</title>
        <style>
          ${styles}
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
          }
          body { margin: 0; padding: 20px; }
        </style>
      </head>
      <body>
        ${chartElement.outerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
}
