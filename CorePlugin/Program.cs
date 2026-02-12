using System;
using System.IO;
using System.Net.Http;
using System.Text;
using Newtonsoft.Json;

namespace Plugin.Photoshop.AutoLayerSeperator
{
    class Program
    {
        static int Main(string[] args)
        {
            var finalResult = new ResultData
            {
                ErrorCode = 0,
                Message = null
            };

            try
            {
                Console.WriteLine("=== CorePlugin - Auto Layer Separator ===");
                Console.WriteLine();

                // --- Bước 1: Kiểm tra license ---
                var licenseResult = CheckLicense();
                if (licenseResult.ErrorCode != 0)
                {
                    finalResult = licenseResult;
                    return finalResult.ErrorCode;
                }

                // --- Bước 2: Thực hiện logic hiện tại trong hàm Main ---
                bool hasValidParameter = false;

                // Nếu có từ 2 tham số và tham số đầu là -webp, convert PNG sang WebP
                if (args.Length >= 2 && args[0] == "-webp")
                {
                    hasValidParameter = true;
                    string folderPath = args[1];
                    Console.WriteLine($"Converting PNG files to WebP in folder: {folderPath}");

                    var webpResult = ConvertPngFolderToWebP(folderPath);
                    finalResult = webpResult;
                }

                // Nếu có 1 tham số: đường dẫn đầy đủ file ID hoặc thư mục chứa ID.png
                if (args.Length == 1)
                {
                    hasValidParameter = true;
                    string inputPath = args[0];
                    var processResult = ProcessInputAndGenerateConfig(inputPath);
                    finalResult = processResult;
                }

                // Nếu sau khi xử lý mà tham số vẫn không hợp lệ
                if (!hasValidParameter)
                {
                    finalResult.ErrorCode = 1;
                    finalResult.Message = args.Length == 0
                        ? "Missing input parameter."
                        : "Invalid parameters.";

                    Console.WriteLine(args.Length == 0
                        ? "ERROR: Missing input parameter."
                        : "ERROR: Invalid parameters.");

                    Console.WriteLine("Usage:");
                    Console.WriteLine("  CorePlugin.exe <id_file_path_or_folder_path>");
                    Console.WriteLine("  CorePlugin.exe -webp <folder_path>");
                }
            }
            catch (Exception ex)
            {
                // Xử lý exception ở mức cao nhất
                finalResult.ErrorCode = 500;
                finalResult.Message = ex.ToString();
                Console.WriteLine();
                Console.WriteLine($"ERROR: Unexpected exception: {ex.Message}");
                Console.WriteLine($"Details: {ex}");
            }
            finally
            {
                // Tạo file CorePluginOutPut.json bất kể chương trình chạy thành công hay gặp lỗi
                try
                {
                    string outputJson = JsonConvert.SerializeObject(finalResult, Formatting.Indented);
                    string outputFilePath = Path.Combine(Directory.GetCurrentDirectory(), "CorePluginOutPut.json");
                    File.WriteAllText(outputFilePath, outputJson);
                }
                catch (Exception ex)
                {
                    // Nếu không thể ghi file output, chỉ log ra console
                    Console.WriteLine($"WARNING: Failed to create CorePluginOutPut.json: {ex.Message}");
                }
            }

            return finalResult.ErrorCode;
        }

        /// <summary>
        /// Kiểm tra license và trả về ResultData.
        /// </summary>
        private static ResultData CheckLicense()
        {
            var result = new ResultData
            {
                ErrorCode = 0,
                Message = null
            };

            try
            {
                string exeDirectory = AppDomain.CurrentDomain.BaseDirectory;
                string licensePath = Path.Combine(exeDirectory, "license.txt");

                if (!File.Exists(licensePath))
                {
                    result.ErrorCode = 1;
                    result.Message = "License not found";
                    Console.WriteLine("ERROR: License not found (license.txt).");
                    return result;
                }

                string licenseKey = File.ReadAllText(licensePath).Trim();
                if (string.IsNullOrWhiteSpace(licenseKey))
                {
                    result.ErrorCode = 1;
                    result.Message = "License not found";
                    Console.WriteLine("ERROR: License key is empty or invalid in license.txt.");
                    return result;
                }

                if (!LicenseValidator.IsValid(licenseKey, out string licenseError))
                {
                    result.ErrorCode = 1;
                    result.Message = string.IsNullOrWhiteSpace(licenseError)
                        ? "License check failed"
                        : licenseError;
                    Console.WriteLine("ERROR: " + result.Message);
                    return result;
                }

                Console.WriteLine("License is valid. Continuing...");
                Console.WriteLine();
            }
            catch (Exception ex)
            {
                result.ErrorCode = 1;
                result.Message = "Error while checking license: " + ex.Message;
                Console.WriteLine("ERROR: " + result.Message);
                Console.WriteLine("Details: " + ex);
            }

            return result;
        }

