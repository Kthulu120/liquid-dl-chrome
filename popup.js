// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Get the current URL.
 *
 * @param {function(string)} callback called when the URL of the current tab
 *   is found.
 */
function getCurrentTabUrl(callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, (tabs) => {
    // chrome.tabs.query invokes the callback with a list of tabs that match the
    // query. When the popup is opened, there is certainly a window and at least
    // one tab, so we can safely assume that |tabs| is a non-empty array.
    // A window can only have one active tab at a time, so the array consists of
    // exactly one tab.
    var tab = tabs[0];

    // A tab is a plain object that provides information about the tab.
    var url = tab.url;

    // tab.url is only available if the "activeTab" permission is declared.
    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(url);
  });
}

hideTabPanes = () => {
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    // Set The Content of the Tabs to display to none
    tabcontent[i].style.display = "none";
  }
}
/**
 * Gets the saved background color for url.
 *
 * @param {string} url URL whose background color is to be retrieved.
 * @param {function(string)} callback called with the saved background color for
 *     the given url on success, or a falsy value if no color is retrieved.
 */
function getSavedBackgroundColor(url, callback) {
  // See https://developer.chrome.com/apps/storage#type-StorageArea. We check
  // for chrome.runtime.lastError to ensure correctness even when the API call
  // fails.
  chrome.storage.sync.get(url, (items) => {
    callback(chrome.runtime.lastError ? null : items[url]);
  });
}

saveLiquidDLSetting = () => {
  const ip = document.getElementById('liq-ip-addy').value;
  const apiKey = document.getElementById('liq-api-key').value;
  const defaultDir = document.getElementById('liq-default-directory').value;
  const message_prompt = document.getElementById('liq-message-prompt');

  const values = {
    apiKey: apiKey,
    ip_address: ip,
    default_dir: defaultDir
  }
  chrome.storage.sync.set({
    'liq_settings': values
  }, function() {
    // Notify that we saved.
    message_prompt.innerHTML = 'Settings saved';
    window.setTimeout(() => {
      message_prompt.innerHTML = ''
    }, 5000);

  });



}


scdlSubmission = () => {
  let output_val = document.getElementById('scdl-output-field').value
  if (output_val === ''){
    output_val = document.getElementById('liq-default-directory').value
  }
  var xhr = new XMLHttpRequest();
  let req_info = {
    operating_system: 'Windows',
    apiKey: document.getElementById('liq-api-key').value,
    url: document.getElementById('scdl-url-field').value,
    output_path: document.getElementById('scdl-output-field').value,
    download_artist: document.getElementById("myCheck").checked,
    download_all_tracks_and_reposts: false,
    download_user_uploads: false,
    download_favorites: false,
    download_playlist: false,
    download_like_and_owned_playlists: false,
  }
  xhr.open("GET", 'http://' + document.getElementById('liq-ip-addy').value + "/liquid-dl/youtubedl/chrome-extension?" + jQuery.param(req_info), true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      // JSON.parse does not evaluate the attacker's scripts.
    //  var resp = JSON.parse(xhr.responseText);
    document.getElementById('liq-message-prompt').innerHTML = xhr.responseText;
    }
  }

  console.log(req_info)
  xhr.send(JSON.stringify(req_info));

}
/**
* Submits the YTDL form
*/
ytdlSubmission = () => {
  let output_val = document.getElementById('ytdl-output-field').value
  if (output_val ===""){
    output_val = document.getElementById('liq-default-directory').value
    chrome.storage.sync.get('liq_settings', function(data) {
        output_val = data.liq_settings.default_dir
    });

  }
  console.log(output_val);
  var xhr = new XMLHttpRequest();
  let req_info = {
    operating_system: 'Windows',
    apiKey: document.getElementById('liq-api-key').value,
    url: document.getElementById('ytdl-url-field').value,
    output_path: output_val,
    make_folder:false,
    new_folder_name: '',
    is_playlist:false,
    chosen_formats: {id: document.getElementById('ytdl-url-field').value, format: 'best'}
  }
  xhr.open("GET", 'http://' + document.getElementById('liq-ip-addy').value + "/liquid-dl/youtubedl/chrome-extension?" + jQuery.param(req_info), true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      // JSON.parse does not evaluate the attacker's scripts.
    //  var resp = JSON.parse(xhr.responseText);
    document.getElementById('liq-message-prompt').innerHTML = xhr.responseText;
    }
  }

  xhr.send(JSON.stringify(req_info));
}


/**
 * Sets up the initial EventListeners for the application
 */
document.addEventListener('DOMContentLoaded', () => {
  getCurrentTabUrl((url) => {
    var dropdown = document.getElementById('dropdown');

    // Grab the contents of all tab panes
    var liq_contents = document.getElementsByClassName("tabcontent");

    for (var s = 0; s < liq_contents.length; s++) {
      // Iterate throught them tab panes and hide them
      liq_contents[s].style.display = 'none';
    }

    // Grab Tab Buttons
    var liq_tabs = document.getElementsByClassName('tablinks');
    document.getElementById('liq-save-settings').addEventListener('click', () => {
      saveLiquidDLSetting();
    });
    // Add an EventListener to each tab so we can create a display
    for (var s = 0; s < liq_tabs.length; s++) {
      liq_tabs[s].addEventListener('click', (event) => {
        //  Get the Name of The Tab
        var cityName = event.srcElement.innerHTML;
        var i, tabcontent, tablinks;
        // Get Content Tabs
        tabcontent = document.getElementsByClassName("tabcontent");
        for (i = 0; i < tabcontent.length; i++) {
          // Set The Content of the Tabs to display to none
          tabcontent[i].style.display = "none";
        }
        tablinks = document.getElementsByClassName("tablinks");
        for (i = 0; i < tablinks.length; i++) {
          tablinks[i].className = tablinks[i].className.replace(" active", "");
        }
        // Set Display To Flex, Therefore showing the content of the tab
        document.getElementById(cityName).style.display = "flex";
        // Give Clicked Tab a className of active
        event.currentTarget.className += " active";
      });
    }
    document.getElementById('scdl-submit').addEventListener('click', () => {
      scdlSubmission();
    });
    document.getElementById('ytdl-submit').addEventListener('click', () => {
      ytdlSubmission();
    });
    document.getElementById('liq-save-settings').addEventListener('click', () => {
      saveLiquidDLSetting();
    });

  });
});



/**
 * Sets the initial value of the inputs while
 */
chrome.storage.sync.get('liq_settings', function(data) {
  // Notify that we saved.
  if ("liq_settings" in data) {
    console.log(data);
    document.getElementById('liq-ip-addy').value = data.liq_settings.ip_address;
    document.getElementById('liq-api-key').value = data.liq_settings.apiKey;
    document.getElementById('liq-default-directory').value = data.liq_settings.default_dir;

  } else {
    //Display Message
    document.getElementById('liq-message-prompt').innerHTML = "Please Set Your Settings"
    window.setTimeout(() => {
      message_prompt.innerHTML = ''
    }, 6000)
  }
});
