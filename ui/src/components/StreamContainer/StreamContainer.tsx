import React, { useContext } from "react";
import { Button, Spinner } from "react-bootstrap";
import { Download, ExclamationCircle } from "react-bootstrap-icons";
import { useDrag, useDrop } from "react-dnd";
import {
  FullScreen,
  FullScreenHandle,
  useFullScreenHandle,
} from "react-full-screen";

import { Context } from "components/Store";
import { START_STREAM } from "components/Store/constants";
import { Stream } from "components/Store/types";
import { DragItemTypes, DragObjectWithPayload } from "utils";

import useCurrentVideos from "./useCurrentVideos";
import { isVideo } from "./utils";
import "./StreamContainer.css";

type StreamContainerProps = {
  gridSide: number;
  x: number;
  y: number;
  stream?: Stream;
  onDrag: (dragStart: boolean) => void;
  fullscreenHandle: FullScreenHandle;
};

export const StreamContainer = ({
  gridSide,
  x,
  y,
  stream,
  onDrag,
  fullscreenHandle,
}: StreamContainerProps) => {
  const [{ cameras }, dispatch] = useContext(Context);
  const camera = cameras.find((camera) => camera.id === stream?.id);

  const handle = useFullScreenHandle();

  const [{ isOver, itemType }, drop] = useDrop({
    accept: [DragItemTypes.CAMERA, DragItemTypes.STREAM],
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      itemType: monitor.getItemType(),
    }),
    drop: (item: DragObjectWithPayload) => {
      if (!dispatch) return;

      let stream: Stream;
      let replace = false;

      switch (item.type) {
        case DragItemTypes.CAMERA:
          stream = {
            id: item.camera.id,
          };
          replace = true;
          break;
        case DragItemTypes.STREAM:
          stream = item.stream;
          break;
      }

      dispatch({
        type: START_STREAM,
        payload: {
          idx: y * gridSide + x,
          stream,
          replace,
        },
      });
    },
  });

  const [{ isDragging }, drag] = useDrag({
    canDrag: !!stream,
    type: DragItemTypes.STREAM,
    item: () => {
      onDrag(true);
      return { type: DragItemTypes.STREAM, stream };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: () => onDrag(false),
  });

  const { isError, isLoading, source, videoList } = useCurrentVideos(stream);

  const cameraName = camera && (
    <span
      className="position-absolute w-100 p-1 bg-dark opacity-75 text-center text-truncate text-light"
      style={{ bottom: 0 }}
    >
      {camera.name}
    </span>
  );

  return (
    <div
      ref={drop}
      className={`stream-container ${
        fullscreenHandle.active ? "" : "border-end border-bottom"
      }`}
      style={{
        left: `${x * (100 / gridSide)}%`,
        top: `${y * (100 / gridSide)}%`,
        width: `${100 / gridSide}%`,
        height: `${100 / gridSide}%`,
      }}
      onDoubleClick={
        source ? (handle.active ? handle.exit : handle.enter) : () => {}
      }
    >
      <div
        className={`color-overlay ${
          isDragging
            ? "bg-secondary"
            : isOver
            ? stream
              ? itemType === DragItemTypes.CAMERA
                ? "bg-danger"
                : "bg-info"
              : "bg-primary"
            : ""
        }`}
        style={{
          opacity: isDragging || isOver ? "80%" : 0,
          pointerEvents: isOver ? "auto" : "none",
        }}
      />
      {source ? (
        <FullScreen handle={handle} className="h-100">
          <div
            ref={drag}
            className="w-100 h-100 d-flex flex-column align-items-center justify-content-center"
          >
            {videoList}
            {(isLoading || isError) && (
              <>
                <div
                  className={`position-absolute p-3 ${
                    isError ? "bg-danger" : "bg-dark"
                  } opacity-75 rounded-circle`}
                  style={{ width: "4.5em", height: "4.5em" }}
                >
                  {isLoading ? (
                    <Spinner
                      animation="border"
                      variant="light"
                      className="p-3"
                    />
                  ) : (
                    isError && <ExclamationCircle color="white" size="2.5em" />
                  )}
                </div>
                {cameraName}
              </>
            )}
          </div>
        </FullScreen>
      ) : (
        <div ref={drag} className="h-100">
          {cameraName}
        </div>
      )}
    </div>
  );
};
