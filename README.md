# Touchpad Card (触控遥控器卡片)

一个支持触控手势的 Home Assistant 遥控器卡片，支持滑动、点击、长按等操作。

![Touchpad Card](https://via.placeholder.com/400x200/03a9f4/ffffff?text=Touchpad+Card)

## 功能特点

- 🎯 支持滑动手势（上、下、左、右）
- 👆 支持点击、双击、长按
- 📱 响应式设计，支持移动端
- 🎨 可自定义样式和图标
- 🔧 支持多种控制模式：
  - **红外 Remote 模式** - 控制 `remote.xxx` 实体
  - **Android TV Remote 模式** - 控制 Android TV
  - **ADB 模式** - 通过 ADB 命令控制
  - **按钮模式** - 触发 `button.xxx` 实体（新增！）
- 📊 支持模板显示
- 🔔 触觉反馈支持

## 安装方法

### 方法一：通过 HACS（推荐）

1. 打开 HACS 页面
2. 点击右上角的三个点
3. 选择 "自定义仓库"
4. 添加仓库：`https://github.com/jiuyaozhuce/lovelace-touchpad-card`
5. 选择类别：`Lovelace`
6. 点击 "添加"
7. 在 HACS 中搜索 "Touchpad Card" 并安装

### 方法二：手动安装

1. 下载 `lovelace-touchpad-card.js` 文件
2. 将其放到 `config/www/community/lovelace-touchpad-card/` 目录
3. 在 Lovelace 资源中添加：
   ```yaml
   url: /local/community/lovelace-touchpad-card/lovelace-touchpad-card.js
   type: module
   ```

## 配置

### 基础配置

```yaml
type: custom:touchpad-card
name: 客厅电视遥控器
entity: remote.living_room_tv
icon: mdi:remote-tv
```

### 完整配置示例

```yaml
type: custom:touchpad-card
name: 客厅电视遥控器
entity: remote.living_room_tv
icon: mdi:remote-tv
collapsed: true
power_entity: media_player.living_room_tv
power_state_mode: auto
control_mode: remote
remote_device: ""
show_buttons: true
show_volume: true
show_top_extra_buttons: true
default_remote_commands: true
swipe_threshold: 36
tilt_controls: true
tilt_threshold: 18
vibrate: true
top_extra_1_label: 信息
top_extra_1_icon: mdi:information-outline
top_extra_2_label: 语音
top_extra_2_icon: mdi:microphone
```

### 按钮模式配置示例（新增）

```yaml
type: custom:touchpad-card
name: 客厅电视遥控器
control_mode: button
button_up: button.tv_up
button_down: button.tv_down
button_ok: button.tv_ok
button_left: button.tv_left
button_right: button.tv_right
button_back: button.tv_back
button_home: button.tv_home
button_menu: button.tv_menu
button_power: button.tv_power
button_volume_up: button.tv_volume_up
button_volume_down: button.tv_volume_down
button_mute: button.tv_mute
```

## 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `name` | string | - | 卡片名称 |
| `entity` | string | - | 遥控实体（remote 或 media_player） |
| `icon` | string | `mdi:remote-tv` | 卡片图标 |
| `collapsed` | boolean | `true` | 默认是否折叠 |
| `power_entity` | string | - | 开机状态实体 |
| `control_mode` | string | `remote` | 控制模式：`remote`/`androidtv_remote`/`adb`/`button` |
| `remote_device` | string | - | 红外 remote 的 device 名称 |
| `show_buttons` | boolean | `true` | 显示底部导航按键 |
| `show_volume` | boolean | `true` | 显示音量按键 |
| `default_remote_commands` | boolean | `true` | 未配置时自动发送默认命令 |
| `swipe_threshold` | number | `36` | 滑动触发阈值（像素） |
| `tilt_controls` | boolean | `true` | 启用手机倾斜控制 |
| `vibrate` | boolean | `true` | 启用震动反馈 |
| `button_*` | string | - | 按钮模式下的按钮实体（如 `button_up`、`button_ok` 等） |

## 控制模式详解

### 1. Remote 模式（默认）
适用于普通红外遥控器，使用 `remote.send_command` 服务。

### 2. Android TV Remote 模式
适用于 Android TV，使用标准的 KeyEvent 命令。

### 3. ADB 模式
通过 ADB 命令控制 Android 设备，使用 `androidtv.adb_command` 服务。

### 4. Button 模式（新增）
直接触发 Home Assistant 中的按钮实体，使用 `button.press` 服务。

适用于设备通过按钮实体控制的情况，例如：
- 智能电视的按钮实体
- 自定义脚本的按钮
- 任何支持 `button.press` 的实体

## 自定义命令

你可以为各个操作自定义命令：

```yaml
type: custom:touchpad-card
entity: remote.living_room_tv
command_up: "UP"
command_down: "DOWN"
command_left: "LEFT"
command_right: "RIGHT"
command_ok: "OK"
command_back: "BACK"
command_home: "HOME"
command_menu: "MENU"
```

## 模板支持

你可以在折叠状态下显示自定义模板：

```yaml
type: custom:touchpad-card
folded_template: |
  {% set state = states('media_player.living_room_tv') %}
  当前状态：{{ state }}
```

## 疑难解答

**Q: 卡片不显示？**
- 检查实体 ID 是否正确
- 确认 JS 文件已正确加载
- 查看浏览器控制台是否有错误

**Q: 滑动不灵敏？**
- 调整 `swipe_threshold` 参数
- 检查设备触控屏是否正常工作

**Q: HACS 找不到卡片？**
- 确认已正确添加自定义仓库
- 检查 `hacs.json` 配置是否正确

**Q: 按钮模式不工作？**
- 确认按钮实体存在且可用
- 检查实体 ID 是否正确
- 查看 Home Assistant 日志

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 支持

如果你觉得这个卡片有用，请给我一个 ⭐️！
