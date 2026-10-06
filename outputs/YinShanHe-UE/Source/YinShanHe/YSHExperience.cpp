#include "YSHExperience.h"
#include "Camera/CameraComponent.h"
#include "Components/DirectionalLightComponent.h"
#include "Components/PointLightComponent.h"
#include "Components/SceneComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Engine/DirectionalLight.h"
#include "Engine/PointLight.h"
#include "Engine/StaticMesh.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "Materials/MaterialInterface.h"
#include "ProceduralMeshComponent.h"

namespace
{
    constexpr float RevealDuration = 1.35f;
}

AYSHExperience::AYSHExperience()
{
    PrimaryActorTick.bCanEverTick = true;

    SceneRoot = CreateDefaultSubobject<USceneComponent>(TEXT("SceneRoot"));
    SetRootComponent(SceneRoot);

    CameraPivot = CreateDefaultSubobject<USceneComponent>(TEXT("CameraPivot"));
    CameraPivot->SetupAttachment(SceneRoot);

    Camera = CreateDefaultSubobject<UCameraComponent>(TEXT("Camera"));
    Camera->SetupAttachment(CameraPivot);
    Camera->SetRelativeLocation(FVector(0.0f, -1060.0f, 760.0f));
    Camera->SetRelativeRotation((FVector(0.0f, 0.0f, 35.0f) - Camera->GetRelativeLocation()).Rotation());
    Camera->FieldOfView = 43.0f;
}

void AYSHExperience::BeginPlay()
{
    Super::BeginPlay();
    BuildScene();
    ResetExperience();
}

UMaterialInstanceDynamic* AYSHExperience::MakeMaterial(const FLinearColor& Color, const TCHAR* Name)
{
    UMaterialInterface* Base = LoadObject<UMaterialInterface>(nullptr,
        TEXT("/Game/YinShanHe/Materials/M_YSHColor.M_YSHColor"));
    if (!Base)
    {
        Base = LoadObject<UMaterialInterface>(nullptr, TEXT("/Engine/BasicShapes/BasicShapeMaterial.BasicShapeMaterial"));
    }
    UMaterialInstanceDynamic* Material = Base ? UMaterialInstanceDynamic::Create(Base, this, FName(Name)) : nullptr;
    if (Material)
    {
        // Both the generated material and UE's BasicShapeMaterial expose this vector parameter.
        Material->SetVectorParameterValue(TEXT("Color"), Color);
    }
    return Material;
}

UStaticMeshComponent* AYSHExperience::AddPrimitive(UStaticMesh* Mesh, const FVector& Location, const FVector& Scale,
    UMaterialInterface* Material, const TCHAR* Name)
{
    UStaticMeshComponent* Component = NewObject<UStaticMeshComponent>(this, FName(Name));
    Component->SetupAttachment(SceneRoot);
    Component->SetStaticMesh(Mesh);
    Component->SetRelativeLocation(Location);
    Component->SetRelativeScale3D(Scale);
    Component->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    Component->SetCastShadow(true);
    if (Material) Component->SetMaterial(0, Material);
    AddInstanceComponent(Component);
    Component->RegisterComponent();
    return Component;
}

void AYSHExperience::BuildScene()
{
    if (bBuilt) return;
    bBuilt = true;

    GuideMaterial = MakeMaterial(FLinearColor(0.29f, 0.33f, 0.27f), TEXT("MI_Guide"));
    InkMaterials.Add(MakeMaterial(FLinearColor(0.18f, 0.38f, 0.30f), TEXT("MI_InkLayer1")));
    InkMaterials.Add(MakeMaterial(FLinearColor(0.28f, 0.54f, 0.40f), TEXT("MI_InkLayer2")));
    InkMaterials.Add(MakeMaterial(FLinearColor(0.48f, 0.70f, 0.53f), TEXT("MI_InkLayer3")));
    JadeMaterial = MakeMaterial(FLinearColor(0.23f, 0.56f, 0.39f), TEXT("MI_Jade"));
    DarkJadeMaterial = MakeMaterial(FLinearColor(0.10f, 0.30f, 0.23f), TEXT("MI_DarkJade"));

    BuildWorkshop();
    BuildGrid();
    BuildLandscape();
}

