import React from "react";
import { useDrag, useDrop } from "react-dnd";
import { FullScreen, useFullScreenHandle } from "react-full-screen";

import { START_STREAM } from "components/Store/constants";
import { Stream } from "components/Store/types";
import { DragItemTypes } from "utils";

type StreamContainerProps = {
  idx: number;
  width: string;
  height: string;
  stream?: Stream;
  isFullscreen: boolean;
  dispatch?: React.Dispatch<any>;
  onDrag: (dragStart: boolean) => void;
};

export const StreamContainer = ({
  idx,
  width,
  height,
  stream,
  isFullscreen,
  dispatch,
  onDrag,
}: StreamContainerProps) => {
  const [{ isOver, itemType }, drop] = useDrop({
    accept: [DragItemTypes.CAMERA, DragItemTypes.STREAM],
    drop: (item) => {
      if (item.type === DragItemTypes.CAMERA) {
        const camera = (item as any).camera;
        dispatch &&
          dispatch({
            type: START_STREAM,
            payload: {
              idx,
              stream: { id: camera.id, url: camera.urls[0] },
            },
          });
      } else if (item.type === DragItemTypes.STREAM) {
        const stream = (item as any).stream;
        dispatch &&
          dispatch({
            type: START_STREAM,
            payload: {
              idx,
              stream,
            },
          });
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      itemType: monitor.getItemType(),
    }),
  });

  const [{ isDragging }, drag] = useDrag({
    item: { type: DragItemTypes.STREAM, stream },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !!stream,
    begin: () => onDrag(true),
    end: () => onDrag(false),
  });

  const handle = useFullScreenHandle();

  return (
    <div
      className={`${isFullscreen ? "" : "border-top border-left"}${
        isDragging
          ? " bg-secondary"
          : isOver
          ? stream
            ? itemType === DragItemTypes.CAMERA
              ? " bg-danger"
              : " bg-info"
            : " bg-primary"
          : ""
      }`}
      style={{ width, height }}
      ref={drop}
      onDoubleClick={
        stream ? (handle.active ? handle.exit : handle.enter) : () => {}
      }
    >
      {stream && (
        <FullScreen handle={handle} className="h-100">
          <div
            className="w-100 h-100 d-flex flex-column align-items-center justify-content-center"
            ref={drag}
          >
            <h1 className="text-light">ID: {stream.id}</h1>
            <span className="text-light text-center text-truncate w-100 px-3">
              URL: {stream.url}
            </span>
          </div>
        </FullScreen>
      )}
    </div>
  );
};
