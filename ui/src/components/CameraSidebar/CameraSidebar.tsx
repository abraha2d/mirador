import React, { useContext, useEffect, useState } from "react";
import { Spinner, ToggleButton, ToggleButtonGroup } from "react-bootstrap";
import {
  ArrowClockwise,
  ExclamationTriangleFill,
  TrashFill,
} from "react-bootstrap-icons";
import { useDrop } from "react-dnd";

import { Context } from "components/Store";
import {
  SET_CAMERAS,
  START_STREAM,
  STOP_STREAM,
} from "components/Store/constants";

import CameraRow from "./CameraRow";
import { DragItemTypes } from "utils";

import "./CameraSidebar.css";

type CameraSidebarProps = {
  showTrash: boolean;
};

export const CameraSidebar = ({ showTrash }: CameraSidebarProps) => {
  const [state, dispatch] = useContext(Context);

  const [isLoading, setLoading] = useState(false);
  const [isError, setError] = useState(false);
  const [data, setData] = useState([]);

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
    setLoading(true);
    setTimeout(
      () =>
        fetch("/api/cameras/")
          .then((response) => {
            if (response.ok) {
              return response.json();
            } else {
              throw new Error();
            }
          })
          .then((response) => {
            setData(response);
            dispatch && dispatch({ type: SET_CAMERAS, payload: response });
            setError(false);
          })
          .catch(() => {
            setError(true);
          })
          .finally(() => setLoading(false)),
      500
    );
  };

  useEffect(loadCameras, [dispatch]);

  return (
    <>
      <div className="pb-2 d-flex justify-content-between">
        <span>Cameras</span>
        {isLoading ? (
          <Spinner animation="border" size="sm" />
        ) : (
          <ArrowClockwise onClick={loadCameras} />
        )}
      </div>
      <ToggleButtonGroup
        type="checkbox"
        value={Array.from(state.streams.keys())}
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
        {isLoading && (isError || data.length === 0) && (
          <ToggleButton
            value={-1}
            variant="light"
            className="d-flex align-items-center"
            disabled
          >
            <Spinner animation="grow" size="sm" className="mr-2" />
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
        {data.map((camera: any) => (
          <CameraRow
            key={camera.id}
            camera={camera}
            selected={Array.from(state.streams)
              .map(([, s]) => s && s.id)
              .includes(camera.id)}
            onChange={(id) => {
              if (
                Array.from(state.streams)
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
