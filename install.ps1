# Script cài đặt AutoLayerSeperator plugin cho Adobe Photoshop
# Chạy script này với quyền Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AutoLayerSeperator Plugin Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra quyền Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "WARNING: Script không chạy với quyền Administrator!" -ForegroundColor Yellow
    Write-Host "Một số thao tác có thể yêu cầu quyền Administrator." -ForegroundColor Yellow
    Write-Host ""
}

# Tìm thư mục CEP extensions
$cepPaths = @(
    "$env:APPDATA\Adobe\CEP\extensions",
    "${env:ProgramFiles(x86)}\Common Files\Adobe\CEP\extensions",
    "$env:ProgramFiles\Common Files\Adobe\CEP\extensions"
)

$targetPath = $null
foreach ($path in $cepPaths) {
    if (Test-Path $path) {
        $targetPath = $path
        Write-Host "Tìm thấy thư mục CEP extensions: $path" -ForegroundColor Green
        break
    }
}

# Nếu không tìm thấy, tạo thư mục
if (-not $targetPath) {
    $targetPath = "$env:APPDATA\Adobe\CEP\extensions"
    Write-Host "Không tìm thấy thư mục CEP extensions, sẽ tạo: $targetPath" -ForegroundColor Yellow
    
    try {
        New-Item -ItemType Directory -Path $targetPath -Force | Out-Null
        Write-Host "Đã tạo thư mục: $targetPath" -ForegroundColor Green
    } catch {
        Write-Host "Lỗi khi tạo thư mục: $_" -ForegroundColor Red
        exit 1
    }
}

# Đường dẫn thư mục plugin đích
$pluginName = "AutoLayerSeperator"
$pluginTargetPath = Join-Path $targetPath $pluginName

# Đường dẫn thư mục nguồn (thư mục hiện tại)
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourcePath = $scriptPath

Write-Host ""
Write-Host "Thư mục nguồn: $sourcePath" -ForegroundColor Cyan
Write-Host "Thư mục đích:  $pluginTargetPath" -ForegroundColor Cyan
Write-Host ""

# Xác nhận cài đặt
$confirm = Read-Host "Bạn có muốn tiếp tục cài đặt? (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "Đã hủy cài đặt." -ForegroundColor Yellow
    exit 0
}

# Xóa plugin cũ nếu tồn tại
if (Test-Path $pluginTargetPath) {
    Write-Host "Đang xóa plugin cũ..." -ForegroundColor Yellow
    try {
        Remove-Item -Path $pluginTargetPath -Recurse -Force
        Write-Host "Đã xóa plugin cũ." -ForegroundColor Green
    } catch {
        Write-Host "Lỗi khi xóa plugin cũ: $_" -ForegroundColor Red
        Write-Host "Vui lòng đóng Photoshop và thử lại." -ForegroundColor Yellow
        exit 1
    }
}

# Tạo thư mục plugin mới
Write-Host "Đang tạo thư mục plugin..." -ForegroundColor Yellow
try {
    New-Item -ItemType Directory -Path $pluginTargetPath -Force | Out-Null
    Write-Host "Đã tạo thư mục plugin." -ForegroundColor Green
} catch {
    Write-Host "Lỗi khi tạo thư mục: $_" -ForegroundColor Red
    exit 1
}

# Copy các file và thư mục
Write-Host ""
Write-Host "Đang copy các file..." -ForegroundColor Yellow

$itemsToCopy = @(
    "CSXS",
    "host",
    "css",
    "js",
    "index.html"
)

foreach ($item in $itemsToCopy) {
    $sourceItem = Join-Path $sourcePath $item
    $targetItem = Join-Path $pluginTargetPath $item
    
    if (Test-Path $sourceItem) {
        try {
            Copy-Item -Path $sourceItem -Destination $targetItem -Recurse -Force
            Write-Host "  ✓ Đã copy: $item" -ForegroundColor Green
        } catch {
            Write-Host "  ✗ Lỗi khi copy $item : $_" -ForegroundColor Red
        }
    } else {
        Write-Host "  ⚠ Không tìm thấy: $item" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cài đặt hoàn tất!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Plugin đã được cài đặt tại: $pluginTargetPath" -ForegroundColor Green
Write-Host ""

# Kiểm tra và enable debug mode cho unsigned extensions (nếu cần)
Write-Host "Đang kiểm tra cài đặt CEP debug mode..." -ForegroundColor Yellow

$registryPath = "HKCU:\Software\Adobe\CSXS.11"
$registryValue = "PlayerDebugMode"
$registryValue64 = "PlayerDebugMode"

try {
    # Kiểm tra và tạo registry key nếu chưa có
    if (-not (Test-Path $registryPath)) {
        New-Item -Path $registryPath -Force | Out-Null
        Write-Host "Đã tạo registry key: $registryPath" -ForegroundColor Green
    }
    
    # Set PlayerDebugMode = 1 để cho phép unsigned extensions
    $currentValue = (Get-ItemProperty -Path $registryPath -Name $registryValue -ErrorAction SilentlyContinue).$registryValue
    if ($currentValue -ne "1") {
        Set-ItemProperty -Path $registryPath -Name $registryValue -Value "1" -Type String -Force
        Write-Host "Đã bật PlayerDebugMode để cho phép unsigned extensions." -ForegroundColor Green
    } else {
        Write-Host "PlayerDebugMode đã được bật." -ForegroundColor Green
    }
    
    # Kiểm tra cho CSXS.10 (nếu cần)
    $registryPath10 = "HKCU:\Software\Adobe\CSXS.10"
    if (-not (Test-Path $registryPath10)) {
        New-Item -Path $registryPath10 -Force | Out-Null
    }
    Set-ItemProperty -Path $registryPath10 -Name $registryValue -Value "1" -Type String -Force
    
} catch {
    Write-Host "Không thể cài đặt registry (có thể cần quyền Administrator): $_" -ForegroundColor Yellow
    Write-Host "Bạn có thể cần chạy script với quyền Administrator hoặc cài đặt thủ công." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Hướng dẫn sử dụng:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. Khởi động lại Adobe Photoshop (nếu đang chạy)" -ForegroundColor White
Write-Host "2. Vào menu: Window > Extensions > Tách lớp-thuyết minh công trình" -ForegroundColor White
Write-Host "3. Panel sẽ xuất hiện và bạn có thể sử dụng plugin" -ForegroundColor White
Write-Host ""
Write-Host "Nếu plugin không xuất hiện:" -ForegroundColor Yellow
Write-Host "- Đảm bảo Photoshop đã được khởi động lại" -ForegroundColor White
Write-Host "- Kiểm tra PlayerDebugMode đã được bật (registry)" -ForegroundColor White
Write-Host "- Kiểm tra phiên bản Photoshop hỗ trợ (CS6 trở lên)" -ForegroundColor White
Write-Host ""

# Tạm dừng để người dùng đọc thông tin
Read-Host "Nhấn Enter để thoát"
