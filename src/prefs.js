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

const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const UI = Me.imports.ui;

/**
 * prefs initiation
 *
 * @returns {void}
 */
function init() {
}

function cssHexString(css) {
    let rrggbb = '#';
    let start;
    for (let loop = 0; loop < 3; loop++) {
        let end = 0;
        let xx = '';
        for (let loop = 0; loop < 2; loop++) {
            while (true) {
                let x = css.slice(end, end + 1);
                if ((x == '(') || (x == ',') || (x == ')'))
                    break;
                end++;
            }
            if (loop == 0) {
                end++;
                start = end;
            }
        }
        xx = parseInt(css.slice(start, end)).toString(16);
        if (xx.length == 1)
            xx = '0' + xx;
        rrggbb += xx;
        css = css.slice(end);
    }
    return rrggbb;
}

/**
 * Builds the preferences widget
 */
/* exported buildPrefsWidget */
function buildPrefsWidget() {
  let widget = new HighlightFocusPrefsWidget();
  return widget;
}


/**
 * Describes the widget that is shown in the extension settings section of
 * GNOME tweek.
 */
const HighlightFocusPrefsWidget = new GObject.Class({
  Name: 'Shortcuts.Prefs.Widget',
  GTypeName: 'HighlightFocusPrefsWidget',
  Extends: Gtk.ScrolledWindow,

  /**
   * Initalises the widget
   */
  _init: function() {
    this.parent(
      {
        valign: Gtk.Align.FILL,
        vexpand: true
      }
    );

    this._settings = ExtensionUtils.getSettings();

    this.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC);

    this._grid = new UI.ListGrid();

    this.set_child(new UI.Frame(this._grid));

    let mainSettingsLabel = new UI.LargeLabel("Main Settings");
    this._grid._add(mainSettingsLabel)


    this._borderColorButton = new Gtk.ColorButton;
    this._borderColorButton.set_valign("center");
    this._borderColorButton.set_hexpand(false);

    let label_border_color = new UI.Label('Border Color')
    this._grid._add(label_border_color, this._borderColorButton);

    this._settings.bind("border-color", this._borderColorButton, "value", Gio.SettingsBindFlags.DEFAULT);

    let rgba = new Gdk.RGBA();
    rgba.parse(this._settings.get_string('border-color'));
    this._borderColorButton.set_rgba(rgba);

    this._borderColorButton.connect('color-set', (button) => {
      let rgba = button.get_rgba();
      let css = rgba.to_string();
      let hexString = cssHexString(css);
      this._settings.set_string('border-color', hexString);
    });


    this._spin = new Gtk.SpinButton;
    this._spin.set_range(0, 10);
    this._spin.set_increments(1, 1);


    let label_border_width = new UI.Label('Border Width')
    this._grid._add(label_border_width, this._spin);
    this._settings.bind("border-width", this._spin, "value", Gio.SettingsBindFlags.DEFAULT);

    this._spinRad = new Gtk.SpinButton;
    this._spinRad.set_range(0, 20);
    this._spinRad.set_increments(1, 1);

    let label_border_rad = new UI.Label('Border Radius')
    this._grid._add(label_border_rad, this._spinRad);
    this._settings.bind("border-radius", this._spinRad, "value", Gio.SettingsBindFlags.DEFAULT);

    this._spinDelay = new Gtk.SpinButton;
    this._spinDelay.set_range(0, 10000);
    this._spinDelay.set_increments(100, 100);

    let label_delay = new UI.Label('Hide delay in microseconds')
    this._grid._add(label_delay, this._spinDelay);

    this._settings.bind("hide-delay", this._spinDelay, "value", Gio.SettingsBindFlags.DEFAULT);

    let disableHiding = new UI.Check("Disable border hiding");
    this._settings.bind('disable-hiding', disableHiding, 'active', Gio.SettingsBindFlags.DEFAULT);
    this._grid._add(disableHiding);
  }
});
