# Script gỡ cài đặt AutoLayerSeperator plugin

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AutoLayerSeperator Plugin Uninstaller" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Tìm thư mục CEP extensions
$cepPaths = @(
    "$env:APPDATA\Adobe\CEP\extensions",
    "${env:ProgramFiles(x86)}\Common Files\Adobe\CEP\extensions",
    "$env:ProgramFiles\Common Files\Adobe\CEP\extensions"
)

$pluginName = "AutoLayerSeperator"
$pluginPath = $null

foreach ($basePath in $cepPaths) {
    $testPath = Join-Path $basePath $pluginName
    if (Test-Path $testPath) {
        $pluginPath = $testPath
        Write-Host "Tìm thấy plugin tại: $pluginPath" -ForegroundColor Green
        break
    }
}

if (-not $pluginPath) {
    Write-Host "Không tìm thấy plugin đã cài đặt." -ForegroundColor Yellow
    Read-Host "Nhấn Enter để thoát"
    exit 0
}

Write-Host ""
Write-Host "Plugin sẽ được xóa từ: $pluginPath" -ForegroundColor Yellow
$confirm = Read-Host "Bạn có chắc chắn muốn gỡ cài đặt? (Y/N)"

if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "Đã hủy gỡ cài đặt." -ForegroundColor Yellow
    exit 0
}

try {
    Write-Host "Đang xóa plugin..." -ForegroundColor Yellow
    Remove-Item -Path $pluginPath -Recurse -Force
    Write-Host "Đã gỡ cài đặt plugin thành công!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Lưu ý: Khởi động lại Photoshop để hoàn tất." -ForegroundColor Cyan
} catch {
    Write-Host "Lỗi khi xóa plugin: $_" -ForegroundColor Red
    Write-Host "Vui lòng đóng Photoshop và thử lại." -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Nhấn Enter để thoát"
