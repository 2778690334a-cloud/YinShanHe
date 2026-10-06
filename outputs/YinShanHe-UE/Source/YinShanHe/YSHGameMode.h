#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "YSHGameMode.generated.h"

UCLASS()
class YINSHANHE_API AYSHGameMode : public AGameModeBase
{
    GENERATED_BODY()

public:
    AYSHGameMode();
    virtual void BeginPlay() override;
};
