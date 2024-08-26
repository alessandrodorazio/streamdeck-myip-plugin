var websocket = null;
var pluginUUID = null;

var DestinationEnum = Object.freeze({
  HARDWARE_AND_SOFTWARE: 0,
  HARDWARE_ONLY: 1,
  SOFTWARE_ONLY: 2,
});

var counterAction = {
  type: "it.alessandrodorazio.myIp.action",

  onWillAppear: function (context, settings, coordinates) {
    this.SetIpAddress(context);
  },

  onKeyUp: function (context, settings, coordinates, userDesiredState) {
    this.SetIpAddress(context);
  },

  SetTitle: function (context, keyPressCounter) {
    var json = {
      event: "setTitle",
      context: context,
      payload: {
        title: "" + keyPressCounter,
        target: DestinationEnum.HARDWARE_AND_SOFTWARE,
      },
    };

    websocket.send(JSON.stringify(json));
  },

  SetSettings: function (context, settings) {
    var json = {
      event: "setSettings",
      context: context,
      payload: settings,
    };

    websocket.send(JSON.stringify(json));
  },
  SetIpAddress: function (context) {
    this.SetTitle(context, "Refreshing...");
    fetch("http://api.ipify.org?format=json")
      .then((response) => response.json())
      .then((data) => {
        const ip = data.ip;
        console.log("Fetched IP:", ip);
        // ip should be in the row so with split having each element of the array two parts of the IP
        const ipArray = ip.split(".");
        const firstHalf = ipArray[0] + "." + ipArray[1] + ".";
        const secondHalf = ipArray[2] + "." + ipArray[3];
        this.SetTitle(context, "IP\n" + firstHalf + "\n" + secondHalf + "\n");
      })
      .catch((error) => {
        console.error("Error fetching IP:", error);
        this.SetTitle(context, "Error");
      });
  },
};

function connectElgatoStreamDeckSocket(
  inPort,
  inPluginUUID,
  inRegisterEvent,
  inInfo,
) {
  pluginUUID = inPluginUUID;

  // Open the web socket
  websocket = new WebSocket("ws://127.0.0.1:" + inPort);

  function registerPlugin(inPluginUUID) {
    var json = {
      event: inRegisterEvent,
      uuid: inPluginUUID,
    };

    websocket.send(JSON.stringify(json));
  }

  websocket.onopen = function () {
    // WebSocket is connected, send message
    registerPlugin(pluginUUID);
  };

  websocket.onmessage = function (evt) {
    // Received message from Stream Deck
    var jsonObj = JSON.parse(evt.data);
    var event = jsonObj["event"];
    var action = jsonObj["action"];
    var context = jsonObj["context"];

    if (event == "keyDown" || false) {
      var jsonPayload = jsonObj["payload"];
      var settings = jsonPayload["settings"];
      var coordinates = jsonPayload["coordinates"];
      var userDesiredState = jsonPayload["userDesiredState"];
      //counterAction.onKeyDown(context, settings, coordinates, userDesiredState);
    } else if (event == "keyUp") {
      var jsonPayload = jsonObj["payload"];
      var settings = jsonPayload["settings"];
      var coordinates = jsonPayload["coordinates"];
      var userDesiredState = jsonPayload["userDesiredState"];
      counterAction.onKeyUp(context, settings, coordinates, userDesiredState);
    } else if (event == "willAppear") {
      var jsonPayload = jsonObj["payload"];
      var settings = jsonPayload["settings"];
      var coordinates = jsonPayload["coordinates"];
      counterAction.onWillAppear(context, settings, coordinates);
    }
  };

  websocket.onclose = function () {
    // Websocket is closed
  };
}
