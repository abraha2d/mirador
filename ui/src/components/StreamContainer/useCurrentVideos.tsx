import { Stream } from "../Store/types";
import { useContext, useEffect } from "react";
import { Context } from "../Store";
import { isVideo } from "./utils";
import useVideoContainer from "./useVideoContainer";
import { LIVE_VIEW_SLOP_SECS } from "shared/constants";

const useCurrentVideos = (stream?: Stream) => {
  const [{ date, isPlaying, isMuted, playbackSpeed }] = useContext(Context);

  const { isError, isLoading, source, sourceUrlWithToken, video, videoRef } =
    useVideoContainer(date, stream);

  // TODO: Seamless playback is not working as intended with JWT auth
  // const prevDate = isVideo(source) ? source.startDate : new Date(0);
  // prevDate.setMilliseconds(prevDate.getMilliseconds() - 1);
  //
  // const nextDate = isVideo(source) ? source.endDate : new Date(0);
  // nextDate.setMilliseconds(nextDate.getMilliseconds() + 1);
  //
  // const {
  //   source: prevSource,
  //   video: prevVideo,
  //   videoRef: prevVideoRef,
  // } = useVideoContainer(prevDate, stream, "prev");
  // const {
  //   source: nextSource,
  //   video: nextVideo,
  //   videoRef: nextVideoRef,
  // } = useVideoContainer(nextDate, stream, "next");
  //
  // useEffect(() => {
  //   if (prevVideoRef.current) {
  //     prevVideoRef.current.pause();
  //     prevVideoRef.current.currentTime = 0;
  //   }
  //   if (nextVideoRef.current) {
  //     nextVideoRef.current.pause();
  //     nextVideoRef.current.currentTime = 0;
  //   }
  // }, [prevSource, prevVideoRef, nextSource, nextVideoRef]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = isMuted;
  }, [sourceUrlWithToken, videoRef, isMuted]);

  useEffect(() => {
    if (!videoRef.current) return;
    isPlaying ? videoRef.current.play() : videoRef.current.pause();
  }, [sourceUrlWithToken, videoRef, isPlaying]);

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
  }, [source, sourceUrlWithToken, videoRef, playbackSpeed]);

  useEffect(() => {
    if (!videoRef.current || isNaN(videoRef.current.duration) || !source)
      return;
    const selectedTime = isVideo(source)
      ? ((+date - +source.startDate) / 1000) *
        (videoRef.current.duration /
          ((+source.endDate - +source.startDate) / 1000))
      : videoRef.current.duration - (+new Date() - +date) / 1000;
    if (
      Math.abs(selectedTime - videoRef.current.currentTime) >
      LIVE_VIEW_SLOP_SECS
    ) {
      console.log("ADJUSTING");
      videoRef.current.currentTime = selectedTime;
    }
  }, [source, sourceUrlWithToken, videoRef, date]);

  // TODO: Seamless playback is not working as intended with JWT auth
  // const videoList = [video, prevVideo, nextVideo];
  const videoList = [video];

  return { isError, isLoading, source, videoList };
};

export default useCurrentVideos;
