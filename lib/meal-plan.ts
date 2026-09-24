export function parseWeekOf(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("INVALID_WEEK_OF");
  }
  return date;
}
