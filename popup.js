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
    // See https://developer.chrome.com/extensions/tabs#type-Tab
    var url = tab.url;

    // tab.url is only available if the "activeTab" permission is declared.
    // If you want to see the URL of other tabs (e.g. after removing active:true
    // from |queryInfo|), then the "tabs" permission is required to see their
    // "url" properties.
    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(url);
  });

  // Most methods of the Chrome extension APIs are asynchronous. This means that
  // you CANNOT do something like this:
  //
  // var url;
  // chrome.tabs.query(queryInfo, (tabs) => {
  //   url = tabs[0].url;
  // });
  // alert(url); // Shows "undefined", because chrome.tabs.query is async.
}

/**
 * Change the background color of the current page.
 *
 * @param {string} color The new background color.
 */
function changeBackgroundColor(color) {
  var script = 'document.body.style.backgroundColor="' + color + '";';
  // See https://developer.chrome.com/extensions/tabs#method-executeScript.
  // chrome.tabs.executeScript allows us to programmatically inject JavaScript
  // into a page. Since we omit the optional first argument "tabId", the script
  // is inserted into the active tab of the current window, which serves as the
  // default.
  chrome.tabs.executeScript({
    code: script
  });
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
    window.setTimeout(() => {message_prompt.innerHTML = ''}, 5000);

  });



}


/**
 * Sets the given background color for url.
 *
 * @param {string} url URL for which background color is to be saved.
 * @param {string} color The background color to be saved.
 */
function saveBackgroundColor(url, color) {
  var items = {};
  items[url] = color;
  // See https://developer.chrome.com/apps/storage#type-StorageArea. We omit the
  // optional callback since we don't need to perform any action once the
  // background color is saved.
  chrome.storage.sync.set(items);
}

// This extension loads the saved background color for the current tab if one
// exists. The user can select a new background color from the dropdown for the
// current page, and it will be saved as part of the extension's isolated
// storage. The chrome.storage API is used for this purpose. This is different
// from the window.localStorage API, which is synchronous and stores data bound
// to a document's origin. Also, using chrome.storage.sync instead of
// chrome.storage.local allows the extension data to be synced across multiple
// user devices.
document.addEventListener('DOMContentLoaded', () => {
  getCurrentTabUrl((url) => {
    var dropdown = document.getElementById('dropdown');

    // Load the saved background color for this page and modify the dropdown
    // value, if needed.
    getSavedBackgroundColor(url, (savedColor) => {
      if (savedColor) {
        changeBackgroundColor(savedColor);
        dropdown.value = savedColor;
        console.log(dropdown.value);
      }
    });
    var liq_contents = document.getElementsByClassName("tabcontent");

    for (var s = 0; s < liq_contents.length; s++) {
      liq_contents[s].style.display = 'none';
    }

    var liq_tabs = document.getElementsByClassName('tablinks');
    document.getElementById('liq-save-settings').addEventListener('click', () => {
      saveLiquidDLSetting();
    });
    // Add an EventListener to each tab so we can create a display
    for (var s = 0; s < liq_tabs.length; s++) {
      liq_tabs[s].addEventListener('click', (event) => {
        //  Get the Name of The Tab
        var cityName = event.srcElement.innerHTML;
        console.log(event);
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



    // Ensure the background color is changed and saved when the dropdown
    // selection changes.
    dropdown.addEventListener('change', () => {
      changeBackgroundColor(dropdown.value);
      saveBackgroundColor(url, dropdown.value);
    });



  });
});



/**
* Sets the initial value of the inputs while 
*/
chrome.storage.sync.get('liq_settings', function(data) {
  // Notify that we saved.
  if("liq_settings" in data){
    console.log(data);
    document.getElementById('liq-ip-addy').value = data.liq_settings.ip_address;
    document.getElementById('liq-api-key').value = data.liq_settings.apiKey;
    document.getElementById('liq-default-directory').value = data.liq_settings.default_dir;

  }else{
    document.getElementById('liq-message-prompt').innerHTML = "Please Set Your Settings"
    window.setTimeout(() => {message_prompt.innerHTML = ''}, 6000)
  }
});
