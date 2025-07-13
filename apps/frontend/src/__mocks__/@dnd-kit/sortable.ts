import React from 'react';

export const SortableContext = ({ children }: { children: React.ReactNode }) => {
  return React.createElement('div', { 'data-testid': 'sortable-context' }, children);
};

export const useSortable = jest.fn().mockReturnValue({
  attributes: {},
  listeners: {},
  setNodeRef: jest.fn(),
  transform: null,
  transition: null,
  isDragging: false,
});

export const arrayMove = <T>(array: T[], from: number, to: number): T[] => {
  const newArray = [...array];
  const item = newArray.splice(from, 1)[0];
  newArray.splice(to, 0, item);
  return newArray;
};

export const verticalListSortingStrategy = jest.fn();
export const horizontalListSortingStrategy = jest.fn();

export const sortableKeyboardCoordinates = jest.fn();