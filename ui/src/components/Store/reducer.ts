import {
  SET_CAMERAS,
  SET_GRIDSIZE,
  START_STREAM,
  START_STREAM_ALL,
  STOP_STREAM,
  STOP_STREAM_ALL,
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

const idxToCoord = (idx: number, gridSide: number): [number, number] => [
  idx % gridSide,
  Math.floor(idx / gridSide),
];

const coordToIdx = (coord: [number, number], gridSide: number): number =>
  coord[0] < gridSide && coord[1] < gridSide
    ? coord[1] * gridSide + coord[0]
    : -1;

const resizeGrid = (state: StateType, newGridSize: number): StateType => {
  const newStreams: Map<number, Stream> = new Map();
  const displacedStreams: Stream[] = [];
  for (let i = 0; i < state.gridSize; i++) {
    if (state.streams.get(i)) {
      const newIdx = coordToIdx(
        idxToCoord(i, Math.sqrt(state.gridSize)),
        Math.sqrt(newGridSize)
      );
      if (newIdx !== -1 && newIdx < newGridSize && !newStreams.get(newIdx)) {
        newStreams.set(newIdx, state.streams.get(i)!);
      } else {
        displacedStreams.push(state.streams.get(i)!);
      }
    }
  }
  const newState = { ...state, gridSize: newGridSize, streams: newStreams };
  for (const stream of displacedStreams) {
    const openIdx = findOpenIdx(newState);
    if (openIdx > -1) {
      newState.streams.set(openIdx, stream);
    }
  }
  return newState;
};

export const Reducer = (state: StateType, action: any): StateType => {
  switch (action.type) {
    case SET_CAMERAS:
      return {
        ...state,
        cameras: action.payload,
      };
    case SET_GRIDSIZE:
      return resizeGrid(state, action.payload);
    case START_STREAM:
      const idx =
        state.gridSize === 1
          ? 0
          : action.payload.idx > -1
          ? action.payload.idx
          : findOpenIdx(state);
      if (idx > -1) {
        const existingIdx = findStreamIdx(state, action.payload.stream.id);
        if (existingIdx > -1) {
          const streamToSwapWith = state.streams.get(idx);
          if (streamToSwapWith) {
            state.streams.set(existingIdx, streamToSwapWith);
          } else {
            state.streams.delete(existingIdx);
          }
        }
        state.streams.set(idx, action.payload.stream);
      }
      return {
        ...state,
      };
    case START_STREAM_ALL:
      for (const camera of state.cameras) {
        if (!camera.enabled || findStreamIdx(state, camera.id) > -1) {
          continue;
        }
        const openIdx = findOpenIdx(state);
        if (openIdx > -1) {
          state.streams.set(openIdx, { id: camera.id, url: camera.urls[0] });
        }
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
    case STOP_STREAM_ALL:
      return {
        ...state,
        streams: new Map(),
      };
    default:
      return state;
  }
};

export default Reducer;
