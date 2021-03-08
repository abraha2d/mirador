import React from "react";
import { ToggleButton } from "react-bootstrap";
import { CameraVideoFill } from "react-bootstrap-icons";
import { useDrag } from "react-dnd";

import { DragItemTypes } from "utils";

type CameraRowProps = {
  camera: any;
  selected: boolean;
  onChange: (idx: number) => void;
};

export const CameraRow = ({ camera, selected, onChange }: CameraRowProps) => {
  const [{ isDragging }, drag] = useDrag({
    canDrag: camera.enabled,
    item: { type: DragItemTypes.CAMERA, camera },
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
      className="d-flex align-items-center"
      disabled={!camera.enabled}
      onChange={() => onChange(camera.id)}
    >
      <CameraVideoFill className="mr-2" />
      <span className="text-truncate">{camera.name}</span>
    </ToggleButton>
  );
};

export default CameraRow;
