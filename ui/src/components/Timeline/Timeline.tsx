import { useContext, useRef, useState } from "react";
import { Button, ButtonGroup, OverlayTrigger, Popover } from "react-bootstrap";
import { Calendar3, CaretUpFill, SkipEndFill } from "react-bootstrap-icons";
import Draggable from "react-draggable";

import { Calendar } from "components/Calendar";
import { Context } from "components/Store";

export const Timeline = () => {
  const [{ streams }] = useContext(Context);
  const [date, setDate] = useState(new Date());
  const [position, setPosition] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [showCal, setShowCal] = useState(false);
  const nodeRef = useRef(null);
  return (
    <ButtonGroup className="bg-secondary flex-grow-1 rounded d-flex">
      <OverlayTrigger
        placement="top"
        trigger="click"
        show={showCal}
        onToggle={setShowCal}
        rootClose
        overlay={
          <Popover id="calendar">
            <Calendar
              date={date}
              onClickDate={(date) => {
                setDate(date);
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
            className="flex-grow-0 d-flex align-items-center"
            {...triggerHandler}
            style={{ marginRight: "-0.25rem", zIndex: 1 }}
          >
            <Calendar3 />
          </Button>
        )}
      </OverlayTrigger>
      <div className="flex-grow-1 overflow-hidden position-relative">
        <Draggable
          axis="x"
          nodeRef={nodeRef}
          onDrag={(event) => {
            setPosition(position + (event as any).movementX);
          }}
          onStop={() =>
            setPosition(
              Math.min(
                Math.max(position, 0),
                (nodeRef.current as any).clientWidth
              )
            )
          }
          position={{ x: position, y: 0 }}
        >
          <div
            ref={nodeRef}
            className="position-absolute h-100 d-flex flex-column"
            style={{
              width: `${200 * zoom}%`,
              right: "50%",
              ...(position === 0 ||
              position === (nodeRef.current as any).clientWidth
                ? { transition: "transform 250ms" }
                : {}),
            }}
          >
            {Array.from(streams.values()).map((stream) => (
              <div key={stream.id} className="flex-grow-1 bg-primary" />
            ))}
            {/*TODO: Add ticks*/}
          </div>
        </Draggable>
        <CaretUpFill
          className="text-light position-absolute m-auto"
          style={{ bottom: "-0.5em", left: "0", right: "0" }}
        />
        <ButtonGroup
          className="position-absolute mr-2 mt-1"
          style={{ right: 0 }}
        >
          <Button
            variant="outline-light"
            size="sm"
            className="py-0 px-1 text-monospace border-0"
            disabled={zoom <= 0.25}
            onClick={() => {
              setZoom(zoom * 0.5);
              setPosition(position * 0.5);
            }}
          >
            <span style={{ lineHeight: 1 }}>-</span>
          </Button>
          <Button
            variant="outline-light"
            size="sm"
            className="py-0 px-1 text-monospace border-0"
            disabled={zoom >= 32}
            onClick={() => {
              setZoom(zoom * 2);
              setPosition(position * 2);
            }}
          >
            <span style={{ lineHeight: 1 }}>+</span>
          </Button>
        </ButtonGroup>
      </div>
      <Button
        variant="light"
        className="flex-grow-0 d-flex align-items-center"
        disabled={position === 0}
        onClick={() => setPosition(0)}
        title="Go live"
        style={{
          marginLeft: "-0.25rem",
          zIndex: 1,
        }}
      >
        <SkipEndFill />
      </Button>
    </ButtonGroup>
  );
};
