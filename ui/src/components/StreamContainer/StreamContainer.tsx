import React from "react";
import { useDrag, useDrop } from "react-dnd";
import { FullScreen, useFullScreenHandle } from "react-full-screen";

import { START_STREAM } from "components/Store/constants";
import { Stream } from "components/Store/types";
import { DragItemTypes } from "utils";

type StreamContainerProps = {
  gridSide: number;
  x: number;
  y: number;
  stream?: Stream;
  isFullscreen: boolean;
  dispatch?: React.Dispatch<any>;
  onDrag: (dragStart: boolean) => void;
};

export const StreamContainer = ({
  gridSide,
  x,
  y,
  stream,
  isFullscreen,
  dispatch,
  onDrag,
}: StreamContainerProps) => {
  const [{ isOver, itemType }, drop] = useDrop({
    accept: [DragItemTypes.CAMERA, DragItemTypes.STREAM],
    drop: (item) => {
      let stream = {};
      if (item.type === DragItemTypes.CAMERA) {
        const camera = (item as any).camera;
        stream = { id: camera.id, url: camera.urls[0] };
      } else if (item.type === DragItemTypes.STREAM) {
        stream = (item as any).stream;
      }
      dispatch &&
        dispatch({
          type: START_STREAM,
          payload: {
            idx: y * gridSide + x,
            stream,
          },
        });
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
      className="position-absolute border-bottom border-right"
      style={{
        width: `${100 / gridSide}%`,
        height: `${100 / gridSide}%`,
        left: `calc(${x} * ${100 / gridSide}%)`,
        top: `calc(${y} * ${100 / gridSide}%)`,
        transition: "width 150ms, height 150ms, left 150ms, top 150ms",
      }}
      ref={drop}
      onDoubleClick={
        stream ? (handle.active ? handle.exit : handle.enter) : () => {}
      }
    >
      <div
        style={{
          pointerEvents: isOver ? "auto" : "none",
          opacity: isDragging || isOver ? "80%" : 0,
        }}
        className={`coloroverlay position-absolute${
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
      />
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
