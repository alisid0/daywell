$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[Windows.Forms.Application]::EnableVisualStyles()

$daywellRoot = Split-Path -Parent $PSScriptRoot
$daywellVars = Join-Path $daywellRoot '.dev.vars'
$daywellForm = New-Object Windows.Forms.Form
$daywellForm.Text = 'Daywell - Paste your ElevenLabs key'
$daywellForm.ClientSize = New-Object Drawing.Size(580, 425)
$daywellForm.StartPosition = 'CenterScreen'
$daywellForm.FormBorderStyle = 'FixedDialog'
$daywellForm.MaximizeBox = $false
$daywellForm.MinimizeBox = $false
$daywellForm.BackColor = [Drawing.ColorTranslator]::FromHtml('#FFF7FB')
$daywellForm.ForeColor = [Drawing.ColorTranslator]::FromHtml('#4A3043')
$daywellForm.Font = New-Object Drawing.Font('Segoe UI', 10)

function Add-DaywellLabel($text, $x, $y, $width, $height) {
  $label = New-Object Windows.Forms.Label
  $label.Text = $text
  $label.Location = New-Object Drawing.Point($x, $y)
  $label.Size = New-Object Drawing.Size($width, $height)
  $daywellForm.Controls.Add($label)
  return $label
}

$daywellHeading = Add-DaywellLabel 'Give Daywell a voice.' 28 24 525 36
$daywellHeading.Font = New-Object Drawing.Font('Segoe UI', 19, [Drawing.FontStyle]::Bold)
$null = Add-DaywellLabel 'Paste your key below. It stays in the ignored local settings file, outside chat and GitHub.' 28 69 525 48
$null = Add-DaywellLabel 'ElevenLabs API key' 28 126 525 25
$daywellKeyBox = New-Object Windows.Forms.TextBox
$daywellKeyBox.Location = New-Object Drawing.Point(28, 155)
$daywellKeyBox.Size = New-Object Drawing.Size(524, 30)
$daywellKeyBox.UseSystemPasswordChar = $true
$daywellKeyBox.MaxLength = 256
$daywellKeyBox.ShortcutsEnabled = $true
$daywellKeyBox.TabIndex = 0
$daywellForm.Controls.Add($daywellKeyBox)

$null = Add-DaywellLabel 'Agent ID (optional for now)' 28 202 525 25
$daywellAgentBox = New-Object Windows.Forms.TextBox
$daywellAgentBox.Location = New-Object Drawing.Point(28, 231)
$daywellAgentBox.Size = New-Object Drawing.Size(524, 30)
$daywellAgentBox.MaxLength = 100
$daywellAgentBox.TabIndex = 1
$daywellForm.Controls.Add($daywellAgentBox)

$daywellSave = New-Object Windows.Forms.Button
$daywellSave.Text = 'Save key on this computer'
$daywellSave.Location = New-Object Drawing.Point(28, 284)
$daywellSave.Size = New-Object Drawing.Size(330, 44)
$daywellSave.BackColor = [Drawing.ColorTranslator]::FromHtml('#803C65')
$daywellSave.ForeColor = [Drawing.Color]::White
$daywellSave.FlatStyle = 'Flat'
$daywellSave.TabIndex = 2
$daywellForm.Controls.Add($daywellSave)
$daywellForm.AcceptButton = $daywellSave

$daywellClose = New-Object Windows.Forms.Button
$daywellClose.Text = 'Close'
$daywellClose.Location = New-Object Drawing.Point(372, 284)
$daywellClose.Size = New-Object Drawing.Size(180, 44)
$daywellClose.TabIndex = 3
$daywellClose.Add_Click({ $daywellForm.Close() })
$daywellForm.Controls.Add($daywellClose)
$daywellForm.CancelButton = $daywellClose
$daywellStatus = Add-DaywellLabel 'This saves your key only. Connecting voice also needs an agent and a restart of Daywell.' 28 349 525 62
$daywellStatus.AccessibleRole = 'Alert'

$daywellSave.Add_Click({
  $daywellKey = $daywellKeyBox.Text.Trim()
  $daywellAgentId = $daywellAgentBox.Text.Trim()
  if ($daywellKey -notmatch '^[a-zA-Z0-9_-]{16,256}$') {
    $daywellStatus.Text = 'Please paste the complete ElevenLabs API key. Nothing was saved.'
    $daywellKeyBox.Focus()
    return
  }
  if ($daywellAgentId -and $daywellAgentId -notmatch '^[a-zA-Z0-9_-]{5,100}$') {
    $daywellStatus.Text = 'Check the agent ID, or leave it blank for now. Nothing was saved.'
    $daywellAgentBox.Focus()
    return
  }
  try {
    $daywellExisting = if (Test-Path -LiteralPath $daywellVars) { [IO.File]::ReadAllText($daywellVars) } else { '' }
    $daywellKept = ($daywellExisting -split '\r?\n' | Where-Object {
      $_ -notmatch '^\s*ELEVENLABS_API_KEY\s*=' -and (-not $daywellAgentId -or $_ -notmatch '^\s*ELEVENLABS_AGENT_ID\s*=')
    }) -join "`n"
    $daywellOutput = $daywellKept.TrimEnd() + "`nELEVENLABS_API_KEY=$daywellKey`n"
    if ($daywellAgentId) { $daywellOutput += "ELEVENLABS_AGENT_ID=$daywellAgentId`n" }
    [IO.File]::WriteAllText($daywellVars, $daywellOutput, (New-Object Text.UTF8Encoding($false)))
    $daywellKeyBox.Clear()
    $daywellKeyBox.Enabled = $false
    $daywellAgentBox.Enabled = $false
    $daywellSave.Enabled = $false
    $daywellStatus.Text = 'Saved locally. Your key has not been verified yet. Close this window and tell Daywell you are ready to connect.'
    $daywellClose.Focus()
  } catch {
    $daywellStatus.Text = 'Could not save the local settings. Nothing was sent to ElevenLabs. Please check access to the project folder and try again.'
  } finally {
    $daywellKey = $null
    $daywellExisting = $null
    $daywellKept = $null
    $daywellOutput = $null
  }
})

$daywellForm.Add_Shown({
  $daywellForm.TopMost = $true
  $daywellForm.Activate()
  $daywellKeyBox.Focus()
  $daywellForm.TopMost = $false
})
try { [void]$daywellForm.ShowDialog() } finally {
  $daywellKeyBox.Clear()
  $daywellForm.Dispose()
}
