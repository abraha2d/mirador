import React, { useContext } from "react";
import { Button, ButtonGroup, ButtonToolbar } from "react-bootstrap";
import { ArrowsFullscreen } from "react-bootstrap-icons";
import { FullScreenHandle } from "react-full-screen";

import { Timeline } from "components";
import { Context } from "components/Store";
import { SET_GRIDSIZE } from "components/Store/constants";

import "./ControlBar.css";

export type ControlBarProps = {
  fullscreenHandle: FullScreenHandle;
};

export const ControlBar = ({ fullscreenHandle }: ControlBarProps) => {
  const [{ gridSize }, dispatch] = useContext(Context);
  return (
    <div className={`control-bar ${fullscreenHandle.active ? "" : "bg-dark"}`}>
      <ButtonToolbar>
        <ButtonGroup className="pr-2">
          {[1, 4, 9, 16].map((gs) => (
            <Button
              key={gs}
              variant={gs === gridSize ? "light" : "secondary"}
              onClick={() =>
                dispatch && dispatch({ type: SET_GRIDSIZE, payload: gs })
              }
            >
              {gs}
            </Button>
          ))}
        </ButtonGroup>
      </ButtonToolbar>
      <Timeline />
      <ButtonToolbar>
        {/*<ButtonGroup className="pl-2">*/}
        {/*  <Button variant="light" className="d-flex align-items-center">*/}
        {/*    <VolumeUpFill />*/}
        {/*  </Button>*/}
        {/*</ButtonGroup>*/}
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
