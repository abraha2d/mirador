import {
  START_STREAM,
  STOP_STREAM,
  SET_STREAMS,
  SET_GRIDSIZE,
} from "./constants";
import { StateType, Stream } from "components/Store/types";

const findOpenIdx = (state: StateType): number => {
  for (let i = 0; i < state.gridSize; i++) {
    if (!state.streams.get(i)) {
      return i;
    }
  }
  return -1;
};

const findStreamIdx = (state: StateType, streamId: number): number => {
  for (let i = 0; i < state.gridSize; i++) {
    if (state.streams.get(i) && state.streams.get(i)!.id === streamId) {
      return i;
    }
  }
  return -1;
};

const idxToCoord = (idx: number, gridSize: number): [number, number] => [
  idx % gridSize,
  Math.floor(idx / gridSize),
];

const coordToIdx = (coord: [number, number], gridSize: number): number =>
  coord[1] * gridSize + coord[0];

const resizeGrid = (state: StateType, newGridSize: number): StateType => {
  const newStreams: Map<number, Stream> = new Map();
  for (let i = 0; i < state.gridSize; i++) {
    newStreams.set(
      coordToIdx(idxToCoord(i, state.gridSize), newGridSize),
      state.streams.get(i)!
    );
  }
  state.gridSize = newGridSize;
  state.streams = newStreams;
  return state;
};

export const Reducer = (state: StateType, action: any): StateType => {
  switch (action.type) {
    case SET_GRIDSIZE:
      return {
        ...resizeGrid(state, action.payload),
      };
    case SET_STREAMS:
      return {
        ...state,
        streams: action.payload,
      };
    case START_STREAM:
      const openIdx = findOpenIdx(state);
      if (openIdx > -1) {
        state.streams.set(openIdx, action.payload);
      }
      return {
        ...state,
      };
    case STOP_STREAM:
      const streamIdx = findStreamIdx(state, action.payload);
      if (streamIdx > -1) {
        state.streams.delete(streamIdx);
      }
      return {
        ...state,
      };
    default:
      return state;
  }
};

export default Reducer;
