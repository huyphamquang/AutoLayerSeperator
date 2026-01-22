// Add this to the top of your main.js file
var config_info = null;
const csLib = new CSInterface();
var hostEnv = csLib.getHostEnvironment();

// Debug configuration - set to true to enable debug messages
const DEBUG_ENABLED = true;

// Debug function to print debug information
function printDebug(message) {
  if (!DEBUG_ENABLED) return;
  
  var timestamp = new Date().toLocaleTimeString();
  var debugMsg = `[${timestamp}] ${message}`;
  
  // Log to console for debugging
  console.log(debugMsg);
}

// CSXSEvent listener for debug messages from hostscript.js
function onCSXSEvent(event) {
  if (event.type === "com.adobe.csxs.events.Application" && event.data) {
    try {
      var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (data.type === "DEBUG_MESSAGE") {
        var timestamp = new Date().toLocaleTimeString();
        var debugMsg = `[${timestamp}] [HOSTSCRIPT] ${data.message}`;
        console.log(debugMsg);
      }
    } catch (err) {
      // Fallback for simple string messages
      var timestamp = new Date().toLocaleTimeString();
      var debugMsg = `[${timestamp}] [HOSTSCRIPT] ${event.data}`;
      console.log(debugMsg);
    }
  }
}

// Register the CSXSEvent listener
csLib.addEventListener("com.adobe.csxs.events.Application", onCSXSEvent);


const toast = document.querySelector(".toast");
toast.onclick = () => {
  toast.classList.remove("visible");
};
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("visible");
  setTimeout(() => {
    toast.classList.remove("visible");
  }, 5000);
}

function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return /^\s*$/.test(value);
  return false;
}

function trimTrailingLayers(dsLayer, paList) {
  if (!dsLayer || dsLayer.length === 0) {
    return { dsLayer: dsLayer, paList: paList };
  }
  var dsLen = dsLayer.length;
  var newLen = 0;
  for (var idx = dsLen - 1; idx >= 0; idx--) {
    var hasValue = false;
    for (var k = 0; k < paList.length; k++) {
      var val = (paList[k] && paList[k].length > idx) ? paList[k][idx] : null;
      if (!isEmpty(val)) { hasValue = true; break; }
    }
    if (hasValue || !isEmpty(dsLayer[idx])) { newLen = idx + 1; break; }
  }
  if (newLen < dsLen && newLen > 0) {
    printDebug(`Trimming ds_layer from length ${dsLen} to ${newLen}`);
    dsLayer = dsLayer.slice(0, newLen);
    for (var j = 0; j < paList.length; j++) {
      if (paList[j]) paList[j] = paList[j].slice(0, newLen);
    }
    printDebug(`After trim ds_layer: ${JSON.stringify(dsLayer)}`);
    printDebug(`After trim ds_pa: ${JSON.stringify(paList)}`);
  }
  return { dsLayer: dsLayer, paList: paList };
}

function trimDsLayerOnly(dsLayer) {
  if (!dsLayer || dsLayer.length === 0) return dsLayer;
  var dsLen = dsLayer.length;
  var newLen = 0;
  for (var idx = dsLen - 1; idx >= 0; idx--) {
    if (!isEmpty(dsLayer[idx])) { newLen = idx + 1; break; }
  }
  if (newLen > 0 && newLen < dsLen) {
    printDebug(`Trimming ds_layer only from length ${dsLen} to ${newLen}`);
    dsLayer = dsLayer.slice(0, newLen);
    printDebug(`After ds_layer-only trim: ${JSON.stringify(dsLayer)}`);
  }
  return dsLayer;
}

function read_PA(sheet, columnIndex, max_row) {
  printDebug(`read_PA called with columnIndex: ${columnIndex}`);
  let data = [];
  let all_empty = true;
  for (let i = 1; i < max_row; i++) {
    let add = XLSX.utils.encode_cell({ c: columnIndex, r: i });
    let cell = sheet[add];
    let value = cell === undefined || cell == null ? null : cell.v;
    data.push(value);
    if (! isEmpty(value) ) all_empty = false;
  }
   
  printDebug(`read_PA column ${columnIndex} data: ${JSON.stringify(data)} all_empty: ${all_empty}`);
  if (all_empty) return null;
  return data;
}

function getCellValue(cell){
    printDebug(`getCellValue called with cell: ${JSON.stringify(cell)}`);
    if (cell == null || cell === undefined) {
        printDebug("getCellValue returning null (cell is null/undefined)");
        return null;
    }
    printDebug(`getCellValue returning: ${cell.v}`);
    return cell.v;
}

function ExcelDateToJSDate(serial) {
  var utc_days  = Math.floor(serial - 25569);
  var utc_value = utc_days * 86400;                                        
  var date_info = new Date(utc_value * 1000);

  var fractional_day = serial - Math.floor(serial) + 0.0000001;

  var total_seconds = Math.floor(86400 * fractional_day);

  var seconds = total_seconds % 60;

  total_seconds -= seconds;

  var hours = Math.floor(total_seconds / (60 * 60));
  var minutes = Math.floor(total_seconds / 60) % 60;

  return `${date_info.getDate().toString().padStart(2,"0")}/${date_info.getMonth().toString().padStart(2,"0")}/${date_info.getFullYear()}`;
}

