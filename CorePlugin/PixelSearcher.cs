using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Text;

namespace Plugin.Photoshop.AutoLayerSeperator
{
    public class PixelSearcher
    {
        public class LayerConfig
        {
            public string Name { get; set; }
            public string Hex { get; set; }
            public int Similar { get; set; }
        }

        public class PixelResult
        {
            public string Name { get; set; }
            public int X { get; set; }
            public int Y { get; set; }
        }

        public class ColorSetting
        {
            public List<LayerConfig> Layers { get; set; }
        }

        public class OutputData
        {
            public List<PixelResult> Pixels { get; set; }
        }

        public void SearchPixels(string imagePath, string configPath, string outputPath)
        {
            // Đọc cấu hình màu
            Console.WriteLine("Reading color configuration...");
            ColorSetting colorSetting = ReadColorSetting(configPath);
            Console.WriteLine($"Read {colorSetting.Layers.Count} layers from configuration.");

            // Chuyển đổi mã hex sang Color và tính toán tolerance
            Dictionary<Color, LayerConfig> colorToLayerMap = new Dictionary<Color, LayerConfig>();
            List<Color> targetColors = new List<Color>();

            foreach (var layer in colorSetting.Layers)
            {
                Color color = HexToColor(layer.Hex);
                colorToLayerMap[color] = layer;
                targetColors.Add(color);
                Console.WriteLine($"Layer: {layer.Name}, Color: {layer.Hex}, Similar: {layer.Similar}");
            }

            // Đọc ảnh và tìm điểm ảnh
            Console.WriteLine();
            Console.WriteLine("Reading image and searching for pixels...");
            List<PixelResult> results = FindPixelsOptimized(imagePath, colorToLayerMap, targetColors);

            // Ghi kết quả ra file JSON
            Console.WriteLine();
            Console.WriteLine($"Found {results.Count} pixels.");
            WriteOutputJson(outputPath, results);
        }

        private ColorSetting ReadColorSetting(string configPath)
        {
            string jsonContent = File.ReadAllText(configPath, Encoding.UTF8);
            
            // Parse JSON đơn giản (có thể dùng Newtonsoft.Json nhưng để đơn giản tự parse)
            var setting = new ColorSetting { Layers = new List<LayerConfig>() };

            // Parse JSON thủ công
            jsonContent = jsonContent.Trim();
            if (!jsonContent.StartsWith("{") || !jsonContent.Contains("\"layers\""))
            {
                throw new Exception("Invalid JSON format.");
            }

            // Tìm mảng layers
            int layersStart = jsonContent.IndexOf("\"layers\"");
            if (layersStart == -1)
            {
                throw new Exception("Layers array not found in JSON.");
            }

            int arrayStart = jsonContent.IndexOf('[', layersStart);
            if (arrayStart == -1)
            {
                throw new Exception("Layers array not found.");
            }

            // Parse từng layer
            int pos = arrayStart + 1;
            while (pos < jsonContent.Length)
            {
                int objStart = jsonContent.IndexOf('{', pos);
                if (objStart == -1) break;

                int objEnd = jsonContent.IndexOf('}', objStart);
                if (objEnd == -1) break;

                string layerJson = jsonContent.Substring(objStart, objEnd - objStart + 1);
                LayerConfig layer = ParseLayerJson(layerJson);
                setting.Layers.Add(layer);

                pos = objEnd + 1;
            }

            return setting;
        }

        private LayerConfig ParseLayerJson(string json)
        {
            var layer = new LayerConfig();

            // Parse name
            int nameIdx = json.IndexOf("\"name\"");
            if (nameIdx != -1)
            {
                int colonIdx = json.IndexOf(':', nameIdx);
                int quoteStart = json.IndexOf('"', colonIdx) + 1;
                int quoteEnd = json.IndexOf('"', quoteStart);
                layer.Name = json.Substring(quoteStart, quoteEnd - quoteStart);
            }

            // Parse hex
            int hexIdx = json.IndexOf("\"hex\"");
            if (hexIdx != -1)
            {
                int colonIdx = json.IndexOf(':', hexIdx);
                int quoteStart = json.IndexOf('"', colonIdx) + 1;
                int quoteEnd = json.IndexOf('"', quoteStart);
                layer.Hex = json.Substring(quoteStart, quoteEnd - quoteStart);
            }

            // Parse similar
            int similarIdx = json.IndexOf("\"similar\"");
            if (similarIdx != -1)
            {
                int colonIdx = json.IndexOf(':', similarIdx);
                int valueStart = colonIdx + 1;
                while (valueStart < json.Length && char.IsWhiteSpace(json[valueStart])) valueStart++;
                int valueEnd = valueStart;
                while (valueEnd < json.Length && char.IsDigit(json[valueEnd])) valueEnd++;
                if (int.TryParse(json.Substring(valueStart, valueEnd - valueStart), out int similar))
                {
                    layer.Similar = similar;
                }
                else
                {
                    layer.Similar = 1;
                }
            }
            else
            {
                layer.Similar = 1;
            }

            return layer;
        }

