/**
 * exportService.ts — ZenithRx CSV Export & Import Service
 * Client-side CSV generation, parsing, validation, and download utility.
 * Clean Architecture: Infrastructure Layer
 */

import { DrugItem } from '../types';

/** Convert an array of objects to a CSV string */
function objectsToCSV<T extends Record<string, unknown>>(data: T[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows: string[] = [];

  // Header row
  csvRows.push(headers.join(','));

  // Data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const val = row[header];
      const cell = val === null || val === undefined ? '' : String(val);
      // Escape commas, quotes, and newlines
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

/** Trigger a CSV file download in the browser */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string
): void {
  const csv = objectsToCSV(data);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Export stock inventory to CSV */
export function exportInventoryCSV(drugs: Record<string, unknown>[]): void {
  const timestamp = new Date().toISOString().split('T')[0];
  exportToCSV(drugs, `ZenithRx_Stock_Inventory_${timestamp}`);
}

/** Export sales transactions to CSV */
export function exportSalesCSV(transactions: Record<string, unknown>[]): void {
  const timestamp = new Date().toISOString().split('T')[0];
  exportToCSV(transactions, `ZenithRx_Sales_Report_${timestamp}`);
}

/** Export customer profiles to CSV */
export function exportCustomersCSV(customers: Record<string, unknown>[]): void {
  const timestamp = new Date().toISOString().split('T')[0];
  exportToCSV(customers, `ZenithRx_Customer_Profiles_${timestamp}`);
}

/** Export prescriptions to CSV */
export function exportPrescriptionsCSV(prescriptions: Record<string, unknown>[]): void {
  const timestamp = new Date().toISOString().split('T')[0];
  exportToCSV(prescriptions, `ZenithRx_Prescriptions_${timestamp}`);
}

/** Parse raw CSV text into structured drug items with error checking */
export function parseCSVToDrugs(csvText: string): { drugs: Omit<DrugItem, 'id'>[]; errors: string[] } {
  const lines = csvText.trim().split(/\r\n|\n/);
  if (lines.length < 2) {
    return { drugs: [], errors: ['CSV file is empty or missing data rows.'] };
  }

  const headerLine = lines[0].toLowerCase();
  const headers = headerLine.split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const drugs: Omit<DrugItem, 'id'>[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV tokenization respecting quotes
    const values: string[] = [];
    let insideQuotes = false;
    let currentVal = '';

    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentVal.trim().replace(/^["']|["']$/g, ''));
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal.trim().replace(/^["']|["']$/g, ''));

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? '';
    });

    const brandName = row['brand name'] || row['brand_name'] || row['brand'] || row['name'] || values[0];
    const genericName = row['generic name'] || row['generic_name'] || row['generic'] || values[1] || brandName;
    const category = (row['category'] || 'General') as DrugItem['category'];
    const barcode = row['barcode'] || `${Math.floor(Math.random() * 9000000000000 + 1000000000000)}`;
    const batchNumber = row['batch number'] || row['batch_number'] || row['batch'] || `BAT-${Date.now().toString().slice(-4)}`;
    const costPrice = Number(row['cost price (ugx)'] || row['cost price'] || row['cost_price'] || row['cost'] || 1000);
    const sellingPrice = Number(row['selling price (ugx)'] || row['selling price'] || row['selling_price'] || row['price'] || 1500);
    const stockQty = Number(row['current stock'] || row['stock qty'] || row['stock_qty'] || row['stock'] || row['quantity'] || 0);
    const reorderLevel = Number(row['reorder level'] || row['reorder_level'] || 10);
    const expiryDate = row['expiry date'] || row['expiry_date'] || row['expiry'] || '2027-12-31';
    const manufacturer = row['manufacturer'] || 'Uganda Pharma Dist';
    const shelfLocation = row['shelf location'] || row['shelf_location'] || row['location'] || 'Section A';
    const unit = row['unit'] || 'pack';
    const prescriptionRequired = (row['rx required'] || row['prescription_required'] || '').toLowerCase() === 'yes';

    if (!brandName) {
      errors.push(`Row ${i + 1}: Missing brand name.`);
      continue;
    }

    drugs.push({
      brandName,
      genericName,
      barcode,
      batchNumber,
      category,
      shelfLocation,
      costPrice: isNaN(costPrice) ? 1000 : costPrice,
      sellingPrice: isNaN(sellingPrice) ? 1500 : sellingPrice,
      stockQty: isNaN(stockQty) ? 0 : stockQty,
      reorderLevel: isNaN(reorderLevel) ? 10 : reorderLevel,
      expiryDate,
      manufacturer,
      prescriptionRequired,
      unit,
    });
  }

  return { drugs, errors };
}
