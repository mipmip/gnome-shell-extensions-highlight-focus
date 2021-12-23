/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */
const _handles = [];
const Mainloop = imports.mainloop;
const Meta = imports.gi.Meta;
const St = imports.gi.St;
const borders = [];

class Extension {
  constructor() {
  }

  remove_all_borders(){
    borders.forEach((_border, index, object)=>{
      _border.destroy();
      object.splice(index, 1);
    });
  }

  highlight_window(act){

    Mainloop.timeout_add(1000, () => {
      this.sizing = false;
    });

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

    let wid = win.get_id();
    let border = new St.Bin({style_class: "highlight-border"});
    borders.push(border);
    global.window_group.add_child(border);

    let rect = win.get_frame_rect();
    let inset = 2;

    border.set_size(rect.width + (inset * 2), rect.height + (inset * 2));
    border.set_position(rect.x - inset, rect.y - inset);
    border.show();

    Mainloop.timeout_add(1000, () => {
    });
    Mainloop.timeout_add(1000, () => {
      if(border){
        border.destroy();
      }
    });
  }

  enable() {
    _handles.push(global.display.connect('notify::focus-window', (_, act) => {this.highlight_window(act);}));
    _handles.push(global.window_manager.connect('size-change', () => {this.sizing = true;}));
    _handles.push(global.window_manager.connect('size-changed', () => {this.sizing = false;}));
    _handles.push(global.window_manager.connect('unminimize', () => {this.sizing = true; global.log('unminize');}));
    _handles.push(global.display.connect('grab-op-begin', () => {this.remove_all_borders();}));
    _handles.push(global.display.connect('grab-op-end', () => {this.remove_all_borders();}));
  }

  disable() {
    _handles.splice(0).forEach(h => global.window_manager.disconnect(h));
    this.remove_all_borders();
    this.sizing = null;
  }
}

function init() {
  return new Extension();
}
