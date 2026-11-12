# Refreshes the bank sheet from the LIVE game and regenerates the page (see docs/BANK_SHEET.md).
#
#   .\tools\bank-sheet\refresh.ps1 -Drafts "C:\Users\weibi\minitude\list-build\batch1\bank.json=Batch 1"
#
# What it does:
#   1. asks the Fly machine for a consistent copy of the live database (the project's own `db backup`, into its own folder),
#   2. downloads it, then deletes the copy on Fly again (nothing else on the machine is touched),
#   3. builds the page from that copy plus any draft files you list.
# Publishing the page is a separate step (Claude does it with the Artifact tool, same file, same link).
param(
  # draft question files from the builder, each "path\bank.json=Label"
  [string[]]$Drafts = @(),
  [string]$Out = 'C:\Users\weibi\minitude\list-build\sheet',
  [string]$App = 'minitude-lwb',
  [string]$Fly = 'C:\Users\weibi\.fly\bin\flyctl.exe'
)
# not 'Stop': Windows PowerShell 5.1 treats flyctl's harmless "Connecting to ..." line on stderr as an error. Every step is checked by hand below.
$ErrorActionPreference = 'Continue'
$repo = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
New-Item -ItemType Directory -Force $Out | Out-Null
$remoteDir = '/data/sheet-snapshot'

# 1. a consistent copy of the live database (no double quotes inside the -C command: Windows PowerShell 5.1 mangles them)
$makeCopy = "sh -c 'cd /app/packages/server && DATABASE_FILE=/data/minitude.db node --import tsx src/cli.ts db backup $remoteDir'"
$said = (& $Fly ssh console --app $App -C $makeCopy) -join "`n"
if ($said -notmatch 'Backup written: (\S+\.db)') { throw "the live copy was not made: $said" }
$remoteFile = $Matches[1]

# 2. download it, then remove it from the Fly volume
$local = Join-Path $Out 'live-snapshot.db'
Remove-Item $local -ErrorAction SilentlyContinue
& $Fly ssh sftp get $remoteFile $local --app $App
if (-not (Test-Path $local)) { throw 'the download failed' }
& $Fly ssh console --app $App -C "sh -c 'rm -r $remoteDir'" | Out-Null

# 3. the page
$asOf = (Get-Date).ToString('d MMM yyyy', [System.Globalization.CultureInfo]'en-US')
$gen = @('tsx', 'src/cli/banksheet.ts', '--db', $local, '--out', (Join-Path $Out 'bank-sheet.html'), '--asof', $asOf)
foreach ($d in $Drafts) { $gen += @('--drafts', $d) }
Push-Location (Join-Path $repo 'packages\server')
try { & npx @gen } finally { Pop-Location }
Write-Host "Done. Publish $Out\bank-sheet.html (same file, same link) so the page matches."
