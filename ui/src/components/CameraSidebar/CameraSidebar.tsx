import { isEqual } from "lodash";
import React, { useContext, useEffect, useState } from "react";
import { Spinner, ToggleButton, ToggleButtonGroup } from "react-bootstrap";
import { ExclamationTriangleFill, TrashFill } from "react-bootstrap-icons";
import { useDrop } from "react-dnd";

import { Context } from "components/Store";
import {
  SET_CAMERAS,
  START_STREAM,
  STOP_STREAM,
} from "components/Store/constants";
import { Camera, Stream } from "components/Store/types";
import { useInterval } from "hooks";
import { DragItemTypes } from "utils";

import CameraRow from "./CameraRow";

import "./CameraSidebar.css";

type CameraSidebarProps = {
  showTrash: boolean;
};

export const CameraSidebar = ({ showTrash }: CameraSidebarProps) => {
  const [{ cameras, streamIds }, dispatch] = useContext(Context);

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
        } else {
          throw new Error();
        }
      })
      .then((response) => {
        const newCameras: Camera[] = response.map((camera: any) => {
          const lastPing = camera.last_ping && new Date(camera.last_ping);
          return {
            id: camera.id,
            enabled: camera.enabled,
            lastPing: lastPing && +now - +lastPing < 960000 ? lastPing : null,
            name: camera.name,
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
  useInterval(loadCameras, 1000);

  return (
    <>
      <div className="pb-2 d-flex justify-content-between">
        <span>Cameras</span>
      </div>
      <ToggleButtonGroup
        type="checkbox"
        value={streamIds}
        vertical
        className="w-100"
      >
        <div
          ref={drop}
          className={`
            color-overlay ${
              isOver ? "bg-danger" : "bg-secondary"
            } rounded d-flex align-items-center justify-content-center
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
            value={-1}
            variant="light"
            className="d-flex align-items-center"
            disabled
          >
            <Spinner animation="border" size="sm" className="mr-2" />
            <span>Loading...</span>
          </ToggleButton>
        )}
        {isError && !isLoading && (
          <ToggleButton
            value={-1}
            variant="danger"
            className="d-flex align-items-center"
          >
            <ExclamationTriangleFill className="mr-2" />
            <span>An error occurred.</span>
          </ToggleButton>
        )}
        {cameras.map((camera) => (
          <CameraRow
            key={camera.id}
            camera={camera}
            selected={streamIds.includes(camera.id)}
            onChange={(id) => {
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
      </ToggleButtonGroup>
    </>
  );
};
