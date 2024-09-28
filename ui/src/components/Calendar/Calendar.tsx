import React, { useContext, useEffect, useState } from "react";
import {
  Button,
  ButtonGroup,
  PopoverBody,
  PopoverHeader,
  Spinner,
} from "react-bootstrap";
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
  const [{ colorMode, isDarkMode, streamIds }] = useContext(Context);

  const [isLoading, setLoading] = useState(false);
  const [isError, setError] = useState(false);
  const [dates, setDates] = useState([""]);

  const [month, setMonth] = useState(
    new Date(date.getFullYear(), date.getMonth(), 1),
  );

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const loadDates = () => {
    setLoading(true);
    abortController = new AbortController();
    const id_params = streamIds.map((id) => `&camera_id=${id}`).join("");
    fetch(
      `/api/videos/dates/?month=${month.toLocaleDateString()}${id_params}`,
      {
        signal: abortController.signal,
      },
    )
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error();
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
    return () => {
      abortController.abort();
    };
  };

  useEffect(loadDates, [month, streamIds]);

  const changeMonth = (amount: number) => () => {
    setMonth(new Date(month.getFullYear(), month.getMonth() + amount, 1));
  };

  const { monthArray, numWeeksPrev, numWeeks } = getMonthArray(month);

  const popoverHeaderVariant = isError ? "danger" : colorMode;

  return (
    <>
      <PopoverHeader
        className={`d-flex align-items-center justify-content-between bg-${popoverHeaderVariant}`}
      >
        <Button
          size="sm"
          variant={popoverHeaderVariant}
          onClick={changeMonth(-1)}
        >
          <CaretLeftFill />
        </Button>
        <Button
          size="sm"
          variant={popoverHeaderVariant}
          className="d-flex"
          onClick={() => setMonth(thisMonth)}
        >
          <div className="me-2" style={{ width: "1rem", height: "1rem" }} />
          {month.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
          {isLoading ? (
            <Spinner animation="border" size="sm" className="ms-2" />
          ) : (
            <div className="ms-2" style={{ width: "1rem", height: "1rem" }} />
          )}
        </Button>
        <Button
          size="sm"
          variant={popoverHeaderVariant}
          disabled={month >= thisMonth}
          onClick={changeMonth(1)}
        >
          <CaretRightFill />
        </Button>
      </PopoverHeader>
      <PopoverBody>
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
                      +d === +date
                        ? "primary"
                        : d.getFullYear() === month.getFullYear() &&
                            d.getMonth() === month.getMonth()
                          ? d <= today
                            ? `outline-${isDarkMode ? "light" : "dark"}`
                            : "outline-secondary"
                          : ""
                    }
                    className={`calendar-day ${
                      +d === +today ? "font-weight-bold" : ""
                    } ${
                      dates.includes(d.toLocaleDateString())
                        ? +d === +date
                          ? "btn-info"
                          : "text-info"
                        : ""
                    } ${
                      d.getFullYear() === month.getFullYear() &&
                      d.getMonth() === month.getMonth()
                        ? ""
                        : "border-0"
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
      </PopoverBody>
    </>
  );
};
