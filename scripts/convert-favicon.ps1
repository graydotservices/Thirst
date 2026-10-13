Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "..\favicon 1.png"
$srcPath = [System.IO.Path]::GetFullPath($srcPath)
Write-Host "Loading source from $srcPath"

$srcImg = [System.Drawing.Image]::FromFile($srcPath)

$sizes = @(16, 32, 48, 64, 128, 256)
$entries = @()

foreach ($sz in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($sz, $sz, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($srcImg, 0, 0, $sz, $sz)
    $g.Dispose()
    
    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $bytes = $ms.ToArray()
    $ms.Dispose()
    $bmp.Dispose()
    
    $entries += [PSCustomObject]@{
        Size = $sz
        Bytes = $bytes
    }
    Write-Host "Generated size $sz x $sz ($($bytes.Length) bytes)"
}

# Also export a 192x192 and 512x512 app icon
foreach ($appSz in @(180, 192, 512)) {
    $bmp = New-Object System.Drawing.Bitmap($appSz, $appSz, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($srcImg, 0, 0, $appSz, $appSz)
    $g.Dispose()

    if ($appSz -eq 180) {
        $out = Join-Path $PSScriptRoot "..\app\apple-icon.png"
        $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
        Write-Host "Saved Apple Touch Icon (180x180) to $out"
    } elseif ($appSz -eq 192) {
        $out = Join-Path $PSScriptRoot "..\app\icon.png"
        $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
        Write-Host "Saved App Icon (192x192) to $out"
    }
    $bmp.Dispose()
}

$srcImg.Dispose()

# Now assemble standard multi-resolution ICO file
$icoMs = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter($icoMs)

# ICONDIR header: 6 bytes
$bw.Write([uint16]0) # Reserved
$bw.Write([uint16]1) # Type 1 = ICO
$bw.Write([uint16]$entries.Count) # Image count

# Calculate header offset
$offset = 6 + ($entries.Count * 16)

# Write ICONDIRENTRY (16 bytes each)
foreach ($entry in $entries) {
    $w = if ($entry.Size -eq 256) { [byte]0 } else { [byte]$entry.Size }
    $h = if ($entry.Size -eq 256) { [byte]0 } else { [byte]$entry.Size }
    $bw.Write([byte]$w)
    $bw.Write([byte]$h)
    $bw.Write([byte]0) # ColorCount
    $bw.Write([byte]0) # Reserved
    $bw.Write([uint16]1) # Planes
    $bw.Write([uint16]32) # BitCount
    $bw.Write([uint32]$entry.Bytes.Length) # BytesInRes
    $bw.Write([uint32]$offset) # ImageOffset
    $offset += $entry.Bytes.Length
}

# Write Image Data (PNG blocks)
foreach ($entry in $entries) {
    $bw.Write($entry.Bytes)
}

$bw.Flush()
$icoBytes = $icoMs.ToArray()
$bw.Dispose()
$icoMs.Dispose()

# Save to app/favicon.ico and public/favicon.ico
$appFavicon = Join-Path $PSScriptRoot "..\app\favicon.ico"
[System.IO.File]::WriteAllBytes($appFavicon, $icoBytes)
Write-Host "Saved ICO to $appFavicon ($($icoBytes.Length) bytes)"

$publicFavicon = Join-Path $PSScriptRoot "..\public\favicon.ico"
[System.IO.File]::WriteAllBytes($publicFavicon, $icoBytes)
Write-Host "Saved ICO to $publicFavicon ($($icoBytes.Length) bytes)"
