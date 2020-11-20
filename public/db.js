// Different browsers can have different names for the indexedDB object, so we standardize that here
const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;

let db;

// Tell indexedDb to open (or create) whatever database you want to work with
const request = indexedDB.open("<bankOfKatie>", 1);

// Set up your object store
request.onupgradeneeded = ({ target }) => {
  let db = target.result;
  db.createObjectStore("<KatieMoney>", { autoIncrement: true });
};

// Leave this code as-is
request.onsuccess = ({ target }) => {
  db = target.result;
  // check if app is online before reading from db
  if (navigator.onLine) {
    checkDatabase();
  }
};

// Simple error handler. Leave as-is
request.onerror = function(event) {
  console.log("Woops! " + event.target.errorCode);
};

// This function is called when it's time to save data to the indexedDb
function saveRecord(record) {
  const transaction = db.transaction(["<KatieMoney>"], "readwrite");
  const store = transaction.objectStore("<KatieMoney>");
  store.add(record);
}

// This function runs when we detect that the internet connection is working again. It sends a post request to the server with all the saved data so that the data can be synced with the server, and then it wipes out the existing indexedDb. You can keep as-is, unless you want to change the name of the fetch route.
function checkDatabase() {
  const transaction = db.transaction(["<KatieMoney>"], "readwrite");
  const store = transaction.objectStore("<KatieMoney>");
  const getAll = store.getAll();

  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
      .then(response => {        
        return response.json();
      })
      .then(() => {
        // delete records if successful
        const transaction = db.transaction(["<KatieMoney>"], "readwrite");
        const store = transaction.objectStore("<KatieMoney>");
        store.clear();
      });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);