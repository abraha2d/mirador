import React from "react";

// TODO: Generate from DRF
export type Camera = {
  id: number;
  enabled: boolean;
  last_ping?: Date;
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
  url: string;
  name: string;
};

export type StateType = {
  cameras: Camera[];
  date: Date;
  gridSize: number;
  streams: Map<number, Stream>;
  videos: Video[];
};

export type ContextType = [StateType, React.Dispatch<any>?];
