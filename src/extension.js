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

/* exported init */
const _handles = [];
const _timeouts = [];
const GLib = imports.gi.GLib;
const Meta = imports.gi.Meta;
const St = imports.gi.St;
const borders = [];
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Style = Me.imports.style.Style;

class Extension {
  constructor() {
  }

  remove_all_borders(){
    borders.forEach((_border, index, object)=>{
      if(_border && typeof _border.destroy !== "undefined") {
        _border.destroy();
        object.splice(index, 1);
      }
    });
  }

  remove_all_timeouts(){
    _timeouts.splice(0).forEach((t) => {
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
      styles.push(`.highlight-border {${ss.join(' ')}}`);
    }

    log(styles);

    // log(styles);
    this._style.build('custom', styles);
  }


  highlight_window(act){
    _timeouts.push(GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
      this.sizing = false;
      return GLib.SOURCE_CONTINUE;
    }));

    if(this.sizing){
      return;
    }
    let win = global.display.focus_window;
    if (win == null) {
      return;
    }
    if (win.window_type !== Meta.WindowType.NORMAL){
      return;
    }

    this.remove_all_borders();
    this.remove_all_timeouts();

    let wid = win.get_id();
    let border = new St.Bin({style_class: "highlight-border"});
    global.window_group.add_child(border);

    let rect = win.get_frame_rect();
    let inset = 2;

    border.set_size(rect.width + (inset * 2), rect.height + (inset * 2));
    border.set_position(rect.x - inset, rect.y - inset);
    border.show();
    borders.push(border);

    if(!this.disableHiding){
      _timeouts.push(GLib.timeout_add(GLib.PRIORITY_DEFAULT, this.hideDelay, () => {
        this.remove_all_borders();
        return GLib.SOURCE_CONTINUE;
      }));
    }
  }

  initSettings(){
    this.hideDelay = this._settings.get_int("hide-delay");
    this.borderWidth = this._settings.get_int("border-width");
    this.borderRadius = this._settings.get_int("border-radius");
    this.borderColor = this._settings.get_string("border-color");
    log(this.borderColor);
    log("hallo");
    this.disableHiding = this._settings.get_boolean("disable-hiding");
    this._updateCss();
  }

  enable() {

    _handles.push(global.display.connect('notify::focus-window', (_, act) => {this.highlight_window(act);}));
    _handles.push(global.window_manager.connect('size-change', () => {this.sizing = true;}));
    _handles.push(global.window_manager.connect('size-changed', () => {this.sizing = false;}));
    _handles.push(global.window_manager.connect('unminimize', () => {this.sizing = true;}));
    _handles.push(global.display.connect('grab-op-begin', () => {this.remove_all_borders();}));
    _handles.push(global.display.connect('grab-op-end', () => {this.remove_all_borders();}));

    this._settings = ExtensionUtils.getSettings();
    this._settings.connect("changed::disable-hiding", ()=>{this.initSettings();} );
    this._settings.connect("changed::hide-delay", ()=>{this.initSettings();} );
    this._settings.connect("changed::border-width", ()=>{this.initSettings();} );
    this._settings.connect("changed::border-radius", ()=>{this.initSettings();} );
    this._settings.connect("changed::border-color", ()=>{this.initSettings();} );
    this._settings.connect("changed::border-radius", ()=>{this.initSettings();} );
    this._style = new Style();
    this.initSettings();
  }

  disable() {
    _handles.splice(0).forEach(h => global.window_manager.disconnect(h));
    this.remove_all_timeouts();
    this.remove_all_borders();
    this.sizing = null;
    this._style.unloadAll();
    this._style = null;
  }
}

function init() {
  return new Extension();
}
