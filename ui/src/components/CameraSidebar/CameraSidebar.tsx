import { useState } from "react";
import { ToggleButton, ToggleButtonGroup } from "react-bootstrap";
import { CameraVideoFill } from "react-bootstrap-icons";

type CameraRowProps = {
  idx: number;
  camName: string;
  selected: boolean;
  onChange: (idx: number) => void;
};

const CameraRow = ({ idx, camName, selected, onChange }: CameraRowProps) => (
  <ToggleButton
    type={"checkbox"}
    value={idx}
    onChange={() => onChange(idx)}
    variant={selected ? "primary" : "outline-secondary"}
    className={"d-flex align-items-center"}
  >
    <CameraVideoFill className={"mr-2"} />
    <span>{camName}</span>
  </ToggleButton>
);

export const CameraSidebar = () => {
  const [value, setValue] = useState([] as number[]);
  const handleChange = (idx: number) => {
    if (value.includes(idx)) {
      setValue(value.filter((v) => v !== idx));
    } else {
      setValue(value.concat([idx]));
    }
  };
  return (
    <ToggleButtonGroup
      type={"checkbox"}
      value={value}
      vertical
      className={"w-100"}
    >
      <CameraRow
        idx={1}
        camName={"1: South"}
        selected={value.includes(1)}
        onChange={handleChange}
      />
      <CameraRow
        idx={2}
        camName={"2: Porch"}
        selected={value.includes(2)}
        onChange={handleChange}
      />
      <CameraRow
        idx={3}
        camName={"3: Driveway"}
        selected={value.includes(3)}
        onChange={handleChange}
      />
      <CameraRow
        idx={4}
        camName={"4: Garage"}
        selected={value.includes(4)}
        onChange={handleChange}
      />
    </ToggleButtonGroup>
  );
};