        private Color HexToColor(string hex)
        {
            hex = hex.Trim().TrimStart('#');
            if (hex.Length == 6)
            {
                int r = Convert.ToInt32(hex.Substring(0, 2), 16);
                int g = Convert.ToInt32(hex.Substring(2, 2), 16);
                int b = Convert.ToInt32(hex.Substring(4, 2), 16);
                return Color.FromArgb(r, g, b);
            }
            throw new Exception($"Invalid hex color format: {hex}");
        }

        private List<PixelResult> FindPixelsOptimized(string imagePath, Dictionary<Color, LayerConfig> colorToLayerMap, List<Color> targetColors)
        {
            List<PixelResult> results = new List<PixelResult>();
            HashSet<Color> foundColors = new HashSet<Color>();

            using (Bitmap bitmap = new Bitmap(imagePath))
            {
                int width = bitmap.Width;
                int height = bitmap.Height;
                Console.WriteLine($"Kích thước ảnh: {width} x {height}");

                // Khóa bitmap để truy cập trực tiếp vùng nhớ
                BitmapData bitmapData = bitmap.LockBits(
                    new Rectangle(0, 0, width, height),
                    ImageLockMode.ReadOnly,
                    PixelFormat.Format32bppArgb);

                try
                {
                    unsafe
                    {
                        byte* ptr = (byte*)bitmapData.Scan0;
                        int stride = bitmapData.Stride;

                        // Quét ảnh một lượt duy nhất
                        for (int y = 0; y < height && foundColors.Count < targetColors.Count; y++)
                        {
                            byte* row = ptr + (y * stride);
                            for (int x = 0; x < width && foundColors.Count < targetColors.Count; x++)
                            {
                                // Đọc màu pixel (BGRA format)
                                int b = row[x * 4];
                                int g = row[x * 4 + 1];
                                int r = row[x * 4 + 2];
                                int a = row[x * 4 + 3];

                                Color pixelColor = Color.FromArgb(a, r, g, b);

                                // Kiểm tra với từng màu target
                                foreach (var targetColor in targetColors)
                                {
                                    if (foundColors.Contains(targetColor))
                                        continue;

                                    LayerConfig layer = colorToLayerMap[targetColor];
                                    if (IsColorMatch(pixelColor, targetColor, layer.Similar))
                                    {
                                        results.Add(new PixelResult
                                        {
                                            Name = layer.Name,
                                            X = x,
                                            Y = y
                                        });
                                        foundColors.Add(targetColor);
                                        Console.WriteLine($"Found pixel for layer '{layer.Name}' at ({x}, {y})");
                                        break; // Đã tìm thấy, không cần kiểm tra các màu khác
                                    }
                                }
                            }
                        }
                    }
                }
                finally
                {
                    bitmap.UnlockBits(bitmapData);
                }
            }

            return results;
        }

        private bool IsColorMatch(Color pixelColor, Color targetColor, int similar)
        {
            // Tính khoảng cách màu sử dụng công thức Euclidean
            int deltaR = Math.Abs(pixelColor.R - targetColor.R);
            int deltaG = Math.Abs(pixelColor.G - targetColor.G);
            int deltaB = Math.Abs(pixelColor.B - targetColor.B);

            // Similar = 1 nghĩa là tolerance nhỏ, cần khớp chính xác hơn
            // Tính tolerance dựa trên similar (similar càng lớn thì tolerance càng lớn)
            int tolerance = similar * 3; // Điều chỉnh theo nhu cầu

            return deltaR <= tolerance && deltaG <= tolerance && deltaB <= tolerance;
        }

        private void WriteOutputJson(string outputPath, List<PixelResult> results)
        {
            StringBuilder json = new StringBuilder();
            json.AppendLine("{");
            json.AppendLine("    \"pixels\":");
            json.AppendLine("    [");

            for (int i = 0; i < results.Count; i++)
            {
                var result = results[i];
                json.Append($"        {{\"name\": \"{result.Name}\", \"x\": {result.X}, \"y\": {result.Y}}}");
                if (i < results.Count - 1)
                {
                    json.Append(",");
                }
                json.AppendLine();
            }

            json.AppendLine("    ]");
            json.AppendLine("}");

            File.WriteAllText(outputPath, json.ToString(), Encoding.UTF8);
        }
    }
}
