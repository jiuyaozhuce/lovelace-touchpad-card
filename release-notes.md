## 🐛 Bug 修复
- **修复 `button` 模式下按钮不起作用的问题** ⭐
  - 现在能正确读取 `button_*` 配置（如 `button_up`, `button_down` 等）
  - 修复了按钮动作触发的逻辑错误

- 改进错误处理，当按钮没有配置操作时会显示明确的调试信息

## ✨ 新功能
- **添加对 `command_*` 配置的支持**
  - 现在可以为 `extra_1`, `extra_2` 等自定义按钮配置复杂的服务调用
  - 示例：`command_extra_1` 可以配置为完整的服务调用对象

- **改进调试体验**
  - 启用 `debug: true` 后，卡片会显示详细的操作信息
  - 方便排查配置问题

## 📝 配置示例

### button 模式完整配置（推荐）

```yaml
type: custom:touchpad-card
name: 小米电视遥控器
entity: media_player.xiaomi_cn_902476673_mih1
control_mode: button
collapsed: false
show_buttons: true
show_volume: true
debug: true

# 按钮实体配置
button_up: button.xiaomi_cn_902476673_mih1_press_up_a_7_8
button_down: button.xiaomi_cn_902476673_mih1_press_down_a_7_9
button_left: button.xiaomi_cn_902476673_mih1_press_left_a_7_6
button_right: button.xiaomi_cn_902476673_mih1_press_right_a_7_7
button_ok: button.xiaomi_cn_902476673_mih1_press_ok_a_7_10
button_home: button.xiaomi_cn_902476673_mih1_press_home_a_7_2
button_menu: button.xiaomi_cn_902476673_mih1_press_menu_a_7_3
button_back: button.xiaomi_cn_902476673_mih1_press_back_a_7_5
button_settings: button.xiaomi_cn_902476673_mih1_press_settings_a_7_4
button_power: button.xiaomi_cn_902476673_mih1_turn_on_a_6_1
button_volume_up: button.xiaomi_cn_902476673_mih1_press_volume_up_a_7_12
button_volume_down: button.xiaomi_cn_902476673_mih1_press_volume_down_a_7_11
button_play_pause: button.xiaomi_cn_902476673_mih1_press_play_pause_a_7_16

# 自定义按钮（使用 command_* 配置）
top_extra_1_label: 音箱模式
top_extra_1_icon: mdi:speaker
command_extra_1:
  service: switch.toggle
  target:
    entity_id: switch.xiaomi_cn_902476673_mih1_is_on_p_8_1

top_extra_2_label: 关机
top_extra_2_icon: mdi:power-off
button_extra_2: button.xiaomi_cn_902476673_mih1_turn_off_a_7_1
```

## 🔧 升级说明

### 通过 HACS 更新
如果已通过 HACS 安装，HACS 会自动检测到新版本并提示更新。

### 手动更新
1. 下载最新的 `lovelace-touchpad-card.js` 文件
2. 替换 `config/www/` 目录下的旧文件
3. **重要**：清除浏览器缓存并强制刷新（`Ctrl + Shift + R` 或 `Cmd + Shift + R`）

### 验证安装
加载卡片后，打开浏览器控制台（F12），应该能看到：
```
Touchpad Card v1.4.1
```

## ⚠️ 注意事项

1. **清除缓存**：更新后务必清除浏览器缓存，否则可能加载旧版本代码
2. **检查配置**：如果使用 `button` 模式，确认 `button_*` 配置项正确
3. **调试模式**：如果遇到问题，启用 `debug: true` 查看详细错误信息

## 🙏 反馈

如果遇到问题，请在 GitHub Issues 中报告：
https://github.com/jiuyaozhuce/lovelace-touchpad-card/issues

---

**完整更新日志**: https://github.com/jiuyaozhuce/lovelace-touchpad-card/commits/main
