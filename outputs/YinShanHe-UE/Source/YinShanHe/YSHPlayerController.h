#pragma once

#include "CoreMinimal.h"
#include "GameFramework/PlayerController.h"
#include "YSHPlayerController.generated.h"

class AYSHExperience;

UCLASS()
class YINSHANHE_API AYSHPlayerController : public APlayerController
{
    GENERATED_BODY()

public:
    AYSHPlayerController();
    virtual void BeginPlay() override;
    virtual void PlayerTick(float DeltaTime) override;
    virtual void SetupInputComponent() override;

    UFUNCTION(BlueprintPure)
    AYSHExperience* GetExperience() const { return Experience; }

private:
    void BrushPressed();
    void BrushReleased();
    void ResetPressed();
    void Orbit(float Value);
    void ResolveExperience();

    UPROPERTY()
    TObjectPtr<AYSHExperience> Experience;

    bool bBrushHeld = false;
};
