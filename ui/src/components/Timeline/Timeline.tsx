import React, { useContext, useRef, useState } from "react";
import {
  Button,
  ButtonGroup,
  OverlayTrigger,
  Popover,
  Tooltip,
} from "react-bootstrap";
import { Calendar3, CaretUpFill, SkipEndFill } from "react-bootstrap-icons";
import { DraggableCore } from "react-draggable";

import { Calendar } from "components";
import { Context } from "components/Store";
import { SET_VIDEOS } from "components/Store/constants";
import { useInterval } from "hooks";
import { withoutTime } from "utils";

import TimelineTicks from "./TimelineTicks";
import {
  getDateFromPosition,
  getPercentFromDate,
  getPositionFromDate,
  getTextForZoomLevel,
} from "./utils";

import "./Timeline.css";

export const Timeline = () => {
  const [{ streams }, dispatch] = useContext(Context);
  const streamIds = Array.from(streams.values()).map((stream) => stream.id);

  const containerRef = useRef(null);
  const draggerRef = useRef(null);

  const now = new Date();

  const [videos, setVideos] = useState([] as any[]);
  const [date, setDate] = useState(now);
  const [zoom, setZoom] = useState(1);
  const [showCal, setShowCal] = useState(false);

  const [isDragging, setDragging] = useState(false);
  const [hoverLocation, setHoverLocation] = useState(-1);
  const [hoverDate, setHoverDate] = useState(now);

  const draggerWidth = (draggerRef.current as any)?.clientWidth;

  const loadVideos = () => {
    fetch("/api/videos/")
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error();
        }
      })
      .then((response) => {
        const videos = response.map((video: any) => {
          return {
            camera: video.camera,
            startDate: new Date(video.start_date),
            endDate: new Date(video.end_date),
            url: `/static/${video.file}`,
          };
        });
        setVideos(videos);
        dispatch && dispatch({ type: SET_VIDEOS, payload: videos });
      });
  };

  useInterval(() => {
    setDate(new Date(Math.min(date.getTime() + 1000, now.getTime())));
    if (streamIds.length) loadVideos();
  }, 1000);

  const dateArray = [
    ...(zoom <= 0.5 ? [new Date(date.getTime() - 8.64e7 * 2)] : []),
    new Date(date.getTime() - 8.64e7),
    date,
    new Date(date.getTime() + 8.64e7),
    ...(zoom <= 0.5 ? [new Date(date.getTime() + 8.64e7 * 2)] : []),
  ];

  return (
    <ButtonGroup className="flex-grow-1 bg-secondary rounded d-flex">
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
          >
            <Calendar3 />
          </Button>
        )}
      </OverlayTrigger>
      <div
        ref={containerRef}
        className="flex-grow-1 position-relative overflow-hidden pe-none"
      >
        <DraggableCore
          nodeRef={draggerRef}
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
        >
          <div
            ref={draggerRef}
            className="position-absolute h-100 pe-all"
            style={{
              width: `${100 * zoom}%`,
              left: `${50 - getPercentFromDate(date) * 100 * zoom}%`,
              ...(isDragging
                ? {}
                : {
                    transition: "width 250ms, left 250ms",
                  }),
            }}
            onMouseMove={(e) => {
              const nativeE = e.nativeEvent;
              const target = nativeE.target as HTMLElement;
              const parent = target.offsetParent as HTMLElement;
              setHoverLocation(
                parent.offsetLeft + target.offsetLeft + nativeE.offsetX
              );
              setHoverDate(
                getDateFromPosition(
                  nativeE.offsetX,
                  draggerWidth,
                  new Date(target.getAttribute("data-date")!)
                )
              );
            }}
            onMouseOut={() => setHoverLocation(-1)}
          >
            {dateArray.map((date, i) => (
              <div
                key={date.getTime()}
                data-date={date.toLocaleDateString()}
                className="timeline-stream-bar"
                style={{
                  left: `${(i - Math.floor(dateArray.length / 2)) * 100}%`,
                }}
              >
                {videos
                  .filter(
                    (video) =>
                      withoutTime(video.startDate).getTime() ===
                        withoutTime(date).getTime() &&
                      streamIds.includes(video.camera)
                  )
                  .map((video) => {
                    const startPercent =
                      getPercentFromDate(video.startDate) * 100;
                    const endPercent = getPercentFromDate(video.endDate) * 100;
                    return (
                      <div
                        key={`${video.camera}-${video.startDate.getTime()}`}
                        className="timeline-stream bg-primary"
                        style={{
                          left: `${startPercent}%`,
                          width: `${endPercent - startPercent}%`,
                        }}
                      />
                    );
                  })}
              </div>
            ))}
            <TimelineTicks dateArray={dateArray} zoom={zoom} />
          </div>
        </DraggableCore>
        <CaretUpFill className="timeline-indicator text-light" />
        <span className="timeline-date-text text-light">
          {date.toLocaleString()}
        </span>
        <ButtonGroup className="timeline-zoom-button-group">
          <Button
            variant="outline-light"
            size="sm"
            className="px-1 py-0 border-0 text-monospace"
            disabled={zoom <= 0.25}
            onClick={() => setZoom(zoom * 0.5)}
          >
            -
          </Button>
          <Button
            variant="outline-light"
            size="sm"
            className="timeline-zoom-current-level"
            onClick={() => setZoom(1)}
          >
            {getTextForZoomLevel(zoom)}
          </Button>
          <Button
            variant="outline-light"
            size="sm"
            className="px-1 py-0 border-0 text-monospace"
            disabled={zoom >= 32}
            onClick={() => setZoom(zoom * 2)}
          >
            +
          </Button>
        </ButtonGroup>
      </div>
      <Tooltip
        id="date-hover"
        placement="top"
        className={`timeline-date-hover ${hoverLocation !== -1 ? "show" : ""}`}
        style={{
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
      >
        <SkipEndFill />
      </Button>
    </ButtonGroup>
  );
};
