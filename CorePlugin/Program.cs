using System;
using System.IO;
using Newtonsoft.Json;

namespace Plugin.Photoshop.AutoLayerSeperator
{
    class Program
    {
        static int Main(string[] args)
        {
            int errorCode = 0;
            string errorMessage = null;

            try
            {
                Console.WriteLine("=== CorePlugin - Auto Layer Separator ===");
                Console.WriteLine();

                // Kiểm tra tham số đầu vào
                if (args.Length == 0)
                {
                    errorCode = 1;
                    errorMessage = "Missing input parameter.";
                    Console.WriteLine("ERROR: Missing input parameter.");
                    Console.WriteLine("Usage:");
                    Console.WriteLine("  CorePlugin.exe <folder_path>");
                    Console.WriteLine("  CorePlugin.exe -c <excel_file_path>");
                }

                // Nếu có từ 2 tham số và tham số đầu là -c, đọc file cấu hình Excel
                if (args.Length >= 2 && args[0] == "-c")
                {
                    string excelFilePath = args[1];
                    Console.WriteLine($"Reading configuration from Excel file: {excelFilePath}");

                    try
                    {
                        ConfigurationReader reader = new ConfigurationReader();
                        string configJsonPath = reader.ReadConfig(excelFilePath);

                        if (configJsonPath != null)
                        {
                            Console.WriteLine();
                            Console.WriteLine($"Successfully created config.json at: {configJsonPath}");
                            errorCode = 0;
                        }
                        else
                        {
                            errorCode = 1;
                            errorMessage = "Failed to read configuration from Excel file.";
                            Console.WriteLine();
                            Console.WriteLine("ERROR: Failed to read configuration from Excel file.");
                        }
                    }
                    catch (Exception ex)
                    {
                        errorCode = 500;
                        errorMessage = ex.ToString();
                        Console.WriteLine();
                        Console.WriteLine($"ERROR: Error during configuration reading: {ex.Message}");
                        Console.WriteLine($"Details: {ex}");
                    }
                }

                // Nếu có 1 tham số, thực hiện logic xử lý folder như hiện tại
                if (args.Length == 1)
                {
                    string inputFolder = args[0];
                    Console.WriteLine($"Input folder: {inputFolder}");

                    // Kiểm tra thư mục có tồn tại không
                    if (!Directory.Exists(inputFolder))
                    {
                        errorCode = 1;
                        errorMessage = $"Folder does not exist: {inputFolder}";
                        Console.WriteLine($"ERROR: Folder does not exist: {inputFolder}");
                    }
                    else
                    {
                        // Kiểm tra các file cần thiết
                        string idPngPath = Path.Combine(inputFolder, "ID.png");
                        string colorSettingPath = Path.Combine(inputFolder, "color_setting.json");
                        string outputPath = Path.Combine(inputFolder, "output.json");

                        if (!File.Exists(idPngPath))
                        {
                            errorCode = 1;
                            errorMessage = $"File ID.png not found in folder: {inputFolder}";
                            Console.WriteLine($"ERROR: File ID.png not found in folder: {inputFolder}");
                        }
                        else if (!File.Exists(colorSettingPath))
                        {
                            errorCode = 1;
                            errorMessage = $"File color_setting.json not found in folder: {inputFolder}";
                            Console.WriteLine($"ERROR: File color_setting.json not found in folder: {inputFolder}");
                        }
                        else
                        {
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
                                errorCode = 0;
                            }
                            catch (Exception ex)
                            {
                                errorCode = 500;
                                errorMessage = ex.ToString();
                                Console.WriteLine();
                                Console.WriteLine($"ERROR: Error during processing: {ex.Message}");
                                Console.WriteLine($"Details: {ex}");
                            }
                        }
                    }
                }

                // Trường hợp không hợp lệ
                if (args.Length > 0 && args.Length != 1 && !(args.Length >= 2 && args[0] == "-c"))
                {
                    errorCode = 1;
                    errorMessage = "Invalid parameters.";
                    Console.WriteLine("ERROR: Invalid parameters.");
                    Console.WriteLine("Usage:");
                    Console.WriteLine("  CorePlugin.exe <folder_path>");
                    Console.WriteLine("  CorePlugin.exe -c <excel_file_path>");
                }
            }
            catch (Exception ex)
            {
                // Xử lý exception ở mức cao nhất
                errorCode = 500;
                errorMessage = ex.ToString();
                Console.WriteLine();
                Console.WriteLine($"ERROR: Unexpected exception: {ex.Message}");
                Console.WriteLine($"Details: {ex}");
            }
            finally
            {
                // Tạo file CorePluginOutPut.json bất kể chương trình chạy thành công hay gặp lỗi
                try
                {
                    var outputData = new
                    {
                        ErrorCode = errorCode,
                        Message = errorCode != 0 ? errorMessage : null
                    };

                    string outputJson = JsonConvert.SerializeObject(outputData, Formatting.Indented);
                    string outputFilePath = Path.Combine(Directory.GetCurrentDirectory(), "CorePluginOutPut.json");
                    File.WriteAllText(outputFilePath, outputJson);
                }
                catch (Exception ex)
                {
                    // Nếu không thể ghi file output, chỉ log ra console
                    Console.WriteLine($"WARNING: Failed to create CorePluginOutPut.json: {ex.Message}");
                }
            }

            return errorCode;
        }
    }
}