function readConfig(data) {
  try {
    printDebug(`Starting readConfig with data length: ${data ? data.length : "null"}`);
    showToast("Đang đọc file cấu hình Excel...");
    
    let options = { 'type': 'array' };
    var wb = XLSX.read(data, options);
    printDebug(`Excel workbook read successfully, sheet names: ${JSON.stringify(wb.SheetNames)}`);
    
    let sheet = wb.Sheets[wb.SheetNames[0]];
    printDebug(`Using first sheet: ${wb.SheetNames[0]}`);
    
    let config = {};
    config.ds_layer = read_PA(sheet, 0, 19);//Danh sách tên của các lớp cần tách
    config.ds_layer = trimDsLayerOnly(config.ds_layer);
    printDebug(`ds_layer: ${JSON.stringify(config.ds_layer)}`);
    
    let paList = [];
  for (let i = 1; i < 9; i++) {//maximize 8 PA
    let pa = read_PA(sheet, i, config.ds_layer.length + 1);
      printDebug(`Reading PA column ${i} result: ${JSON.stringify(pa)}`);
      if (pa == null) break;
      paList.push(pa);
    }
    printDebug(`PA list created with ${paList.length} items: ${JSON.stringify(paList)}`);
    
    config.ds_pa = paList;//Danh sách phương án màu, mỗi phương án bao gồm mảng quy định mã màu của từng layer
    
    config.texture1_folder = getCellValue(sheet["A20"]);//Folder chứa các file ảnh màu sơn, tên file được đặt theo mã màu sơn trùng với giá trị trong mỗi phần tử của phương án màu.
    config.texture2_folder = getCellValue(sheet["A21"]);//Folder bổ xung chứa các file ảnh màu sơn, tên file được đặt theo mã màu sơn trùng với giá trị trong mỗi phần tử của phương án màu.
    config.material_folder = getCellValue(sheet["A22"]);//Folder chứa các file ảnh vật liệu, khi tạo ảnh thuyết minh công trình, plugin sẽ thay thế các layer vật liệu với file ảnh tìm thấy trong thư mục này.
    config.template_file = getCellValue(sheet["A23"]);//File template cần thiết để tạo lớp thuyết minh công trình.
    config.texture4_folder = getCellValue(sheet["A24"]);//Folder gồm ảnh dùng để xác định lớp với tên id.png và ảnh thiết kế côn trình có tên "file tach lop.psd".
    config.agency_name = getCellValue(sheet["A25"]);//Tên đại lý.
    config.create_date = getCellValue(sheet["A26"]);//Ngày thực hiện.
    config.ma_cong_trinh = getCellValue(sheet["A27"]);//Mã công trình.
    
    printDebug("Config values:");
    printDebug(`  texture1_folder: ${config.texture1_folder}`);
    printDebug(`  texture2_folder: ${config.texture2_folder}`);
    printDebug(`  material_folder: ${config.material_folder}`);
    printDebug(`  template_file: ${config.template_file}`);
    printDebug(`  texture4_folder: ${config.texture4_folder}`);
    printDebug(`  agency_name: ${config.agency_name}`);
    printDebug(`  create_date: ${config.create_date}`);
    printDebug(`  ma_cong_trinh: ${config.ma_cong_trinh}`);
    
    if (typeof config.create_date == "number") config.create_date = ExcelDateToJSDate(config.create_date);
    
    printDebug(`Final config object: ${JSON.stringify(config)}`);
    showToast("Đọc file cấu hình thành công!");
    return config;
  } catch (err) {
    showToast("Có lỗi trong quá trình đọc cấu hình excel!");
    printDebug(`ERROR in readConfig: ${err.message}`);
    console.log("Error in readConfig:", err);
    return null;
  }
}


function generate(try_mode) {
  printDebug(`generate() called with try_mode: ${try_mode}`);
  printDebug(`config_info value: ${JSON.stringify(config_info)}`);
  printDebug(`config_info type: ${typeof config_info}`);
  printDebug(`config_info === null: ${config_info === null}`);
  
  // var prs ={file_name:"C:\\Users\\huypq\\OneDrive\\Desktop\\Thuvien_anh\\Vatlieu\\cong_trinh.png", layer_name:"Test"};
  // var script = `addLayerFromFileWithObject(${JSON.stringify(prs)})`;
  // console.log(script);
  // csLib.evalScript(script, (rs)=>{
  //   console.log(rs);
  // });
  
  if (config_info == null){
    printDebug("config_info is null, showing alert");
    alert("Chọn file cấu hình trước khi thực hiện");
    return;
  }

  printDebug("config_info is valid, proceeding with generation");
  printDebug(`config_info.ds_pa length: ${config_info.ds_pa ? config_info.ds_pa.length : "undefined"}`);
  
  config_info.save_as = document.getElementById("cbSaveAs").value;
  config_info.first_pa = try_mode;
  config_info.selected_pa = document.getElementById("cbPA").selectedIndex;
  
  printDebug("Updated config_info:");
  printDebug(`  save_as: ${config_info.save_as}`);
  printDebug(`  first_pa: ${config_info.first_pa}`);
  printDebug(`  selected_pa: ${config_info.selected_pa}`);
  
  if (try_mode == false && config_info.selected_pa > config_info.ds_pa.length ){
    printDebug("Selected PA index exceeds available PAs");
    alert("File cấu hình chỉ có "+ config_info.ds_pa.length + " phương án.");
    return;
  }
  
  var script = `execute_generate_file(${JSON.stringify(config_info)})`;
  printDebug(`Executing script: ${script}`);
  console.log("Executing script:", script);
  showToast("Đang thực hiện tạo file...");
  
  csLib.evalScript(script, (rs)=>{
    printDebug(`Script execution result: ${rs}`);
    console.log("Script result:", rs);
    if (rs === "true" || rs === true) {
      showToast("Thực hiện thành công!");
    } else {
      showToast("Có lỗi xảy ra trong quá trình thực hiện");
    }
  });
}

