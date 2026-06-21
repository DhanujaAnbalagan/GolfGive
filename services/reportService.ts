export const reportService = {
  /**
   * Format dataset into standard Comma-Separated Values (CSV)
   */
  generateCSV(data: Record<string, unknown>[], headers: string[], keys: string[]): string {
    if (!data || data.length === 0) return headers.map(h => `"${h}"`).join(',');

    const headerRow = headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',');
    const dataRows = data.map(row =>
      keys.map(k => {
        // Resolve nested keys e.g. 'profiles.email'
        let val: unknown = row;
        const keyParts = k.split('.');
        for (const part of keyParts) {
          val = val && typeof val === 'object' ? (val as Record<string, unknown>)[part] : '';
        }

        const strVal = val === null || val === undefined ? '' : String(val);
        return `"${strVal.replace(/"/g, '""')}"`;
      }).join(',')
    );

    return [headerRow, ...dataRows].join('\n');
  },

  /**
   * Format dataset into Excel-compatible Tab-Separated Values (TSV)
   */
  generateExcel(data: Record<string, unknown>[], headers: string[], keys: string[]): string {
    if (!data || data.length === 0) return headers.map(h => `"${h}"`).join('\t');

    const headerRow = headers.map(h => `"${h.replace(/"/g, '""')}"`).join('\t');
    const dataRows = data.map(row =>
      keys.map(k => {
        let val: unknown = row;
        const keyParts = k.split('.');
        for (const part of keyParts) {
          val = val && typeof val === 'object' ? (val as Record<string, unknown>)[part] : '';
        }

        const strVal = val === null || val === undefined ? '' : String(val);
        return `"${strVal.replace(/"/g, '""')}"`;
      }).join('\t')
    );

    return [headerRow, ...dataRows].join('\n');
  }
};
