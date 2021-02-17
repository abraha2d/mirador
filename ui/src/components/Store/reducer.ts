import { ADD_CAMERA, REMOVE_CAMERA, SET_GRIDSIZE } from "./constants";
import { StateType } from "components/Store/types";

export const Reducer = (state: StateType, action: any): StateType => {
  switch (action.type) {
    case SET_GRIDSIZE:
      return {
        ...state,
        gridSize: action.payload,
      };
    case ADD_CAMERA:
      return {
        ...state,
      };
    case REMOVE_CAMERA:
      return {
        ...state,
      };
    default:
      return state;
  }
};

export default Reducer;
