import * as XLSX from 'xlsx';
import { Expense } from '../types';
import { format } from 'date-fns';

export const exportToExcel = (expenses: Expense[]) => {
  const data = expenses.map(exp => ({
    Title: exp.title,
    Amount: exp.amount,
    Category: exp.category,
    Date: format(new Date(exp.date), 'yyyy-MM-dd HH:mm'),
    Notes: exp.notes || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');

  // Generate file and trigger download
  XLSX.writeFile(workbook, `XpenceX_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

export const parseExcelFile = async (file: File): Promise<Partial<Expense>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const bstr = e.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        const expenses: Partial<Expense>[] = data.map((row: any) => ({
          title: row.Title || row.title || 'Imported Expense',
          amount: parseFloat(row.Amount || row.amount || '0'),
          category: row.Category || row.category || 'Other',
          date: row.Date || row.date ? new Date(row.Date || row.date).toISOString() : new Date().toISOString(),
          notes: row.Notes || row.notes || ''
        }));

        resolve(expenses);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};
