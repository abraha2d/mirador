import { useContext, useEffect, useState } from "react";
import { Spinner, ToggleButton, ToggleButtonGroup } from "react-bootstrap";
import {
  ArrowClockwise,
  CameraVideoFill,
  ExclamationTriangleFill,
} from "react-bootstrap-icons";

import { useDrag } from "react-dnd";

import { Context } from "components/Store";
import { START_STREAM, STOP_STREAM } from "components/Store/constants";

import { DragItemTypes } from "utils";

type CameraRowProps = {
  camera: any;
  selected: boolean;
  onChange: (idx: number) => void;
};

const CameraRow = ({ camera, selected, onChange }: CameraRowProps) => {
  const [{ isDragging }, drag] = useDrag({
    item: { type: DragItemTypes.CAMERA, camera },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <ToggleButton
      type="checkbox"
      value={camera.id}
      variant={selected || isDragging ? "primary" : "light"}
      disabled={!camera.enabled}
      onChange={() => onChange(camera.id)}
      className="d-flex align-items-center"
      ref={drag}
    >
      <CameraVideoFill className="mr-2" />
      <span className="text-truncate">{camera.name}</span>
    </ToggleButton>
  );
};

export const CameraSidebar = () => {
  const [isLoading, setLoading] = useState(false);
  const [isError, setError] = useState(false);
  const [data, setData] = useState([]);

  const [state, dispatch] = useContext(Context);

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
            setError(false);
          })
          .catch(() => {
            setError(true);
          })
          .finally(() => setLoading(false)),
      500
    );
  };

  useEffect(loadCameras, []);

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
                    payload: { stream: { id, url: camera.name } },
                  });
              }
            }}
          />
        ))}
      </ToggleButtonGroup>
    </>
  );
};
