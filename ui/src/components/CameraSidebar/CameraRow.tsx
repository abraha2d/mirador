import React, { useContext } from "react";
import { Button } from "react-bootstrap";
import { CameraVideoFill, CircleFill } from "react-bootstrap-icons";
import { useDrag } from "react-dnd";

import { Camera } from "components/Store/types";
import { DragItemTypes } from "utils";
import { Context } from "../Store";

type CameraRowProps = {
  camera: Camera;
  selected: boolean;
  onClick: (idx: number) => void;
};

export const CameraRow = ({ camera, selected, onClick }: CameraRowProps) => {
  const [{ colorMode }] = useContext(Context);

  const [{ isDragging }, drag] = useDrag({
    type: DragItemTypes.CAMERA,
    item: { type: DragItemTypes.CAMERA, camera },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <Button
      id={`CameraRow-${camera.id}`}
      ref={drag}
      value={camera.id}
      variant={selected || isDragging ? "primary" : colorMode}
      className={`d-flex align-items-center ${camera.enabled || "abled"}`}
      onClick={() => onClick(camera.id)}
    >
      <CameraVideoFill className="me-2" />
      <span className="flex-grow-1 text-start text-truncate">
        {camera.name}
      </span>
      <CircleFill
        className={
          camera.enabled
            ? camera.online
              ? "text-success"
              : "text-danger"
            : "text-secondary"
        }
        width="0.5em"
      />
    </Button>
  );
};

export default CameraRow;
