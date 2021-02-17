import { Button, ButtonGroup, ButtonToolbar } from "react-bootstrap";

export const ControlBar = () => (
  <div className="mt-3">
    <ButtonToolbar>
      <ButtonGroup>
        <Button>1</Button>
        <Button>4</Button>
        <Button>9</Button>
        <Button active>16</Button>
      </ButtonGroup>
    </ButtonToolbar>
  </div>
);
