# Touchpad Card（触控遥控器卡片）v1.6.0

一个支持滑动手势的 Home Assistant 遥控器卡片。**v1.6.0 起采用「小米电视遥控器」布局**：深色面板、大圆按钮、中央大触控板。

> 仓库内的 `preview-v1.6.0.html` 是单文件自包含预览页，直接用浏览器打开即可看到新版外观（预览页用 Unicode 近似图标，HA 里显示真正的 MDI 图标）。

## 界面布局

```
┌─────────────────────────────────┐
│  ←         [mi] 小米电视      ⋮  │  顶部栏：收起/展开 · 品牌标+设备名 · 更多
│                                 │
│    (电源)      (音量−)    (音量＋) │  三枚大圆按钮
│                                 │
│  ┌───────────────────────────┐  │
│  │            ▲              │  │
│  │                           │  │  中央触控板
│  │  ◀  滑动控制上下左右，点击确定 ▶  │  │  四向渐隐箭头 + 提示文字
│  │            ▼              │  │  上下左右滑动 / 点击确定
│  └───────────────────────────┘  │
│                                 │
│   (主页)   ╭── 返回 ──╮   (菜单) │  底部三键
└─────────────────────────────────┘
```

「⋮ 更多」菜单收纳了所有次要按键，功能一个不少：通知（`extra_1`）、信号源（`extra_2`）、设置、静音、播放/暂停、播放、暂停、开机状态详情。

## 功能特点

- 🎯 触控板上下左右滑动 + 点击确定，滑动时显示方向反馈与光晕
- 📱 手机左倾时底部「主页 / 菜单」左右互换（`tilt_controls`），右倾恢复
- 🔔 震动反馈（两段式脉冲）、按钮与触控板按压动效
- 📊 折叠态 + `folded_template` 模板跑马灯
- ⚡ 电源状态判定：自动 / 按状态 / 按数值阈值
- 🔧 四种控制模式：`remote`（红外）、`androidtv_remote`、`adb`、`button`
- 🎨 深色外观为默认，可切换 `appearance: auto` 跟随 HA 主题
- 🧩 全部 `command_*` / `button_*` / `service_data` / `command_play*` 配置继续可用

## 安装方法

### HACS（推荐）

1. HACS → 右上角三个点 → 自定义仓库
2. 添加 `https://github.com/jiuyaozhuce/lovelace-touchpad-card`，类别 `Lovelace`
3. 搜索 `Touchpad Card` 并安装，安装后刷新浏览器缓存

### 手动

把 `lovelace-touchpad-card.js`（或 `dist/` 里同一份文件）放到 `config/www/community/lovelace-touchpad-card/`，并在 Lovelace 资源中添加：

```yaml
url: /local/community/lovelace-touchpad-card/lovelace-touchpad-card.js
type: module
```

> 手动覆盖文件后记得把资源 URL 的 `?v=` 版本号改一下，否则浏览器会用旧缓存。

## 配置

### 最简配置

```yaml
type: custom:touchpad-card
name: 小米电视
entity: remote.living_room_tv
```

### 完整示例（与「影音」仪表盘电视标签一致）

```yaml
type: custom:touchpad-card
name: 小米电视
icon: mdi:television
entity: binary_sensor.tv_adb_online
power_entity: binary_sensor.tv_adb_online
power_state_mode: state
power_on_states: "on"
control_mode: button
collapsed: false
show_buttons: true
show_volume: true
show_top_extra_buttons: true
top_extra_1_label: 通知
top_extra_1_icon: mdi:message-text-outline
top_extra_2_label: 信号源
top_extra_2_icon: mdi:import
swipe_threshold: 36
tilt_controls: true
vibrate: true
appearance: dark
hint_text: 滑动控制上下左右，点击确定
command_up:
  service: shell_command.tv_key
  data: { key: up }
command_down:
  service: shell_command.tv_key
  data: { key: down }
command_left:
  service: shell_command.tv_key
  data: { key: left }
command_right:
  service: shell_command.tv_key
  data: { key: right }
command_ok:
  service: shell_command.tv_key
  data: { key: ok }
command_back:
  service: shell_command.tv_key
  data: { key: back }
command_home:
  service: shell_command.tv_key
  data: { key: home }
command_menu:
  service: shell_command.tv_key
  data: { key: menu }
command_power:
  service: shell_command.tv_key
  data: { key: shutdown }
command_volume_up:
  service: shell_command.tv_key
  data: { key: volumeup }
command_volume_down:
  service: shell_command.tv_key
  data: { key: volumedown }
command_mute:
  service: shell_command.tv_key
  data: { key: mute }
command_extra_1:
  service: shell_command.tv_key
  data: { key: notice }
command_extra_2:
  service: shell_command.tv_key
  data: { key: input }
```

