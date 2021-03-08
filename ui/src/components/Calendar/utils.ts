export const getMonthArray = (monthDate: Date) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const monthDatePrev = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() - 1,
    1
  );
  const monthDateNext = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 1,
    1
  );

  const preDaysPrev = monthDatePrev.getDay();
  const numDaysPrev = 32 - new Date(year, month - 1, 32).getDate();
  const numWeeksPrev = Math.floor((preDaysPrev + numDaysPrev) / 7);

  const preDays = monthDate.getDay();
  const numDays = 32 - new Date(year, month, 32).getDate();
  const numWeeks = Math.ceil((preDays + numDays) / 7);

  const firstDaysNext = monthDateNext.getDay();
  const numDaysNext = 32 - new Date(year, month + 1, 32).getDate();
  const numWeeksNext = Math.ceil((numDaysNext - firstDaysNext) / 7);

  let date = new Date(
    monthDatePrev.getFullYear(),
    monthDatePrev.getMonth(),
    1 - preDaysPrev
  );

  const monthArray = [];
  for (const i of Array(numWeeksPrev + numWeeks + numWeeksNext).keys()) {
    const weekArray = [];
    for (const j of Array(7).keys()) {
      weekArray[j] = date;
      date = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    }
    monthArray[i] = weekArray;
  }

  return { monthArray, numWeeksPrev, numWeeks };
};
