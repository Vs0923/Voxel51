/**
 * Copyright 2017-2021, Voxel51, Inc.
 */

import { BaseElement, StateUpdate } from "@fiftyone/utils";
import { NUM_ROWS_PER_SECTION } from "../constants";

import { DIRECTION, State } from "../state";
import tile from "../tile";

export class RequesterElement extends BaseElement<State> {
  private update: StateUpdate<State>;
  private requestingPages: Set<number> = new Set();

  createHTMLElement(update: StateUpdate<State>) {
    this.update = update;
    return null;
  }

  renderSelf({
    ctx,
    neededPages,
    pages,
    items,
    config: { get },
    options: { pageLength, count },
    direction,
    currentChunk,
  }: Readonly<State>) {
    console.log(neededPages);

    const needed = [...neededPages].filter(
      (page) => !pages.has(page) && !this.requestingPages.has(page)
    );

    if (needed.length === 0) {
      return null;
    }

    Promise.all(
      needed.map((page) => {
        this.requestingPages.add(page);
        return get(page, pageLength).then((data) => ({ page, data }));
      })
    ).then((results) => {
      this.update(
        ({
          pages,
          neededPages,
          ctx: currentCtx,
          chunks,
          options: { rowAspectRatioThreshold },
        }) => {
          if (ctx !== currentCtx) {
            return {};
          }

          results.forEach(({ page, data: { items: entries } }) => {
            this.requestingPages.delete(page);
            pages.add(page);
            neededPages.delete(page);

            entries.forEach((item, i) => {
              items[page * pageLength + i] = item;
            });

            const chunk = chunks[currentChunk];
            chunk.pages.add(page);

            if (direction === DIRECTION.DOWN) {
              const hasMore = page * pageLength + entries.length < count;
              const extra = chunk.bottomRemainder.items;
              let { remainder, rows } = tile(
                [...entries, ...extra],
                rowAspectRatioThreshold,
                hasMore
              );
              chunk.bottomRemainder.items = remainder;

              rows = [...chunk.bottomRemainder.rows, ...rows];
              let section = [];
              while (rows.length) {
                section.push(rows.shift());
                if (section.length === NUM_ROWS_PER_SECTION) {
                  chunk.sections.push();
                }
              }
            } else {
            }
          });

          return {
            pages,
            neededPages,
            items,
          };
        }
      );
      results;
    });

    return null;
  }
}
