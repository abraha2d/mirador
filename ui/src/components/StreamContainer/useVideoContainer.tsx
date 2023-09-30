import { Stream } from "components/Store/types";
import React, { useContext, useRef, useState } from "react";
import HlsJs from "hls.js";
import ReactHlsPlayer from "react-hls-player";
import { isStream, isVideo } from "./utils";
import { Context } from "../Store";

const useVideoContainer = (
  date: Date,
  stream?: Stream,
  background?: string
) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setLoading] = useState(false);
  const [isError, setError] = useState(false);

  const [{ cameras, videos }] = useContext(Context);
  const camera = cameras.find((camera) => camera.id === stream?.id);

  const source =
    camera && camera.lastPing && date > camera.lastPing
      ? stream
      : videos.find(
          (video) =>
            video.camera === camera?.id &&
            video.startDate < date &&
            video.endDate > date
        );

  const sourceUrl = isVideo(source)
    ? source.file
    : isStream(source)
    ? `/stream/${source.id}/out.m3u8`
    : "";

  const isHLS = isStream(source) && HlsJs.isSupported();

  const videoProps = {
    key: sourceUrl || background,
    src: sourceUrl,
    className: "w-100 h-100",
    autoPlay: !background,
    onLoadStart: () => setLoading(true),
    onError: () => {
      setLoading(false);
      setError(true);
    },
    onCanPlay: () => {
      setLoading(false);
      setError(false);
    },
    style: background ? { display: "none" } : {},
  };

  const video = isHLS ? (
    <ReactHlsPlayer playerRef={videoRef} {...videoProps} />
  ) : (
    <video ref={videoRef} {...videoProps} />
  );

  return { isError, isLoading, source, video, videoRef };
};

export default useVideoContainer;
