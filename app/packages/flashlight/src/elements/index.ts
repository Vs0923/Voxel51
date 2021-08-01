/**
 * Copyright 2017-2021, Voxel51, Inc.
 */

import { createElementsTree, StateUpdate } from "@fiftyone/utils";

import { State } from "../state";
import { FlashlightElement } from "./flashlight";
import { GRID } from "./grid";
import { RequesterElement } from "./requester";
import { ResizeObserverElement } from "./resizeObserver";
import { ScrubberElement } from "./scrubber";

export type GetElements = (
  config: Readonly<State["config"]>,
  update: StateUpdate<State>,
  dispatchEvent: (eventType: string, details?: any) => void
) => FlashlightElement;

export const getFlashlightElements: GetElements = (
  config,
  update,
  dispatchEvent
) => {
  const elements = {
    node: FlashlightElement,
    children: [
      GRID,
      {
        node: ScrubberElement,
      },
      {
        node: ResizeObserverElement,
      },
      {
        node: RequesterElement,
      },
    ],
  };

  return createElementsTree<State, FlashlightElement>(
    config,
    elements,
    update,
    dispatchEvent
  );
};
