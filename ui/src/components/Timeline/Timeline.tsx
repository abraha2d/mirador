import { useContext, useRef, useState } from "react";
import {
  Button,
  ButtonGroup,
  Overlay,
  OverlayTrigger,
  Popover,
  Tooltip,
} from "react-bootstrap";
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
  if (zoom < 1) {
    return `${1 / zoom} days`;
  } else if (zoom < 16) {
    return `${24 / zoom} hrs`;
  } else {
    return `${1440 / zoom} mins`;
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
  const [hoverLocation, setHoverLocation] = useState(-1);
  const [hoverDate, setHoverDate] = useState(now);

  const draggerWidth = (draggerRef.current as any)?.clientWidth;

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
    ...(zoom <= 0.5 ? [new Date(date.getTime() - 8.64e7 * 2)] : []),
    new Date(date.getTime() - 8.64e7),
    date,
    new Date(date.getTime() + 8.64e7),
    ...(zoom <= 0.5 ? [new Date(date.getTime() + 8.64e7 * 2)] : []),
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
          onStop={(e) =>
            isDragging
              ? setDragging(false)
              : e instanceof MouseEvent &&
                setDate(
                  new Date(
                    Math.min(
                      getDateFromPosition(
                        e.offsetX,
                        draggerWidth,
                        new Date(
                          (e.target as HTMLElement).getAttribute("data-date")!
                        )
                      ).getTime(),
                      now.getTime()
                    )
                  )
                )
          }
          onDrag={(e) => {
            e instanceof MouseEvent &&
              setDate(
                new Date(
                  Math.min(
                    getDateFromPosition(
                      getPositionFromDate(date, draggerWidth) - e.movementX,
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
            onMouseMove={(e) => {
              setHoverLocation(
                ((e.nativeEvent.target as HTMLElement)
                  .offsetParent as HTMLElement).offsetLeft +
                  (e.nativeEvent.target as HTMLElement).offsetLeft +
                  e.nativeEvent.offsetX
              );
              setHoverDate(
                getDateFromPosition(
                  e.nativeEvent.offsetX,
                  draggerWidth,
                  new Date(
                    (e.nativeEvent.target as HTMLElement).getAttribute(
                      "data-date"
                    )!
                  )
                )
              );
            }}
            onMouseOut={() => setHoverLocation(-1)}
          >
            {dateArray.map((date, i) => (
              <div
                key={date.toLocaleDateString()}
                data-date={date.toLocaleDateString()}
                className="w-100 h-100 position-absolute d-flex flex-column"
                style={{
                  left: `${(i - Math.floor(dateArray.length / 2)) * 100}%`,
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
              {[...Array(dateArray.length + 1).keys()].map((i) => (
                <div
                  key={`day-${i}`}
                  className="bg-light position-absolute"
                  style={{
                    width: "1px",
                    height: "1em",
                    bottom: 0,
                    left: `${(100 / dateArray.length) * i}%`,
                  }}
                />
              ))}
              {[...Array(dateArray.length * 4 + 1).keys()].map((i) => (
                <div
                  key={`6hour-${i}`}
                  className="bg-light position-absolute"
                  style={{
                    width: "1px",
                    height: "0.75em",
                    bottom: 0,
                    left: `${(100 / (dateArray.length * 4)) * i}%`,
                  }}
                />
              ))}
              {zoom >= 1 &&
                [...Array(dateArray.length * 24 + 1).keys()].map((i) => (
                  <div
                    key={`hour-${i}`}
                    className="bg-light position-absolute"
                    style={{
                      width: "1px",
                      height: "0.75em",
                      bottom: 0,
                      left: `${(100 / (dateArray.length * 24)) * i}%`,
                    }}
                  />
                ))}
              {zoom >= 4 &&
                [...Array(dateArray.length * 24 * 2 + 1).keys()].map((i) => (
                  <div
                    key={`30min-${i}`}
                    className="bg-light position-absolute"
                    style={{
                      width: "1px",
                      height: "0.5em",
                      bottom: 0,
                      left: `${(100 / (dateArray.length * 24 * 2)) * i}%`,
                    }}
                  />
                ))}
              {zoom >= 8 &&
                [...Array(dateArray.length * 24 * 6 + 1).keys()].map((i) => (
                  <div
                    key={`10min-${i}`}
                    className="bg-light position-absolute"
                    style={{
                      width: "1px",
                      height: "0.5em",
                      bottom: 0,
                      left: `${(100 / (dateArray.length * 24 * 6)) * i}%`,
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
          className="text-light position-absolute text-center small"
          style={{ top: 0, left: "0", right: "0", pointerEvents: "none" }}
        >
          {date.toLocaleString()}
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
      <Tooltip
        id="date-hover-bad"
        placement="top"
        className={hoverLocation !== -1 ? "show" : ""}
        style={{
          bottom: "75%",
          left: `${hoverLocation}px`,
        }}
        arrowProps={{ ref: () => {}, style: { left: "35px" } }}
      >
        {hoverDate.toLocaleString()}
      </Tooltip>
      <Button
        variant="light"
        className="flex-grow-0 d-flex align-items-center"
        disabled={now.getTime() - date.getTime() < 2000}
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
