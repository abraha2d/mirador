import { useContext } from "react";
import { Button, ButtonGroup, ButtonToolbar } from "react-bootstrap";
import { Context } from "components/Store";
import { SET_GRIDSIZE } from "components/Store/constants";
import { ArrowsFullscreen, Fullscreen } from "react-bootstrap-icons";

export const ControlBar = () => {
  const [state, dispatch] = useContext(Context);
  return (
    <div className="bg-light p-2 rounded-bottom">
      <ButtonToolbar className="justify-content-between">
        <ButtonGroup>
          {[1, 4, 9, 16].map((gridSize) => (
            <Button
              key={gridSize}
              variant="outline-dark"
              active={state.gridSize === gridSize}
              onClick={() =>
                dispatch && dispatch({ type: SET_GRIDSIZE, payload: gridSize })
              }
            >
              {gridSize}
            </Button>
          ))}
        </ButtonGroup>
        <ButtonGroup>
          <Button variant="outline-dark" className="d-flex align-items-center">
            <ArrowsFullscreen />
          </Button>
        </ButtonGroup>
      </ButtonToolbar>
    </div>
  );
};
