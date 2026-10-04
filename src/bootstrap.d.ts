declare namespace bootstrap {
  interface PopoverOptions {
    content?: string | Element;
    title?: string;
    html?: boolean;
    placement?: 'auto' | 'top' | 'bottom' | 'left' | 'right';
    trigger?: string;
  }

  interface TooltipOptions {
    title?: string | ((element: Element) => string);
    placement?: 'auto' | 'top' | 'bottom' | 'left' | 'right';
    trigger?: string;
  }

  class Popover {
    constructor(element: Element, options?: PopoverOptions);
    static getInstance(element: Element): Popover | null;
    static getOrCreateInstance(element: Element, options?: PopoverOptions): Popover;
    show(): void;
    hide(): void;
    toggle(): void;
    dispose(): void;
  }

  class Tooltip {
    constructor(element: Element, options?: TooltipOptions);
    static getInstance(element: Element): Tooltip | null;
    show(): void;
    hide(): void;
    dispose(): void;
  }
}
