using System;
using System.IO;
using SkiaSharp;

namespace Plugin.Photoshop.AutoLayerSeperator
{
    class WebPConverter
    {
        /// <summary>
        /// Chuyển đổi tất cả file PNG trong thư mục thành WebP và xóa file PNG gốc
        /// </summary>
        /// <param name="folderPath">Đường dẫn đầy đủ của thư mục cần convert</param>
        /// <returns>Số lượng file đã convert thành công</returns>
        public int ConvertPngToWebP(string folderPath)
        {
            if (!Directory.Exists(folderPath))
            {
                throw new DirectoryNotFoundException($"Thư mục không tồn tại: {folderPath}");
            }

            int convertedCount = 0;
            string[] pngFiles = Directory.GetFiles(folderPath, "*.png", SearchOption.TopDirectoryOnly);

            Console.WriteLine($"Tìm thấy {pngFiles.Length} file PNG trong thư mục: {folderPath}");
            Console.WriteLine();

            foreach (string pngFile in pngFiles)
            {
                try
                {
                    string webpFile = Path.ChangeExtension(pngFile, ".webp");
                    Console.WriteLine($"Đang convert: {Path.GetFileName(pngFile)} -> {Path.GetFileName(webpFile)}");

                    // Đọc file PNG
                    using (var inputStream = new FileStream(pngFile, FileMode.Open, FileAccess.Read))
                    using (var bitmap = SKBitmap.Decode(inputStream))
                    {
                        if (bitmap == null)
                        {
                            Console.WriteLine($"  ERROR: Không thể đọc file PNG: {Path.GetFileName(pngFile)}");
                            continue;
                        }

                        // Tạo WebP với chất lượng 90 (có thể điều chỉnh)
                        using (var image = SKImage.FromBitmap(bitmap))
                        using (var outputStream = new FileStream(webpFile, FileMode.Create, FileAccess.Write))
                        {
                            var data = image.Encode(SKEncodedImageFormat.Webp, 90);
                            data.SaveTo(outputStream);
                        }
                    }

                    // Xóa file PNG gốc sau khi convert thành công
                    File.Delete(pngFile);
                    Console.WriteLine($"  ✓ Đã convert và xóa file PNG gốc: {Path.GetFileName(pngFile)}");
                    convertedCount++;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"  ERROR: Lỗi khi convert {Path.GetFileName(pngFile)}: {ex.Message}");
                }
            }

            Console.WriteLine();
            Console.WriteLine($"Hoàn thành! Đã convert {convertedCount}/{pngFiles.Length} file thành công.");

            return convertedCount;
        }
    }
}
