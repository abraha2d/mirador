import { isEqual } from "lodash";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  ButtonGroup,
  Dropdown,
  OverlayTrigger,
  Popover,
  Spinner,
  Tooltip,
} from "react-bootstrap";
import {
  Calendar3,
  CaretUpFill,
  ChevronCompactLeft,
  ChevronCompactRight,
  ChevronDoubleLeft,
  ChevronDoubleRight,
  ChevronLeft,
  ChevronRight,
  Circle,
  PauseFill,
  PlayFill,
  SkipEndFill,
} from "react-bootstrap-icons";
import { DraggableCore } from "react-draggable";

import { Calendar } from "components";
import { Context } from "components/Store";
import {
  SET_DATE,
  SET_PLAYBACK_SPEED,
  SET_PLAYING,
  SET_SCRUBBING,
  SET_VIDEOS,
} from "components/Store/constants";
import { Video } from "components/Store/types";
import { useInterval, usePrevious } from "hooks";
import { withoutTime } from "utils";

import TimelineTicks from "./TimelineTicks";
import {
  getDateFromPosition,
  getPercentFromDate,
  getPositionFromDate,
  getTextForZoomLevel,
} from "./utils";

import "./Timeline.css";
import { DEFAULT_ZOOM } from "./constants";
import { LIVE_VIEW_SLOP_SECS, STREAM_MAX_DVR_SECS } from "shared/constants";

let abortController = new AbortController();

