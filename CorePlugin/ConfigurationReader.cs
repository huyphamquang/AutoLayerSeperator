using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using OfficeOpenXml;
using Newtonsoft.Json;

namespace Plugin.Photoshop.AutoLayerSeperator
{
    /// <summary>
    /// Class to read Excel configuration file and save results to config.json
    /// </summary>
    public class ConfigurationReader
    {
        /// <summary>
        /// Read Excel file and save configuration to config.json
        /// </summary>
        /// <param name="excelFilePath">Path to Excel file</param>
        /// <returns>Path to created config.json file, or null if error occurred</returns>
        public string ReadConfig(string excelFilePath)
        {
            try
            {
                Console.WriteLine($"Reading Excel configuration file: {excelFilePath}");

                if (!File.Exists(excelFilePath))
                {
                    Console.WriteLine($"ERROR: File does not exist: {excelFilePath}");
                    return null;
                }

                // Set license context cho EPPlus (Community license)
                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

                var config = new ConfigModel();

                using (var package = new ExcelPackage(new FileInfo(excelFilePath)))
                {
                    // Get first sheet
                    var worksheet = package.Workbook.Worksheets[0];
                    if (worksheet == null)
                    {
                        Console.WriteLine("ERROR: No sheet found in Excel file");
                        return null;
                    }

                    Console.WriteLine($"Reading sheet: {worksheet.Name}");

                    // Read ds_layer from column A (column 1), from row 2 to row 19 (row 1-18, 0-indexed)
                    config.ds_layer = ReadPA(worksheet, 1, 19);
                    config.ds_layer = TrimDsLayerOnly(config.ds_layer);
                    Console.WriteLine($"ds_layer: [{string.Join(", ", config.ds_layer ?? new List<string>())}]");

                    // Read PA columns (columns B to I, i.e. column 2-9), maximum 8 PA
                    var paList = new List<List<string>>();
                    for (int col = 2; col <= 9; col++)
                    {
                        var pa = ReadPA(worksheet, col, (config.ds_layer?.Count ?? 0) + 1);
                        if (pa == null) break;
                        paList.Add(pa);
                        Console.WriteLine($"Successfully read PA column {col}");
                    }
                    config.ds_pa = paList;
                    Console.WriteLine($"Read {paList.Count} color schemes");

                    // Read configuration values from specific cells
                    config.texture1_folder = GetCellValue(worksheet, 20, 1); // A20
                    config.texture2_folder = GetCellValue(worksheet, 21, 1); // A21
                    config.material_folder = GetCellValue(worksheet, 22, 1); // A22
                    config.template_file = GetCellValue(worksheet, 23, 1); // A23
                    config.texture4_folder = GetCellValue(worksheet, 24, 1); // A24
                    config.agency_name = GetCellValue(worksheet, 25, 1); // A25
                    
                    // Read create_date: if Excel number (double) then convert to dd/MM/yyyy,
                    // if text then keep original text value
                    var createDateValue = GetCellValueRaw(worksheet, 26, 1); // A26
                    if (createDateValue is double dateValue)
                    {
                        // Convert Excel number to date format dd/MM/yyyy
                        config.create_date = ExcelDateToJSDate(dateValue);
                    }
                    else
                    {
                        // If text or other types, get string value directly (no conversion)
                        config.create_date = GetCellValue(worksheet, 26, 1);
                    }
                    
                    config.ma_cong_trinh = GetCellValue(worksheet, 27, 1); // A27

                    Console.WriteLine("Configuration values:");
                    Console.WriteLine($"  texture1_folder: {config.texture1_folder}");
                    Console.WriteLine($"  texture2_folder: {config.texture2_folder}");
                    Console.WriteLine($"  material_folder: {config.material_folder}");
                    Console.WriteLine($"  template_file: {config.template_file}");
                    Console.WriteLine($"  texture4_folder: {config.texture4_folder}");
                    Console.WriteLine($"  agency_name: {config.agency_name}");
                    Console.WriteLine($"  create_date: {config.create_date}");
                    Console.WriteLine($"  ma_cong_trinh: {config.ma_cong_trinh}");
                }

                // Save results to config.json file
                string excelDir = Path.GetDirectoryName(excelFilePath);
                string configJsonPath = Path.Combine(excelDir, "config.json");

                string jsonContent = JsonConvert.SerializeObject(config, Formatting.Indented);
                File.WriteAllText(configJsonPath, jsonContent, System.Text.Encoding.UTF8);

                Console.WriteLine($"Configuration saved to: {configJsonPath}");
                return configJsonPath;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR: Error reading Excel configuration file: {ex.Message}");
                Console.WriteLine($"Details: {ex}");
                return null;
            }
        }

