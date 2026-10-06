#pragma once

#include "CoreMinimal.h"
#include "GameFramework/HUD.h"
#include "YSHHUD.generated.h"

UCLASS()
class YINSHANHE_API AYSHHUD : public AHUD
{
    GENERATED_BODY()

public:
    virtual void DrawHUD() override;
};
