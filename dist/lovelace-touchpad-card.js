class TouchpadCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("touchpad-card-editor");
  }

  static getStubConfig(hass) {
    const entity = Object.keys(hass?.states || {}).find((id) =>
      id.startsWith("remote.") || id.startsWith("media_player.")
    ) || "";
    return {
      type: "custom:touchpad-card",
      name: "客厅电视遥控器",
      entity,
      remote_device: "",
      icon: "mdi:remote-tv",
      tap: "",
      ok: "",
      up: "",
      down: "",
      left: "",
      right: "",
    };
  }

  setConfig(config) {
    this.config = {
      name: "客厅电视遥控器",
      icon: "mdi:remote-tv",
      folded_template: "",
      entity: "",
      power_entity: "",
      power_state_mode: "auto",
      power_on_states: "on,playing,paused,idle,home,standby",
      power_threshold: 0,
      control_mode: "remote",
      remote_device: "",
      collapsed: true,
      show_buttons: true,
      show_volume: true,
      show_top_extra_buttons: true,
      swipe_threshold: 36,
      default_remote_commands: true,
      tilt_controls: true,
      tilt_threshold: 18,
      tilt_restore_threshold: 32,
      vibrate: true,
      service_data: {},
      top_extra_1_label: "信息",
      top_extra_1_icon: "mdi:information-outline",
      top_extra_1_entity: "",
      top_extra_2_label: "语音",
      top_extra_2_icon: "mdi:microphone",
      top_extra_2_entity: "",
      button_up: "",
      button_down: "",
      button_left: "",
      button_right: "",
      button_ok: "",
      button_back: "",
      button_home: "",
      button_menu: "",
      button_settings: "",
      button_power: "",
      button_volume_up: "",
      button_volume_down: "",
      button_mute: "",
      button_play: "",
      button_pause: "",
      button_play_pause: "",
      button_extra_1: "",
      button_extra_2: "",
      ...config,
    };
    this._folded = Boolean(this.config.collapsed);
    this._feedback = "";
    this._debug = "";
    this._foldedTemplateText = "";
    this._foldedTemplateSource = "";
    this._foldedTemplatePending = "";
    this._foldedTemplateTimer = null;
    this._bottomDock = "right";
    this._orientationEnabled = false;
    this._lastRenderKey = "";
    this.render(true);
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
    this._syncPowerStateIcon();
  }

  connectedCallback() {
    if (this._connected) return;
    this._connected = true;
    this._lastRenderKey = "";
    this.addEventListener("click", this._handleClick);
    this.addEventListener("pointerdown", this._handlePointerDown);
    this.addEventListener("pointermove", this._handlePointerMove);
    this.addEventListener("pointerup", this._handlePointerUp);
    this.addEventListener("pointercancel", this._handlePointerCancel);
    this.addEventListener("contextmenu", this._preventContextMenu);
    this._handleOrientation = this._handleOrientation.bind(this);
  }

  disconnectedCallback() {
    this.removeEventListener("click", this._handleClick);
    this.removeEventListener("pointerdown", this._handlePointerDown);
    this.removeEventListener("pointermove", this._handlePointerMove);
    this.removeEventListener("pointerup", this._handlePointerUp);
    this.removeEventListener("pointercancel", this._handlePointerCancel);
    this.removeEventListener("contextmenu", this._preventContextMenu);
    window.removeEventListener("deviceorientation", this._handleOrientation);
    window.clearTimeout(this._foldedTemplateTimer);
    window.clearTimeout(this._feedbackTimer);
    this._connected = false;
    this._orientationEnabled = false;
    this._lastRenderKey = "";
  }

  getCardSize() {
    return this._folded ? 1 : 5;
  }

  _handleClick = (event) => {
    const button = event.target.closest("[data-action]");
    const header = event.target.closest("[data-toggle]");
    const moreInfo = event.target.closest("[data-more-info]");
    if (this._ignoreClickUntil && Date.now() < this._ignoreClickUntil) {
      if (button || header || moreInfo) {
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }
    if (moreInfo) {
      event.preventDefault();
      event.stopPropagation();
      this._showMoreInfo(this.config.power_entity || this.config.entity);
      return;
    }
    this._enableOrientation();
    if (header && !button && !moreInfo) {
      event.preventDefault();
      event.stopPropagation();
      this._folded = !this._folded;
      this.render(true);
      return;
    }
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();
    this._runAction(button.dataset.action);
  };

  _handlePointerDown = (event) => {
    if (event.target.closest("[data-action], [data-more-info], [data-toggle]")) {
      return;
    }

    const pad = event.target.closest(".touchpad-area");
    if (!pad || event.target.closest("[data-action]")) return;

    event.preventDefault();
    event.stopPropagation();
    pad.setPointerCapture?.(event.pointerId);
    this._pointer = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      startedAt: Date.now(),
      moved: false,
    };
  };

  _handlePointerMove = (event) => {
    if (!this._pointer || event.pointerId !== this._pointer.id) return;
    const dx = event.clientX - this._pointer.x;
    const dy = event.clientY - this._pointer.y;
    const distance = Math.hypot(dx, dy);
    this._pointer.lastX = event.clientX;
    this._pointer.lastY = event.clientY;
    this._pointer.moved = distance > 8;
    this._debug = `x:${Math.round(dx)} y:${Math.round(dy)} d:${Math.round(distance)}`;
    if (this.config.debug) this.render(true);
  };

  _handlePointerUp = (event) => {
    if (!this._pointer || event.pointerId !== this._pointer.id) return;

    event.preventDefault();
    event.stopPropagation();
    const pointer = this._pointer;
    this._pointer = null;

    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    const distance = Math.hypot(dx, dy);
    if (distance < this.config.swipe_threshold) {
      this._handleTap();
      return;
    }

    const direction = Math.abs(dx) > Math.abs(dy)
      ? (dx > 0 ? "right" : "left")
      : (dy > 0 ? "down" : "up");
    this._runAction(direction, { direction, distance });
  };

  _handlePointerCancel = () => {
    this._pointer = null;
  };

  _preventContextMenu = (event) => {
    if (event.target.closest(".touchpad-area")) event.preventDefault();
  };

  _handleTap() {
    this._runAction("tap");
  }

  async _runAction(name, detail = {}) {
    const aliases = {
      tap: "ok",
    };
    
    // 构建 action
    let action = null;
    
    // 优先查找 command_${name} 配置（支持 extra_1, extra_2 等自定义按钮）
    const commandConfig = this.config[`command_${name}`];
    if (commandConfig && typeof commandConfig === "object" && Object.keys(commandConfig).length > 0) {
      action = commandConfig;
    }
    
    // 在 button 模式下，查找 button_${name} 配置
    if (!action && this.config.control_mode === "button") {
      const buttonConfig = this.config[`button_${name}`];
      if (buttonConfig && typeof buttonConfig === "string" && buttonConfig.trim()) {
        // 如果配置是字符串（按钮实体 ID），转换为 action 对象
        action = {
          service: "button.press",
          target: { entity_id: buttonConfig.trim() },
        };
      } else if (buttonConfig && typeof buttonConfig === "object") {
        action = buttonConfig;
      }
    }
    
    // 如果找不到，按原来的逻辑查找
    if (!action) {
      action = this.config[name]
        || this.config[aliases[name]]
        || this._defaultAction(name);
    }
    
    this._showFeedback(name, detail.direction);
    this._vibrate();
    if (!action) {
      this._debug = `No action configured for: ${name}`;
      this.render(true);
      return;
    }

    try {
      await this._callAction(action);
    } catch (error) {
      this._debug = error.message || String(error);
      this.render(true);
    }
  }

  async _enableOrientation() {
    if (!this.config.tilt_controls || this._orientationEnabled) return;
    this._orientationEnabled = true;
    try {
      if (typeof DeviceOrientationEvent !== "undefined"
        && typeof DeviceOrientationEvent.requestPermission === "function") {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission !== "granted") return;
      }
      window.addEventListener("deviceorientation", this._handleOrientation);
    } catch (error) {
      this._debug = error.message || String(error);
      if (this.config.debug) this.render(true);
    }
  }

  _handleOrientation(event) {
    if (!this.config.tilt_controls) return;
    const gamma = Number(event.gamma);
    if (!Number.isFinite(gamma)) return;

    const threshold = Number(this.config.tilt_threshold) || 18;
    const restoreThreshold = Number(this.config.tilt_restore_threshold) || 32;
    let nextDock = this._bottomDock;
    if (this._bottomDock !== "left" && gamma <= -threshold) {
      nextDock = "left";
    } else if (this._bottomDock === "left" && gamma >= restoreThreshold) {
      nextDock = "right";
    }
    if (nextDock === this._bottomDock) return;

    this._bottomDock = nextDock;
    this._debug = `tilt:${Math.round(gamma)} dock:${nextDock}`;
    this.render(true);
  }

  _vibrate() {
    if (!this.config.vibrate || typeof navigator === "undefined" || !navigator.vibrate) return;
    navigator.vibrate(18);
  }

  _isPoweredOn(stateObj) {
    if (!stateObj) return false;
    const rawState = String(stateObj.state ?? "").toLowerCase();
    if (["unknown", "unavailable", "none", ""].includes(rawState)) return false;

    const mode = this.config.power_state_mode || "auto";
    if (mode === "threshold" || (mode === "auto" && this._looksNumeric(rawState))) {
      const value = Number.parseFloat(rawState);
      const threshold = Number.parseFloat(this.config.power_threshold);
      return Number.isFinite(value) && value > (Number.isFinite(threshold) ? threshold : 0);
    }

    const onStates = String(this.config.power_on_states || "on,playing,paused,idle,home,standby")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    return onStates.includes(rawState);
  }

  _syncPowerStateIcon() {
    const icon = this.querySelector(".status-icon");
    if (!icon || !this.config) return;
    const powerState = this._hass?.states?.[this.config.power_entity];
    const isPoweredOn = this._isPoweredOn(powerState);
    icon.classList.toggle("is-on", isPoweredOn);
    icon.style.color = isPoweredOn ? "var(--warning-color, #fdd835)" : "";
  }

  _getExtraButtonClass(name) {
    // 检查顶部额外按钮的状态实体，如果实体状态为 on 则添加 active 类
    const entityKey = `${name}_entity`;
    const entityId = this.config[entityKey];
    if (!entityId) return "header-button";
    const state = this._hass?.states?.[entityId];
    if (!state) return "header-button";
    const stateStr = String(state.state ?? "").toLowerCase();
    // 如果状态是 on、playing、paused、idle、home 等则认为已激活
    const activeStates = ["on", "playing", "paused", "idle", "home", "standby"];
    if (activeStates.includes(stateStr)) {
      return "header-button active";
    }
    return "header-button";
  }

  _looksNumeric(value) {
    return value !== "" && Number.isFinite(Number.parseFloat(value));
  }

  async _callAction(action) {
    if (!this._hass) return;

    if (typeof action === "string") {
      if (!action.includes(".")) return;
      const [domain, service] = action.split(".");
      await this._hass.callService(domain, service, this._servicePayload({}));
      return;
    }

    if (typeof action !== "object") return;
    if (action.action === "more-info") {
      this._showMoreInfo(action.entity || this.config.entity);
      return;
    }

    const serviceName = action.service || action.tap_action?.service;
    if (!serviceName?.includes(".")) return;
    const [domain, service] = serviceName.split(".");
    const data = {
      ...(action.service_data || {}),
      ...(action.data || {}),
    };
    await this._hass.callService(domain, service, this._servicePayload(data, action.target));
  }

  _servicePayload(data = {}, target = {}) {
    const entityId = target.entity_id || data.entity_id || this.config.entity;
    return {
      ...this.config.service_data,
      ...data,
      ...(entityId ? { entity_id: entityId } : {}),
    };
  }

  _defaultAction(name) {
    if (!this.config.default_remote_commands || !this.config.entity) return null;
    const mode = this.config.control_mode || "remote";
    
    // Button mode: trigger button entities
    if (mode === "button") {
      // 映射操作名到配置名
      const nameMapping = {
        tap: "ok",
        settings: "settings",
        play: "play",
        pause: "pause",
        play_pause: "play_pause",
        mute: "mute",
      };
      const mappedName = nameMapping[name] || name;
      const buttonEntity = this.config[`button_${mappedName}`];
      if (!buttonEntity) return null;
      return {
        service: "button.press",
        target: { entity_id: buttonEntity },
      };
    }
    
    const command = this._commandForMode(name, mode);
    if (!command) return null;

    if (mode === "adb") {
      if (!this.config.entity.startsWith("media_player.")) return null;
      return {
        service: "androidtv.adb_command",
        data: { command },
      };
    }

    if (!this.config.entity.startsWith("remote.")) return null;
    return {
      service: "remote.send_command",
      data: {
        ...((mode === "remote" && this.config.remote_device) ? { device: this.config.remote_device } : {}),
        command,
      },
    };
  }

  _commandForMode(name, mode) {
    const configured = {
      tap: this.config.command_ok,
      up: this.config.command_up,
      down: this.config.command_down,
      left: this.config.command_left,
      right: this.config.command_right,
      back: this.config.command_back,
      home: this.config.command_home,
      menu: this.config.command_menu,
      settings: this.config.command_settings,
      power: this.config.command_power,
      volume_up: this.config.command_volume_up,
      volume_down: this.config.command_volume_down,
      mute: this.config.command_mute,
      extra_1: this.config.command_extra_1,
      extra_2: this.config.command_extra_2,
    }[name];
    if (configured) return configured;

    const infrared = {
      tap: "ok",
      up: "up",
      down: "down",
      left: "left",
      right: "right",
      back: "back",
      home: "home",
      menu: "menu",
      settings: "settings",
      power: "power",
      volume_up: "volume_up",
      volume_down: "volume_down",
      mute: "mute",
      extra_1: "info",
      extra_2: "voice",
    };
    const androidRemote = {
      tap: "DPAD_CENTER",
      up: "DPAD_UP",
      down: "DPAD_DOWN",
      left: "DPAD_LEFT",
      right: "DPAD_RIGHT",
      back: "BACK",
      home: "HOME",
      menu: "MENU",
      settings: "SETTINGS",
      power: "POWER",
      volume_up: "VOLUME_UP",
      volume_down: "VOLUME_DOWN",
      mute: "MUTE",
      extra_1: "INFO",
      extra_2: "SEARCH",
    };
    const adb = {
      tap: "input keyevent KEYCODE_DPAD_CENTER",
      up: "input keyevent KEYCODE_DPAD_UP",
      down: "input keyevent KEYCODE_DPAD_DOWN",
      left: "input keyevent KEYCODE_DPAD_LEFT",
      right: "input keyevent KEYCODE_DPAD_RIGHT",
      back: "input keyevent KEYCODE_BACK",
      home: "input keyevent KEYCODE_HOME",
      menu: "input keyevent KEYCODE_MENU",
      settings: "am start -a android.settings.SETTINGS",
      power: "input keyevent KEYCODE_POWER",
      volume_up: "input keyevent KEYCODE_VOLUME_UP",
      volume_down: "input keyevent KEYCODE_VOLUME_DOWN",
      mute: "input keyevent KEYCODE_VOLUME_MUTE",
      extra_1: "input keyevent KEYCODE_INFO",
      extra_2: "input keyevent KEYCODE_SEARCH",
    };
    return (mode === "adb" ? adb : mode === "androidtv_remote" ? androidRemote : infrared)[name];
  }

  _showMoreInfo(entityId = this.config.entity) {
    if (!entityId) return;
    this.dispatchEvent(new CustomEvent("hass-more-info", {
      detail: { entityId },
      bubbles: true,
      composed: true,
    }));
  }

  _showFeedback(name, direction) {
    const label = direction || name;
    this._feedback = label;
    this._debug = `action: ${name}`;
    this.render(true);
    window.clearTimeout(this._feedbackTimer);
    this._feedbackTimer = window.setTimeout(() => {
      this._feedback = "";
      this.render(true);
    }, 420);
  }

  _scheduleFoldedTemplateUpdate() {
    const template = String(this.config.folded_template || "").trim();
    if (!this._folded || !template) {
      if (this._foldedTemplateText || this._foldedTemplateSource || this._foldedTemplatePending) {
        this._foldedTemplateText = "";
        this._foldedTemplateSource = "";
        this._foldedTemplatePending = "";
      }
      return;
    }
    if (!this._hass?.callApi || this._foldedTemplatePending === template) return;

    window.clearTimeout(this._foldedTemplateTimer);
    this._foldedTemplateTimer = window.setTimeout(() => {
      this._renderFoldedTemplate(template);
    }, 120);
  }

  async _renderFoldedTemplate(template) {
    if (!this._hass?.callApi || this._foldedTemplatePending === template) return;
    this._foldedTemplatePending = template;
    try {
      const result = await this._hass.callApi("POST", "template", {
        template: this._templateWithVariables(template),
      });
      if (String(this.config.folded_template || "").trim() !== template) return;
      const text = String(result?.result ?? result ?? "").trim();
      if (this._foldedTemplateText !== text || this._foldedTemplateSource !== template) {
        this._foldedTemplateText = text;
        this._foldedTemplateSource = template;
        this.render(true);
      }
    } catch (error) {
      const text = this.config.debug ? (error.message || String(error)) : "";
      if (this._foldedTemplateText !== text) {
        this._foldedTemplateText = text;
        this.render(true);
      }
    } finally {
      if (this._foldedTemplatePending === template) this._foldedTemplatePending = "";
    }
  }

  _templateWithVariables(template) {
    const entity = String(this.config.power_entity || this.config.entity || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    return `{% set entity = '${entity}' %}\n${template}`;
  }

  render(force = false) {
    if (!this.config) return;
    this._scheduleFoldedTemplateUpdate();
    const state = this._hass?.states?.[this.config.entity];
    const powerState = this._hass?.states?.[this.config.power_entity];
    const isPoweredOn = this._isPoweredOn(powerState);
    const key = JSON.stringify({
      config: this.config,
      folded: this._folded,
      folded_template_text: this._foldedTemplateText,
      feedback: this._feedback,
      debug: this._debug,
      state: state?.state,
      power_state: powerState?.state,
      power_attributes: powerState?.attributes,
      is_powered_on: isPoweredOn,
      dock: this._bottomDock,
    });
    if (!force && key === this._lastRenderKey) return;
    this._lastRenderKey = key;

    this.innerHTML = `
      <ha-card>
        <div class="touchpad-card">
          <div class="header" data-toggle>
            <button class="icon-button status-icon${isPoweredOn ? " is-on" : ""}" data-more-info title="开机状态详情" aria-label="开机状态详情">
              <ha-icon icon="${this._escape(this.config.icon || "mdi:remote-tv")}"></ha-icon>
            </button>
            <div class="heading">
              <div class="title-row">
                <div class="title">${this._escape(this.config.name)}</div>
                ${this._folded ? this._foldedTemplate() : ""}
              </div>
            </div>
            <div class="top-actions">
              ${!this._folded && this.config.show_top_extra_buttons ? this._button("extra_1", this.config.top_extra_1_icon || "mdi:information-outline", this.config.top_extra_1_label || "信息", this._getExtraButtonClass("extra_1")) : ""}
              ${!this._folded && this.config.show_top_extra_buttons ? this._button("extra_2", this.config.top_extra_2_icon || "mdi:microphone", this.config.top_extra_2_label || "语音", this._getExtraButtonClass("extra_2")) : ""}
              ${this._button("settings", "mdi:cog", "设置", "header-button")}
              ${this._button("mute", "mdi:volume-off", "静音", "header-button")}
              ${this._button("power", "mdi:power", "电源", "header-button power-button")}
            </div>
          </div>
          ${this._folded ? "" : `
            <div class="touchpad-area">
              ${this.config.debug ? `<div class="debug">${this._escape(this._debug)}</div>` : ""}
              ${this._feedback ? `<div class="feedback ${this._escape(this._feedback)}">${this._feedbackIcon(this._feedback)}</div>` : ""}
            </div>
            <div class="bottom-actions ${this._bottomDock === "left" ? "dock-left" : "dock-right"}">
              <div class="nav-actions">
                ${this.config.show_buttons ? this._button("menu", "mdi:menu", "菜单") : ""}
                ${this.config.show_buttons ? this._button("home", "mdi:home", "主页") : ""}
                ${this.config.show_buttons ? this._button("back", "mdi:keyboard-return", "返回") : ""}
              </div>
              <div class="volume-actions">
                ${this.config.show_volume ? this._button("volume_down", "mdi:volume-medium", "音量-") : ""}
                ${this.config.show_volume ? this._button("volume_up", "mdi:volume-high", "音量+") : ""}
              </div>
            </div>
          `}
        </div>
        <style>
          ha-card {
            background: var(--ha-card-background, var(--card-background-color, var(--primary-background-color)));
            color: var(--primary-text-color);
            border-radius: var(--ha-card-border-radius, 12px);
            overflow: hidden;
            box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0, 0, 0, 0.18));
          }
          .touchpad-card {
            --touchpad-card-bg: var(--ha-card-background, var(--card-background-color, var(--primary-background-color)));
            --touchpad-pad-bg: var(--secondary-background-color, var(--primary-background-color));
            --touchpad-border: var(--divider-color);
            --touchpad-text: var(--primary-text-color);
            --touchpad-muted: var(--secondary-text-color);
            --touchpad-press: color-mix(in srgb, var(--primary-color) 18%, transparent);
            --touchpad-danger: var(--error-color, #db4437);
            background: var(--touchpad-card-bg);
            padding: 14px 14px 12px;
            user-select: none;
          }
          .header {
            display: flex;
            align-items: center;
            gap: 12px;
            cursor: pointer;
            min-height: 32px;
          }
          .heading {
            flex: 1;
            min-width: 0;
          }
          .title-row {
            display: flex;
            align-items: baseline;
            gap: 8px;
            min-width: 0;
            overflow: hidden;
          }
          .title {
            font-size: 14px;
            font-weight: 650;
            line-height: 1.2;
            color: var(--touchpad-text);
            flex: 0 0 auto;
            max-width: 55%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .folded-template {
            color: var(--touchpad-muted);
            font-size: 12px;
            line-height: 1.2;
            min-width: 0;
            overflow: hidden;
            white-space: nowrap;
            flex: 1 1 auto;
          }
          .folded-template-track {
            display: inline-flex;
            align-items: baseline;
            gap: 24px;
            max-width: 100%;
          }
          .folded-template.is-scrolling .folded-template-track {
            max-width: none;
            animation: folded-template-marquee 14s linear infinite;
          }
          .folded-template.is-scrolling:hover .folded-template-track {
            animation-play-state: paused;
          }
          .folded-template-copy {
            color: var(--touchpad-muted);
          }
          .subtitle {
            color: var(--secondary-text-color);
            font-size: 12px;
            margin-top: 3px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .top-actions,
          .bottom-actions,
          .nav-actions,
          .volume-actions {
            display: flex;
            align-items: center;
            gap: 14px;
          }
          button {
            border: 0;
            background: none;
            color: var(--primary-text-color);
            font: inherit;
          }
          .icon-button,
          .remote-button {
            display: inline-grid;
            place-items: center;
            border-radius: 6px;
            cursor: pointer;
            transition: transform 120ms ease, background 120ms ease, box-shadow 120ms ease;
          }
          .icon-button {
            width: 32px;
            height: 32px;
            background: transparent;
            color: var(--touchpad-text);
          }
          .remote-button {
            width: 28px;
            height: 28px;
            min-height: 28px;
            background: transparent;
            color: var(--touchpad-text);
          }
          .remote-button ha-icon,
          .icon-button ha-icon {
            --mdc-icon-size: 22px;
          }
          .header-button {
            width: 28px;
            height: 28px;
          }
          .power-button {
            color: var(--touchpad-danger);
          }
          .header-button.active {
            color: var(--touchpad-success, #4caf50);
          }
          .status-icon.is-on {
            color: var(--warning-color, #fdd835);
          }
          .remote-button:hover,
          .icon-button:hover {
            background: var(--touchpad-press);
          }
          .remote-button:active,
          .icon-button:active {
            transform: scale(0.96);
          }
          .touchpad-area {
            position: relative;
            min-height: 270px;
            margin-top: 10px;
            border: 1px solid var(--touchpad-border);
            border-radius: 12px;
            overflow: hidden;
            background: rgba(245, 247, 250, 0.58);
            background: color-mix(in srgb, var(--touchpad-pad-bg) 68%, transparent);
            backdrop-filter: blur(2px);
            touch-action: none;
          }
          .debug {
            position: absolute;
            top: 12px;
            right: 12px;
            color: var(--touchpad-muted);
            font-size: 12px;
          }
          .feedback {
            position: absolute;
            inset: 0;
            display: grid;
            place-items: center;
            pointer-events: none;
            color: var(--primary-color);
            animation: touchpad-feedback 420ms ease forwards;
          }
          .feedback ha-icon {
            --mdc-icon-size: 76px;
            filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.16));
          }
          .bottom-actions {
            justify-content: space-between;
            margin-top: 8px;
            min-height: 28px;
            transition: justify-content 180ms ease, transform 180ms ease;
          }
          .bottom-actions.dock-left {
            justify-content: space-between;
          }
          .bottom-actions.dock-right {
            justify-content: space-between;
          }
          .bottom-actions.dock-right .nav-actions {
            order: 2;
            margin-left: 0;
          }
          .bottom-actions.dock-right .volume-actions {
            order: 1;
          }
          .bottom-actions.dock-left .nav-actions {
            order: 1;
            margin-left: 42px;
          }
          .bottom-actions.dock-left .volume-actions {
            order: 2;
          }
          @keyframes touchpad-feedback {
            0% { opacity: 0; transform: scale(0.82); }
            20% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(1.18); }
          }
          @keyframes folded-template-marquee {
            0%, 12% { transform: translateX(0); }
            88%, 100% { transform: translateX(calc(-50% - 12px)); }
          }
          @media (max-width: 480px) {
            .touchpad-area {
              min-height: 240px;
            }
          }
        </style>
      </ha-card>
    `;
    this._syncPowerStateIcon();
  }

  _foldedTemplate() {
    const text = String(this._foldedTemplateText || "").trim();
    if (!text) return "";
    const escaped = this._escape(text);
    const scrolling = text.length > 14 ? " is-scrolling" : "";
    return `
      <div class="folded-template${scrolling}" title="${escaped}">
        <span class="folded-template-track">
          <span>${escaped}</span>
          ${scrolling ? `<span class="folded-template-copy">${escaped}</span>` : ""}
        </span>
      </div>
    `;
  }

  _button(action, icon, label, extraClass = "") {
    return `
      <button class="remote-button ${extraClass}" data-action="${this._escape(action)}" title="${this._escape(label)}" aria-label="${this._escape(label)}">
        <ha-icon icon="${this._escape(icon)}"></ha-icon>
      </button>
    `;
  }

  _feedbackIcon(name) {
    const icon = {
      up: "mdi:arrow-up-bold",
      down: "mdi:arrow-down-bold",
      left: "mdi:arrow-left-bold",
      right: "mdi:arrow-right-bold",
      tap: "mdi:check-circle",
      ok: "mdi:check-circle",
      settings: "mdi:cog",
      mute: "mdi:volume-off",
      power: "mdi:power",
      menu: "mdi:menu",
      home: "mdi:home",
      back: "mdi:keyboard-return",
      volume_down: "mdi:volume-medium",
      volume_up: "mdi:volume-high",
      extra_1: this.config.top_extra_1_icon || "mdi:information-outline",
      extra_2: this.config.top_extra_2_icon || "mdi:microphone",
    }[name] || "mdi:remote";
    return `<ha-icon icon="${icon}"></ha-icon>`;
  }

  _escape(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[char]));
  }
}

