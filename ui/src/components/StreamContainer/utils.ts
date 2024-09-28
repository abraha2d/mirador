import type { Stream, Video } from "../Store/types";

export const isVideo = (source: Stream | Video | undefined): source is Video =>
  !!source && "file" in source;

export const isStream = (
  source: Stream | Video | undefined,
): source is Stream => !!source && !isVideo(source);

export const isStreamUrl = (url: string) => url.includes("stream");
