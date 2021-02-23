import React, { useMemo } from "react";
import { useDrag, useDrop } from "react-dnd";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import ReactHlsPlayer from "react-hls-player";
import HlsJs from "hls.js";

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
      let replace = false;
      if (item.type === DragItemTypes.CAMERA) {
        const camera = (item as any).camera;
        stream = { id: camera.id, url: `/static/stream/${camera.id}/out.m3u8` };
        replace = true;
      } else if (item.type === DragItemTypes.STREAM) {
        stream = (item as any).stream;
      }
      dispatch &&
        dispatch({
          type: START_STREAM,
          payload: {
            idx: y * gridSide + x,
            stream,
            replace,
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

  const video = useMemo(
    () =>
      stream &&
      (HlsJs.isSupported() ? (
        <ReactHlsPlayer url={stream.url} autoPlay />
      ) : (
        <video src={stream.url} autoPlay />
      )),
    [stream && stream.url]
  );

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
            {video}
          </div>
        </FullScreen>
      )}
    </div>
  );
};
