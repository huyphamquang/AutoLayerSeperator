// Add this to the top of your main.js file
var config_info = null;
var selectedIdFilePath = null; // full path to selected ID file, used when separating layers
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
if (toast) {
  toast.onclick = () => {
    toast.style.display = "none";
    toast.classList.remove("visible");
  };
}
function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  // Set display to block first, then add visible class for animation
  toast.style.display = "block";
  // Force reflow to ensure display change is applied
  toast.offsetHeight;
  toast.classList.add("visible");
  setTimeout(() => {
    toast.classList.remove("visible");
    // Small delay before hiding to allow fade-out animation
    setTimeout(() => {
      toast.style.display = "none";
    }, 300);
  }, 5000);
}

function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return /^\s*$/.test(value);
  return false;
}


function generate(try_mode) {
  printDebug(`generate() called with try_mode: ${try_mode}`);
  printDebug(`config_info value: ${JSON.stringify(config_info)}`);
  printDebug(`config_info type: ${typeof config_info}`);
  printDebug(`config_info === null: ${config_info === null}`);
  
  if (!selectedIdFilePath || isEmpty(selectedIdFilePath)) {
    printDebug("No ID file selected, showing alert");
    alert("Chọn file ID (tách lớp màu) trước khi thực hiện");
    return;
  }

  // Helper to actually call execute_generate_file once config_info is ready
  function doGenerate() {
    printDebug("config_info is ready, proceeding with generation (separate layers only)");
    var script = `execute_generate_file(${JSON.stringify(config_info)})`;
    printDebug(`Executing script: ${script}`);
    console.log("Executing script:", script);
    
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

  showToast("Đang thực hiện tách lớp...");

  // Escape path for ExtendScript string literal
  var idPathEscaped = selectedIdFilePath.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
  var prepareScript = `prepareConfigFromIdFile("${idPathEscaped}")`;

  csLib.evalScript(prepareScript, (result) => {
    try {
      printDebug(`prepareConfigFromIdFile result: ${result}`);
      if (!result || result === "") {
        showToast("Lỗi: Không nhận được kết quả từ hostscript khi chuẩn bị cấu hình");
        return;
      }
      var response = JSON.parse(result);
      printDebug(`Parsed prepareConfigFromIdFile response: ${JSON.stringify(response)}`);

      if (!response.success) {
        var errorMsg = response.error || "Không thể tạo cấu hình từ file ID";
        showToast("Lỗi: " + errorMsg);
        return;
      }

      config_info = response.config;
      printDebug(`config_info created from prepareConfigFromIdFile: ${JSON.stringify(config_info)}`);

      if (!config_info) {
        showToast("Lỗi: Cấu hình nhận được từ hostscript không hợp lệ");
        return;
      }

      // Sau khi chuẩn bị cấu hình thành công, tiến hành tách lớp
      doGenerate();
    } catch (err) {
      printDebug(`ERROR: Failed to process prepareConfigFromIdFile result: ${err.message}`);
      showToast("Lỗi khi xử lý cấu hình từ file ID: " + err.message);
      console.log("Error:", err);
    }
  });
}

window.onload = function()
{
  // Chọn file ID (id.png) -> mở hộp thoại chọn file, sau đó chạy plugin (tách lớp) như btnPopulate
  document.getElementById("btnSelectFile").addEventListener("click", function(){
    printDebug("btnSelectFile clicked - open file dialog then run plugin");
    
    var script = "selectAndReadConfigFromIdFile()";
    
    printDebug("Calling selectAndReadConfigFromIdFile via evalScript...");
    csLib.evalScript(script, (result) => {
      try {
        printDebug(`selectAndReadConfigFromIdFile result: ${result}`);
        
        if (!result || result === "") {
          showToast("Lỗi: Không nhận được kết quả từ hostscript");
          selectedIdFilePath = null;
          config_info = null;
          return;
        }
        
        var response = JSON.parse(result);
        printDebug(`Parsed response: ${JSON.stringify(response)}`);
        
        if (!response.success) {
          printDebug(`ERROR from selectAndReadConfigFromIdFile: ${response.error}`);
          if (response.error !== "No file selected") {
            var errorMsg = response.error || "Không thể chọn file ID";
            showToast("Lỗi chọn file ID: " + errorMsg);
          }
          selectedIdFilePath = null;
          config_info = null;
          return;
        }
        
        // Save full path to selected ID file; reset cached config so it will be rebuilt in generate()
        selectedIdFilePath = response.filePath || null;
        config_info = null;
        printDebug(`selectedIdFilePath set to: ${selectedIdFilePath}`);
        generate(false);
      } catch (error) {
        printDebug(`ERROR: Failed to process result: ${error.message}`);
        showToast("Lỗi khi xử lý kết quả: " + error.message);
        console.log("Error:", error);
        selectedIdFilePath = null;
        config_info = null;
      }
    });
  });
  
  var btnTry = document.getElementById("btnTry");
  if (btnTry) {
    btnTry.addEventListener("click", ()=>generate(true));
  }
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

