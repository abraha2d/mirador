import { useContext, useRef, useState } from "react";
import { Button, ButtonGroup, OverlayTrigger, Popover } from "react-bootstrap";
import { Calendar3, CaretUpFill, SkipEndFill } from "react-bootstrap-icons";
import { DraggableCore } from "react-draggable";

import { Calendar } from "components/Calendar";
import { Context } from "components/Store";
import { useInterval } from "hooks";

const withoutTime = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const getPositionFromDate = (date: Date, maxPosition: number) => {
  const msOnly = date.getTime() - withoutTime(date).getTime();
  return (msOnly / 8.64e7) * maxPosition;
};

const getDateFromPosition = (
  position: number,
  maxPosition: number,
  date: Date
) => {
  const msOnly = (position / maxPosition) * 8.64e7;
  return new Date(withoutTime(date).getTime() + msOnly);
};

export const Timeline = () => {
  const [{ streams }] = useContext(Context);

  const containerRef = useRef(null);
  const draggerRef = useRef(null);

  const now = new Date();
  const today = withoutTime(now);

  const [date, setDate] = useState(now);
  const [zoom, setZoom] = useState(1);
  const [showCal, setShowCal] = useState(false);

  const draggerWidth = (containerRef.current as any)?.clientWidth * zoom;

  useInterval(() => {
    setDate(new Date(date.getTime() + 1000));
  }, 1000);

  const getStreamDivsForDate = (date: Date) => {
    if (withoutTime(date) < today) {
      return (
        <>
          {Array.from(streams.values()).map((stream) => (
            <div
              key={stream.id}
              className="flex-grow-1 bg-primary text-light small"
            />
          ))}
        </>
      );
    } else if (withoutTime(date).getTime() === today.getTime()) {
      return (
        <>
          {Array.from(streams.values()).map((stream) => (
            <div
              key={stream.id}
              className="flex-grow-1 bg-primary text-light small"
              style={{ width: `${getPositionFromDate(now, 1) * 100}%` }}
            />
          ))}
        </>
      );
    } else {
      return <></>;
    }
  };

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
              date={withoutTime(date)}
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
      <div
        ref={containerRef}
        className="flex-grow-1 overflow-hidden position-relative"
      >
        <DraggableCore
          nodeRef={draggerRef}
          onDrag={(event) => {
            setDate(
              new Date(
                Math.min(
                  getDateFromPosition(
                    getPositionFromDate(date, draggerWidth) -
                      (event as any)?.movementX,
                    draggerWidth,
                    date
                  ).getTime(),
                  now.getTime()
                )
              )
            );
          }}
        >
          <div
            ref={draggerRef}
            className="position-absolute h-100"
            style={{
              width: `${100 * zoom}%`,
              left: `calc(50% - ${Math.round(
                getPositionFromDate(date, draggerWidth)
              )}px)`,
            }}
          >
            {[
              new Date(date.getTime() - 8.64e7 * 2),
              new Date(date.getTime() - 8.64e7),
              date,
              new Date(date.getTime() + 8.64e7),
              new Date(date.getTime() + 8.64e7 * 2),
            ].map((date, i) => (
              <div
                key={date.toLocaleDateString()}
                className="w-100 h-100 position-absolute d-flex flex-column"
                style={{
                  left: `${(i - 2) * draggerWidth}px`,
                }}
              >
                {getStreamDivsForDate(date)}
              </div>
            ))}
            {/*TODO: Add ticks*/}
          </div>
        </DraggableCore>
        <CaretUpFill
          className="text-light position-absolute m-auto"
          style={{
            bottom: "-0.5em",
            left: "0",
            right: "0",
            pointerEvents: "none",
          }}
        />
        <span
          className="text-light position-absolute text-center small"
          style={{ top: 0, left: "0", right: "0", pointerEvents: "none" }}
        >
          {date.toLocaleString()}
        </span>
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
            }}
          >
            <span style={{ lineHeight: 1 }}>+</span>
          </Button>
        </ButtonGroup>
      </div>
      <Button
        variant="light"
        className="flex-grow-0 d-flex align-items-center"
        disabled={now.getTime() - date.getTime() < 1}
        onClick={() => setDate(now)}
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
