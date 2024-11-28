const API_ENDPOINT = "http://localhost:8000/api/v1";

// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 500, height: 300 });

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = (msg: { type: string; count: number }) => {
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  if (msg.type === "generateCode") {
    downloadFile();
  } else if (msg.type === "cancel") {
    figma.closePlugin();
  }

  // Make sure to close the plugin when you're done. Otherwise the plugin will
  // keep running, which shows the cancel button at the bottom of the screen.
  // figma.closePlugin();
};

function downloadFile() {
  console.log("downloadFile");
  const selection = figma.currentPage.selection[0];
  const jsonPromise = selection.exportAsync({
    format: "JSON_REST_V1",
  });

  const imagePromise = selection
    .exportAsync({
      format: "PNG",
      constraint: { type: "SCALE", value: 1 },
    })
    .then((data) => {
      var base64String = btoa(
        String.fromCharCode.apply(null, Array.from(new Uint8Array(data)))
      );
      return base64String;
    });

  Promise.all([jsonPromise, imagePromise]).then((values) => {
    const streamlinedJson = removePropertiesByKey(values[0], [
      "id",
      "componentId",
      "layoutVersion",
      // "absoluteBoundingBox",
    ]);
    const jsonStr = JSON.stringify(streamlinedJson as string);
    const image = values[1] as string;

    const data = {
      img_type: "png",
      img_base64: image,
      json_string: jsonStr,
    };

    console.log("submitted data", data);
    submitFigmaData(data);
  });
}

function submitFigmaData(data: Object) {
  fetch(`${API_ENDPOINT}/generate`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then(function (response: any) {
      console.log("API response: ", response);
      figma.ui.postMessage({
        type: "show-md-preview",
        payload: response,
      });
    })
    .catch(function (error: any) {
      console.log("API error: ", error);
    });
}

function btoa(input: string): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let str = input;
  let output = "";

  for (
    let block = 0, charCode, i = 0, map = chars;
    str.charAt(i | 0) || ((map = "="), i % 1);
    output += map.charAt(63 & (block >> (8 - (i % 1) * 8)))
  ) {
    charCode = str.charCodeAt((i += 3 / 4));

    if (charCode > 0xff) {
      throw new Error(
        "'btoa' failed: The string to be encoded contains characters outside of the Latin1 range."
      );
    }

    block = (block << 8) | charCode;
  }

  return output;
}

function removePropertiesByKey<T extends Record<string, any>>(
  obj: T,
  keysToRemove: string[]
): T {
  if (typeof obj !== "object" || obj === null) return obj;

  for (const key in obj) {
    if (keysToRemove.includes(key)) {
      delete obj[key];
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      obj[key] = removePropertiesByKey(obj[key], keysToRemove);
    }
  }

  return obj;
}
