"use client";

import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { useState } from "react";

type Props = {
  selected: string;
  onSelect: (date: string) => void;
  maxDaysAhead?: number;
};

export function DateCalendar({
  selected,
  onSelect,
  maxDaysAhead = 60,
}: Props) {
  const today = startOfDay(new Date());
  const maxDate = addDays(today, maxDaysAhead - 1);
  const selectedDate = selected
    ? startOfDay(new Date(`${selected}T12:00:00`))
    : null;

  const [visibleMonth, setVisibleMonth] = useState(
    selectedDate && isSameMonth(selectedDate, today) ? today : (selectedDate ?? today),
  );

  const monthStart = startOfMonth(visibleMonth);
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(endOfMonth(visibleMonth)),
  });

  const canGoPrev = !isSameMonth(today, visibleMonth);
  const canGoNext = !isBefore(maxDate, startOfMonth(addMonths(visibleMonth, 1)));

  return (
    <div className="date-calendar">
      <div className="date-calendar-header">
        <button
          type="button"
          className="cal-nav"
          disabled={!canGoPrev}
          onClick={() => setVisibleMonth(subMonths(visibleMonth, 1))}
          aria-label="Previous month"
        >
          ‹
        </button>
        <p className="cal-month">{format(visibleMonth, "MMMM yyyy")}</p>
        <button
          type="button"
          className="cal-nav"
          disabled={!canGoNext}
          onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="cal-weekdays" aria-hidden="true">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="cal-grid" role="grid" aria-label="Choose a date">
        {days.map((day) => {
          const value = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, visibleMonth);
          const disabled =
            !inMonth || isBefore(day, today) || isBefore(maxDate, day);
          const isSelected = selectedDate
            ? isSameDay(day, selectedDate)
            : false;
          const isToday = isSameDay(day, today);

          return (
            <button
              key={value}
              type="button"
              role="gridcell"
              disabled={disabled}
              aria-selected={isSelected}
              className={[
                "cal-day",
                isSelected ? "selected" : "",
                isToday ? "today" : "",
                !inMonth ? "outside" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onSelect(value)}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
