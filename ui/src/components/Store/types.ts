import React from "react";

// TODO: Generate from DRF
export type Camera = {
  id: number;
  enabled: boolean;
  lastPing?: Date;
  name: string;
};

// TODO: Generate from DRF
export type Video = {
  camera?: number;
  startDate: Date;
  endDate: Date;
  file: string;
};

export type Stream = {
  id: number;
};

export type StateType = {
  cameras: Camera[];
  date: Date;
  gridSize: number;
  isMuted: boolean;
  isPlaying: boolean;
  playbackSpeed: number;
  streams: Map<number, Stream>;
  streamIds: number[];
  videos: Video[];
};

export type ActionType =
  | {
      type: "SET_CAMERAS";
      payload: Camera[];
    }
  | {
      type: "SET_DATE";
      payload: Date;
    }
  | {
      type: "SET_GRIDSIZE";
      payload: number;
    }
  | {
      type: "SET_MUTED";
      payload: boolean;
    }
  | {
      type: "SET_PLAYBACK_SPEED";
      payload: number;
    }
  | {
      type: "SET_PLAYING";
      payload: boolean;
    }
  | {
      type: "SET_VIDEOS";
      payload: Video[];
    }
  | {
      type: "START_STREAM";
      payload: {
        idx: number;
        stream: Stream;
        replace?: boolean;
      };
    }
  | { type: "START_STREAM_ALL" }
  | { type: "STOP_STREAM"; payload: number }
  | { type: "STOP_STREAM_ALL" };

export type ContextType = [StateType, React.Dispatch<any>?];
