import { useEffect, useState } from "react";
import { Spinner, ToggleButton, ToggleButtonGroup } from "react-bootstrap";
import { CameraVideoFill } from "react-bootstrap-icons";

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
  const [isLoading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  useEffect(() => {
    fetch("/api/cameras/")
      .then((response) => response.json())
      .then((response) => setData(response))
      .then(() => setTimeout(() => setLoading(false), 1000));
  }, []);

  const [value, setValue] = useState([] as number[]);
  const handleChange = (idx: number) => {
    if (value.includes(idx)) {
      setValue(value.filter((v) => v !== idx));
    } else {
      setValue(value.concat([idx]));
    }
  };

  return (
    <>
      <div className="pb-2">Cameras:</div>
      {isLoading ? (
        <ToggleButtonGroup
          type="checkbox"
          value={value}
          vertical
          className="w-100"
        >
          <ToggleButton
            value={0}
            variant="light"
            className="d-flex align-items-center"
            disabled
          >
            <Spinner animation="border" size="sm" className="mr-2" />
            <span>Loading...</span>
          </ToggleButton>
        </ToggleButtonGroup>
      ) : (
        <ToggleButtonGroup
          type="checkbox"
          value={value}
          vertical
          className="w-100"
        >
          {data.map((camera: any) => (
            <CameraRow
              key={camera.id}
              idx={camera.id}
              camName={camera.name}
              disabled={!camera.enabled}
              selected={value.includes(camera.id)}
              onChange={handleChange}
            />
          ))}
        </ToggleButtonGroup>
      )}
    </>
  );
};
