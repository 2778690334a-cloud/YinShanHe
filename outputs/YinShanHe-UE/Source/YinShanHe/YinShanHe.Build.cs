using UnrealBuildTool;

public class YinShanHe : ModuleRules
{
    public YinShanHe(ReadOnlyTargetRules Target) : base(Target)
    {
        PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;
        PublicDependencyModuleNames.AddRange(new[]
        {
            "Core", "CoreUObject", "Engine", "InputCore", "ProceduralMeshComponent"
        });
    }
}
