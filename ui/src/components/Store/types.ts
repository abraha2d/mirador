import React from "react";

// TODO: Generate from DRF
export type Camera = {
  id: number;
  enabled: boolean;
  name: string;
  online: boolean;
  videoEnd?: Date;
  streamStart?: Date;
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
  isDarkMode: boolean;
  isMuted: boolean;
  isPlaying: boolean;
  isScrubbing: boolean;
  colorMode: "light" | "dark";
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
      type: "SET_DARK_MODE";
      payload: boolean;
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
      type: "SET_SCRUBBING";
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
  | {
      type: "START_STREAM_ALL";
    }
  | {
      type: "STOP_STREAM";
      payload: number;
    }
  | {
      type: "STOP_STREAM_ALL";
    };

export type ContextType = [StateType, React.Dispatch<any>?];
