#include "YSHPlayerController.h"
#include "YSHExperience.h"
#include "EngineUtils.h"

AYSHPlayerController::AYSHPlayerController()
{
    bShowMouseCursor = true;
    bEnableClickEvents = true;
    bEnableMouseOverEvents = true;
    PrimaryActorTick.bCanEverTick = true;
}

void AYSHPlayerController::BeginPlay()
{
    Super::BeginPlay();
    FInputModeGameAndUI Mode;
    Mode.SetHideCursorDuringCapture(false);
    Mode.SetLockMouseToViewportBehavior(EMouseLockMode::DoNotLock);
    SetInputMode(Mode);
    ResolveExperience();
}

void AYSHPlayerController::SetupInputComponent()
{
    Super::SetupInputComponent();
    InputComponent->BindAction(TEXT("Brush"), IE_Pressed, this, &AYSHPlayerController::BrushPressed);
    InputComponent->BindAction(TEXT("Brush"), IE_Released, this, &AYSHPlayerController::BrushReleased);
    InputComponent->BindAction(TEXT("Reset"), IE_Pressed, this, &AYSHPlayerController::ResetPressed);
    InputComponent->BindAxis(TEXT("Orbit"), this, &AYSHPlayerController::Orbit);
}

void AYSHPlayerController::ResolveExperience()
{
    if (Experience || !GetWorld()) return;
    for (TActorIterator<AYSHExperience> It(GetWorld()); It; ++It)
    {
        Experience = *It;
        SetViewTarget(Experience);
        break;
    }
}

void AYSHPlayerController::PlayerTick(float DeltaTime)
{
    Super::PlayerTick(DeltaTime);
    ResolveExperience();
    if (!bBrushHeld || !Experience) return;

    float MouseX = 0.0f;
    float MouseY = 0.0f;
    FVector RayOrigin;
    FVector RayDirection;
    if (GetMousePosition(MouseX, MouseY) && DeprojectScreenPositionToWorld(MouseX, MouseY, RayOrigin, RayDirection))
    {
        const float Denominator = RayDirection.Z;
        if (!FMath::IsNearlyZero(Denominator))
        {
            const float Distance = (Experience->GetPaperZ() - RayOrigin.Z) / Denominator;
            if (Distance > 0.0f)
            {
                Experience->ApplyBrushAtWorld(RayOrigin + RayDirection * Distance);
            }
        }
    }
}

void AYSHPlayerController::BrushPressed() { bBrushHeld = true; }
void AYSHPlayerController::BrushReleased() { bBrushHeld = false; }

void AYSHPlayerController::ResetPressed()
{
    ResolveExperience();
    if (Experience) Experience->ResetExperience();
}

void AYSHPlayerController::Orbit(float Value)
{
    ResolveExperience();
    if (Experience && !FMath::IsNearlyZero(Value)) Experience->OrbitCamera(Value);
}
