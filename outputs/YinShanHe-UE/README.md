# 一印山河（YinShanHe）— Unreal Engine 5 C++ 原型

> **状态：UNCOMPILED（未编译）**  
> 当前环境未安装 Unreal Engine，因此本目录只完成了源码、配置和静态检查，未声称通过 UE 编译或运行验证。

这是一个完全由原生 C++ 在运行时搭建的单人桌面交互原型。空关卡进入 Play 后，`AYSHGameMode` 生成 `AYSHExperience`；后者用引擎基础几何体和 `UProceduralMeshComponent` 构建暖暗木作坊、宽桌、象牙色纸张、三层玉石山水、树木与桥。项目不依赖外部贴图、模型、字体、蓝图或二进制 UI 资源。

## 需要准备

- Windows 10/11。
- Unreal Engine **5.5 或更高的兼容版本**，并安装对应版本的 C++ 工具链。
- Visual Studio 2022，勾选“使用 C++ 的游戏开发”、MSVC、Windows SDK。
- UE 安装中启用 `ProceduralMeshComponent`、`Python Editor Script Plugin` 和 `Editor Scripting Utilities`。`.uproject` 已声明这些插件。

## 首次设置

以下示例假设 UE 安装在 `D:\Epic\UE_5.5`。脚本必须显式接收 `-EngineRoot`；它不会安装软件、删除文件，也不会猜测引擎路径。

```powershell
Set-Location ".\outputs\YinShanHe-UE"

# 1. 只检查项目文件和 EngineRoot 路径，不执行构建
.\BuildProject.ps1 -EngineRoot "D:\Epic\UE_5.5"

# 2. 生成 VS 工程并编译 Editor target
.\BuildProject.ps1 -EngineRoot "D:\Epic\UE_5.5" -GenerateProjectFiles -BuildEditor

# 3. 编译成功后，运行编辑器 Python：创建并保存空关卡和本地颜色材质
.\BuildProject.ps1 -EngineRoot "D:\Epic\UE_5.5" -Bootstrap
```

Bootstrap 会创建：

- `/Game/YinShanHe/Maps/L_YinShanHe`：空关卡；场景不会烘焙到关卡中，Play 时由 GameMode 构建。
- `/Game/YinShanHe/Materials/M_YSHColor`：仅含名为 `Color` 的 Vector Parameter 和固定 Roughness 的材质。若它暂时不存在，运行时代码会尝试使用 UE 自带 `/Engine/BasicShapes/BasicShapeMaterial`，同样设置 `Color` 参数。

完成后打开 `YinShanHe.uproject`，确认启动关卡为 `L_YinShanHe`，点击 Play。

## 操作与流程

- 按住鼠标左键，在象牙色纸张上拖动；光标射线与固定纸面平面相交，再映射到 18×12 网格。
- 每层只计算当前高亮格。格子覆盖是幂等的，重复涂刷不会重复累计。
- 一层全部覆盖后，输入短暂锁定，该层的程序化玉山从纸面升起。随后自动进入下一层。
- 三层依次组合山脊、树林/薄雾、河流/桥，第三层完成后进入最终观赏状态。
- `R` 或 `Space`：任何时候重置并重玩。
- 完成后按 `A` / `D`：绕最终微缩景观旋转固定相机。

HUD 使用引擎内置字体和英文，避免中文字体资产依赖。

## 源码结构

- `YSHGameMode`：配置原生 Controller/HUD，并在空关卡中生成体验 Actor。
- `YSHExperience`：构建场景、材质实例、网格与程序化山体；维护三阶段状态机、幂等覆盖、揭印动画、重置和相机环绕。
- `YSHPlayerController`：旧版 Input Mapping，鼠标反投影到已知纸面 Z 平面。
- `YSHHUD`：通过 `UCanvas` 绘制阶段、进度和操作提示。
- `Scripts/bootstrap_editor.py`：可重复执行的编辑器资产初始化脚本。

## 当前验证边界

已做的验证仅包括 JSON/INI/源码结构检查、模块和类引用一致性检查、PowerShell 语法解析以及 Python 字节码编译。由于本机无 UE，以下仍需在装有 UE 5.5+ 的机器上完成：

1. UnrealBuildTool 编译 `YinShanHeEditor Win64 Development`。
2. 执行 Bootstrap 并确认材质图与空关卡保存成功。
3. Editor Play-In-Editor 检查鼠标坐标、画面构图、三层完成动画、重置与最终相机环绕。

若使用比 5.5 更新的引擎且 UBT 提示 Include Order 版本变化，可保留 `EngineIncludeOrderVersion.Unreal5_5` 以维持 5.5 兼容顺序；不应改成只存在于新版本的枚举。

关键接口以 Epic 官方文档为准：[`LevelEditorSubsystem`（UE 5.5）](https://dev.epicgames.com/documentation/en-us/unreal-engine/python-api/class/LevelEditorSubsystem?application_version=5.5)、[`MaterialEditingLibrary`（UE 5.5）](https://dev.epicgames.com/documentation/en-us/unreal-engine/python-api/class/MaterialEditingLibrary?application_version=5.5)、[`CreateMeshSection_LinearColor`](https://dev.epicgames.com/documentation/en-us/unreal-engine/API/Plugins/ProceduralMeshComponent/UProceduralMeshComponent/CreateMeshSectio-?lang=en-US)。
