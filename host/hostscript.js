//  json2.js
//  2023-05-10
//  Public Domain.
//  NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

//  USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
//  NOT CONTROL.

//  This file creates a global JSON object containing two methods: stringify
//  and parse. This file provides the ES5 JSON capability to ES3 systems.
//  If a project might run on IE8 or earlier, then this file should be included.
//  This file does nothing on ES5 systems.

/*jslint
    eval, for, this
*/

/*property
    JSON, apply, call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/

// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (typeof JSON !== "object") {
    JSON = {};
}

(function () {
    "use strict";

    var rx_one = /^[\],:{}\s]*$/;
    var rx_two = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
    var rx_three = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
    var rx_four = /(?:^|:|,)(?:\s*\[)+/g;
    var rx_escapable = /[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
    var rx_dangerous = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

    function f(n) {
        // Format integers to have at least two digits.
        return (n < 10)
            ? "0" + n
            : n;
    }

    function this_value() {
        return this.valueOf();
    }

    if (typeof Date.prototype.toJSON !== "function") {

        Date.prototype.toJSON = function () {

            return isFinite(this.valueOf())
                ? (
                    this.getUTCFullYear()
                    + "-"
                    + f(this.getUTCMonth() + 1)
                    + "-"
                    + f(this.getUTCDate())
                    + "T"
                    + f(this.getUTCHours())
                    + ":"
                    + f(this.getUTCMinutes())
                    + ":"
                    + f(this.getUTCSeconds())
                    + "Z"
                )
                : null;
        };

        Boolean.prototype.toJSON = this_value;
        Number.prototype.toJSON = this_value;
        String.prototype.toJSON = this_value;
    }

    var gap;
    var indent;
    var meta;
    var rep;

    function quote(string) {

        // If the string contains no control characters, no quote characters, and no
        // backslash characters, then we can safely slap some quotes around it.
        // Otherwise we must also replace the offending characters with safe escape
        // sequences.

        rx_escapable.lastIndex = 0;
        return rx_escapable.test(string)
            ? "\"" + string.replace(rx_escapable, function (a) {
                var c = meta[a];
                return typeof c === "string"
                    ? c
                    : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
            }) + "\""
            : "\"" + string + "\"";
    }

    function str(key, holder) {

        // Produce a string from holder[key].

        var i;          // The loop counter.
        var k;          // The member key.
        var v;          // The member value.
        var length;
        var mind = gap;
        var partial;
        var value = holder[key];

        // If the value has a toJSON method, call it to obtain a replacement value.

        if (
            value
            && typeof value === "object"
            && typeof value.toJSON === "function"
        ) {
            value = value.toJSON(key);
        }

        // If we were called with a replacer function, then call the replacer to
        // obtain a replacement value.

        if (typeof rep === "function") {
            value = rep.call(holder, key, value);
        }

        // What happens next depends on the value's type.

        switch (typeof value) {
            case "string":
                return quote(value);

            case "number":

                // JSON numbers must be finite. Encode non-finite numbers as null.

                return (isFinite(value))
                    ? String(value)
                    : "null";

            case "boolean":
            case "null":

                // If the value is a boolean or null, convert it to a string. Note:
                // typeof null does not produce "null". The case is included here in
                // the remote chance that this gets fixed someday.

                return String(value);

            // If the type is "object", we might be dealing with an object or an array or
            // null.

            case "object":

                // Due to a specification blunder in ECMAScript, typeof null is "object",
                // so watch out for that case.

                if (!value) {
                    return "null";
                }

                // Make an array to hold the partial results of stringifying this object value.

                gap += indent;
                partial = [];

                // Is the value an array?

                if (Object.prototype.toString.apply(value) === "[object Array]") {

                    // The value is an array. Stringify every element. Use null as a placeholder
                    // for non-JSON values.

                    length = value.length;
                    for (i = 0; i < length; i += 1) {
                        partial[i] = str(i, value) || "null";
                    }

                    // Join all of the elements together, separated with commas, and wrap them in
                    // brackets.

                    v = partial.length === 0
                        ? "[]"
                        : gap
                            ? (
                                "[\n"
                                + gap
                                + partial.join(",\n" + gap)
                                + "\n"
                                + mind
                                + "]"
                            )
                            : "[" + partial.join(",") + "]";
                    gap = mind;
                    return v;
                }

                // If the replacer is an array, use it to select the members to be stringified.

                if (rep && typeof rep === "object") {
                    length = rep.length;
                    for (i = 0; i < length; i += 1) {
                        if (typeof rep[i] === "string") {
                            k = rep[i];
                            v = str(k, value);
                            if (v) {
                                partial.push(quote(k) + (
                                    (gap)
                                        ? ": "
                                        : ":"
                                ) + v);
                            }
                        }
                    }
                } else {

                    // Otherwise, iterate through all of the keys in the object.

                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = str(k, value);
                            if (v) {
                                partial.push(quote(k) + (
                                    (gap)
                                        ? ": "
                                        : ":"
                                ) + v);
                            }
                        }
                    }
                }

                // Join all of the member texts together, separated with commas,
                // and wrap them in braces.

                v = partial.length === 0
                    ? "{}"
                    : gap
                        ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}"
                        : "{" + partial.join(",") + "}";
                gap = mind;
                return v;
        }
    }

    // If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== "function") {
        meta = {    // table of character substitutions
            "\b": "\\b",
            "\t": "\\t",
            "\n": "\\n",
            "\f": "\\f",
            "\r": "\\r",
            "\"": "\\\"",
            "\\": "\\\\"
        };
        JSON.stringify = function (value, replacer, space) {

            // The stringify method takes a value and an optional replacer, and an optional
            // space parameter, and returns a JSON text. The replacer can be a function
            // that can replace values, or an array of strings that will select the keys.
            // A default replacer method can be provided. Use of the space parameter can
            // produce text that is more easily readable.

            var i;
            gap = "";
            indent = "";

            // If the space parameter is a number, make an indent string containing that
            // many spaces.

            if (typeof space === "number") {
                for (i = 0; i < space; i += 1) {
                    indent += " ";
                }

                // If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === "string") {
                indent = space;
            }

            // If there is a replacer, it must be a function or an array.
            // Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== "function" && (
                typeof replacer !== "object"
                || typeof replacer.length !== "number"
            )) {
                throw new Error("JSON.stringify");
            }

            // Make a fake root object containing our value under the key of "".
            // Return the result of stringifying the value.

            return str("", { "": value });
        };
    }

    // If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== "function") {
        JSON.parse = function (text, reviver) {

            // The parse method takes a text and an optional reviver function, and returns
            // a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

                // The walk method is used to recursively walk the resulting structure so
                // that modifications can be made.

                var k;
                var v;
                var value = holder[key];
                if (value && typeof value === "object") {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }

            // Parsing happens in four stages. In the first stage, we replace certain
            // Unicode characters with escape sequences. JavaScript handles many characters
            // incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            rx_dangerous.lastIndex = 0;
            if (rx_dangerous.test(text)) {
                text = text.replace(rx_dangerous, function (a) {
                    return (
                        "\\u"
                        + ("0000" + a.charCodeAt(0).toString(16)).slice(-4)
                    );
                });
            }

            // In the second stage, we run the text against regular expressions that look
            // for non-JSON patterns. We are especially concerned with "()" and "new"
            // because they can cause invocation, and "=" because it can cause mutation.
            // But just to be safe, we want to reject all unexpected forms.

            // We split the second stage into 4 regexp operations in order to work around
            // crippling inefficiencies in IE's and Safari's regexp engines. First we
            // replace the JSON backslash pairs with "@" (a non-JSON character). Second, we
            // replace all simple value tokens with "]" characters. Third, we delete all
            // open brackets that follow a colon or comma or that begin the text. Finally,
            // we look to see that the remaining characters are only whitespace or "]" or
            // "," or ":" or "{" or "}". If that is so, then the text is safe for eval.

            if (
                rx_one.test(
                    text
                        .replace(rx_two, "@")
                        .replace(rx_three, "]")
                        .replace(rx_four, "")
                )
            ) {

                // In the third stage we use the eval function to compile the text into a
                // JavaScript structure. The "{" operator is subject to a syntactic ambiguity
                // in JavaScript: it can begin a block or an object literal. We wrap the text
                // in parens to eliminate the ambiguity.

                j = eval("(" + text + ")");

                // In the optional fourth stage, we recursively walk the new structure, passing
                // each name/value pair to a reviver function for possible transformation.

                return (typeof reviver === "function")
                    ? walk({ "": j }, "")
                    : j;
            }

            // If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError("JSON.parse");
        };
    }
}());

// End of json2.js inclusion

const img_exts = ["png", "jpg"];
const prefix = "khung_";
const prefix_pa_mau = "pa_mau_";
const prefix_pa_mau_text = "pa_mau_text_";
var color_setting = null; //All color layer config will be load when execute_generate_file executed.
var colors = null; //color layer config will be load when execute_generate_file executed.   


function readJSONFile(jsonFile) {
    // Set UTF-8 encoding for Unicode support (Vietnamese characters)
    jsonFile.encoding = "UTF8";
    jsonFile.open("r");
    var json = jsonFile.read();
    jsonFile.close()
    return JSON.parse(json);
}



// Debug mode control
var DEBUG_MODE = true; // Set to false to disable debug logging

// Debug function for Photoshop environment using CSXSEvent
function printDebug(message) {
    try {
        // Use CSEvent constructor and CSInterface to dispatch
        // var csInterface = new CSInterface();
        // var event = new CSEvent("com.adobe.csxs.events.Application", "APPLICATION");
        // event.data = {
        //     type: "DEBUG_MESSAGE",
        //     message: message,
        //     timestamp: new Date().toISOString()
        // };
        // csInterface.dispatchEvent(event);
        // Write to Photoshop's console for backup
        $.writeln("DEBUG: " + message);

        // Write to log file only if DEBUG_MODE is enabled
        if (DEBUG_MODE) {
            writeToLogFile(message);
        }

        //alert("DEBUG: " + message);

    } catch (err) {
        // Fallback to alert if CSXSEvent fails
        alert("DEBUG: \r\n" + err + "\r\n" + message);
    }
}

var firstTimeAppend = true;
// Function to write debug messages to log file
function writeToLogFile(message) {
    // Check if debug mode is enabled
    if (!DEBUG_MODE) {
        return;
    }

    try {
        // Create log file path on Desktop
        var logFile = new File(Folder.desktop + "/AutoLayerSeparator_Debug.log");

        // Set UTF-8 encoding for Unicode support (Vietnamese characters)
        logFile.encoding = "UTF8";
        
        // Open file for appending
        logFile.open("a"); // Append mode

        // Create timestamp
        var timestamp = new Date();
        function zeroPad(num, size) {
            num = String(num);
            while (num.length < size) num = "0" + num;
            return num;
        }
        var timeString = timestamp.getFullYear() + "-" +
            zeroPad((timestamp.getMonth() + 1), 2) + "-" +
            zeroPad(timestamp.getDate(), 2) + " " +
            zeroPad(timestamp.getHours(), 2) + ":" +
            zeroPad(timestamp.getMinutes(), 2) + ":" +
            zeroPad(timestamp.getSeconds(), 2) + "." +
            zeroPad(timestamp.getMilliseconds(), 3);

        // Write debug message with timestamp
        logFile.writeln("[" + timeString + "] DEBUG: " + message);

        // Close file
        logFile.close();

    } catch (err) {
        // If log file writing fails, just continue silently
        // Don't throw error to avoid breaking the main debug flow
        if (!firstTimeAppend) return;
        firstTimeAppend = false;//prevent show alert many times
        alert("WARNING: Failed to write to log file: " + err.toString());
    }
}


function openTemplateFile(config) {
    try {
        //alert(config);
        template_file = config.template_file;
        var fileRef = new File(template_file);
        var docRef = open(fileRef);
        return docRef;
    } catch (err) {
        alert(err);
        return null;
    }
}


function addLayerFromFileWithObject(prs) {
    return addLayerFromFile(null, prs.file_name, prs.layer_name);
}

function getValue(desc, typeID) {
    var stringID = typeIDToStringID(typeID);
    var typeString = (desc.getType(typeID)).toString();
    switch (typeString) {
        case "DescValueType.BOOLEANTYPE":
            return desc.getBoolean(typeID);
        case "DescValueType.DOUBLETYPE":
            return desc.getDouble(typeID);
        case "DescValueType.INTEGERTYPE":
            return desc.getInteger(typeID);
        case "DescValueType.STRINGTYPE":
            return desc.getString(typeID);
        case 'DescValueType.OBJECTTYPE':
            return desc.getObjectValue(typeID);
    }
    return null;
}

function addLayerFromFile(doc, file_name, layer_name) {
    printDebug("addLayerFromFile: start | file='" + file_name + "' layer_name='" + layer_name + "'");
    var f = new File(file_name);
    if (!f || !f.exists) {
        printDebug("addLayerFromFile: file not found -> " + file_name);
        alert("Cannot add layer from file: " + file_name + "\r\nFile not found.");
        return null;
    }
    printDebug("addLayerFromFile: file exists -> " + f.fsName);
    try {
        if (doc == null) doc = activeDocument;
        app.activeDocument = doc;
        printDebug("addLayerFromFile: placing file via ActionDescriptor");
        var idPlc = charIDToTypeID("Plc ");
        var desc407 = new ActionDescriptor();
        var idIdnt = charIDToTypeID("Idnt");
        desc407.putInteger(idIdnt, 17);
        var idnull = charIDToTypeID("null");
        desc407.putPath(idnull, f);
        var rs = executeAction(idPlc, desc407, DialogModes.NO);
        if (rs == null) {
            printDebug("addLayerFromFile: place returned null result");
            throw new Error("Place returned null result");
        }
        var layer_id = getValue(rs, rs.getKey(0));
        printDebug("addLayerFromFile: placed layer id=" + layer_id);
        for (var i = 0; i < doc.layers.length; i++) {
            var layer = doc.layers[i];
            if (layer.id != layer_id) continue;
            layer.name = layer_name;
            var bounds = layer.bounds;
            printDebug("addLayerFromFile: placed layer found and renamed to '" + layer_name + "'");
            return layer;
        }
        // If we couldn't find by id, fall through to fallback method
        printDebug("addLayerFromFile: placed layer not found by id, using fallback");
        throw new Error("Placed layer not found by id");
    } catch (err) {
        // Fallback: open the file and duplicate its top layer into target doc
        try {
            printDebug("addLayerFromFile: fallback open and duplicate start");
            var originalDoc = app.activeDocument;
            var opened = app.open(f);
            var srcDoc = app.activeDocument;
            if (srcDoc.layers && srcDoc.layers.length > 0) {
                var srcLayer = srcDoc.activeLayer;
                srcLayer.name = layer_name;
                srcLayer.duplicate(doc, ElementPlacement.PLACEATBEGINNING);
                app.activeDocument = doc;
                var newLayer = doc.activeLayer;
                newLayer.name = layer_name;
                app.activeDocument = srcDoc;
                srcDoc.close(SaveOptions.DONOTSAVECHANGES);
                app.activeDocument = originalDoc;
                printDebug("addLayerFromFile: fallback duplicate succeeded -> '" + newLayer.name + "'");
                return newLayer;
            } else {
                printDebug("addLayerFromFile: fallback failed, opened document has no layers");
                app.activeDocument = originalDoc;
                srcDoc.close(SaveOptions.DONOTSAVECHANGES);
                alert("Cannot add layer from file: " + file_name + "\r\nOpened document has no layers.");
                return null;
            }
        } catch (fallbackErr) {
            printDebug("addLayerFromFile: fallback error -> " + fallbackErr);
            alert("Cannot add layer from file: " + file_name + "\r\n" + fallbackErr);
            return null;
        }
    }
}

function createBound(top, left, width, height) {
    return {
        top: top,
        left: left,
        width: width,
        height: height,
        bottom: top + height,
        right: left + width
    };
}

function getCenterBound(bound) {
    return {
        x: bound.left + bound.width / 2,
        y: bound.top + bound.height / 2
    };
}

function getLayerBound(layer) {
    var bounds = layer.bounds;
    return {
        top: bounds[1].value,
        left: bounds[0].value,
        width: bounds[2].value - bounds[0].value + 1,
        height: bounds[3].value - bounds[1].value + 1,
        bottom: bounds[3].value,
        right: bounds[2].value
    };
}

function replaceImageToLayer(img_file, layer, keep_aspect) {
    // inspectValue(img_file);
    //  inspectValue( layer.name);
    //   inspectValue( layer.parent);
    var new_layer = addLayerFromFile(layer.parent, img_file, layer.name);
    if (new_layer == null) return;
    var des_bound = getLayerBound(layer);
    var img_bound = getLayerBound(new_layer);
    var scale_x = des_bound.width * 100 / img_bound.width;
    var scale_y = des_bound.height * 100 / img_bound.height;
    if (!keep_aspect) new_layer.resize(scale_x, scale_y);
    else {
        var scale = scale_x < scale_y ? scale_x : scale_y;
        //scale *= 100;
        new_layer.resize(scale, scale);
    }
    img_bound = getLayerBound(new_layer);
    var x1 = img_bound.left + img_bound.width / 2;
    var y1 = img_bound.bottom;

    var x2 = des_bound.left + des_bound.width / 2;
    var y2 = des_bound.bottom;

    new_layer.translate(x2 - x1, y2 - y1);
    new_layer.move(layer, ElementPlacement.PLACEBEFORE);
    layer.remove();
}

function moveLayerToBoundWithLeftCenterAlignment(layer, des_bound) {
    var img_bound = getLayerBound(layer);
    var y1 = img_bound.top + img_bound.height / 2;
    var y2 = des_bound.top + des_bound.height / 2;
    layer.translate(des_bound.left - img_bound.left, y2 - y1);
}

function addImageToBound(img_file, document, des_bound, layer_name) {
    var new_layer = addLayerFromFile(document, img_file, layer_name);
    if (new_layer == null) return;
    var img_bound = getLayerBound(new_layer);
    var scale_x = des_bound.width * 100 / img_bound.width;
    var scale_y = des_bound.height * 100 / img_bound.height;
    new_layer.resize(scale_x, scale_y);
    moveLayerToBoundWithLeftCenterAlignment(new_layer, des_bound);
    return new_layer;
}

function applyStype(from_layer, to_layer) {
    // =======================================================
    var idslct = charIDToTypeID("slct");
    var desc2505 = new ActionDescriptor();
    var idnull = charIDToTypeID("null");
    var ref357 = new ActionReference();
    var idLyr = charIDToTypeID("Lyr ");
    ref357.putName(idLyr, "8002");
    desc2505.putReference(idnull, ref357);
    var idMkVs = charIDToTypeID("MkVs");
    desc2505.putBoolean(idMkVs, false);
    var idLyrI = charIDToTypeID("LyrI");
    var list401 = new ActionList();
    list401.putInteger(43);
    desc2505.putList(idLyrI, list401);
    executeAction(idslct, desc2505, DialogModes.NO);

    var idPaFX = charIDToTypeID("PaFX");
    var desc2502 = new ActionDescriptor();
    var idallowPasteFXOnLayerSet = stringIDToTypeID("allowPasteFXOnLayerSet");
    desc2502.putBoolean(idallowPasteFXOnLayerSet, true);
    executeAction(idPaFX, desc2502, DialogModes.NO);
}

function transferEffects(layer1, layer2) {
    app.activeDocument.activeLayer = layer1;
    try {
        var id157 = charIDToTypeID("CpFX");
        executeAction(id157, undefined, DialogModes.ALL);
        app.activeDocument.activeLayer = layer2;
        var id158 = charIDToTypeID("PaFX");
        executeAction(id158, undefined, DialogModes.ALL);
    } catch (e) {
        //alert("the layer has no effects");
        //app.activeDocument.activeLayer = layer2;
    }
};

function confirmContinue(message) {
    message = message + '\r\nBạn muốn tiếp tục?';
    return confirm(message);
}

function gen_pa_mau(color_code, color_layer, text_layer, folders) {
    if (text_layer != null) text_layer.textItem.contents = color_code;
    var image_entry = findInfolder(color_code, img_exts, folders);
    if (image_entry == null) {
        return confirmContinue("Color code not found: " + color_code);
    }
    //inspectValue(image_entry);
    replaceImageToLayer(image_entry, color_layer, false);
    return true;
}

// function gen_pa_mau(pa_info, layer, folders) {
//     //find legend text layer
//     var doc = layer.parent;
//     var text_layer = layer.parent.layers.getByName('ten_mau');
//     if (text_layer == null) {
//         alert("Không tìm thấy layer ten_mau");
//         return false;
//     }
//     var color_layer = layer.parent.layers.getByName('chu_thich_mau');
//     if (color_layer == null) {
//         alert("Không tìm thấy layer chu_thich_mau");
//         return false;
//     }

//     var color_bound = getLayerBound(color_layer);
//     var text_bound = getLayerBound(text_layer);
//     var bound = getLayerBound(layer);
//     var img_width = color_bound.width;
//     var text_width = bound.right - text_bound.left;
//     var space = 10;
//     var offset = 0;
//     for (i = 0; i < pa_info.length; i++) {
//         var color_code = pa_info[i];
//         var image_entry = findInfolder(color_code, img_exts, folders);
//         if (image_entry == null) {
//             alert("Không tìm thấy mã mầu " + color_code);
//             return false;
//         }
//         var img_bound = createBound(color_bound.top + offset, color_bound.left, color_bound.width, color_bound.height);
//         var color_layper_item = addImageToBound(image_entry, layer.document, img_bound, color_code);
//         transferEffects(color_layer, color_layper_item);
//         color_layper_item.name = color_code;
//         moveLayerToBoundWithLeftCenterAlignment(color_layper_item, img_bound);
//         var layer_text_new = text_layer.duplicate();
//         layer_text_new.textItem.contents = color_code;
//         moveLayerToBoundWithLeftCenterAlignment(layer_text_new, createBound(text_bound.top + offset, text_bound.left, text_bound.width, text_bound.height));
//         offset += color_bound.height + space;
//     }
//     layer.remove();
//     text_layer.remove();
//     color_layer.remove();
// }

function isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === "string") return /^\s*$/.test(value);
    return false;
}

function extract_last_3_parts(path) {
    if (isEmpty(path)) return null;
    if (path.slice(-1) == "\\") path = path.substring(0, path.length - 1);
    var myArray = path.split("\\");
    var idx = myArray.length - 3;
    if (idx < 0) idx = 0;
    var str = "";
    for (var idx; idx < myArray.length; idx++) {
        if (!isEmpty(str)) str += "\\";
        str += myArray[idx];
    }
    return str;
}

function findInfolder(file_name, allow_exts, folders) {
    for (var i = 0; i < allow_exts.length; i++) {
        for (var j = 0; j < folders.length; j++) {
            if (isEmpty(folders[j])) continue;
            var path = folders[j] + "\\" + file_name + "." + allow_exts[i];
            try {
                var file = new File(path);
                //inspectValue(file);
                if (file.exists) {
                    //inspectValue("found: " + path);
                    return path;
                }
            } catch (err) {
                continue;
            }
        }
    }
    return null;
}

function exportFile(doc, filePath, type, closeAfter) {
    var opt = null;
    switch (type.toLowerCase()) {
        case "psd":
            opt = new PhotoshopSaveOptions();
            break;
        case "jpg":
            opt = new JPEGSaveOptions();
            opt.quality = 12;
            break;
        case "png":
            // Export PNG with highest quality using PNGSaveOptions
            // This preserves full color depth, transparency, and smooth edges without compression artifacts
            opt = new PNGSaveOptions();
            opt.compression = 5; // 0 = no compression (highest quality), 9 = maximum compression
            opt.interlaced = false; // No interlacing for highest quality
            // PNGSaveOptions automatically preserves transparency and full color depth (24-bit)
            // This ensures smooth edges and prevents jagged edges between opaque and transparent areas
            break;
        case "tiff":
            opt = new TiffSaveOptions();
            opt.jpegQuality = 12;
            break;
    }
    //inspectValue(filePath);
    //inspectValue(opt);
    doc.saveAs(new File(filePath), opt, true);
    if (closeAfter) doc.close(SaveOptions.DONOTSAVECHANGES);
}

function inspectValue(value) {
    alert(value == null ? "NULL" : value.toString());
}

function findVisibleLayerByName(doc, layer_name) {
    for (var i = 0; i < doc.layers.length; i++) {
        var layer = doc.layers[i];
        if (layer.visible == false) continue;
        if (layer.name == layer_name) return layer;
    }
    return null;
}

function updateLayerText(layer, text_content) {
    if (layer == null) return;
    text_content = isEmpty(text_content) ? " " : text_content;
    layer.textItem.contents = text_content;
}
function generateDocFromConfig(config, doc, idx_pa, remove_template_layer) {
    //inspectValue(idx_pa);
    //inspectValue(doc.layers);

    // Remove empty values from config.ds_pa[idx_pa] before processing
    if (config.ds_pa && config.ds_pa[idx_pa]) {
        var filteredArray = [];
        for (var i = 0; i < config.ds_pa[idx_pa].length; i++) {
            if (!isEmpty(config.ds_pa[idx_pa][i])) {
                filteredArray.push(config.ds_pa[idx_pa][i]);
            }
        }
        config.ds_pa[idx_pa] = filteredArray;
        printDebug("Filtered empty values from config.ds_pa[" + idx_pa + "]: " + JSON.stringify(config.ds_pa[idx_pa]));
    }

    var layers = [];
    var str = "";
    for (var i = 0; i < doc.layers.length; i++) {
        var layer = doc.layers[i];
        str += layer.name + "\r\n";
        if (layer.visible == false || layer.name.indexOf(prefix_pa_mau_text) == 0) continue;
        layers.push(layer);
    }
    //alert(str);
    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        var name = layer.name.toLowerCase();
        //inspectValue(name);
        switch (name) {
            case "ngay_thuc_hien":
                updateLayerText(layer, config.create_date);
                break;
            case "stt_pa":
                updateLayerText(layer, (idx_pa + 1).toString());
                break;
            case "ten_dai_ly":
                updateLayerText(layer, config.agency_name);
                break;
            case "duong_dan":
                updateLayerText(layer, extract_last_3_parts(config.texture4_folder));
                break;
            case "ma_cong_trinh":
                updateLayerText(layer, config.ma_cong_trinh);
                break;
            case "anh_pa":
                var file_entry = findInfolder((idx_pa + 1).toString(), img_exts, [config.texture4_folder, config.texture4_folder + "\\PATK"]);
                if (file_entry == null) {
                    if (!confirmContinue('Image ' + (idx_pa + 1).toString() + ' not found in folder ' + config.texture4_folder)) return false;
                }
                else replaceImageToLayer(file_entry, layer, true);
                break;
            // case "ds_pa_mau":
            //     gen_pa_mau(config.ds_pa[idx_pa], layer, [config.texture1_folder, config.texture2_folder]);
            //     break;
            default:
                if (name.indexOf(prefix) == 0) {
                    var file_name = name.substring(prefix.length);
                    //inspectValue(file_name);
                    var file_entry = findInfolder(file_name, img_exts, [config.material_folder, config.texture4_folder]);
                    if (file_entry == null) {
                        if (!confirmContinue('Layer ' + name + ' - Image not found: ' + file_name)) return false;
                    }
                    else replaceImageToLayer(file_entry, layer, true);
                }
                if (name.indexOf(prefix_pa_mau) == 0) {
                    var pa_index = name.substring(prefix_pa_mau.length);
                    var text_layer = findVisibleLayerByName(doc, prefix_pa_mau_text + pa_index);//doc.layers.getByName(prefix_pa_mau_text + pa_index);
                    //inspectValue(text_layer);
                    var pa_index_int = parseInt(pa_index) - 1;
                    // inspectValue(pa_index);
                    if (config.ds_pa[idx_pa].length <= pa_index_int) {
                        if (remove_template_layer) {
                            //inspectValue(config.ds_pa[idx_pa].length <= pa_index_int);
                            layer.remove();
                            if (text_layer != null) {
                                text_layer.remove();
                            }
                            //inspectValue(config.ds_pa[idx_pa].length <= pa_index_int);
                        }
                    }
                    else if (!gen_pa_mau(config.ds_pa[idx_pa][pa_index_int], layer, text_layer, [config.texture1_folder, config.texture2_folder])) return false;
                }

        }
    }
    if (remove_template_layer) {
        var file_new = config.texture4_folder + "\\PA_" + (idx_pa + 1).toString() + "." + config.save_as;
        exportFile(doc, file_new, config.save_as, true);
    }
    return true;
}

// Helper function to recursively delete folder and its contents
function deleteFolderRecursively(folder) {
    try {
        if (!folder.exists) {
            return true;
        }

        // Delete all files in the folder
        var files = folder.getFiles();
        for (var i = 0; i < files.length; i++) {
            if (files[i] instanceof File) {
                files[i].remove();
            } else if (files[i] instanceof Folder) {
                deleteFolderRecursively(files[i]);
            }
        }

        // Now remove the empty folder
        folder.remove();
        return true;
    } catch (err) {
        printDebug("ERROR deleting folder " + folder.fsName + ": " + err.toString());
        return false;
    }
}

// Bước 2: Tạo folder output cho kết quả tách lớp
function createOutputFolders(config) {
    try {
        printDebug("Creating output folders (layers only)...");

        // Tạo folder layers để lưu kết quả tách lớp
        var layersFolder = new Folder(config.texture4_folder + "\\layers");
        if (layersFolder.exists) {
            printDebug("Layers folder exists, deleting recursively: " + layersFolder.fsName);
            if (!deleteFolderRecursively(layersFolder)) {
                printDebug("WARNING: Failed to delete existing layers folder");
            }
        }
        layersFolder.create();
        printDebug("Layers folder created: " + layersFolder.fsName);

        printDebug("Output folder (layers) created successfully");
        return true;
    } catch (err) {
        printDebug("ERROR in createOutputFolders: " + err.toString());
        alert("Error creating output folder: " + err);
        return false;
    }
}

// Check if current selection is empty or invisible
function IsHasSelection(doc) {
    try {
        // Check if there's an active selection
        if (!doc.selection) {
            printDebug("IsHasSelection: No selection object found");
            return false;
        }

        // Get selection bounds
        var bounds = doc.selection.bounds;

        // Check if bounds are valid and have area
        if (!bounds) {
            printDebug("IsHasSelection: No selection bounds found");
            return false;
        }

        // Calculate selection area
        var width = bounds[2] - bounds[0];  // right - left
        var height = bounds[3] - bounds[1]; // bottom - top

        // Selection is valid if it has positive area
        var hasArea = (width > 0) && (height > 0);

        printDebug("IsHasSelection - Bounds: L=" + bounds[0] + ", T=" + bounds[1] + ", R=" + bounds[2] + ", B=" + bounds[3]);
        printDebug("IsHasSelection - Area: " + width + "x" + height + " = " + (width * height));
        printDebug("IsHasSelection - Valid: " + hasArea);

        return hasArea;

    } catch (e) {
        printDebug("IsHasSelection error: " + e.toString());
        return false;
    }
}

function cTID(s) { return app.charIDToTypeID(s); }
function sTID(s) { return app.stringIDToTypeID(s); }

function similar(tolerance, antiAlias) {
    try {
        // Defaults
        if (typeof tolerance === 'undefined' || tolerance === null) tolerance = 32;
        if (typeof antiAlias === 'undefined' || antiAlias === null) antiAlias = true;

        printDebug("Executing 'Similar' selection with tolerance=" + tolerance + ", antiAlias=" + antiAlias);
        var idSmlr = charIDToTypeID("Smlr");
        var desc5 = new ActionDescriptor();
        var idnull = charIDToTypeID("null");
        var ref1 = new ActionReference();
        var idChnl = charIDToTypeID("Chnl");
        var idfsel = charIDToTypeID("fsel");
        ref1.putProperty(idChnl, idfsel);
        desc5.putReference(idnull, ref1);
        var idTlrn = charIDToTypeID("Tlrn");
        desc5.putInteger(idTlrn, tolerance);
        var idAntA = charIDToTypeID("AntA");
        desc5.putBoolean(idAntA, antiAlias);
        executeAction(idSmlr, desc5, DialogModes.NO);
        printDebug("'Similar' selection executed successfully");
        return true;
    } catch (e) {
        printDebug("ERROR in similar(): " + e.toString());
        alert("Error executing 'Similar' selection: " + e);
        return false;
    }
}

function hexC(hex) {
    // http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
    hex = hex.substring(1, 7)
    bigint = parseInt(hex, 16);
    var color = new ActionDescriptor()
    color.putDouble(cTID("Rd  "), (bigint >> 16) & 255);
    color.putDouble(cTID("Grn "), (bigint >> 8) & 255);
    color.putDouble(cTID("Bl  "), bigint & 255);
    return color
}

function selectColorRangeWithFuzziness(color1, color2, fuzziness) {
    var desc = new ActionDescriptor();
    desc.putInteger(cTID("Fzns"), fuzziness);
    desc.putObject(cTID("Mnm "), cTID("RGBC"), color1);
    desc.putObject(cTID("Mxm "), cTID("RGBC"), color2);
    executeAction(cTID("ClrR"), desc, DialogModes.NO);
}

function selectColorRange(color1, color2) {
    var desc = new ActionDescriptor();
    var my_fuzziness = color_setting.fuzziness
    desc.putInteger(cTID("Fzns"), my_fuzziness);
    desc.putObject(cTID("Mnm "), cTID("RGBC"), color1);
    desc.putObject(cTID("Mxm "), cTID("RGBC"), color2);
    executeAction(cTID("ClrR"), desc, DialogModes.NO);
}

/**
 * Hàm thực hiện chọn vùng bằng Magic Wand và mở rộng ra các pixel tương đồng
 * @param {Number} x - Tọa độ ngang (pixel)
 * @param {Number} y - Tọa độ dọc (pixel)
 * @param {Number} tolerance - Độ sai số màu (0-255)
 * @param {Boolean} antiAlias - Có làm mượt biên hay không
 */
