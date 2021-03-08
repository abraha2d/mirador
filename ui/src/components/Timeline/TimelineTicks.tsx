import React from "react";

type TimelineTicksProps = {
  dateArray: Date[];
  zoom: number;
};

export const TimelineTicks = ({ dateArray, zoom }: TimelineTicksProps) => (
  <div
    className="position-absolute h-100"
    style={{
      width: `${dateArray.length * 100}%`,
      left: `${-Math.floor(dateArray.length / 2) * 100}%`,
      pointerEvents: "none",
    }}
  >
    {[...Array(dateArray.length + 1).keys()].map((i) => (
      <div
        key={`day-${i}`}
        className="position-absolute bg-light"
        style={{
          width: "1px",
          height: "1em",
          left: `${(100 / dateArray.length) * i}%`,
          bottom: 0,
        }}
      />
    ))}
    {[...Array(dateArray.length * 4 + 1).keys()].map((i) => (
      <div
        key={`6hour-${i}`}
        className="position-absolute bg-light"
        style={{
          width: "1px",
          height: "0.75em",
          left: `${(100 / (dateArray.length * 4)) * i}%`,
          bottom: 0,
        }}
      />
    ))}
    {zoom >= 1 &&
      [...Array(dateArray.length * 24 + 1).keys()].map((i) => (
        <div
          key={`hour-${i}`}
          className="position-absolute bg-light"
          style={{
            width: "1px",
            height: "0.75em",
            left: `${(100 / (dateArray.length * 24)) * i}%`,
            bottom: 0,
          }}
        />
      ))}
    {zoom >= 4 &&
      [...Array(dateArray.length * 24 * 2 + 1).keys()].map((i) => (
        <div
          key={`30min-${i}`}
          className="position-absolute bg-light"
          style={{
            width: "1px",
            height: "0.5em",
            left: `${(100 / (dateArray.length * 24 * 2)) * i}%`,
            bottom: 0,
          }}
        />
      ))}
    {zoom >= 8 &&
      [...Array(dateArray.length * 24 * 6 + 1).keys()].map((i) => (
        <div
          key={`10min-${i}`}
          className="position-absolute bg-light"
          style={{
            width: "1px",
            height: "0.5em",
            left: `${(100 / (dateArray.length * 24 * 6)) * i}%`,
            bottom: 0,
          }}
        />
      ))}
  </div>
);

export default TimelineTicks;
