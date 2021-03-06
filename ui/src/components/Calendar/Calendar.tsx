import { useState } from "react";
import { Button, Popover } from "react-bootstrap";
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

  const preArray: (string | number)[] = [...Array(preDays).keys()].map((i) =>
    (numDaysLast + i - preDays + 1).toString()
  );
  const daysArray = [...Array(numDays).keys()].map((i) => i + 1);
  const postArray = [...Array(postDays).keys()].map((i) => (i + 1).toString());
  const monthArray = preArray.concat(daysArray).concat(postArray);

  const month2D = [];
  while (monthArray.length) month2D.push(monthArray.splice(0, 7));
  return month2D;
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

  const monthArray = getMonthArray(year, month);

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
        <div>
          {monthArray.map((week, i) => (
            <div className="d-flex" key={i}>
              {week.map((day, j) => (
                <Button
                  key={`${i},${j}`}
                  variant={typeof day === "number" ? "light" : ""}
                  size="sm"
                  style={{ aspectRatio: "1", width: "36px" }}
                  disabled={
                    typeof day !== "number" ||
                    (year === today.getFullYear() &&
                      month === today.getMonth() &&
                      day > today.getDate())
                  }
                  onClick={() =>
                    typeof day == "number" &&
                    onClickDate(new Date(year, month, day))
                  }
                >
                  {year === date.getFullYear() &&
                  month === date.getMonth() &&
                  day === date.getDate() ? (
                    <strong>{day}</strong>
                  ) : (
                    day
                  )}
                </Button>
              ))}
            </div>
          ))}
        </div>
      </Popover.Content>
    </>
  );
};
