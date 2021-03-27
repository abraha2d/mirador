import React, { createContext, useReducer } from "react";
import Reducer from "./reducer";
import { ContextType, StateType } from "./types";

const initialState: StateType = {
  cameras: [],
  date: new Date(),
  gridSize: 1,
  streams: new Map(),
  videos: [],
};

type StoreProps = {
  children: React.ReactNode;
};

export const Store = ({ children }: StoreProps) => {
  const [state, dispatch] = useReducer(Reducer, initialState);
  return (
    <Context.Provider value={[state, dispatch]}>{children}</Context.Provider>
  );
};

const context: ContextType = [initialState];
export const Context = createContext(context);

export default Store;
