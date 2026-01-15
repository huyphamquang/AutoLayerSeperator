# Giới thiệu chung
Plugin Tách lớp-thuyết minh công trình là một plugin Photoshop phát triển trên CEP 10 HTML Extension với chức năng chính là tách lớp thiết kế cho file bản vẽ công trình sau đó sơn màu cho từng lớp và đưa vào file mẫu thuyết minh công trình để xuất ra các định dạng ảnh. Khi người dùng bấm nút "Tạo thuyết minh" trên panel (được định nghĩa trong file index.html). Plugin tiến hành tách lớp thiết kế theo cách thức sau:

## Bước 1: Đọc file cấu hình excel 
- Người dùng chọn file excel chứa cầu hình cần tạo thuyết minh. 
- Sau khi chọn, plugin sẽ gọi hàm readConfig trong file js\main.js để đọc toàn bộ cấu hình cần thiết.
- Lưu cấu hình được được vào biến config.
- Thông báo ra màn hình và dừng xử lý nếu config không phù hợp (null hoặc giá trị không đúng).

## Bước 2: Tạo các folder output:
- Tạo folder layers trong folder config.texture4_folder để chứa các file ảnh tách lớp. Nếu thư mục này đã tồn tại => xóa đi tạo lại để thư mục trống.
- Tạo folder PATK trong folder config.texture4_folder để chứa các file ảnh phương án thiết kế bằng cách thay đổi màu sơn cho các layer từ file thiết kế gốc ( "file tach lop.psd"). Nếu thư mục này đã tồn tại => xóa đi tạo lại để thư mục trống.

## Bước 3: Tách lớp và xuất các layer ra file ảnh
- Mở file "file tach lop.psd" trong thư mục config.texture4_folder, file này chứa duy nhất 1 layer là file thiết kế công trình (từ đây gọi là layer1).
- Thêm layer từ file "id.png" nằm trong thư mục này (từ đây gọi là layer2). Sử dụng hàm addLayerFromFile trong host\hostscript.js để thực hiện.
- Khai báo bảng màu của các layer ở dạng json array như sau:
[
  {"name": "ngoaithat_Tuong", "hex": "#dd0d0d"},
  {"name": "ngoaithat_Phao", "hex": "#b67612"},
  {"name": "ngoaithat_Chi", "hex": "#759610"},
  {"name": "ngoaithat_Cot", "hex": "#057e5b"},
  {"name": "ngoaithat_ChuA", "hex": "#ac43bd"},
  {"name": "ngoaithat_Nhan", "hex": "#0c3771"},
  {"name": "ngoaithat_Conson", "hex": "#901058"},
  {"name": "ngoaithat_Tomoi", "hex": "#591b26"},
  {"name": "ngoaithat_Lancan", "hex": "#5d8e51"},
  {"name": "ngoaithat_Danmua", "hex": "#ffda00"}
]

- Tạo layer
Với mỗi item trong mảng json ở trên tiến hành tạo vùng chọn cho layer dựa vào màu của layer tương ứng.
+ Hiện và Chọn layer2 là active layer.
+ Tạo vùng chọn giống như thao tác trên menu: Select>Color Range với mã màu là thuộc tính hex.
+ Nếu không có vùng chọn bỏ qua đê thực hiện với item tiếp theo.
+ Nếu tìm được, mở rộng vùng chọn 1 pixel như thao tác trên menu Select>Modify>Expand.
+ Kiểm tra lại lại nội dung phương án màu trong config có phù hợp không bằng cách: 
    + Tìm index của layer hiện thời trong mảng ds_layer của config theo tên layer.
    + Nếu không tìm được thì thông báo "Không tìm thấy layer {tên layer} trong file cấu hình" và dừng xử lý.
    + Nếu tìm được index, kiểm tra giá trị của item tại vị trí index trong tất cả các item của config.ds_pa nếu có bất kỳ giá trị nào làm hàm isEmpty trả về true thì thông báo "Thiếu phương án màu cho layer layer {tên layer}" và dừng xử lý.
+ Chọn layer1 làm active layer.
+ Tạo layer mới từ vùng chọn hiện thời giống như menu Layer>New>Layer Via Copy và đặt tên layer là giá trị của thuộc tính "name" của item (từ đây gọi là layer_tach_lop).
+ Ẩn toàn bộ các layer ngoài layer layer_tach_lop vừa tạo.
+ export ra file png ghi vào thư mục config.texture4_folder\layers với tên file là tên layer vừa tạo.
+ Hiện lại vùng chọn của layer_tach_lop giống chức năng Select Pixel trên context menu của layer.
+ Tạo layer để đổ màu sơn giống như thực hiện bằng menu Layer>New Fill Layer>Solid Color với tên {name}_tomau (trong đó {name} là giá trị thuộc tính name của item) và màu tô mặc địch là màu trắng. Màu này sẽ được thay đổi theo từng phương án màu sau này và Blending Mode = Mutiply.
+ Xóa layer layer_tach_lop.

## Bước 4: Đổ màu 
- Duyệt theo từng phương án trong config.ds_pa (từ đây gọi lại pa) hoặc chỉ duyệt phương án đầu tiền nếu config.first_pa = true, hoặc chọn phương án cụ thể nếu config.selected_pa > 0. Với mỗi pa, duyệt theo index của mảng config.ds_layer, lấy tên layer = config.ds_layer[index], nếu isEmpty(layer) = true thì chuyển duyệt index tiếp theo. Nếu = false, thì thực hiện bước tiếp.

+ lấy tên file mã màu: color_code = pa[index], sau đó tìm file này trong thư mục config.texture1_folder và config.texture2_folder bằng hàm findInfolder. Nếu không tìm được file thì hiển thị thông báo và dừng xử lý.
+ Mở file vừa tìm được vào layer mới bằng hàm addLayerFromFile. Sau đó lấy màu sơn bằng cách đọc mã mầu ở điểm ảnh (10, 10) lưu kết quả vào cache để tránh phải mở lại file để đọc mã màu.
+ Set lại mã màu này cho layer {config.ds_layer[index]}_tomau để tô lại màu cho layer.

- Sau khi đã đổ màu cho tất cả các layer, tiến hành xuất file thiết kế của phương án hiện thời ra file PA_{index của phương án hiện thời  + 1} folder PATK trong folder config.texture4_folder.
- Sau khi xuất file tất cả các phương án, close file hiện thời và không lưu lại thay đổi.

## Bước 5: Xuất báo cáo thuyết minh
- Tiến hành tạo file thuyết trình thông qua hàm generateDocFromConfig (tham khảo nội dung hàm execute_generate_file).

# Các bước cập nhật

1. Tạo các hàm tương ứng để thực hiện các bước 2, 3, 4 như mô tả bên trên với input là cấu hình đã được đọc. Các hàm này cần return trạng thái để biết được có thực hiện bước tiếp theo hay dừng xử lý.
2. hàm execute_generate_file hiện thời chỉ thực hiện đọc cấu hình và thực hiện bước 5. Cần cập nhật hàm này để thực hiện theo trình tự:
- Đọc cấu hình.
- Thực hiện  các bước 2, 3, 4.
- Thực hiện bước 5 như implement hiện tại.