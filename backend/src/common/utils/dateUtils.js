/**
 * PeoplePay360 Date Utilities
 */

export const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
};

export const toISO = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

export const isValidDate = (dateString) => {
  if (!dateString) return false;
  const d = new Date(dateString);
  return !isNaN(d.getTime());
};

export const getDaysDiff = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

export default {
  formatDate,
  toISO,
  isValidDate,
  getDaysDiff,
};
