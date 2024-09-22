import { Stream } from "../Store/types";
import { useContext } from "react";
import { Context } from "../Store";
import useVideoContainer from "./useVideoContainer";

const useCurrentVideos = (stream?: Stream) => {
  const [{ date }] = useContext(Context);

  const { isError, isLoading, source, video } = useVideoContainer(date, stream);

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

  // TODO: Replay does not support setting playback rate
  // useEffect(() => {
  //   if (!videoRef.current) return;
  //   if (isNaN(videoRef.current.duration)) return;
  //   const speedComp =
  //     isVideo(source) && !isNaN(videoRef.current.duration)
  //       ? videoRef.current.duration /
  //         ((+source.endDate - +source.startDate) / 1000)
  //       : 1;
  //   try {
  //     videoRef.current.playbackRate = speedComp * playbackSpeed;
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }, [source, sourceUrlWithToken, videoRef, playbackSpeed]);

  // TODO: Seamless playback is not working as intended with JWT auth
  // const videoList = [video, prevVideo, nextVideo];
  const videoList = [video];

  return { isError, isLoading, source, videoList };
};

export default useCurrentVideos;
