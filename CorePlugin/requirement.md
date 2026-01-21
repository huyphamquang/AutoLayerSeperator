# Mô tả chung

## Chứng năng
Phần mềm có chức năng chính là tìm vị trí điểm ảnh có mã màu yêu cầu. Các thông tin đầu và và đầu ra được mô tả trong các phần dưới đây.

## Mô tả kỹ thuật
- Tên phần mềm: CorePlugin
- Plashform: .net 4.8 console app
- NameSpace: Plugin.Photoshop.AutoLayerSeperator
- IDE: Visual Studio 2019 compatible.

# Đầu vào, đầu ra

## Đầu vào
- phần mềm nhận tham số đầu vào từ command line, nội dung là folder chứa các file đầu vào cần thiết.
- Folder chứa các nội dung sau:
+ File ID.png được sử dụng để tìm vị trí điểm ảnh.
+ File color_setting.json chứa thông tin cấu hình màu cho các layer. Nội dung file ở dạng json có dạng như sau:
```
{
"layers":
	[
   		{"name": "ngoaithat_Phao", "hex": "#b67612", "similar":1},
    		{"name": "ngoaithat_Chi", "hex": "#759610", "similar":1},
                {"name": "ngoaithat_Tuong", "hex": "#dd0d0d", "similar":1},
                {"name": "ngoaithat_Cot", "hex": "#057e5b", "similar":1},
                {"name": "ngoaithat_ChuA", "hex": "#ac43bd", "similar":1},
                {"name": "ngoaithat_Nhan", "hex": "#0c3771", "similar":1},
                {"name": "ngoaithat_Conson", "hex": "#901058", "similar":1},
                {"name": "ngoaithat_Tomoi", "hex": "#591b26", "similar":1},
                {"name": "ngoaithat_Lancan", "hex": "#5d8e51", "similar":1},
                {"name": "ngoaithat_Danmua", "hex": "#ffda00", "similar":1},
    		
	]
}
```
trong đó danh sách layer được định nghĩa trong mảng layers. Mỗi item bao gồm tên layer trong property name và màu (dạng mã hex) trong property hex.

## Đầu ra
Phần mềm tiến hành tìm vị trí điểm ảnh có màu trùng với màu của mỗi layer trên file id.png trong thư mục đầu vào. Sau đó ghi kết quả ra file output.json có cấu trúc như sau:
```
{
    "pixels":
    [
       {"name": "layer_1", "x": vị trí ngang, "y": vị trí dọc},
       ...
       {"name": "layer_n", "x": vị trí ngang, "y": vị trí dọc},
    ]
}
```
trong đó, với mỗi layer phần mềm tìm được điểm ảnh thóa mãn, sẽ được thêm vào mảng pixels trong file output với name là tên layer, x, và y lần lượt là tọa độ ngang và dọc của điểm ảnh tìm được.

# Triển khai

- Toàn bộ logic đọc input và xử lý được đặt trong class PixelSearcher.cs
- Tối ưu thuật toán tìm điểm ảnh để sau cho chỉ cần quét 1 lượt là tìm được điểm ảnh thỏa mãn trên tất cả layer. Nên sử dụng cách truy cập trực tiếp vùng nhớ điểm ảnh để tăng tốc xử lý. Khi mỗi layer đã tìm được điểm ảnh thì không cần quét tiếp.
- print ra console các thông tin cần thiết phục vụ debug.
- File output phải được xóa trước khi xử lý.
- Trường hợp thư mục đầu vào không đúng định dạng hoặc không tồn tại, cần thông báo trên console và dừng phầm mềm.
- Tạo đầy đủ các file project và solution để có thể mở trực tiếp trên visual studio 2019.

