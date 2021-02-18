import React from "react";
import { useDrop } from "react-dnd";

import { START_STREAM } from "components/Store/constants";
import { Stream } from "components/Store/types";
import { DragItemTypes } from "utils";

import logo from "logo.svg";

type StreamContainerProps = {
  idx: number;
  width: string;
  height: string;
  stream?: Stream;
  dispatch?: React.Dispatch<any>;
};

export const StreamContainer = ({
  idx,
  width,
  height,
  stream,
  dispatch,
}: StreamContainerProps) => {
  const [{ isOver }, drop] = useDrop({
    accept: DragItemTypes.CAMERA,
    drop: (item) => {
      const camera = (item as any).camera;
      dispatch &&
        dispatch({
          type: START_STREAM,
          payload: {
            idx,
            stream: { id: camera.id, url: camera.name },
          },
        });
    },
    collect: (monitor) => ({
      isOver: !monitor.isOver(),
    }),
  });

  return (
    <div
      className={`d-flex flex-column align-items-center justify-content-center border-top border-left${
        isOver ? "" : " bg-primary"
      }`}
      style={{ width, height }}
      ref={drop}
    >
      {stream && (
        <>
          <span className="text-light">ID: {stream.id}</span>
          <span className="text-light">URL: {stream.url}</span>
          <img src={logo} className="live w-50 h-50" alt="" />
        </>
      )}
    </div>
  );
};
