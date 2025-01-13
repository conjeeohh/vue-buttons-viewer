# Vue Buttons Viewer

一个用于查看和管理 Vue 文件中按钮的 VSCode 扩展。

## 功能特性

- 🔍 自动识别 Vue 文件中的所有 `el-button` 组件
- 🎯 快速定位按钮在代码中的位置
- 🔒 显示按钮的权限信息（v-hasPermi）
- 🎨 根据按钮类型显示不同图标
- 🔄 实时更新按钮列表

### 按钮识别
- 识别所有 `el-button` 组件
- 提取按钮文本内容
- 解析按钮类型（primary、danger、warning 等）
- 识别点击事件
- 解析权限指令（v-hasPermi）

### 可视化展示
- 在 VSCode 活动栏中添加 "Vue Buttons" 图标
- 树形结构展示按钮列表
- 按钮图标根据类型自动变化
- 权限信息以子节点形式展示
- 悬停提示显示按钮详细信息

### 交互功能
- 点击按钮跳转到对应代码位置
- 手动刷新按钮列表
- 自动跟踪文件变化并更新

## 使用方法

1. 安装扩展后，在 VSCode 左侧活动栏中会出现 "Vue Buttons" 图标
2. 打开任意 Vue 文件，扩展会自动识别文件中的按钮
3. 点击按钮可以快速跳转到对应代码位置
4. 展开带有权限的按钮可以查看权限列表
5. 使用面板顶部的刷新按钮可以手动更新按钮列表

## 按钮信息说明

每个按钮节点都包含以下信息：
- 按钮文本：显示为节点主要文本
- 按钮类型：通过图标颜色区分
  - Primary：蓝色方法图标
  - Danger：红色错误图标
  - Warning：黄色警告图标
  - 默认：灰色事件图标
- 权限信息：作为子节点显示
- 位置信息：在悬停提示中显示行号
- 点击事件：在悬停提示中显示事件处理函数

## 自动更新

扩展会在以下情况自动更新按钮列表：
- 切换到其他 Vue 文件时
- 编辑当前文件内容时
- 保存文件时
- 首次打开文件时

## 要求

- VSCode 版本 >= 1.80.0
- 文件类型必须是 Vue 单文件组件（.vue）

## 已知问题

- 暂不支持动态生成的按钮
- 暂不支持自定义组件中的按钮

## 更新日志

### 0.0.1
- 初始版本发布
- 实现基本的按钮识别和展示功能
- 添加权限解析功能
- 实现实时更新功能

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个扩展。

## 许可证

MIT