"use client";

import { Calendar, dateFnsLocalizer, SlotInfo, Event } from "react-big-calendar";
// Card 컴포넌트 제거됨
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { Settings } from "@/components/settings";
import { useState, useEffect } from "react";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ko } from "date-fns/locale";
// react-big-calendar CSS는 layout.tsx에서 import됨

interface TodoItem {
  id: string;
  title: string;
  date: Date;
  completed: boolean;
}

interface CalendarEvent extends Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: TodoItem;
}

interface SavedTodoItem {
  id: string;
  title: string;
  date: string;
  completed: boolean;
}

type PageType = "home" | "settings";

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
  const [currentPage, setCurrentPage] = useState<PageType>("home");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  useEffect(() => {
    const savedTodos = localStorage.getItem("calendar-todos");
    if (savedTodos) {
      const parsedTodos: TodoItem[] = JSON.parse(savedTodos).map((todo: SavedTodoItem) => ({
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

  const clearAllData = () => {
    setTodos([]);
    localStorage.removeItem("calendar-todos");
  };

  const getSelectedDateTodos = () => {
    if (!selectedDate) return [];
    return todos.filter(
      (todo) =>
        format(todo.date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
    );
  };

  // getDaysWithTodos 함수는 현재 사용되지 않으므로 제거됨

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
  const calendarEvents = getCalendarEvents();

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setIsSidebarOpen(true);
  };

  const handleCalendarClick = (e: React.MouseEvent<HTMLDivElement>) => {
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

  const renderContent = () => {
    if (currentPage === "settings") {
      return (
        <div className="h-screen overflow-y-auto">
          <div className="p-6">
            <Settings todos={todos} onClearData={clearAllData} />
          </div>
        </div>
      );
    }

    return (
      <>
        <Navbar />
        {/* 전체 화면 캘린더 */}
        <div className="h-[calc(100vh-4rem)] bg-white relative">
          {/* 캘린더 본체 */}
          <div className="h-full p-4 bg-white">
            <div className="h-full" onClick={handleCalendarClick}>
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: "100%" }}
                culture="ko"
                onSelectSlot={(slotInfo: SlotInfo) => handleDateSelect(slotInfo.start)}
                onSelectEvent={(event: CalendarEvent) => handleDateSelect(event.start)}
                selectable={true}
                popup={true}
                eventPropGetter={(event: CalendarEvent) => ({
                  style: {
                    backgroundColor: event.resource?.completed ? "#d1d5db" : "#f3f4f6",
                    color: event.resource?.completed ? "#6b7280" : "#374151",
                    borderRadius: "6px",
                    opacity: event.resource?.completed ? 0.8 : 1,
                    border: "1px solid #e5e7eb",
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
                  showMore: (count: number) => `+${count} 더보기`,
                }}
              />
            </div>
          </div>
        </div>

        {/* 사이드바 - 할일 관리 섹션 */}
        <div className={`fixed top-16 right-0 h-[calc(100vh-4rem)] w-96 bg-white shadow-lg border-l border-gray-100 transform transition-transform duration-300 ease-in-out z-50 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTodoTitle(e.target.value)}
                  placeholder="새 할일을 입력하세요"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
                  onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addTodo()}
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
                      className={`flex items-center gap-3 p-3 rounded-lg border ${todo.completed
                        ? "bg-gray-50 border-gray-100"
                        : "bg-white border-gray-200"
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => toggleTodo(todo.id)}
                        className="h-4 w-4 text-gray-600 focus:ring-gray-300 border-gray-300 rounded"
                      />
                      <span
                        className={`flex-1 ${todo.completed
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
                        className="text-gray-500 hover:text-gray-700"
                      >
                        삭제
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {/* 통계 */}
              {selectedDateTodos.length > 0 && (
                <div className="pt-4 border-t border-gray-100">
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
      </>
    );
  };

  return (
    <div className="h-screen bg-white relative overflow-hidden">
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onSidebarStateChange={(expanded, visible) => {
          setSidebarExpanded(expanded);
          setSidebarVisible(visible);
        }}
      />
      <div className={`h-screen transition-all duration-300 ease-in-out ${sidebarVisible
        ? (sidebarExpanded ? 'ml-64' : 'ml-16')
        : 'ml-0'
        }`}>
        {renderContent()}
      </div>
    </div>
  );
};
