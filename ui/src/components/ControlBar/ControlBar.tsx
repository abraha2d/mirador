import React, { useContext } from "react";
import {
  Button,
  ButtonGroup,
  ButtonToolbar,
  DropdownButton,
} from "react-bootstrap";
import {
  ArrowsFullscreen,
  Grid3x3,
  VolumeMuteFill,
  VolumeUpFill,
} from "react-bootstrap-icons";
import { FullScreenHandle } from "react-full-screen";

import { Timeline } from "components";
import { Context } from "components/Store";
import { SET_GRIDSIZE, SET_MUTED } from "components/Store/constants";

import "./ControlBar.css";

export type ControlBarProps = {
  fullscreenHandle: FullScreenHandle;
};

export const ControlBar = ({ fullscreenHandle }: ControlBarProps) => {
  const [{ gridSize, isMuted }, dispatch] = useContext(Context);
  return (
    <div className={`control-bar ${fullscreenHandle.active ? "" : "bg-dark"}`}>
      <ButtonToolbar className="pe-2">
        <DropdownButton
          drop="up"
          title={<Grid3x3 className="gridsize-dropup-icon" />}
          variant="light"
          className="p-0"
        >
          <ButtonGroup className="px-2">
            {[1, 4, 9, 16].map((gs) => (
              <Button
                key={gs}
                variant={gs === gridSize ? "secondary" : "light"}
                onClick={() => dispatch?.({ type: SET_GRIDSIZE, payload: gs })}
              >
                {gs}
              </Button>
            ))}
          </ButtonGroup>
        </DropdownButton>
      </ButtonToolbar>
      <Timeline />
      <ButtonToolbar className="ps-2">
        <Button
          variant="light"
          className="d-flex align-items-center"
          onClick={() => dispatch?.({ type: SET_MUTED, payload: !isMuted })}
        >
          {isMuted ? (
            <VolumeMuteFill className="text-danger" />
          ) : (
            <VolumeUpFill />
          )}
        </Button>
        <Button
          variant={fullscreenHandle.active ? "primary" : "light"}
          className="ms-2 d-flex align-items-center"
          onClick={
            fullscreenHandle.active
              ? fullscreenHandle.exit
              : fullscreenHandle.enter
          }
        >
          <ArrowsFullscreen />
        </Button>
      </ButtonToolbar>
    </div>
  );
};
