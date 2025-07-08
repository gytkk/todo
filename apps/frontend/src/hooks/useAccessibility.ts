import React, { useEffect, useRef, useState, useCallback, useId } from 'react';

// 키보드 내비게이션을 위한 훅
export function useKeyboardNavigation<T extends HTMLElement = HTMLElement>(
  options: {
    onEnter?: () => void;
    onEscape?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
    preventDefault?: boolean;
  } = {}
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const {
        onEnter,
        onEscape,
        onArrowUp,
        onArrowDown,
        onArrowLeft,
        onArrowRight,
        preventDefault = true
      } = options;

      switch (event.key) {
        case 'Enter':
          if (onEnter) {
            if (preventDefault) event.preventDefault();
            onEnter();
          }
          break;
        case 'Escape':
          if (onEscape) {
            if (preventDefault) event.preventDefault();
            onEscape();
          }
          break;
        case 'ArrowUp':
          if (onArrowUp) {
            if (preventDefault) event.preventDefault();
            onArrowUp();
          }
          break;
        case 'ArrowDown':
          if (onArrowDown) {
            if (preventDefault) event.preventDefault();
            onArrowDown();
          }
          break;
        case 'ArrowLeft':
          if (onArrowLeft) {
            if (preventDefault) event.preventDefault();
            onArrowLeft();
          }
          break;
        case 'ArrowRight':
          if (onArrowRight) {
            if (preventDefault) event.preventDefault();
            onArrowRight();
          }
          break;
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    return () => element.removeEventListener('keydown', handleKeyDown);
  }, [options]);

  return ref;
}

// 포커스 관리를 위한 훅
export function useFocusManagement() {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const itemsRef = useRef<(HTMLElement | null)[]>([]);

  const registerItem = useCallback((index: number) => (element: HTMLElement | null) => {
    itemsRef.current[index] = element;
  }, []);

  const focusItem = useCallback((index: number) => {
    const item = itemsRef.current[index];
    if (item) {
      item.focus();
      setFocusedIndex(index);
    }
  }, []);

  const focusNext = useCallback(() => {
    const nextIndex = Math.min(focusedIndex + 1, itemsRef.current.length - 1);
    focusItem(nextIndex);
  }, [focusedIndex, focusItem]);

  const focusPrevious = useCallback(() => {
    const prevIndex = Math.max(focusedIndex - 1, 0);
    focusItem(prevIndex);
  }, [focusedIndex, focusItem]);

  const focusFirst = useCallback(() => {
    focusItem(0);
  }, [focusItem]);

  const focusLast = useCallback(() => {
    focusItem(itemsRef.current.length - 1);
  }, [focusItem]);

  return {
    focusedIndex,
    registerItem,
    focusItem,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
  };
}

// 포커스 트랩을 위한 훅 (모달, 사이드바 등에서 사용)
export function useFocusTrap<T extends HTMLElement = HTMLElement>(isActive: boolean = false) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!isActive) return;

    const element = ref.current;
    if (!element) return;

    // 포커스 가능한 요소들을 찾음
    const focusableElements = element.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // 초기 포커스
    if (firstElement) {
      firstElement.focus();
    }

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab (역방향)
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab (정방향)
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);

    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  }, [isActive]);

  return ref;
}

// ARIA 속성을 동적으로 관리하는 훅
export function useAria() {
  const baseId = useId();
  const idCounterRef = useRef(0);
  
  const generateId = useCallback((prefix: string = 'aria') => {
    idCounterRef.current += 1;
    return `${prefix}-${baseId}-${idCounterRef.current}`;
  }, [baseId]);

  const getAriaProps = useCallback((
    options: {
      label?: string;
      labelledBy?: string;
      describedBy?: string;
      expanded?: boolean;
      selected?: boolean;
      checked?: boolean;
      disabled?: boolean;
      invalid?: boolean;
      required?: boolean;
      live?: 'off' | 'polite' | 'assertive';
      atomic?: boolean;
      hidden?: boolean;
    } = {}
  ) => {
    const ariaProps: Record<string, any> = {};

    if (options.label) ariaProps['aria-label'] = options.label;
    if (options.labelledBy) ariaProps['aria-labelledby'] = options.labelledBy;
    if (options.describedBy) ariaProps['aria-describedby'] = options.describedBy;
    if (options.expanded !== undefined) ariaProps['aria-expanded'] = options.expanded;
    if (options.selected !== undefined) ariaProps['aria-selected'] = options.selected;
    if (options.checked !== undefined) ariaProps['aria-checked'] = options.checked;
    if (options.disabled !== undefined) ariaProps['aria-disabled'] = options.disabled;
    if (options.invalid !== undefined) ariaProps['aria-invalid'] = options.invalid;
    if (options.required !== undefined) ariaProps['aria-required'] = options.required;
    if (options.live) ariaProps['aria-live'] = options.live;
    if (options.atomic !== undefined) ariaProps['aria-atomic'] = options.atomic;
    if (options.hidden !== undefined) ariaProps['aria-hidden'] = options.hidden;

    return ariaProps;
  }, []);

  return { generateId, getAriaProps };
}

// 고대비 모드 감지
export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const checkHighContrast = () => {
      // CSS media query를 사용하여 고대비 모드 감지
      const mediaQuery = window.matchMedia('(prefers-contrast: high)');
      setIsHighContrast(mediaQuery.matches);
    };

    checkHighContrast();

    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    mediaQuery.addEventListener('change', checkHighContrast);

    return () => {
      mediaQuery.removeEventListener('change', checkHighContrast);
    };
  }, []);

  return isHighContrast;
}

// 애니메이션 감소 모드 감지
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const checkReducedMotion = () => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
    };

    checkReducedMotion();

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', checkReducedMotion);

    return () => {
      mediaQuery.removeEventListener('change', checkReducedMotion);
    };
  }, []);

  return prefersReducedMotion;
}
