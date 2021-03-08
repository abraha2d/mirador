import React, { useMemo, useRef, useState } from "react";
import { Spinner } from "react-bootstrap";
import { useDrag, useDrop } from "react-dnd";
import {
  FullScreen,
  FullScreenHandle,
  useFullScreenHandle,
} from "react-full-screen";
import ReactHlsPlayer from "react-hls-player";

import HlsJs from "hls.js";

import { START_STREAM } from "components/Store/constants";
import { Stream } from "components/Store/types";
import { DragItemTypes } from "utils";

import "./StreamContainer.css";

type StreamContainerProps = {
  gridSide: number;
  x: number;
  y: number;
  stream?: Stream;
  dispatch?: React.Dispatch<any>;
  onDrag: (dragStart: boolean) => void;
  fullscreenHandle: FullScreenHandle;
};

export const StreamContainer = ({
  gridSide,
  x,
  y,
  stream,
  dispatch,
  onDrag,
  fullscreenHandle,
}: StreamContainerProps) => {
  const [{ isOver, itemType }, drop] = useDrop({
    accept: [DragItemTypes.CAMERA, DragItemTypes.STREAM],
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      itemType: monitor.getItemType(),
    }),
    drop: (item) => {
      let stream = {};
      let replace = false;
      if (item.type === DragItemTypes.CAMERA) {
        const camera = (item as any).camera;
        stream = {
          id: camera.id,
          url: `/static/stream/${camera.id}/out.m3u8`,
          name: camera.name,
        };
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
  });

  const [{ isDragging }, drag] = useDrag({
    canDrag: !!stream,
    item: { type: DragItemTypes.STREAM, stream },
    begin: () => onDrag(true),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: () => onDrag(false),
  });

  const handle = useFullScreenHandle();

  const videoRef = useRef(null);
  const [isLoading, setLoading] = useState(true);

  const video = useMemo(
    () =>
      stream &&
      (HlsJs.isSupported() ? (
        <ReactHlsPlayer
          url={stream.url}
          autoPlay
          playerRef={videoRef}
          onLoadStart={() => setLoading(true)}
          onPlaying={() => setLoading(false)}
          onPause={() => setLoading(true)}
        />
      ) : (
        <video
          src={stream.url}
          autoPlay
          ref={videoRef}
          onLoadStart={() => setLoading(true)}
          onPlaying={() => setLoading(false)}
          onPause={() => setLoading(true)}
        />
      )),
    [stream]
  );

  return (
    <div
      ref={drop}
      className={`stream-container position-absolute ${
        fullscreenHandle.active ? "" : "border-right border-bottom"
      }`}
      style={{
        left: `calc(${x} * ${100 / gridSide}%)`,
        top: `calc(${y} * ${100 / gridSide}%)`,
        width: `${100 / gridSide}%`,
        height: `${100 / gridSide}%`,
      }}
      onDoubleClick={
        stream ? (handle.active ? handle.exit : handle.enter) : () => {}
      }
    >
      <div
        className={`color-overlay position-absolute ${
          isDragging
            ? "bg-secondary"
            : isOver
            ? stream
              ? itemType === DragItemTypes.CAMERA
                ? "bg-danger"
                : "bg-info"
              : "bg-primary"
            : ""
        }`}
        style={{
          opacity: isDragging || isOver ? "80%" : 0,
          pointerEvents: isOver ? "auto" : "none",
        }}
      />
      {stream && (
        <FullScreen handle={handle} className="h-100">
          <div
            className="w-100 h-100 d-flex flex-column align-items-center justify-content-center"
            ref={drag}
          >
            {video}
            {isLoading && (
              <>
                <div className="position-absolute p-3 bg-dark o-75 rounded-circle">
                  <Spinner animation="border" variant="light" className="p-3" />
                </div>
                {stream && (
                  <span
                    className="position-absolute w-100 p-1 bg-dark o-75 text-center text-truncate text-light"
                    style={{ bottom: 0 }}
                  >
                    {stream.name}
                  </span>
                )}
              </>
            )}
          </div>
        </FullScreen>
      )}
    </div>
  );
};
