import { withoutTime } from "utils";

export const getPercentFromDate = (date: Date, day?: Date) => {
  const msOnly = +date - +(day || withoutTime(date));
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
  return new Date(+withoutTime(date) + msOnly);
};

export const getTextForZoomLevel = (zoom: number) => {
  if (zoom < 1) {
    return `${1 / zoom} days`;
  } else if (zoom < 16) {
    return `${24 / zoom} hrs`;
  } else if (zoom < 64) {
    return `${1440 / zoom} mins`;
  } else {
    return `${Math.round(1440 / zoom / 10) * 10} mins`;
  }
};
