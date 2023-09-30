import { Stream, Video } from "../Store/types";
import ReactHlsPlayer from "react-hls-player";
import React, { RefObject } from "react";
import HlsJs from "hls.js";

export const isVideo = (source: Stream | Video | undefined): source is Video =>
  !!source && "file" in source;
export const isStream = (
  source: Stream | Video | undefined
): source is Stream => !!source && !isVideo(source);