        /// <summary>
        /// Tạo cấu hình và xử lý file ID (PixelSearcher).
        /// </summary>
        /// <param name="inputPath">Đường dẫn file ID hoặc thư mục chứa ID.png</param>
        private static ResultData ProcessInputAndGenerateConfig(string inputPath)
        {
            var result = new ResultData
            {
                ErrorCode = 0,
                Message = null
            };

            Console.WriteLine($"Input: {inputPath}");

            string idPngPath;
            string inputFolder;

            if (File.Exists(inputPath))
            {
                // Đường dẫn đầy đủ tới file ID
                idPngPath = inputPath;
                inputFolder = Path.GetDirectoryName(inputPath);
                Console.WriteLine($"Using ID file: {idPngPath}");
                Console.WriteLine($"Folder: {inputFolder}");
            }
            else if (Directory.Exists(inputPath))
            {
                inputFolder = inputPath;
                idPngPath = Path.Combine(inputFolder, "ID.png");
                Console.WriteLine($"Using folder; ID file: {idPngPath}");
            }
            else
            {
                result.ErrorCode = 1;
                result.Message = $"File or folder does not exist: {inputPath}";
                Console.WriteLine($"ERROR: {result.Message}");
                return result;
            }

            if (idPngPath != null && inputFolder != null)
            {
                // Kiểm tra bắt buộc phải có file goc.jpg trong cùng thư mục với file ID
                string originalJpgPath = Path.Combine(inputFolder, "goc.jpg");
                if (!File.Exists(originalJpgPath))
                {
                    result.ErrorCode = 1;
                    result.Message = "Không tìm thấy file goc.jpg trong thư mục chứa file đã chọn.";
                    Console.WriteLine($"ERROR: {result.Message}");
                    return result;
                }

                string colorSettingPath = Path.Combine(inputFolder, "color_setting.json");
                string outputPath = Path.Combine(inputFolder, "output.json");

                if (!File.Exists(idPngPath))
                {
                    result.ErrorCode = 1;
                    result.Message = $"File ID not found: {idPngPath}";
                    Console.WriteLine($"ERROR: {result.Message}");
                    return result;
                }

                // Nếu không có color_setting.json trong thư mục chứa ID,
                // sử dụng file mặc định đi kèm CorePlugin (CorePlugin/color_setting.json).
                if (!File.Exists(colorSettingPath))
                {
                    string exeDirectory = AppDomain.CurrentDomain.BaseDirectory;
                    string defaultColorSettingPath = Path.Combine(exeDirectory, "color_setting.json");

                    if (File.Exists(defaultColorSettingPath))
                    {
                        Console.WriteLine($"WARNING: color_setting.json not found in folder: {inputFolder}");
                        Console.WriteLine($"Using default color_setting.json from: {defaultColorSettingPath}");
                        colorSettingPath = defaultColorSettingPath;
                    }
                    else
                    {
                        result.ErrorCode = 1;
                        result.Message = $"File color_setting.json not found in folder: {inputFolder} and default color_setting.json not found at: {defaultColorSettingPath}";
                        Console.WriteLine($"ERROR: {result.Message}");
                        // Không tiếp tục xử lý nếu không có được file cấu hình màu
                        return result;
                    }
                }

                Console.WriteLine($"Found file ID: {idPngPath}");
                Console.WriteLine($"Found file color_setting.json: {colorSettingPath}");

                if (File.Exists(outputPath))
                {
                    File.Delete(outputPath);
                    Console.WriteLine($"Deleted old output file: {outputPath}");
                }

                try
                {
                    Console.WriteLine();
                    Console.WriteLine("Starting processing...");
                    PixelSearcher searcher = new PixelSearcher();
                    searcher.SearchPixels(idPngPath, colorSettingPath, outputPath);

                    Console.WriteLine();
                    Console.WriteLine($"Completed! Results written to: {outputPath}");
                    result.ErrorCode = 0;
                }
                catch (Exception ex)
                {
                    result.ErrorCode = 500;
                    result.Message = ex.ToString();
                    Console.WriteLine();
                    Console.WriteLine($"ERROR: Error during processing: {ex.Message}");
                    Console.WriteLine($"Details: {ex}");
                }
            }

            return result;
        }

