/**
 * Copyright 2017-2021, Voxel51, Inc.
 */
import { mergeWith } from "immutable";

export type DispatchEvent = (eventType: string, details?: any) => void;

export interface BaseConfig {}

export interface BaseOptions {}

export interface BaseState {
  config: BaseConfig;
  options: BaseOptions;
}

export type ElementEvent<State extends BaseState, E extends Event> = (args: {
  event: E;
  update: StateUpdate<State>;
  dispatchEvent: DispatchEvent;
}) => void;

export type Optional<T> = {
  [P in keyof T]?: Optional<T[P]>;
};

export type StateUpdate<State> = (
  stateOrUpdater:
    | Optional<State>
    | ((state: Readonly<State>) => Optional<State>)
) => void;

export type Events<State extends BaseState> = {
  [K in keyof HTMLElementEventMap]?: ElementEvent<
    State,
    HTMLElementEventMap[K]
  >;
};

type LoadedEvents = {
  [K in keyof HTMLElementEventMap]?: HTMLElementEventMap[K];
};

export abstract class BaseElement<
  State extends BaseState,
  Element extends HTMLElement = HTMLElement | null
> {
  children: BaseElement<State>[] = [];
  element: Element;
  protected events: LoadedEvents = {};

  constructor(
    config: Readonly<State["config"]>,
    update: StateUpdate<State>,
    dispatchEvent: (eventType: string, details?: any) => void
  ) {
    if (!this.isShown(config)) {
      return;
    }

    this.element = this.createHTMLElement(update, dispatchEvent);

    for (const [eventType, handler] of Object.entries(this.getEvents())) {
      this.events[eventType] = (event) =>
        handler({ event, update, dispatchEvent });
      this.element &&
        this.element.addEventListener(eventType, this.events[eventType], {
          passive: eventType === "wheel",
        });
    }
  }
  applyChildren(children: BaseElement<State>[]) {
    this.children = children || [];
  }

  isShown(config: Readonly<State["config"]>): boolean {
    return true;
  }

  render(state: Readonly<State>): Element | null {
    const self = this.renderSelf(state);

    this.children.forEach((child) => {
      if (!child.isShown(state.config)) {
        return;
      }

      const element = child.render(state);
      if (!element || element.parentNode === this.element) {
        return;
      }
      self && self.appendChild(element);
    });

    return self;
  }

  abstract createHTMLElement(
    update: StateUpdate<State>,
    dispatchEvent: (eventType: string, details?: any) => void
  ): Element | null;

  abstract renderSelf(state: Readonly<State>): Element | null;

  protected getEvents(): Events<State> {
    return {};
  }

  protected removeEvents() {
    for (const [eventType, handler] of Object.entries(this.events)) {
      // @ts-ignore
      this.element.removeEventListener(eventType, handler);
    }
  }

  protected attachEvents() {
    for (const [eventType, handler] of Object.entries(this.events)) {
      // @ts-ignore
      this.element.addEventListener(eventType, handler);
    }
  }
}

type ElementConstructor<
  State extends BaseState,
  Element extends BaseElement<State>
> = new (
  config: Readonly<State["config"]>,
  update: StateUpdate<State>,
  dispatchEvent: DispatchEvent,
  children?: BaseElement<State>[]
) => Element;

interface ElementsTemplate<
  State extends BaseState,
  Element extends BaseElement<State> = BaseElement<State>
> {
  node: ElementConstructor<State, Element>;
  children?: ElementsTemplate<State>[];
}

export function createElementsTree<
  State extends BaseState,
  Element extends BaseElement<State> = BaseElement<State>
>(
  config: Readonly<State["config"]>,
  root: ElementsTemplate<State, Element>,
  update: StateUpdate<State>,
  dispatchEvent: (eventType: string, details?: any) => void
): Element {
  const element = new root.node(config, update, dispatchEvent);

  if (!element.isShown(config)) {
    return element;
  }

  let children = new Array<BaseElement<State>>();
  children = root.children
    ? root.children.map((child) =>
        createElementsTree<State>(config, child, update, dispatchEvent)
      )
    : children;

  element.applyChildren(children);

  return element;
}

export function withEvents<
  State extends BaseState,
  Element extends BaseElement<State>
>(
  Base: ElementConstructor<State, Element>,
  addEvents: () => Events<State>
): ElementConstructor<State, Element> {
  // @ts-ignore
  class WithElement<State> extends Base {
    getEvents() {
      const newEvents = super.getEvents();
      const events = addEvents();

      Object.entries(events).forEach(([eventType, handler]) => {
        // @ts-ignore
        const parentHandler = newEvents[eventType];
        // @ts-ignore
        newEvents[eventType] = (args) => {
          parentHandler && parentHandler(args);
          handler && handler(args);
        };
      });
      return newEvents;
    }
  }

  // @ts-ignore
  return WithElement;
}

export const mergeUpdates = <State extends BaseState>(
  state: State,
  updates: Optional<State>
): State => {
  const merger = (o, n) => {
    if (Array.isArray(n)) {
      return n;
    }
    if (n instanceof Set) {
      return n;
    }

    if (n instanceof Function) {
      return n;
    }

    if (n instanceof HTMLElement) {
      return n;
    }

    if (typeof n !== "object") {
      return n === undefined ? o : n;
    }
    if (n === null) {
      return n;
    }
    return mergeWith(merger, o, n);
  };
  return mergeWith(merger, state, updates);
};
