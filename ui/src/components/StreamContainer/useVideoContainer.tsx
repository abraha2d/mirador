import { Stream } from "components/Store/types";
import React, {
  Fragment,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import HlsJs from "hls.js";
import ReactHlsPlayer from "react-hls-player";
import { isStream, isVideo } from "./utils";
import { Context } from "../Store";
import { Button } from "react-bootstrap";
import { Download } from "react-bootstrap-icons";

const useVideoContainer = (
  date: Date,
  stream?: Stream,
  background?: string
) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setLoading] = useState(false);
  const [isError, setError] = useState(false);
  const [[aud, token], setToken] = useState<[string, string]>(["", ""]);

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

  const videoProps = {
    src: sourceUrlWithToken,
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

  const isHLS = isStream(source) && HlsJs.isSupported();

  const video =
    sourceUrlWithToken &&
    (isHLS ? (
      <ReactHlsPlayer
        playerRef={videoRef}
        key={sourceUrl || background}
        {...videoProps}
      />
    ) : (
      <Fragment key={sourceUrl || background}>
        <video ref={videoRef} {...videoProps} />
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
      </Fragment>
    ));

  return { isError, isLoading, source, sourceUrlWithToken, video, videoRef };
};

export default useVideoContainer;
