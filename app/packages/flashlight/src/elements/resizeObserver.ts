/**
 * Copyright 2017-2021, Voxel51, Inc.
 */

import { BaseElement, StateUpdate } from "@fiftyone/utils";

import { State } from "../state";

export class ResizeObserverElement extends BaseElement<State> {
  private observer: ResizeObserver;
  private parent: HTMLElement;

  createHTMLElement(update: StateUpdate<State>) {
    this.observer = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        const {
          width,
          height,
          top,
          left,
        } = this.parent.getBoundingClientRect();
        update(({ gridDimensions, containerBoundingBox }) => {
          const newBox = [left, top, width, height];
          if (newBox.every((e, i) => e === containerBoundingBox[i])) {
            return {};
          }

          return {
            gridDimensions:
              gridDimensions[0] !== width ? [width, null] : gridDimensions,
            containerBoundingBox: [left, top, width, height],
          };
        });
      });
    });

    return null;
  }

  renderSelf({ parent }: Readonly<State>) {
    if (this.parent !== parent) {
      this.parent && this.observer.unobserve(this.parent);
      this.observer.observe(parent);
      this.parent = parent;
    }

    return null;
  }
}