export const Timeline = () => {
  const [
    {
      cameras,
      colorMode,
      date,
      isDarkMode,
      isPlaying,
      isScrubbing,
      playbackSpeed,
      streamIds,
      videos,
    },
    dispatch,
  ] = useContext(Context);
  const prevDate: Date | undefined = usePrevious(date);
  const dateWithoutTime = +withoutTime(date);

  const now = new Date();

  const [isLoading, setLoading] = useState(false);
  const [isError, setError] = useState(false);

  const [showCal, setShowCal] = useState(false);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  const [hoverLocation, setHoverLocation] = useState(-1);
  const [hoverDate, setHoverDate] = useState(now);

  const [showTimeEdit, setShowTimeEdit] = useState(false);
  const [timeEdit, setTimeEdit] = useState("");

  const [previousTouch, setPreviousTouch] = useState<Touch | undefined>(
    undefined
  );

  const draggerRef = useRef<HTMLDivElement>(null);

  const latestVideoEnd = Math.max(
    ...cameras
      .filter((camera) => streamIds.includes(camera.id))
      .map((camera) => +(camera.videoEnd || 0))
  );
  const prevVideoEnd = usePrevious(latestVideoEnd);

  const loadVideos = () => {
    const dateStr = date.toLocaleDateString();
    if (
      (dateStr === prevDate?.toLocaleDateString() &&
        latestVideoEnd === prevVideoEnd) ||
      !cameras ||
      !dispatch
    )
      return;

    setLoading(true);
    abortController.abort();
    abortController = new AbortController();

    fetch(`/api/videos/?date=${dateStr}`, {
      signal: abortController.signal,
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error();
        }
      })
      .then((response) => {
        const newVideos: Video[] = response.map((video: any): Video => {
          return {
            camera: video.camera,
            startDate: new Date(video.start_date),
            endDate: new Date(video.end_date),
            file: `/${video.file}`,
          };
        });
        if (!isEqual(newVideos, videos)) {
          dispatch({ type: SET_VIDEOS, payload: newVideos });
        }
        setError(false);
        setLoading(false);
      })
      .catch((e) => {
        if (e.name !== "AbortError") {
          setError(true);
          setLoading(false);
        }
      });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(loadVideos, [dispatch, cameras, date, latestVideoEnd]);

  const isLive =
    Math.abs(+now - +date) < LIVE_VIEW_SLOP_SECS * 1000 && playbackSpeed >= 1;

  useInterval(() => {
    if (!isPlaying || isScrubbing || showTimeEdit) return;

    dispatch?.({
      type: SET_DATE,
      payload: new Date(isLive ? now : Math.min(+date + 1000, +now)),
    });
  }, 1000 / playbackSpeed);

  const filteredVideos = videos
    .concat(
      cameras
        .filter((camera) => camera.online && camera.streamStart)
        .map((camera): Video => {
          return {
            camera: camera.id,
            // @ts-ignore camera.streamStart is guaranteed to be
            // non-null due to the .filter() before this .map()
            startDate: camera.streamStart,
            endDate: now,
            file: "",
          };
        })
    )
    .filter((video) => video.camera && streamIds.includes(video.camera));

  const calendar = useMemo(
    () => (
      <Calendar
        date={new Date(dateWithoutTime)}
        onClickDate={(d) => {
          dispatch?.({
            type: SET_DATE,
            payload: d,
          });
          setShowCal(false);
        }}
      />
    ),
    [dateWithoutTime, dispatch]
  );

  const dateArray = useMemo(
    () => [
      ...(zoom <= 0.5 ? [new Date(dateWithoutTime - 8.64e7 * 2)] : []),
      new Date(dateWithoutTime - 8.64e7),
      new Date(dateWithoutTime),
      new Date(dateWithoutTime + 8.64e7),
      ...(zoom <= 0.5 ? [new Date(dateWithoutTime + 8.64e7 * 2)] : []),
    ],
    [dateWithoutTime, zoom]
  );

  const ticks = useMemo(
    () => <TimelineTicks dateArray={dateArray} zoom={zoom} />,
    [dateArray, zoom]
  );

  return (
    <>
      <ButtonGroup className="flex-grow-1 bg-secondary rounded d-flex">
        <OverlayTrigger
          placement="top"
          trigger="click"
          show={showCal}
          onToggle={setShowCal}
          rootClose
          overlay={<Popover id="calendar">{calendar}</Popover>}
        >
          {({ ref, ...triggerHandler }) => (
            <Button
              ref={ref}
              variant={isError ? "danger" : isDarkMode ? "secondary" : "light"}
              className={`flex-grow-0 d-flex align-items-center ${
                isDarkMode ? "border-0 border-end border-dark" : ""
              }`}
              {...triggerHandler}
            >
              {isLoading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <Calendar3 />
              )}
            </Button>
          )}
        </OverlayTrigger>
        <div className="flex-grow-1 position-relative overflow-hidden pe-none">
          <DraggableCore
            nodeRef={draggerRef}
            onDrag={(e) => {
              isScrubbing || dispatch?.({ type: SET_SCRUBBING, payload: true });

              const target = e.target as HTMLElement;
              const targetRect = target.getClientRects()[0];

              let movement = 0;

              if (e instanceof MouseEvent) {
                movement = e.movementX;
              } else if (e instanceof TouchEvent) {
                if (previousTouch) {
                  const touchId = previousTouch.identifier;
                  const touchStart = previousTouch.clientX;
                  const touch = Array.from(e.changedTouches).find(
                    (t) => t.identifier === touchId
                  );
                  if (touch) {
                    movement = touch.clientX - touchStart;
                    setPreviousTouch(touch);
                  }
                } else {
                  setPreviousTouch(e.changedTouches[0]);
                }
              }

              dispatch?.({
                type: SET_DATE,
                payload: new Date(
                  Math.min(
                    +getDateFromPosition(
                      getPositionFromDate(date, targetRect.width) - movement,
                      targetRect.width,
                      date
                    ),
                    +now
                  )
                ),
              });
            }}
            onStop={(e) => {
              setPreviousTouch(undefined);

              if (isScrubbing) {
                dispatch?.({ type: SET_SCRUBBING, payload: false });
                return;
              }

              const target = e.target as HTMLElement;
              const targetRect = target.getClientRects()[0];

              const position =
                e instanceof MouseEvent
                  ? e.offsetX
                  : e instanceof TouchEvent
                  ? e.changedTouches[0].clientX - targetRect.left
                  : undefined;

              position &&
                dispatch?.({
                  type: SET_DATE,
                  payload: new Date(
                    Math.min(
                      +getDateFromPosition(
                        position,
                        targetRect.width,
                        new Date(parseInt(target.getAttribute("data-date")!))
                      ),
                      +now
                    )
                  ),
                });
            }}
          >
            <div
              ref={draggerRef}
              className="timeline-stream-bar position-absolute pe-auto"
              style={{
                width: `${100 * zoom}%`,
                left: `${50 - getPercentFromDate(date) * 100 * zoom}%`,
                ...(isScrubbing
                  ? {}
                  : {
                      transition: "width 250ms, left 250ms",
                    }),
              }}
              onMouseMove={(e) => {
                const position = e.nativeEvent.offsetX;

                const target = e.target as HTMLElement;
                const targetRect = target.getClientRects()[0];
                setHoverDate(
                  getDateFromPosition(
                    position,
                    targetRect.width,
                    new Date(parseInt(target.getAttribute("data-date")!))
                  )
                );

                const parent = target.offsetParent as HTMLElement;
                setHoverLocation(
                  parent.offsetLeft + target.offsetLeft + position
                );
              }}
              onMouseOut={() => setHoverLocation(-1)}
            >
              {dateArray.map((dt, i) => (
                <div
                  key={+dt}
                  data-date={+dt}
                  className="timeline-stream-date"
                  style={{
                    left: `${(i - Math.floor(dateArray.length / 2)) * 100}%`,
                  }}
                >
                  {filteredVideos
                    .filter(
                      (video) =>
                        video.camera &&
                        streamIds.includes(video.camera) &&
                        (+withoutTime(video.startDate) === +dt ||
                          +withoutTime(video.endDate) === +dt)
                    )
                    .map((video) => {
                      const startPercent =
                        getPercentFromDate(video.startDate) * 100;
                      const endPercent =
                        getPercentFromDate(video.endDate) * 100;
                      return (
                        <div
                          key={`${video.camera}-${+video.startDate}`}
                          className={`timeline-stream ${
                            video.file === "" ? "bg-info" : "bg-primary"
                          }`}
                          style={{
                            left: `${startPercent}%`,
                            width: `${endPercent - startPercent}%`,
                            ...(video.file === ""
                              ? { transition: "width 250ms" }
                              : {}),
                          }}
                        />
                      );
                    })}
                </div>
              ))}
              {ticks}
            </div>
          </DraggableCore>
          <CaretUpFill className="timeline-indicator text-light" />
          <span className="timeline-date-text text-light">
            <span>{date.toLocaleDateString()}</span>&emsp;
            {showTimeEdit ? (
              <input
                type="time"
                step={1}
                className="pe-auto"
                value={timeEdit}
                autoFocus
                onChange={(e) => setTimeEdit(e.target.value)}
                onBlur={() => {
                  dispatch?.({
                    type: SET_DATE,
                    payload: new Date(
                      `${date.toLocaleDateString()} ${timeEdit}`
                    ),
                  });
                  setShowTimeEdit(false);
                }}
              />
            ) : (
              <span
                className="pe-auto"
                tabIndex={-1}
                onFocus={() => {
                  setShowTimeEdit(true);
                  setTimeEdit(
                    date
                      .toLocaleString("en-US", {
                        hour12: false,
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })
                      .replace("24", "00")
                  );
                }}
              >
                {date.toLocaleTimeString()}
              </span>
            )}
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
              onClick={() => setZoom(DEFAULT_ZOOM)}
            >
              {getTextForZoomLevel(zoom)}
            </Button>
            <Button
              variant="outline-light"
              size="sm"
              className="px-1 py-0 border-0 text-monospace"
              disabled={zoom >= 128}
              onClick={() => setZoom(zoom * 2)}
            >
              +
            </Button>
          </ButtonGroup>
        </div>
        <Tooltip
          id="date-hover"
          placement="top"
          className={`timeline-date-hover ${
            hoverLocation === -1 ? "" : "show"
          }`}
          style={{
            display: hoverLocation === -1 ? "none" : "block",
            left: `${hoverLocation}px`,
            position: "absolute",
          }}
          arrowProps={{
            ref: () => {},
            style: { left: "35px", position: "absolute" },
          }}
        >
          {hoverDate.toLocaleString()}
        </Tooltip>
        <Dropdown as={ButtonGroup} drop="up">
          <Button
            variant={isDarkMode ? "secondary" : "light"}
            className={`flex-grow-0 d-flex align-items-center ${
              isDarkMode ? "border-0 border-start border-dark" : ""
            }`}
            onClick={() =>
              dispatch?.({ type: SET_PLAYING, payload: !isPlaying })
            }
          >
            {isPlaying ? <PauseFill /> : <PlayFill />}
          </Button>
          <Dropdown.Toggle
            split
            variant={isDarkMode ? "secondary" : "light"}
            className={isDarkMode ? "border-0 border-start border-dark" : ""}
          />
          <Dropdown.Menu align="end" className="text-nowrap">
            <ButtonGroup className="px-2">
              {[0.125, 0.25, 0.5, 1, 2.5, 6.25, 15.625].map((speed) => (
                <Button
                  key={speed}
                  variant={playbackSpeed === speed ? "secondary" : colorMode}
                  onClick={() =>
                    dispatch?.({ type: SET_PLAYBACK_SPEED, payload: speed })
                  }
                >
                  {speed == 0.125 ? (
                    <ChevronDoubleLeft />
                  ) : speed == 0.25 ? (
                    <ChevronLeft />
                  ) : speed == 0.5 ? (
                    <ChevronCompactLeft />
                  ) : speed == 2.5 ? (
                    <ChevronCompactRight />
                  ) : speed == 6.25 ? (
                    <ChevronRight />
                  ) : speed == 15.625 ? (
                    <ChevronDoubleRight />
                  ) : (
                    <Circle />
                  )}
                </Button>
              ))}
            </ButtonGroup>
          </Dropdown.Menu>
        </Dropdown>
      </ButtonGroup>
      <Button
        variant={isDarkMode ? "secondary" : "light"}
        className="flex-grow-0 ms-2 d-flex align-items-center"
        disabled={isLive && isPlaying}
        onClick={() => {
          dispatch?.({ type: SET_DATE, payload: new Date() });
          dispatch?.({ type: SET_PLAYING, payload: true });
          dispatch?.({ type: SET_PLAYBACK_SPEED, payload: 1 });
        }}
        title="Go live"
      >
        <SkipEndFill />
      </Button>
    </>
  );
};
