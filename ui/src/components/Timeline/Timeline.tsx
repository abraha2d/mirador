import { useContext, useRef, useState } from "react";
import { Button, ButtonGroup, OverlayTrigger, Popover } from "react-bootstrap";
import { Calendar3, CaretUpFill, SkipEndFill } from "react-bootstrap-icons";
import { DraggableCore } from "react-draggable";

import { Calendar } from "components/Calendar";
import { Context } from "components/Store";
import { useInterval } from "hooks";

const withoutTime = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const getPercentFromDate = (date: Date) => {
  const msOnly = date.getTime() - withoutTime(date).getTime();
  return msOnly / 8.64e7;
};

const getPositionFromDate = (date: Date, maxPosition: number) => {
  return getPercentFromDate(date) * maxPosition;
};

const getDateFromPosition = (
  position: number,
  maxPosition: number,
  date: Date
) => {
  const msOnly = (position / maxPosition) * 8.64e7;
  return new Date(withoutTime(date).getTime() + msOnly);
};

const getTextForZoomLevel = (zoom: number) => {
  if (zoom < 0.75) {
    return "6 hrs";
  } else if (zoom < 3) {
    return "1 hour";
  } else if (zoom < 6) {
    return "30 mins";
  } else {
    return "5 mins";
  }
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
              style={{ width: `${getPercentFromDate(now) * 100}%` }}
            />
          ))}
        </>
      );
    } else {
      return <></>;
    }
  };

  const dateArray = [
    new Date(date.getTime() - 8.64e7 * 2),
    new Date(date.getTime() - 8.64e7),
    date,
    new Date(date.getTime() + 8.64e7),
    new Date(date.getTime() + 8.64e7 * 2),
  ];

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
              left: `${50 - getPercentFromDate(date) * 100 * zoom}%`,
              ...(now.getTime() - date.getTime() < 1000
                ? { transition: "left 500ms" }
                : {}),
            }}
          >
            {dateArray.map((date, i) => (
              <div
                key={date.toLocaleDateString()}
                className="w-100 h-100 position-absolute d-flex flex-column"
                style={{
                  left: `${(i - 2) * 100}%`,
                }}
              >
                {getStreamDivsForDate(date)}
              </div>
            ))}
            <div
              className="h-100 position-absolute"
              style={{
                width: `${dateArray.length * 100}%`,
                left: `${-Math.floor(dateArray.length / 2) * 100}%`,
              }}
            >
              {[...Array(6).keys()].map((i) => (
                <div
                  key={`day-${i}`}
                  className="bg-light position-absolute"
                  style={{
                    width: "1px",
                    height: "1em",
                    bottom: 0,
                    left: `${20 * i}%`,
                  }}
                />
              ))}
              {[...Array(21).keys()].map((i) => (
                <div
                  key={`6hour-${i}`}
                  className="bg-light position-absolute"
                  style={{
                    width: "1px",
                    height: "0.75em",
                    bottom: 0,
                    left: `${5 * i}%`,
                  }}
                />
              ))}
              {zoom >= 1 &&
                [...Array(121).keys()].map((i) => (
                  <div
                    key={`hour-${i}`}
                    className="bg-light position-absolute"
                    style={{
                      width: "1px",
                      height: "0.75em",
                      bottom: 0,
                      left: `${(5 / 6) * i}%`,
                    }}
                  />
                ))}
              {zoom >= 4 &&
                [...Array(241).keys()].map((i) => (
                  <div
                    key={`30min-${i}`}
                    className="bg-light position-absolute"
                    style={{
                      width: "1px",
                      height: "0.5em",
                      bottom: 0,
                      left: `${(5 / 12) * i}%`,
                    }}
                  />
                ))}
              {zoom >= 8 &&
                [...Array(1441).keys()].map((i) => (
                  <div
                    key={`5min-${i}`}
                    className="bg-light position-absolute"
                    style={{
                      width: "1px",
                      height: "0.5em",
                      bottom: 0,
                      left: `${(5 / 72) * i}%`,
                    }}
                  />
                ))}
            </div>
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
          className="text-light position-absolute ml-3 small"
          style={{ top: 0, left: "0", pointerEvents: "none" }}
        >
          {date.toLocaleDateString()}
        </span>
        <span
          className="text-light position-absolute text-center small"
          style={{ top: 0, left: "0", right: "0", pointerEvents: "none" }}
        >
          {date.toLocaleTimeString()}
        </span>
        <div className="d-flex position-absolute mr-2" style={{ right: 0 }}>
          <Button
            variant="outline-light"
            size="sm"
            className="py-0 px-1 mr-1 text-monospace border-0"
            disabled={zoom <= 0.25}
            onClick={() => {
              setZoom(zoom * 0.5);
            }}
          >
            <span>-</span>
          </Button>
          <span
            className="small text-light text-center"
            style={{ width: "3.5em" }}
          >
            {getTextForZoomLevel(zoom)}
          </span>
          <Button
            variant="outline-light"
            size="sm"
            className="py-0 px-1 ml-1 text-monospace border-0"
            disabled={zoom >= 32}
            onClick={() => {
              setZoom(zoom * 2);
            }}
          >
            <span>+</span>
          </Button>
        </div>
      </div>
      <Button
        variant="light"
        className="flex-grow-0 d-flex align-items-center"
        disabled={now.getTime() - date.getTime() < 1000}
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
