var fakeStorage = {
  _data: {},

  setItem: function (id, val) {
    return this._data[id] = String(val);
  },

  getItem: function (id) {
    return this._data.hasOwnProperty(id) ? this._data[id] : undefined;
  },

  removeItem: function (id) {
    return delete this._data[id];
  },

  clear: function () {
    return this._data = {};
  }
};

function LocalScoreManager() {
  this.key     = "bestScore";

  var supported = false;
  this.storage = fakeStorage;
}

LocalScoreManager.prototype.get = function () {
  return this.storage.getItem(this.key) || 0;
};

LocalScoreManager.prototype.set = function (score) {
  this.storage.setItem(this.key, score);
};

exports.LocalScoreManager = LocalScoreManager;
