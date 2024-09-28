import type { Stream } from "components/Store/types";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Button } from "react-bootstrap";
import { Download } from "react-bootstrap-icons";
import { LIVE_VIEW_SLOP_SECS } from "shared/constants";
import { Replay } from "vimond-replay";
import type { PlaybackActions } from "vimond-replay/default-player/Replay";
import "vimond-replay/index.css";
import CompoundVideoStreamer from "vimond-replay/video-streamer/compound";
import { Context } from "../Store";
import { isStream, isStreamUrl, isVideo } from "./utils";

const useVideoContainer = (
  date: Date,
  stream?: Stream,
  background?: string,
) => {
  const [isLoading, setLoading] = useState(false);
  const [isError, setError] = useState(false);
  const [tokenState, setTokenState] = useState<[string, string]>();

  const [playbackActions, setPlaybackActions] = useState<PlaybackActions>();

  const [{ cameras, isPlaying, isMuted, videos }] = useContext(Context);
  const camera = cameras.find((camera) => camera.id === stream?.id);

  const source =
    videos.find(
      (video) =>
        video.camera === camera?.id &&
        video.startDate <= date &&
        video.endDate >= date,
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
      setTokenState(["", ""]);
      fetch(`/auth/token/request?aud=${sourceUrl}`)
        .then((response) => {
          setLoading(false);
          if (response.ok) {
            setError(false);
            return response.text();
          }
          setError(true);
          throw new Error();
        })
        .then((response) => setTokenState([sourceUrl, response]));
    }
  }, [sourceUrl]);

  const syncStreamState = useCallback(() => {
    if (!playbackActions) return;
    const streamState = playbackActions.inspect();

    playbackActions.setProperties({
      isPaused: !!background || !isPlaying,
      isMuted,
    });

    if (!streamState.duration || !streamState.position) return;

    let selectedTime = isVideo(source)
      ? ((+date - +source.startDate) / 1000) *
        (streamState.duration / ((+source.endDate - +source.startDate) / 1000))
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
        Math.round(streamState.duration),
      );
      playbackActions.setPosition(selectedTime);
    }
  }, [background, date, isMuted, isPlaying, playbackActions, source]);

  useEffect(syncStreamState);

  // biome-ignore lint/correctness/useExhaustiveDependencies(isMuted): intentionally omitted
  // biome-ignore lint/correctness/useExhaustiveDependencies(isPlaying): intentionally omitted
  const video = useMemo(() => {
    if (!tokenState) return;
    const [tokenSource, token] = tokenState;
    const sourceUrlWithToken = `${tokenSource}?token=${token}`;

    const videoContainerProps = {
      className: "w-100 h-100 align-items-stretch",
      style: background ? { display: "none" } : {},
    };

    return (
      <div key={tokenSource || background} {...videoContainerProps}>
        <Replay
          source={sourceUrlWithToken}
          onPlaybackActionsReady={setPlaybackActions}
          initialPlaybackProps={{
            isMuted,
            isPaused: !!background || !isPlaying,
          }}
        >
          <CompoundVideoStreamer />
        </Replay>

        {!isStreamUrl(tokenSource) && (
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
    );
  }, [background, tokenState]);

  return { isError, isLoading, source, video };
};

export default useVideoContainer;