void AYSHExperience::BuildWorkshop()
{
    UStaticMesh* Cube = LoadObject<UStaticMesh>(nullptr, TEXT("/Engine/BasicShapes/Cube.Cube"));
    UMaterialInstanceDynamic* Timber = MakeMaterial(FLinearColor(0.13f, 0.055f, 0.025f), TEXT("MI_Timber"));
    UMaterialInstanceDynamic* DarkTimber = MakeMaterial(FLinearColor(0.035f, 0.018f, 0.012f), TEXT("MI_DarkTimber"));
    UMaterialInstanceDynamic* Paper = MakeMaterial(FLinearColor(0.90f, 0.84f, 0.70f), TEXT("MI_IvoryPaper"));
    UMaterialInstanceDynamic* Brass = MakeMaterial(FLinearColor(0.50f, 0.32f, 0.12f), TEXT("MI_Brass"));

    AddPrimitive(Cube, FVector(0, 0, 25), FVector(12.0f, 7.6f, 0.50f), Timber, TEXT("BroadDesk"));
    AddPrimitive(Cube, FVector(0, 0, 54), FVector(10.2f, 6.2f, 0.08f), Paper, TEXT("IvoryPaper"));
    AddPrimitive(Cube, FVector(0, 430, 420), FVector(15.0f, 0.35f, 8.0f), DarkTimber, TEXT("BackWall"));
    AddPrimitive(Cube, FVector(-680, 0, 330), FVector(0.35f, 9.0f, 6.6f), DarkTimber, TEXT("LeftWall"));
    AddPrimitive(Cube, FVector(680, 0, 330), FVector(0.35f, 9.0f, 6.6f), DarkTimber, TEXT("RightWall"));
    AddPrimitive(Cube, FVector(-535, 305, 118), FVector(0.22f, 0.22f, 1.25f), Brass, TEXT("ToolLeft"));
    AddPrimitive(Cube, FVector(535, 305, 118), FVector(0.22f, 0.22f, 1.25f), Brass, TEXT("ToolRight"));

    UPointLightComponent* WarmLight = NewObject<UPointLightComponent>(this, TEXT("WarmWorkshopLight"));
    WarmLight->SetupAttachment(SceneRoot);
    WarmLight->SetRelativeLocation(FVector(-260, -250, 620));
    WarmLight->SetIntensity(5200.0f);
    WarmLight->SetAttenuationRadius(1800.0f);
    WarmLight->SetLightColor(FLinearColor(1.0f, 0.56f, 0.30f));
    WarmLight->SetCastShadows(true);
    AddInstanceComponent(WarmLight);
    WarmLight->RegisterComponent();

    UPointLightComponent* FillLight = NewObject<UPointLightComponent>(this, TEXT("JadeFillLight"));
    FillLight->SetupAttachment(SceneRoot);
    FillLight->SetRelativeLocation(FVector(420, 120, 440));
    FillLight->SetIntensity(2400.0f);
    FillLight->SetAttenuationRadius(1200.0f);
    FillLight->SetLightColor(FLinearColor(0.40f, 0.72f, 0.56f));
    FillLight->SetCastShadows(false);
    AddInstanceComponent(FillLight);
    FillLight->RegisterComponent();
}

void AYSHExperience::BuildGrid()
{
    UStaticMesh* Cube = LoadObject<UStaticMesh>(nullptr, TEXT("/Engine/BasicShapes/Cube.Cube"));
    const float CellWidth = (PaperHalfX * 2.0f) / GridColumns;
    const float CellHeight = (PaperHalfY * 2.0f) / GridRows;
    GridCells.Reserve(GridColumns * GridRows);

    for (int32 Y = 0; Y < GridRows; ++Y)
    {
        for (int32 X = 0; X < GridColumns; ++X)
        {
            const FVector Location(-PaperHalfX + (X + 0.5f) * CellWidth,
                -PaperHalfY + (Y + 0.5f) * CellHeight, PaperZ + 0.8f);
            const FVector Scale(CellWidth * 0.0087f, CellHeight * 0.0082f, 0.012f);
            UStaticMeshComponent* Tile = AddPrimitive(Cube, Location, Scale, GuideMaterial,
                *FString::Printf(TEXT("PrintCell_%02d_%02d"), X, Y));
            Tile->SetCastShadow(false);
            Tile->SetVisibility(false);
            FYSHGridCell& Cell = GridCells.AddDefaulted_GetRef();
            Cell.Visual = Tile;
        }
    }
}

