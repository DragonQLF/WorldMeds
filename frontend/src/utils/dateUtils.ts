import { format, parseISO } from 'date-fns';

export const getDateParam = (
  selectedDate: Date | null,
  dateRange: { from: Date; to?: Date | null } | null,
  selectedMonth: string | null
): string => {
  let dateParam = '';
  if (selectedDate) {
    const formattedDate = selectedDate.toISOString().split('T')[0];
    dateParam = `?date=${formattedDate}`;
  } else if (dateRange && dateRange.from) {
    const from = dateRange.from.toISOString().split('T')[0];
    const to = dateRange.to ? dateRange.to.toISOString().split('T')[0] : '';
    dateParam = `?start=${from}${to ? `&end=${to}` : ''}`;
  } else if (selectedMonth && selectedMonth !== 'all') {
    dateParam = `?month=${selectedMonth}`;
  }
  return dateParam;
};

export const getCurrentSelectionLabel = (selectedMonth: string | null): string => {
  if (!selectedMonth || selectedMonth === "all") {
    return "All Time";
  }
  try {
    const date = parseISO(selectedMonth + "-01");
    return format(date, 'MMMM yyyy');
  } catch (e) {
    console.error("Error parsing date:", e);
    return "All Time";
  }
}; 