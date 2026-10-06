"""Create the source project's only generated editor assets: an empty map and color material.

Run through UnrealEditor-Cmd.exe after the native editor target has been built.
Safe to run repeatedly; existing assets are reused and saved.
"""

import unreal


ROOT = "/Game/YinShanHe"
MAP_PATH = f"{ROOT}/Maps/L_YinShanHe"
MATERIAL_DIR = f"{ROOT}/Materials"
MATERIAL_PATH = f"{MATERIAL_DIR}/M_YSHColor"


def ensure_directory(path: str) -> None:
    if not unreal.EditorAssetLibrary.does_directory_exist(path):
        unreal.EditorAssetLibrary.make_directory(path)


def ensure_color_material() -> None:
    ensure_directory(MATERIAL_DIR)
    if unreal.EditorAssetLibrary.does_asset_exist(MATERIAL_PATH):
        unreal.log(f"YinShanHe: reusing {MATERIAL_PATH}")
        return

    tools = unreal.AssetToolsHelpers.get_asset_tools()
    material = tools.create_asset(
        "M_YSHColor",
        MATERIAL_DIR,
        unreal.Material,
        unreal.MaterialFactoryNew(),
    )
    if not material:
        raise RuntimeError("Could not create M_YSHColor")

    color = unreal.MaterialEditingLibrary.create_material_expression(
        material, unreal.MaterialExpressionVectorParameter, -320, -40
    )
    color.set_editor_property("parameter_name", "Color")
    color.set_editor_property("default_value", unreal.LinearColor(0.25, 0.5, 0.35, 1.0))
    unreal.MaterialEditingLibrary.connect_material_property(
        color, "", unreal.MaterialProperty.MP_BASE_COLOR
    )

    roughness = unreal.MaterialEditingLibrary.create_material_expression(
        material, unreal.MaterialExpressionConstant, -320, 120
    )
    roughness.set_editor_property("r", 0.72)
    unreal.MaterialEditingLibrary.connect_material_property(
        roughness, "", unreal.MaterialProperty.MP_ROUGHNESS
    )
    unreal.MaterialEditingLibrary.recompile_material(material)
    unreal.EditorAssetLibrary.save_loaded_asset(material, only_if_is_dirty=False)
    unreal.log(f"YinShanHe: created {MATERIAL_PATH} with vector parameter Color")


def ensure_empty_level() -> None:
    ensure_directory(f"{ROOT}/Maps")
    subsystem = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
    if unreal.EditorAssetLibrary.does_asset_exist(MAP_PATH):
        if not subsystem.load_level(MAP_PATH):
            raise RuntimeError(f"Could not load existing level {MAP_PATH}")
        unreal.log(f"YinShanHe: reusing {MAP_PATH}")
    else:
        if not subsystem.new_level(MAP_PATH):
            raise RuntimeError(f"Could not create level {MAP_PATH}")
        unreal.log(f"YinShanHe: created empty level {MAP_PATH}")

    if not subsystem.save_current_level():
        raise RuntimeError(f"Could not save level {MAP_PATH}")


def main() -> None:
    ensure_color_material()
    ensure_empty_level()
    unreal.EditorAssetLibrary.save_directory(ROOT, only_if_is_dirty=False, recursive=True)
    unreal.log("YinShanHe bootstrap complete. GameMode will construct the scene at runtime.")


if __name__ == "__main__":
    main()