bool AYSHExperience::IsCellInLayer(int32 X, int32 Y, int32 Layer) const
{
    if (Layer == 0)
    {
        const float Ridge = 6.2f + 2.0f * FMath::Sin(X * 0.55f) + 0.8f * FMath::Sin(X * 1.7f);
        return X >= 1 && X <= 16 && Y >= 2 && Y <= FMath::RoundToInt(Ridge);
    }
    if (Layer == 1)
    {
        const bool GroveA = FMath::Square(X - 5) + FMath::Square(Y - 7) <= 10;
        const bool GroveB = FMath::Square(X - 13) + FMath::Square(Y - 8) <= 12;
        const bool Mist = Y == 3 && X >= 4 && X <= 14 && (X % 2 == 0);
        return GroveA || GroveB || Mist;
    }
    const int32 RiverY = 4 + FMath::RoundToInt(1.3f * FMath::Sin(X * 0.55f));
    const bool River = X >= 1 && X <= 16 && FMath::Abs(Y - RiverY) <= 1;
    const bool Bridge = X >= 6 && X <= 12 && (Y == 5 || Y == 6);
    return River || Bridge;
}

void AYSHExperience::ConfigureStage()
{
    CoveredCount = 0;
    RequiredCount = 0;
    for (int32 Y = 0; Y < GridRows; ++Y)
    {
        for (int32 X = 0; X < GridColumns; ++X)
        {
            FYSHGridCell& Cell = GridCells[Y * GridColumns + X];
            Cell.bCovered = false;
            Cell.bTarget = !bComplete && IsCellInLayer(X, Y, Stage);
            if (Cell.bTarget) ++RequiredCount;
            Cell.Visual->SetVisibility(Cell.bTarget);
            Cell.Visual->SetMaterial(0, GuideMaterial);
        }
    }
}

void AYSHExperience::ApplyBrushAtWorld(const FVector& WorldPoint)
{
    if (bComplete || bRevealing) return;
    const FVector LocalPoint = GetActorTransform().InverseTransformPosition(WorldPoint);
    if (FMath::Abs(LocalPoint.X) > PaperHalfX || FMath::Abs(LocalPoint.Y) > PaperHalfY) return;

    const float CellWidth = (PaperHalfX * 2.0f) / GridColumns;
    const float CellHeight = (PaperHalfY * 2.0f) / GridRows;
    const int32 CenterX = FMath::FloorToInt((LocalPoint.X + PaperHalfX) / CellWidth);
    const int32 CenterY = FMath::FloorToInt((LocalPoint.Y + PaperHalfY) / CellHeight);

    for (int32 OffsetY = -1; OffsetY <= 1; ++OffsetY)
    {
        for (int32 OffsetX = -1; OffsetX <= 1; ++OffsetX)
        {
            MarkCell(CenterX + OffsetX, CenterY + OffsetY);
        }
    }
}

void AYSHExperience::MarkCell(int32 X, int32 Y)
{
    if (X < 0 || X >= GridColumns || Y < 0 || Y >= GridRows || bRevealing) return;
    FYSHGridCell& Cell = GridCells[Y * GridColumns + X];
    if (!Cell.bTarget || Cell.bCovered) return;

    Cell.bCovered = true;
    ++CoveredCount;
    Cell.Visual->SetMaterial(0, InkMaterials[Stage]);

    if (CoveredCount >= RequiredCount && RequiredCount > 0)
    {
        StartLayerReveal();
    }
}

void AYSHExperience::AddRevealItem(USceneComponent* Component, int32 Layer, const FVector& ShownLocation,
    const FVector& HiddenLocation, const FVector& ShownScale, const FVector& HiddenScale)
{
    FYSHRevealItem& Item = RevealItems.AddDefaulted_GetRef();
    Item.Component = Component;
    Item.Layer = Layer;
    Item.ShownLocation = ShownLocation;
    Item.HiddenLocation = HiddenLocation;
    Item.ShownScale = ShownScale;
    Item.HiddenScale = HiddenScale;
    Component->SetRelativeLocation(HiddenLocation);
    Component->SetRelativeScale3D(HiddenScale);
    Component->SetVisibility(false, true);
}

