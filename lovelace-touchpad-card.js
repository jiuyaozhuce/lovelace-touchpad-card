/**
 * Touchpad Card - Lovelace Touchpad Card
 * Version: 1.7.3
 * 
 * Changelog:
 * v1.7.3 (2026-11-15):
 *   - 细线化改造，贴合 Home Assistant 官方设计语言（design tokens / Material 3）
 *   - 圆形按键：实心灰底 → 透明 + 1px hairline 描边；去掉位移、亮度滤镜与重阴影
 *   - 四向箭头：实心黑三角 → 1.5px 细线 chevron + 渐隐细线轨迹
 *   - 触控板：实心灰块 → 透明 + 1px 边框；按压只用淡色 state layer
 *   - 品牌 logo / 标题 / 分隔线 / 反馈光晕全部细线化、降对比度
 *   - 优先使用 HA 官方 --ha-* token，回退到 --divider-color / --primary-text-color 等旧变量
 *   - 功能、主题跟随、阔屏三栏布局、手势隔离均不变
 *
 * v1.7.2 (2026-11-15):
 *   - 默认不再显示「滑动控制上下左右，点击确定」等触控板提示文字
 *   - show_hint 默认值改为 false；显式写 show_hint: true 仍可开启并配合 hint_text 自定义
 *   - 触控板保留四向渐隐箭头与操作反馈图标，交互功能不变
 *
 * v1.7.1 (2026-11-15):
 *   - 修复触控板左右滑动时误触 HA 仪表盘视图切换（手势事件冒泡）
 *   - 卡片层拦截 touch/mouse/pointer 冒泡，window 捕获阶段兜底拦截 touch/mouse
 *   - 新增 block_view_swipe 配置（默认 true）
 *
 * v1.7.0 (2026-11-15):
 *   - 新增阔屏 / 矮屏自适应布局：左按键 + 中央触控板 + 右按键三栏，
 *     针对华为 Pura X Max 外屏 459x672vp、内屏 939x664vp 等宽而矮的屏幕
 *   - 卡片主体高度绑定 dvh，底部按键始终在首屏可见，无需下滑（避免滑动误触）
 *   - 竖版触控板高度改为随视口收敛，普通手机短屏也不会溢出
 *   - 新增 layout 配置：auto（默认）/ portrait（强制竖版）/ wide（强制三栏）
 *   - 通过 matchMedia + ResizeObserver 实时切换，开合屏 / 旋转无需刷新
 *
 * v1.6.1 (2026-11-15):
 *   - 外观默认改为 auto，跟随 Home Assistant 明暗主题；直接引用
 *     --ha-card-background / --primary-text-color 等主题变量，切换主题即时生效
 *   - appearance 新增 light 选项；dark / light 为强制固定外观
 *   - 依据 hass.themes.darkMode 调整阴影、高光与提示文字描边等细节
 *   - hass 未提供主题信息时（预览页 / 旧版 HA）回退 prefers-color-scheme
 *
 * v1.6.0 (2026-11-15):
 *   - 全新「小米电视遥控器」布局：顶部返回/品牌+设备名/更多菜单，
 *     电源与音量±三枚大圆按钮，中央大触控板，底部主页/返回/菜单
 *   - 触控板加入四向渐隐箭头与操作提示文字
 *   - 次要按键（通知、信号源、设置、静音、播放控制、状态详情）收纳进更多菜单
 *   - 完整保留滑动四方向、点击确定、倾斜换边、震动反馈、折叠模板、
 *     电源状态判定、四种控制模式以及全部 command_* / button_* 配置
 *   - 新增外观配置 appearance / hint_text / show_hint / show_more_menu /
 *     brand_label / brand_color，默认 auto 跟随 HA 主题
 *
 * v1.5.0 (2026-06-12):
 *   - 优化反馈图标样式，匹配 Home Assistant 官方设计风格
 *   - 减小反馈图标尺寸（76px → 56px）
 *   - 简化反馈图标（arrow-up-bold → arrow-up）
 *   - 优化反馈动画曲线（使用 MD3 标准缓动函数）
 *   - 添加微弱的科技感光晕效果
 *   - 优化按钮悬停和点击效果（添加阴影和位移）
 *   - 添加触控区域按下效果（is-pressing 类）
 *   - 改进整体视觉层次和用户体验
 * 
 * v1.4.2 (2026-06-12):
 *   - 修复语法错误（删除文件末尾非法的反斜杠字符）
 *   - 修复 'Invalid or unexpected token' 错误
 * 
 * v1.4.1 (2026-06-12):
 *   - 修复 button 模式下按钮不起作用的问题
 *   - 添加了对 command_* 配置的支持
 *   - 改进了错误提示和调试信息
 * 
 * GitHub: https://github.com/jiuyaozhuce/lovelace-touchpad-card
 */

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
      appearance: "auto",
      layout: "auto",
      block_view_swipe: true,
      hint_text: "滑动控制上下左右，点击确定",
      show_hint: false,
      show_more_menu: true,
      brand_label: "mi",
      brand_color: "#ff6900",
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
    this._menuOpen = false;
    this._feedback = "";
    this._debug = "";
    this._foldedTemplateText = "";
    this._foldedTemplateSource = "";
    this._foldedTemplatePending = "";
    this._foldedTemplateTimer = null;
    this._bottomDock = "right";
    this._orientationEnabled = false;
    this._lastRenderKey = "";
    this._wideLayout = this._computeWideLayout();
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
    // v1.7.1: 触控板的横向手势不能冒泡到 HA 的「左右滑动切换视图」。
    // 卡片只处理 pointer 事件，而 HA / Companion 的滑动导航监听的是 touch / mouse 事件，
    // 两套事件独立派发，所以必须在卡片层再拦一层。
    // 这些监听器注册在卡片自身（bubble 阶段）且早于下面的 pointer handlers：
    // stopPropagation 只阻止继续向祖先冒泡，不影响同一元素上的其它监听器。
    this._gestureEvents = [
      "touchstart", "touchmove", "touchend", "touchcancel",
      "mousedown", "mousemove", "mouseup",
      "pointerdown", "pointermove", "pointerup", "pointercancel",
    ];
    this._gestureEvents.forEach((type) => {
      this.addEventListener(type, this._blockGestureLeak, { passive: false });
    });
    // 兜底：部分实现把 touch 监听器挂在 window / document 的捕获阶段，卡片内部
    // 的 stopPropagation 来不及。window 捕获阶段一定早于 document 捕获 / hui-root，
    // 且卡片自身只用 pointer 事件，因此在这里截断 touch/mouse 不会影响滑动与点击。
    this._captureGestureEvents = [
      "touchstart", "touchmove", "touchend", "touchcancel",
      "mousedown", "mousemove", "mouseup",
    ];
    this._captureGestureEvents.forEach((type) => {
      window.addEventListener(type, this._blockGestureLeakCapture, { capture: true, passive: false });
    });
    this.addEventListener("click", this._handleClick);
    this.addEventListener("pointerdown", this._handlePointerDown);
    this.addEventListener("pointermove", this._handlePointerMove);
    this.addEventListener("pointerup", this._handlePointerUp);
    this.addEventListener("pointercancel", this._handlePointerCancel);
    this.addEventListener("contextmenu", this._preventContextMenu);
    this._handleOrientation = this._handleOrientation.bind(this);
    if (typeof window.matchMedia === "function") {
      this._layoutMedia = window.matchMedia("(min-aspect-ratio: 3/5), (max-height: 760px)");
      this._onLayoutChange = () => this._syncLayout();
      if (this._layoutMedia.addEventListener) {
        this._layoutMedia.addEventListener("change", this._onLayoutChange);
      }
    }
    if (typeof ResizeObserver !== "undefined") {
      this._layoutObserver = new ResizeObserver(() => this._syncLayout());
      this._layoutObserver.observe(this);
    }
  }

  disconnectedCallback() {
    (this._gestureEvents || []).forEach((type) =>
      this.removeEventListener(type, this._blockGestureLeak));
    (this._captureGestureEvents || []).forEach((type) =>
      window.removeEventListener(type, this._blockGestureLeakCapture, true));
    this.removeEventListener("click", this._handleClick);
    this.removeEventListener("pointerdown", this._handlePointerDown);
    this.removeEventListener("pointermove", this._handlePointerMove);
    this.removeEventListener("pointerup", this._handlePointerUp);
    this.removeEventListener("pointercancel", this._handlePointerCancel);
    this.removeEventListener("contextmenu", this._preventContextMenu);
    window.removeEventListener("deviceorientation", this._handleOrientation);
    window.clearTimeout(this._foldedTemplateTimer);
    window.clearTimeout(this._feedbackTimer);
    if (this._layoutMedia && this._onLayoutChange && this._layoutMedia.removeEventListener) {
      this._layoutMedia.removeEventListener("change", this._onLayoutChange);
    }
    if (this._layoutObserver) {
      this._layoutObserver.disconnect();
      this._layoutObserver = null;
    }
    this._connected = false;
    this._orientationEnabled = false;
    this._lastRenderKey = "";
  }

  getCardSize() {
    return this._folded ? 1 : 8;
  }

  _handleClick = (event) => {
    const button = event.target.closest("[data-action]");
    const header = event.target.closest("[data-toggle]");
    const moreInfo = event.target.closest("[data-more-info]");
    const menuToggle = event.target.closest("[data-menu-toggle]");
    if (this._ignoreClickUntil && Date.now() < this._ignoreClickUntil) {
      if (button || header || moreInfo || menuToggle) {
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }
    if (menuToggle) {
      event.preventDefault();
      event.stopPropagation();
      this._menuOpen = !this._menuOpen;
      this.render(true);
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
      this._menuOpen = false;
      this.render(true);
      return;
    }
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();
    const closeMenu = Boolean(button.closest(".more-menu"));
    this._runAction(button.dataset.action);
    if (closeMenu) {
      this._menuOpen = false;
      this.render(true);
    }
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
    
    // 添加按下效果
    if (this._touchpadArea) {
      this._touchpadArea.classList.add('is-pressing');
    }
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

    // 移除按下效果
    if (this._touchpadArea) {
      this._touchpadArea.classList.remove('is-pressing');
    }

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
    // 移除按下效果
    if (this._touchpadArea) {
      this._touchpadArea.classList.remove('is-pressing');
    }
  };

  _preventContextMenu = (event) => {
    if (event.target.closest(".touchpad-area")) event.preventDefault();
  };

  _isInsideCard(event) {
    const path = typeof event.composedPath === "function" ? event.composedPath() : [];
    if (path.includes(this)) return true;
    const target = event.target;
    return target instanceof Element && this.contains(target);
  }

  _isTouchpadEvent(event) {
    const path = typeof event.composedPath === "function" ? event.composedPath() : [];
    for (const node of path) {
      if (node === this) break;
      if (node instanceof Element && node.classList && node.classList.contains("touchpad-area")) {
        return true;
      }
    }
    const target = event.target;
    return target instanceof Element &&
      Boolean(target.closest(".touchpad-area")) && this.contains(target);
  }

  // 卡片层：截断冒泡，让 HA 的视图滑动导航收不到触控板手势。
  _blockGestureLeak = (event) => {
    if (this.config.block_view_swipe === false) return;
    if (!this._isInsideCard(event)) return;
    const inPad = this._isTouchpadEvent(event);
    // 按钮 / 顶栏区域不碰 mouse 事件，避免影响 HA 的点击与长按逻辑。
    if (event.type.startsWith("mouse") && !inPad) return;
    // 触控板内阻止默认滚动、边缘回弹与合成 click；触控板内没有按钮，
    // 「轻点确定」由 pointerup 触发，不依赖 click。
    if (inPad && event.cancelable) event.preventDefault();
    event.stopPropagation();
  };

  // 顶层兜底：window 捕获阶段，早于 document / hui-root 上的监听器。
  _blockGestureLeakCapture = (event) => {
    if (this.config.block_view_swipe === false) return;
    if (!this._isInsideCard(event) || !this._isTouchpadEvent(event)) return;
    if (event.cancelable) event.preventDefault();
    event.stopImmediatePropagation();
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
    // 最强震动：两段式脉冲，比单次长震动感觉更强
    navigator.vibrate([80, 50, 120]);
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
    if (!this.config) return;
    const powerState = this._hass?.states?.[this.config.power_entity];
    const isPoweredOn = this._isPoweredOn(powerState);
    const icon = this.querySelector(".status-icon");
    if (icon) {
      icon.classList.toggle("is-on", isPoweredOn);
      icon.style.color = isPoweredOn ? "var(--warning-color, #fdd835)" : "";
    }
    const powerButton = this.querySelector(".power-button");
    if (powerButton) powerButton.classList.toggle("is-on", isPoweredOn);
  }

  _getExtraButtonClass(name) {
    const entityId = this.config[`${name}_entity`];
    if (!entityId) return "";
    const state = this._hass?.states?.[entityId];
    if (!state) return "";
    const stateStr = String(state.state ?? "").toLowerCase();
    return ["on", "playing", "paused", "idle", "home", "standby"].includes(stateStr)
      ? "is-active"
      : "";
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

  _computeWideLayout() {
    const forced = String(this.config?.layout ?? "auto").toLowerCase();
    if (forced === "wide") return true;
    if (forced === "portrait") return false;
    const vw = window.innerWidth || 390;
    const vh = window.innerHeight || 844;
    const cardW = this.getBoundingClientRect().width || vw;
    if (cardW < 420) return false;
    // Short viewport (Pura X Max outer 459x672 / unfolded 939x664, minus HA chrome).
    const shortViewport = vh <= 760 && vw >= 380;
    // Genuinely wide viewport (e.g. unfolded inner screen 939x664).
    const wideViewport = vw >= 420 && vw / Math.max(vh, 1) >= 0.6;
    // Card placed in a wide dashboard column on desktop.
    const wideCard = cardW >= 560;
    return shortViewport || wideViewport || wideCard;
  }

  _syncLayout() {
    if (!this.config) return;
    const wide = this._computeWideLayout();
    if (wide === this._wideLayout) return;
    this._wideLayout = wide;
    this.render();
  }

  _resolveDarkMode() {
    const mode = String(this.config?.appearance ?? "auto").toLowerCase();
    if (mode === "dark") return true;
    if (mode === "light") return false;
    const hassDark = this._hass?.themes?.darkMode;
    if (typeof hassDark === "boolean") return hassDark;
    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  }

  render(force = false) {
    if (!this.config) return;
    this._scheduleFoldedTemplateUpdate();
    const state = this._hass?.states?.[this.config.entity];
    const powerState = this._hass?.states?.[this.config.power_entity];
    const isPoweredOn = this._isPoweredOn(powerState);
    const rawAppearance = String(this.config.appearance ?? "auto").toLowerCase();
    const appearance = rawAppearance === "dark" || rawAppearance === "light" ? rawAppearance : "auto";
    const darkMode = this._resolveDarkMode();
    const hintText = String(this.config.hint_text ?? "滑动控制上下左右，点击确定");
    const rawBrand = String(this.config.brand_color || "");
    const brandColor = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(rawBrand) ? rawBrand : "#ff6900";
    const brandLabel = String(this.config.brand_label ?? "mi");
    // v1.7.2: 提示文字默认关闭；只有显式 show_hint: true 且文字非空才渲染
    const showHint = this.config.show_hint === true && hintText.trim() !== "";
    const showMoreMenu = this.config.show_more_menu !== false;
    const menuOpen = Boolean(this._menuOpen) && showMoreMenu;
    const dock = this._bottomDock === "left" ? "dock-left" : "dock-right";
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
      appearance: appearance,
      layout: this._wideLayout ? "wide" : "portrait",
      dark_mode: darkMode,
      dock: this._bottomDock,
      menu_open: menuOpen,
    });
    if (!force && key === this._lastRenderKey) return;
    this._lastRenderKey = key;

    const menuItems = [];
    if (this.config.show_top_extra_buttons) {
      menuItems.push(this._menuItem("extra_1", this.config.top_extra_1_icon || "mdi:information-outline", this.config.top_extra_1_label || "信息", this._getExtraButtonClass("extra_1")));
      menuItems.push(this._menuItem("extra_2", this.config.top_extra_2_icon || "mdi:microphone", this.config.top_extra_2_label || "语音", this._getExtraButtonClass("extra_2")));
    }
    menuItems.push(this._menuItem("settings", "mdi:cog-outline", "设置"));
    menuItems.push(this._menuItem("mute", "mdi:volume-off", "静音"));
    menuItems.push(this._menuItem("play_pause", "mdi:play-pause", "播放/暂停"));
    menuItems.push(this._menuItem("play", "mdi:play", "播放"));
    menuItems.push(this._menuItem("pause", "mdi:pause", "暂停"));
    menuItems.push(`
      <button class="menu-item" data-more-info title="开机状态详情" aria-label="开机状态详情">
        <ha-icon class="status-icon" icon="${this._escape(this.config.icon || "mdi:information-outline")}"></ha-icon>
        <span>状态详情</span>
      </button>
    `);

    const circleSlot = `<span class="circle-slot"></span>`;
    const volumeButtons = this.config.show_volume
      ? this._button("volume_down", "mdi:volume-minus", "音量-", "circle-btn")
        + this._button("volume_up", "mdi:volume-plus", "音量+", "circle-btn")
      : circleSlot + circleSlot;

    this.innerHTML = `
      <ha-card class="touchpad-root appearance-${appearance} theme-${darkMode ? "dark" : "light"} layout-${this._wideLayout ? "wide" : "portrait"}">
        <div class="touchpad-card${this._folded ? " is-folded" : ""}" style="--brand-color: ${brandColor}">
          <div class="remote-head" data-toggle title="收起 / 展开">
            <button class="head-nav" title="${this._folded ? "展开" : "收起"}" aria-label="${this._folded ? "展开" : "收起"}">
              <ha-icon icon="${this._folded ? "mdi:chevron-down" : "mdi:arrow-left"}"></ha-icon>
            </button>
            <div class="head-title">
              <span class="brand-logo">${this._escape(brandLabel)}</span>
              <span class="title">${this._escape(this.config.name)}</span>
              ${this._folded ? this._foldedTemplate() : ""}
            </div>
            ${!this._folded && showMoreMenu ? `
              <button class="head-more" data-menu-toggle title="更多" aria-label="更多">
                <ha-icon icon="mdi:dots-vertical"></ha-icon>
              </button>
            ` : `<span class="head-more-slot"></span>`}
          </div>
          ${this._folded ? "" : `
            ${showMoreMenu ? `<div class="more-menu${menuOpen ? " is-open" : ""}">${menuItems.join("")}</div>` : ""}
            <div class="top-controls">
              ${this._button("power", "mdi:power", "电源", `circle-btn power-button${isPoweredOn ? " is-on" : ""}`)}
              ${volumeButtons}
            </div>
            <div class="touchpad-area${this._feedback ? " has-feedback" : ""}">
              <div class="direction-arrows" aria-hidden="true">
                <ha-icon class="arrow up" icon="mdi:chevron-up"></ha-icon>
                <ha-icon class="arrow down" icon="mdi:chevron-down"></ha-icon>
                <ha-icon class="arrow left" icon="mdi:chevron-left"></ha-icon>
                <ha-icon class="arrow right" icon="mdi:chevron-right"></ha-icon>
              </div>
              ${showHint ? `<div class="hint-text">${this._escape(hintText)}</div>` : ""}
              ${this.config.debug ? `<div class="debug">${this._escape(this._debug)}</div>` : ""}
              ${this._feedback ? `<div class="feedback ${this._escape(this._feedback)}">${this._feedbackIcon(this._feedback)}</div>` : ""}
            </div>
            ${this.config.show_buttons ? `
              <div class="bottom-controls ${dock}">
                ${this._button("home", "mdi:home-outline", "主页", "circle-btn nav-home")}
                ${this._button("back", "mdi:undo", "返回", "pill-btn")}
                ${this._button("menu", "mdi:menu", "菜单", "circle-btn nav-menu")}
              </div>
            ` : ""}
          `}
        </div>
        <style>
          /* v1.7.3 细线化：优先 HA 官方 design token，回退到旧主题变量，主题切换即时生效 */
          ha-card.touchpad-root {
            --tc-bg: var(--ha-card-background, var(--card-background-color, var(--primary-background-color, #fff)));
            --tc-text: var(--ha-color-text-primary, var(--primary-text-color, #212121));
            --tc-muted: var(--ha-color-text-secondary, var(--secondary-text-color, #727272));
            --tc-icon: var(--ha-color-text-secondary, var(--secondary-text-color, #727272));
            --tc-arrow: var(--ha-color-text-secondary, var(--secondary-text-color, #727272));
            --tc-menu-bg: var(--card-background-color, var(--primary-background-color, #fff));
            /* hairline：官方语义边框 token → 旧 divider → 中性淡色 */
            --tc-line: var(--ha-color-border-neutral-quiet, var(--divider-color, rgba(128, 128, 128, 0.22)));
            --tc-line-hover: color-mix(in srgb, var(--primary-color, #03a9f4) 42%, transparent);
            --tc-border: var(--tc-line);
            --tc-press: color-mix(in srgb, var(--primary-color, #03a9f4) 9%, transparent);
            /* 表面一律透明，靠 1px 细线勾勒，避免实心色块 */
            --tc-surface: transparent;
            --tc-pad: transparent;
            --tc-radius-card: var(--ha-border-radius-xl, 16px);
            --tc-radius-pad: var(--ha-border-radius-lg, 12px);
            --tc-radius-menu: var(--ha-border-radius-lg, 12px);
            --tc-hairline: 1px;
            display: block;
            background: var(--tc-bg);
            color: var(--tc-text);
            border-radius: var(--tc-radius-card);
            overflow: hidden;
            box-shadow: none;
            border: 0;
            transition: background-color 180ms ease, color 180ms ease;
          }
          /* 主题相关：仅保留极淡的浮层阴影，其余全部去掉 */
          ha-card.touchpad-root.theme-dark {
            --tc-shadow-menu: 0 6px 18px rgba(0, 0, 0, 0.28);
            --tc-shadow-btn: none;
            --tc-shadow-pad: none;
            --tc-shadow-pad-press: none;
            --tc-shadow-hint: none;
            --tc-shadow-feedback: none;
          }
          ha-card.touchpad-root.theme-light {
            --tc-shadow-menu: 0 6px 18px rgba(0, 0, 0, 0.08);
            --tc-shadow-btn: none;
            --tc-shadow-pad: none;
            --tc-shadow-pad-press: none;
            --tc-shadow-hint: none;
            --tc-shadow-feedback: none;
          }
          /* 强制外观：脱离 HA 主题变量，使用固定配色 */
          ha-card.touchpad-root.appearance-dark {
            --tc-bg: #171717;
            --tc-surface: transparent;
            --tc-pad: transparent;
            --tc-text: #f5f5f5;
            --tc-muted: rgba(255, 255, 255, 0.52);
            --tc-icon: rgba(255, 255, 255, 0.62);
            --tc-arrow: rgba(255, 255, 255, 0.55);
            --tc-menu-bg: #262626;
            --tc-border: rgba(255, 255, 255, 0.14);
            --tc-line: rgba(255, 255, 255, 0.14);
            --tc-line-hover: rgba(255, 255, 255, 0.32);
            --tc-press: rgba(255, 255, 255, 0.07);
          }
          ha-card.touchpad-root.appearance-light {
            --tc-bg: #ffffff;
            --tc-surface: transparent;
            --tc-pad: transparent;
            --tc-text: #212121;
            --tc-muted: #727272;
            --tc-icon: #5f6368;
            --tc-arrow: #7a7a7a;
            --tc-menu-bg: #ffffff;
            --tc-border: rgba(0, 0, 0, 0.12);
            --tc-line: rgba(0, 0, 0, 0.12);
            --tc-line-hover: rgba(3, 169, 244, 0.45);
            --tc-press: rgba(3, 169, 244, 0.07);
          }
          .touchpad-card {
            position: relative;
            padding: var(--ha-space-4, 16px) var(--ha-space-5, 20px) var(--ha-space-6, 24px);
            user-select: none;
            -webkit-user-select: none;
          }
          .touchpad-card.is-folded {
            padding-bottom: var(--ha-space-4, 16px);
          }
          .touchpad-card.is-folded .remote-head {
            border-bottom: 0;
            padding-bottom: 0;
          }
          /* ---------- 顶部栏：返回 / 品牌+名称 / 更多 ---------- */
          .remote-head {
            display: grid;
            grid-template-columns: 40px minmax(0, 1fr) 40px;
            align-items: center;
            gap: var(--ha-space-2, 8px);
            min-height: 48px;
            padding-bottom: var(--ha-space-2, 8px);
            border-bottom: var(--tc-hairline) solid var(--tc-line);
            cursor: pointer;
          }
          .head-nav,
          .head-more {
            display: inline-grid;
            place-items: center;
            width: 40px;
            height: 40px;
            padding: 0;
            border: 0;
            border-radius: 50%;
            background: transparent;
            color: var(--tc-muted);
            font: inherit;
            cursor: pointer;
            transition: background 140ms ease, color 140ms ease;
          }
          .head-nav:hover,
          .head-more:hover {
            background: var(--tc-press);
            color: var(--tc-text);
          }
          .head-nav:active,
          .head-more:active {
            transform: scale(0.9);
          }
          .head-nav ha-icon,
          .head-more ha-icon {
            --mdc-icon-size: 20px;
          }
          .head-more-slot {
            width: 40px;
            height: 40px;
          }
          .head-title {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            min-width: 0;
            overflow: hidden;
          }
          .brand-logo {
            display: inline-grid;
            place-items: center;
            flex: 0 0 auto;
            width: 22px;
            height: 22px;
            border: var(--tc-hairline) solid color-mix(in srgb, var(--brand-color, var(--tc-line)) 45%, transparent);
            border-radius: var(--ha-border-radius-sm, 4px);
            background: transparent;
            color: var(--tc-muted);
            font-size: var(--ha-font-size-xs, 10px);
            font-weight: var(--ha-font-weight-medium, 500);
            line-height: 1;
            letter-spacing: -0.4px;
          }
          .head-title .title {
            flex: 0 1 auto;
            min-width: 0;
            font-size: var(--ha-font-size-l, 16px);
            font-weight: var(--ha-font-weight-medium, 500);
            line-height: var(--ha-line-height-condensed, 1.2);
            color: var(--tc-text);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          /* ---------- 更多菜单（收纳全部次要按键） ---------- */
          .more-menu {
            display: none;
            position: absolute;
            top: 60px;
            right: 16px;
            z-index: 20;
            width: min(248px, calc(100% - 32px));
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 4px;
            padding: 8px;
            border: var(--tc-hairline) solid var(--tc-line);
            border-radius: var(--tc-radius-menu);
            background: var(--tc-menu-bg);
            box-shadow: var(--tc-shadow-menu);
          }
          .more-menu.is-open {
            display: grid;
          }
          .menu-item {
            display: flex;
            align-items: center;
            gap: 8px;
            min-height: 38px;
            padding: 6px 8px;
            border: 0;
            border-radius: 9px;
            background: transparent;
            color: var(--tc-text);
            font: inherit;
            font-size: 12px;
            text-align: left;
            cursor: pointer;
            transition: background 120ms ease, transform 120ms ease;
          }
          .menu-item:hover {
            background: var(--tc-press);
          }
          .menu-item:active {
            transform: scale(0.96);
          }
          .menu-item ha-icon {
            --mdc-icon-size: 19px;
            flex: 0 0 auto;
            color: var(--tc-icon);
          }
          .menu-item span {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .menu-item.is-active ha-icon {
            color: var(--success-color, #4caf50);
          }
          .menu-item .status-icon.is-on {
            color: var(--warning-color, #fdd835);
          }
          /* ---------- 大圆按钮 / 胶囊按钮 ---------- */
          .top-controls {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            justify-items: center;
            gap: clamp(8px, 4%, 28px);
            margin-top: clamp(18px, 6%, 32px);
          }
          .top-controls .circle-btn,
          .top-controls .circle-slot {
            width: 100%;
            max-width: 68px;
            aspect-ratio: 1 / 1;
          }
          .circle-slot {
            display: block;
          }
          .remote-button {
            display: inline-grid;
            place-items: center;
            box-sizing: border-box;
            padding: 0;
            border: var(--tc-hairline) solid var(--tc-line);
            background: var(--tc-surface);
            color: var(--tc-icon);
            font: inherit;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
            transition: background-color 140ms ease, border-color 140ms ease, color 140ms ease, transform 120ms ease;
          }
          .remote-button ha-icon {
            --mdc-icon-size: 24px;
          }
          .remote-button:hover {
            background: var(--tc-press);
            border-color: var(--tc-line-hover);
            color: var(--tc-text);
            filter: none;
            box-shadow: none;
          }
          .remote-button:active {
            background: var(--tc-press);
            border-color: var(--tc-line-hover);
            transform: scale(0.97);
            filter: none;
            box-shadow: none;
          }
          .circle-btn {
            border-radius: var(--ha-border-radius-circle, 50%);
          }
          .pill-btn {
            border-radius: var(--ha-border-radius-pill, 999px);
          }
          .power-button.is-on {
            color: var(--tc-text);
          }
          /* ---------- 中央触控板 ---------- */
          .touchpad-area {
            position: relative;
            box-sizing: border-box;
            width: 100%;
            height: clamp(220px, 44vh, 420px);
            height: clamp(220px, 44dvh, 420px);
            min-height: 0;
            margin-top: clamp(14px, 3%, 28px);
            border: var(--tc-hairline) solid var(--tc-line);
            border-radius: var(--tc-radius-pad);
            background: var(--tc-pad);
            overflow: hidden;
            touch-action: none;
            overscroll-behavior: contain;
            -webkit-user-select: none;
            user-select: none;
            transition: background-color 200ms ease, border-color 200ms ease;
            box-shadow: var(--tc-shadow-pad);
          }
          .touchpad-area.is-pressing {
            background: var(--tc-press);
            border-color: var(--tc-line-hover);
            box-shadow: var(--tc-shadow-pad-press);
          }
          .direction-arrows {
            position: absolute;
            inset: 0;
            z-index: 1;
            pointer-events: none;
            color: var(--tc-arrow);
            opacity: 0.72;
            transition: opacity 180ms ease;
          }
          /* v1.7.3: 直接使用 HA 原生 ha-icon chevron（细线），无实心三角、无旋转错位 */
          .arrow {
            position: absolute;
            --mdc-icon-size: 24px;
            color: var(--tc-arrow);
            pointer-events: none;
          }
          .arrow.up { top: 10px; left: 50%; transform: translateX(-50%); }
          .arrow.down { bottom: 10px; left: 50%; transform: translateX(-50%); }
          .arrow.left { left: 10px; top: 50%; transform: translateY(-50%); }
          .arrow.right { right: 10px; top: 50%; transform: translateY(-50%); }
          .hint-text {
            position: absolute;
            top: 50%;
            left: 50%;
            z-index: 2;
            transform: translate(-50%, -50%);
            color: var(--tc-muted);
            font-size: var(--ha-font-size-s, 12px);
            letter-spacing: 0.2px;
            text-shadow: none;
            white-space: nowrap;
            pointer-events: none;
            transition: opacity 180ms ease;
          }
          .touchpad-area.has-feedback .direction-arrows,
          .touchpad-area.has-feedback .hint-text {
            opacity: 0.16;
          }
          .debug {
            position: absolute;
            top: 10px;
            right: 12px;
            z-index: 5;
            color: var(--tc-muted);
            font-size: 11px;
            pointer-events: none;
          }
          /* ---------- 滑动反馈 ---------- */
          .feedback {
            position: absolute;
            inset: 0;
            z-index: 4;
            display: grid;
            place-items: center;
            pointer-events: none;
            color: var(--tc-text);
            animation: touchpad-feedback 620ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }
          .feedback::before {
            content: "";
            position: absolute;
            width: 72px;
            height: 72px;
            border-radius: 50%;
            border: var(--tc-hairline) solid var(--tc-line-hover);
            background: transparent;
            animation: feedback-glow 620ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }
          .feedback ha-icon {
            --mdc-icon-size: 32px;
            z-index: 1;
            color: var(--tc-muted);
            filter: none;
            animation: feedback-icon-enter 420ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }
          @keyframes feedback-glow {
            0% { opacity: 0; transform: scale(0.6); }
            40% { opacity: 1; transform: scale(1.1); }
            100% { opacity: 0; transform: scale(1.4); }
          }
          @keyframes feedback-icon-enter {
            0% { opacity: 0; transform: scale(0.8); }
            60% { opacity: 1; transform: scale(1.02); }
            100% { transform: scale(1); }
          }
          @keyframes touchpad-feedback {
            0% { opacity: 0; transform: scale(0.9); }
            12% { opacity: 1; transform: scale(1.01); }
            28% { transform: scale(1); }
            82% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(0.96); }
          }
          /* ---------- 底部三键 ---------- */
          .bottom-controls {
            display: grid;
            grid-template-columns: 1fr 2.6fr 1fr;
            align-items: center;
            justify-items: center;
            gap: clamp(10px, 3%, 28px);
            margin-top: clamp(20px, 6%, 36px);
          }
          .bottom-controls .circle-btn {
            width: 100%;
            max-width: 96px;
            aspect-ratio: 1 / 1;
          }
          .bottom-controls .pill-btn {
            width: 100%;
            min-height: 62px;
            height: 100%;
          }
          .bottom-controls.dock-left .nav-home {
            order: 3;
            grid-column: 3;
          }
          .bottom-controls.dock-left .nav-menu {
            order: 1;
            grid-column: 1;
          }
          .bottom-controls.dock-left .pill-btn {
            order: 2;
            grid-column: 2;
          }
          /* ---------- 折叠态模板跑马灯 ---------- */
          .folded-template {
            color: var(--tc-muted);
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
            color: var(--tc-muted);
          }
          @keyframes folded-template-marquee {
            0%, 12% { transform: translateX(0); }
            88%, 100% { transform: translateX(calc(-50% - 12px)); }
          }
          @media (max-width: 480px) {
            .touchpad-card {
              padding: var(--ha-space-3, 12px) var(--ha-space-4, 16px) var(--ha-space-5, 20px);
            }
            .remote-head {
              min-height: 44px;
            }
            .head-title .title {
              font-size: var(--ha-font-size-l, 16px);
            }
            .touchpad-area {
              height: clamp(200px, 40vh, 340px);
              height: clamp(200px, 40dvh, 340px);
              border-radius: var(--tc-radius-pad);
            }
            .hint-text {
              font-size: var(--ha-font-size-s, 12px);
            }
            .arrow {
              --mdc-icon-size: 22px;
            }
            .remote-button ha-icon {
              --mdc-icon-size: 24px;
            }
          }
          /* ---------- 阔屏 / 矮屏三栏布局（v1.7.0） ----------
             左：电源 + 音量±  中：大触控板  右：主页 + 返回 + 菜单
             高度绑定 dvh，底部按键始终在首屏内，无需下滑 */
          ha-card.touchpad-root.layout-wide .touchpad-card {
            box-sizing: border-box;
            display: grid;
            grid-template-columns: clamp(88px, 19%, 150px) minmax(0, 1fr) clamp(88px, 19%, 150px);
            grid-template-rows: auto minmax(0, 1fr);
            column-gap: 12px;
            row-gap: 10px;
            height: clamp(340px, 68vh, 500px);
            height: clamp(340px, 68dvh, 500px);
            padding: 12px 14px 14px;
            align-items: stretch;
          }
          ha-card.touchpad-root.layout-wide .touchpad-card.is-folded {
            display: block;
            height: auto;
            padding: 10px 16px;
          }
          ha-card.touchpad-root.layout-wide .remote-head {
            grid-column: 1 / -1;
            grid-row: 1;
            min-height: 40px;
          }
          ha-card.touchpad-root.layout-wide .top-controls,
          ha-card.touchpad-root.layout-wide .bottom-controls {
            grid-row: 2;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-evenly;
            gap: 6px;
            margin-top: 0;
          }
          ha-card.touchpad-root.layout-wide .top-controls { grid-column: 1; }
          ha-card.touchpad-root.layout-wide .bottom-controls { grid-column: 3; }
          ha-card.touchpad-root.layout-wide .bottom-controls.dock-left .nav-home,
          ha-card.touchpad-root.layout-wide .bottom-controls.dock-left .nav-menu,
          ha-card.touchpad-root.layout-wide .bottom-controls.dock-left .pill-btn {
            order: 0;
          }
          ha-card.touchpad-root.layout-wide .top-controls .circle-btn,
          ha-card.touchpad-root.layout-wide .top-controls .circle-slot,
          ha-card.touchpad-root.layout-wide .bottom-controls .circle-btn {
            width: clamp(48px, 76%, 64px);
            max-width: 64px;
            min-width: 0;
            flex: 0 0 auto;
          }
          ha-card.touchpad-root.layout-wide .top-controls .circle-slot {
            height: clamp(48px, 76%, 64px);
          }
          ha-card.touchpad-root.layout-wide .bottom-controls .pill-btn {
            width: clamp(48px, 76%, 64px);
            min-width: 0;
            height: 48px;
            min-height: 48px;
            flex: 0 0 auto;
          }
          ha-card.touchpad-root.layout-wide .remote-button ha-icon {
            --mdc-icon-size: 24px;
          }
          ha-card.touchpad-root.layout-wide .touchpad-area {
            grid-column: 2;
            grid-row: 2;
            width: 100%;
            height: 100%;
            min-height: 0;
            max-height: none;
            aspect-ratio: auto;
            margin-top: 0;
            border-radius: var(--tc-radius-pad);
          }
          ha-card.touchpad-root.layout-wide .hint-text {
            top: auto;
            bottom: 12px;
            transform: translateX(-50%);
            font-size: 11px;
          }
          ha-card.touchpad-root.layout-wide .arrow {
            --mdc-icon-size: 20px;
          }
          ha-card.touchpad-root.layout-wide .more-menu {
            top: 52px;
            right: 12px;
            width: min(240px, calc(100% - 24px));
          }
        </style>
      </ha-card>
    `;
    this._syncPowerStateIcon();
    this._touchpadArea = this.querySelector(".touchpad-area");
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

  _menuItem(action, icon, label, extraClass = "") {
    return `
      <button class="menu-item ${extraClass}" data-action="${this._escape(action)}" title="${this._escape(label)}" aria-label="${this._escape(label)}">
        <ha-icon icon="${this._escape(icon)}"></ha-icon>
        <span>${this._escape(label)}</span>
      </button>
    `;
  }

  _feedbackIcon(name) {
    const icon = {
      // 使用更简洁的图标，匹配 HA 官方风格
      up: "mdi:arrow-up",
      down: "mdi:arrow-down",
      left: "mdi:arrow-left",
      right: "mdi:arrow-right",
      tap: "mdi:gesture-tap",
      ok: "mdi:check-circle-outline",
      settings: "mdi:cog-outline",
      mute: "mdi:volume-mute",
      power: "mdi:power",
      menu: "mdi:menu",
      home: "mdi:home-outline",
      play: "mdi:play-outline",
      pause: "mdi:pause-outline",
      play_pause: "mdi:play-pause",
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
      appearance: "auto",
      layout: "auto",
      block_view_swipe: true,
      hint_text: "滑动控制上下左右，点击确定",
      show_hint: false,
      show_more_menu: true,
      brand_label: "mi",
      brand_color: "#ff6900",
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
        { name: "layout", selector: { select: { options: [
          { value: "auto", label: "自动（阔屏三栏 / 普通手机竖版，默认）" },
          { value: "portrait", label: "强制竖版（参考图布局）" },
        { name: "wide", label: "强制三栏宽屏布局" },
        ] } } },
        { name: "block_view_swipe", selector: { boolean: {} } },
        { name: "appearance", selector: { select: { options: [
          { value: "auto", label: "跟随 HA 主题（默认）" },
          { value: "dark", label: "强制深色遥控器" },
          { value: "light", label: "强制浅色遥控器" },
        ] } } },
        { name: "hint_text", selector: { text: {} } },
        { name: "show_hint", selector: { boolean: {} } },
        { name: "show_more_menu", selector: { boolean: {} } },
        { name: "brand_label", selector: { text: {} } },
        { name: "brand_color", selector: { text: {} } },
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
        appearance: "外观",
        hint_text: "触控板提示文字",
        show_hint: "显示提示文字（默认关闭）",
        show_more_menu: "显示更多菜单",
        brand_label: "品牌标识文字",
        brand_color: "品牌标识颜色",
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


const CARD_VERSION = "1.7.3";

console.info(
  `%c Touchpad Card %c v${CARD_VERSION} `,
  `color: white; background: #03a9f4; padding: 3px 0; border-radius: 3px 0 0 3px;`,
  `color: white; background: #4caf50; padding: 3px 0; border-radius: 0 3px 3px 0;`
);

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
    description: "小米遥控器风格的滑动触控板卡片，支持点击、倾斜与自定义命令。",
    preview: true,
  });
}
