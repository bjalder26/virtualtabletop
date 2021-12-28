import { $, $a, onLoad, selectFile, asArray } from './domhelpers.js';
import { startWebSocket, toServer } from './connection.js';


export let scale = 1;
let roomRectangle;
let overlayActive = false;
let muted = false;
let unmuteVol = 30;
let optionsHidden = true;

var vmEditOverlay;

let urlProperties = {};

let maxZ = {};
export const dropTargets = new Map();

function compareDropTarget(widget, t, exclude){
  for(const dropTargetObject of asArray(t.get('dropTarget'))) {
    let isValidObject = true;
    for(const key in dropTargetObject) {
      if(dropTargetObject[key] != widget.get(key) && (exclude == true || (key != 'type' || widget.get(key) != 'deck' || dropTargetObject[key] != 'card'))) {
        isValidObject = false;
        break;
      }
    }
    if(isValidObject) {
      return true;
    }
  }
  return false;
}

function getValidDropTargets(widget) {
  const targets = [];
  for(const [ _, t ] of dropTargets) {
    // if the holder has a drop limit and it's reached, skip the holder
    if(t.get('dropLimit') > -1 && t.get('dropLimit') <= t.children().length)
      // don't skip it if the dragged widget is already its child
      if(t.children().indexOf(widget) == -1)
        continue;

    let isValid = compareDropTarget(widget, t);

    let tt = t;
    while(isValid) {
      if(widget == tt) {
        isValid = false;
        break;
      }

      if(tt.get('parent'))
        tt = widgets.get(tt.get('parent'));
      else
        break;
    }

    if(isValid)
      targets.push(t);
  }
  return targets;
}

function getMaxZ(layer) {
  return maxZ[layer] || 0;
}

async function resetMaxZ(layer) {
  maxZ[layer] = 0;
  for(const w of widgetFilter(w=>w.get('layer')==layer&&w.state.z).sort((a,b)=>a.get('z')-b.get('z')))
    await w.set('z', ++maxZ[layer]);
}

function updateMaxZ(layer, z) {
  maxZ[layer] = Math.max(maxZ[layer] || 0, z);
}

export function showOverlay(id, forced) {
  if(overlayActive == 'forced' && !forced)
    return;

  for(const d of $a('.overlay'))
    if(d.id != id)
      d.style.display = 'none';

  if(id) {
    const style = $(`#${id}`).style;
    style.display = !forced && style.display === 'flex' ? 'none' : 'flex';
    $('#roomArea').className = style.display === 'flex' ? 'hasOverlay' : '';
    overlayActive = style.display === 'flex';
    if(forced)
      overlayActive = 'forced';

    //Hack to focus on the Go button for the input overlay
    if (id == 'buttonInputOverlay') {
      $('#buttonInputGo').focus();
    }
    toServer('mouse',{inactive:true})
  } else {
    $('#roomArea').className = '';
    vmEditOverlay.selectedWidget = {};
    overlayActive = false;
  }
}

function checkURLproperties(connected) {
  if(!connected) {

    try {
      if(location.hash) {
        const playerParams = location.hash.match(/^#player:([^:]+):%23([0-9a-f]{6})$/);
        if(playerParams) {
          urlProperties = { player: decodeURIComponent(playerParams[1]), color: '#'+playerParams[2] };
        } else {
          urlProperties = JSON.parse(decodeURIComponent(location.hash.substr(1)));
        }
        history.pushState("", document.title, window.location.pathname);
      }
    } catch(e) {
      console.error('Could not parse URL parameters.', e);
      urlProperties = {};
    }

    if(urlProperties.player) {
      playerName = urlProperties.player;
      localStorage.setItem('playerName', playerName);
    }
    if(urlProperties.hideToolbar) {
      $('#toolbar').style.display = 'none';
      document.documentElement.style.setProperty('--toolbarSize', 0);
    }
    if(urlProperties.askID) {
      on('#askIDoverlay button', 'click', function() {
        roomID = urlProperties.askID + $('#enteredID').value;
        toServer('room', { playerName, roomID });
        $('#legacy-link').href += `#${roomID}`;
        showOverlay();
      });
      showOverlay('askIDoverlay');
    }
    if(urlProperties.css) {
      const link = document.createElement('link');

      link.type = 'text/css';
      link.rel = 'stylesheet';
      link.href = urlProperties.css;

      document.head.appendChild(link);
    }

  } else {

    if(urlProperties.color)
      toServer('playerColor', { player: playerName, color: urlProperties.color });

  }
}

function setScale() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  if(jeEnabled) {
    const targetWidth = jeZoomOut ? 3200 : 1600;
    const targetHeight = jeZoomOut ? 2000 : 1000;
    const availableWidth = $('#jeText').offsetLeft;
    if(availableWidth/(h-70) < 1600/1000)
      scale = availableWidth/targetWidth;
    else
      scale = (h-70)/targetHeight;
  } else {
    scale = w/h < 1600/1000 ? w/1600 : h/1000;
  }
  if(w-scale*1600 + h-scale*1000 < 44) {
    $('body').classList.add('aspectTooGood');
    if(!$('body').className.match(/hiddenToolbar/))
      scale = (w-44)/1600;
  } else {
    $('body').classList.remove('aspectTooGood');
  }
  document.documentElement.style.setProperty('--scale', scale);
  roomRectangle = $('#roomArea').getBoundingClientRect();
}