UProceduralMeshComponent* AYSHExperience::AddMountain(const FVector& Location, float Radius, float Height,
    int32 Layer, const TCHAR* Name)
{
    UProceduralMeshComponent* Mesh = NewObject<UProceduralMeshComponent>(this, FName(Name));
    Mesh->SetupAttachment(SceneRoot);
    Mesh->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    Mesh->SetCastShadow(true);
    AddInstanceComponent(Mesh);
    Mesh->RegisterComponent();

    constexpr int32 Segments = 12;
    TArray<FVector> Vertices;
    TArray<int32> Triangles;
    TArray<FVector> Normals;
    TArray<FVector2D> UVs;
    TArray<FLinearColor> Colors;
    TArray<FProcMeshTangent> Tangents;

    for (int32 Ring = 0; Ring < 2; ++Ring)
    {
        const float RingHeight = Ring == 0 ? 0.0f : Height * 0.58f;
        const float RingRadius = Ring == 0 ? Radius : Radius * 0.48f;
        for (int32 Segment = 0; Segment < Segments; ++Segment)
        {
            const float Angle = 2.0f * PI * Segment / Segments;
            const float Irregularity = 1.0f + 0.12f * FMath::Sin(Segment * 2.31f + Layer * 0.9f);
            const FVector Vertex(FMath::Cos(Angle) * RingRadius * Irregularity,
                FMath::Sin(Angle) * RingRadius * Irregularity, RingHeight);
            Vertices.Add(Vertex);
            Normals.Add(FVector(Vertex.X / Radius, Vertex.Y / Radius, 0.45f).GetSafeNormal());
            UVs.Add(FVector2D(static_cast<float>(Segment) / Segments, static_cast<float>(Ring)));
            Colors.Add(FLinearColor::White);
            Tangents.Add(FProcMeshTangent(-FMath::Sin(Angle), FMath::Cos(Angle), 0.0f));
        }
    }
    const int32 PeakIndex = Vertices.Add(FVector(0, 0, Height));
    Normals.Add(FVector::UpVector);
    UVs.Add(FVector2D(0.5f, 1.0f));
    Colors.Add(FLinearColor::White);
    Tangents.Add(FProcMeshTangent(1, 0, 0));

    for (int32 Segment = 0; Segment < Segments; ++Segment)
    {
        const int32 Next = (Segment + 1) % Segments;
        Triangles.Add(Segment);
        Triangles.Add(Next);
        Triangles.Add(Segments + Segment);
        Triangles.Add(Next);
        Triangles.Add(Segments + Next);
        Triangles.Add(Segments + Segment);
        Triangles.Add(Segments + Segment);
        Triangles.Add(Segments + Next);
        Triangles.Add(PeakIndex);
    }
    Mesh->CreateMeshSection_LinearColor(0, Vertices, Triangles, Normals, UVs, Colors, Tangents, false, false);
    if (JadeMaterial) Mesh->SetMaterial(0, JadeMaterial);
    AddRevealItem(Mesh, Layer, Location, FVector(Location.X, Location.Y, PaperZ - 7.0f),
        FVector::OneVector, FVector(1.0f, 1.0f, 0.02f));
    return Mesh;
}

void AYSHExperience::BuildLandscape()
{
    AddMountain(FVector(-330, 70, PaperZ), 108, 245, 0, TEXT("Mountain_L1_A"));
    AddMountain(FVector(-165, 118, PaperZ), 120, 315, 0, TEXT("Mountain_L1_B"));
    AddMountain(FVector(15, 90, PaperZ), 96, 210, 0, TEXT("Mountain_L1_C"));
    AddMountain(FVector(205, 130, PaperZ), 128, 270, 0, TEXT("Mountain_L1_D"));
    AddMountain(FVector(365, 82, PaperZ), 82, 175, 0, TEXT("Mountain_L1_E"));

    AddMountain(FVector(-380, -80, PaperZ), 65, 130, 1, TEXT("Mountain_L2_A"));
    AddMountain(FVector(-55, -35, PaperZ), 73, 155, 1, TEXT("Mountain_L2_B"));
    AddMountain(FVector(315, -55, PaperZ), 76, 145, 1, TEXT("Mountain_L2_C"));

    AddMountain(FVector(-250, -165, PaperZ), 48, 95, 2, TEXT("Mountain_L3_A"));
    AddMountain(FVector(255, -175, PaperZ), 52, 105, 2, TEXT("Mountain_L3_B"));

    UStaticMesh* Cube = LoadObject<UStaticMesh>(nullptr, TEXT("/Engine/BasicShapes/Cube.Cube"));
    UStaticMesh* Cylinder = LoadObject<UStaticMesh>(nullptr, TEXT("/Engine/BasicShapes/Cylinder.Cylinder"));
    UStaticMesh* Sphere = LoadObject<UStaticMesh>(nullptr, TEXT("/Engine/BasicShapes/Sphere.Sphere"));

    const FVector TreeLocations[] = {
        FVector(-405, -105, PaperZ), FVector(-340, -135, PaperZ), FVector(-95, -110, PaperZ),
        FVector(45, -85, PaperZ), FVector(285, -110, PaperZ), FVector(365, -135, PaperZ)
    };
    for (int32 Index = 0; Index < UE_ARRAY_COUNT(TreeLocations); ++Index)
    {
        const FVector Base = TreeLocations[Index];
        UStaticMeshComponent* Trunk = AddPrimitive(Cylinder, Base + FVector(0, 0, 36),
            FVector(0.10f, 0.10f, 0.72f), DarkJadeMaterial, *FString::Printf(TEXT("TreeTrunk_%d"), Index));
        AddRevealItem(Trunk, 1, Base + FVector(0, 0, 36), Base,
            FVector(0.10f, 0.10f, 0.72f), FVector(0.10f, 0.10f, 0.02f));
        UStaticMeshComponent* Crown = AddPrimitive(Sphere, Base + FVector(0, 0, 93),
            FVector(0.38f, 0.38f, 0.62f), JadeMaterial, *FString::Printf(TEXT("TreeCrown_%d"), Index));
        AddRevealItem(Crown, 1, Base + FVector(0, 0, 93), Base + FVector(0, 0, 8),
            FVector(0.38f, 0.38f, 0.62f), FVector(0.12f, 0.12f, 0.04f));
    }

    UStaticMeshComponent* BridgeDeck = AddPrimitive(Cube, FVector(20, -95, PaperZ + 48),
        FVector(3.0f, 0.32f, 0.11f), DarkJadeMaterial, TEXT("BridgeDeck"));
    AddRevealItem(BridgeDeck, 2, FVector(20, -95, PaperZ + 48), FVector(20, -95, PaperZ),
        FVector(3.0f, 0.32f, 0.11f), FVector(0.05f, 0.32f, 0.03f));
    for (int32 Side = -1; Side <= 1; Side += 2)
    {
        for (int32 X = -1; X <= 1; X += 2)
        {
            const FVector PostLocation(20 + X * 125.0f, -95 + Side * 22.0f, PaperZ + 31.0f);
            UStaticMeshComponent* Post = AddPrimitive(Cylinder, PostLocation, FVector(0.07f, 0.07f, 0.58f),
                DarkJadeMaterial, *FString::Printf(TEXT("BridgePost_%d_%d"), Side, X));
            AddRevealItem(Post, 2, PostLocation, FVector(PostLocation.X, PostLocation.Y, PaperZ),
                FVector(0.07f, 0.07f, 0.58f), FVector(0.07f, 0.07f, 0.02f));
        }
    }
}

