"use client";

import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import { useState, useEffect } from "react";
import { format, parse, startOfWeek, getDay, isToday } from "date-fns";
import { ko } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

interface TodoItem {
  id: string;
  title: string;
  date: Date;
  completed: boolean;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: TodoItem;
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { ko },
});

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const savedTodos = localStorage.getItem("calendar-todos");
    if (savedTodos) {
      const parsedTodos = JSON.parse(savedTodos).map((todo: any) => ({
        ...todo,
        date: new Date(todo.date),
      }));
      setTodos(parsedTodos);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("calendar-todos", JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (newTodoTitle.trim() && selectedDate) {
      const newTodo: TodoItem = {
        id: Date.now().toString(),
        title: newTodoTitle.trim(),
        date: selectedDate,
        completed: false,
      };
      setTodos([...todos, newTodo]);
      setNewTodoTitle("");
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const getSelectedDateTodos = () => {
    if (!selectedDate) return [];
    return todos.filter(
      (todo) =>
        format(todo.date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
    );
  };

  const getDaysWithTodos = () => {
    const daysWithTodos = new Set();
    todos.forEach((todo) => {
      daysWithTodos.add(format(todo.date, "yyyy-MM-dd"));
    });
    return daysWithTodos;
  };

  const getCalendarEvents = (): CalendarEvent[] => {
    return todos.map((todo) => ({
      id: todo.id,
      title: todo.completed ? `✓ ${todo.title}` : todo.title,
      start: todo.date,
      end: todo.date,
      resource: todo,
    }));
  };

  const selectedDateTodos = getSelectedDateTodos();
  const daysWithTodos = getDaysWithTodos();
  const calendarEvents = getCalendarEvents();

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setIsSidebarOpen(true);
  };

  const handleCalendarClick = (e: React.MouseEvent) => {
    // 캘린더의 빈 공간을 클릭했을 때 사이드바 닫기
    const target = e.target as HTMLElement;
    
    // 캘린더의 빈 공간(월 뷰의 셀, 주 뷰의 시간 슬롯 등)을 클릭했는지 확인
    if (
      target.classList.contains('rbc-day-bg') ||
      target.classList.contains('rbc-date-cell') ||
      target.classList.contains('rbc-month-view') ||
      target.classList.contains('rbc-month-row') ||
      target.classList.contains('rbc-row-bg') ||
      target.classList.contains('rbc-time-slot') ||
      target.classList.contains('rbc-time-column') ||
      target.classList.contains('rbc-time-content')
    ) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <Navbar />
      
      {/* 전체 화면 캘린더 */}
      <div className="h-[calc(100vh-4rem)] p-4">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>캘린더 할일 관리</span>
              <div className="flex items-center min-w-0 w-auto relative">
                <div className="invisible">
                  <Badge variant="secondary">
                    2024년 12월 31일
                  </Badge>
                </div>
                {selectedDate && isSidebarOpen && (
                  <Badge variant="secondary" className="absolute top-0 right-0">
                    {format(selectedDate, "yyyy년 MM월 dd일", { locale: ko })}
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-full p-4">
            <div className="h-full" onClick={handleCalendarClick}>
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: "100%" }}
                culture="ko"
                onSelectSlot={(slotInfo) => handleDateSelect(slotInfo.start)}
                onSelectEvent={(event) => handleDateSelect(event.start)}
                selectable={true}
                popup={true}
                eventPropGetter={(event) => ({
                  style: {
                    backgroundColor: event.resource?.completed ? "#10b981" : "#3b82f6",
                    borderRadius: "6px",
                    opacity: event.resource?.completed ? 0.7 : 1,
                    border: "none",
                  },
                })}
                views={["month", "week", "day"]}
                defaultView="month"
                messages={{
                  next: "다음",
                  previous: "이전",
                  today: "오늘",
                  month: "월",
                  week: "주",
                  day: "일",
                  agenda: "일정",
                  date: "날짜",
                  time: "시간",
                  event: "이벤트",
                  noEventsInRange: "이 기간에 일정이 없습니다.",
                  showMore: (count) => `+${count} 더보기`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 사이드바 - 할일 관리 섹션 */}
      <div className={`fixed top-16 right-0 h-[calc(100vh-4rem)] w-96 bg-white shadow-2xl border-l transform transition-transform duration-300 ease-in-out z-50 ${
        isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">
              {selectedDate
                ? `${format(selectedDate, "MM월 dd일", { locale: ko })} 할일`
                : "할일 목록"}
              {selectedDateTodos.length > 0 && (
                <Badge className="ml-2">{selectedDateTodos.length}</Badge>
              )}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(false)}
              className="h-8 w-8 p-0"
            >
              ✕
            </Button>
          </div>
          <div className="flex-1 flex flex-col space-y-4 p-4">
            {/* 할일 추가 폼 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                placeholder="새 할일을 입력하세요"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === "Enter" && addTodo()}
              />
              <Button onClick={addTodo} disabled={!selectedDate}>
                추가
              </Button>
            </div>

            {/* 할일 목록 */}
            <div className="flex-1 space-y-2 overflow-y-auto">
              {selectedDateTodos.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  {selectedDate
                    ? "이 날짜에 등록된 할일이 없습니다"
                    : "날짜를 선택해주세요"}
                </p>
              ) : (
                selectedDateTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      todo.completed
                        ? "bg-gray-50 border-gray-200"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span
                      className={`flex-1 ${
                        todo.completed
                          ? "line-through text-gray-500"
                          : "text-gray-900"
                      }`}
                    >
                      {todo.title}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteTodo(todo.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      삭제
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* 통계 */}
            {selectedDateTodos.length > 0 && (
              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>전체: {selectedDateTodos.length}개</span>
                  <span>
                    완료: {selectedDateTodos.filter((t) => t.completed).length}
                    개
                  </span>
                  <span>
                    미완료:{" "}
                    {selectedDateTodos.filter((t) => !t.completed).length}개
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}