## 配置项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `name` | string | 客厅电视遥控器 | 顶部显示的设备名 |
| `icon` | string | `mdi:remote-tv` | 状态详情图标 / 反馈图标 |
| `entity` | string | - | 遥控实体（`remote` / `media_player`） |
| `power_entity` | string | - | 开机状态实体 |
| `power_state_mode` | string | `auto` | `auto` / `state` / `threshold` |
| `power_on_states` | string | `on,playing,paused,idle,home,standby` | 判定为开机的状态 |
| `power_threshold` | number | `0` | 数值模式阈值 |
| `control_mode` | string | `remote` | `remote` / `androidtv_remote` / `adb` / `button` |
| `remote_device` | string | - | 红外 remote 的 device |
| `default_remote_commands` | boolean | `true` | 未配置时自动发送默认命令 |
| `collapsed` | boolean | `true` | 默认折叠 |
| `folded_template` | string | - | 折叠时显示的模板 |
| `show_buttons` | boolean | `true` | 显示底部三键 |
| `show_volume` | boolean | `true` | 显示顶部音量± |
| `show_top_extra_buttons` | boolean | `true` | 在「更多」菜单显示两个额外按键 |
| `top_extra_1_label` / `top_extra_1_icon` / `top_extra_1_entity` | string | 信息 | 额外按键 1 |
| `top_extra_2_label` / `top_extra_2_icon` / `top_extra_2_entity` | string | 语音 | 额外按键 2 |
| `swipe_threshold` | number | `36` | 滑动触发阈值（像素） |
| `tilt_controls` | boolean | `true` | 启用倾斜换边 |
| `tilt_threshold` / `tilt_restore_threshold` | number | `18` / `32` | 倾斜触发 / 恢复角度 |
| `vibrate` | boolean | `true` | 震动反馈 |
| `debug` | boolean | `false` | 显示调试信息 |
| `command_*` | object / string | - | 各动作的自定义服务调用 |
| `button_*` | string | - | `button` 模式下的按钮实体 |

### v1.6.0 新增外观项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `appearance` | `dark` / `auto` | `dark` | `dark` 为小米遥控器深色；`auto` 跟随 HA 主题变量 |
| `hint_text` | string | `滑动控制上下左右，点击确定` | 触控板中央提示文字 |
| `show_hint` | boolean | `true` | 是否显示提示文字 |
| `show_more_menu` | boolean | `true` | 是否显示「⋮ 更多」菜单 |
| `brand_label` | string | `mi` | 顶部橙色标识内文字 |
| `brand_color` | string | `#ff6900` | 顶部标识背景色（仅接受 hex） |

## 升级说明（v1.5.0 → v1.6.0）

- **纯布局 / 样式改造，原有 YAML 配置无需任何改动**，所有动作与命令照常生效。
- 原来挤在头部的一排小图标按钮（通知、信号源、设置、静音、电源）已拆分：电源与音量±变成顶部三枚大圆按钮，其余收进「⋮ 更多」菜单。
- `show_top_extra_buttons` 现在控制的是「更多」菜单里的两个额外按键；`show_buttons` / `show_volume` 含义不变。
- 点击顶部「←」或标题行可收起 / 展开卡片；折叠态仍支持 `folded_template`。
- 升级后请刷新浏览器，或在资源 URL 后追加新的 `?v=` 版本号。

## 疑难解答

**卡片不显示？** 检查实体 ID、JS 是否加载、浏览器控制台错误。

**样式还是旧的？** 浏览器缓存了旧 JS；HACS 重装或手动修改 `?v=` 后强刷。

**滑动不灵敏？** 调小 `swipe_threshold`。

**按钮无反应？** 确认 `command_*` / `button_*` 已配置，或开启 `default_remote_commands`；打开 `debug` 看提示。

## 许可证

MIT