void AYSHExperience::StartLayerReveal()
{
    bRevealing = true;
    RevealingLayer = Stage;
    RevealTime = 0.0f;
    for (FYSHGridCell& Cell : GridCells) Cell.Visual->SetVisibility(false);
    for (FYSHRevealItem& Item : RevealItems)
    {
        if (Item.Layer == RevealingLayer)
        {
            Item.Component->SetRelativeLocation(Item.HiddenLocation);
            Item.Component->SetRelativeScale3D(Item.HiddenScale);
            Item.Component->SetVisibility(true, true);
        }
    }
}

void AYSHExperience::Tick(float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);
    if (!bRevealing) return;

    RevealTime += DeltaSeconds;
    const float Alpha = FMath::Clamp(RevealTime / RevealDuration, 0.0f, 1.0f);
    const float Eased = FMath::InterpEaseOut(0.0f, 1.0f, Alpha, 3.0f);
    for (FYSHRevealItem& Item : RevealItems)
    {
        if (Item.Layer == RevealingLayer)
        {
            Item.Component->SetRelativeLocation(FMath::Lerp(Item.HiddenLocation, Item.ShownLocation, Eased));
            Item.Component->SetRelativeScale3D(FMath::Lerp(Item.HiddenScale, Item.ShownScale, Eased));
        }
    }

    if (Alpha >= 1.0f)
    {
        bRevealing = false;
        ++Stage;
        if (Stage >= 3)
        {
            Stage = 3;
            bComplete = true;
            CoveredCount = RequiredCount;
        }
        else
        {
            ConfigureStage();
        }
    }
}

void AYSHExperience::ResetExperience()
{
    if (!bBuilt) return;
    Stage = 0;
    CoveredCount = 0;
    RequiredCount = 0;
    RevealingLayer = INDEX_NONE;
    RevealTime = 0.0f;
    bRevealing = false;
    bComplete = false;
    CameraPivot->SetRelativeRotation(FRotator::ZeroRotator);

    for (FYSHRevealItem& Item : RevealItems)
    {
        Item.Component->SetRelativeLocation(Item.HiddenLocation);
        Item.Component->SetRelativeScale3D(Item.HiddenScale);
        Item.Component->SetVisibility(false, true);
    }
    ConfigureStage();
}

void AYSHExperience::OrbitCamera(float Value)
{
    if (bComplete)
    {
        CameraPivot->AddLocalRotation(FRotator(0.0f, Value * 0.65f, 0.0f));
    }
}
