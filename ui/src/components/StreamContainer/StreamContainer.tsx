import HlsJs from "hls.js";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import { Download, ExclamationCircle } from "react-bootstrap-icons";
import { useDrag, useDrop } from "react-dnd";
import {
  FullScreen,
  FullScreenHandle,
  useFullScreenHandle,
} from "react-full-screen";
import ReactHlsPlayer from "react-hls-player";

import { Context } from "components/Store";
import { START_STREAM } from "components/Store/constants";
import { Stream, Video } from "components/Store/types";
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
  const [
    { cameras, date, isPlaying, isMuted, playbackSpeed, videos },
    dispatch,
  ] = useContext(Context);
  const camera = cameras.find((camera) => camera.id === stream?.id);

  const handle = useFullScreenHandle();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setLoading] = useState(false);
  const [isError, setError] = useState(false);

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
    camera && camera.lastPing && date > camera.lastPing
      ? stream
      : videos.find(
          (video) =>
            video.camera === camera?.id &&
            video.startDate < date &&
            video.endDate > date
        );

  const isVideo = (source: Stream | Video | undefined): source is Video =>
    !!source && "file" in source;
  const isStream = (source: Stream | Video | undefined): source is Stream =>
    !!source && !isVideo(source);

  const sourceUrl = isVideo(source)
    ? source.file
    : isStream(source)
    ? `/stream/${source.id}/out.m3u8`
    : "";

  const isHLS = isStream(source) && HlsJs.isSupported();

  const video = useMemo(
    () =>
      isHLS ? (
        <ReactHlsPlayer
          playerRef={videoRef}
          url={sourceUrl}
          autoPlay
          onLoadStart={() => setLoading(true)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          onCanPlay={() => {
            setLoading(false);
            setError(false);
          }}
        />
      ) : (
        <video
          ref={videoRef}
          src={sourceUrl}
          className="w-100 h-100"
          autoPlay
          onLoadStart={() => setLoading(true)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          onCanPlay={() => {
            setLoading(false);
            setError(false);
          }}
        />
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stream, isHLS]
  );

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = isMuted;
  }, [isLoading, isMuted]);

  useEffect(() => {
    if (!videoRef.current) return;
    isPlaying ? videoRef.current.play() : videoRef.current.pause();
  }, [isLoading, isPlaying]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isNaN(videoRef.current.duration)) return;
    const speedComp =
      isVideo(source) && !isNaN(videoRef.current.duration)
        ? videoRef.current.duration /
          ((+source.endDate - +source.startDate) / 1000)
        : 1;
    try {
      videoRef.current.playbackRate = speedComp * playbackSpeed;
    } catch (error) {
      console.log(error);
    }
  }, [isLoading, source, playbackSpeed]);

  useEffect(() => {
    if (!videoRef.current || isHLS) return;
    videoRef.current.src = sourceUrl;
  }, [isHLS, sourceUrl]);

  useEffect(() => {
    if (!videoRef.current || isNaN(videoRef.current.duration) || !source)
      return;
    const selectedTime = isVideo(source)
      ? ((+date - +source.startDate) / 1000) *
        (videoRef.current.duration /
          ((+source.endDate - +source.startDate) / 1000))
      : videoRef.current.duration - (+new Date() - +date) / 1000;
    if (Math.abs(selectedTime - videoRef.current.currentTime) > 2) {
      console.log("ADJUSTING");
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
            {(isLoading || isError) && (
              <>
                <div
                  className={`position-absolute p-3 ${
                    isError ? "bg-danger" : "bg-dark"
                  } opacity-75 rounded-circle`}
                >
                  {isLoading ? (
                    <Spinner
                      animation="border"
                      variant="light"
                      className="p-3"
                    />
                  ) : (
                    isError && <ExclamationCircle color="white" size="2.5em" />
                  )}
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
            {isVideo(source) && (
              <Button
                variant="dark"
                className="position-absolute top-0 right-0 m-3 opacity-50"
                href={source.file}
                // @ts-ignore `download` will be passed down through Button to
                // the underlying HTML <a> tag (guaranteed by the `href` prop).
                download
              >
                <Download />
              </Button>
            )}
          </div>
        </FullScreen>
      )}
    </div>
  );
};
