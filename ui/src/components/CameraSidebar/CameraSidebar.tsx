import { isEqual } from "lodash";
import React, { useContext, useEffect, useState } from "react";
import { ButtonGroup, Spinner, ToggleButton } from "react-bootstrap";
import { ExclamationTriangleFill, TrashFill } from "react-bootstrap-icons";
import { useDrop } from "react-dnd";

import { Context } from "components/Store";
import {
  SET_CAMERAS,
  START_STREAM,
  STOP_STREAM,
} from "components/Store/constants";
import type { Camera, Stream } from "components/Store/types";
import { useInterval } from "hooks";
import { DragItemTypes } from "utils";

import CameraRow from "./CameraRow";

import { STREAM_MAX_DVR_SECS } from "../../shared/constants";
import "./CameraSidebar.css";

type CameraSidebarProps = {
  showTrash: boolean;
};

export const CameraSidebar = ({ showTrash }: CameraSidebarProps) => {
  const [{ cameras, colorMode, streamIds }, dispatch] = useContext(Context);

  const [isLoading, setLoading] = useState(false);
  const [isError, setError] = useState(false);

  const [{ isOver }, drop] = useDrop({
    accept: [DragItemTypes.STREAM],
    drop: (item) => {
      const stream: Stream = (item as any).stream;
      dispatch?.({
        type: STOP_STREAM,
        payload: stream.id,
      });
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const now = new Date();

  const loadCameras = () => {
    if (isLoading || !dispatch) return;
    setLoading(true);
    fetch("/api/cameras/")
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error();
      })
      .then((response) => {
        const newCameras: Camera[] = response.map((camera: any) => {
          const streamStart =
            camera.stream_start && new Date(camera.stream_start);
          return {
            id: camera.id,
            enabled: camera.enabled,
            name: camera.name,
            online: camera.online,
            videoEnd: new Date(camera.video_end),
            streamStart:
              camera.online &&
              streamStart &&
              new Date(
                Math.max(+streamStart, +now - STREAM_MAX_DVR_SECS * 1000),
              ),
          };
        });
        if (!isEqual(newCameras, cameras)) {
          dispatch({ type: SET_CAMERAS, payload: newCameras });
        }
        setError(false);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(loadCameras, [dispatch]);

  // TODO: Websocket-ify this
  useInterval(loadCameras, 5000);

  return (
    <>
      <div className="pb-2 d-flex justify-content-between">
        <span>Cameras</span>
      </div>
      <ButtonGroup vertical className="w-100">
        <div
          ref={drop}
          className={`
            color-overlay ${isOver ? "bg-danger" : "bg-secondary"} rounded d-flex align-items-center justify-content-center
          `}
          style={{
            pointerEvents: showTrash ? "auto" : "none",
            opacity: showTrash ? (isOver ? 1 : "80%") : 0,
          }}
        >
          <TrashFill color="white" className="trash-icon" />
        </div>
        {isLoading && (isError || cameras.length === 0) && (
          <ToggleButton
            id={"CameraSidebar-loading"}
            value={-1}
            variant={colorMode}
            className="d-flex align-items-center"
            disabled
          >
            <Spinner animation="border" size="sm" className="me-2" />
            <span>Loading...</span>
          </ToggleButton>
        )}
        {isError && !isLoading && (
          <ToggleButton
            id={"CameraSidebar-error"}
            value={-1}
            variant="danger"
            className="d-flex align-items-center"
          >
            <ExclamationTriangleFill className="me-2" />
            <span>An error occurred.</span>
          </ToggleButton>
        )}
        {cameras.map((camera) => (
          <CameraRow
            key={camera.id}
            camera={camera}
            selected={streamIds.includes(camera.id)}
            onClick={(id) => {
              if (streamIds.includes(id)) {
                dispatch?.({
                  type: STOP_STREAM,
                  payload: id,
                });
              } else {
                dispatch?.({
                  type: START_STREAM,
                  payload: {
                    idx: -1,
                    stream: {
                      id,
                    },
                  },
                });
              }
            }}
          />
        ))}
      </ButtonGroup>
    </>
  );
};
