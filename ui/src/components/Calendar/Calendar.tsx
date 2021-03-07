import { useState } from "react";
import { Button, ButtonGroup, Popover } from "react-bootstrap";
import { CaretLeftFill, CaretRightFill } from "react-bootstrap-icons";

const getMonthArray = (monthDate: Date) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const monthDatePrev = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() - 1,
    1
  );
  const monthDateNext = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 1,
    1
  );

  const preDaysPrev = monthDatePrev.getDay();
  const numDaysPrev = 32 - new Date(year, month - 1, 32).getDate();
  const numWeeksPrev = Math.floor((preDaysPrev + numDaysPrev) / 7);

  const preDays = monthDate.getDay();
  const numDays = 32 - new Date(year, month, 32).getDate();
  const numWeeks = Math.ceil((preDays + numDays) / 7);

  const firstDaysNext = monthDateNext.getDay();
  const numDaysNext = 32 - new Date(year, month + 1, 32).getDate();
  const numWeeksNext = Math.ceil((numDaysNext - firstDaysNext) / 7);

  let date = new Date(
    monthDatePrev.getFullYear(),
    monthDatePrev.getMonth(),
    1 - preDaysPrev
  );

  const monthArray = [];
  for (const i of Array(numWeeksPrev + numWeeks + numWeeksNext).keys()) {
    const weekArray = [];
    for (const j of Array(7).keys()) {
      weekArray[j] = date;
      date = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    }
    monthArray[i] = weekArray;
  }

  return { monthArray, numWeeksPrev, numWeeks };
};

type CalendarProps = {
  date: Date;
  onClickDate: (date: Date) => void;
};

export const Calendar = ({ date, onClickDate }: CalendarProps) => {
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
      <Popover.Title className="d-flex justify-content-between align-items-center">
        <Button variant="light" size="sm" onClick={changeMonth(-1)}>
          <CaretLeftFill />
        </Button>
        <Button variant="light" size="sm" onClick={() => setMonth(thisMonth)}>
          {month.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </Button>
        <Button
          variant="light"
          size="sm"
          disabled={month >= thisMonth}
          onClick={changeMonth(1)}
        >
          <CaretRightFill />
        </Button>
      </Popover.Title>
      <Popover.Content>
        <div
          className="position-relative overflow-hidden"
          style={{
            width: "246px",
            height: `${numWeeks * 35 + 1}px`,
            transition: "height 150ms",
          }}
        >
          {monthArray.map((weekArray, i) => (
            <ButtonGroup
              key={`week-of-${weekArray[0].toLocaleDateString()}`}
              className="position-absolute d-flex"
              style={{
                transition: "top 150ms",
                top: `${(i - numWeeksPrev) * 35}px`,
              }}
            >
              {weekArray.map((d) => {
                return (
                  <Button
                    key={d.toLocaleDateString()}
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
                    size="sm"
                    className="rounded-0"
                    style={{
                      aspectRatio: "1",
                      width: "36px",
                    }}
                    disabled={d > today}
                    onClick={() => onClickDate(d)}
                  >
                    {d.getTime() === today.getTime() ? (
                      <strong>{d.getDate()}</strong>
                    ) : (
                      d.getDate()
                    )}
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