async function uploadAsset(multipleCallback) {
  if(typeof(multipleCallback) === "function") {
    return selectFile('BINARY', async function (f) {
      let uploadPath = await _uploadAsset(f).catch(e=>alert(`Uploading failed: ${e.toString()}`));
      multipleCallback(uploadPath, f.name)
    });
  }
  else {
    return selectFile('BINARY').then(_uploadAsset).catch(e=>alert(`Uploading failed: ${e.toString()}`));
  }
}

async function _uploadAsset(file) {
    const response = await fetch('/asset', {
      method: 'PUT',
      headers: {
        'Content-type': 'application/octet-stream'
      },
      body: file.content
    });

    if(response.status == 413)
      throw 'File is too big.';
    else if(!response.ok)
      throw `${response.status} - ${response.statusText}`;

    return response.text();
}

const svgCache = {};
function getSVG(url, replaces, callback) {
  if(typeof svgCache[url] == 'string') {
    let svg = svgCache[url];
    for(const replace in replaces)
      svg = svg.split(replace).join(replaces[replace]);
    return 'data:image/svg+xml,'+encodeURIComponent(svg);
  }

  if(!svgCache[url]) {
    svgCache[url] = [];
    fetch(url).then(r=>r.text()).then(t=>{
      const callbacks = svgCache[url];
      svgCache[url] = t;
      for(const c of callbacks)
        c();
    });
  }

  svgCache[url].push(callback);
  return '';
}

function placeTags(tag, passedClass){
  var selection, range;
  if (document.getSelection) {
    selection = document.getSelection();
    var rep = selection.toString();
// here
    range = selection.getRangeAt(0);
    range.deleteContents();
    var node = document.createElement(tag);
    node.setAttribute('class', passedClass);
    node.innerHTML = rep;
    range.insertNode(node);
  }
}