window.onload = function()
{
  // Button to select and read Excel configuration file
  document.getElementById("btnSelectExcel").addEventListener("click", function(){
    printDebug("btnSelectExcel clicked");
    showToast("Đang mở hộp thoại chọn file...");
    
    // Call selectAndReadConfigFile in hostscript.js to select and read Excel file
    var script = "selectAndReadConfigFile()";
    
    printDebug("Calling selectAndReadConfigFile via evalScript...");
    csLib.evalScript(script, (result) => {
      try {
        printDebug(`selectAndReadConfigFile result: ${result}`);
        
        if (!result || result === "") {
          showToast("Lỗi: Không nhận được kết quả từ hostscript");
          config_info = null;
          document.getElementById("txtExcel").value = "";
          return;
        }
        
        var response = JSON.parse(result);
        printDebug(`Parsed response: ${JSON.stringify(response)}`);
        
        if (!response.success) {
          printDebug(`ERROR: ${response.error}`);
          // Don't show error if user cancelled file selection
          if (response.error !== "No file selected") {
            showToast("Lỗi: " + (response.error || "Không thể đọc file cấu hình"));
          }
          config_info = null;
          document.getElementById("txtExcel").value = "";
          return;
        }
        
        // Set file name to textbox
        if (response.fileName) {
          document.getElementById("txtExcel").value = response.fileName;
          printDebug(`File name set to textbox: ${response.fileName}`);
        }
        
        // Set configuration data
        config_info = response.config;
        printDebug(`selectAndReadConfigFile returned: ${JSON.stringify(config_info)}`);
        
        if (config_info === null) {
          showToast("Lỗi: Không thể đọc file cấu hình");
          document.getElementById("txtExcel").value = "";
          return;
        }
        
        showToast("File cấu hình đã được tải thành công!");
        console.log("Config loaded:", config_info);
      } catch (error) {
        printDebug(`ERROR: Failed to process result: ${error.message}`);
        showToast("Lỗi khi xử lý kết quả: " + error.message);
        console.log("Error:", error);
        config_info = null;
        document.getElementById("txtExcel").value = "";
      }
    });
  });
  
  document.getElementById("btnPopulate").addEventListener("click", ()=>generate(false));
  document.getElementById("btnTry").addEventListener("click", ()=>generate(true));
}

// Debug function to check config_info state
window.debugConfigInfo = function() {
  printDebug("=== DEBUG CONFIG_INFO ===");
  printDebug(`config_info: ${JSON.stringify(config_info)}`);
  printDebug(`config_info type: ${typeof config_info}`);
  printDebug(`config_info === null: ${config_info === null}`);
  if (config_info) {
    printDebug(`config_info.ds_pa: ${JSON.stringify(config_info.ds_pa)}`);
    printDebug(`config_info.ds_layer: ${JSON.stringify(config_info.ds_layer)}`);
    printDebug(`config_info.template_file: ${config_info.template_file}`);
    printDebug(`config_info.texture1_folder: ${config_info.texture1_folder}`);
    printDebug(`config_info.texture2_folder: ${config_info.texture2_folder}`);
    printDebug(`config_info.material_folder: ${config_info.material_folder}`);
    printDebug(`config_info.texture4_folder: ${config_info.texture4_folder}`);
    printDebug(`config_info.agency_name: ${config_info.agency_name}`);
    printDebug(`config_info.create_date: ${config_info.create_date}`);
    printDebug(`config_info.ma_cong_trinh: ${config_info.ma_cong_trinh}`);
  }
  printDebug("=== END DEBUG ===");
  return config_info;
};

// Function to toggle debug mode
function toggleDebug() {
  DEBUG_ENABLED = !DEBUG_ENABLED;
  alert(`Debug mode is now ${DEBUG_ENABLED ? 'ENABLED' : 'DISABLED'}`);
}

// Function to test CSXSEvent communication
function testCSXSEvent() {
  console.log("Testing CSXSEvent communication...");
  var script = 'printDebug("Test message from main.js to hostscript.js")';
  csLib.evalScript(script);
}

