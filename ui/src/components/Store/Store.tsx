import type React from "react";
import { createContext, useReducer } from "react";
import Reducer from "./reducer";
import type { ContextType, StateType } from "./types";

const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");

const initialState: StateType = {
  cameras: [],
  date: new Date(),
  gridSize: 1,
  isDarkMode: darkModeQuery.matches,
  isMuted: false,
  isPlaying: true,
  isScrubbing: false,
  colorMode: darkModeQuery.matches ? "dark" : "light",
  playbackSpeed: 1,
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
