// SH4 web — FeniXVOID · Project Ravenlight
import { Controls, GridHelper, EllipseCurve, BufferGeometry, Line, LineBasicMaterial, Raycaster, Group, Box3, Sphere, Quaternion, Vector2, Vector3, Matrix4, MathUtils } from "three";

const STATE = {
  IDLE: Symbol(),
  ROTATE: Symbol(),
  PAN: Symbol(),
  SCALE: Symbol(),
  FOV: Symbol(),
  FOCUS: Symbol(),
  ZROTATE: Symbol(),
  TOUCH_MULTI: Symbol(),
  ANIMATION_FOCUS: Symbol(),
  ANIMATION_ROTATE: Symbol()
};

const INPUT = {
  NONE: Symbol(),
  ONE_FINGER: Symbol(),
  ONE_FINGER_SWITCHED: Symbol(),
  TWO_FINGER: Symbol(),
  MULT_FINGER: Symbol(),
  CURSOR: Symbol()
};

const _center = {
  x: 0,
  y: 0
};

const _transformation = {
  camera: new Matrix4,
  gizmos: new Matrix4
};

const _changeEvent = {
  type: "change"
};

const _startEvent = {
  type: "start"
};

const _endEvent = {
  type: "end"
};

const _raycaster = new Raycaster;

const _offset = new Vector3;

const _gizmoMatrixStateTemp = new Matrix4;

const _cameraMatrixStateTemp = new Matrix4;

const _scalePointTemp = new Vector3;

