/*********************************************************************
 * Highlight Focus is Copyright (C) 2021-2024 Pim Snel
 *
 * Highlight Focus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation
 *
 * Highlight Focus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Highlight Focus.  If not, see <http://www.gnu.org/licenses/>.
 **********************************************************************/

import St from "gi://St";
import Gio from "gi://Gio";

export class Style {
  constructor() {
    this.styles = {};
    this.style_contents = {};
  }

  unloadAll() {
    let ctx = St.ThemeContext.get_for_stage(global.stage);
    let theme = ctx.get_theme();
    Object.keys(this.styles).forEach((k) => {
      let fn = this.styles[k];
      theme.unload_stylesheet(fn);
    });
  }

  build(name, style_array) {
    let fn = this.styles[name];
    let ctx = St.ThemeContext.get_for_stage(global.stage);
    let theme = ctx.get_theme();

    let content = "";
    style_array.forEach((k) => {
      content = `${content}\n${k}`;
    });

    if (this.style_contents[name] === content) {
      return;
    }

    if (fn) {
      theme.unload_stylesheet(fn);
    } else {
      fn = Gio.File.new_for_path(`/tmp/${name}.css`);
      this.styles[name] = fn;
    }

    this.style_contents[name] = content;
    const [, etag] = fn.replace_contents(
      content,
      null,
      false,
      Gio.FileCreateFlags.REPLACE_DESTINATION,
      null,
    );

    theme.load_stylesheet(fn);
  }

  rgba(color) {
    let clr = color || [1, 1, 1, 1];
    let res = clr.map((r) => Math.floor(255 * r));
    res[3] = clr[3].toFixed(1);
    return res.join(",");
  }
}
