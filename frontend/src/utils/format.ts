/**
 * Formatting utility functions
 */

/**
 * Format number to Vietnamese currency string (VND)
 * Example: 360000 -> 360.000 đ
 * Handles strings, numbers, and decimals by converting to integer first.
 */
export const formatCurrency = (amount: number | string | any): string => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '0 đ';
  }
  
  // Convert to number and round to integer for VND
  const numericAmount = Math.round(Number(amount));
  
  return numericAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " đ";
};

/**
 * Format date to Vietnamese string
 * Example: 2026-04-24 -> Thứ sáu, 24/04/2026
 */
export const formatViDate = (date: Date | string | number): string => {
  const d = new Date(date);
  const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  return `${days[d.getDay()]}, ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};
