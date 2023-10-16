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

  const containerRef = useRef<HTMLDivElement>(null);
  const draggerRef = useRef<HTMLDivElement>(null);
  const draggerWidth = draggerRef.current?.clientWidth;

  const now = new Date();

  const [isLoading, setLoading] = useState(false);
  const [isError, setError] = useState(false);

  const [showCal, setShowCal] = useState(false);
  const [zoom, setZoom] = useState(8);

  const [hoverLocation, setHoverLocation] = useState(-1);
  const [hoverDate, setHoverDate] = useState(now);

  const [showTimeEdit, setShowTimeEdit] = useState(false);
  const [timeEdit, setTimeEdit] = useState("");

  const latestPing = Math.max(
    ...cameras
      .filter((camera) => camera.lastPing && streamIds.includes(camera.id))
      // @ts-ignore camera.lastPing is guaranteed to be
      // non-null due to the .filter() before this .map()
      .map((camera) => +camera.lastPing)
  );
  const prevPing = usePrevious(latestPing);

  const loadVideos = () => {
    const dateStr = date.toLocaleDateString();
    if (
      (dateStr === prevDate?.toLocaleDateString() && latestPing === prevPing) ||
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
  useEffect(loadVideos, [dispatch, cameras, date, latestPing]);

  useInterval(() => {
    isPlaying &&
      !isScrubbing &&
      !showTimeEdit &&
      dispatch?.({
        type: SET_DATE,
        payload: new Date(Math.min(+date + 1000, +now)),
      });
  }, 1000 / playbackSpeed);

  const filteredVideos = videos
    .concat(
      cameras
        .filter((camera) => camera.lastPing)
        .map((camera): Video => {
          return {
            camera: camera.id,
            // @ts-ignore camera.lastPing is guaranteed to be
            // non-null due to the .filter() before this .map()
            startDate: new Date(camera.lastPing),
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
        <div
          ref={containerRef}
          className="flex-grow-1 position-relative overflow-hidden pe-none"
        >
          <DraggableCore
            nodeRef={draggerRef}
            onDrag={(e) => {
              isScrubbing || dispatch?.({ type: SET_SCRUBBING, payload: true });
              e instanceof MouseEvent &&
                draggerWidth &&
                dispatch?.({
                  type: SET_DATE,
                  payload: new Date(
                    Math.min(
                      +getDateFromPosition(
                        getPositionFromDate(date, draggerWidth) - e.movementX,
                        draggerWidth,
                        date
                      ),
                      +now
                    )
                  ),
                });
            }}
            onStop={(e) => {
              isScrubbing
                ? dispatch?.({ type: SET_SCRUBBING, payload: false })
                : e instanceof MouseEvent &&
                  draggerWidth &&
                  dispatch?.({
                    type: SET_DATE,
                    payload: new Date(
                      Math.min(
                        +getDateFromPosition(
                          e.offsetX,
                          draggerWidth,
                          new Date(
                            parseInt(
                              (e.target as HTMLElement).getAttribute(
                                "data-date"
                              )!
                            )
                          )
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
                if (!draggerWidth) return;
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
                    new Date(parseInt(target.getAttribute("data-date")!))
                  )
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
              onClick={() => setZoom(1)}
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
              <Button
                variant={playbackSpeed === 0.125 ? "secondary" : colorMode}
                onClick={() =>
                  dispatch?.({ type: SET_PLAYBACK_SPEED, payload: 0.125 })
                }
              >
                <ChevronDoubleLeft />
              </Button>
              <Button
                variant={playbackSpeed === 0.25 ? "secondary" : colorMode}
                onClick={() =>
                  dispatch?.({ type: SET_PLAYBACK_SPEED, payload: 0.25 })
                }
              >
                <ChevronLeft />
              </Button>
              <Button
                variant={playbackSpeed === 0.5 ? "secondary" : colorMode}
                onClick={() =>
                  dispatch?.({ type: SET_PLAYBACK_SPEED, payload: 0.5 })
                }
              >
                <ChevronCompactLeft />
              </Button>
              <Button
                variant={playbackSpeed === 1 ? "secondary" : colorMode}
                onClick={() =>
                  dispatch?.({ type: SET_PLAYBACK_SPEED, payload: 1 })
                }
              >
                <Circle />
              </Button>
              <Button
                variant={playbackSpeed === 2.5 ? "secondary" : colorMode}
                onClick={() =>
                  dispatch?.({ type: SET_PLAYBACK_SPEED, payload: 2.5 })
                }
              >
                <ChevronCompactRight />
              </Button>
              <Button
                variant={playbackSpeed === 6.25 ? "secondary" : colorMode}
                onClick={() =>
                  dispatch?.({ type: SET_PLAYBACK_SPEED, payload: 6.25 })
                }
              >
                <ChevronRight />
              </Button>
              <Button
                variant={playbackSpeed === 15.625 ? "secondary" : colorMode}
                onClick={() =>
                  dispatch?.({ type: SET_PLAYBACK_SPEED, payload: 15.625 })
                }
              >
                <ChevronDoubleRight />
              </Button>
            </ButtonGroup>
          </Dropdown.Menu>
        </Dropdown>
      </ButtonGroup>
      <Button
        variant={isDarkMode ? "secondary" : "light"}
        className="flex-grow-0 ms-2 d-flex align-items-center"
        disabled={+now - +date < 2000 && isPlaying}
        onClick={() => {
          dispatch?.({ type: SET_DATE, payload: new Date() });
          dispatch?.({ type: SET_PLAYING, payload: true });
        }}
        title="Go live"
      >
        <SkipEndFill />
      </Button>
    </>
  );
};
