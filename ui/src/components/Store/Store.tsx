import React, { createContext, useReducer } from "react";
import Reducer from "components/Store/reducer";
import { ContextType, StateType } from "components/Store/types";

type StoreProps = {
  children: React.ReactNode;
};

const initialState: StateType = {
  gridSize: 1,
  cameras: [],
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
