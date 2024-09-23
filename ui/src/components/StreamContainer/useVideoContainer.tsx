import { Stream } from "components/Store/types";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { isStream, isVideo } from "./utils";
import { Context } from "../Store";
import { Button } from "react-bootstrap";
import { Download } from "react-bootstrap-icons";
import { LIVE_VIEW_SLOP_SECS } from "shared/constants";
import { Replay } from "vimond-replay";
import "vimond-replay/index.css";
import CompoundVideoStreamer from "vimond-replay/video-streamer/compound";
import {
  PlaybackActions,
  VideoStreamState,
} from "vimond-replay/default-player/Replay";

const useVideoContainer = (
  date: Date,
  stream?: Stream,
  background?: string
) => {
  const [isLoading, setLoading] = useState(false);
  const [isError, setError] = useState(false);
  const [[aud, token], setToken] = useState<[string, string]>(["", ""]);

  const [playbackActions, setPlaybackActions] = useState<PlaybackActions>();

  const [{ cameras, isPlaying, isMuted, videos }] = useContext(Context);
  const camera = cameras.find((camera) => camera.id === stream?.id);

  const source =
    videos.find(
      (video) =>
        video.camera === camera?.id &&
        video.startDate <= date &&
        video.endDate >= date
    ) ||
    (camera?.streamStart && date > camera.streamStart && stream) ||
    undefined;

  const sourceUrl = isVideo(source)
    ? source.file
    : isStream(source)
    ? `/stream/${source.id}/out.m3u8`
    : "";

  useEffect(() => {
    if (sourceUrl) {
      setLoading(true);
      setToken(["", ""]);
      fetch(`/auth/token/request?aud=${sourceUrl}`)
        .then((response) => {
          setLoading(false);
          if (response.ok) {
            setError(false);
            return response.text();
          } else {
            setError(true);
            throw new Error();
          }
        })
        .then((response) => setToken([sourceUrl, response]));
    }
  }, [sourceUrl]);

  const sourceUrlWithToken =
    aud === sourceUrl ? `${sourceUrl}?token=${token}` : "";

  const handleStreamStateChange = useCallback(
    (changedState?: VideoStreamState) => {
      if (!playbackActions) return;
      const streamState = playbackActions.inspect();

      playbackActions.setProperties({
        isPaused: !isPlaying,
        isMuted,
      });

      // Don't do anything else if only non-time-related stream state changed
      if (changedState && !changedState.duration && !changedState.position)
        return;
      if (!streamState.duration || !streamState.position) return;

      let selectedTime = isVideo(source)
        ? ((+date - +source.startDate) / 1000) *
          (streamState.duration /
            ((+source.endDate - +source.startDate) / 1000))
        : streamState.duration - (+new Date() - +date) / 1000;

      // If within slop of live edge, explicitly select live edge
      if (Math.abs(streamState.duration - selectedTime) < LIVE_VIEW_SLOP_SECS) {
        selectedTime = streamState.duration;
      }

      if (Math.abs(selectedTime - streamState.position) > LIVE_VIEW_SLOP_SECS) {
        console.log(
          "ADJUSTING",
          Math.round(streamState.position),
          "to",
          Math.round(selectedTime),
          "of",
          Math.round(streamState.duration)
        );
        playbackActions.setPosition(selectedTime);
      }
    },
    [date, isMuted, isPlaying, playbackActions, source]
  );

  useEffect(handleStreamStateChange, [date, isMuted, isPlaying]);

  const video = useMemo(() => {
    const videoContainerProps = {
      className: "w-100 h-100 align-items-stretch",
      style: background ? { display: "none" } : {},
    };

    return (
      sourceUrlWithToken && (
        <div key={sourceUrl || background} {...videoContainerProps}>
          <Replay
            source={sourceUrlWithToken}
            onPlaybackActionsReady={setPlaybackActions}
            onStreamStateChange={handleStreamStateChange}
            initialPlaybackProps={{ isMuted, isPaused: !isPlaying }}
          >
            <CompoundVideoStreamer />
          </Replay>

          {isVideo(source) && (
            <Button
              variant="dark"
              className="position-absolute top-0 end-0 m-3 opacity-50"
              href={sourceUrlWithToken}
              // @ts-ignore `download` will be passed down through Button to
              // the underlying HTML <a> tag (guaranteed by the `href` prop).
              download
              style={background ? { display: "none" } : {}}
            >
              <Download />
            </Button>
          )}
        </div>
      )
    );
  }, [
    background,
    handleStreamStateChange,
    source,
    sourceUrl,
    sourceUrlWithToken,
  ]);

  return { isError, isLoading, source, video };
};

export default useVideoContainer;