function applyMagicWandAndSimilar(x, y, tolerance, antiAlias) {
    try {
        var s2t = stringIDToTypeID;

        // --- BƯỚC 1: LỆNH MAGIC WAND (SET SELECTION) ---
        var desc = new ActionDescriptor();
        var ref = new ActionReference();
        ref.putProperty(s2t("channel"), s2t("selection"));
        desc.putReference(s2t("null"), ref);

        // Tọa độ click
        var pointDesc = new ActionDescriptor();
        pointDesc.putUnitDouble(s2t("horizontal"), s2t("pixelsUnit"), x);
        pointDesc.putUnitDouble(s2t("vertical"), s2t("pixelsUnit"), y);
        desc.putObject(s2t("to"), s2t("point"), pointDesc);

        // Các tham số của Magic Wand
        desc.putInteger(s2t("tolerance"), tolerance);
        desc.putBoolean(s2t("antiAlias"), antiAlias);
        desc.putBoolean(s2t("contiguous"), false); // tìm trên toàn bộ ảnh

        // Thực hiện chọn vùng tại điểm x, y
        executeAction(s2t("set"), desc, DialogModes.NO);
    } catch (e) {
        alert("Lỗi thực thi Action Manager: " + e);
    }
}

function magicWand(x, y, tolerance, anit_alias, contiguous, sampleAll) {
    printDebug("=== magicWand START ===");
    printDebug("Step 0: Called with parameters: x=" + x + ", y=" + y + ", tolerance=" + tolerance + ", anit_alias=" + anit_alias + ", contiguous=" + contiguous + ", sampleAll=" + sampleAll);

    // Kiểm tra tham số bắt buộc
    printDebug("Step 0.1: Validating required parameters...");
    if (arguments.length < 2) {
        printDebug("ERROR Step 0.1: Missing required parameters (x, y)");
        return;
    }
    printDebug("Step 0.1: Required parameters validated - OK");

    // Thiết lập giá trị mặc định cho các tham số tùy chọn
    printDebug("Step 0.2: Setting default values for optional parameters...");
    if (undefined == tolerance) {
        tolerance = 32;
        printDebug("Step 0.2.1: Tolerance set to default: 32");
    } else {
        printDebug("Step 0.2.1: Tolerance: " + tolerance);
    }

    if (undefined == anit_alias) {
        anit_alias = true;
        printDebug("Step 0.2.2: Anti-alias set to default: true");
    } else {
        printDebug("Step 0.2.2: Anti-alias: " + anit_alias);
    }

    if (undefined == contiguous) {
        contiguous = false;
        printDebug("Step 0.2.3: Contiguous set to default: false");
    } else {
        printDebug("Step 0.2.3: Contiguous: " + contiguous);
    }

    if (undefined == sampleAll) {
        sampleAll = false;
        printDebug("Step 0.2.4: SampleAll set to default: false");
    } else {
        printDebug("Step 0.2.4: SampleAll: " + sampleAll);
    }

    printDebug("Step 0.2: All parameters configured");

    // Tạo ActionDescriptor
    printDebug("Step 1: Creating ActionDescriptor...");
    var desc = new ActionDescriptor();
    printDebug("Step 1.1: ActionDescriptor created");

    // Tạo ActionReference cho selection channel
    printDebug("Step 2: Creating ActionReference for selection channel...");
    var ref = new ActionReference();
    ref.putProperty(charIDToTypeID('Chnl'), charIDToTypeID('fsel'));
    printDebug("Step 2.1: Reference property set: Chnl -> fsel");

    desc.putReference(charIDToTypeID('null'), ref);
    printDebug("Step 2.2: Reference added to descriptor");

    // Tạo position descriptor cho điểm click
    printDebug("Step 3: Creating position descriptor for click point...");
    var positionDesc = new ActionDescriptor();
    printDebug("Step 3.1: Position descriptor created");

    positionDesc.putUnitDouble(charIDToTypeID('Hrzn'), charIDToTypeID('#Rlt'), x);
    printDebug("Step 3.2: X coordinate set: " + x + " (relative units)");

    positionDesc.putUnitDouble(charIDToTypeID('Vrtc'), charIDToTypeID('#Rlt'), y);
    printDebug("Step 3.3: Y coordinate set: " + y + " (relative units)");

    desc.putObject(charIDToTypeID('T   '), charIDToTypeID('Pnt '), positionDesc);
    printDebug("Step 3.4: Position descriptor added to main descriptor");

    // Thiết lập các tham số Magic Wand
    printDebug("Step 4: Setting Magic Wand parameters...");

    desc.putInteger(charIDToTypeID('Tlrn'), tolerance);
    printDebug("Step 4.1: Tolerance set to: " + tolerance);

    desc.putBoolean(charIDToTypeID('Mrgd'), sampleAll);
    printDebug("Step 4.2: SampleAll (Mrgd) set to: " + sampleAll);

    if (!contiguous) {
        desc.putBoolean(charIDToTypeID('Cntg'), false);
        printDebug("Step 4.3: Contiguous (Cntg) set to: false");
    } else {
        printDebug("Step 4.3: Contiguous (Cntg) not set (using default)");
    }

    desc.putBoolean(charIDToTypeID('AntA'), anit_alias);
    printDebug("Step 4.4: Anti-alias (AntA) set to: " + anit_alias);

    printDebug("Step 4.5: All Magic Wand parameters configured");

    // Thực thi Magic Wand action
    printDebug("Step 5: Executing Magic Wand action (setd)...");
    try {
        executeAction(charIDToTypeID('setd'), desc, DialogModes.NO);
        printDebug("Step 5: Magic Wand action executed successfully");
        printDebug("=== magicWand COMPLETED ===");
    } catch (e) {
        printDebug("ERROR Step 5: Magic Wand action failed: " + e.toString());
        printDebug("ERROR Step 5: Error message: " + (e.message || "N/A"));
        printDebug("ERROR Step 5: Error stack: " + (e.stack || "N/A"));
        printDebug("=== magicWand ERROR ===");
        throw e;
    }
};
// Hàm mới: Tạo vùng chọn bằng Magic Wand tại vị trí điểm ảnh đã cho
// Vị trí điểm ảnh đã được CorePlugin.exe tìm sẵn, không cần tìm lại
function selectColorRangeWithMagicWand(hexColor, x, y) {
    try {
        printDebug("=== selectColorRangeWithMagicWand START ===");
        printDebug("Step 0: Called with hexColor: " + hexColor + ", x: " + x + ", y: " + y);

        var doc = activeDocument;
        if (!doc) {
            printDebug("ERROR Step 0: No active document");
            return false;
        }
        printDebug("Step 0: Active document found: " + doc.name);

        // Đảm bảo document ở chế độ RGB
        printDebug("Step 0.1: Checking document mode...");
        if (doc.mode != DocumentMode.RGB) {
            printDebug("ERROR Step 0.1: Document must be in RGB mode, current mode: " + doc.mode);
            return false;
        }
        printDebug("Step 0.1: Document is in RGB mode - OK");

        // Kiểm tra tọa độ hợp lệ
        printDebug("Step 0.2: Validating coordinates...");
        var width = doc.width.value;
        var height = doc.height.value;
        if (x < 0 || x >= width || y < 0 || y >= height) {
            printDebug("ERROR Step 0.2: Invalid coordinates - x=" + x + ", y=" + y + " (document size: " + width + "x" + height + ")");
            return false;
        }
        printDebug("Step 0.2: Coordinates validated - OK");

        // Xóa selection hiện có
        printDebug("Step 1: Deselecting current selection...");
        doc.selection.deselect();
        printDebug("Step 1: Selection deselected");

        // Bước 2: Tạo vùng chọn bằng Magic Wand tại vị trí điểm ảnh đã cho
        printDebug("=== Step 2: Creating Magic Wand selection ===");
        printDebug("Step 2.1: Using Magic Wand at position: " + x + "," + y);

        try {
            // Sử dụng hàm magicWand với tolerance từ color_setting
            var tolerance = color_setting ? color_setting.fuzziness : 50;
            printDebug("Step 2.1.1: Calling magicWand with tolerance: " + tolerance);
            magicWand(x, y, tolerance, true, false);
            printDebug("Step 2.1: Magic Wand executed successfully");
        } catch (e) {
            printDebug("ERROR Step 2.1: Exception in magicWand: " + e.toString());
            printDebug("ERROR Step 2.1: Error details: " + (e.message || "N/A"));
            return false;
        }

        // Kiểm tra xem có selection không sau khi Magic Wand
        printDebug("Step 2.2: Checking if Magic Wand created selection...");
        if (!IsHasSelection(doc)) {
            printDebug("ERROR Step 2.2: No selection created by Magic Wand");
            return false;
        }
        printDebug("Step 2.2: Selection created successfully");

        printDebug("=== selectColorRangeWithMagicWand SUCCESS ===");
        printDebug("Magic Wand selection created successfully at: " + x + "," + y);
        return true;

    } catch (err) {
        printDebug("=== selectColorRangeWithMagicWand ERROR ===");
        printDebug("ERROR: " + err.toString());
        printDebug("Error message: " + (err.message || "N/A"));
        printDebug("Error stack: " + (err.stack || "N/A"));
        printDebug("Error line: " + (err.line || "N/A"));
        return false;
    }
}

