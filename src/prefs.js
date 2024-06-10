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

import Gio from "gi://Gio";
//import Gdk from "gi://Gdk";
import Gtk from "gi://Gtk";
import Adw from "gi://Adw";
import { EntryRow } from "./ui.js";

import {
  ExtensionPreferences,
  gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

function cssHexString(css) {
  let rrggbb = "#";
  let start;
  for (let loop = 0; loop < 3; loop++) {
    let end = 0;
    let xx = "";
    for (let loop = 0; loop < 2; loop++) {
      while (true) {
        let x = css.slice(end, end + 1);
        if (x == "(" || x == "," || x == ")") break;
        end++;
      }
      if (loop == 0) {
        end++;
        start = end;
      }
    }
    xx = parseInt(css.slice(start, end)).toString(16);
    if (xx.length == 1) xx = "0" + xx;
    rrggbb += xx;
    css = css.slice(end);
  }
  return rrggbb;
}

export default class HightlightCurrentWindowPreferences extends ExtensionPreferences {
  create_spin_row(title, subtitle, min, max, step_increment, settings_id) {
    const row = new Adw.SpinRow({
      title: _(title),
      subtitle: _(subtitle),
    });
    row.set_range(min, max);
    row.get_adjustment().set_step_increment(step_increment);
    this.group.add(row);

    this.window._settings.bind(
      settings_id,
      row,
      "value",
      Gio.SettingsBindFlags.DEFAULT,
    );
  }

  fillPreferencesWindow(window) {
    window._settings = this.getSettings();
    const page = new Adw.PreferencesPage({
      title: _("General"),
      icon_name: "dialog-information-symbolic",
    });
    window.add(page);

    const group = new Adw.PreferencesGroup({
      title: _("Main Settings"),
      description: _("Configure general settings"),
    });
    page.add(group);

    this.window = window;
    this.group = group;

    const keybind_row = new EntryRow({
          title: "Pick keybind",
          settings: window._settings,
          bind: "keybinding-highlight-now",
          map: {
            from(settings, bind) {
              return settings.get_strv(bind).join(",");
            },
            to(settings, bind, value) {
              if (!!value) {
                const mappings = value.split(",").map((x) => {
                  const [, key, mods] = Gtk.accelerator_parse(x);
                  return Gtk.accelerator_valid(key, mods) && Gtk.accelerator_name(key, mods);
                });
                if (mappings.every((x) => !!x)) {
                  settings.set_strv(bind, mappings);
                }
              } else {
                // If value deleted, unset the mapping
                settings.set_strv(bind, []);
              }
            },
          },
        });
    group.add(keybind_row);


    const color_row = new Adw.EntryRow({
      title: _("Pick Color"),
    });
    const borderColorButton = new Gtk.ColorDialogButton;
    borderColorButton.set_dialog(new Gtk.ColorDialog());
    borderColorButton.set_valign("center");
    borderColorButton.set_hexpand(false);

    /* NOT SETTING COLOR seee: https://github.com/mipmip/gnome-shell-extensions-highlight-focus/issues/18
    console.log("highl",window._settings.get_string("border-color"));
    let color = new Gdk.RGBA()
    let parsedcolor = color.parse(window._settings.get_string("border-color"));
    console.log("highl2",parsedcolor);
    borderColorButton.set_rgba(parsedcolor);
    */

    color_row.add_suffix(borderColorButton);
    group.add(color_row);
    window._settings.bind(
      "border-color",
      color_row,
      "text",
      Gio.SettingsBindFlags.DEFAULT,
    );

    borderColorButton.connect("notify::rgba", (button) => {
      let rgba = button.get_rgba();
      let css = rgba.to_string();
      let hexString = cssHexString(css);
      window._settings.set_string("border-color", hexString);
    });

    this.create_spin_row(
      "Border Width",
      "Set border width",
      0,
      10,
      1,
      "border-width",
    );
    this.create_spin_row(
      "Border Radius",
      "Set border radius",
      0,
      30,
      1,
      "border-radius",
    );
    const row = new Adw.SwitchRow({
      title: _("Disable Hiding"),
      subtitle: _("Disable hiding border on focused window."),
    });
    group.add(row);

    window._settings.bind(
      "disable-hiding",
      row,
      "active",
      Gio.SettingsBindFlags.DEFAULT,
    );
    this.create_spin_row(
      "Hide Delay",
      "Delay in microseconds after when the border will be hidden",
      0,
      5000,
      100,
      "hide-delay",
    );
  }
}
