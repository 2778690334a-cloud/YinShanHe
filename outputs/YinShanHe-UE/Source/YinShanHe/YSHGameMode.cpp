#include "YSHGameMode.h"
#include "YSHExperience.h"
#include "YSHHUD.h"
#include "YSHPlayerController.h"
#include "Engine/World.h"

AYSHGameMode::AYSHGameMode()
{
    PlayerControllerClass = AYSHPlayerController::StaticClass();
    HUDClass = AYSHHUD::StaticClass();
    DefaultPawnClass = nullptr;
}

void AYSHGameMode::BeginPlay()
{
    Super::BeginPlay();

    if (UWorld* World = GetWorld())
    {
        FActorSpawnParameters Params;
        Params.Name = TEXT("YinShanHeExperience");
        Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;
        World->SpawnActor<AYSHExperience>(AYSHExperience::StaticClass(), FVector::ZeroVector, FRotator::ZeroRotator, Params);
    }
}
