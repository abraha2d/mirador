import React, { useContext } from "react";
import { ToggleButton } from "react-bootstrap";
import { CameraVideoFill, CircleFill } from "react-bootstrap-icons";
import { useDrag } from "react-dnd";

import { Camera } from "components/Store/types";
import { DragItemTypes } from "utils";
import { Context } from "../Store";

type CameraRowProps = {
  camera: Camera;
  selected: boolean;
  onChange: (idx: number) => void;
};

export const CameraRow = ({ camera, selected, onChange }: CameraRowProps) => {
  const [{ colorMode }] = useContext(Context);

  const [{ isDragging }, drag] = useDrag({
    canDrag: camera.enabled,
    type: DragItemTypes.CAMERA,
    item: { type: DragItemTypes.CAMERA, camera },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <ToggleButton
      id={`CameraRow-${camera.id}`}
      ref={drag}
      type="checkbox"
      value={camera.id}
      variant={selected || isDragging ? "primary" : colorMode}
      className={`d-flex align-items-center ${camera.enabled || "abled"}`}
      // disabled={!camera.enabled}
      onChange={() => onChange(camera.id)}
    >
      <CameraVideoFill className="me-2" />
      <span className="flex-grow-1 text-start text-truncate">
        {camera.name}
      </span>
      <CircleFill
        className={
          camera.enabled
            ? camera.lastPing
              ? "text-success"
              : "text-danger"
            : "text-secondary"
        }
        width="0.5em"
      />
    </ToggleButton>
  );
};

export default CameraRow;
