import { useContext, useRef, useState } from "react";
import { Button, OverlayTrigger, Popover } from "react-bootstrap";
import { Calendar3, SkipEndFill } from "react-bootstrap-icons";
import Draggable from "react-draggable";

import { Calendar } from "components/Calendar";
import { Context } from "components/Store";

export const Timeline = () => {
  const [{ streams }] = useContext(Context);
  const [position, setPosition] = useState(0);
  const [showCal, setShowCal] = useState(false);
  const nodeRef = useRef(null);
  return (
    <div className="flex-grow-1 rounded d-flex" style={{ margin: "0 1px" }}>
      <OverlayTrigger
        placement="top"
        trigger="click"
        show={showCal}
        onToggle={setShowCal}
        rootClose
        overlay={
          <Popover id="calendar">
            <Calendar
              date={new Date()}
              onClickDate={(date) => {
                console.log(date);
                setShowCal(false);
              }}
            />
          </Popover>
        }
      >
        {({ ref, ...triggerHandler }) => (
          <Button
            ref={ref}
            variant="light"
            className="d-flex align-items-center mr-2"
            {...triggerHandler}
          >
            <Calendar3 />
          </Button>
        )}
      </OverlayTrigger>
      <div className="flex-grow-1 rounded overflow-hidden position-relative">
        <Draggable
          axis="x"
          nodeRef={nodeRef}
          onDrag={(event) => setPosition(position + (event as any).movementX)}
          position={{ x: position, y: 0 }}
        >
          <div
            ref={nodeRef}
            className="position-absolute d-flex flex-column"
            style={{ width: "100px", top: 0, bottom: 0 }}
          >
            {Array.from(streams.values()).map((stream) => (
              <div key={stream.id} className="flex-grow-1 bg-secondary" />
            ))}
          </div>
        </Draggable>
      </div>
      <Button variant="light" className="d-flex align-items-center ml-2">
        <SkipEndFill />
      </Button>
    </div>
  );
};
