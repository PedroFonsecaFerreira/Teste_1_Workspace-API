//["button", "label", "input", "div", "span", "ul", "li", "table", "textarea", "thead", "tbody", "tr", "td"].forEach(e => $.fn.popover.Constructor.Default.whiteList[e] = [/^.*$/i]);
   
    var API = null;
    const viewer = document.getElementById("viewerFrame");
    console.log(viewer);
    let id = 0;

    var viewerUrl = getQueryVariable("viewerUrl") || `./?projectId=${getQueryVariable("projectId")}&modelId=${getQueryVariable("modelId")}`;
    
    
    if (viewerUrl) {
      viewer.src = viewerUrl;
    } else {
      document.title = "Trimble Connect 3D Viewer Application PlugIn";
    }
  

  
  viewer.onload = async function () {

      console.log("Start listener...");      
      API = await Workspace.connect(viewer, (event, args) => {
        
        var eventName = event.split(".").pop();
        console.log("Event: ", eventName, args);

        switch (eventName) {
          case "onSelectionChanged":
            onSelection(args.data);
            console.log("cenas selection");
            break;

          case "onCameraChanged":
            onCameraChanged(args.data);
            break;

          case "onChanged":
            onProjectChanged(args.data.new);
            
            break;

          case "onSettingsChanged":
            onProjectSettingsChanged(args.data);
            break;

          case "onSettingsChanged":
            onUserSettingsChanged(args.data);
            break;

          case "accessToken":
            onAccessToken(args.data);
            console.log("cenas token");
            break;

          case "closing":
            console.log("Do clean up");
            break;
        }
      });

      console.log("Listener started!");
      onProjectChanged(await API.project.getProject());
      onUserChanged(await API.user.getUser());
      var introEle = $("#instruction");
      introEle.html("Click on a button below to try out the example API client!");
      introEle.addClass("blinking");
      var count = 0
      setTimeout(function () {
        var interval = setInterval(function () {
          introEle.toggleClass(function () {
            count++
            return "blinking"
          });

          if (count == 2)
            clearInterval(interval);

        }, 600)
      }, 1000);
    };


    $('#opacitySlider').slider({
      formatter: function (value) {
        return 'Current opacity: ' + value;
      }
    });
    $('#opacitySlider').on("slide", setOpacity);
    /*$('#btnShowFilteredObjects').popover({
      html: true,
      content: $('#showFilteredObjectsModal').html(),
      trigger: 'manual'
    });
    $('#tmpObjFilterModalContent').remove();

    $('#btnSetCamera').popover({
      html: true,
      content: $('#setCameraModal').html(),
      trigger: 'manual'
    });
    $('#tmpCameraModalContent').remove();

    $('#btnModelOps').popover({
      html: true,
      content: $('#setModelModal').html(),
      trigger: 'manual'
    });
    $('#tmpModelModalContent').remove();

    $('#btnPermissionOps').popover({
      html: true,
      content: $('#setPermissionModal').html(),
      trigger: 'manual'
    });
    $('#tmpPermissionModalContent').remove();

    $('#btnLayerOps').popover({
      html: true,
      content: $('#setLayerModal').html(),
      trigger: 'manual'
    });
    $('#tmpLayerModalContent').remove();

    $('#btnViewOps').popover({
      html: true,
      content: $('#setViewModal').html(),
      trigger: 'manual'
    });
    $('#tmpViewModalContent').remove();

    $('#btnViewerOps').popover({
      html: true,
      content: $('#setViewerModal').html(),
      trigger: 'manual'
    });
    $('#tmpViewerModalContent').remove();

    $('#btnProjectOps').popover({
      html: true,
      content: $('#setProjectModal').html(),
      trigger: 'manual'
    });
    $('#tmpProjectModalContent').remove();

    $('#btnUserOps').popover({
      html: true,
      content: $('#setUserModal').html(),
      trigger: 'manual'
    });
    $('#tmpUserModalContent').remove();

    $("html").on("mouseup", function (e) {
      var l = $(e.target);
      if (l.closest(".popover").length < 1) {
        $(".popover").each(function () {
          $(this).popover("hide");
        });
      }
    });*/

    const dismissBtn = `<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>`;
    const str = (msg) => document.createTextNode(msg).data;
    const ok = (msg) => `<div class="alert alert-success alert-dismissible fade show" role="alert">${str(msg ? msg + ": " : "")} Successful${dismissBtn}</div>`;
    const warn = (msg) => `<div class="alert alert-warning alert-dismissible fade show" role="alert">${str(msg)}${dismissBtn}</div>`;
    const err = (err) => `<div class="alert alert-danger alert-dismissible fade show" role="alert">${str(err)}${dismissBtn}</div>`;

    function onSelection(selection) {
      if (selection && selection.length) {
        const state = { color: {} };
        const changeColorOnSelection = $("#colorOnSelection").is(":checked");
        const opacityOnSelection = $("#opacityOnSelection").is(":checked");
        if (changeColorOnSelection) Object.assign(state.color, { r: 255, g: 155, b: 15 });
        if (opacityOnSelection) Object.assign(state.color, { a: 125 });
        if (changeColorOnSelection || opacityOnSelection) {
          API.viewer.setObjectState({ selected: true }, state);
        }
      }

      var selectionState = document.getElementById("selectionState");
      let html = "";
      let oCount = 0, mCount = 0;
      for (const s of selection) {
        ++mCount;
        html += s.objectRuntimeIds.map(id => `<option value='${s.modelId} | ${id}'>${s.modelId} | ${id}</option>`).join();
        oCount += s.objectRuntimeIds.length;
      }

      selectionState.innerHTML = selection.length > 0 ?
        `${oCount} selected from ${mCount} models <button onClick="flyTo()" class="btn btn-info btn-sm">Fly to</button>` : "No selection";
      $("#selectionList").html(html);
    }

    async function onCameraChanged(camera) {
      var l = camera.lookAt;
      var p = camera.position;

      cameraState.innerHTML =
        "Position: " + p.x.toFixed(2) + ", " + p.y.toFixed(2) + ", " + p.z.toFixed(2) +
        "<br/>Look at: " + l.x.toFixed(2) + ", " + l.y.toFixed(2) + ", " + l.z.toFixed(2);
      cameraChanged(camera);
    }

    function onProjectChanged(project) {
      $("#projectData").text(project.name);
      $("#txtProjectId").val(project.id);
    }

    function onProjectSettingsChanged(projectSettings) {
      console.log(`The following project settings changed: ${projectSettings.changes}.`)
      $.each(projectSettings.changes, function (i, change) {
        console.log(`Old value for '${change}': ${JSON.stringify(projectSettings.old[change])}`);
        console.log(`New value for '${change}': ${JSON.stringify(projectSettings.new[change])}`);
      });
    }

    function onUserSettingsChanged(userSettings) {
      console.log(`The following user settings changed: ${userSettings.changes}.`)
      $.each(userSettings.changes, function (i, change) {
        console.log(`Old value for '${change}': ${JSON.stringify(userSettings.old[change])}`);
        console.log(`New value for '${change}': ${JSON.stringify(userSettings.new[change])}`);
      });
    }

    function onAccessToken(accessToken) {
      $("#txtAccessToken").val(accessToken)
    }

    function onUserChanged(user) {
      $("#userData").text(user.email);
    }

    function setProject(e) {
      if (e && e.keyCode != 13) return;
      API.project.setProject($("#txtProjectId").val());
    }

    var seed = 1;
    function random() {
      var x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    }

    var iconId = -1;
    async function addIcons() {
      const mult = 25;
      const pos = { x: 0, y: 0, z: 0 };
      const icons = [];

      for (let i = iconId; i > iconId - 6; i--) {
        let icon = {
          id: i.toString(),
          iconPath: "icons/icon_72x72.png",
          position: { x: random() * mult + pos.x, y: random() * mult + pos.y, z: random() * mult + pos.z },
          size: 44
        };

        icons.push(icon);
      }

      // intentionally decrease id with 5 instead of 6, so when next adding icons, one will be updated.
      iconId = iconId - 5;

      await API.viewer.addIcon(icons);
    }

    function getIcons() {
      return doWorkPopover("#btnGetIcons", "Icons", "", async () => {
        const icons = await API.viewer.getIcon();
        var html = `<div class="panel panel-primary"><div class="panel-body"><ul class="list-group">`;
        $.each(icons, function (i, icon) {
          html += `<li class="list-group-item"><div class="d-flex">
            <div class="flex-grow-1">
              <span class="badge badge-secondary p-1 mr-1">id: ${icon.id}</span>
              <span class="p-2 mr-1">json: ${JSON.stringify(icon)}</span>
            </div>
            </div></li>`;
        });
        html += "</ul></div></div>";
        return html;
      });
    }

    async function removeIcons() {
      await API.viewer.removeIcon({ id: -1 });
      await API.viewer.removeIcon([{ id: -2 }, { id: -3 }]);
      await API.viewer.removeIcon();
    }

    function resetColors() {
      API.viewer.setObjectState(null, { color: "reset" });
    }

    async function doCamera(action) {
      return doWorkRes("#cameraResult", "#cameraLoading", action);
    }

    async function getCamera() {
      return doCamera(async () => renderjson.set_show_to_level("all")(await API.viewer.getCamera()));
    }

    function setCamera(preset) {
      return doCamera(async () => API.viewer.setCamera(preset));
    }

    async function getNewCamera(byQuaternion) {
      const curCamera = await API.viewer.getCamera();
      const camera = { ...curCamera };
      const offset = [...Array(3).keys()].map(_ => (rand(-1, 1) * rand(1, 10)) || 1);
      if (byQuaternion) {
        camera.quaternion[Object.keys(camera.quaternion)[rand(0, 3)]] = Math.random() * (Math.random > 0.5 ? 1 : -1) / 10000000;
      } else {
        camera.lookAt.x += offset[0];
        camera.lookAt.y += offset[1];
        camera.lookAt.z += offset[2];
      }
      camera.position.y += offset[0];
      camera.position.x += offset[1];
      camera.position.z += offset[2];
      console.log("Camera: from: ", curCamera, "to: ", camera);
      return camera;
    }

    async function moveCameraBackAndForth(byQuaternion) {
      return doCamera(async () => {
        const prevCamera = await API.viewer.getCamera();
        await assertNewCamera(await getNewCamera(byQuaternion));
        await assertNewCamera(prevCamera);
      });
    }

    function flyTo() {
      API.viewer.setCamera({ selected: true });
    }

    async function highlightSelected(e) {
      const v = $(e).val();
      const selected = v.filter(s => !!s);
      for (const s of selected) {
        const [modelId, objectRuntimeId] = s.split(" | ");
        await API.viewer.setObjectState({
          modelObjectIds: [{ modelId, objectRuntimeIds: [parseInt(objectRuntimeId, 10)] }]
        }, {
          color: "#000000"
        });
      }
    }

    async function doModel(action) {
      return doWorkRes("#modelsResult", "#modelsLoading", action);
    }

    async function modelAction(action, e) {
      const fitToView = $("#fitToView").is(":checked");
      if (e && e.keyCode != 13) return;
      let func;
      const modelId = $("#txtModelId").val()
      if (!modelId) {
        func = async () => { throw new Error("Empty model ID"); };
      } else {
        switch (action) {
          case "load":
            func = async () => API.viewer.toggleModel(modelId, true, fitToView);
            break;
          case "unload":
            func = async () => API.viewer.toggleModel(modelId, false, fitToView);
            break;
          default:
            func = async () => API.viewer.toggleModel(modelId, undefined, fitToView);
            break;
        }
      }

      return doModel(func);
    }

    async function getAllModels() {
      return doModel(async () => renderjson.set_show_to_level("all")(await API.viewer.getModels()));
    }

    async function showAllModels() {
      return toggleAllModels(true);
    }

    async function hideAllModels() {
      return toggleAllModels(false);
    }

    async function toggleAllModels(visible) {
      const fitToView = $("#fitToView").is(":checked");
      return doModel(async () => {
        var models = await API.viewer.getModels();
        await API.viewer.toggleModel(models.map(model => model.id), visible, fitToView);
      });
    }

    async function moveAllModels() {
      var models = await API.viewer.getModels();
      for (var m of models) {
        const placement = m.placement || {
          locationX: 0,
          locationY: 0,
          locationZ: 0
        };
        if (placement) {
          if (m.state !== "loaded") {
            continue;
          };
          const x = placement.locationX += rand(-1, 1) * rand(1000, 5000);
          const y = placement.locationY += rand(-1, 1) * rand(1000, 5000);
          const z = placement.locationZ += rand(-1, 1) * rand(1000, 5000);

          const axisX = 0;
          const axisY = 1;
          const axisZ = 0;

          const refDirectionX = 0.333333;
          const refDirectionY = 0.333333;
          const refDirectionZ = 0;

          await API.viewer.placeModel(m.id, {
            position: {
              x: x,
              y: y,
              z: z
            },
            axis: {
              x: axisX,
              y: axisY,
              z: axisZ
            },
            refDirection: {
              x: refDirectionX,
              y: refDirectionY,
              z: refDirectionZ
            }
          });
        }
      }
    }

    async function layerAction(action, e) {
      if (e && e.keyCode != 13) return;

      const modelId = $("#txtLayerModelId").val()
      if (modelId) {
        switch (action) {
          case "get":
            return getLayers(modelId);
          case "set":
            return showSetLayersVisibility(modelId);
        }
      }

      console.log("Model id was not provided.");
    }

    function getLayers(modelId) {
      return doWorkPopover("#btnGetLayers", "Layers", "", async () => {
        const layers = await API.viewer.getLayers(modelId);
        var html = `<div class="panel panel-primary"><div class="panel-body"><ul class="list-group">`;
        $.each(layers, function (i, layer) {
          html += `<li class="list-group-item"><div class="d-flex">
            <div class="flex-grow-1">
              <span class="badge badge-secondary p-1 mr-1">${layer.name}</span>
              <span class="p-2 mr-1">${JSON.stringify(layer)}</span>
            </div>
            </div></li>`;
        });
        html += "</ul></div></div>";
        return html;
      });
    }

    function showSetLayersVisibility(modelId) {
      return doWorkPopover("#btnSetLayers", "Set layers visibility", "", async () => {
        var html = `<div class="panel panel-primary">
          <div class="panel-body">
            <div><textarea id="txtSetLayersVisibility" placeholder="Layers JSON" rows="10" cols="50"></textarea></div>
            <div>
              <button id="btnExecuteSetLayersVisibility" class="btn btn-info btn-sm m-1" onClick="setLayersVisibility('${modelId}')">
                Set
              </button></div></div>
            </div>`;
        return html;
      });
    }

    function setLayersVisibility(modelId) {
      let layers;
      try {
        layers = JSON.parse($("#txtSetLayersVisibility").val());
      } catch (e) {
        console.log("JSON is not in correct format.");
      }

      if (layers) {
        API.viewer.setLayersVisibility(modelId, layers);
      }
    }

    async function getViews() {
      return doWorkPopover("#btnViewToggle", "Views", "#viewLoading", async () => {
        const views = await API.view.getViews();
        var html = `<div class="panel panel-primary"><div class="panel-body"><ul class="list-group">`;
        $.each(views, function (i, v) {
          html += `<li class="list-group-item"><div class="d-flex">
<div class="flex-grow-1">
  <span class="badge badge-secondary p-1 mr-1">${v.id}</span>
  <button class="btn" onclick="selectView('${v.id}')" name="name" view-id="${v.id}" title="${v.description}">${v.name}</button>
</div>
<div>
  <button class="badge btn btn-outline-info btn-sm ml-2 mr-2" onclick="updateView('${v.id}', event)" title="Edit view name for view with ID ${v.id}">Update Name</button>
  <button type="button" class="close" aria-label="Close" onclick="deleteView('${v.id}', event)"><span aria-hidden="true">&times;</span></button>
</div>
</div></li>`;
        });
        html += "</ul></div></div>";
        return html;
      });
    }

    async function createView() {
      return doWorkPopover("#btnCreateView", "Created View", "#createViewLoading", async () => {
        let html;
        const dateTime = getDateStr();
        const createdView = await API.view.createView({
          name: name(),
          description: `A new view was created on ${dateTime} using Workspace API`
        });
        html = createdView &&
          `<div class="container">
  <div class="row"><img src="${createdView.imageData}" title="Created view thumbnail" class="img-thumbnail" /></div>
  <div class="row">
    <table class="table">
      <tbody>
        <tr>
          <td>ID</td>
          <td>${createdView.id}</td>
        </tr>
        <tr>
          <td>Name</td>
          <td>${createdView.name}</td>
        </tr>
        <tr>
          <td>Description</td>
          <td>${createdView.description}</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>`;
        return html;
      });
    }

    async function doView(action) {
      return doWorkRes("#viewsResult", "#viewsLoading", action);
    }

    async function setView() {
      return doView(async () => {
        const curCamera = await API.viewer.getCamera();
        const camera = await getNewCamera();
        const sectionPlanes = [{
          directionX: 1,
          directionY: 0,
          directionZ: 0,
          positionX: curCamera.position.x * 1000 / 2,
          positionY: curCamera.position.y * 1000 / 2,
          positionZ: curCamera.position.z * 1000 / 2,
        }];
        return API.view.setView({ camera, sectionPlanes });
      });
    }

    async function getView(e) {
      if (e && e.keyCode != 13) return;
      return doView(async () => {
        const id = $("#txtViewId").val();
        return renderjson.set_show_to_level("all")(await API.view.getView(id));
      });
    }

    async function selectView(id) {
      await API.view.selectView(id);
    }

    async function updateView(id, e) {
      const view = await API.view.getView(id);
      view.name = name();
      if (await API.view.updateView(view)) {
        $(`button[view-id='${id}'][name='name']`).text(view.name);
      }
    }

    async function deleteView(id, e) {
      if (await API.view.deleteView(id)) {
        $(e.target).closest("li").remove();
      }
    }

    async function getFilteredObjects() {
      $("#objectsLoading").hide();
      $("#objectsResult").html("");
      $('#btnShowFilteredObjects').popover('show');
    }

    async function getObjectsBy(action, e) {
      if (e && e.keyCode != 13) return;
      return doObjectsFilter(async () => {
        let result = await action();
        result = result && result.length
          ? renderjson.set_show_to_level(2)(result)
          : warn("Could not find any object. Make sure that the models are loaded and double-check the query!");
        return result;
      });
    }

    async function doObjectsFilter(action) {
      return doWorkRes("#objectsResult", "#objectsLoading", action);
    }

    function getSelectionSelector() {
      return { selected: true };
    }

    async function getAllObjects(e) {
      return getObjectsBy(async () => API.viewer.getObjects(), e);
    }

    async function getVisibleObjects(e) {
      return getObjectsBy(async () => API.viewer.getObjects(undefined, {visible: true}), e);
    }

    async function getColoredObjects(e) {
      return getObjectsBy(async () => API.viewer.getColoredObjects());
    }

    async function getAllExternalIds(e) {
      return getObjectsBy(async () => {
        const objs = await API.viewer.getObjects();
        for (const mid of objs) {
          const runtimeIds = mid.objects.map(o => o.id);
          mid.externalIds = await API.viewer.convertToObjectIds(mid.modelId, runtimeIds);
          if (runtimeIds.length !== mid.externalIds.length) {
            mid["FAILED"] = "FAILED: Cannot resolve all external IDs";
          }
        }

        return objs;
      }, e);
    }

    function toSelector(modelObjects) {
      return { modelObjectIds: modelObjects.map(m => ({ modelId: m.modelId, objectRuntimeIds: m.objects.map(o => o.id).sort() })).sort((a, b) => a < b ? -1 : a > b ? 1 : 0) };
    }

    function half(target) {
      return target.splice(0, Math.ceil(target.length / 2));
    }

    async function getHalfObjects() {
      return (await API.viewer.getObjects()).map(m => ({ modelId: m.modelId, objects: half(m.objects) }));
    }

    async function selectHalf(selected, e) {
      return getObjectsBy(async () => {
        const mids = [];
        const selector = toSelector(await getHalfObjects());
        await API.viewer.setSelection(selector, selected ? "set" : "remove");
        const actualSelection = toSelector(await API.viewer.getObjects({ selected: true }));
        let err;
        if (selected) {
          err = JSON.stringify(selector) != JSON.stringify(actualSelection) && "FAILED: The selected objects are not the same as specified in the selector";
        } else {
          for (const sel of actualSelection.modelObjectIds) {
            const match = selector.modelObjectIds.find(m => m.modelId === sel.modelId);
            if (!match) { continue; }
            for (const o of match.objects) {
              if (sel.objects.find(i => i.id === o.id)) {
                err = "FAILED: The objects are not unselected as specified in the selector";
                break;
              }
            }

            if (err) {
              break;
            }
          }
        }

        return [{ selector, status: err || "PASSED", actualSelection }];
      }, e);
    }

    async function setHalfVisible(visible, e) {
      return doObjectsFilter(async () => {
        const mids = [];
        const selector = toSelector(await getHalfObjects());
        await API.viewer.setObjectState(selector, { visible });
      }, e);
    }

    async function getObjectsBySelection(e) {
      return getObjectsBy(async () => API.viewer.getObjects(getSelectionSelector()), e);
    }

    async function setCameraBySelection() {
      return doObjectsFilter(async () => API.viewer.setCamera(getSelectionSelector()));
    }

    async function getSelection(e) {
      return getObjectsBy(async () => API.viewer.getSelection(), e);
    }

    function getClassSelector() {
      return {
        parameter: {
          class: $("#classFilter").val()
        }
      };
    }

    async function getObjectsByClass(e) {
      return getObjectsBy(async () => API.viewer.getObjects(getClassSelector()), e);
    }

    async function setObjectsByClass() {
      return doObjectsFilter(async () => API.viewer.setSelection(getClassSelector(), "set"));
    }

    async function setCameraByClass() {
      return doObjectsFilter(async () => API.viewer.setCamera(getClassSelector()));
    }

    function getProductSelector() {
      return {
        parameter: {
          product: { name: $("#productFilter").val() }
        }
      };
    }

    async function getObjectsByProduct(e) {
      return getObjectsBy(async () => API.viewer.getObjects(getProductSelector()), e);
    }

    async function setObjectsByProduct() {
      return doObjectsFilter(async () => API.viewer.setSelection(getProductSelector(), "set"));
    }

    async function setCameraByProduct() {
      return doObjectsFilter(async () => API.viewer.setCamera(getProductSelector()));
    }

    function getPropSelector() {
      return {
        parameter: {
          properties: {
            [$("#propNameFilter").val()]: $("#propValueFilter").val()
          }
        }
      };
    }

    async function getObjectsByProp(e) {
      return getObjectsBy(async () => API.viewer.getObjects(getPropSelector()), e);
    }

    async function setObjectsByProp(e) {
      return doObjectsFilter(async () => API.viewer.setSelection(getPropSelector(), "set"));
    }

    async function setCameraByProp() {
      return doObjectsFilter(async () => API.viewer.setCamera(getPropSelector()));
    }

    async function updateUIStates() {
      const ui = await API.ui.getUI();
      $("input[element-name]").each(function (i, e) {
        const ele = $(e).attr("element-name");
        const state = ui.find(u => u.name === ele);
        $(`*[element-name="${ele}"][name$="state"]`).text(`(Current state: ${state ? state.state : "FAILED"})`);
      });
    }

    async function setUIModal() {
      return doWorkPopover("#btnSetUI", "UI Control", "", async () => {
        await updateUIStates();
        return $('#setUIModal').html();
      });
    }

    async function toViewerWith(action) {
      return doWorkRes("#viewerResult", "#viewerLoading", action);
    }

    function getAccessToken() {
      toViewerWith(async () => {
        const token = await API.extension.requestPermission("accesstoken");
        $("#txtAccessToken").val(token)
        return token;
      });
    }

    async function loadTrimbim(e) {
      toViewerWith(async () => {
        let file;
        if (e) {
          files = e.files;
        } else {
          var f = document.getElementById("txtFileId");
          files = f.files;
        }
        let trbModels = [];
        for (const file of files) {
          const blob = await getBlob(file);
          const name = file.name.substring(0, file.name.lastIndexOf('.'));
          const placement = {
            locationX: 0,
            locationY: 0,
            locationZ: 0
          };
          const locX = placement.locationX += rand(-1, 1) * rand(1000, 5000);
          const locY = placement.locationY += rand(-1, 1) * rand(1000, 5000);
          const locZ = placement.locationZ += rand(-1, 1) * rand(1000, 5000);
          trbModels.push({id: name, trbBlob: blob, fitToView: true, placement: {
          position: {
            x: locX,
            y: locY,
            z: locZ
          }}});
        }
        return API.viewer.addTrimbimModel(trbModels);
      });
    }

    async function getLoadedTrimbims() {
      return doWorkPopover("#btnGetTrimbims", "TrbModels", "", async () => {
        const trbs = await API.viewer.getTrimbimModels();
        var html = `<div class="panel panel-primary"><div class="panel-body"><ul class="list-group">`;
        $.each(trbs, function (i, trb) {
          html += `<li class="list-group-item"><div class="d-flex">
            <div class="flex-grow-1">
              <span class="badge badge-secondary p-1 mr-1">id: ${trb.id}</span>
              <span class="p-2 mr-1">json: ${JSON.stringify(trb)}</span>
            </div>
            </div></li>`;
        });
        html += "</ul></div></div>";
        return html;
      });
    }

    async function UnloadTrimbim() {
      toViewerWith(async () => {
        const trbId = $("#txtTrbId").val();
        await API.viewer.removeTrimbimModel(trbId);
      });
    }

    async function hideTrimbim() {
      toViewerWith(async () => {
        const trbId = $("#txtTrbId").val();
        await API.viewer.addTrimbimModel({id: trbId, visible: false});
      });
    }

    async function unhideTrimbim() {
      toViewerWith(async () => {
        const trbId = $("#txtTrbId").val();
        await API.viewer.addTrimbimModel({id: trbId, visible: true});
      });
    }

    async function moveTrimbim() {
      toViewerWith(async () => {
        const placement = {
          locationX: 0,
          locationY: 0,
          locationZ: 0
        };
        const locX = placement.locationX += rand(-1, 1) * rand(1000, 5000);
        const locY = placement.locationY += rand(-1, 1) * rand(1000, 5000);
        const locZ = placement.locationZ += rand(-1, 1) * rand(1000, 5000);

        const axisX = 0;
        const axisY = 1;
        const axisZ = 0;

        const refDirectionX = 0.333333;
        const refDirectionY = 0.333333;
        const refDirectionZ = 0;

        const trbId = $("#txtTrbId").val();
        await API.viewer.addTrimbimModel({id: trbId, placement: {
          position: {
            x: locX,
            y: locY,
            z: locZ
          },
          axis: {
            x: axisX,
            y: axisY,
            z: axisZ
          },
          refDirection: {
            x: refDirectionX,
            y: refDirectionY,
            z: refDirectionZ
          }
        }});
      });
    }

    function getBlob(file) {
      return new Promise((resolve, reject) => {
        var reader = new FileReader();
        reader.onload = (e) => {
          const blob = new Blob([new Uint8Array(e.target.result)], {type: file.type });
          resolve(blob);
        }
        reader.onerror = () => reject("Error loading " + filePath);
        reader.readAsArrayBuffer(file);
      });
    }

    async function getViewSnapshot() {
      return doWorkPopover("#btnGetViewSnapshot", "View Snapshot", "#getViewSnapshotLoading", async () =>
        `<div class="container"><img src="${await API.viewer.getSnapshot()}" title="View snapshot" class="img-thumbnail" /></div>`);
    }

    function showAddSectionPlanesForm() {
      return doWorkPopover("#btnAddClipPlanes", "Add section planes", "", async () => {
        var html = `<div class="panel panel-primary">
          <div class="panel-body">
            <div><textarea id="txtAddSectionPlanes" placeholder="Section planes JSON" rows="10" cols="50"></textarea></div>
            <div>
              <button id="btnExecuteAddClipPlanes" class="btn btn-info btn-sm m-1" onClick="addSectionPlanes()">
                Add
              </button></div></div>
            </div>`;
        return html;
      });
    }

    function addSectionPlanes() {
      let sectionPlanes;
      try {
        sectionPlanes = JSON.parse($("#txtAddSectionPlanes").val());
      } catch (e) {
        console.log("JSON is not in correct format.");
      }

      if (sectionPlanes) {
        API.viewer.addSectionPlane(sectionPlanes);
      }
    }

    function getSectionPlanes() {
      return doWorkPopover("#btnGetClipPlanes", "Section planes", "", async () => {
        const sectionPlanes = await API.viewer.getSectionPlanes();
        var html = `<div class="panel panel-primary"><div class="panel-body"><ul class="list-group">`;
        $.each(sectionPlanes, function (i, s) {
          html += `<li class="list-group-item"><div class="d-flex">
            <div class="flex-grow-1">
              <span class="badge badge-secondary p-1 mr-1">id: ${s.sectionPlaneId}</span>
              <span class="p-2 mr-1">json: ${JSON.stringify(s)}</span>
            </div>
            </div></li>`;
        });
        html += "</ul></div></div>";
        return html;
      });
    }

    function clearSectionPlanes() {
      API.viewer.removeSectionPlanes();
    }

    async function setUI(e) {
      if (!e) return;
      const ele = $(e.target);
      const target = ele.attr("element-name");
      if (!target) return;
      const state = ele.is(":checked") ? ele.attr("selected-state") : ele.attr("deselected-state")
      console.log("Set UI Element: ", target, " - state: ", state);
      await API.ui.setUI({
        name: target,
        state: state
      });
      await updateUIStates();
    }

    async function setOpacity(e) {
      await API.viewer.setOpacity(e.value);
    }

    function getProjectSettings() {
      return doWorkPopover("#btnGetProjectSettings", "Project settings", "", async () => {
        const projectSettings = await API.project.getSettings();
        var html = `<div class="panel panel-primary"><div class="panel-body"><ul class="list-group">`;
        for (const key in projectSettings) {
          html += `<li class="list-group-item"><div class="d-flex">
            <div class="flex-grow-1">
              <span class="badge badge-secondary p-1 mr-1">${key}</span>
              <span class="p-2 mr-1">${JSON.stringify(projectSettings[key])}</span>
            </div>
            </div></li>`;
        }
        html += "</ul></div></div>";
        return html;
      });
    }

    function getUserSettings() {
      return doWorkPopover("#btnGetUserSettings", "User settings", "", async () => {
        const userSettings = await API.user.getSettings();
        var html = `<div class="panel panel-primary"><div class="panel-body"><ul class="list-group">`;
        for (const key in userSettings) {
          html += `<li class="list-group-item"><div class="d-flex">
            <div class="flex-grow-1">
              <span class="badge badge-secondary p-1 mr-1">${key}</span>
              <span class="p-2 mr-1">${JSON.stringify(userSettings[key])}</span>
            </div>
            </div></li>`;
        }
        html += "</ul></div></div>";
        return html;
      });
    }

    async function doWorkSafe(preAction, action, postAction) {
      preAction();
      let result;
      try {
        const actionRes = await action();
        if (actionRes === false) {
          throw new Error("Operation failed: Unknown error");
        } else if (actionRes === true || actionRes === "" || actionRes == null) {
          result = ok();
        } else {
          result = actionRes;
        }
      }
      catch (e) {
        result = err(e);
      }
      postAction(result)
    }

    async function doWorkPopover(selPopover, title, selLoading, action) {
      return doWorkSafe(() => {
        $(selLoading).show();
        $(selPopover).popover("dispose");
      }, action, r => {
        $(selPopover).popover({
          title: title,
          content: r,
          html: true,
          trigger: "manual",
          placement: "bottom"
        });
        $(selPopover).popover("show");
        $(selLoading).hide();
      });
    }

    async function doWorkRes(selResult, selLoading, action) {
      return doWorkSafe(() => {
        $(selResult).html("");
        $(selLoading).show();
      }, action, r => {
        $(selLoading).hide();
        $(selResult).html(r);
      });
    }

    // from https://css-tricks.com/snippets/javascript/get-url-variables/
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

    function rand(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
    }

    function inIframe() {
      try {
        return window.self !== window.top;
      } catch (e) {
        return true;
      }
    }

    const nouns = ["bird", "clock", "plastic", "duck", "developer"];
    const verbs = ["coded", "sunk", "broke", "flew", "jumped"];
    const adjectives = ["beautiful", "professional", "lovely", "dumb", "rough"];
    const adverbs = ["slowly", "elegantly", "precisely", "quickly", "sadly"];
    const preposition = ["down", "into", "up", "on", "upon"];
    function randGen() { return Math.floor(Math.random() * 5); }
    function name() {
      var rand1 = randGen();
      var rand2 = randGen();
      var rand3 = randGen();
      var rand4 = randGen();
      var rand5 = randGen();
      var rand6 = randGen();
      return `The ${adjectives[rand1]} ${nouns[rand2]} ${adverbs[rand3]} ${verbs[rand4]} on ${getDateStr()}`;
    }

    function getDateStr() {
      var today = new Date();
      var date = "" + today.getFullYear() + (today.getMonth() + 1) + today.getDate();
      var time = "" + today.getHours() + today.getMinutes() + today.getSeconds();
      return date + ' ' + time;
    }

    async function withTimeOut(timeOutInMilliseconds, action, rejectOnTimeOut) {
      const timeOutPromise = new Promise((resolve, reject) => {
        const wait = setTimeout(() => {
          clearTimeout(wait);
          (rejectOnTimeOut === false ? resolve : reject)("Timed Out");
        }, timeOutInMilliseconds);
      });
      return Promise.race([timeOutPromise, action]);
    }

    async function assertNewCamera(camera) {
      return withTimeOut(
        5 * 60 * 1000,
        new Promise(r => { cameraChanged = r; API.viewer.setCamera(camera); })
          .then(r => console.log("setCamera: ", r)));
    }