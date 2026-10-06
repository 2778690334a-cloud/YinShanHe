#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "YSHExperience.generated.h"

class UCameraComponent;
class UMaterialInstanceDynamic;
class UMaterialInterface;
class UProceduralMeshComponent;
class USceneComponent;
class UStaticMesh;
class UStaticMeshComponent;

USTRUCT()
struct FYSHGridCell
{
    GENERATED_BODY()

    UPROPERTY()
    TObjectPtr<UStaticMeshComponent> Visual;

    bool bTarget = false;
    bool bCovered = false;
};

USTRUCT()
struct FYSHRevealItem
{
    GENERATED_BODY()

    UPROPERTY()
    TObjectPtr<USceneComponent> Component;

    FVector HiddenLocation = FVector::ZeroVector;
    FVector ShownLocation = FVector::ZeroVector;
    FVector HiddenScale = FVector::OneVector;
    FVector ShownScale = FVector::OneVector;
    int32 Layer = 0;
};

UCLASS()
class YINSHANHE_API AYSHExperience : public AActor
{
    GENERATED_BODY()

public:
    AYSHExperience();
    virtual void BeginPlay() override;
    virtual void Tick(float DeltaSeconds) override;

    void ApplyBrushAtWorld(const FVector& WorldPoint);
    void ResetExperience();
    void OrbitCamera(float Value);

    float GetPaperZ() const { return PaperZ; }
    int32 GetStage() const { return Stage; }
    int32 GetCoveredCount() const { return CoveredCount; }
    int32 GetRequiredCount() const { return RequiredCount; }
    bool IsRevealing() const { return bRevealing; }
    bool IsComplete() const { return bComplete; }

private:
    void BuildScene();
    void BuildWorkshop();
    void BuildGrid();
    void BuildLandscape();
    void ConfigureStage();
    void MarkCell(int32 GridX, int32 GridY);
    void StartLayerReveal();
    bool IsCellInLayer(int32 GridX, int32 GridY, int32 Layer) const;

    UMaterialInstanceDynamic* MakeMaterial(const FLinearColor& Color, const TCHAR* Name);
    UStaticMeshComponent* AddPrimitive(UStaticMesh* Mesh, const FVector& Location, const FVector& Scale,
        UMaterialInterface* Material, const TCHAR* Name);
    UProceduralMeshComponent* AddMountain(const FVector& Location, float Radius, float Height, int32 Layer, const TCHAR* Name);
    void AddRevealItem(USceneComponent* Component, int32 Layer, const FVector& ShownLocation,
        const FVector& HiddenLocation, const FVector& ShownScale, const FVector& HiddenScale);

    UPROPERTY(VisibleAnywhere)
    TObjectPtr<USceneComponent> SceneRoot;

    UPROPERTY(VisibleAnywhere)
    TObjectPtr<USceneComponent> CameraPivot;

    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UCameraComponent> Camera;

    UPROPERTY()
    TArray<FYSHGridCell> GridCells;

    UPROPERTY()
    TArray<FYSHRevealItem> RevealItems;

    UPROPERTY()
    TObjectPtr<UMaterialInstanceDynamic> GuideMaterial;

    UPROPERTY()
    TArray<TObjectPtr<UMaterialInstanceDynamic>> InkMaterials;

    UPROPERTY()
    TObjectPtr<UMaterialInstanceDynamic> JadeMaterial;

    UPROPERTY()
    TObjectPtr<UMaterialInstanceDynamic> DarkJadeMaterial;

    static constexpr int32 GridColumns = 18;
    static constexpr int32 GridRows = 12;
    static constexpr float PaperHalfX = 480.0f;
    static constexpr float PaperHalfY = 280.0f;
    static constexpr float PaperZ = 60.0f;

    int32 Stage = 0;
    int32 CoveredCount = 0;
    int32 RequiredCount = 0;
    int32 RevealingLayer = INDEX_NONE;
    float RevealTime = 0.0f;
    bool bRevealing = false;
    bool bComplete = false;
    bool bBuilt = false;
};