function hasSelection() {
    var ref = new ActionReference();
    ref.putProperty(charIDToTypeID("Prpr"), charIDToTypeID("MnHd")); // "selection header"
    ref.putClass(charIDToTypeID("Chnl")); // target is selection channel

    try {
        var desc = executeActionGet(ref);
        return desc.hasKey(charIDToTypeID("MnHd")); // true if a selection exists
    } catch (e) {
        return false; // no selection at all
    }
}

function setFillLayerColor(r, g, b) {
    try {
        // Build descriptor for new color
        var colorDesc = new ActionDescriptor();
        colorDesc.putDouble(charIDToTypeID("Rd  "), r);
        colorDesc.putDouble(charIDToTypeID("Grn "), g);
        colorDesc.putDouble(charIDToTypeID("Bl  "), b);

        var solidDesc = new ActionDescriptor();
        solidDesc.putObject(charIDToTypeID("Clr "), charIDToTypeID("RGBC"), colorDesc);

        // Target the current fill layer's content
        var ref = new ActionReference();
        ref.putEnumerated(stringIDToTypeID("contentLayer"),
            charIDToTypeID("Ordn"),
            charIDToTypeID("Trgt"));

        var mainDesc = new ActionDescriptor();
        mainDesc.putReference(charIDToTypeID("null"), ref);
        mainDesc.putObject(charIDToTypeID("T   "),
            stringIDToTypeID("solidColorLayer"),
            solidDesc);

        // Execute the "set" action
        executeAction(charIDToTypeID("setd"), mainDesc, DialogModes.NO);
    } catch (e) {
        printDebug("Error: " + e.toString());
    }
}

