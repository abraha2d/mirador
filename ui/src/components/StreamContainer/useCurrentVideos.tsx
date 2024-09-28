import { useContext } from "react";
import { Context } from "../Store";
import type { Stream } from "../Store/types";
import useVideoContainer from "./useVideoContainer";
// import { isVideo } from "./utils";

const useCurrentVideos = (stream?: Stream) => {
  const [{ date }] = useContext(Context);

  const { isError, isLoading, source, video } = useVideoContainer(date, stream);

  // const prevDate = new Date(isVideo(source) ? +source.startDate - 1 : 0);
  // const { video: prevVideo } = useVideoContainer(prevDate, stream, "prev");
  //
  // const nextDate = new Date(isVideo(source) ? +source.endDate + 1 : 0);
  // const { video: nextVideo } = useVideoContainer(nextDate, stream, "next");

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

  // const videoList = [video, prevVideo, nextVideo];
  const videoList = [video];

  return { isError, isLoading, source, videoList };
};

export default useCurrentVideos;
