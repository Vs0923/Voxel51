/**
 * Copyright 2017-2021, Voxel51, Inc.
 */

import { BaseConfig, BaseOptions, BaseState, Optional } from "@fiftyone/utils";

export type Dimensions = [number, number | null];

export type BoundingBox = [number, number, number, number];

export type Optional<T> = {
  [P in keyof T]?: Optional<T[P]>;
};

export interface Section {
  getTop: () => number;
  getBottom: () => number;
  getHeight: () => number;
  index: number;
  itemIndex: number;
  set: (top: number, width: number) => void;
  show: (element: HTMLDivElement) => void;
  hide: () => void;
  isShown: () => boolean;
  getItems: () => ItemData[];
  resizeItems: (resizer: OnItemResize) => void;
}

export interface ItemData {
  id: string;
  aspectRatio: number;
}

export interface RowData {
  items: ItemData[];
  aspectRatio: number;
  extraMargins?: number;
}

export interface Response {
  items: ItemData[];
  page: number;
}

export type Get = (page: number, pageLength: number) => Promise<Response>;

export type ItemIndexMap = { [key: string]: number };

export type OnItemClick = (
  event: MouseEvent,
  id: string,
  itemIndexMap: ItemIndexMap
) => void;

export type Render = (
  id: string,
  element: HTMLDivElement,
  dimensions: [number, number]
) => (() => void) | void;

export type OnItemResize = (id: string, dimensions: [number, number]) => void;

export type OnResize = (width: number) => Optional<Options>;

export interface Config extends BaseConfig {
  get: Get;
  renderItem: Render;
  onItemClick?: OnItemClick;
  onItemResize?: OnItemResize;
  onResize?: OnResize;
}

export interface Options extends BaseOptions {
  count: number | null;
  index: number;
  rowAspectRatioThreshold: number;
  updater?: (id: string) => void;
  pageLength: number;
}

export interface Remainder {
  items: ItemData[];
  rows: RowData[];
}

export interface Chunk {
  pages: Set<number>;
  sections: RowData[][];
  topRemainder: Remainder;
  bottomRemainder: Remainder;
  count: number;
  height: number;
}

export enum DIRECTION {
  DOWN = "DOWN",
  UP = "UP",
}

export interface State extends BaseState {
  config: Config;
  options: Options;
  chunks: Chunk[];
  containerBoundingBox: BoundingBox;
  gridDimensions: Dimensions;
  loading: boolean;
  clean: Set<number>;
  itemIndexMap: ItemIndexMap;
  resized?: Set<number>;
  zooming: boolean;
  parent?: HTMLElement;
  top: number;
  velocity: number;
  direction: DIRECTION;
  currentChunk: number;
  index: number;
  scrubbing: boolean;
  neededPages: Set<number>;
  pages: Set<number>;
  items: {
    [key: number]: ItemData;
  };
  ctx: number;
  pivot: number;
  derived: {
    height: number;
  };
  lastScroll: number | null;
  acceleration: number;
}

export const DEFAULT_OPTIONS: Options = {
  count: null,
  rowAspectRatioThreshold: 5,
  index: 0,
  pageLength: 20,
};
