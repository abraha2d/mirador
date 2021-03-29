import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Spinner } from "react-bootstrap";
import { useDrag, useDrop } from "react-dnd";
import {
  FullScreen,
  FullScreenHandle,
  useFullScreenHandle,
} from "react-full-screen";
import ReactHlsPlayer from "react-hls-player";

import HlsJs from "hls.js";

import { Context } from "components/Store";
import { START_STREAM } from "components/Store/constants";
import { Stream, Video } from "components/Store/types";
import { DragItemTypes } from "utils";

import "./StreamContainer.css";

type StreamContainerProps = {
  gridSide: number;
  x: number;
  y: number;
  stream?: Stream;
  onDrag: (dragStart: boolean) => void;
  fullscreenHandle: FullScreenHandle;
};

export const StreamContainer = ({
  gridSide,
  x,
  y,
  stream,
  onDrag,
  fullscreenHandle,
}: StreamContainerProps) => {
  const [{ cameras, date, videos }, dispatch] = useContext(Context);
  const camera = stream && cameras.find((camera) => camera.id === stream.id);

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
          url: `/stream/${camera.id}/out.m3u8`,
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

  const vid =
    stream &&
    camera?.last_ping &&
    date.getTime() > new Date(camera.last_ping).getTime()
      ? stream
      : videos.find(
          (v) =>
            stream &&
            v.camera === stream.id &&
            v.startDate?.getTime() < date.getTime() &&
            v.endDate?.getTime() > date.getTime()
        );
  const videoUrl = vid ? ("url" in vid ? vid.url : vid.file) : "";

  const videoRef = useRef(null);
  const [isLoading, setLoading] = useState(true);
  const video = useMemo(
    () =>
      videoUrl &&
      (stream && videoUrl === stream.url && HlsJs.isSupported() ? (
        <ReactHlsPlayer
          playerRef={videoRef}
          url={videoUrl}
          autoPlay
          onLoadStart={() => setLoading(true)}
          onPlaying={() => setLoading(false)}
          onPause={() => setLoading(true)}
        />
      ) : (
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-100 h-100"
          autoPlay
          onLoadStart={() => setLoading(true)}
          onPlaying={() => setLoading(false)}
          onPause={() => setLoading(true)}
        />
      )),
    [stream, videoUrl]
  );

  useEffect(() => {
    if (!videoRef.current || !("startDate" in vid! || "url" in vid!)) return;
    const selectedTime =
      stream && videoUrl === stream.url
        ? (videoRef.current as any).duration -
          (new Date().getTime() - date.getTime()) / 1000
        : (date.getTime() - (vid as Video).startDate.getTime()) / 1000;
    if (Math.abs(selectedTime - (videoRef.current as any).currentTime) > 2) {
      (videoRef.current as any).currentTime = selectedTime;
      (videoRef.current as any).play();
    }
  }, [date, stream, vid, videoUrl]);

  const handle = useFullScreenHandle();

  return (
    <div
      ref={drop}
      className={`stream-container ${
        fullscreenHandle.active ? "" : "border-right border-bottom"
      }`}
      style={{
        left: `${x * (100 / gridSide)}%`,
        top: `${y * (100 / gridSide)}%`,
        width: `${100 / gridSide}%`,
        height: `${100 / gridSide}%`,
      }}
      onDoubleClick={
        stream ? (handle.active ? handle.exit : handle.enter) : () => {}
      }
    >
      <div
        className={`color-overlay ${
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
            ref={drag}
            className="w-100 h-100 d-flex flex-column align-items-center justify-content-center"
          >
            {video}
            {isLoading && (
              <>
                <div className="position-absolute p-3 bg-dark opacity-75 rounded-circle">
                  <Spinner animation="border" variant="light" className="p-3" />
                </div>
                {stream && (
                  <span
                    className="position-absolute w-100 p-1 bg-dark opacity-75 text-center text-truncate text-light"
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
