$ErrorActionPreference = 'Stop'
$daywellRoot = Split-Path -Parent $PSScriptRoot
$daywellVars = Join-Path $daywellRoot '.dev.vars'
Write-Host 'Connect Daywell to ElevenLabs' -ForegroundColor Magenta
Write-Host 'Your API key stays in an ignored local file. It is never printed or sent to chat.'
Write-Host 'Use an agent dedicated to Daywell. Type NEW to create one with the prepared Daywell instructions.'
$daywellAgentId = (Read-Host 'Existing agent ID, or NEW').Trim()
if ($daywellAgentId -ne 'NEW' -and $daywellAgentId -notmatch '^[a-zA-Z0-9_-]{5,100}$') { throw 'Please use a valid agent ID.' }
$daywellSecureKey = Read-Host 'ElevenLabs API key (hidden)' -AsSecureString
$daywellPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($daywellSecureKey)
try {
  $daywellKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($daywellPointer).Trim()
  if ($daywellKey -notmatch '^[a-zA-Z0-9_-]{16,256}$') { throw 'The key format was not recognised. Nothing was saved.' }
  $daywellHeaders = @{ 'xi-api-key' = $daywellKey }
  if ($daywellAgentId -eq 'NEW') {
    $daywellConfig = Get-Content -Raw -LiteralPath (Join-Path $daywellRoot 'config/daywell-agent.json')
    try {
      $daywellCreated = Invoke-RestMethod -Uri 'https://api.elevenlabs.io/v1/convai/agents/create' -Method Post -Headers $daywellHeaders -ContentType 'application/json' -Body ([Text.Encoding]::UTF8.GetBytes($daywellConfig)) -TimeoutSec 30
      $daywellAgentId = $daywellCreated.agent_id
    } catch { throw 'ElevenLabs could not create the agent. Check the key has Agents write access. No local credentials were saved; check your ElevenLabs dashboard before retrying if the request timed out.' }
    if ($daywellAgentId -notmatch '^[a-zA-Z0-9_-]{5,100}$') { throw 'The agent response was invalid. Check your ElevenLabs dashboard.' }
    Write-Host "Created Daywell agent: $daywellAgentId"
  }
  try {
    $daywellVerified = Invoke-RestMethod -Uri ('https://api.elevenlabs.io/v1/convai/agents/' + $daywellAgentId) -Headers $daywellHeaders -TimeoutSec 15
    if ($daywellVerified.platform_settings.auth.enable_auth -ne $true) { throw 'AuthRequired' }
    $daywellTicket = Invoke-RestMethod -Uri ('https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=' + $daywellAgentId) -Headers $daywellHeaders -TimeoutSec 15
    if (-not $daywellTicket.signed_url) { throw 'NoTicket' }
  } catch { throw 'Could not verify the agent. Enable authentication with signed URLs in its Security settings, use no hostname allowlist, and check the key has Agents read and conversation access. Nothing was saved locally.' }
  $daywellExisting = if (Test-Path -LiteralPath $daywellVars) { [IO.File]::ReadAllText($daywellVars) } else { '' }
  $daywellKept = ($daywellExisting -split '\r?\n' | Where-Object { $_ -notmatch '^\s*ELEVENLABS_(API_KEY|AGENT_ID)\s*=' }) -join "`n"
  $daywellOutput = $daywellKept.TrimEnd() + "`nELEVENLABS_API_KEY=$daywellKey`nELEVENLABS_AGENT_ID=$daywellAgentId`n"
  [IO.File]::WriteAllText($daywellVars, $daywellOutput, (New-Object Text.UTF8Encoding($false)))
  Write-Host 'Connected. Your key was saved locally, outside Git.' -ForegroundColor Green
  Write-Host 'Restart Daywell, then reload it. Open Voice & company to see connection status.'
  Write-Host 'For an existing agent, copy the prepared Daywell prompt and daywell_request client tool into its dashboard first.'
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($daywellPointer)
  $daywellKey = $null; $daywellHeaders = $null; $daywellOutput = $null; $daywellExisting = $null; $daywellTicket = $null
  $daywellSecureKey.Dispose()
}
