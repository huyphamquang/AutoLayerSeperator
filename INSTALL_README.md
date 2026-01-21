# Hướng dẫn cài đặt AutoLayerSeperator Plugin

## Yêu cầu hệ thống

- Windows 10/11
- Adobe Photoshop CS6 trở lên (khuyến nghị Photoshop CC 2015+)
- PowerShell (thường có sẵn trên Windows)

## Cách cài đặt

### Phương pháp 1: Sử dụng script tự động (Khuyến nghị)

1. **Chuẩn bị:**
   - Đóng Adobe Photoshop nếu đang chạy
   - Giải nén plugin vào một thư mục (ví dụ: `D:\Projects\AutoLayerSeperator`)

2. **Chạy script cài đặt:**
   - **Cách 1:** Double-click vào file `install.bat`
   - **Cách 2:** Right-click vào `install.ps1` > Run with PowerShell
   - **Cách 3:** Mở PowerShell, cd vào thư mục plugin, chạy: `.\install.ps1`

3. **Lưu ý:**
   - Script có thể yêu cầu quyền Administrator để cài đặt registry
   - Nếu gặp lỗi, thử Right-click > Run as administrator

### Phương pháp 2: Cài đặt thủ công

1. Tìm thư mục CEP extensions của Photoshop:
   - Thường nằm tại: `%APPDATA%\Adobe\CEP\extensions`
   - Hoặc: `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions`

2. Copy toàn bộ thư mục plugin vào thư mục extensions:
   ```
   %APPDATA%\Adobe\CEP\extensions\AutoLayerSeperator\
   ```

3. Bật PlayerDebugMode (cho phép unsigned extensions):
   - Mở Registry Editor (regedit)
   - Tạo hoặc chỉnh sửa key: `HKEY_CURRENT_USER\Software\Adobe\CSXS.11`
   - Thêm String value: `PlayerDebugMode` = `1`
   - Làm tương tự cho `CSXS.10` nếu cần

## Sau khi cài đặt

1. **Khởi động lại Adobe Photoshop** (quan trọng!)

2. **Mở plugin:**
   - Vào menu: `Window > Extensions > Tách lớp-thuyết minh công trình`
   - Hoặc tìm trong menu Extensions

3. **Panel sẽ xuất hiện** và bạn có thể sử dụng plugin

## Gỡ cài đặt

Chạy file `uninstall.ps1` hoặc xóa thủ công thư mục:
```
%APPDATA%\Adobe\CEP\extensions\AutoLayerSeperator
```

## Xử lý sự cố

### Plugin không xuất hiện trong menu

1. **Kiểm tra PlayerDebugMode:**
   - Mở Registry Editor
   - Kiểm tra `HKEY_CURRENT_USER\Software\Adobe\CSXS.11\PlayerDebugMode` = `1`
   - Nếu không có, tạo và set giá trị = `1`

2. **Kiểm tra phiên bản Photoshop:**
   - Plugin yêu cầu Photoshop CS6 trở lên
   - Kiểm tra trong `manifest.xml` có hỗ trợ phiên bản của bạn không

3. **Kiểm tra đường dẫn cài đặt:**
   - Đảm bảo plugin được copy đúng vào thư mục CEP extensions
   - Kiểm tra file `manifest.xml` có tồn tại không

4. **Khởi động lại Photoshop:**
   - Đóng hoàn toàn Photoshop (kiểm tra Task Manager)
   - Khởi động lại Photoshop

5. **Kiểm tra log:**
   - Mở Developer Console trong Photoshop (nếu có)
   - Kiểm tra lỗi trong log

### Lỗi khi chạy script

- **"Execution Policy":** Chạy PowerShell với: `powershell -ExecutionPolicy Bypass -File install.ps1`
- **"Access Denied":** Chạy với quyền Administrator
- **"Path not found":** Đảm bảo bạn đang ở đúng thư mục chứa plugin

## Cấu trúc thư mục sau khi cài đặt

```
%APPDATA%\Adobe\CEP\extensions\AutoLayerSeperator\
├── CSXS\
│   └── manifest.xml
├── host\
│   ├── hostscript.js
│   └── json2.js
├── css\
│   ├── app.css
│   └── bootstrap.min.css
├── js\
│   ├── CSInterface.js
│   ├── main.js
│   └── ...
└── index.html
```

## Liên hệ hỗ trợ

Nếu gặp vấn đề, vui lòng kiểm tra:
1. Phiên bản Photoshop
2. Log lỗi (nếu có)
3. Cấu hình registry PlayerDebugMode
