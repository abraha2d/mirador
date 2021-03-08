import React, { useContext, useState } from "react";
import { Button, ButtonGroup, Popover } from "react-bootstrap";
import { CaretLeftFill, CaretRightFill } from "react-bootstrap-icons";

import { Context } from "components/Store";
import { withoutTime } from "utils";

import { getMonthArray } from "./utils";

import "./Calendar.css";

type CalendarProps = {
  date: Date;
  onClickDate: (date: Date) => void;
};

export const Calendar = ({ date, onClickDate }: CalendarProps) => {
  const [{ streams, videos }, dispatch] = useContext(Context);
  const streamIds = Array.from(streams.values()).map((stream) => stream.id);

  const [month, setMonth] = useState(
    new Date(date.getFullYear(), date.getMonth(), 1)
  );
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const changeMonth = (amount: number) => () => {
    setMonth(new Date(month.getFullYear(), month.getMonth() + amount, 1));
  };

  const { monthArray, numWeeksPrev, numWeeks } = getMonthArray(month);

  return (
    <>
      <Popover.Title className="d-flex align-items-center justify-content-between">
        <Button size="sm" variant="light" onClick={changeMonth(-1)}>
          <CaretLeftFill />
        </Button>
        <Button size="sm" variant="light" onClick={() => setMonth(thisMonth)}>
          {month.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </Button>
        <Button
          size="sm"
          variant="light"
          disabled={month >= thisMonth}
          onClick={changeMonth(1)}
        >
          <CaretRightFill />
        </Button>
      </Popover.Title>
      <Popover.Content>
        <div
          className="calendar-body"
          style={{
            height: `${numWeeks * 35 + 1}px`,
          }}
        >
          {monthArray.map((weekArray, i) => (
            <ButtonGroup
              key={`week-of-${weekArray[0].toLocaleDateString()}`}
              className="calendar-week"
              style={{
                top: `${(i - numWeeksPrev) * 35}px`,
              }}
            >
              {weekArray.map((d) => {
                return (
                  <Button
                    key={d.toLocaleDateString()}
                    size="sm"
                    variant={
                      d.getTime() === date.getTime()
                        ? "primary"
                        : d.getFullYear() === month.getFullYear() &&
                          d.getMonth() === month.getMonth()
                        ? d <= today
                          ? "outline-dark"
                          : "outline-secondary"
                        : ""
                    }
                    className={`calendar-day ${
                      d.getTime() === today.getTime()
                        ? "font-weight-bolder"
                        : ""
                    } ${
                      videos.filter(
                        (video) =>
                          withoutTime(video.startDate).getTime() ===
                            withoutTime(d).getTime() &&
                          streamIds.includes(video.camera)
                      ).length
                        ? d.getTime() === date.getTime()
                          ? "btn-info"
                          : "text-info"
                        : ""
                    }`}
                    disabled={d > today}
                    onClick={() => onClickDate(d)}
                  >
                    {d.getDate()}
                  </Button>
                );
              })}
            </ButtonGroup>
          ))}
        </div>
      </Popover.Content>
    </>
  );
};
