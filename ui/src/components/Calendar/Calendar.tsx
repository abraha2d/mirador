import { useState } from "react";
import { Button, ButtonGroup, Popover } from "react-bootstrap";
import { CaretLeftFill, CaretRightFill } from "react-bootstrap-icons";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const getMonthArray = (year: number, month: number) => {
  const preDays = new Date(year, month, 1).getDay();
  const numDays = 32 - new Date(year, month, 32).getDate();
  const numDaysLast = 32 - new Date(year, month - 1, 32).getDate();
  const numWeeks = Math.ceil((preDays + numDays) / 7);
  const postDays = numWeeks * 7 - (preDays + numDays);

  const preArray = [...Array(preDays).keys()].map(
    (i) => new Date(year, month - 1, numDaysLast + i - preDays + 1)
  );
  const daysArray = [...Array(numDays).keys()].map(
    (i) => new Date(year, month, i + 1)
  );
  const postArray = [...Array(postDays).keys()].map(
    (i) => new Date(year, month + 1, i + 1)
  );
  const monthArray = preArray.concat(daysArray).concat(postArray);

  const month2D = [];
  while (monthArray.length) month2D.push(monthArray.splice(0, 7));
  return { monthArray: month2D, numWeeks };
};

type CalendarProps = {
  date: Date;
  onClickDate: (date: Date) => void;
};

export const Calendar = ({ date, onClickDate }: CalendarProps) => {
  const [year, setYear] = useState(date.getFullYear());
  const [month, setMonth] = useState(date.getMonth());
  const today = new Date();

  const changeMonth = (increment: number) => () => {
    let newMonth = month + increment;
    if (newMonth < 0) {
      newMonth = 11;
      setYear(year - 1);
    } else if (newMonth > 11) {
      newMonth = 0;
      setYear(year + 1);
    }
    setMonth(newMonth);
  };

  const resetMonth = () => {
    setMonth(today.getMonth());
    setYear(today.getFullYear());
  };

  const { monthArray: monthArrayPrev, numWeeks: numWeeksPrev } = getMonthArray(
    year,
    month - 1
  );
  const { monthArray, numWeeks } = getMonthArray(year, month);
  const { monthArray: monthArrayNext, numWeeks: numWeeksNext } = getMonthArray(
    year,
    month + 1
  );

  if (
    monthArrayPrev[monthArrayPrev.length - 1][0].getDate() ===
    monthArray[0][0].getDate()
  ) {
    monthArrayPrev.splice(monthArrayPrev.length - 1, 1);
  }

  if (
    monthArrayNext[0][0].getDate() ===
    monthArray[monthArray.length - 1][0].getDate()
  ) {
    monthArrayNext.splice(0, 1);
  }

  return (
    <>
      <Popover.Title className="d-flex justify-content-between align-items-center">
        <Button variant="light" size="sm" onClick={changeMonth(-1)}>
          <CaretLeftFill />
        </Button>
        <Button variant="light" size="sm" onClick={resetMonth}>
          {MONTHS[month]} {year}
        </Button>
        <Button
          variant="light"
          size="sm"
          onClick={changeMonth(1)}
          disabled={year === today.getFullYear() && month === today.getMonth()}
        >
          <CaretRightFill />
        </Button>
      </Popover.Title>
      <Popover.Content>
        <div
          className="position-relative overflow-hidden"
          style={{
            height: "216px",
            width: "246px",
          }}
        >
          {monthArrayPrev
            .concat(monthArray)
            .concat(monthArrayNext)
            .map((weekArray: Date[], i: number) => (
              <ButtonGroup
                className="position-absolute d-flex"
                key={`week-${weekArray[0].toLocaleDateString()}`}
                id={`week-${weekArray[0].toLocaleDateString()}`}
                style={{
                  transition: "top 150ms",
                  top: `${(i - monthArrayPrev.length) * 35}px`,
                }}
              >
                {weekArray.map((d) => {
                  const dYear = d.getFullYear();
                  const dMonth = d.getMonth();
                  const dDay = d.getDate();
                  return (
                    <Button
                      key={d.toLocaleDateString()}
                      id={d.toLocaleDateString()}
                      variant={
                        dYear === date.getFullYear() &&
                        dMonth === date.getMonth() &&
                        dDay === date.getDate()
                          ? "primary"
                          : dYear === year && dMonth === month
                          ? "outline-dark"
                          : ""
                      }
                      size="sm"
                      style={{
                        aspectRatio: "1",
                        width: "36px",
                      }}
                      className="rounded-0"
                      disabled={d > today}
                      onClick={() => onClickDate(new Date(dYear, dMonth, dDay))}
                    >
                      {dYear === today.getFullYear() &&
                      dMonth === today.getMonth() &&
                      dDay === today.getDate() ? (
                        <strong>{dDay}</strong>
                      ) : (
                        dDay
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
