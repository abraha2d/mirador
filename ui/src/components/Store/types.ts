import React from "react";

export type Stream = {
  id: number;
  url: string;
};

export type StateType = {
  cameras: any[];
  gridSize: number;
  streams: Map<number, Stream>;
};

export type ContextType = [StateType, React.Dispatch<any>?];
