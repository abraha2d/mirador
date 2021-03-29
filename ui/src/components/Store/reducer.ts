import {
  SET_CAMERAS,
  SET_DATE,
  SET_GRIDSIZE,
  SET_VIDEOS,
  START_STREAM,
  START_STREAM_ALL,
  STOP_STREAM,
  STOP_STREAM_ALL,
} from "./constants";
import { ActionType, StateType } from "./types";
import { findOpenIdx, findStreamIdx, resizeGrid } from "./utils";

export const Reducer = (state: StateType, action: ActionType): StateType => {
  switch (action.type) {
    case SET_CAMERAS:
      return {
        ...state,
        cameras: action.payload,
      };
    case SET_DATE:
      return {
        ...state,
        date: action.payload,
      };
    case SET_GRIDSIZE:
      return resizeGrid(state, action.payload);
    case SET_VIDEOS:
      return {
        ...state,
        videos: action.payload,
      };
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
          if (streamToSwapWith && !action.payload.replace) {
            state.streams.set(existingIdx, streamToSwapWith);
          } else {
            state.streams.delete(existingIdx);
          }
        }
        state.streams.set(idx, action.payload.stream);
      }
      state.streamIds = Array.from(state.streams).map(([, s]) => s.id);
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
          state.streams.set(openIdx, {
            id: camera.id,
          });
        }
      }
      state.streamIds = Array.from(state.streams).map(([, s]) => s.id);
      return {
        ...state,
      };
    case STOP_STREAM:
      const streamIdx = findStreamIdx(state, action.payload);
      if (streamIdx > -1) {
        state.streams.delete(streamIdx);
      }
      state.streamIds = Array.from(state.streams).map(([, s]) => s.id);
      return {
        ...state,
      };
    case STOP_STREAM_ALL:
      return {
        ...state,
        streams: new Map(),
        streamIds: [],
      };
    default:
      return state;
  }
};

export default Reducer;