        /// <summary>
        /// Convert toàn bộ file PNG trong thư mục sang WebP.
        /// </summary>
        /// <param name="folderPath">Thư mục chứa file PNG</param>
        private static ResultData ConvertPngFolderToWebP(string folderPath)
        {
            var result = new ResultData
            {
                ErrorCode = 0,
                Message = null
            };

            // Kiểm tra thư mục có tồn tại không
            if (!Directory.Exists(folderPath))
            {
                result.ErrorCode = 1;
                result.Message = $"Folder does not exist: {folderPath}";
                Console.WriteLine($"ERROR: Folder does not exist: {folderPath}");
                return result;
            }

            try
            {
                WebPConverter converter = new WebPConverter();
                int convertedCount = converter.ConvertPngToWebP(folderPath);

                if (convertedCount > 0)
                {
                    Console.WriteLine();
                    Console.WriteLine($"Successfully converted {convertedCount} PNG file(s) to WebP format.");
                    result.ErrorCode = 0;
                }
                else
                {
                    Console.WriteLine();
                    Console.WriteLine("No PNG files found to convert.");
                    result.ErrorCode = 0; // Không phải lỗi nếu không có file PNG
                }
            }
            catch (Exception ex)
            {
                result.ErrorCode = 500;
                result.Message = ex.ToString();
                Console.WriteLine();
                Console.WriteLine($"ERROR: Error during PNG to WebP conversion: {ex.Message}");
                Console.WriteLine($"Details: {ex}");
            }

            return result;
        }
    }

    /// <summary>
    /// Lớp kiểm tra license.
    /// TODO: Thay thế thân hàm IsValid bằng logic check license
    /// giống project trong thư mục
    /// C:\Users\Administrator\source\repos\AutoLayerSeparatorLicenseManager\AutoLayerSeparatorPluginInstaller
    /// để đảm bảo compatibility với key hiện tại.
    /// </summary>
    public class ResultData
    {
        public int ErrorCode { get; set; }
        public string Message { get; set; }
    }

    internal static class LicenseValidator
    {
        // TODO: Cập nhật base URL này giống với _apiBaseUrl trong AutoLayerSeparatorPluginInstaller
        private const string ApiBaseUrl = "https://license_autolayerseparator.dinhvi24.com/api";

        private class LicenseValidationResponse
        {
            public bool Status { get; set; }
            public string Message { get; set; }
        }

        /// <summary>
        /// Kiểm tra license key bằng cách gọi API /license/validate giống btnCheckLicense_Click.
        /// </summary>
        /// <param name="licenseKey">License key đọc từ file license.txt</param>
        /// <param name="errorMessage">Thông báo lỗi (nếu có)</param>
        /// <returns>true nếu license hợp lệ, false nếu không.</returns>
        public static bool IsValid(string licenseKey, out string errorMessage)
        {
            errorMessage = null;

            if (string.IsNullOrWhiteSpace(licenseKey))
            {
                errorMessage = "License key is empty or invalid.";
                return false;
            }

            try
            {
                using (var httpClient = new HttpClient())
                {
                    httpClient.Timeout = TimeSpan.FromSeconds(15);

                    var request = new { LicenseKey = licenseKey };
                    var json = JsonConvert.SerializeObject(request);
                    var content = new StringContent(json, Encoding.UTF8, "application/json");

                    var url = $"{ApiBaseUrl.TrimEnd('/')}/license/validate";
                    var response = httpClient.PostAsync(url, content).Result;
                    var responseContent = response.Content.ReadAsStringAsync().Result;

                    if (!response.IsSuccessStatusCode)
                    {
                        errorMessage = $"License server error: {(int)response.StatusCode} {response.StatusCode}";
                        return false;
                    }

                    var result = JsonConvert.DeserializeObject<LicenseValidationResponse>(responseContent);
                    if (result == null)
                    {
                        errorMessage = "Invalid response from license server.";
                        return false;
                    }

                    if (result.Status)
                    {
                        return true;
                    }

                    errorMessage = string.IsNullOrWhiteSpace(result.Message)
                        ? "License is not valid."
                        : result.Message;
                    return false;
                }
            }
            catch (Exception ex)
            {
                errorMessage = "Error while contacting license server: " + ex.Message;
                return false;
            }
        }
    }
}
