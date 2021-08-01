/**
 * Copyright 2017-2021, Voxel51, Inc.
 */

import { mergeUpdates, StateUpdate } from "@fiftyone/utils";

import { MARGIN, SCRUBBER_WIDTH } from "./constants";
import { FlashlightElement } from "./elements/flashlight";
import { getFlashlightElements } from "./elements";
import {
  Config,
  DEFAULT_OPTIONS,
  DIRECTION,
  Optional,
  Options,
  State,
} from "./state";

export interface FlashlightOptions extends Optional<Options> {}

export default class Flashlight {
  private eventTarget: EventTarget = new EventTarget();
  private flashlight: FlashlightElement;
  private state: State;
  private updater: StateUpdate<State>;

  constructor(config: Config, options: Optional<Options>) {
    this.state = this.getEmptyState(config, options);
    this.updater = this.makeUpdater();
    this.flashlight = getFlashlightElements(
      config,
      this.updater,
      this.dispatchEvent
    );
  }

  private dispatchEvent(eventType: string, detail: any): void {
    this.eventTarget.dispatchEvent(new CustomEvent(eventType, { detail }));
  }

  private makeUpdater(): StateUpdate<State> {
    return (stateOrUpdater) => {
      const updates =
        stateOrUpdater instanceof Function
          ? stateOrUpdater(this.state)
          : stateOrUpdater;
      if (Object.keys(updates).length === 0) {
        return;
      }

      this.state = mergeUpdates(this.state, updates);
      this.state.derived.height = this.height;
      console.log(this.height);

      this.flashlight.render(this.state);
    };
  }

  get attached() {
    return Boolean(this.flashlight.element.parentElement);
  }

  private get height(): number {
    const knownHeight = this.state.chunks.reduce(
      (acc, { height }) => acc + height,
      0
    );

    return (
      knownHeight +
      (this.numPages - this.state.pages.size) * this.unknownPageHeight
    );
  }

  private get numPages(): number | null {
    if (this.state.options.count === null) {
      return null;
    }

    return Math.ceil(this.state.options.count / this.state.options.pageLength);
  }

  private get unknownPageHeight(): number {
    const squares = Math.max(
      Math.floor(this.state.options.rowAspectRatioThreshold),
      1
    );

    const rowHeight =
      (this.state.gridDimensions[0] - (squares - 1) * MARGIN) / squares;

    const numRows = Math.max(
      1,
      Math.ceil(this.state.options.pageLength / squares)
    );

    return (rowHeight + MARGIN) * numRows;
  }

  addEventListener(
    eventType: string,
    handler: EventListenerOrEventListenerObject | null,
    ...args: any[]
  ) {
    this.eventTarget.addEventListener(eventType, handler, ...args);
  }

  removeEventListener(
    eventType: string,
    handler: EventListenerOrEventListenerObject | null,
    ...args: any[]
  ) {
    this.eventTarget.removeEventListener(eventType, handler, ...args);
  }

  reset() {
    this.updater(this.getEmptyState(this.state.config, this.state.options));
  }

  attach(element: HTMLElement | string): void {
    if (typeof element === "string") {
      element = document.getElementById(element);
    }

    if (element === this.flashlight.element.parentElement) {
      return;
    }

    const { width, height, top, left } = element.getBoundingClientRect();

    this.flashlight.element.parentElement &&
      this.flashlight.element.parentElement.removeChild(
        this.flashlight.element
      );

    element.appendChild(this.flashlight.element);

    this.updater({
      gridDimensions: [width - SCRUBBER_WIDTH, null],
      containerBoundingBox: [left, top, width, height],
      parent: element,
    });
  }

  updateOptions(options: Optional<Options>) {
    if (
      typeof options.count === "number" &&
      typeof this.state.options.count === "number"
    ) {
      if (options.count !== this.state.options.count) {
        this.reset();
      }
    } else if (typeof options.count === "number") {
      if (options.count > 0) {
        this.state.neededPages.add(0);
      }
    }

    this.updater({ options });
  }

  private getEmptyState(config: Config, options: Optional<Options>): State {
    return {
      ctx: 0,
      config,
      options: { ...DEFAULT_OPTIONS, ...options },
      zooming: false,
      loading: true,
      containerBoundingBox: [0, 0, 0, 0],
      gridDimensions: [0, 0],
      items: {},
      clean: new Set(),
      resized: null,
      itemIndexMap: {},
      chunks: [
        {
          count: 0,
          pages: new Set(),
          sections: [],
          topRemainder: { items: [], rows: [] },
          bottomRemainder: { items: [], rows: [] },
          height: 0,
        },
      ],
      parent: null,
      top: 0,
      velocity: 0,
      direction: DIRECTION.DOWN,
      index: 0,
      currentChunk: 0,
      scrubbing: false,
      neededPages: new Set(),
      pages: new Set(),
      pivot: 0,
      derived: {
        height: 0,
      },
      lastScroll: null,
      acceleration: 0,
    };
  }
}
