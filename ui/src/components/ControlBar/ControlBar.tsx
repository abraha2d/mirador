import { useContext } from "react";
import { Button, ButtonGroup, ButtonToolbar } from "react-bootstrap";
import { Context } from "components/Store";
import {
  SET_GRIDSIZE,
  START_STREAM_ALL,
  STOP_STREAM_ALL,
} from "components/Store/constants";
import { ArrowsFullscreen, PlayFill, StopFill } from "react-bootstrap-icons";

export const ControlBar = () => {
  const [state, dispatch] = useContext(Context);
  return (
    <div
      className="d-flex justify-content-between bg-dark p-2 rounded-bottom"
      style={{ margin: "0 1px" }}
    >
      <ButtonToolbar className="">
        <ButtonGroup>
          {[1, 4, 9, 16].map((gridSize) => (
            <Button
              key={gridSize}
              variant={state.gridSize === gridSize ? "light" : "secondary"}
              active={state.gridSize === gridSize}
              onClick={() =>
                dispatch && dispatch({ type: SET_GRIDSIZE, payload: gridSize })
              }
            >
              {gridSize}
            </Button>
          ))}
        </ButtonGroup>
      </ButtonToolbar>
      <ButtonToolbar>
        <ButtonGroup className="pr-2">
          <Button
            variant="light"
            className="d-flex align-items-center"
            onClick={() => dispatch && dispatch({ type: START_STREAM_ALL })}
          >
            <PlayFill />
          </Button>
          <Button
            variant="light"
            className="d-flex align-items-center"
            onClick={() => dispatch && dispatch({ type: STOP_STREAM_ALL })}
          >
            <StopFill />
          </Button>
        </ButtonGroup>
        <ButtonGroup>
          <Button variant="light" className="d-flex align-items-center">
            <ArrowsFullscreen />
          </Button>
        </ButtonGroup>
      </ButtonToolbar>
    </div>
  );
};
