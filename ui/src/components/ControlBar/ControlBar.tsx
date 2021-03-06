import { Timeline } from "components/Timeline";
import { useContext } from "react";
import { Button, ButtonGroup, ButtonToolbar } from "react-bootstrap";
import { ArrowsFullscreen, VolumeUpFill } from "react-bootstrap-icons";
import { FullScreenHandle } from "react-full-screen";
import { Context } from "components/Store";
import { SET_GRIDSIZE } from "components/Store/constants";

export type ControlBarProps = {
  fullscreenHandle: FullScreenHandle;
};

export const ControlBar = ({ fullscreenHandle }: ControlBarProps) => {
  const [state, dispatch] = useContext(Context);
  return (
    <div
      className={`d-flex justify-content-between p-2 rounded-bottom${
        fullscreenHandle.active ? "" : " bg-dark"
      }`}
      style={{ margin: "0 1px" }}
    >
      <ButtonToolbar>
        <ButtonGroup className="pr-2">
          {[1, 4, 9, 16].map((gridSize) => (
            <Button
              key={gridSize}
              variant={state.gridSize === gridSize ? "light" : "secondary"}
              onClick={() =>
                dispatch && dispatch({ type: SET_GRIDSIZE, payload: gridSize })
              }
            >
              {gridSize}
            </Button>
          ))}
        </ButtonGroup>
      </ButtonToolbar>
      <Timeline />
      <ButtonToolbar>
        <ButtonGroup className="pl-2">
          <Button variant="light" className="d-flex align-items-center">
            <VolumeUpFill />
          </Button>
        </ButtonGroup>
        <ButtonGroup className="pl-2">
          <Button
            variant={fullscreenHandle.active ? "primary" : "light"}
            className="d-flex align-items-center"
            onClick={
              fullscreenHandle.active
                ? fullscreenHandle.exit
                : fullscreenHandle.enter
            }
          >
            <ArrowsFullscreen />
          </Button>
        </ButtonGroup>
      </ButtonToolbar>
    </div>
  );
};
