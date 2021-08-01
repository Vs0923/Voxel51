/**
 * Copyright 2017-2021, Voxel51, Inc.
 */

import { BaseElement, Events } from "@fiftyone/utils";
import { SCRUBBER_WIDTH } from "../constants";

import { State } from "../state";

import {
  flashlightBar,
  flashlightScrubber,
  flashlightScrubberDisabled,
  flashlightPeek,
} from "./scrubber.module.css";

export class ScrubberElement extends BaseElement<State> {
  private top: number;
  private disabled: boolean;
  private bar: HTMLDivElement;
  private peek: HTMLDivElement;

  getEvents(): Events<State> {
    return {
      mousemove: ({ update, event }) => {
        update(
          ({
            options: { count },
            currentChunk,
            chunks,
            scrubbing,
            containerBoundingBox: [_, containerTop, __, containerHeight],
          }) => {
            if (count === null) {
              count = chunks[currentChunk].count;
            }
            const top = event.clientY - containerTop;

            this.peek.style.setProperty("--peek", `${top.toFixed(3)}px`);

            if (scrubbing) {
              return {
                index: Math.round((top / containerHeight) * count),
                scrubbing: true,
              };
            }
            return {};
          }
        );
      },
      mousedown: ({ update, event }) => {
        update(
          ({
            options: { count },
            currentChunk,
            chunks,
            containerBoundingBox: [_, containerTop, __, containerHeight],
          }) => {
            if (count === null) {
              count = chunks[currentChunk].count;
            }
            const disabled = !Boolean(count);

            if (disabled) {
              return {};
            }
            const top = event.clientY - containerTop;

            return {
              index: Math.round((top / containerHeight) * count),
              scrubbing: true,
            };
          }
        );
      },
      mouseup: ({ update }) => {
        update({ scrubbing: false });
      },
    };
  }

  createHTMLElement() {
    const element = document.createElement("div");
    element.classList.add(flashlightScrubber);
    element.style.width = `${SCRUBBER_WIDTH}px`;

    const bar = document.createElement("div");
    bar.classList.add(flashlightBar);
    this.bar = bar;

    element.appendChild(bar);

    const peek = document.createElement("div");
    peek.classList.add(flashlightPeek);
    this.peek = peek;

    element.appendChild(peek);

    return element;
  }

  renderSelf({
    options: { count },
    currentChunk,
    chunks,
    index,
    containerBoundingBox: [_, __, ___, containerHeight],
  }: Readonly<State>) {
    if (count === null) {
      count = chunks[currentChunk].count;
    }
    const disabled = !Boolean(count);

    if (disabled !== this.disabled) {
      this.disabled = disabled;
      disabled
        ? this.element.classList.add(flashlightScrubberDisabled)
        : this.element.classList.remove(flashlightScrubberDisabled);
    }

    if (disabled) {
      return this.element;
    }
    const top = (index / count) * containerHeight;

    if (this.top !== top) {
      this.bar.style.setProperty("--progress", `${top.toFixed(3)}px`);

      this.top = top;
    }

    return this.element;
  }
}
