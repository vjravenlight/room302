// SH4 web — FeniXVOID · Project Ravenlight
import { MOUSE, TOUCH } from "three";

import { OrbitControls } from "./OrbitControls.js";

class MapControls extends OrbitControls {
  constructor(object, domElement) {
    super(object, domElement);
    this.screenSpacePanning = false;
    this.mouseButtons = {
      LEFT: MOUSE.PAN,
      MIDDLE: MOUSE.DOLLY,
      RIGHT: MOUSE.ROTATE
    };
    this.touches = {
      ONE: TOUCH.PAN,
      TWO: TOUCH.DOLLY_ROTATE
    };
  }
}

export { MapControls };