class ArcballControls extends Controls {
  constructor(camera, domElement = null, scene = null) {
    super(camera, domElement);
    this.scene = scene;
    this.target = new Vector3;
    this._currentTarget = new Vector3;
    this.radiusFactor = .67;
    this.mouseActions = [];
    this._mouseOp = null;
    this._v2_1 = new Vector2;
    this._v3_1 = new Vector3;
    this._v3_2 = new Vector3;
    this._m4_1 = new Matrix4;
    this._m4_2 = new Matrix4;
    this._quat = new Quaternion;
    this._translationMatrix = new Matrix4;
    this._rotationMatrix = new Matrix4;
    this._scaleMatrix = new Matrix4;
    this._rotationAxis = new Vector3;
    this._cameraMatrixState = new Matrix4;
    this._cameraProjectionState = new Matrix4;
    this._fovState = 1;
    this._upState = new Vector3;
    this._zoomState = 1;
    this._nearPos = 0;
    this._farPos = 0;
    this._gizmoMatrixState = new Matrix4;
    this._up0 = new Vector3;
    this._zoom0 = 1;
    this._fov0 = 0;
    this._initialNear = 0;
    this._nearPos0 = 0;
    this._initialFar = 0;
    this._farPos0 = 0;
    this._cameraMatrixState0 = new Matrix4;
    this._gizmoMatrixState0 = new Matrix4;
    this._button = -1;
    this._touchStart = [];
    this._touchCurrent = [];
    this._input = INPUT.NONE;
    this._switchSensibility = 32;
    this._startFingerDistance = 0;
    this._currentFingerDistance = 0;
    this._startFingerRotation = 0;
    this._currentFingerRotation = 0;
    this._devPxRatio = 0;
    this._downValid = true;
    this._nclicks = 0;
    this._downEvents = [];
    this._downStart = 0;
    this._clickStart = 0;
    this._maxDownTime = 250;
    this._maxInterval = 300;
    this._posThreshold = 24;
    this._movementThreshold = 24;
    this._currentCursorPosition = new Vector3;
    this._startCursorPosition = new Vector3;
    this._grid = null;
    this._gridPosition = new Vector3;
    this._gizmos = new Group;
    this._curvePts = 128;
    this._timeStart = -1;
    this._animationId = -1;
    this.focusAnimationTime = 500;
    this._timePrev = 0;
    this._timeCurrent = 0;
    this._anglePrev = 0;
    this._angleCurrent = 0;
    this._cursorPosPrev = new Vector3;
    this._cursorPosCurr = new Vector3;
    this._wPrev = 0;
    this._wCurr = 0;
    this.adjustNearFar = false;
    this.scaleFactor = 1.1;
    this.dampingFactor = 25;
    this.wMax = 20;
    this.enableAnimations = true;
    this.enableGrid = false;
    this.cursorZoom = false;
    this.minFov = 5;
    this.maxFov = 90;
    this.rotateSpeed = 1;
    this.enablePan = true;
    this.enableRotate = true;
    this.enableZoom = true;
    this.enableGizmos = true;
    this.minDistance = 0;
    this.maxDistance = Infinity;
    this.minZoom = 0;
    this.maxZoom = Infinity;
    this._tbRadius = 1;
    this._state = STATE.IDLE;
    this.setCamera(camera);
    if (this.scene != null) {
      this.scene.add(this._gizmos);
    }
    this.initializeMouseActions();
    this._onContextMenu = onContextMenu.bind(this);
    this._onWheel = onWheel.bind(this);
    this._onPointerUp = onPointerUp.bind(this);
    this._onPointerMove = onPointerMove.bind(this);
    this._onPointerDown = onPointerDown.bind(this);
    this._onPointerCancel = onPointerCancel.bind(this);
    this._onWindowResize = onWindowResize.bind(this);
    if (domElement !== null) {
      this.connect();
    }
  }
  connect() {
    this.domElement.style.touchAction = "none";
    this._devPxRatio = window.devicePixelRatio;
    this.domElement.addEventListener("contextmenu", this._onContextMenu);
    this.domElement.addEventListener("wheel", this._onWheel);
    this.domElement.addEventListener("pointerdown", this._onPointerDown);
    this.domElement.addEventListener("pointercancel", this._onPointerCancel);
    window.addEventListener("resize", this._onWindowResize);
  }
  disconnect() {
    this.domElement.removeEventListener("pointerdown", this._onPointerDown);
    this.domElement.removeEventListener("pointercancel", this._onPointerCancel);
    this.domElement.removeEventListener("wheel", this._onWheel);
    this.domElement.removeEventListener("contextmenu", this._onContextMenu);
    window.removeEventListener("pointermove", this._onPointerMove);
    window.removeEventListener("pointerup", this._onPointerUp);
    window.removeEventListener("resize", this._onWindowResize);
  }
  onSinglePanStart(event, operation) {
    if (this.enabled) {
      this.dispatchEvent(_startEvent);
      this.setCenter(event.clientX, event.clientY);
      switch (operation) {
       case "PAN":
        if (!this.enablePan) {
          return;
        }
        if (this._animationId != -1) {
          cancelAnimationFrame(this._animationId);
          this._animationId = -1;
          this._timeStart = -1;
          this.activateGizmos(false);
          this.dispatchEvent(_changeEvent);
        }
        this.updateTbState(STATE.PAN, true);
        this._startCursorPosition.copy(this.unprojectOnTbPlane(this.object, _center.x, _center.y, this.domElement));
        if (this.enableGrid) {
          this.drawGrid();
          this.dispatchEvent(_changeEvent);
        }
        break;

       case "ROTATE":
        if (!this.enableRotate) {
          return;
        }
        if (this._animationId != -1) {
          cancelAnimationFrame(this._animationId);
          this._animationId = -1;
          this._timeStart = -1;
        }
        this.updateTbState(STATE.ROTATE, true);
        this._startCursorPosition.copy(this.unprojectOnTbSurface(this.object, _center.x, _center.y, this.domElement, this._tbRadius));
        this.activateGizmos(true);
        if (this.enableAnimations) {
          this._timePrev = this._timeCurrent = performance.now();
          this._angleCurrent = this._anglePrev = 0;
          this._cursorPosPrev.copy(this._startCursorPosition);
          this._cursorPosCurr.copy(this._cursorPosPrev);
          this._wCurr = 0;
          this._wPrev = this._wCurr;
        }
        this.dispatchEvent(_changeEvent);
        break;

       case "FOV":
        if (!this.object.isPerspectiveCamera || !this.enableZoom) {
          return;
        }
        if (this._animationId != -1) {
          cancelAnimationFrame(this._animationId);
          this._animationId = -1;
          this._timeStart = -1;
          this.activateGizmos(false);
          this.dispatchEvent(_changeEvent);
        }
        this.updateTbState(STATE.FOV, true);
        this._startCursorPosition.setY(this.getCursorNDC(_center.x, _center.y, this.domElement).y * .5);
        this._currentCursorPosition.copy(this._startCursorPosition);
        break;

       case "ZOOM":
        if (!this.enableZoom) {
          return;
        }
        if (this._animationId != -1) {
          cancelAnimationFrame(this._animationId);
          this._animationId = -1;
          this._timeStart = -1;
          this.activateGizmos(false);
          this.dispatchEvent(_changeEvent);
        }
        this.updateTbState(STATE.SCALE, true);
        this._startCursorPosition.setY(this.getCursorNDC(_center.x, _center.y, this.domElement).y * .5);
        this._currentCursorPosition.copy(this._startCursorPosition);
        break;
      }
    }
  }
  onSinglePanMove(event, opState) {
    if (this.enabled) {
      const restart = opState != this._state;
      this.setCenter(event.clientX, event.clientY);
      switch (opState) {
       case STATE.PAN:
        if (this.enablePan) {
          if (restart) {
            this.dispatchEvent(_endEvent);
            this.dispatchEvent(_startEvent);
            this.updateTbState(opState, true);
            this._startCursorPosition.copy(this.unprojectOnTbPlane(this.object, _center.x, _center.y, this.domElement));
            if (this.enableGrid) {
              this.drawGrid();
            }
            this.activateGizmos(false);
          } else {
            this._currentCursorPosition.copy(this.unprojectOnTbPlane(this.object, _center.x, _center.y, this.domElement));
            this.applyTransformMatrix(this.pan(this._startCursorPosition, this._currentCursorPosition));
          }
        }
        break;

       case STATE.ROTATE:
        if (this.enableRotate) {
          if (restart) {
            this.dispatchEvent(_endEvent);
            this.dispatchEvent(_startEvent);
            this.updateTbState(opState, true);
            this._startCursorPosition.copy(this.unprojectOnTbSurface(this.object, _center.x, _center.y, this.domElement, this._tbRadius));
            if (this.enableGrid) {
              this.disposeGrid();
            }
            this.activateGizmos(true);
          } else {
            this._currentCursorPosition.copy(this.unprojectOnTbSurface(this.object, _center.x, _center.y, this.domElement, this._tbRadius));
            const distance = this._startCursorPosition.distanceTo(this._currentCursorPosition);
            const angle = this._startCursorPosition.angleTo(this._currentCursorPosition);
            const amount = Math.max(distance / this._tbRadius, angle) * this.rotateSpeed;
            this.applyTransformMatrix(this.rotate(this.calculateRotationAxis(this._startCursorPosition, this._currentCursorPosition), amount));
            if (this.enableAnimations) {
              this._timePrev = this._timeCurrent;
              this._timeCurrent = performance.now();
              this._anglePrev = this._angleCurrent;
              this._angleCurrent = amount;
              this._cursorPosPrev.copy(this._cursorPosCurr);
              this._cursorPosCurr.copy(this._currentCursorPosition);
              this._wPrev = this._wCurr;
              this._wCurr = this.calculateAngularSpeed(this._anglePrev, this._angleCurrent, this._timePrev, this._timeCurrent);
            }
          }
        }
        break;

       case STATE.SCALE:
        if (this.enableZoom) {
          if (restart) {
            this.dispatchEvent(_endEvent);
            this.dispatchEvent(_startEvent);
            this.updateTbState(opState, true);
            this._startCursorPosition.setY(this.getCursorNDC(_center.x, _center.y, this.domElement).y * .5);
            this._currentCursorPosition.copy(this._startCursorPosition);
            if (this.enableGrid) {
              this.disposeGrid();
            }
            this.activateGizmos(false);
          } else {
            const screenNotches = 8;
            this._currentCursorPosition.setY(this.getCursorNDC(_center.x, _center.y, this.domElement).y * .5);
            const movement = this._currentCursorPosition.y - this._startCursorPosition.y;
            let size = 1;
            if (movement < 0) {
              size = 1 / Math.pow(this.scaleFactor, -movement * screenNotches);
            } else if (movement > 0) {
              size = Math.pow(this.scaleFactor, movement * screenNotches);
            }
            this._v3_1.setFromMatrixPosition(this._gizmoMatrixState);
            this.applyTransformMatrix(this.scale(size, this._v3_1));
          }
        }
        break;

       case STATE.FOV:
        if (this.enableZoom && this.object.isPerspectiveCamera) {
          if (restart) {
            this.dispatchEvent(_endEvent);
            this.dispatchEvent(_startEvent);
            this.updateTbState(opState, true);
            this._startCursorPosition.setY(this.getCursorNDC(_center.x, _center.y, this.domElement).y * .5);
            this._currentCursorPosition.copy(this._startCursorPosition);
            if (this.enableGrid) {
              this.disposeGrid();
            }
            this.activateGizmos(false);
          } else {
            const screenNotches = 8;
            this._currentCursorPosition.setY(this.getCursorNDC(_center.x, _center.y, this.domElement).y * .5);
            const movement = this._currentCursorPosition.y - this._startCursorPosition.y;
            let size = 1;
            if (movement < 0) {
              size = 1 / Math.pow(this.scaleFactor, -movement * screenNotches);
            } else if (movement > 0) {
              size = Math.pow(this.scaleFactor, movement * screenNotches);
            }
            this._v3_1.setFromMatrixPosition(this._cameraMatrixState);
            const x = this._v3_1.distanceTo(this._gizmos.position);
            let xNew = x / size;
            xNew = MathUtils.clamp(xNew, this.minDistance, this.maxDistance);
            const y = x * Math.tan(MathUtils.DEG2RAD * this._fovState * .5);
            let newFov = MathUtils.RAD2DEG * (Math.atan(y / xNew) * 2);
            newFov = MathUtils.clamp(newFov, this.minFov, this.maxFov);
            const newDistance = y / Math.tan(MathUtils.DEG2RAD * (newFov / 2));
            size = x / newDistance;
            this._v3_2.setFromMatrixPosition(this._gizmoMatrixState);
            this.setFov(newFov);
            this.applyTransformMatrix(this.scale(size, this._v3_2, false));
            _offset.copy(this._gizmos.position).sub(this.object.position).normalize().multiplyScalar(newDistance / x);
            this._m4_1.makeTranslation(_offset.x, _offset.y, _offset.z);
          }
        }
        break;
      }
      this.dispatchEvent(_changeEvent);
    }
  }
  onSinglePanEnd() {
    if (this._state == STATE.ROTATE) {
      if (!this.enableRotate) {
        return;
      }
      if (this.enableAnimations) {
        const deltaTime = performance.now() - this._timeCurrent;
        if (deltaTime < 120) {
          const w = Math.abs((this._wPrev + this._wCurr) / 2);
          const self = this;
          this._animationId = window.requestAnimationFrame(function(t) {
            self.updateTbState(STATE.ANIMATION_ROTATE, true);
            const rotationAxis = self.calculateRotationAxis(self._cursorPosPrev, self._cursorPosCurr);
            self.onRotationAnim(t, rotationAxis, Math.min(w, self.wMax));
          });
        } else {
          this.updateTbState(STATE.IDLE, false);
          this.activateGizmos(false);
          this.dispatchEvent(_changeEvent);
        }
      } else {
        this.updateTbState(STATE.IDLE, false);
        this.activateGizmos(false);
        this.dispatchEvent(_changeEvent);
      }
    } else if (this._state == STATE.PAN || this._state == STATE.IDLE) {
      this.updateTbState(STATE.IDLE, false);
      if (this.enableGrid) {
        this.disposeGrid();
      }
      this.activateGizmos(false);
      this.dispatchEvent(_changeEvent);
    }
    this.dispatchEvent(_endEvent);
  }
  onDoubleTap(event) {
    if (this.enabled && this.enablePan && this.scene != null) {
      this.dispatchEvent(_startEvent);
      this.setCenter(event.clientX, event.clientY);
      const hitP = this.unprojectOnObj(this.getCursorNDC(_center.x, _center.y, this.domElement), this.object);
      if (hitP != null && this.enableAnimations) {
        const self = this;
        if (this._animationId != -1) {
          window.cancelAnimationFrame(this._animationId);
        }
        this._timeStart = -1;
        this._animationId = window.requestAnimationFrame(function(t) {
          self.updateTbState(STATE.ANIMATION_FOCUS, true);
          self.onFocusAnim(t, hitP, self._cameraMatrixState, self._gizmoMatrixState);
        });
      } else if (hitP != null && !this.enableAnimations) {
        this.updateTbState(STATE.FOCUS, true);
        this.focus(hitP, this.scaleFactor);
        this.updateTbState(STATE.IDLE, false);
        this.dispatchEvent(_changeEvent);
      }
    }
    this.dispatchEvent(_endEvent);
  }
  onDoublePanStart() {
    if (this.enabled && this.enablePan) {
      this.dispatchEvent(_startEvent);
      this.updateTbState(STATE.PAN, true);
      this.setCenter((this._touchCurrent[0].clientX + this._touchCurrent[1].clientX) / 2, (this._touchCurrent[0].clientY + this._touchCurrent[1].clientY) / 2);
      this._startCursorPosition.copy(this.unprojectOnTbPlane(this.object, _center.x, _center.y, this.domElement, true));
      this._currentCursorPosition.copy(this._startCursorPosition);
      this.activateGizmos(false);
    }
  }
  onDoublePanMove() {
    if (this.enabled && this.enablePan) {
      this.setCenter((this._touchCurrent[0].clientX + this._touchCurrent[1].clientX) / 2, (this._touchCurrent[0].clientY + this._touchCurrent[1].clientY) / 2);
      if (this._state != STATE.PAN) {
        this.updateTbState(STATE.PAN, true);
        this._startCursorPosition.copy(this._currentCursorPosition);
      }
      this._currentCursorPosition.copy(this.unprojectOnTbPlane(this.object, _center.x, _center.y, this.domElement, true));
      this.applyTransformMatrix(this.pan(this._startCursorPosition, this._currentCursorPosition, true));
      this.dispatchEvent(_changeEvent);
    }
  }
  onDoublePanEnd() {
    this.updateTbState(STATE.IDLE, false);
    this.dispatchEvent(_endEvent);
  }
  onRotateStart() {
    if (this.enabled && this.enableRotate) {
      this.dispatchEvent(_startEvent);
      this.updateTbState(STATE.ZROTATE, true);
      this._startFingerRotation = this.getAngle(this._touchCurrent[1], this._touchCurrent[0]) + this.getAngle(this._touchStart[1], this._touchStart[0]);
      this._currentFingerRotation = this._startFingerRotation;
      this.object.getWorldDirection(this._rotationAxis);
      if (!this.enablePan && !this.enableZoom) {
        this.activateGizmos(true);
      }
    }
  }
  onRotateMove() {
    if (this.enabled && this.enableRotate) {
      this.setCenter((this._touchCurrent[0].clientX + this._touchCurrent[1].clientX) / 2, (this._touchCurrent[0].clientY + this._touchCurrent[1].clientY) / 2);
      let rotationPoint;
      if (this._state != STATE.ZROTATE) {
        this.updateTbState(STATE.ZROTATE, true);
        this._startFingerRotation = this._currentFingerRotation;
      }
      this._currentFingerRotation = this.getAngle(this._touchCurrent[1], this._touchCurrent[0]) + this.getAngle(this._touchStart[1], this._touchStart[0]);
      if (!this.enablePan) {
        rotationPoint = (new Vector3).setFromMatrixPosition(this._gizmoMatrixState);
      } else {
        this._v3_2.setFromMatrixPosition(this._gizmoMatrixState);
        rotationPoint = this.unprojectOnTbPlane(this.object, _center.x, _center.y, this.domElement).applyQuaternion(this.object.quaternion).multiplyScalar(1 / this.object.zoom).add(this._v3_2);
      }
      const amount = MathUtils.DEG2RAD * (this._startFingerRotation - this._currentFingerRotation);
      this.applyTransformMatrix(this.zRotate(rotationPoint, amount));
      this.dispatchEvent(_changeEvent);
    }
  }
  onRotateEnd() {
    this.updateTbState(STATE.IDLE, false);
    this.activateGizmos(false);
    this.dispatchEvent(_endEvent);
  }
  onPinchStart() {
    if (this.enabled && this.enableZoom) {
      this.dispatchEvent(_startEvent);
      this.updateTbState(STATE.SCALE, true);
      this._startFingerDistance = this.calculatePointersDistance(this._touchCurrent[0], this._touchCurrent[1]);
      this._currentFingerDistance = this._startFingerDistance;
      this.activateGizmos(false);
    }
  }
  onPinchMove() {
    if (this.enabled && this.enableZoom) {
      this.setCenter((this._touchCurrent[0].clientX + this._touchCurrent[1].clientX) / 2, (this._touchCurrent[0].clientY + this._touchCurrent[1].clientY) / 2);
      const minDistance = 12;
      if (this._state != STATE.SCALE) {
        this._startFingerDistance = this._currentFingerDistance;
        this.updateTbState(STATE.SCALE, true);
      }
      this._currentFingerDistance = Math.max(this.calculatePointersDistance(this._touchCurrent[0], this._touchCurrent[1]), minDistance * this._devPxRatio);
      const amount = this._currentFingerDistance / this._startFingerDistance;
      let scalePoint;
      if (!this.enablePan) {
        scalePoint = this._gizmos.position;
      } else {
        if (this.object.isOrthographicCamera) {
          scalePoint = this.unprojectOnTbPlane(this.object, _center.x, _center.y, this.domElement).applyQuaternion(this.object.quaternion).multiplyScalar(1 / this.object.zoom).add(this._gizmos.position);
        } else if (this.object.isPerspectiveCamera) {
          scalePoint = this.unprojectOnTbPlane(this.object, _center.x, _center.y, this.domElement).applyQuaternion(this.object.quaternion).add(this._gizmos.position);
        }
      }
      this.applyTransformMatrix(this.scale(amount, scalePoint));
      this.dispatchEvent(_changeEvent);
    }
  }
  onPinchEnd() {
    this.updateTbState(STATE.IDLE, false);
    this.dispatchEvent(_endEvent);
  }
  onTriplePanStart() {
    if (this.enabled && this.enableZoom) {
      this.dispatchEvent(_startEvent);
      this.updateTbState(STATE.SCALE, true);
      let clientX = 0;
      let clientY = 0;
      const nFingers = this._touchCurrent.length;
      for (let i = 0; i < nFingers; i++) {
        clientX += this._touchCurrent[i].clientX;
        clientY += this._touchCurrent[i].clientY;
      }
      this.setCenter(clientX / nFingers, clientY / nFingers);
      this._startCursorPosition.setY(this.getCursorNDC(_center.x, _center.y, this.domElement).y * .5);
      this._currentCursorPosition.copy(this._startCursorPosition);
    }
  }
  onTriplePanMove() {
    if (this.enabled && this.enableZoom) {
      let clientX = 0;
      let clientY = 0;
      const nFingers = this._touchCurrent.length;
      for (let i = 0; i < nFingers; i++) {
        clientX += this._touchCurrent[i].clientX;
        clientY += this._touchCurrent[i].clientY;
      }
      this.setCenter(clientX / nFingers, clientY / nFingers);
      const screenNotches = 8;
      this._currentCursorPosition.setY(this.getCursorNDC(_center.x, _center.y, this.domElement).y * .5);
      const movement = this._currentCursorPosition.y - this._startCursorPosition.y;
      let size = 1;
      if (movement < 0) {
        size = 1 / Math.pow(this.scaleFactor, -movement * screenNotches);
      } else if (movement > 0) {
        size = Math.pow(this.scaleFactor, movement * screenNotches);
      }
      this._v3_1.setFromMatrixPosition(this._cameraMatrixState);
      const x = this._v3_1.distanceTo(this._gizmos.position);
      let xNew = x / size;
      xNew = MathUtils.clamp(xNew, this.minDistance, this.maxDistance);
      const y = x * Math.tan(MathUtils.DEG2RAD * this._fovState * .5);
      let newFov = MathUtils.RAD2DEG * (Math.atan(y / xNew) * 2);
      newFov = MathUtils.clamp(newFov, this.minFov, this.maxFov);
      const newDistance = y / Math.tan(MathUtils.DEG2RAD * (newFov / 2));
      size = x / newDistance;
      this._v3_2.setFromMatrixPosition(this._gizmoMatrixState);
      this.setFov(newFov);
      this.applyTransformMatrix(this.scale(size, this._v3_2, false));
      _offset.copy(this._gizmos.position).sub(this.object.position).normalize().multiplyScalar(newDistance / x);
      this._m4_1.makeTranslation(_offset.x, _offset.y, _offset.z);
      this.dispatchEvent(_changeEvent);
    }
  }
  onTriplePanEnd() {
    this.updateTbState(STATE.IDLE, false);
    this.dispatchEvent(_endEvent);
  }
  setCenter(clientX, clientY) {
    _center.x = clientX;
    _center.y = clientY;
  }
  initializeMouseActions() {
    this.setMouseAction("PAN", 0, "CTRL");
    this.setMouseAction("PAN", 2);
    this.setMouseAction("ROTATE", 0);
    this.setMouseAction("ZOOM", "WHEEL");
    this.setMouseAction("ZOOM", 1);
    this.setMouseAction("FOV", "WHEEL", "SHIFT");
    this.setMouseAction("FOV", 1, "SHIFT");
  }
  compareMouseAction(action1, action2) {
    if (action1.operation == action2.operation) {
      if (action1.mouse == action2.mouse && action1.key == action2.key) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
  setMouseAction(operation, mouse, key = null) {
    const operationInput = [ "PAN", "ROTATE", "ZOOM", "FOV" ];
    const mouseInput = [ 0, 1, 2, "WHEEL" ];
    const keyInput = [ "CTRL", "SHIFT", null ];
    let state;
    if (!operationInput.includes(operation) || !mouseInput.includes(mouse) || !keyInput.includes(key)) {
      return false;
    }
    if (mouse == "WHEEL") {
      if (operation != "ZOOM" && operation != "FOV") {
        return false;
      }
    }
    switch (operation) {
     case "PAN":
      state = STATE.PAN;
      break;

     case "ROTATE":
      state = STATE.ROTATE;
      break;

     case "ZOOM":
      state = STATE.SCALE;
      break;

     case "FOV":
      state = STATE.FOV;
      break;
    }
    const action = {
      operation: operation,
      mouse: mouse,
      key: key,
      state: state
    };
    for (let i = 0; i < this.mouseActions.length; i++) {
      if (this.mouseActions[i].mouse == action.mouse && this.mouseActions[i].key == action.key) {
        this.mouseActions.splice(i, 1, action);
        return true;
      }
    }
    this.mouseActions.push(action);
    return true;
  }
  unsetMouseAction(mouse, key = null) {
    for (let i = 0; i < this.mouseActions.length; i++) {
      if (this.mouseActions[i].mouse == mouse && this.mouseActions[i].key == key) {
        this.mouseActions.splice(i, 1);
        return true;
      }
    }
    return false;
  }
  getOpFromAction(mouse, key) {
    let action;
    for (let i = 0; i < this.mouseActions.length; i++) {
      action = this.mouseActions[i];
      if (action.mouse == mouse && action.key == key) {
        return action.operation;
      }
    }
    if (key != null) {
      for (let i = 0; i < this.mouseActions.length; i++) {
        action = this.mouseActions[i];
        if (action.mouse == mouse && action.key == null) {
          return action.operation;
        }
      }
    }
    return null;
  }
  getOpStateFromAction(mouse, key) {
    let action;
    for (let i = 0; i < this.mouseActions.length; i++) {
      action = this.mouseActions[i];
      if (action.mouse == mouse && action.key == key) {
        return action.state;
      }
    }
    if (key != null) {
      for (let i = 0; i < this.mouseActions.length; i++) {
        action = this.mouseActions[i];
        if (action.mouse == mouse && action.key == null) {
          return action.state;
        }
      }
    }
    return null;
  }
  getAngle(p1, p2) {
    return Math.atan2(p2.clientY - p1.clientY, p2.clientX - p1.clientX) * 180 / Math.PI;
  }
  updateTouchEvent(event) {
    for (let i = 0; i < this._touchCurrent.length; i++) {
      if (this._touchCurrent[i].pointerId == event.pointerId) {
        this._touchCurrent.splice(i, 1, event);
        break;
      }
    }
  }
  applyTransformMatrix(transformation) {
    if (transformation.camera != null) {
      this._m4_1.copy(this._cameraMatrixState).premultiply(transformation.camera);
      this._m4_1.decompose(this.object.position, this.object.quaternion, this.object.scale);
      this.object.updateMatrix();
      if (this._state == STATE.ROTATE || this._state == STATE.ZROTATE || this._state == STATE.ANIMATION_ROTATE) {
        this.object.up.copy(this._upState).applyQuaternion(this.object.quaternion);
      }
    }
    if (transformation.gizmos != null) {
      this._m4_1.copy(this._gizmoMatrixState).premultiply(transformation.gizmos);
      this._m4_1.decompose(this._gizmos.position, this._gizmos.quaternion, this._gizmos.scale);
      this._gizmos.updateMatrix();
    }
    if (this._state == STATE.SCALE || this._state == STATE.FOCUS || this._state == STATE.ANIMATION_FOCUS) {
      this._tbRadius = this.calculateTbRadius(this.object);
      if (this.adjustNearFar) {
        const cameraDistance = this.object.position.distanceTo(this._gizmos.position);
        const bb = new Box3;
        bb.setFromObject(this._gizmos);
        const sphere = new Sphere;
        bb.getBoundingSphere(sphere);
        const adjustedNearPosition = Math.max(this._nearPos0, sphere.radius + sphere.center.length());
        const regularNearPosition = cameraDistance - this._initialNear;
        const minNearPos = Math.min(adjustedNearPosition, regularNearPosition);
        this.object.near = cameraDistance - minNearPos;
        const adjustedFarPosition = Math.min(this._farPos0, -sphere.radius + sphere.center.length());
        const regularFarPosition = cameraDistance - this._initialFar;
        const minFarPos = Math.min(adjustedFarPosition, regularFarPosition);
        this.object.far = cameraDistance - minFarPos;
        this.object.updateProjectionMatrix();
      } else {
        let update = false;
        if (this.object.near != this._initialNear) {
          this.object.near = this._initialNear;
          update = true;
        }
        if (this.object.far != this._initialFar) {
          this.object.far = this._initialFar;
          update = true;
        }
        if (update) {
          this.object.updateProjectionMatrix();
        }
      }
    }
  }
  calculateAngularSpeed(p0, p1, t0, t1) {
    const s = p1 - p0;
    const t = (t1 - t0) / 1e3;
    if (t == 0) {
      return 0;
    }
    return s / t;
  }
  calculatePointersDistance(p0, p1) {
    return Math.sqrt(Math.pow(p1.clientX - p0.clientX, 2) + Math.pow(p1.clientY - p0.clientY, 2));
  }
  calculateRotationAxis(vec1, vec2) {
    this._rotationMatrix.extractRotation(this._cameraMatrixState);
    this._quat.setFromRotationMatrix(this._rotationMatrix);
    this._rotationAxis.crossVectors(vec1, vec2).applyQuaternion(this._quat);
    return this._rotationAxis.normalize().clone();
  }
  calculateTbRadius(camera) {
    const distance = camera.position.distanceTo(this._gizmos.position);
    if (camera.type == "PerspectiveCamera") {
      const halfFovV = MathUtils.DEG2RAD * camera.fov * .5;
      const halfFovH = Math.atan(camera.aspect * Math.tan(halfFovV));
      return Math.tan(Math.min(halfFovV, halfFovH)) * distance * this.radiusFactor;
    } else if (camera.type == "OrthographicCamera") {
      return Math.min(camera.top, camera.right) * this.radiusFactor;
    }
  }
  focus(point, size, amount = 1) {
    _offset.copy(point).sub(this._gizmos.position).multiplyScalar(amount);
    this._translationMatrix.makeTranslation(_offset.x, _offset.y, _offset.z);
    _gizmoMatrixStateTemp.copy(this._gizmoMatrixState);
    this._gizmoMatrixState.premultiply(this._translationMatrix);
    this._gizmoMatrixState.decompose(this._gizmos.position, this._gizmos.quaternion, this._gizmos.scale);
    _cameraMatrixStateTemp.copy(this._cameraMatrixState);
    this._cameraMatrixState.premultiply(this._translationMatrix);
    this._cameraMatrixState.decompose(this.object.position, this.object.quaternion, this.object.scale);
    if (this.enableZoom) {
      this.applyTransformMatrix(this.scale(size, this._gizmos.position));
    }
    this._gizmoMatrixState.copy(_gizmoMatrixStateTemp);
    this._cameraMatrixState.copy(_cameraMatrixStateTemp);
  }
  drawGrid() {
    if (this.scene != null) {
      const color = 8947848;
      const multiplier = 3;
      let size, divisions, maxLength, tick;
      if (this.object.isOrthographicCamera) {
        const width = this.object.right - this.object.left;
        const height = this.object.bottom - this.object.top;
        maxLength = Math.max(width, height);
        tick = maxLength / 20;
        size = maxLength / this.object.zoom * multiplier;
        divisions = size / tick * this.object.zoom;
      } else if (this.object.isPerspectiveCamera) {
        const distance = this.object.position.distanceTo(this._gizmos.position);
        const halfFovV = MathUtils.DEG2RAD * this.object.fov * .5;
        const halfFovH = Math.atan(this.object.aspect * Math.tan(halfFovV));
        maxLength = Math.tan(Math.max(halfFovV, halfFovH)) * distance * 2;
        tick = maxLength / 20;
        size = maxLength * multiplier;
        divisions = size / tick;
      }
      if (this._grid == null) {
        this._grid = new GridHelper(size, divisions, color, color);
        this._grid.position.copy(this._gizmos.position);
        this._gridPosition.copy(this._grid.position);
        this._grid.quaternion.copy(this.object.quaternion);
        this._grid.rotateX(Math.PI * .5);
        this.scene.add(this._grid);
      }
    }
  }
  dispose() {
    if (this._animationId != -1) {
      window.cancelAnimationFrame(this._animationId);
    }
    this.disconnect();
    if (this.scene !== null) this.scene.remove(this._gizmos);
    this.disposeGrid();
  }
  disposeGrid() {
    if (this._grid != null && this.scene != null) {
      this.scene.remove(this._grid);
      this._grid = null;
    }
  }
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }
  activateGizmos(isActive) {
    const gizmoX = this._gizmos.children[0];
    const gizmoY = this._gizmos.children[1];
    const gizmoZ = this._gizmos.children[2];
    if (isActive) {
      gizmoX.material.setValues({
        opacity: 1
      });
      gizmoY.material.setValues({
        opacity: 1
      });
      gizmoZ.material.setValues({
        opacity: 1
      });
    } else {
      gizmoX.material.setValues({
        opacity: .6
      });
      gizmoY.material.setValues({
        opacity: .6
      });
      gizmoZ.material.setValues({
        opacity: .6
      });
    }
  }
  getCursorNDC(cursorX, cursorY, canvas) {
    const canvasRect = canvas.getBoundingClientRect();
    this._v2_1.setX((cursorX - canvasRect.left) / canvasRect.width * 2 - 1);
    this._v2_1.setY((canvasRect.bottom - cursorY) / canvasRect.height * 2 - 1);
    return this._v2_1.clone();
  }
  getCursorPosition(cursorX, cursorY, canvas) {
    this._v2_1.copy(this.getCursorNDC(cursorX, cursorY, canvas));
    this._v2_1.x *= (this.object.right - this.object.left) * .5;
    this._v2_1.y *= (this.object.top - this.object.bottom) * .5;
    return this._v2_1.clone();
  }
  setCamera(camera) {
    camera.lookAt(this.target);
    camera.updateMatrix();
    if (camera.type == "PerspectiveCamera") {
      this._fov0 = camera.fov;
      this._fovState = camera.fov;
    }
    this._cameraMatrixState0.copy(camera.matrix);
    this._cameraMatrixState.copy(this._cameraMatrixState0);
    this._cameraProjectionState.copy(camera.projectionMatrix);
    this._zoom0 = camera.zoom;
    this._zoomState = this._zoom0;
    this._initialNear = camera.near;
    this._nearPos0 = camera.position.distanceTo(this.target) - camera.near;
    this._nearPos = this._initialNear;
    this._initialFar = camera.far;
    this._farPos0 = camera.position.distanceTo(this.target) - camera.far;
    this._farPos = this._initialFar;
    this._up0.copy(camera.up);
    this._upState.copy(camera.up);
    this.object = camera;
    this.object.updateProjectionMatrix();
    this._tbRadius = this.calculateTbRadius(camera);
    this.makeGizmos(this.target, this._tbRadius);
  }
  setGizmosVisible(value) {
    this._gizmos.visible = value;
    this.dispatchEvent(_changeEvent);
  }
  setTbRadius(value) {
    this.radiusFactor = value;
    this._tbRadius = this.calculateTbRadius(this.object);
    const curve = new EllipseCurve(0, 0, this._tbRadius, this._tbRadius);
    const points = curve.getPoints(this._curvePts);
    const curveGeometry = (new BufferGeometry).setFromPoints(points);
    for (const gizmo in this._gizmos.children) {
      this._gizmos.children[gizmo].geometry = curveGeometry;
    }
    this.dispatchEvent(_changeEvent);
  }
  makeGizmos(tbCenter, tbRadius) {
    const curve = new EllipseCurve(0, 0, tbRadius, tbRadius);
    const points = curve.getPoints(this._curvePts);
    const curveGeometry = (new BufferGeometry).setFromPoints(points);
    const curveMaterialX = new LineBasicMaterial({
      color: 16744576,
      fog: false,
      transparent: true,
      opacity: .6
    });
    const curveMaterialY = new LineBasicMaterial({
      color: 8454016,
      fog: false,
      transparent: true,
      opacity: .6
    });
    const curveMaterialZ = new LineBasicMaterial({
      color: 8421631,
      fog: false,
      transparent: true,
      opacity: .6
    });
    const gizmoX = new Line(curveGeometry, curveMaterialX);
    const gizmoY = new Line(curveGeometry, curveMaterialY);
    const gizmoZ = new Line(curveGeometry, curveMaterialZ);
    const rotation = Math.PI * .5;
    gizmoX.rotation.x = rotation;
    gizmoY.rotation.y = rotation;
    this._gizmoMatrixState0.identity().setPosition(tbCenter);
    this._gizmoMatrixState.copy(this._gizmoMatrixState0);
    if (this.object.zoom !== 1) {
      const size = 1 / this.object.zoom;
      this._scaleMatrix.makeScale(size, size, size);
      this._translationMatrix.makeTranslation(-tbCenter.x, -tbCenter.y, -tbCenter.z);
      this._gizmoMatrixState.premultiply(this._translationMatrix).premultiply(this._scaleMatrix);
      this._translationMatrix.makeTranslation(tbCenter.x, tbCenter.y, tbCenter.z);
      this._gizmoMatrixState.premultiply(this._translationMatrix);
    }
    this._gizmoMatrixState.decompose(this._gizmos.position, this._gizmos.quaternion, this._gizmos.scale);
    this._gizmos.traverse(function(object) {
      if (object.isLine) {
        object.geometry.dispose();
        object.material.dispose();
      }
    });
    this._gizmos.clear();
    this._gizmos.add(gizmoX);
    this._gizmos.add(gizmoY);
    this._gizmos.add(gizmoZ);
  }
  onFocusAnim(time, point, cameraMatrix, gizmoMatrix) {
    if (this._timeStart == -1) {
      this._timeStart = time;
    }
    if (this._state == STATE.ANIMATION_FOCUS) {
      const deltaTime = time - this._timeStart;
      const animTime = deltaTime / this.focusAnimationTime;
      this._gizmoMatrixState.copy(gizmoMatrix);
      if (animTime >= 1) {
        this._gizmoMatrixState.decompose(this._gizmos.position, this._gizmos.quaternion, this._gizmos.scale);
        this.focus(point, this.scaleFactor);
        this._timeStart = -1;
        this.updateTbState(STATE.IDLE, false);
        this.activateGizmos(false);
        this.dispatchEvent(_changeEvent);
      } else {
        const amount = this.easeOutCubic(animTime);
        const size = 1 - amount + this.scaleFactor * amount;
        this._gizmoMatrixState.decompose(this._gizmos.position, this._gizmos.quaternion, this._gizmos.scale);
        this.focus(point, size, amount);
        this.dispatchEvent(_changeEvent);
        const self = this;
        this._animationId = window.requestAnimationFrame(function(t) {
          self.onFocusAnim(t, point, cameraMatrix, gizmoMatrix.clone());
        });
      }
    } else {
      this._animationId = -1;
      this._timeStart = -1;
    }
  }
  onRotationAnim(time, rotationAxis, w0) {
    if (this._timeStart == -1) {
      this._anglePrev = 0;
      this._angleCurrent = 0;
      this._timeStart = time;
    }
    if (this._state == STATE.ANIMATION_ROTATE) {
      const deltaTime = (time - this._timeStart) / 1e3;
      const w = w0 + -this.dampingFactor * deltaTime;
      if (w > 0) {
        this._angleCurrent = .5 * -this.dampingFactor * Math.pow(deltaTime, 2) + w0 * deltaTime + 0;
        this.applyTransformMatrix(this.rotate(rotationAxis, this._angleCurrent));
        this.dispatchEvent(_changeEvent);
        const self = this;
        this._animationId = window.requestAnimationFrame(function(t) {
          self.onRotationAnim(t, rotationAxis, w0);
        });
      } else {
        this._animationId = -1;
        this._timeStart = -1;
        this.updateTbState(STATE.IDLE, false);
        this.activateGizmos(false);
        this.dispatchEvent(_changeEvent);
      }
    } else {
      this._animationId = -1;
      this._timeStart = -1;
      if (this._state != STATE.ROTATE) {
        this.activateGizmos(false);
        this.dispatchEvent(_changeEvent);
      }
    }
  }
  pan(p0, p1, adjust = false) {
    const movement = p0.clone().sub(p1);
    if (this.object.isOrthographicCamera) {
      movement.multiplyScalar(1 / this.object.zoom);
    } else if (this.object.isPerspectiveCamera && adjust) {
      this._v3_1.setFromMatrixPosition(this._cameraMatrixState0);
      this._v3_2.setFromMatrixPosition(this._gizmoMatrixState0);
      const distanceFactor = this._v3_1.distanceTo(this._v3_2) / this.object.position.distanceTo(this._gizmos.position);
      movement.multiplyScalar(1 / distanceFactor);
    }
    this._v3_1.set(movement.x, movement.y, 0).applyQuaternion(this.object.quaternion);
    this._m4_1.makeTranslation(this._v3_1.x, this._v3_1.y, this._v3_1.z);
    this.setTransformationMatrices(this._m4_1, this._m4_1);
    return _transformation;
  }
  reset() {
    this.object.zoom = this._zoom0;
    if (this.object.isPerspectiveCamera) {
      this.object.fov = this._fov0;
    }
    this.object.near = this._nearPos;
    this.object.far = this._farPos;
    this._cameraMatrixState.copy(this._cameraMatrixState0);
    this._cameraMatrixState.decompose(this.object.position, this.object.quaternion, this.object.scale);
    this.object.up.copy(this._up0);
    this.object.updateMatrix();
    this.object.updateProjectionMatrix();
    this._gizmoMatrixState.copy(this._gizmoMatrixState0);
    this._gizmoMatrixState0.decompose(this._gizmos.position, this._gizmos.quaternion, this._gizmos.scale);
    this._gizmos.updateMatrix();
    this._tbRadius = this.calculateTbRadius(this.object);
    this.makeGizmos(this._gizmos.position, this._tbRadius);
    this.object.lookAt(this._gizmos.position);
    this.updateTbState(STATE.IDLE, false);
    this.dispatchEvent(_changeEvent);
  }
  rotate(axis, angle) {
    const point = this._gizmos.position;
    this._translationMatrix.makeTranslation(-point.x, -point.y, -point.z);
    this._rotationMatrix.makeRotationAxis(axis, -angle);
    this._m4_1.makeTranslation(point.x, point.y, point.z);
    this._m4_1.multiply(this._rotationMatrix);
    this._m4_1.multiply(this._translationMatrix);
    this.setTransformationMatrices(this._m4_1);
    return _transformation;
  }
  copyState() {
    let state;
    if (this.object.isOrthographicCamera) {
      state = JSON.stringify({
        arcballState: {
          cameraFar: this.object.far,
          cameraMatrix: this.object.matrix,
          cameraNear: this.object.near,
          cameraUp: this.object.up,
          cameraZoom: this.object.zoom,
          gizmoMatrix: this._gizmos.matrix
        }
      });
    } else if (this.object.isPerspectiveCamera) {
      state = JSON.stringify({
        arcballState: {
          cameraFar: this.object.far,
          cameraFov: this.object.fov,
          cameraMatrix: this.object.matrix,
          cameraNear: this.object.near,
          cameraUp: this.object.up,
          cameraZoom: this.object.zoom,
          gizmoMatrix: this._gizmos.matrix
        }
      });
    }
    navigator.clipboard.writeText(state);
  }
  pasteState() {
    const self = this;
    navigator.clipboard.readText().then(function resolved(value) {
      self.setStateFromJSON(value);
    });
  }
  saveState() {
    this._cameraMatrixState0.copy(this.object.matrix);
    this._gizmoMatrixState0.copy(this._gizmos.matrix);
    this._nearPos = this.object.near;
    this._farPos = this.object.far;
    this._zoom0 = this.object.zoom;
    this._up0.copy(this.object.up);
    if (this.object.isPerspectiveCamera) {
      this._fov0 = this.object.fov;
    }
  }
  scale(size, point, scaleGizmos = true) {
    _scalePointTemp.copy(point);
    let sizeInverse = 1 / size;
    if (this.object.isOrthographicCamera) {
      this.object.zoom = this._zoomState;
      this.object.zoom *= size;
      if (this.object.zoom > this.maxZoom) {
        this.object.zoom = this.maxZoom;
        sizeInverse = this._zoomState / this.maxZoom;
      } else if (this.object.zoom < this.minZoom) {
        this.object.zoom = this.minZoom;
        sizeInverse = this._zoomState / this.minZoom;
      }
      this.object.updateProjectionMatrix();
      this._v3_1.setFromMatrixPosition(this._gizmoMatrixState);
      this._scaleMatrix.makeScale(sizeInverse, sizeInverse, sizeInverse);
      this._translationMatrix.makeTranslation(-this._v3_1.x, -this._v3_1.y, -this._v3_1.z);
      this._m4_2.makeTranslation(this._v3_1.x, this._v3_1.y, this._v3_1.z).multiply(this._scaleMatrix);
      this._m4_2.multiply(this._translationMatrix);
      _scalePointTemp.sub(this._v3_1);
      const amount = _scalePointTemp.clone().multiplyScalar(sizeInverse);
      _scalePointTemp.sub(amount);
      this._m4_1.makeTranslation(_scalePointTemp.x, _scalePointTemp.y, _scalePointTemp.z);
      this._m4_2.premultiply(this._m4_1);
      this.setTransformationMatrices(this._m4_1, this._m4_2);
      return _transformation;
    } else if (this.object.isPerspectiveCamera) {
      this._v3_1.setFromMatrixPosition(this._cameraMatrixState);
      this._v3_2.setFromMatrixPosition(this._gizmoMatrixState);
      let distance = this._v3_1.distanceTo(_scalePointTemp);
      let amount = distance - distance * sizeInverse;
      const newDistance = distance - amount;
      if (newDistance < this.minDistance) {
        sizeInverse = this.minDistance / distance;
        amount = distance - distance * sizeInverse;
      } else if (newDistance > this.maxDistance) {
        sizeInverse = this.maxDistance / distance;
        amount = distance - distance * sizeInverse;
      }
      _offset.copy(_scalePointTemp).sub(this._v3_1).normalize().multiplyScalar(amount);
      this._m4_1.makeTranslation(_offset.x, _offset.y, _offset.z);
      if (scaleGizmos) {
        const pos = this._v3_2;
        distance = pos.distanceTo(_scalePointTemp);
        amount = distance - distance * sizeInverse;
        _offset.copy(_scalePointTemp).sub(this._v3_2).normalize().multiplyScalar(amount);
        this._translationMatrix.makeTranslation(pos.x, pos.y, pos.z);
        this._scaleMatrix.makeScale(sizeInverse, sizeInverse, sizeInverse);
        this._m4_2.makeTranslation(_offset.x, _offset.y, _offset.z).multiply(this._translationMatrix);
        this._m4_2.multiply(this._scaleMatrix);
        this._translationMatrix.makeTranslation(-pos.x, -pos.y, -pos.z);
        this._m4_2.multiply(this._translationMatrix);
        this.setTransformationMatrices(this._m4_1, this._m4_2);
      } else {
        this.setTransformationMatrices(this._m4_1);
      }
      return _transformation;
    }
  }
  setFov(value) {
    if (this.object.isPerspectiveCamera) {
      this.object.fov = MathUtils.clamp(value, this.minFov, this.maxFov);
      this.object.updateProjectionMatrix();
    }
  }
  setTransformationMatrices(camera = null, gizmos = null) {
    if (camera != null) {
      if (_transformation.camera != null) {
        _transformation.camera.copy(camera);
      } else {
        _transformation.camera = camera.clone();
      }
    } else {
      _transformation.camera = null;
    }
    if (gizmos != null) {
      if (_transformation.gizmos != null) {
        _transformation.gizmos.copy(gizmos);
      } else {
        _transformation.gizmos = gizmos.clone();
      }
    } else {
      _transformation.gizmos = null;
    }
  }
  zRotate(point, angle) {
    this._rotationMatrix.makeRotationAxis(this._rotationAxis, angle);
    this._translationMatrix.makeTranslation(-point.x, -point.y, -point.z);
    this._m4_1.makeTranslation(point.x, point.y, point.z);
    this._m4_1.multiply(this._rotationMatrix);
    this._m4_1.multiply(this._translationMatrix);
    this._v3_1.setFromMatrixPosition(this._gizmoMatrixState).sub(point);
    this._v3_2.copy(this._v3_1).applyAxisAngle(this._rotationAxis, angle);
    this._v3_2.sub(this._v3_1);
    this._m4_2.makeTranslation(this._v3_2.x, this._v3_2.y, this._v3_2.z);
    this.setTransformationMatrices(this._m4_1, this._m4_2);
    return _transformation;
  }
  getRaycaster() {
    return _raycaster;
  }
  unprojectOnObj(cursor, camera) {
    const raycaster = this.getRaycaster();
    raycaster.near = camera.near;
    raycaster.far = camera.far;
    raycaster.setFromCamera(cursor, camera);
    const intersect = raycaster.intersectObjects(this.scene.children, true);
    for (let i = 0; i < intersect.length; i++) {
      if (intersect[i].object.uuid != this._gizmos.uuid && intersect[i].face != null) {
        return intersect[i].point.clone();
      }
    }
    return null;
  }
  unprojectOnTbSurface(camera, cursorX, cursorY, canvas, tbRadius) {
    if (camera.type == "OrthographicCamera") {
      this._v2_1.copy(this.getCursorPosition(cursorX, cursorY, canvas));
      this._v3_1.set(this._v2_1.x, this._v2_1.y, 0);
      const x2 = Math.pow(this._v2_1.x, 2);
      const y2 = Math.pow(this._v2_1.y, 2);
      const r2 = Math.pow(this._tbRadius, 2);
      if (x2 + y2 <= r2 * .5) {
        this._v3_1.setZ(Math.sqrt(r2 - (x2 + y2)));
      } else {
        this._v3_1.setZ(r2 * .5 / Math.sqrt(x2 + y2));
      }
      return this._v3_1;
    } else if (camera.type == "PerspectiveCamera") {
      this._v2_1.copy(this.getCursorNDC(cursorX, cursorY, canvas));
      this._v3_1.set(this._v2_1.x, this._v2_1.y, -1);
      this._v3_1.applyMatrix4(camera.projectionMatrixInverse);
      const rayDir = this._v3_1.clone().normalize();
      const cameraGizmoDistance = camera.position.distanceTo(this._gizmos.position);
      const radius2 = Math.pow(tbRadius, 2);
      const h = this._v3_1.z;
      const l = Math.sqrt(Math.pow(this._v3_1.x, 2) + Math.pow(this._v3_1.y, 2));
      if (l == 0) {
        rayDir.set(this._v3_1.x, this._v3_1.y, tbRadius);
        return rayDir;
      }
      const m = h / l;
      const q = cameraGizmoDistance;
      let a = Math.pow(m, 2) + 1;
      let b = 2 * m * q;
      let c = Math.pow(q, 2) - radius2;
      let delta = Math.pow(b, 2) - 4 * a * c;
      if (delta >= 0) {
        this._v2_1.setX((-b - Math.sqrt(delta)) / (2 * a));
        this._v2_1.setY(m * this._v2_1.x + q);
        const angle = MathUtils.RAD2DEG * this._v2_1.angle();
        if (angle >= 45) {
          const rayLength = Math.sqrt(Math.pow(this._v2_1.x, 2) + Math.pow(cameraGizmoDistance - this._v2_1.y, 2));
          rayDir.multiplyScalar(rayLength);
          rayDir.z += cameraGizmoDistance;
          return rayDir;
        }
      }
      a = m;
      b = q;
      c = -radius2 * .5;
      delta = Math.pow(b, 2) - 4 * a * c;
      this._v2_1.setX((-b - Math.sqrt(delta)) / (2 * a));
      this._v2_1.setY(m * this._v2_1.x + q);
      const rayLength = Math.sqrt(Math.pow(this._v2_1.x, 2) + Math.pow(cameraGizmoDistance - this._v2_1.y, 2));
      rayDir.multiplyScalar(rayLength);
      rayDir.z += cameraGizmoDistance;
      return rayDir;
    }
  }
  unprojectOnTbPlane(camera, cursorX, cursorY, canvas, initialDistance = false) {
    if (camera.type == "OrthographicCamera") {
      this._v2_1.copy(this.getCursorPosition(cursorX, cursorY, canvas));
      this._v3_1.set(this._v2_1.x, this._v2_1.y, 0);
      return this._v3_1.clone();
    } else if (camera.type == "PerspectiveCamera") {
      this._v2_1.copy(this.getCursorNDC(cursorX, cursorY, canvas));
      this._v3_1.set(this._v2_1.x, this._v2_1.y, -1);
      this._v3_1.applyMatrix4(camera.projectionMatrixInverse);
      const rayDir = this._v3_1.clone().normalize();
      const h = this._v3_1.z;
      const l = Math.sqrt(Math.pow(this._v3_1.x, 2) + Math.pow(this._v3_1.y, 2));
      let cameraGizmoDistance;
      if (initialDistance) {
        cameraGizmoDistance = this._v3_1.setFromMatrixPosition(this._cameraMatrixState0).distanceTo(this._v3_2.setFromMatrixPosition(this._gizmoMatrixState0));
      } else {
        cameraGizmoDistance = camera.position.distanceTo(this._gizmos.position);
      }
      if (l == 0) {
        rayDir.set(0, 0, 0);
        return rayDir;
      }
      const m = h / l;
      const q = cameraGizmoDistance;
      const x = -q / m;
      const rayLength = Math.sqrt(Math.pow(q, 2) + Math.pow(x, 2));
      rayDir.multiplyScalar(rayLength);
      rayDir.z = 0;
      return rayDir;
    }
  }
  updateMatrixState() {
    this._cameraMatrixState.copy(this.object.matrix);
    this._gizmoMatrixState.copy(this._gizmos.matrix);
    if (this.object.isOrthographicCamera) {
      this._cameraProjectionState.copy(this.object.projectionMatrix);
      this.object.updateProjectionMatrix();
      this._zoomState = this.object.zoom;
    } else if (this.object.isPerspectiveCamera) {
      this._fovState = this.object.fov;
    }
  }
  updateTbState(newState, updateMatrices) {
    this._state = newState;
    if (updateMatrices) {
      this.updateMatrixState();
    }
  }
  update() {
    const EPS = 1e-6;
    if (this.target.equals(this._currentTarget) === false) {
      this._gizmos.position.copy(this.target);
      this._tbRadius = this.calculateTbRadius(this.object);
      this.makeGizmos(this.target, this._tbRadius);
      this._currentTarget.copy(this.target);
    }
    if (this.object.isOrthographicCamera) {
      if (this.object.zoom > this.maxZoom || this.object.zoom < this.minZoom) {
        const newZoom = MathUtils.clamp(this.object.zoom, this.minZoom, this.maxZoom);
        this.applyTransformMatrix(this.scale(newZoom / this.object.zoom, this._gizmos.position, true));
      }
    } else if (this.object.isPerspectiveCamera) {
      const distance = this.object.position.distanceTo(this._gizmos.position);
      if (distance > this.maxDistance + EPS || distance < this.minDistance - EPS) {
        const newDistance = MathUtils.clamp(distance, this.minDistance, this.maxDistance);
        this.applyTransformMatrix(this.scale(newDistance / distance, this._gizmos.position));
        this.updateMatrixState();
      }
      if (this.object.fov < this.minFov || this.object.fov > this.maxFov) {
        this.object.fov = MathUtils.clamp(this.object.fov, this.minFov, this.maxFov);
        this.object.updateProjectionMatrix();
      }
      const oldRadius = this._tbRadius;
      this._tbRadius = this.calculateTbRadius(this.object);
      if (oldRadius < this._tbRadius - EPS || oldRadius > this._tbRadius + EPS) {
        const scale = (this._gizmos.scale.x + this._gizmos.scale.y + this._gizmos.scale.z) / 3;
        const newRadius = this._tbRadius / scale;
        const curve = new EllipseCurve(0, 0, newRadius, newRadius);
        const points = curve.getPoints(this._curvePts);
        const curveGeometry = (new BufferGeometry).setFromPoints(points);
        for (const gizmo in this._gizmos.children) {
          this._gizmos.children[gizmo].geometry = curveGeometry;
        }
      }
    }
    this.object.lookAt(this._gizmos.position);
  }
  setStateFromJSON(json) {
    const state = JSON.parse(json);
    if (state.arcballState != undefined) {
      this._cameraMatrixState.fromArray(state.arcballState.cameraMatrix.elements);
      this._cameraMatrixState.decompose(this.object.position, this.object.quaternion, this.object.scale);
      this.object.up.copy(state.arcballState.cameraUp);
      this.object.near = state.arcballState.cameraNear;
      this.object.far = state.arcballState.cameraFar;
      this.object.zoom = state.arcballState.cameraZoom;
      if (this.object.isPerspectiveCamera) {
        this.object.fov = state.arcballState.cameraFov;
      }
      this._gizmoMatrixState.fromArray(state.arcballState.gizmoMatrix.elements);
      this._gizmoMatrixState.decompose(this._gizmos.position, this._gizmos.quaternion, this._gizmos.scale);
      this.object.updateMatrix();
      this.object.updateProjectionMatrix();
      this._gizmos.updateMatrix();
      this._tbRadius = this.calculateTbRadius(this.object);
      const gizmoTmp = (new Matrix4).copy(this._gizmoMatrixState0);
      this.makeGizmos(this._gizmos.position, this._tbRadius);
      this._gizmoMatrixState0.copy(gizmoTmp);
      this.object.lookAt(this._gizmos.position);
      this.updateTbState(STATE.IDLE, false);
      this.dispatchEvent(_changeEvent);
    }
  }
}

function onWindowResize() {
  const scale = (this._gizmos.scale.x + this._gizmos.scale.y + this._gizmos.scale.z) / 3;
  this._tbRadius = this.calculateTbRadius(this.object);
  const newRadius = this._tbRadius / scale;
  const curve = new EllipseCurve(0, 0, newRadius, newRadius);
  const points = curve.getPoints(this._curvePts);
  const curveGeometry = (new BufferGeometry).setFromPoints(points);
  for (const gizmo in this._gizmos.children) {
    this._gizmos.children[gizmo].geometry = curveGeometry;
  }
  this.dispatchEvent(_changeEvent);
}

function onContextMenu(event) {
  if (!this.enabled) {
    return;
  }
  for (let i = 0; i < this.mouseActions.length; i++) {
    if (this.mouseActions[i].mouse == 2) {
      event.preventDefault();
      break;
    }
  }
}

function onPointerCancel() {
  this._touchStart.splice(0, this._touchStart.length);
  this._touchCurrent.splice(0, this._touchCurrent.length);
  this._input = INPUT.NONE;
}

function onPointerDown(event) {
  if (event.button == 0 && event.isPrimary) {
    this._downValid = true;
    this._downEvents.push(event);
    this._downStart = performance.now();
  } else {
    this._downValid = false;
  }
  if (event.pointerType == "touch" && this._input != INPUT.CURSOR) {
    this._touchStart.push(event);
    this._touchCurrent.push(event);
    switch (this._input) {
     case INPUT.NONE:
      this._input = INPUT.ONE_FINGER;
      this.onSinglePanStart(event, "ROTATE");
      window.addEventListener("pointermove", this._onPointerMove);
      window.addEventListener("pointerup", this._onPointerUp);
      break;

     case INPUT.ONE_FINGER:
     case INPUT.ONE_FINGER_SWITCHED:
      this._input = INPUT.TWO_FINGER;
      this.onRotateStart();
      this.onPinchStart();
      this.onDoublePanStart();
      break;

     case INPUT.TWO_FINGER:
      this._input = INPUT.MULT_FINGER;
      this.onTriplePanStart(event);
      break;
    }
  } else if (event.pointerType != "touch" && this._input == INPUT.NONE) {
    let modifier = null;
    if (event.ctrlKey || event.metaKey) {
      modifier = "CTRL";
    } else if (event.shiftKey) {
      modifier = "SHIFT";
    }
    this._mouseOp = this.getOpFromAction(event.button, modifier);
    if (this._mouseOp != null) {
      window.addEventListener("pointermove", this._onPointerMove);
      window.addEventListener("pointerup", this._onPointerUp);
      this._input = INPUT.CURSOR;
      this._button = event.button;
      this.onSinglePanStart(event, this._mouseOp);
    }
  }
}

function onPointerMove(event) {
  if (event.pointerType == "touch" && this._input != INPUT.CURSOR) {
    switch (this._input) {
     case INPUT.ONE_FINGER:
      this.updateTouchEvent(event);
      this.onSinglePanMove(event, STATE.ROTATE);
      break;

     case INPUT.ONE_FINGER_SWITCHED:
      const movement = this.calculatePointersDistance(this._touchCurrent[0], event) * this._devPxRatio;
      if (movement >= this._switchSensibility) {
        this._input = INPUT.ONE_FINGER;
        this.updateTouchEvent(event);
        this.onSinglePanStart(event, "ROTATE");
        break;
      }
      break;

     case INPUT.TWO_FINGER:
      this.updateTouchEvent(event);
      this.onRotateMove();
      this.onPinchMove();
      this.onDoublePanMove();
      break;

     case INPUT.MULT_FINGER:
      this.updateTouchEvent(event);
      this.onTriplePanMove(event);
      break;
    }
  } else if (event.pointerType != "touch" && this._input == INPUT.CURSOR) {
    let modifier = null;
    if (event.ctrlKey || event.metaKey) {
      modifier = "CTRL";
    } else if (event.shiftKey) {
      modifier = "SHIFT";
    }
    const mouseOpState = this.getOpStateFromAction(this._button, modifier);
    if (mouseOpState != null) {
      this.onSinglePanMove(event, mouseOpState);
    }
  }
  if (this._downValid) {
    const movement = this.calculatePointersDistance(this._downEvents[this._downEvents.length - 1], event) * this._devPxRatio;
    if (movement > this._movementThreshold) {
      this._downValid = false;
    }
  }
}

function onPointerUp(event) {
  if (event.pointerType == "touch" && this._input != INPUT.CURSOR) {
    const nTouch = this._touchCurrent.length;
    for (let i = 0; i < nTouch; i++) {
      if (this._touchCurrent[i].pointerId == event.pointerId) {
        this._touchCurrent.splice(i, 1);
        this._touchStart.splice(i, 1);
        break;
      }
    }
    switch (this._input) {
     case INPUT.ONE_FINGER:
     case INPUT.ONE_FINGER_SWITCHED:
      window.removeEventListener("pointermove", this._onPointerMove);
      window.removeEventListener("pointerup", this._onPointerUp);
      this._input = INPUT.NONE;
      this.onSinglePanEnd();
      break;

     case INPUT.TWO_FINGER:
      this.onDoublePanEnd(event);
      this.onPinchEnd(event);
      this.onRotateEnd(event);
      this._input = INPUT.ONE_FINGER_SWITCHED;
      break;

     case INPUT.MULT_FINGER:
      if (this._touchCurrent.length == 0) {
        window.removeEventListener("pointermove", this._onPointerMove);
        window.removeEventListener("pointerup", this._onPointerUp);
        this._input = INPUT.NONE;
        this.onTriplePanEnd();
      }
      break;
    }
  } else if (event.pointerType != "touch" && this._input == INPUT.CURSOR) {
    window.removeEventListener("pointermove", this._onPointerMove);
    window.removeEventListener("pointerup", this._onPointerUp);
    this._input = INPUT.NONE;
    this.onSinglePanEnd();
    this._button = -1;
  }
  if (event.isPrimary) {
    if (this._downValid) {
      const downTime = event.timeStamp - this._downEvents[this._downEvents.length - 1].timeStamp;
      if (downTime <= this._maxDownTime) {
        if (this._nclicks == 0) {
          this._nclicks = 1;
          this._clickStart = performance.now();
        } else {
          const clickInterval = event.timeStamp - this._clickStart;
          const movement = this.calculatePointersDistance(this._downEvents[1], this._downEvents[0]) * this._devPxRatio;
          if (clickInterval <= this._maxInterval && movement <= this._posThreshold) {
            this._nclicks = 0;
            this._downEvents.splice(0, this._downEvents.length);
            this.onDoubleTap(event);
          } else {
            this._nclicks = 1;
            this._downEvents.shift();
            this._clickStart = performance.now();
          }
        }
      } else {
        this._downValid = false;
        this._nclicks = 0;
        this._downEvents.splice(0, this._downEvents.length);
      }
    } else {
      this._nclicks = 0;
      this._downEvents.splice(0, this._downEvents.length);
    }
  }
}

function onWheel(event) {
  if (this.enabled && this.enableZoom) {
    let modifier = null;
    if (event.ctrlKey || event.metaKey) {
      modifier = "CTRL";
    } else if (event.shiftKey) {
      modifier = "SHIFT";
    }
    const mouseOp = this.getOpFromAction("WHEEL", modifier);
    if (mouseOp != null) {
      event.preventDefault();
      this.dispatchEvent(_startEvent);
      const notchDeltaY = 125;
      let sgn = event.deltaY / notchDeltaY;
      let size = 1;
      if (sgn > 0) {
        size = 1 / this.scaleFactor;
      } else if (sgn < 0) {
        size = this.scaleFactor;
      }
      switch (mouseOp) {
       case "ZOOM":
        this.updateTbState(STATE.SCALE, true);
        if (sgn > 0) {
          size = 1 / Math.pow(this.scaleFactor, sgn);
        } else if (sgn < 0) {
          size = Math.pow(this.scaleFactor, -sgn);
        }
        if (this.cursorZoom && this.enablePan) {
          let scalePoint;
          if (this.object.isOrthographicCamera) {
            scalePoint = this.unprojectOnTbPlane(this.object, event.clientX, event.clientY, this.domElement).applyQuaternion(this.object.quaternion).multiplyScalar(1 / this.object.zoom).add(this._gizmos.position);
          } else if (this.object.isPerspectiveCamera) {
            scalePoint = this.unprojectOnTbPlane(this.object, event.clientX, event.clientY, this.domElement).applyQuaternion(this.object.quaternion).add(this._gizmos.position);
          }
          this.applyTransformMatrix(this.scale(size, scalePoint));
        } else {
          this.applyTransformMatrix(this.scale(size, this._gizmos.position));
        }
        if (this._grid != null) {
          this.disposeGrid();
          this.drawGrid();
        }
        this.updateTbState(STATE.IDLE, false);
        this.dispatchEvent(_changeEvent);
        this.dispatchEvent(_endEvent);
        break;

       case "FOV":
        if (this.object.isPerspectiveCamera) {
          this.updateTbState(STATE.FOV, true);
          if (event.deltaX != 0) {
            sgn = event.deltaX / notchDeltaY;
            size = 1;
            if (sgn > 0) {
              size = 1 / Math.pow(this.scaleFactor, sgn);
            } else if (sgn < 0) {
              size = Math.pow(this.scaleFactor, -sgn);
            }
          }
          this._v3_1.setFromMatrixPosition(this._cameraMatrixState);
          const x = this._v3_1.distanceTo(this._gizmos.position);
          let xNew = x / size;
          xNew = MathUtils.clamp(xNew, this.minDistance, this.maxDistance);
          const y = x * Math.tan(MathUtils.DEG2RAD * this.object.fov * .5);
          let newFov = MathUtils.RAD2DEG * (Math.atan(y / xNew) * 2);
          if (newFov > this.maxFov) {
            newFov = this.maxFov;
          } else if (newFov < this.minFov) {
            newFov = this.minFov;
          }
          const newDistance = y / Math.tan(MathUtils.DEG2RAD * (newFov / 2));
          size = x / newDistance;
          this.setFov(newFov);
          this.applyTransformMatrix(this.scale(size, this._gizmos.position, false));
        }
        if (this._grid != null) {
          this.disposeGrid();
          this.drawGrid();
        }
        this.updateTbState(STATE.IDLE, false);
        this.dispatchEvent(_changeEvent);
        this.dispatchEvent(_endEvent);
        break;
      }
    }
  }
}

export { ArcballControls };
