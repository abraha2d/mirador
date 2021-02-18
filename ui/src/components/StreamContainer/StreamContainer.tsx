import React from "react";
import { useDrag, useDrop } from "react-dnd";
import { FullScreen, useFullScreenHandle } from "react-full-screen";

import { START_STREAM } from "components/Store/constants";
import { Stream } from "components/Store/types";
import { DragItemTypes } from "utils";

import logo from "logo.svg";

type StreamContainerProps = {
  idx: number;
  width: string;
  height: string;
  stream?: Stream;
  dispatch?: React.Dispatch<any>;
};

export const StreamContainer = ({
  idx,
  width,
  height,
  stream,
  dispatch,
}: StreamContainerProps) => {
  const [{ isOver }, drop] = useDrop({
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
      isOver: !monitor.isOver(),
    }),
  });

  const [{ isDragging }, drag] = useDrag({
    item: { type: DragItemTypes.STREAM, stream },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !!stream,
  });

  const handle = useFullScreenHandle();

  return (
    <div
      className={`border-top border-left${
        isDragging
          ? " bg-secondary"
          : isOver
          ? ""
          : stream
          ? " bg-danger"
          : " bg-primary"
      }`}
      style={{ width, height }}
      ref={drop}
      onDoubleClick={handle.active ? handle.exit : handle.enter}
    >
      {stream && (
        <FullScreen handle={handle}>
          <div
            className="w-100 h-100 d-flex flex-column align-items-center justify-content-center"
            ref={drag}
          >
            <span className="text-light">ID: {stream.id}</span>
            <span className="text-light text-center text-truncate w-100 px-3">
              URL: {stream.url}
            </span>
            <img src={logo} className="live w-50 h-50" alt="" />
          </div>
        </FullScreen>
      )}
    </div>
  );
};
