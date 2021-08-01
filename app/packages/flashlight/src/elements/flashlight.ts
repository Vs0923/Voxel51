/**
 * Copyright 2017-2021, Voxel51, Inc.
 */
import { BaseElement, Events } from "@fiftyone/utils";

import { State } from "../state";

import { flashlight, flashlightPixels } from "./flashlight.module.css";

export class FlashlightElement extends BaseElement<State> {
  private showingPixels: boolean;

  getEvents(): Events<State> {
    return {
      mousemove: ({ update, event }) => {
        update(
          ({
            scrubbing,
            options: { count },
            currentChunk,
            chunks,
            containerBoundingBox: [_, containerTop, __, containerHeight],
          }) => {
            if (count === null) {
              count = chunks[currentChunk].count;
            }
            const top = event.clientY - containerTop;
            if (scrubbing) {
              return { index: Math.round((top / containerHeight) * count) };
            }

            return {};
          }
        );
      },
      mouseup: ({ update }) => {
        update({ scrubbing: false });
      },
      mouseleave: ({ update }) => {
        update({ scrubbing: false });
      },
    };
  }

  createHTMLElement() {
    const element = document.createElement("div");
    element.classList.add(flashlight);

    return element;
  }

  renderSelf({ loading, zooming }: Readonly<State>) {
    if (loading || zooming !== this.showingPixels) {
      this.showingPixels = loading || zooming;
      this.showingPixels
        ? this.element.classList.add(flashlightPixels)
        : this.element.classList.remove(flashlightPixels);
    }

    return this.element;
  }
}
