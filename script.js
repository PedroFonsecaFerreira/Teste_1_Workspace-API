var API;
const viewer = $("#viewerFrame")[0];
console.log(viewer);
let id = 0;

var viewerUrl = getQueryVariable("viewerUrl") || `./?projectId=${getQueryVariable("projectId")}&modelId=${getQueryVariable("modelId")}`;

if (viewerUrl) {
  viewer.src = viewerUrl;
  viewer.hidden = false;
} else {
  document.title = "Trimble Connect 3D Viewer Application PlugIn";
}

viewer.onload = async function connect() {
  console.log("Start listener...");
  API = await Workspace.connect(viewer, (event, data) => {
      console.log("Event: ", event, data);
      switch (event) {
        case "viewer.onSelectionChanged":
          onSelection(args.data);
          console.log("cenas selection");
          break;

        case "viewer.onCameraChanged":
          onCameraChanged(args.data);
          break;

        case "project.onChanged":
          onProjectChanged(args.data.new);
          
          break;

        case "project.onSettingsChanged":
          onProjectSettingsChanged(args.data);
          break;

        case "user.onSettingsChanged":
          onUserSettingsChanged(args.data);
          break;

        case "extension.accessToken":
          onAccessToken(args.data);
          console.log("cenas token");
          break;

        case "extension.closing":
          console.log("Do clean up");
          break;
      }
    }, 30000);
    
    console.log("Listener started!");
}


function getQueryVariable(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    if (pair[0] == variable) {
      return decodeURIComponent(pair[1]);
    }
  }
}

