/*********************************************************************
 * Highlight Focus is Copyright (C) 2021-2023 Pim Snel
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

import Gtk from "gi://Gtk";
import Adw from "gi://Adw";
import GObject from "gi://GObject";
import { gettext as _ } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

export class ResetButton extends Gtk.Button {
  static {
    GObject.registerClass(this);
  }

  constructor({ settings = undefined, bind = undefined, onReset }) {
    super({
      icon_name: "edit-clear-symbolic",
      tooltip_text: _("Reset"),
      valign: Gtk.Align.CENTER,
    });
    this.connect("clicked", () => {
      settings?.reset(bind);
      onReset?.();
    });
  }
}

export class EntryRow extends Adw.EntryRow {
  static {
    GObject.registerClass(this);
  }

  constructor({ title, settings, bind, map }) {
    super({ title });
    this.connect("changed", () => {
      const text = this.get_text();
      if (typeof text === "string")
        if (map) {
          map.to(settings, bind, text);
        } else {
          settings.set_string(bind, text);
        }
    });
    const current = map ? map.from(settings, bind) : settings.get_string(bind);
    this.set_text(current ?? "");
    this.add_suffix(
      new ResetButton({
        settings,
        bind,
        onReset: () => {
          this.set_text(
            (map ? map.from(settings, bind) : settings.get_string(bind)) ?? "",
          );
        },
      }),
    );
  }
}
