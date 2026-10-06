[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$EngineRoot,

    [switch]$GenerateProjectFiles,
    [switch]$BuildEditor,
    [switch]$Bootstrap
)

$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$projectFile = Join-Path $projectRoot 'YinShanHe.uproject'
$engineRootResolved = [System.IO.Path]::GetFullPath($EngineRoot)
$batchDir = Join-Path $engineRootResolved 'Engine\Build\BatchFiles'
$editorBinary = Join-Path $engineRootResolved 'Engine\Binaries\Win64\UnrealEditor-Cmd.exe'
$generateScript = Join-Path $batchDir 'GenerateProjectFiles.bat'
$buildScript = Join-Path $batchDir 'Build.bat'
$bootstrapScript = Join-Path $projectRoot 'Scripts\bootstrap_editor.py'

Write-Host "Project: $projectFile"
Write-Host "Engine:  $engineRootResolved"

if (-not (Test-Path -LiteralPath $projectFile -PathType Leaf)) {
    throw "Project file is missing: $projectFile"
}
if (-not (Test-Path -LiteralPath $engineRootResolved -PathType Container)) {
    throw "EngineRoot is not a directory: $engineRootResolved"
}

if (-not ($GenerateProjectFiles -or $BuildEditor -or $Bootstrap)) {
    Write-Host 'Checks passed. No action selected. Add -GenerateProjectFiles, -BuildEditor, or -Bootstrap.'
    exit 0
}

if ($GenerateProjectFiles) {
    if (-not (Test-Path -LiteralPath $generateScript -PathType Leaf)) {
        throw "GenerateProjectFiles.bat was not found: $generateScript"
    }
    & $generateScript -project="$projectFile" -game -engine
    if ($LASTEXITCODE -ne 0) { throw "Project generation failed with exit code $LASTEXITCODE" }
}

if ($BuildEditor) {
    if (-not (Test-Path -LiteralPath $buildScript -PathType Leaf)) {
        throw "Build.bat was not found: $buildScript"
    }
    & $buildScript YinShanHeEditor Win64 Development -Project="$projectFile" -WaitMutex -FromMsBuild
    if ($LASTEXITCODE -ne 0) { throw "Editor build failed with exit code $LASTEXITCODE" }
}

if ($Bootstrap) {
    if (-not (Test-Path -LiteralPath $editorBinary -PathType Leaf)) {
        throw "UnrealEditor-Cmd.exe was not found: $editorBinary"
    }
    & $editorBinary $projectFile -Unattended -NoSplash -NullRHI -ExecutePythonScript="$bootstrapScript"
    if ($LASTEXITCODE -ne 0) { throw "Bootstrap failed with exit code $LASTEXITCODE" }
}

Write-Host 'Requested YinShanHe setup actions completed.'
