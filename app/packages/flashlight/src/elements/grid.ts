/**
 * Copyright 2017-2021, Voxel51, Inc.
 */

import { BaseElement, Events } from "@fiftyone/utils";

import { State } from "../state";

import { flashlightGridContainer, flashlightGrid } from "./grid.module.css";

export class GridContainerElement extends BaseElement<State> {
  createHTMLElement() {
    const container = document.createElement("div");
    container.classList.add(flashlightGridContainer);

    return container;
  }

  renderSelf(state: Readonly<State>) {
    return this.element;
  }
}

export class GridElement extends BaseElement<State> {
  private height: number;

  getEvents(): Events<State> {
    return {
      scroll: ({ update }) => {
        update({
          lastScroll: performance.now(),
        });
      },
    };
  }

  createHTMLElement() {
    const grid = document.createElement("div");
    grid.classList.add(flashlightGrid);

    return grid;
  }

  renderSelf({ derived: { height } }: Readonly<State>) {
    if (this.height !== height) {
      this.element.style.height = `${height}px`;
      this.height = height;
    }

    return this.element;
  }
}

export const GRID = {
  node: GridContainerElement,
  children: [
    {
      node: GridElement,
    },
  ],
};
