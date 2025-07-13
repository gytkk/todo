import React from 'react';

export const DndContext = ({ children }: { children: React.ReactNode }) => {
  return React.createElement('div', { 'data-testid': 'dnd-context' }, children);
};

export const useDraggable = jest.fn().mockReturnValue({
  attributes: {},
  listeners: {},
  setNodeRef: jest.fn(),
  transform: null,
  isDragging: false,
});

export const useDroppable = jest.fn().mockReturnValue({
  setNodeRef: jest.fn(),
  isOver: false,
});

export const useSensor = jest.fn();
export const useSensors = jest.fn(() => []);

export const PointerSensor = jest.fn();
export const KeyboardSensor = jest.fn();

export const closestCenter = jest.fn();
export const closestCorners = jest.fn();

export const DragOverlay = ({ children }: { children?: React.ReactNode }) => {
  return children ? React.createElement('div', { 'data-testid': 'drag-overlay' }, children) : null;
};

export const defaultDropAnimation = {};