// Apply Color Overlay effect with configurable blend mode
// Parameters:
//   r, g, b: RGB color values (0-255)
//   blendMode: "normal" or "multiply" (default: "multiply")
function setColorOverlayMultiply(r, g, b, blendMode) {
    var s2t = function (s) {
        return app.stringIDToTypeID(s);
    };

    // Set default blend mode to "multiply" if not specified (for backward compatibility)
    if (blendMode === undefined || blendMode === null) {
        blendMode = "multiply";
    }
    
    // Validate blend mode - only allow "normal" or "multiply"
    if (blendMode !== "normal" && blendMode !== "multiply") {
        printDebug("WARNING: Invalid blend mode '" + blendMode + "'. Using 'multiply' as default.");
        blendMode = "multiply";
    }

    var descriptor = new ActionDescriptor();
    var reference = new ActionReference();
    
    // Chỉ định đối tượng tác động là Layer Effects của Layer hiện tại
    reference.putProperty(s2t("property"), s2t("layerEffects"));
    reference.putEnumerated(s2t("layer"), s2t("ordinal"), s2t("targetEnum"));
    descriptor.putReference(s2t("null"), reference);

    var layerEffectsDesc = new ActionDescriptor();
    var colorOverlayDesc = new ActionDescriptor();
    
    // Cấu hình màu sắc (RGB)
    var colorDesc = new ActionDescriptor();
    colorDesc.putDouble(s2t("red"), r);
    colorDesc.putDouble(s2t("grain"), g); // Green
    colorDesc.putDouble(s2t("blue"), b);
    
    colorOverlayDesc.putBoolean(s2t("enabled"), true);
    
    // Set blend mode: "normal" or "multiply"
    colorOverlayDesc.putEnumerated(s2t("mode"), s2t("blendMode"), s2t(blendMode));
    
    colorOverlayDesc.putUnitDouble(s2t("opacity"), s2t("percentUnit"), 100);
    colorOverlayDesc.putObject(s2t("color"), s2t("RGBColor"), colorDesc);

    // Gán hiệu ứng Color Overlay (solidFill) vào danh sách Layer Effects
    layerEffectsDesc.putObject(s2t("solidFill"), s2t("solidFill"), colorOverlayDesc);
    descriptor.putObject(s2t("to"), s2t("layerEffects"), layerEffectsDesc);

    // Thực thi lệnh set
    executeAction(s2t("set"), descriptor, DialogModes.NO);
}