onLoad(function() {
  on('#pileOverlay', 'click', e=>e.target.id=='pileOverlay'&&showOverlay());

  on('.toolbarButton', 'click', function(e) {
    const overlay = e.target.dataset.overlay;
    if(overlay)
      showOverlay(overlay);
  });

  on('#muteButton', 'click', function(){
    if(muted) {
      document.getElementById('volume').value = unmuteVol;
      document.getElementById('muteButton').classList.remove('muted');
      var allAudios = document.querySelectorAll('audio');
      allAudios.forEach(function(audio){
        audio.volume = Math.min(audio.getAttribute('maxVolume') * (((10 ** (unmuteVol / 96.025)) / 10) - 0.1), 1);
      });
    } else {
      unmuteVol = document.getElementById('volume').value;
      document.getElementById("volume").value = 0;
      var allAudios = document.querySelectorAll('audio');
      allAudios.forEach(function(audio){
        audio.volume = 0;
      });
      document.getElementById('muteButton').classList.add('muted');
    }
    muted = !muted
  });

  on('#optionsButton', 'click', function(){
    if(optionsHidden) {
      document.getElementById('options').classList.remove('hidden');
    } else {
      document.getElementById('options').classList.add('hidden');
    }
    optionsHidden = !optionsHidden
  });

  on('#fullscreenButton', 'click', function() {
    if(document.documentElement.requestFullscreen) {
      if(!document.fullscreenElement)
        document.documentElement.requestFullscreen();
      else
        document.exitFullscreen();
    } else if(document.documentElement.webkitRequestFullscreen) {
      if(!document.webkitFullscreenElement)
        document.documentElement.webkitRequestFullScreen();
      else
        document.webkitExitFullscreen();
    }
  });
  on('#hideToolbarButton', 'click', function() {
    $('body').classList.add('hiddenToolbar');
    setScale();
  });

  if(Object.keys(config.betaServers).length) {
    for(const betaServerName in config.betaServers) {
      const entry = domByTemplate('template-betaServerList-entry', 'tr');
      $('button', entry).textContent = betaServerName;
      var thisstatus = config.betaServers[betaServerName].return ? 'check' : 'cancel';
      $('.return', entry).textContent = thisstatus;
      $('.return', entry).classList.add(thisstatus);
      $('.description', entry).textContent = config.betaServers[betaServerName].description;
      $('#betaServerList').appendChild(entry);
    }
    on('#betaServerList button', 'click', function(e) {
      toServer('setRedirect', e.target.textContent);
    });
  } else {
    removeFromDOM($('#betaText'));
  }
  onMessage('redirect', function(url) {
    window.location.href = `${url}#player:${encodeURIComponent(playerName)}:${encodeURIComponent(playerColor)}`;
  });
  on('#returnOverlay button', 'click', function() {
    toServer('setRedirect', 'return');
  });

  function setHTML(attr, value) {
  const selection = document.getSelection();
  if (selection != '') {
    document.execCommand('insertHTML', false, `<span ${attr}='${value}'>${selection}</span>`);
  } else {
    var node = document.getSelection().anchorNode;
    let blockNode = getBlockNode(node);
    console.log(blockNode.nodeName);
    if (blockNode.id == 'richtextText') {
      console.log('rtt');
      let range = new Range();
      range.setStart(richtextText, 0);
      range.setEnd(richtextText, 1);
      var newParent = document.createElement('span');
      var attribute = document.createAttribute(attr);
      attribute.value = value;
      newParent.setAttributeNode(attribute);
      range.surroundContents(newParent);
      console.log(range);
    } else {
      var attribute = document.createAttribute(attr);
      attribute.value = value;
      blockNode.setAttributeNode(attribute);
    }
  }
}

function getBlockNode(node) {
  let nodeName = node.nodeName;
  const blockNodeArray = ['BLOCKQUOTE', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'OL', 'P', 'PRE', 'UL'];
  if (!blockNodeArray.includes(node.nodeName)) {
    if (node.parentElement != 'undefined' || node.parentElement != null)
      node = getBlockNode(node.parentElement);
  }
  return node
}
  // richtext editor

  on('[title="Formatblock"]', 'change', function(){formatDoc('formatblock',this[this.selectedIndex].value);this.selectedIndex=0;});
  on('[title="Fontnames"]', 'change', function() {if(validateMode())setHTML('class', this[this.selectedIndex].value);this.selectedIndex=0;});
  on('[title="Fontsizes"]', 'change', function(){formatDoc('fontsize',this[this.selectedIndex].value);this.selectedIndex=0;});
  on('[title="Forecolor"]', 'change', function(){formatDoc('forecolor',this[this.selectedIndex].value);this.selectedIndex=0;});
  on('[title="Backcolor"]', 'change', function(){formatDoc('backcolor',this[this.selectedIndex].value);this.selectedIndex=0;});
  on('[title="Fonts"]', 'change', function(){formatDoc('formatBlock', 'h1');this.selectedIndex=0;});


  on('.intLink.command', 'click', function(e){formatDoc(this.dataset.command, this.dataset.value);});
  on('.intLink', 'mousedown', function(e){e.preventDefault();});

  on('[data-command="Image"]', 'click', function(){if(validateMode()){var sImg=prompt('Enter the image URL here','https:\/\/');if(sImg&&sImg!=''&&sImg!='http://'){formatDoc('insertImage',sImg)}}});
  on('[data-command="Hyperlink"]', 'click', function(){if(validateMode()){var sLnk=prompt('Write the URL here','https:\/\/');if(sLnk&&sLnk!=''&&sLnk!='http://'){formatDoc('createlink',sLnk)}}}); 
  on('[data-command="ImageUpload"]', 'click', function(){if(validateMode()){uploadAsset().then(function(asset) {if(asset) {formatDoc('insertImage',asset)}})}});
  on('#switchBox', 'change', function(){
	  setDocMode(this.checked);
  if(this.checked) {
    $('#richtextText').style.cssText = '';
	  $('#richtextText').style.height = 'inherit';
		$('#richtextText').style.width = 'inherit';
		$('#richtextText').style['border-style'] = 'none';
		$('#richtextText').style['background-color'] = 'white';
		$('#richtextText').style['background-image'] = 'none';
  } else {
	  const widget = widgets.get(JSON.parse($('#editWidgetJSON').dataset.previousState).id);
    $('#richtextText').style.cssText = widget.get('css');
	  $('#richtextText').style.height = $('#richtextHeight').value+"px";
	  $('#richtextText').style.width = $('#richtextWidth').value+"px";
    if(borderStyle || widget.get('borderStyle'))
      $('#richtextText').style['border-style'] = borderStyle ? borderStyle : widget.get('borderStyle');
    if(backgroundColor || widget.get('backgroundColor'))
      $('#richtextText').style['background-color'] = backgroundColor ? backgroundColor : widget.get('backgroundColor');
    if(loadedAsset || widget.get('image'))
      $('#richtextText').style['background-image'] = loadedAsset ? `url(${loadedAsset})` : `url(${widget.get('image')})`;
  }
  });

  on('#richtextScale', 'change', function(){
  if(this.checked) {
	  var cssText = document.getElementsByTagName('html')[0].style.cssText
	  var startPos = cssText.indexOf('--scale:') + 8;
      var endPos = cssText.indexOf(';',startPos);
      var roomScale = cssText.substring(startPos,endPos)
	    $('#richtextText').style.transform = `scale(${roomScale})`;
  } else {
	  $('#richtextText').style.transform = 'scale(1.0)';
  }
  });

  on('#richtextHeight', 'change', function(){
	  if(validateMode())
		  $('#richtextText').style.height = this.value+"px";
  });
  on('#richtextWidth', 'change', function(){
	  if(validateMode())
		  $('#richtextText').style.width = this.value+"px";
  });
  on('#richtextPadding', 'change', function(){
	  if(validateMode())
		  $('#richtextText').style.padding = this.value+"px";
  });
  on('#richtextBorderWidth', 'change', function(){
	  if(validateMode())
		  $('#richtextText').style['border-width'] = this.value+"px";
  });
    on('[title=richtextBorderStyle]', 'input' , function(){
		if(validateMode()) {
	  borderStyle = $('[title=richtextBorderStyle]').value;
	 $('#richtextText').style['border-style'] = this.value;
		}
  });
  //


  checkURLproperties(false);
  setScale();
  startWebSocket();

  onMessage('warning', alert);
  onMessage('error', alert);
  onMessage('internal_error', function() {
    preventReconnect();
    showOverlay('internalErrorOverlay');
  });
  let checkedOnce = false;
  onMessage('meta', function() {
    if(!checkedOnce)
      checkURLproperties(true);
    checkedOnce = true;
  });
});

window.onresize = function(event) {
  setScale();
}

window.onkeyup = function(event) {
  if(event.key == 'Escape') {
    if(overlayActive)
      showOverlay();
    else if(edit)
      toggleEditMode();
    else if(jeEnabled)
      jeToggle();
  }
}

if(document.getElementById("volume")) {
    document.getElementById("volume").addEventListener("input", function(){ // allows volume to be adjusted in real time
      if(muted) {
        document.getElementById('muteButton').classList.remove('muted');
        muted = !muted
      }
    var allAudios = document.querySelectorAll('audio');
    allAudios.forEach(function(audio){
      audio.volume = Math.min(audio.getAttribute('maxVolume') * (((10 ** (document.getElementById('volume').value / 96.025)) / 10) - 0.1), 1);
    });
  });
}
