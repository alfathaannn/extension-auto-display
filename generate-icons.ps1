Add-Type -AssemblyName System.Drawing

$sizes = @(16, 48, 128)

foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

    # Background
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(230, 237, 245))
    $g.FillRectangle($bgBrush, 0, 0, $size, $size)

    $scale = $size / 128.0

    # Monitor frame outer
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(59, 130, 246), [Math]::Max(1, [int](6 * $scale)))
    $screenBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(45, 55, 72))
    
    $mx = [int](18 * $scale)
    $my = [int](20 * $scale)
    $mw = [int](92 * $scale)
    $mh = [int](60 * $scale)

    $g.FillRectangle($screenBrush, $mx, $my, $mw, $mh)
    $g.DrawRectangle($pen, $mx, $my, $mw, $mh)

    # Monitor inner display glow
    $displayBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(96, 165, 250))
    $g.FillRectangle($displayBrush, [int]($mx + 4 * $scale), [int]($my + 4 * $scale), [int]($mw - 8 * $scale), [int]($mh - 8 * $scale))

    # Stand
    $standPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(74, 85, 104), [Math]::Max(1, [int](8 * $scale)))
    $g.DrawLine($standPen, [int](64 * $scale), [int](80 * $scale), [int](64 * $scale), [int](102 * $scale))
    $g.DrawLine($standPen, [int](44 * $scale), [int](102 * $scale), [int](84 * $scale), [int](102 * $scale))

    # Save PNG
    $dest = Join-Path (Get-Location) "icons\icon$size.png"
    $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)

    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Generated: $dest"
}

