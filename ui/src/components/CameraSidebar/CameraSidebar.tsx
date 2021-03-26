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
import { useInterval } from "hooks";
import { DragItemTypes } from "utils";

import CameraRow from "./CameraRow";

import "./CameraSidebar.css";

type CameraSidebarProps = {
  showTrash: boolean;
};

export const CameraSidebar = ({ showTrash }: CameraSidebarProps) => {
  const [{ cameras, streams }, dispatch] = useContext(Context);

  const [isLoading, setLoading] = useState(false);
  const [isError, setError] = useState(false);

  const [{ isOver }, drop] = useDrop({
    accept: [DragItemTypes.STREAM],
    drop: (item) => {
      const stream = (item as any).stream;
      dispatch &&
        dispatch({
          type: STOP_STREAM,
          payload: stream.id,
        });
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

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
        if (!isEqual(response, cameras)) {
          dispatch({ type: SET_CAMERAS, payload: response });
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
      <ToggleButtonGroup
        type="checkbox"
        value={Array.from(streams.keys())}
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
            disabled
          >
            <ExclamationTriangleFill className="mr-2" />
            <span>An error occurred.</span>
          </ToggleButton>
        )}
        {cameras.map((camera: any) => (
          <CameraRow
            key={camera.id}
            camera={camera}
            selected={Array.from(streams)
              .map(([, s]) => s && s.id)
              .includes(camera.id)}
            onChange={(id) => {
              if (
                Array.from(streams)
                  .map(([, s]) => s && s.id)
                  .includes(id)
              ) {
                dispatch &&
                  dispatch({
                    type: STOP_STREAM,
                    payload: id,
                  });
              } else {
                dispatch &&
                  dispatch({
                    type: START_STREAM,
                    payload: {
                      stream: {
                        id,
                        url: `/static/stream/${id}/out.m3u8`,
                        name: camera.name,
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
