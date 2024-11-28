// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This shows the HTML page in "ui.html".
figma.showUI(__html__);

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = async (msg: { type: string; count: number }) => {
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  if (msg.type === "generateCode") {
    const figmaJson = await genFigmaJson();
    const figmaImage = await genFigmaImage();

    console.log("figmaJson", figmaJson);
    console.log("figmaImage", figmaImage);
  } else if (msg.type === "cancel") {
    figma.closePlugin();
  }

  // Make sure to close the plugin when you're done. Otherwise the plugin will
  // keep running, which shows the cancel button at the bottom of the screen.
  // figma.closePlugin();
};

function genFigmaJson() {
  return new Promise((resolve, reject) => {
    figma.currentPage.selection[0]
      .exportAsync({
        format: "JSON_REST_V1",
      })
      .then((data: any) => {
        resolve(data.document);
      })
      .catch((error) => {
        console.log("Error on generate figma json: ", error.message);
        reject(error);
      });
  });
}

function genFigmaImage() {
  return new Promise((resolve, reject) => {
    figma.currentPage.selection[0]
      .exportAsync({
        format: "PNG",
        constraint: { type: "SCALE", value: 1 },
      })
      .then((data) => {
        var base64String = btoa(
          String.fromCharCode.apply(null, Array.from(new Uint8Array(data)))
        );

        resolve(base64String);
      })
      .catch((error) => {
        console.log("Error on generate figma image: ", error.message);
        reject(error);
      });
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
