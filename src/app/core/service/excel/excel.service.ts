import * as XLSX from 'xlsx';

export function exportJsonToXlsx(jsonMap: any): void {

  const data = Object.keys(jsonMap).map((key) => [
    key,                     // System Headers
    jsonMap[key] || ''       // Product Headers (values from API)
  ]);

  // Add header row
  data.unshift(['System Headers', 'Product Headers']);

  const ws = XLSX.utils.aoa_to_sheet(data);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Mapping Format');

  XLSX.writeFile(wb, 'mapping-format.xlsx');
}
