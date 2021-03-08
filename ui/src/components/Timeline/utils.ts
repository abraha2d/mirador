export const withoutTime = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const getPercentFromDate = (date: Date) => {
  const msOnly = date.getTime() - withoutTime(date).getTime();
  return msOnly / 8.64e7;
};

export const getPositionFromDate = (date: Date, maxPosition: number) => {
  return getPercentFromDate(date) * maxPosition;
};

export const getDateFromPosition = (
  position: number,
  maxPosition: number,
  date: Date
) => {
  const msOnly = (position / maxPosition) * 8.64e7;
  return new Date(withoutTime(date).getTime() + msOnly);
};

export const getTextForZoomLevel = (zoom: number) => {
  if (zoom < 1) {
    return `${1 / zoom} days`;
  } else if (zoom < 16) {
    return `${24 / zoom} hrs`;
  } else {
    return `${1440 / zoom} mins`;
  }
};
