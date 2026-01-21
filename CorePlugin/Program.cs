using System;
using System.IO;

namespace Plugin.Photoshop.AutoLayerSeperator
{
    class Program
    {
        static int Main(string[] args)
        {
            Console.WriteLine("=== CorePlugin - Auto Layer Separator ===");
            Console.WriteLine();

            // Kiểm tra tham số đầu vào
            if (args.Length == 0)
            {
                Console.WriteLine("ERROR: Missing input parameter.");
                Console.WriteLine("Usage: CorePlugin.exe <folder_path>");
                return 1;
            }

            string inputFolder = args[0];
            Console.WriteLine($"Input folder: {inputFolder}");

            // Kiểm tra thư mục có tồn tại không
            if (!Directory.Exists(inputFolder))
            {
                Console.WriteLine($"ERROR: Folder does not exist: {inputFolder}");
                return 1;
            }

            // Kiểm tra các file cần thiết
            string idPngPath = Path.Combine(inputFolder, "ID.png");
            string colorSettingPath = Path.Combine(inputFolder, "color_setting.json");
            string outputPath = Path.Combine(inputFolder, "output.json");

            if (!File.Exists(idPngPath))
            {
                Console.WriteLine($"ERROR: File ID.png not found in folder: {inputFolder}");
                return 1;
            }

            if (!File.Exists(colorSettingPath))
            {
                Console.WriteLine($"ERROR: File color_setting.json not found in folder: {inputFolder}");
                return 1;
            }

            Console.WriteLine($"Found file ID.png: {idPngPath}");
            Console.WriteLine($"Found file color_setting.json: {colorSettingPath}");

            // Xóa file output nếu tồn tại
            if (File.Exists(outputPath))
            {
                File.Delete(outputPath);
                Console.WriteLine($"Deleted old output file: {outputPath}");
            }

            try
            {
                // Thực hiện tìm kiếm điểm ảnh
                Console.WriteLine();
                Console.WriteLine("Starting processing...");
                PixelSearcher searcher = new PixelSearcher();
                searcher.SearchPixels(idPngPath, colorSettingPath, outputPath);

                Console.WriteLine();
                Console.WriteLine($"Completed! Results written to: {outputPath}");
                return 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine();
                Console.WriteLine($"ERROR: Error during processing: {ex.Message}");
                Console.WriteLine($"Details: {ex}");
                return 1;
            }
        }
    }
}
