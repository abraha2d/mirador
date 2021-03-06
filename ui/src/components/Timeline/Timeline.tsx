import { useContext, useRef, useState } from "react";
import { Button, ButtonGroup, OverlayTrigger, Popover } from "react-bootstrap";
import { Calendar3, CaretUpFill, SkipEndFill } from "react-bootstrap-icons";
import Draggable from "react-draggable";

import { Calendar } from "components/Calendar";
import { Context } from "components/Store";

export const Timeline = () => {
  const [{ streams }] = useContext(Context);
  const [position, setPosition] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [showCal, setShowCal] = useState(false);
  const nodeRef = useRef(null);
  return (
    <div
      className="bg-secondary flex-grow-1 rounded d-flex"
      style={{ margin: "0 1px" }}
    >
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
            className="d-flex align-items-center"
            {...triggerHandler}
            style={{ marginRight: "-0.25rem", zIndex: 1 }}
          >
            <Calendar3 />
          </Button>
        )}
      </OverlayTrigger>
      <div className="flex-grow-1 overflow-hidden position-relative">
        <div className="position-absolute w-50 h-100">
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
                right: 0,
                ...(position === 0 ||
                position === (nodeRef.current as any).clientWidth
                  ? { transition: "transform 250ms" }
                  : {}),
              }}
            >
              {Array.from(streams.values()).map((stream) => (
                <div key={stream.id} className="flex-grow-1 bg-primary" />
              ))}
            </div>
          </Draggable>
        </div>
        <CaretUpFill
          className="text-danger position-absolute m-auto"
          style={{ bottom: "-0.3em", left: "0", right: "0" }}
        />
      </div>
      <ButtonGroup vertical style={{ marginLeft: "-0.25rem", zIndex: 1 }}>
        <Button
          variant="light"
          size="sm"
          className="py-0"
          disabled={zoom >= 32}
          onClick={() => setZoom(zoom * 2)}
          style={{ borderTopRightRadius: 0 }}
        >
          +
        </Button>
        <Button
          variant="light"
          size="sm"
          className="py-0"
          disabled={zoom <= 0.25}
          onClick={() => setZoom(zoom * 0.5)}
          style={{ borderBottomRightRadius: 0 }}
        >
          -
        </Button>
      </ButtonGroup>
      <Button
        variant="light"
        className="d-flex align-items-center"
        disabled={position === 0}
        onClick={() => setPosition(0)}
        title="Go live"
        style={{ borderBottomLeftRadius: 0, borderTopLeftRadius: 0 }}
      >
        <SkipEndFill />
      </Button>
    </div>
  );
};