// Common function to find and run CorePlugin.exe
// Returns an object with: { ErrorCode: number, Message: string|null, ... }
// Parameters:
//   - args: Array of arguments to pass to CorePlugin.exe (e.g., ["-c", "path/to/file.xlsx"] or ["folder/path"])
function executeCorePlugin(args) {
    try {
        printDebug("=== executeCorePlugin START ===");
        printDebug("Step 1: Preparing to run CorePlugin.exe...");
        printDebug("Step 1.1: Arguments: " + JSON.stringify(args));
        
        // Find CorePlugin.exe in plugin directory
        var pluginFolder = null;
        // Extension folder name (under Adobe CEP\\extensions)
        // Example production path:
        //   C:\\Program Files (x86)\\Common Files\\Adobe\\CEP\\extensions\\AutoLayerSeperatorLicense
        var pluginName = "AutoLayerSeperatorLicense";
        
        printDebug("Step 1.2: Searching for plugin directory...");
        
        var cepBasePaths = [];
        
        try {
            var userDataPath = Folder.userData.fsName + "\\Adobe\\CEP\\extensions";
            cepBasePaths.push(userDataPath);
            printDebug("Step 1.2.1: UserData CEP path: " + userDataPath);
        } catch (e) {
            printDebug("WARNING Step 1.2.1: Could not get userData path: " + e.toString());
        }
        
        try {
            var commonFilesPath = Folder.commonFiles.fsName + "\\Adobe\\CEP\\extensions";
            cepBasePaths.push(commonFilesPath);
            printDebug("Step 1.2.2: CommonFiles CEP path: " + commonFilesPath);
        } catch (e) {
            printDebug("WARNING Step 1.2.2: Could not get commonFiles path: " + e.toString());
        }
        
        cepBasePaths.push("C:\\Program Files (x86)\\Common Files\\Adobe\\CEP\\extensions");
        cepBasePaths.push("C:\\Program Files\\Common Files\\Adobe\\CEP\\extensions");
        
        for (var i = 0; i < cepBasePaths.length; i++) {
            var testPath = cepBasePaths[i] + "\\" + pluginName;
            var manifestPath = testPath + "\\CSXS\\manifest.xml";
            var manifestFile = new File(manifestPath);
            
            printDebug("Step 1.2." + (i + 3) + ": Checking: " + testPath);
            
            if (manifestFile.exists) {
                pluginFolder = new Folder(testPath);
                printDebug("Step 1.2." + (i + 3) + ": Found plugin directory: " + pluginFolder.fsName);
                break;
            }
        }
        
        if (!pluginFolder) {
            printDebug("Step 1.2.7: Not found in CEP extensions, trying script file location...");
            var scriptFile = new File($.fileName);
            var hostFolder = scriptFile.parent;
            var testFolder = hostFolder.parent;
            var manifestPath = testFolder.fsName + "\\CSXS\\manifest.xml";
            var manifestFile = new File(manifestPath);
            
            if (manifestFile.exists) {
                pluginFolder = testFolder;
                printDebug("Step 1.2.7: Found plugin directory from script location: " + pluginFolder.fsName);
            }
        }
        
        if (!pluginFolder) {
            printDebug("ERROR Step 1.2: Could not determine plugin directory");
            return {
                ErrorCode: 404,
                Message: "Could not determine plugin directory"
            };
        }
        
        // CorePlugin.exe is deployed under the /dist subfolder of the plugin directory
        var corePluginPathDist = pluginFolder.fsName + "\\dist\\CorePlugin.exe";
        var corePluginFile = new File(corePluginPathDist);
        var corePluginPath = corePluginPathDist;
        
        printDebug("Step 1.2.8: Plugin directory: " + pluginFolder.fsName);
        printDebug("Step 1.2.9: CorePlugin.exe dist path: " + corePluginPathDist);
        
        // Fallback: support development layout where CorePlugin.exe is in plugin root
        if (!corePluginFile.exists) {
            var corePluginPathRoot = pluginFolder.fsName + "\\CorePlugin.exe";
            var corePluginFileRoot = new File(corePluginPathRoot);
            printDebug("Step 1.2.10: CorePlugin.exe root path (fallback): " + corePluginPathRoot);
            
            if (corePluginFileRoot.exists) {
                corePluginFile = corePluginFileRoot;
                corePluginPath = corePluginPathRoot;
                printDebug("Step 1.2.11: Using CorePlugin.exe from plugin root (development mode).");
            }
        }
        
        if (!corePluginFile.exists) {
            printDebug("ERROR Step 1.2: CorePlugin.exe not found at dist or root path.");
            return {
                ErrorCode: 404,
                Message: "CorePlugin.exe file not found under plugin directory (dist or root)."
            };
        }
        printDebug("Step 1.2: CorePlugin.exe found - OK at: " + corePluginPath);
        
        // Determine working directory from first argument if it's a folder
        var workingDir = Folder.temp.fsName; // Default to temp
        printDebug("Step 1.3: Working directory: " + workingDir);
        printDebug("Step 1.4: CorePlugin path: " + corePluginPath);
        printDebug("Step 1.5: Arguments: " + JSON.stringify(args));
        
        // Delete CorePluginOutPut.json if it exists in working directory
        var outputStatusPath = workingDir + "\\CorePluginOutPut.json";
        var outputStatusFile = new File(outputStatusPath);
        printDebug("Step 1.6: Checking for existing CorePluginOutPut.json...");
        if (outputStatusFile.exists) {
            printDebug("Step 1.6.1: CorePluginOutPut.json exists, deleting...");
            outputStatusFile.remove();
            printDebug("Step 1.6.1: CorePluginOutPut.json deleted successfully");
        } else {
            printDebug("Step 1.6.1: CorePluginOutPut.json does not exist - OK");
        }
        
        // Build command line with quoted arguments
        var commandLine = "\"" + corePluginPath + "\"";
        for (var i = 0; i < args.length; i++) {
            commandLine += " \"" + args[i] + "\"";
        }
        printDebug("Step 1.7: Command line: " + commandLine);
        
        // Create batch file and execute it
        printDebug("Step 2: Creating and executing batch file...");
        try {
            var batchWorkingDir = Folder.temp.fsName;
            var timestamp = new Date().getTime();
            var tempBatchPath = batchWorkingDir + "\\executeCorePlugin_temp_" + timestamp + ".bat";
            var tempBatchFile = new File(tempBatchPath);
            
            // Set UTF-8 encoding for Unicode support (Vietnamese characters in paths)
            tempBatchFile.encoding = "UTF8";
            
            // Create simple batch file
            tempBatchFile.open("w");
            tempBatchFile.write("@echo off\n");
            tempBatchFile.write("chcp 65001 >nul\n"); // Set UTF-8 code page for Unicode support
            tempBatchFile.write("cd /d \"" + workingDir + "\"\n");
            tempBatchFile.write(commandLine + "\n");
            tempBatchFile.close();
            
            printDebug("Step 2.1: Batch file created: " + tempBatchPath);
            printDebug("Step 2.2: Batch file content:\ncd /d \"" + workingDir + "\"\n" + commandLine);
            
            // Execute batch file
            printDebug("Step 2.3: Executing batch file (async)...");
            tempBatchFile.execute();
            
            // Wait 500ms before checking for output file
            printDebug("Step 2.4: Waiting 500ms before checking for CorePluginOutPut.json...");
            $.sleep(500);
            
            // Wait for CorePluginOutPut.json to be created (timeout 60 seconds)
            printDebug("Step 3: Waiting for CorePluginOutPut.json to be created...");
            var maxWait = 60; // Maximum 60 seconds
            var waitCount = 0;
            outputStatusFile = new File(outputStatusPath);
            while (!outputStatusFile.exists && waitCount < maxWait) {
                $.sleep(1000); // Wait 1 second
                waitCount++;
                outputStatusFile = new File(outputStatusPath); // Refresh file reference
            }
            
            // Check if CorePluginOutPut.json exists
            printDebug("Step 4: Checking if CorePluginOutPut.json was created...");
            if (!outputStatusFile.exists) {
                printDebug("ERROR Step 4: CorePluginOutPut.json was not created after " + waitCount + " seconds");
                return {
                    ErrorCode: 404,
                    Message: "Không chạy được CorePlugin"
                };
            }
            
            // Read and parse CorePluginOutPut.json
            printDebug("Step 5: Reading CorePluginOutPut.json...");
            // Set UTF-8 encoding for Unicode support (Vietnamese characters)
            outputStatusFile.encoding = "UTF8";
            outputStatusFile.open("r");
            var jsonContent = outputStatusFile.read();
            outputStatusFile.close();
            
            printDebug("Step 5.1: JSON content: " + jsonContent);
            
            try {
                var result = JSON.parse(jsonContent);
                printDebug("Step 5.2: Successfully parsed JSON");
                printDebug("=== executeCorePlugin COMPLETED ===");
                return result;
            } catch (parseError) {
                printDebug("ERROR Step 5.2: Failed to parse JSON: " + parseError.toString());
                return {
                    ErrorCode: 500,
                    Message: "Failed to parse CorePluginOutPut.json: " + parseError.toString()
                };
            }
            
        } catch (e) {
            printDebug("ERROR Step 2: Failed to create/execute batch file: " + e.toString());
            printDebug("ERROR Step 2: Error details: " + (e.message || "N/A"));
            return {
                ErrorCode: 500,
                Message: "Failed to execute CorePlugin.exe: " + e.toString()
            };
        }
        
    } catch (err) {
        printDebug("=== executeCorePlugin ERROR ===");
        printDebug("ERROR: " + err.toString());
        printDebug("Error message: " + (err.message || "N/A"));
        return {
            ErrorCode: 500,
            Message: "Error running CorePlugin.exe: " + err.toString()
        };
    }
}