class TouchpadCardEditor extends HTMLElement {
  setConfig(config) {
    this.config = {
      name: "客厅电视遥控器",
      icon: "mdi:remote-tv",
      folded_template: "",
      collapsed: true,
      power_entity: "",
      power_state_mode: "auto",
      power_on_states: "on,playing,paused,idle,home,standby",
      power_threshold: 0,
      control_mode: "remote",
      remote_device: "",
      show_buttons: true,
      show_volume: true,
      show_top_extra_buttons: true,
      default_remote_commands: true,
      tilt_controls: true,
      tilt_threshold: 18,
      tilt_restore_threshold: 32,
      vibrate: true,
      swipe_threshold: 36,
      top_extra_1_label: "信息",
      top_extra_1_icon: "mdi:information-outline",
      top_extra_2_label: "语音",
      top_extra_2_icon: "mdi:microphone",
      ...config,
    };
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) {
      this._form.hass = hass;
      return;
    }
    this.render();
  }

  render() {
    if (!this._hass || !this.config) return;
    if (!this._form) {
      this.innerHTML = `<ha-form></ha-form>`;
      this._form = this.querySelector("ha-form");
      this._form.schema = [
        { name: "name", selector: { text: {} } },
        { name: "folded_template", selector: { text: { multiline: true } } },
        { name: "collapsed", selector: { boolean: {} } },
        { name: "icon", selector: { icon: {} } },
        { name: "entity", selector: { entity: { domain: ["remote", "media_player"] } } },
        { name: "control_mode", selector: { select: { options: [
          { value: "remote", label: "普通红外 remote" },
          { value: "androidtv_remote", label: "Android TV remote" },
          { value: "adb", label: "Android TV ADB command" },
          { value: "button", label: "按钮实体 button" },
        ] } } },
        { name: "power_entity", selector: { entity: {} } },
        { name: "power_state_mode", selector: { select: { options: [
          { value: "auto", label: "自动判断" },
          { value: "state", label: "按状态判断" },
          { value: "threshold", label: "按数值阈值判断" },
        ] } } },
        { name: "power_on_states", selector: { text: {} } },
        { name: "power_threshold", selector: { number: { mode: "box" } } },
        { name: "remote_device", selector: { text: {} } },
        { name: "default_remote_commands", selector: { boolean: {} } },
        { name: "command_ok", selector: { text: {} } },
        { name: "command_up", selector: { text: {} } },
        { name: "command_down", selector: { text: {} } },
        { name: "command_left", selector: { text: {} } },
        { name: "command_right", selector: { text: {} } },
        { name: "command_settings", selector: { text: {} } },
        { name: "show_top_extra_buttons", selector: { boolean: {} } },
        { name: "top_extra_1_label", selector: { text: {} } },
        { name: "top_extra_1_icon", selector: { icon: {} } },
        { name: "top_extra_1_entity", selector: { entity: {} } },
        { name: "command_extra_1", selector: { text: {} } },
        { name: "top_extra_2_label", selector: { text: {} } },
        { name: "top_extra_2_icon", selector: { icon: {} } },
        { name: "top_extra_2_entity", selector: { entity: {} } },
        { name: "command_extra_2", selector: { text: {} } },
        { name: "command_back", selector: { text: {} } },
        { name: "command_home", selector: { text: {} } },
        { name: "command_menu", selector: { text: {} } },
        { name: "command_power", selector: { text: {} } },
        { name: "command_volume_up", selector: { text: {} } },
        { name: "command_volume_down", selector: { text: {} } },
        { name: "command_mute", selector: { text: {} } },
        { name: "show_buttons", selector: { boolean: {} } },
        { name: "show_volume", selector: { boolean: {} } },
        { name: "button_up", selector: { entity: { domain: "button" } } },
        { name: "button_down", selector: { entity: { domain: "button" } } },
        { name: "button_left", selector: { entity: { domain: "button" } } },
        { name: "button_right", selector: { entity: { domain: "button" } } },
        { name: "button_ok", selector: { entity: { domain: "button" } } },
        { name: "button_back", selector: { entity: { domain: "button" } } },
        { name: "button_home", selector: { entity: { domain: "button" } } },
        { name: "button_menu", selector: { entity: { domain: "button" } } },
        { name: "button_settings", selector: { entity: { domain: "button" } } },
        { name: "button_power", selector: { entity: { domain: "button" } } },
        { name: "button_volume_up", selector: { entity: { domain: "button" } } },
        { name: "button_volume_down", selector: { entity: { domain: "button" } } },
        { name: "button_mute", selector: { entity: { domain: "button" } } },
        { name: "button_play", selector: { entity: { domain: "button" } } },
        { name: "button_pause", selector: { entity: { domain: "button" } } },
        { name: "button_play_pause", selector: { entity: { domain: "button" } } },
        { name: "button_extra_1", selector: { entity: { domain: "button" } } },
        { name: "button_extra_2", selector: { entity: { domain: "button" } } },
        { name: "tilt_controls", selector: { boolean: {} } },
        { name: "tilt_threshold", selector: { number: { min: 5, max: 60, mode: "box", unit_of_measurement: "°" } } },
        { name: "tilt_restore_threshold", selector: { number: { min: 5, max: 80, mode: "box", unit_of_measurement: "°" } } },
        { name: "vibrate", selector: { boolean: {} } },
        { name: "debug", selector: { boolean: {} } },
      ];
      this._form.computeLabel = (schema) => ({
        name: "名称",
        folded_template: "折叠时显示模板",
        collapsed: "默认折叠",
        icon: "图标",
        entity: "遥控实体",
        control_mode: "控制方式",
        power_entity: "开机状态实体",
        power_state_mode: "开机判断方式",
        power_on_states: "开机状态列表",
        power_threshold: "开机数值阈值",
        remote_device: "普通红外 remote 的 device",
        default_remote_commands: "未配置时自动发送默认命令",
        command_ok: "确定命令",
        command_up: "上命令",
        command_down: "下命令",
        command_left: "左命令",
        command_right: "右命令",
        command_settings: "设置命令",
        show_top_extra_buttons: "显示顶部额外按键",
        top_extra_1_label: "顶部按钮1名称",
        top_extra_1_icon: "顶部按钮1图标",
        top_extra_1_entity: "顶部按钮1状态实体",
        command_extra_1: "顶部按钮1命令",
        top_extra_2_label: "顶部按钮2名称",
        top_extra_2_icon: "顶部按钮2图标",
        top_extra_2_entity: "顶部按钮2状态实体",
        command_extra_2: "顶部按钮2命令",
        command_back: "返回命令",
        command_home: "主页命令",
        command_menu: "菜单命令",
        command_power: "电源命令",
        command_volume_up: "音量+命令",
        command_volume_down: "音量-命令",
        command_mute: "静音命令",
        show_buttons: "显示底部导航按键",
        show_volume: "显示音量按键",
        button_up: "上按钮实体",
        button_down: "下按钮实体",
        button_left: "左按钮实体",
        button_right: "右按钮实体",
        button_ok: "确定按钮实体",
        button_back: "返回按钮实体",
        button_home: "主页按钮实体",
        button_menu: "菜单按钮实体",
        button_settings: "设置按钮实体",
        button_power: "电源按钮实体",
        button_volume_up: "音量+按钮实体",
        button_volume_down: "音量-按钮实体",
        button_mute: "静音按钮实体",
        button_play: "播放按钮实体",
        button_pause: "暂停按钮实体",
        button_play_pause: "播放/暂停按钮实体",
        button_extra_1: "额外按钮1实体",
        button_extra_2: "额外按钮2实体",
        tilt_controls: "手机左倾时底部按钮靠左",
        tilt_threshold: "左倾触发角度",
        tilt_restore_threshold: "右倾恢复角度",
        vibrate: "震动反馈",
        debug: "调试信息",
      }[schema.name] || schema.name);
      this._form.addEventListener("value-changed", (event) => {
        event.stopPropagation();
        const config = { ...this.config, ...event.detail.value };
        this.config = config;
        this.dispatchEvent(new CustomEvent("config-changed", {
          detail: { config },
          bubbles: true,
          composed: true,
        }));
      });
    }
    this._form.hass = this._hass;
    this._form.data = this.config;
  }
}

if (!customElements.get("touchpad-card")) {
  customElements.define("touchpad-card", TouchpadCard);
}
if (!customElements.get("touchpad-card-editor")) {
  customElements.define("touchpad-card-editor", TouchpadCardEditor);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === "touchpad-card")) {
  window.customCards.push({
    type: "touchpad-card",
    name: "触控遥控器",
    description: "支持滑动、点击、双击、长按和遥控按键的触控板卡片。",
    preview: true,
  });
}
