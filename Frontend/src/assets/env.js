(function (window) {
  window["env"] = window["env"] || {};

  // Environment variables
  window["env"]["backendBaseUrl"] = "${API_URL}";
  window["env"]["authBaseUrl"] = "${AUTH_URL}";
})(this);