// Hàm chạy CorePlugin.exe để tìm vị trí các điểm ảnh
function runCorePlugin(inputPath) {
    try {
        printDebug("=== runCorePlugin START ===");
        printDebug("Step 1: Preparing to run CorePlugin.exe...");
        printDebug("Step 1.1: Input path (file or folder): " + inputPath);

        // Xác định thư mục làm việc (chứa output.json)
        var folderPath = null;
        var testFolder = new Folder(inputPath);
        if (testFolder.exists) {
            folderPath = testFolder.fsName;
        } else {
            var testFile = new File(inputPath);
            if (testFile.exists) {
                folderPath = testFile.parent.fsName;
            }
        }

        if (!folderPath) {
            printDebug("ERROR: Invalid inputPath for runCorePlugin: " + inputPath);
            alert("Đường dẫn truyền vào CorePlugin không hợp lệ: " + inputPath);
            return false;
        }
        printDebug("Resolved working folder for CorePlugin: " + folderPath);
        
        // Delete output.json if it exists
        var outputJsonPath = folderPath + "\\output.json";
        var outputJsonFile = new File(outputJsonPath);
        printDebug("Step 2: Checking for existing output.json...");
        if (outputJsonFile.exists) {
            printDebug("Step 2.1: output.json exists, deleting...");
            outputJsonFile.remove();
            printDebug("Step 2.1: output.json deleted successfully");
        } else {
            printDebug("Step 2.1: output.json does not exist - OK");
        }
        
        // Run CorePlugin.exe using common function, with original input path (file or folder)
        printDebug("Step 3: Running CorePlugin.exe...");
        var result = executeCorePlugin([inputPath]);
        
        // Check ErrorCode from executeCorePlugin result
        if (result.ErrorCode !== undefined && result.ErrorCode !== 0) {
            printDebug("ERROR Step 3: CorePlugin.exe failed with ErrorCode: " + result.ErrorCode);
            var errorMsg = result.Message || "Unknown error";
            alert("CorePlugin.exe failed:\n\nError Code: " + result.ErrorCode + "\nMessage: " + errorMsg);
            return false;
        }
        
        // If ErrorCode is 0, check if output.json was created
        printDebug("Step 4: Checking if output.json was created...");
        outputJsonFile = new File(outputJsonPath); // Refresh file reference
        if (!outputJsonFile.exists) {
            printDebug("ERROR Step 4: output.json was not created");
            alert("CorePlugin.exe did not create output.json file. Please check again.");
            return false;
        }
        printDebug("Step 4: output.json created successfully");
        
        printDebug("=== runCorePlugin COMPLETED ===");
        return true;
        
    } catch (err) {
        printDebug("=== runCorePlugin ERROR ===");
        printDebug("ERROR: " + err.toString());
        printDebug("Error message: " + (err.message || "N/A"));
        alert("Error running CorePlugin.exe: " + err);
        return false;
    }
}

// Helper: select ID.png for UI only (do NOT run CorePlugin here).
// Returns JSON string with { success: boolean, fileName: string, filePath: string, error: string }
function selectAndReadConfigFromIdFile() {
    try {
        printDebug("=== selectAndReadConfigFromIdFile START ===");
        
        var file = File.openDialog("Chọn file ID (dùng để tách lớp màu)", "PNG:*.png");
        if (file == null) {
            printDebug("No file selected by user");
            return JSON.stringify({ success: false, error: "No file selected", fileName: null, config: null });
        }
        
        var idPath = file.fsName;
        var idFileName = file.name;
        printDebug("Selected ID file: " + idPath);
        printDebug("=== selectAndReadConfigFromIdFile COMPLETED ===");
        return JSON.stringify({ success: true, fileName: idFileName, filePath: idPath, error: null });
    } catch (err) {
        printDebug("=== selectAndReadConfigFromIdFile ERROR ===");
        printDebug("ERROR: " + err.toString());
        return JSON.stringify({ success: false, error: "Lỗi:\n" + err.toString(), fileName: null, filePath: null });
    }
}

// Helper: build config_info from a selected ID file path (no UI interaction here).
// - Runs CorePlugin.exe with the full ID path (to create output.json & use color_setting.json with fallback logic in Program.cs)
// - Reads color_setting.json (from ID folder; if missing, falls back to default CorePlugin/color_setting.json like Program.cs)
// - Returns JSON string with { success: boolean, config: object, error: string }
function prepareConfigFromIdFile(idPath) {
    try {
        printDebug("=== prepareConfigFromIdFile START ===");
        printDebug("ID file path: " + idPath);

        if (!idPath || idPath === "") {
            return JSON.stringify({ success: false, error: "Đường dẫn file ID không hợp lệ", config: null });
        }

        var idFile = new File(idPath);
        if (!idFile.exists) {
            printDebug("ID file does not exist: " + idPath);
            return JSON.stringify({ success: false, error: "File ID không tồn tại: " + idPath, config: null });
        }

        var folderPath = idFile.parent.fsName;
        printDebug("ID folder: " + folderPath);

        // Gọi CorePlugin.exe với đường dẫn đầy đủ tới file ID (tạo output.json chứa ds_layer, texture4_folder, pixels)
        var result = executeCorePlugin([idPath]);
        if (result.ErrorCode !== undefined && result.ErrorCode !== 0) {
            var errorMsg = result.Message || "CorePlugin thất bại";
            printDebug("CorePlugin failed in prepareConfigFromIdFile: " + errorMsg);
            return JSON.stringify({ success: false, error: errorMsg, config: null });
        }

        // Đọc file output.json do CorePlugin tạo ra trong cùng thư mục với ID
        var outputJsonPath = folderPath + "\\output.json";
        var outputJsonFile = new File(outputJsonPath);
        if (!outputJsonFile.exists) {
            var errMsgOut = "Không tìm thấy file output.json trong thư mục chứa file ID sau khi chạy CorePlugin.";
            printDebug(errMsgOut + " Path: " + outputJsonPath);
            return JSON.stringify({ success: false, error: errMsgOut, config: null });
        }

        outputJsonFile.encoding = "UTF8";
        outputJsonFile.open("r");
        var outputJsonContent = outputJsonFile.read();
        outputJsonFile.close();

        var config = null;
        try {
            config = JSON.parse(outputJsonContent);
        } catch (parseErr) {
            var errMsgParse = "Không thể parse nội dung output.json: " + parseErr.toString();
            printDebug(errMsgParse);
            return JSON.stringify({ success: false, error: errMsgParse, config: null });
        }

        if (!config) {
            var errMsgEmpty = "Dữ liệu config đọc từ output.json là null/undefined.";
            printDebug(errMsgEmpty);
            return JSON.stringify({ success: false, error: errMsgEmpty, config: null });
        }

        // Bổ sung đường dẫn file ID vào config để sử dụng phía Photoshop nếu cần
        config.id_file_path = idPath;

        printDebug("=== prepareConfigFromIdFile COMPLETED ===");
        return JSON.stringify({ success: true, config: config, error: null });
    } catch (err) {
        printDebug("=== prepareConfigFromIdFile ERROR ===");
        printDebug("ERROR: " + err.toString());
        return JSON.stringify({ success: false, error: "Lỗi:\n" + err.toString(), config: null });
    }
}

// Helper function to select Excel file and read configuration
// Optional parameter: fileName - name of the file to suggest (user still needs to select in dialog)
// Returns JSON string with { success: boolean, config: object, error: string, fileName: string }
function selectAndReadConfigFile(fileName) {
    try {
        printDebug("=== selectAndReadConfigFile START ===");
        if (fileName) {
            printDebug("Suggested file name: " + fileName);
        }
        
        // Open file dialog to select Excel file
        var file = File.openDialog("Select Excel Configuration File", "Excel Files:*.xlsx;*.xls;*.xlsm");
        if (file == null) {
            printDebug("No file selected by user");
            return JSON.stringify({ success: false, error: "No file selected", fileName: null, config: null });
        }
        
        var excelPath = file.fsName;
        var excelFileName = file.name;
        printDebug("Selected Excel file: " + excelPath);
        printDebug("Excel file name: " + excelFileName);
        
        // Read configuration using readConfigFile
        var readResult = readConfigFile(excelPath);
        if (!readResult.success) {
            printDebug("Failed to read configuration file: " + readResult.error);
            return JSON.stringify({ success: false, error: readResult.error, fileName: excelFileName, config: null });
        }
        
        printDebug("=== selectAndReadConfigFile COMPLETED ===");
        return JSON.stringify({ success: true, fileName: excelFileName, config: readResult.config, error: null });
    } catch (err) {
        printDebug("=== selectAndReadConfigFile ERROR ===");
        printDebug("ERROR: " + err.toString());
        return JSON.stringify({ success: false, error: "Lỗi không xác định:\n" + err.toString(), fileName: null, config: null });
    }
}

// Function to read Excel configuration file and return config.json content
// Returns object with { success: boolean, config: object|null, error: string|null }
function readConfigFile(excelFilePath) {
    try {
        printDebug("=== readConfigFile START ===");
        printDebug("Step 1: Preparing to read Excel configuration file...");
        printDebug("Step 1.1: Excel file path: " + excelFilePath);
        
        // Get folder containing Excel file
        var excelFile = new File(excelFilePath);
        if (!excelFile.exists) {
            printDebug("ERROR: Excel file does not exist: " + excelFilePath);
            return { success: false, config: null, error: "File Excel không tồn tại: " + excelFilePath };
        }
        
        var excelFolder = excelFile.parent;
        var excelFolderPath = excelFolder.fsName;
        printDebug("Step 1.2: Excel folder path: " + excelFolderPath);
        
        // Delete config.json if it exists
        var configJsonPath = excelFolderPath + "\\config.json";
        var configJsonFile = new File(configJsonPath);
        printDebug("Step 2: Checking for existing config.json...");
        if (configJsonFile.exists) {
            printDebug("Step 2.1: config.json exists, deleting...");
            configJsonFile.remove();
            printDebug("Step 2.1: config.json deleted successfully");
        } else {
            printDebug("Step 2.1: config.json does not exist - OK");
        }
        
        // Run CorePlugin.exe with -c parameter and Excel file path using common function
        printDebug("Step 3: Running CorePlugin.exe with -c parameter...");
        var result = executeCorePlugin(["-c", excelFilePath]);
        
        // Check ErrorCode from executeCorePlugin result
        if (result.ErrorCode !== undefined && result.ErrorCode !== 0) {
            printDebug("ERROR Step 3: CorePlugin.exe failed with ErrorCode: " + result.ErrorCode);
            var errorMsg = result.Message || "Unknown error";
            return { success: false, config: null, error: "CorePlugin.exe thất bại:\nMã lỗi: " + result.ErrorCode + "\nChi tiết: " + errorMsg };
        }
        
        // If ErrorCode is 0, check if config.json was created
        printDebug("Step 4: Checking if config.json was created...");
        configJsonFile = new File(configJsonPath); // Refresh file reference
        if (!configJsonFile.exists) {
            printDebug("ERROR Step 4: config.json was not created");
            return { success: false, config: null, error: "CorePlugin.exe không tạo được file config.json. Vui lòng kiểm tra lại." };
        }
        printDebug("Step 4: config.json created successfully");
        
        // Read config.json file
        printDebug("Step 6: Reading config.json file...");
        try {
            // Set UTF-8 encoding for Unicode support (Vietnamese characters)
            configJsonFile.encoding = "UTF8";
            configJsonFile.open("r");
            var jsonContent = configJsonFile.read();
            configJsonFile.close();
            printDebug("Step 6: config.json read successfully");
            
            // Parse JSON and return
            var configData = JSON.parse(jsonContent);
            printDebug("=== readConfigFile COMPLETED ===");
            return { success: true, config: configData, error: null };
        } catch (readErr) {
            printDebug("ERROR Step 6: Failed to read config.json: " + readErr.toString());
            return { success: false, config: null, error: "Không thể đọc file config.json:\n" + readErr.toString() };
        }
        
    } catch (err) {
        printDebug("=== readConfigFile ERROR ===");
        printDebug("ERROR: " + err.toString());
        printDebug("Error message: " + (err.message || "N/A"));
        return { success: false, config: null, error: "Lỗi khi đọc file cấu hình Excel:\n" + err.toString() };
    }
}

