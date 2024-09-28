import type { Camera, Stream } from "components/Store/types";

export enum DragItemTypes {
  CAMERA = "camera",
  STREAM = "stream",
}

export type DragObjectWithPayload =
  | {
      type: DragItemTypes.CAMERA;
      camera: Camera;
    }
  | {
      type: DragItemTypes.STREAM;
      stream: Stream;
    };

export const withoutTime = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());
