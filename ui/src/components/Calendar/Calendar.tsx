import React, { useContext, useEffect, useState } from "react";
import { Button, ButtonGroup, Popover, Spinner } from "react-bootstrap";
import { CaretLeftFill, CaretRightFill } from "react-bootstrap-icons";

import { Context } from "components/Store";

import { getMonthArray } from "./utils";

import "./Calendar.css";

type CalendarProps = {
  date: Date;
  onClickDate: (date: Date) => void;
};

let abortController = new AbortController();

export const Calendar = ({ date, onClickDate }: CalendarProps) => {
  const [{ streams }] = useContext(Context);
  const streamIds = Array.from(streams.values()).map((stream) => stream.id);

  const [isLoading, setLoading] = useState(false);
  const [isError, setError] = useState(false);
  const [dates, setDates] = useState([""]);

  const [month, setMonth] = useState(
    new Date(date.getFullYear(), date.getMonth(), 1)
  );
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const loadDates = () => {
    setLoading(true);
    abortController.abort();
    abortController = new AbortController();
    const id_params = streamIds.map((id) => `&camera_id=${id}`).join("");
    fetch(
      `/api/videos/dates/?month=${month.toLocaleDateString()}${id_params}`,
      {
        signal: abortController.signal,
      }
    )
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error();
        }
      })
      .then((response) => {
        setDates(response);
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

  useEffect(loadDates, [month]);

  const changeMonth = (amount: number) => () => {
    setMonth(new Date(month.getFullYear(), month.getMonth() + amount, 1));
  };

  const { monthArray, numWeeksPrev, numWeeks } = getMonthArray(month);

  return (
    <>
      <Popover.Title
        className={`d-flex align-items-center justify-content-between ${
          isError && "bg-danger"
        }`}
      >
        <Button
          size="sm"
          variant={isError ? "danger" : "light"}
          onClick={changeMonth(-1)}
        >
          <CaretLeftFill />
        </Button>
        <Button
          size="sm"
          variant={isError ? "danger" : "light"}
          onClick={() => setMonth(thisMonth)}
        >
          {isLoading && (
            <Spinner animation="border" size="sm" className="mr-2" />
          )}
          {month.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </Button>
        <Button
          size="sm"
          variant={isError ? "danger" : "light"}
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
            height: `${(6 || numWeeks) * 35 + 1}px`,
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
                      dates.includes(d.toLocaleDateString())
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
