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
  const [isDragging, setDragging] = useState(false);

  const draggerWidth = (containerRef.current as any)?.clientWidth * zoom;

  useInterval(() => {
    setDate(new Date(Math.min(date.getTime() + 1000, now.getTime())));
  }, 1000);

  const getStreamDivsForDate = (date: Date) => {
    if (withoutTime(date) <= today) {
      return (
        <>
          {Array.from(streams.values()).map((stream) => (
            <div
              key={stream.id}
              className="flex-grow-1 bg-primary text-light small"
              style={{
                pointerEvents: "none",
                ...(withoutTime(date) < today
                  ? {}
                  : { width: `${getPercentFromDate(now) * 100}%` }),
              }}
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
        className="flex-grow-1 overflow-hidden position-relative mx-1"
        style={{ pointerEvents: "none" }}
      >
        <DraggableCore
          nodeRef={draggerRef}
          onStop={(...args) =>
            isDragging
              ? setDragging(false)
              : args[0] instanceof MouseEvent &&
                setDate(
                  new Date(
                    Math.min(
                      getDateFromPosition(
                        args[0].offsetX,
                        draggerWidth,
                        new Date(
                          parseInt(
                            (args[0].target as Element).getAttribute(
                              "data-date"
                            )!
                          )
                        )
                      ).getTime(),
                      now.getTime()
                    )
                  )
                )
          }
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
            isDragging || setDragging(true);
          }}
        >
          <div
            ref={draggerRef}
            className="position-absolute h-100"
            style={{
              width: `${100 * zoom}%`,
              left: `${50 - getPercentFromDate(date) * 100 * zoom}%`,
              pointerEvents: "all",
              ...(isDragging
                ? {}
                : {
                    transition: "width 250ms, left 250ms",
                  }),
            }}
          >
            {dateArray.map((date, i) => (
              <div
                key={date.toLocaleDateString()}
                data-date={date.getTime()}
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
                pointerEvents: "none",
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
        <ButtonGroup
          className="d-flex position-absolute mr-2"
          style={{ right: 0, pointerEvents: "all" }}
        >
          <Button
            variant="outline-light"
            size="sm"
            className="py-0 px-1 text-monospace border-0"
            disabled={zoom <= 0.25}
            onClick={() => setZoom(zoom * 0.5)}
          >
            -
          </Button>
          <Button
            variant="outline-light"
            size="sm"
            className="py-0 px-1 border-0 text-center"
            style={{ width: "4.5em" }}
            onClick={() => setZoom(1)}
          >
            {getTextForZoomLevel(zoom)}
          </Button>
          <Button
            variant="outline-light"
            size="sm"
            className="py-0 px-1 text-monospace border-0"
            disabled={zoom >= 32}
            onClick={() => setZoom(zoom * 2)}
          >
            +
          </Button>
        </ButtonGroup>
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
