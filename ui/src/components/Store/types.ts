import React from "react";

export type StateType = {
  gridSize: number;
  cameras: number[];
};

export type ContextType = [StateType, React.Dispatch<any>?];
