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

import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import GLib from "gi://GLib";
import Meta from "gi://Meta";
import Shell from "gi://Shell";
import St from "gi://St";
import { wm } from "resource:///org/gnome/shell/ui/main.js";
import { Style } from "./style.js";

export default class HightlightCurrentWindow extends Extension {
  constructor(metadata) {
    super(metadata);
    this.handles = [];
    this.timeouts = [];
    this.sizing = false;
    this.borders = [];
    this.borderWidth = "2";
    this.borderColor = "#000000";
    this.borderRadius = "14";
    this.style = null;
  }

  enable() {
    this._style = new Style();
    this.handles.push(
      global.display.connect(
        "notify::focus-window",
        this.highlight_window.bind(this),
      ),
    );

    this.handles.push(
      global.window_manager.connect("size-change", () => {
        this.remove_all_borders();
        this.sizing = true;
      }),
    );
    this.handles.push(
      global.window_manager.connect("size-changed", () => {
        this.sizing = false;
        this.highlight_window(null, null);
      }),
    );
    this.handles.push(
      global.window_manager.connect("unminimize", () => {
        this.sizing = true;
      }),
    );
    this.handles.push(
      global.display.connect("grab-op-begin", () => {
        this.remove_all_borders();
      }),
    );
    this.handles.push(
      global.display.connect("grab-op-end", () => {
        this.remove_all_borders();
        this.highlight_window(null, null);
      }),
    );

    this._settings = this.getSettings();
    this._settings.connect("changed::disable-hiding", () => {
      this.initSettings();
    });
    this._settings.connect("changed::hide-delay", () => {
      this.initSettings();
    });
    this._settings.connect("changed::border-width", () => {
      this.initSettings();
    });
    this._settings.connect("changed::border-radius", () => {
      this.initSettings();
    });
    this._settings.connect("changed::border-color", () => {
      this.initSettings();
    });
    this._settings.connect("changed::border-radius", () => {
      this.initSettings();
    });

    this.style = new Style();
    this.initSettings();

    const flag = Meta.KeyBindingFlags.IGNORE_AUTOREPEAT;
    const mode = Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW;
    wm.addKeybinding(
      "keybinding-highlight-now",
      this._settings,
      flag,
      mode,
      () => {
        this.highlight_window(null, null);
      },
    );
  }

  initSettings() {
    this.hideDelay = this._settings.get_int("hide-delay");
    this.borderWidth = this._settings.get_int("border-width");
    this.borderRadius = this._settings.get_int("border-radius");
    this.borderColor = this._settings.get_string("border-color");
    this.disableHiding = this._settings.get_boolean("disable-hiding");
    this._updateCss();
  }

  disable() {
    this.handles.splice(0).forEach((h) => global.window_manager.disconnect(h));
    this.remove_all_timeouts();
    this.remove_all_borders();
    this.sizing = null;
    this._style.unloadAll();
    this._style = null;
    wm.removeKeybinding("keybinding-highlight-now");
  }

  remove_all_borders() {
    this.borders.forEach((_border, index, object) => {
      if (_border && typeof _border.destroy !== "undefined") {
        _border.destroy();
        object.splice(index, 1);
      }
    });
  }

  remove_all_timeouts() {
    this.timeouts.splice(0).forEach((t) => {
      if (t) {
        GLib.Source.remove(t);
        t = null;
      }
    });
  }

  _updateCss() {
    let styles = [];
    {
      let ss = [];

      ss.push(`\n  border: ${this.borderWidth}px solid ${this.borderColor};`);
      ss.push(`\n  border-radius: ${this.borderRadius}px;`);
      styles.push(`.highlight-border {${ss.join(" ")}}`);
    }

    this._style.build("custom-highlight-focus", styles);
  }

  highlight_window(emitter, acct) {
    this.timeouts.push(
      GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
        this.sizing = false;
        return GLib.SOURCE_CONTINUE;
      }),
    );
    if (this.sizing) {
      console.error(`${sizing}`);
      return;
    }

    this.remove_all_borders();
    this.remove_all_timeouts();

    const win = global.display.focus_window;
    if (
      win == null ||
      win.window_type !== Meta.WindowType.NORMAL ||
      (win.maximized_horizontally && win.maximized_vertically)
    ) {
      console.error(`${win}`);
      return;
    }

    const wid = win.get_id();
    const border = new St.Bin({ style_class: "highlight-border" });
    global.window_group.add_child(border);
    let rect = win.get_frame_rect();
    let inset = 2;

    border.set_size(rect.width + inset * 2, rect.height + inset * 2);
    border.set_position(rect.x - inset, rect.y - inset);
    border.show();
    this.borders.push(border);

    if (!this.disableHiding) {
      this.timeouts.push(
        GLib.timeout_add(GLib.PRIORITY_DEFAULT, this.hideDelay, () => {
          this.remove_all_borders();
          return GLib.SOURCE_CONTINUE;
        }),
      );
    }
  }
}
