import React, { createContext, useReducer } from "react";
import Reducer from "./reducer";
import { ContextType, StateType } from "./types";

const initialState: StateType = {
  cameras: [],
  date: new Date(),
  gridSize: 1,
  isMuted: false,
  isPlaying: true,
  streams: new Map(),
  streamIds: [],
  videos: [],
};

type StoreProps = {
  children: React.ReactNode;
};

export const Store = ({ children }: StoreProps) => (
  <Context.Provider value={useReducer(Reducer, initialState)}>
    {children}
  </Context.Provider>
);

const context: ContextType = [initialState];
export const Context = createContext(context);

export default Store;