// Bước 3: Tách lớp và xuất các layer ra file ảnh
function separateLayers(config) {
    try {
        printDebug("=== SEPARATE LAYERS START ===");

        // Mở file thiết kế gốc "goc.jpg" (cùng thư mục với file ID) và dùng làm tài liệu nền để tách lớp
        var baseFile = new File(config.texture4_folder + "\\goc.jpg");
        printDebug("Looking for base design file (goc.jpg): " + baseFile.fsName);

        if (!baseFile.exists) {
            printDebug("ERROR: Base design file does not exist: " + baseFile.fsName);
            alert("Không tìm thấy file 'goc.jpg' trong thư mục " + config.texture4_folder);
            return null;
        }

        printDebug("Base design file exists, opening...");
        var doc = open(baseFile);
        if (doc == null) {
            printDebug("ERROR: Failed to open base design file (goc.jpg)");
            alert("Không thể mở file 'goc.jpg'");
            return null;
        }

        printDebug("Base design file opened successfully. Document name: " + doc.name);
        printDebug("Document has " + doc.layers.length + " layers");

        // Export bản nền ban đầu ra ngoaithat_nen.jpg trong thư mục layers để tham chiếu
        var exportPath = config.texture4_folder + "\\layers\\ngoaithat_nen.png";
        printDebug("Exporting base design to: " + exportPath);
        exportFile(doc, exportPath, "png", false);
        printDebug("Export completed: ngoaithat_nen.jpg");

        // Store the original base layer ID before adding new layers
        var baseLayerId = doc.layers[0].id;
        printDebug("Original base layer ID: " + baseLayerId + " name: " + doc.layers[0].name);

        // Thêm layer từ file ID (ưu tiên đường dẫn đầy đủ từ config.id_file_path nếu có)
        var idFile = config.id_file_path ? config.id_file_path : (config.texture4_folder + "\\id.png");
        printDebug("Looking for ID file: " + idFile);

        var layer2 = addLayerFromFile(doc, idFile, "id_layer");
        if (layer2 == null) {
            printDebug("ERROR: Failed to add layer from id.png");
            alert("Không thể thêm layer từ file id.png");
            doc.close(SaveOptions.DONOTSAVECHANGES);
            return null;
        }

        // Store the ID layer ID for later reference
        var idLayerId = layer2.id;
        printDebug("ID layer added successfully: " + layer2.name + " ID: " + idLayerId);
        
        var pixelData = config;
        
        // Kiểm tra pixels có phải là array không (ExtendScript không hỗ trợ Array.isArray)
        // Sử dụng instanceof Array thay vì Array.isArray()
        if (!pixelData.pixels || !(pixelData.pixels instanceof Array)) {
            printDebug("ERROR: Invalid JSON format - missing 'pixels' array");
            alert("File output.json có định dạng không hợp lệ. Thiếu mảng 'pixels'");
            doc.close(SaveOptions.DONOTSAVECHANGES);
            return null;
        }
        
        printDebug("Step 2.3: Found " + pixelData.pixels.length + " pixels in output.json");
        
        // Tạo map từ tên layer sang pixel data để tra cứu nhanh
        var pixelMap = {};
        for (var p = 0; p < pixelData.pixels.length; p++) {
            var pixel = pixelData.pixels[p];
            pixelMap[pixel.name] = pixel;
            printDebug("Step 2.4: Pixel " + (p+1) + " - name: " + pixel.name + ", x: " + pixel.x + ", y: " + pixel.y);
        }
        
        var colorLayers = colors;

        for (var i = 0; i < colorLayers.length; i++) {
            var colorLayer = colorLayers[i];
            printDebug("--- Processing layer " + (i + 1) + " of " + colorLayers.length + " ---");
            printDebug("Layer name: " + colorLayer.name + " Color: " + colorLayer.hex);


            // Tìm pixel data cho layer này
            printDebug("Step 3: Looking for pixel data for layer: " + colorLayer.name);
            var pixelInfo = pixelMap[colorLayer.name];
            if (!pixelInfo) {
                printDebug("WARNING: No pixel data found for layer " + colorLayer.name + " - skipping");
                continue;
            }
            printDebug("Step 3: Found pixel data - x: " + pixelInfo.x + ", y: " + pixelInfo.y);

            // Hiện và chọn layer2 (id_layer) by ID
            hideAllLayersExcept(doc, idLayerId);

            // Tạo vùng chọn theo màu sử dụng tọa độ từ CorePlugin.exe
            printDebug("Step 4: Creating selection using Magic Wand at position: " + pixelInfo.x + "," + pixelInfo.y);
            doc.selection.deselect();
            
            if (!selectColorRangeWithMagicWand(colorLayer.hex, pixelInfo.x, pixelInfo.y)) {
                printDebug("ERROR: selectColorRangeWithMagicWand failed for layer " + colorLayer.name);
                continue;
            }

            // Kiểm tra lại selection sau khi expand
            if (!IsHasSelection(doc)) {
                printDebug("No selection found after expanding - skipping");
                continue; // Bỏ qua nếu không có vùng chọn
            }

            // Chọn layer1 (base layer) và tạo layer mới từ vùng chọn
            hideAllLayersExcept(doc, baseLayerId);
            printDebug("Set active layer to base layer: " + doc.activeLayer.name);

            // Kiểm tra lại selection sau khi thay đổi layer
            if (!IsHasSelection(doc)) {
                printDebug("Selection lost after changing active layer - skipping");
                continue; // Bỏ qua nếu selection bị mất
            }

            printDebug("Creating layer from selection: " + colorLayer.name);
            var layerTachLop = createLayerFromSelection(colorLayer.name);
            if (layerTachLop == null) {
                printDebug("ERROR: Failed to create layer from selection - skipping");
                continue;
            }
            // Store the layer ID for later deletion
            var layerTachLopId = layerTachLop.id;
            printDebug("Layer created successfully: " + layerTachLop.name + " ID: " + layerTachLopId);

            // Ẩn tất cả layer ngoài layer vừa tạo để chỉ export vùng tách lớp từ baseLayerId
            printDebug("Hiding all layers except: " + layerTachLop.name);
            layerTachLop = findLayerByName(doc, colorLayer.name);
            hideAllLayersExcept(doc, layerTachLopId);
            layerTachLop = findLayerByName(doc, colorLayer.name);

            // Export layer mới (được copy từ baseLayerId theo vùng chọn) ra file PNG
            var outputPath = config.texture4_folder + "\\layers\\" + colorLayer.name + ".png";
            exportFile(doc, outputPath, "png", false);
            printDebug("Export completed for: " + colorLayer.name);

            // Sau khi export thì xóa layer vừa tạo để không làm thay đổi file gốc
            printDebug("Removing separated layer after export: " + layerTachLop.name);
            layerTachLop.remove();

        }

        // Sau khi xuất xong tất cả layer PNG, gọi CorePlugin để convert toàn bộ file PNG trong thư mục layers sang WebP
        try {
            var layersFolder = config.texture4_folder + "\\layers";
            printDebug("Calling CorePlugin to convert PNG files in folder to WebP: " + layersFolder);
            var webpResult = executeCorePlugin(["-webp", layersFolder]);

            if (webpResult && webpResult.ErrorCode !== undefined && webpResult.ErrorCode !== 0) {
                var webpError = webpResult.Message || "Không rõ nguyên nhân";
                printDebug("ERROR: WebP conversion via CorePlugin failed: " + webpError);
                alert("Lỗi khi convert PNG sang WebP trong thư mục layers:\n" + webpError);
            } else {
                printDebug("WebP conversion via CorePlugin completed successfully for folder: " + layersFolder);
            }
        } catch (convErr) {
            printDebug("ERROR while calling CorePlugin for WebP conversion: " + convErr.toString());
            // Không chặn luồng chính nếu convert thất bại, chỉ log & cảnh báo nhẹ
        }

        return doc;

    } catch (err) {
        printDebug("ERROR in separateLayers:", err.toString());
        printDebug("Error stack:", err.stack);
        alert("Lỗi khi tách lớp: " + err);
        return null;
    }
}

// Bước 4: Đổ màu cho các phương án
function applyColors(config, doc, colors) {
    try {
        showAllLayers(doc);
        // Xác định phương án cần xử lý
        var paList = [];
        if (config.first_pa) {
            paList = [0];
        } else if (config.selected_pa > 0) {
            paList = [config.selected_pa - 1];
        } else {
            for (var i = 0; i < config.ds_pa.length; i++) {
                paList.push(i);
            }
        }

        // Cache màu sơn
        var colorCache = {};

        for (var paIndex = 0; paIndex < paList.length; paIndex++) {
            var currentPaIndex = paList[paIndex];
            var pa = config.ds_pa[currentPaIndex];

            // Đổ màu cho từng layer
            for (var layerIndex = 0; layerIndex < config.ds_layer.length; layerIndex++) {
                var layerName = config.ds_layer[layerIndex];
                if (isEmpty(layerName)) continue;

                var colorCode = pa[layerIndex];
                if (isEmpty(colorCode)) continue;

                // Tìm file màu sơn
                var colorFile = findInfolder(colorCode, img_exts, [config.texture1_folder, config.texture2_folder]);
                if (colorFile == null) {
                    alert("Không tìm thấy file màu sơn: " + colorCode);
                    doc.close(SaveOptions.DONOTSAVECHANGES);
                    return false;
                }

                // Lấy màu từ file (sử dụng cache)
                var color = getColorFromFile(colorFile, colorCache);
                if (color == null) {
                    alert("Không thể đọc màu từ file: " + colorFile);
                    doc.close(SaveOptions.DONOTSAVECHANGES);
                    return false;
                }
                printDebug("PA" + (paIndex + 1).toString() + "- layer " + layerName + " - Color found from file " + colorFile + ": R=" + color[0] + ", G=" + color[1] + ", B=" + color[2]);

                // Set màu cho layer đổ màu sử dụng Color Overlay với MULTIPLY mode
                var colorLayer = findLayerByName(doc, layerName);
                if (colorLayer != null) {
                    doc.activeLayer = colorLayer;
                    setColorOverlayMultiply(color[0], color[1], color[2]);
                }
            }

            // Xuất file thiết kế của phương án hiện tại
            var outputPath = config.texture4_folder + "\\PATK\\" + (currentPaIndex + 1) + ".png";
            exportFile(doc, outputPath, "png", false);
        }
        doc.close(SaveOptions.DONOTSAVECHANGES);
        return true;

    } catch (err) {
        alert("Lỗi khi đổ màu: " + err);
        return false;
    }
}

// Các hàm hỗ trợ
function createColorRangeSelection(hexColor) {
    try {
        printDebug("createColorRangeSelection called with color: " + hexColor);

        // Convert hex to RGB
        var rgb = hexToRgb(hexColor);
        printDebug("Converted hex to RGB: " + JSON.stringify(rgb));

        // Create ActionDescriptor for Color Range command
        var desc = new ActionDescriptor();

        // Set fuzziness (tolerance) - default is 40
        desc.putInteger(charIDToTypeID("Fzns"), color_setting.fuzziness);

        // Set minimum color (same as target color for exact match)
        var minColorDesc = new ActionDescriptor();
        minColorDesc.putDouble(charIDToTypeID("Rd  "), rgb.r);
        minColorDesc.putDouble(charIDToTypeID("Grn "), rgb.g);
        minColorDesc.putDouble(charIDToTypeID("Bl  "), rgb.b);
        desc.putObject(charIDToTypeID("Mnm "), charIDToTypeID("RGBC"), minColorDesc);

        // Set maximum color (same as target color for exact match)
        var maxColorDesc = new ActionDescriptor();
        maxColorDesc.putDouble(charIDToTypeID("Rd  "), rgb.r);
        maxColorDesc.putDouble(charIDToTypeID("Grn "), rgb.g);
        maxColorDesc.putDouble(charIDToTypeID("Bl  "), rgb.b);
        desc.putObject(charIDToTypeID("Mxm "), charIDToTypeID("RGBC"), maxColorDesc);


        printDebug("Executing color range selection action with RGB: " + rgb.r + "," + rgb.g + "," + rgb.b);
        executeAction(charIDToTypeID("ClrR"), desc, DialogModes.NO);

        // Check if selection was actually created
        var hasSelection = IsHasSelection(activeDocument);
        if (hasSelection) {
            printDebug("Color range selection completed successfully - selection found");
            return true;
        } else {
            printDebug("Color range selection completed but no selection was created");
            return false;
        }

    } catch (err) {
        printDebug("ERROR in createColorRangeSelection:", err.toString());
        return false;
    }
}

