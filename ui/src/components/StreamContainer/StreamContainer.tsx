import HlsJs from "hls.js";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Spinner } from "react-bootstrap";
import { useDrag, useDrop } from "react-dnd";
import {
  FullScreen,
  FullScreenHandle,
  useFullScreenHandle,
} from "react-full-screen";
import ReactHlsPlayer from "react-hls-player";

import { Context } from "components/Store";
import { START_STREAM } from "components/Store/constants";
import { Stream } from "components/Store/types";
import { DragItemTypes, DragObjectWithPayload } from "utils";

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
  const camera = cameras.find((camera) => camera.id === stream?.id);

  const handle = useFullScreenHandle();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setLoading] = useState(true);

  const [{ isOver, itemType }, drop] = useDrop({
    accept: [DragItemTypes.CAMERA, DragItemTypes.STREAM],
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      itemType: monitor.getItemType(),
    }),
    drop: (item: DragObjectWithPayload) => {
      if (!dispatch) return;

      let stream: Stream;
      let replace = false;

      switch (item.type) {
        case DragItemTypes.CAMERA:
          stream = {
            id: item.camera.id,
          };
          replace = true;
          break;
        case DragItemTypes.STREAM:
          stream = item.stream;
          break;
      }

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

  const source =
    camera?.lastPing && date > camera?.lastPing
      ? stream
      : videos.find(
          (video) =>
            video.camera === camera?.id &&
            video.startDate < date &&
            video.endDate > date
        );

  const sourceUrl =
    source &&
    ("file" in source ? source.file : `/stream/${source.id}/out.m3u8`);

  const video = useMemo(
    () =>
      sourceUrl &&
      (sourceUrl.slice(-4) === "m3u8" && HlsJs.isSupported() ? (
        <ReactHlsPlayer
          playerRef={videoRef}
          url={sourceUrl}
          autoPlay
          onLoadStart={() => setLoading(true)}
          onPlaying={() => setLoading(false)}
          onPause={() => setLoading(true)}
        />
      ) : (
        <video
          ref={videoRef}
          src={sourceUrl}
          className="w-100 h-100"
          autoPlay
          onLoadStart={() => setLoading(true)}
          onPlaying={() => setLoading(false)}
          onPause={() => setLoading(true)}
        />
      )),
    [sourceUrl]
  );

  useEffect(() => {
    if (!videoRef.current || !source) return;
    const selectedTime =
      "file" in source
        ? (+date - +source.startDate) / 1000
        : videoRef.current.duration - (+new Date() - +date) / 1000;
    if (Math.abs(selectedTime - videoRef.current.currentTime) > 1) {
      videoRef.current.currentTime = selectedTime;
    }
  }, [date, source]);

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
        source ? (handle.active ? handle.exit : handle.enter) : () => {}
      }
    >
      <div
        className={`color-overlay ${
          isDragging
            ? "bg-secondary"
            : isOver
            ? source
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
      {sourceUrl && (
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
                {camera && (
                  <span
                    className="position-absolute w-100 p-1 bg-dark opacity-75 text-center text-truncate text-light"
                    style={{ bottom: 0 }}
                  >
                    {camera.name}
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
