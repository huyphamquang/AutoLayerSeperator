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
if (toast) {
  toast.onclick = () => {
    toast.style.display = "none";
    toast.classList.remove("visible");
  };
}
function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = "block";
  toast.classList.add("visible");
  setTimeout(() => {
    toast.style.display = "none";
    toast.classList.remove("visible");
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

// Function to update button states based on config_info
function updateButtonStates() {
  var hasConfig = config_info !== null && config_info !== undefined;
  var btnTry = document.getElementById("btnTry");
  var btnPopulate = document.getElementById("btnPopulate");
  
  if (btnTry) {
    btnTry.disabled = !hasConfig;
  }
  if (btnPopulate) {
    btnPopulate.disabled = !hasConfig;
  }
  
  printDebug(`Button states updated - hasConfig: ${hasConfig}`);
}

window.onload = function()
{
  // Disable buttons initially
  updateButtonStates();
  
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
          updateButtonStates();
          return;
        }
        
        var response = JSON.parse(result);
        printDebug(`Parsed response: ${JSON.stringify(response)}`);
        
        if (!response.success) {
          printDebug(`ERROR: ${response.error}`);
          // Don't show error if user cancelled file selection
          if (response.error !== "No file selected") {
            var errorMsg = response.error || "Không thể đọc file cấu hình";
            showToast("Lỗi đọc file cấu hình:\n" + errorMsg);
          }
          config_info = null;
          document.getElementById("txtExcel").value = "";
          updateButtonStates();
          return;
        }
        
        // Set file name to textbox (decode URL encoding if present)
        if (response.fileName) {
          var displayFileName = response.fileName;
          // Decode URL encoding (e.g., %20 -> space)
          try {
            if (displayFileName.indexOf("%") !== -1) {
              displayFileName = decodeURIComponent(displayFileName);
            }
          } catch (e) {
            // If decode fails, use original name
            printDebug("Warning: Could not decode file name: " + e.message);
          }
          document.getElementById("txtExcel").value = displayFileName;
          printDebug(`File name set to textbox: ${displayFileName}`);
        }
        
        // Set configuration data
        config_info = response.config;
        printDebug(`selectAndReadConfigFile returned: ${JSON.stringify(config_info)}`);
        
        if (config_info === null || config_info === undefined) {
          showToast("Lỗi: Không thể đọc file cấu hình");
          document.getElementById("txtExcel").value = "";
          updateButtonStates();
          return;
        }
        
        // Show success message - use alert to ensure user sees it
        var fileName = response.fileName || "N/A";
        var successMsg = "File cấu hình đã được đọc thành công!\n\nFile: " + fileName;
        alert(successMsg);
        showToast("✓ File cấu hình đã được đọc thành công! (" + fileName + ")");
        console.log("Config loaded:", config_info);
        
        // Update button states
        updateButtonStates();
      } catch (error) {
        printDebug(`ERROR: Failed to process result: ${error.message}`);
        showToast("Lỗi khi xử lý kết quả: " + error.message);
        console.log("Error:", error);
        config_info = null;
        document.getElementById("txtExcel").value = "";
        updateButtonStates();
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

