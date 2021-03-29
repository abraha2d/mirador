import React from "react";

type TimelineTicksProps = {
  dateArray: Date[];
  zoom: number;
};

export const TimelineTicks = ({ dateArray, zoom }: TimelineTicksProps) => {
  console.log("Ticks rendered!");
  return (
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
          className="timeline-tick day position-absolute bg-light"
          style={{
            left: `${(100 / dateArray.length) * i}%`,
          }}
        />
      ))}
      {[...Array(dateArray.length * 4 + 1).keys()].map((i) => (
        <div
          key={`6hour-${i}`}
          className="timeline-tick hour position-absolute bg-light"
          style={{
            left: `${(100 / (dateArray.length * 4)) * i}%`,
          }}
        />
      ))}
      {zoom >= 1 &&
        [...Array(dateArray.length * 24 + 1).keys()].map((i) => (
          <div
            key={`hour-${i}`}
            className="timeline-tick hour position-absolute bg-light"
            style={{
              left: `${(100 / (dateArray.length * 24)) * i}%`,
            }}
          />
        ))}
      {zoom >= 4 &&
        [...Array(dateArray.length * 24 * 2 + 1).keys()].map((i) => (
          <div
            key={`30min-${i}`}
            className="timeline-tick minute position-absolute bg-light"
            style={{
              left: `${(100 / (dateArray.length * 24 * 2)) * i}%`,
            }}
          />
        ))}
      {zoom >= 8 &&
        [...Array(dateArray.length * 24 * 6 + 1).keys()].map((i) => (
          <div
            key={`10min-${i}`}
            className="timeline-tick minute position-absolute bg-light"
            style={{
              left: `${(100 / (dateArray.length * 24 * 6)) * i}%`,
            }}
          />
        ))}
    </div>
  );
};

export default TimelineTicks;
