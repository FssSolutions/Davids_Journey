// TouchInput.js — shared mutable state for virtual joystick
// UIScene writes; game scenes read in update()

export const touchInput = {
  vx: 0,
  vy: 0,
  actionPressed: false,
};
