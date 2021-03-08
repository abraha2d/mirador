export const DragItemTypes = {
  CAMERA: "camera",
  STREAM: "stream",
};

export const withoutTime = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());
