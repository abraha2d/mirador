import React from "react";
import { ToggleButton } from "react-bootstrap";
import { CameraVideoFill, CircleFill } from "react-bootstrap-icons";
import { useDrag } from "react-dnd";

import { Camera } from "components/Store/types";
import { DragItemTypes } from "utils";

type CameraRowProps = {
  camera: Camera;
  selected: boolean;
  onChange: (idx: number) => void;
};

export const CameraRow = ({ camera, selected, onChange }: CameraRowProps) => {
  const [{ isDragging }, drag] = useDrag({
    canDrag: camera.enabled,
    type: DragItemTypes.CAMERA,
    item: { camera },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <ToggleButton
      ref={drag}
      type="checkbox"
      value={camera.id}
      variant={selected || isDragging ? "primary" : "light"}
      className={`d-flex align-items-center ${camera.enabled || "abled"}`}
      // disabled={!camera.enabled}
      onChange={() => onChange(camera.id)}
    >
      <CameraVideoFill className="mr-2" />
      <span className="flex-grow-1 text-left text-truncate">{camera.name}</span>
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
