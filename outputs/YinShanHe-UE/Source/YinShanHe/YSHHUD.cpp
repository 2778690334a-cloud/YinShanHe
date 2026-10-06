#include "YSHHUD.h"
#include "YSHPlayerController.h"
#include "YSHExperience.h"
#include "Engine/Canvas.h"
#include "Engine/Engine.h"

void AYSHHUD::DrawHUD()
{
    Super::DrawHUD();
    if (!Canvas || !GEngine) return;

    const AYSHPlayerController* PC = Cast<AYSHPlayerController>(PlayerOwner);
    const AYSHExperience* Experience = PC ? PC->GetExperience() : nullptr;
    UFont* Font = GEngine->GetMediumFont();
    const float X = 38.0f;
    const float Y = 34.0f;

    DrawRect(FLinearColor(0.025f, 0.018f, 0.012f, 0.88f), 20.0f, 18.0f, 480.0f, 122.0f);
    DrawText(TEXT("YIN SHAN HE / MOUNTAINS IN ONE IMPRESSION"), FLinearColor(0.90f, 0.82f, 0.64f), X, Y, Font, 0.92f, false);

    if (!Experience)
    {
        DrawText(TEXT("Preparing the workshop..."), FLinearColor::White, X, Y + 34.0f, Font, 0.82f, false);
        return;
    }

    FString Status;
    if (Experience->IsComplete())
    {
        Status = TEXT("PRINT COMPLETE  |  R / SPACE: replay  |  A / D: orbit");
    }
    else if (Experience->IsRevealing())
    {
        Status = FString::Printf(TEXT("Layer %d / 3 setting into jade..."), Experience->GetStage() + 1);
    }
    else
    {
        Status = FString::Printf(TEXT("Layer %d / 3  |  Brush highlighted cells: %d / %d"),
            Experience->GetStage() + 1, Experience->GetCoveredCount(), Experience->GetRequiredCount());
    }
    DrawText(Status, FLinearColor::White, X, Y + 34.0f, Font, 0.84f, false);
    DrawText(TEXT("Hold LEFT MOUSE and drag across the ivory paper.  R resets."), FLinearColor(0.72f, 0.76f, 0.68f), X, Y + 68.0f, Font, 0.72f, false);
}