function modifySelection(pixels) {
    try {
        if (pixels > 0) {
            // Expand
            var idExpn = charIDToTypeID("Expn");
            var desc = new ActionDescriptor();
            desc.putUnitDouble(charIDToTypeID("By  "), charIDToTypeID("#Pxl"), pixels);
            executeAction(idExpn, desc, DialogModes.NO);
        } else if (pixels < 0) {
            // Contract
            var idCntc = charIDToTypeID("Cntc");
            var desc = new ActionDescriptor();
            desc.putUnitDouble(charIDToTypeID("By  "), charIDToTypeID("#Pxl"), Math.abs(pixels));
            executeAction(idCntc, desc, DialogModes.NO);
        }
        // pixels = 0 → do nothing
    } catch (err) {
        alert("Selection modification error: " + err.toString());
    }
}


function createLayerFromSelection(layerName) {
    try {
        printDebug("createLayerFromSelection called with layerName: " + layerName);

        // Check if there's a valid selection before proceeding
        if (!IsHasSelection(activeDocument)) {
            printDebug("ERROR: No valid selection found before creating layer");
            return null;
        }

        // Get selection bounds for debugging
        var bounds = activeDocument.selection.bounds;
        if (bounds) {
            var width = bounds[2] - bounds[0];
            var height = bounds[3] - bounds[1];
            printDebug("Selection bounds before copy: " + width + "x" + height);
        }

        var idCpTL = charIDToTypeID("CpTL"); // "Copy To Layer"
        executeAction(idCpTL, undefined, DialogModes.NO);

        // Get the new layer and rename it
        var newLayer = activeDocument.activeLayer;
        if (newLayer == null) {
            printDebug("ERROR: No new layer created from selection");
            return null;
        }

        newLayer.name = layerName;

        // Move the new layer to the top
        printDebug("Moving layer to top: " + newLayer.name);
        newLayer.move(activeDocument.layers[0], ElementPlacement.PLACEBEFORE);

        printDebug("Layer created and moved to top successfully: " + newLayer.name);
        return newLayer;
    } catch (err) {
        printDebug("ERROR in createLayerFromSelection: " + err.toString());
        printDebug("Error details: " + err.message);
        return null;
    }
}

function createSolidColorLayer(layerName) {
    try {
        // Create a new Solid Color Fill Layer from selection
        var desc = new ActionDescriptor();
        var ref = new ActionReference();
        ref.putClass(stringIDToTypeID("contentLayer"));
        desc.putReference(charIDToTypeID("null"), ref);

        // Define SolidColor (here: Red)
        var fillDesc = new ActionDescriptor();
        var colorDesc = new ActionDescriptor();
        colorDesc.putDouble(charIDToTypeID("Rd  "), 255); // Red
        colorDesc.putDouble(charIDToTypeID("Grn "), 0);   // Green
        colorDesc.putDouble(charIDToTypeID("Bl  "), 0);   // Blue

        var solidDesc = new ActionDescriptor();
        solidDesc.putObject(charIDToTypeID("Clr "), charIDToTypeID("RGBC"), colorDesc);
        fillDesc.putObject(charIDToTypeID("Type"), stringIDToTypeID("solidColorLayer"), solidDesc);

        desc.putObject(charIDToTypeID("Usng"), stringIDToTypeID("contentLayer"), fillDesc);

        executeAction(charIDToTypeID("Mk  "), desc, DialogModes.NO);

        var newLayer = activeDocument.activeLayer;
        printDebug("Solid color layer created, renaming to: " + layerName);
        newLayer.name = layerName;
        printDebug("Solid color layer created successfully: " + newLayer.name);
        return newLayer;
    } catch (err) {
        printDebug("ERROR in createSolidColorLayer (primary method): " + err.toString());
    }
}

function selectLayerPixels(layer) {
    try {
        printDebug("selectLayerPixels called for layer: " + layer.name);
        // activeDocument.activeLayer = layer;
        // var idSlct = charIDToTypeID("slct");
        // var desc = new ActionDescriptor();
        // var idNull = charIDToTypeID("null");
        // var ref = new ActionReference();
        // var idChnl = charIDToTypeID("Chnl");
        // var idfsel = charIDToTypeID("fsel");
        // ref.putProperty(idChnl, idfsel);
        // desc.putReference(idNull, ref);
        // var idTglO = charIDToTypeID("TglO");
        // desc.putBoolean(idTglO, false);
        // var idLyr = charIDToTypeID("Lyr ");
        // desc.putEnumerated(idChnl, idLyr, idLyr);
        // executeAction(idSlct, desc, DialogModes.NO);


        var desc = new ActionDescriptor();
        var ref = new ActionReference();

        // Reference the transparency channel of the layer
        ref.putProperty(charIDToTypeID("Chnl"), charIDToTypeID("fsel"));
        var layerRef = new ActionReference();
        layerRef.putEnumerated(charIDToTypeID("Chnl"),
            charIDToTypeID("Chnl"),
            charIDToTypeID("Trsp")); // Transparency
        layerRef.putIdentifier(charIDToTypeID("Lyr "), layer.id);

        desc.putReference(charIDToTypeID("null"), ref);
        desc.putReference(charIDToTypeID("T   "), layerRef);

        executeAction(charIDToTypeID("setd"), desc, DialogModes.NO);

        printDebug("Layer pixels selected successfully");
    } catch (err) {
        printDebug("ERROR in selectLayerPixels: " + err.toString());
        // Ignore error
    }
}

function hideAllLayersExcept(doc, keepLayerId) {
    var hiddenCount = 0;
    var keepLayer = null;

    for (var i = 0; i < doc.layers.length; i++) {
        var layer = doc.layers[i];
        // Use layer ID comparison
        if (layer.id != keepLayerId) {
            layer.visible = false;
            hiddenCount++;
            printDebug("Hidden layer: " + layer.name);
        } else {
            keepLayer = layer; // Store reference to the layer we're keeping
        }
    }

    // Ensure the keep layer is visible and active
    if (keepLayer != null) {
        keepLayer.visible = true;
        doc.activeLayer = keepLayer;
        printDebug("Hidden " + hiddenCount + " layers, kept " + keepLayer.name + " visible");
    } else {
        printDebug("ERROR: Could not find layer with ID: " + keepLayerId);
    }
}

function showAllLayers(doc) {
    printDebug("showAllLayers called for document with " + doc.layers.length + " layers");
    for (var i = 0; i < doc.layers.length; i++) {
        doc.layers[i].visible = true;
    }
    printDebug("All layers are now visible");
}

function findLayerIndexInConfig(config, layerName) {
    printDebug("findLayerIndexInConfig called for layerName: " + layerName);
    printDebug("Config ds_layer: " + JSON.stringify(config.ds_layer));

    for (var i = 0; i < config.ds_layer.length; i++) {
        if (config.ds_layer[i] == layerName) {
            printDebug("Found layer at index: " + i);
            return i;
        }
    }
    printDebug("Layer not found in config, returning -1");
    return -1;
}

function validateColorPlan(config, layerIndex) {
    printDebug("validateColorPlan called for layerIndex: " + layerIndex);
    printDebug("Config ds_pa length: " + config.ds_pa.length);

    for (var i = 0; i < config.ds_pa.length; i++) {
        var pa = config.ds_pa[i];
        printDebug("Checking PA " + i + " at layerIndex " + layerIndex + " value: " + pa[layerIndex]);
        if (isEmpty(pa[layerIndex])) {
            printDebug("Found empty value in PA " + i + " at layerIndex " + layerIndex);
            return false;
        }
    }
    printDebug("All color plans validated successfully");
    return true;
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function getColorFromFile(filePath, cache) {
    if (cache[filePath]) {
        return cache[filePath];
    }

    try {
        var tempDoc = open(new File(filePath));
        if (tempDoc == null) return null;

        // Lấy màu từ điểm ảnh (10, 10) như yêu cầu
        var color = tempDoc.colorSamplers.add([10, 10]);
        var rgb = [Math.round(color.color.rgb.red), Math.round(color.color.rgb.green), Math.round(color.color.rgb.blue)];

        // Xóa color sampler
        color.remove();

        cache[filePath] = rgb;
        tempDoc.close(SaveOptions.DONOTSAVECHANGES);
        return rgb;
    } catch (err) {
        return null;
    }
}

function findLayerByName(doc, layerName) {
    for (var i = 0; i < doc.layers.length; i++) {
        if (doc.layers[i].name == layerName) {
            return doc.layers[i];
        }
    }
    return null;
}

function findLayerById(doc, layerId) {
    for (var i = 0; i < doc.layers.length; i++) {
        if (doc.layers[i].id == layerId) {
            return doc.layers[i];
        }
    }
    return null;
}

function setLayerColor(layer, rgbColor) {
    try {
        printDebug("setLayerColor called for layer: " + layer.name + " with RGB: " + rgbColor[0] + "," + rgbColor[1] + "," + rgbColor[2]);
        var doc = app.activeDocument;
        selectLayerPixels(layer);
        // Fill selection
        var color = new SolidColor();
        color.rgb.red = rgbColor[0];
        color.rgb.green = rgbColor[1];
        color.rgb.blue = rgbColor[2];
        doc.selection.fill(color, ColorBlendMode.NORMAL, 100);

        doc.selection.deselect();

    } catch (err) {
        printDebug("ERROR in setLayerColor for layer " + layer.name + ": " + err.toString());
        // Ignore error
    }
}

function execute_generate_file(config) {
    // Kiểm tra cấu hình
    if (config == null) {
        alert("Cấu hình không hợp lệ");
        return false;
    }

    // Clear log file at the beginning (only if DEBUG_MODE is enabled)
    if (DEBUG_MODE) {
        try {
            var logFile = new File(Folder.desktop + "/AutoLayerSeparator_Debug.log");
            if (logFile.exists) {
                logFile.remove();
            }
            printDebug("=== NEW SESSION STARTED ===");
        } catch (err) {
            // Ignore log clearing errors
        }
    }

    try {
        //get color code
        // Cấu hình màu đã được chuẩn bị sẵn trong config.color_setting bởi CorePlugin/prepareConfigFromIdFile
        if (!config.color_setting) {
            printDebug("ERROR: config.color_setting is missing");
            alert("Không tìm thấy dữ liệu cấu hình màu (color_setting) trong cấu hình. Vui lòng kiểm tra lại file ID và cấu hình.");
            return false;
        }

        color_setting = config.color_setting;
        colors = color_setting.layers;
        printDebug("Color settings loaded from config.color_setting: " + JSON.stringify(color_setting));

        // Bước 2: Tạo các folder output
        if (!createOutputFolders(config)) {
            return false;
        }

        // Close all open documents before starting layer separation
        printDebug("Closing all open documents before layer separation");
        while (app.documents.length > 0) {
            app.documents[0].close(SaveOptions.DONOTSAVECHANGES);
        }
        printDebug("All documents closed successfully");

        // Bước 3: Tách lớp và xuất các layer ra file ảnh
        var doc = separateLayers(config, colors);
        if (doc == null) {
            return false;
        }
        doc.close(SaveOptions.DONOTSAVECHANGES);

        // Plugin hiện tại chỉ chạy đến bước tách lớp
        alert("Đã thực hiện tách lớp xong!");
        return true;

    } catch (err) {
        alert("Lỗi trong quá trình thực hiện: " + err);
        return false;
    }
}