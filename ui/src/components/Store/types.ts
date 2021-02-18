import React from "react";

export type Stream = {
  id: number;
  url: string;
};

export type StateType = {
  gridSize: number;
  streams: Map<number, Stream>;
};

export type ContextType = [StateType, React.Dispatch<any>?];