        /// <summary>
        /// Read a PA column from Excel sheet
        /// </summary>
        /// <param name="worksheet">Excel worksheet</param>
        /// <param name="columnIndex">Column index (1-based)</param>
        /// <param name="maxRow">Maximum row number (1-based)</param>
        /// <returns>List of string values, or null if column is empty</returns>
        private List<string> ReadPA(ExcelWorksheet worksheet, int columnIndex, int maxRow)
        {
            var data = new List<string>();
            bool allEmpty = true;

            // Read from row 2 to maxRow (1-based index in Excel, EPPlus uses 1-based)
            for (int row = 2; row <= maxRow; row++)
            {
                var cell = worksheet.Cells[row, columnIndex];
                string value = null;

                if (cell.Value != null)
                {
                    // Convert value to string
                    if (cell.Value is DateTime dateTime)
                    {
                        value = dateTime.ToString("dd/MM/yyyy");
                    }
                    else
                    {
                        value = cell.Value.ToString();
                    }
                }

                data.Add(value);
                if (!IsEmpty(value))
                {
                    allEmpty = false;
                }
            }

            if (allEmpty) return null;
            return data;
        }

        /// <summary>
        /// Get value of an Excel cell and convert to string
        /// </summary>
        private string GetCellValue(ExcelWorksheet worksheet, int row, int column)
        {
            var cell = worksheet.Cells[row, column];
            if (cell.Value == null) return null;

            // Convert DateTime to string
            if (cell.Value is DateTime dateTime)
            {
                return dateTime.ToString("dd/MM/yyyy");
            }

            // Convert other types to string
            return cell.Value.ToString();
        }

        /// <summary>
        /// Get raw value of an Excel cell (no conversion)
        /// </summary>
        private object GetCellValueRaw(ExcelWorksheet worksheet, int row, int column)
        {
            var cell = worksheet.Cells[row, column];
            return cell.Value;
        }

        /// <summary>
        /// Check if value is empty
        /// </summary>
        private bool IsEmpty(string value)
        {
            return string.IsNullOrWhiteSpace(value);
        }

        /// <summary>
        /// Remove empty elements at the end of ds_layer
        /// </summary>
        private List<string> TrimDsLayerOnly(List<string> dsLayer)
        {
            if (dsLayer == null || dsLayer.Count == 0) return dsLayer;

            int newLen = 0;
            for (int idx = dsLayer.Count - 1; idx >= 0; idx--)
            {
                if (!IsEmpty(dsLayer[idx]))
                {
                    newLen = idx + 1;
                    break;
                }
            }

            if (newLen > 0 && newLen < dsLayer.Count)
            {
                Console.WriteLine($"Trimming ds_layer from length {dsLayer.Count} to {newLen}");
                dsLayer = dsLayer.Take(newLen).ToList();
            }

            return dsLayer;
        }

        /// <summary>
        /// Convert Excel date to dd/MM/yyyy format
        /// </summary>
        private string ExcelDateToJSDate(double serial)
        {
            // Excel date epoch: January 1, 1900
            // JavaScript date epoch: January 1, 1970
            // Number of days from 1900-01-01 to 1970-01-01 = 25569
            var utcDays = (long)(serial - 25569);
            var utcValue = utcDays * 86400;
            var dateInfo = new DateTime(1970, 1, 1).AddSeconds(utcValue);

            // Handle fractional part (hours, minutes, seconds)
            var fractionalDay = serial - Math.Floor(serial) + 0.0000001;
            var totalSeconds = (long)(86400 * fractionalDay);
            var seconds = totalSeconds % 60;
            totalSeconds -= seconds;
            var hours = totalSeconds / (60 * 60);
            var minutes = (totalSeconds / 60) % 60;

            dateInfo = dateInfo.AddHours(hours).AddMinutes(minutes).AddSeconds(seconds);

            return dateInfo.ToString("dd/MM/yyyy");
        }

        /// <summary>
        /// Configuration model
        /// </summary>
        public class ConfigModel
        {
            public List<string> ds_layer { get; set; }
            public List<List<string>> ds_pa { get; set; }
            public string texture1_folder { get; set; }
            public string texture2_folder { get; set; }
            public string material_folder { get; set; }
            public string template_file { get; set; }
            public string texture4_folder { get; set; }
            public string agency_name { get; set; }
            public string create_date { get; set; }
            public string ma_cong_trinh { get; set; }
        }
    }
}
