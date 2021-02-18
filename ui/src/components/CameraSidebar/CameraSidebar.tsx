import { useContext, useEffect, useState } from "react";
import { Spinner, ToggleButton, ToggleButtonGroup } from "react-bootstrap";
import {
  ArrowClockwise,
  CameraVideoFill,
  ExclamationTriangleFill,
} from "react-bootstrap-icons";

import { Context } from "components/Store";
import { START_STREAM, STOP_STREAM } from "components/Store/constants";

type CameraRowProps = {
  idx: number;
  camName: string;
  disabled: boolean;
  selected: boolean;
  onChange: (idx: number) => void;
};

const CameraRow = ({
  idx,
  camName,
  disabled,
  selected,
  onChange,
}: CameraRowProps) => (
  <ToggleButton
    type="checkbox"
    value={idx}
    variant={selected ? "primary" : "light"}
    disabled={disabled}
    onChange={() => onChange(idx)}
    className="d-flex align-items-center"
  >
    <CameraVideoFill className="mr-2" />
    <span className="text-truncate">{camName}</span>
  </ToggleButton>
);

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
            value={0}
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
            value={0}
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
            idx={camera.id}
            camName={camera.name}
            disabled={!camera.enabled}
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
                    payload: { id, url: camera.name },
                  });
              }
            }}
          />
        ))}
      </ToggleButtonGroup>
    </>
  );
};
