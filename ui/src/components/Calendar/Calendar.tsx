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

type CalendarProps = {
  date: Date;
  onClickDate: (date: Date) => void;
};

export const Calendar = ({ date, onClickDate }: CalendarProps) => {
  const [year, setYear] = useState(date.getFullYear());
  const [month, setMonth] = useState(date.getMonth());

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
    setMonth(date.getMonth());
    setYear(date.getFullYear());
  };

  return (
    <>
      <Popover.Title className="d-flex justify-content-between align-items-center">
        <Button variant="light" size="sm" onClick={changeMonth(-1)}>
          <CaretLeftFill />
        </Button>
        <Button variant="light" size="sm" onClick={resetMonth}>
          {MONTHS[month]} {year}
        </Button>
        <Button variant="light" size="sm" onClick={changeMonth(1)}>
          <CaretRightFill />
        </Button>
      </Popover.Title>
      <Popover.Content>
        <div>
          {[
            ["31", 1, 2, 3, 4, 5, 6],
            [7, 8, 9, 10, 11, 12, 13],
            [14, 15, 16, 17, 18, 19, 20],
            [21, 22, 23, 24, 25, 26, 27],
            [28, 29, 30, 31, "1", "2", "3"],
          ].map((week, i) => (
            <div className="d-flex" key={i}>
              {week.map((day, j) => (
                <Button
                  key={`${i},${j}`}
                  variant={typeof day === "number" ? "light" : ""}
                  size="sm"
                  style={{ aspectRatio: "1", width: "36px" }}
                  disabled={typeof day !== "number"}
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
