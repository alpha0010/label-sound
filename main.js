const App = {
  init: function() {
    this.audioPlayer = document.getElementById("audioPlayer");
    this.eventData = [];
    this.keyMap = [];
    this.outputCsv = document.getElementById("outputCsv");

    const keyDetector = document.getElementById("keyDetector");
    const mappedKeyCount = document.getElementById("mappedKeyCount");
    const songInput = document.getElementById("songInput");

    songInput.addEventListener("change", () => {
      this.audioPlayer.setAttribute(
        "src",
        URL.createObjectURL(songInput.files[0])
      );
    });

    keyDetector.addEventListener("keypress", e => this.onKeyPress(e));
    mappedKeyCount.addEventListener("change", e => this.onMapKeys(e));

    this.onMapKeys({ target: { value: mappedKeyCount.value } });
  },

  onKeyPress: function(e) {
    this.eventData.push({
      currentTime: this.audioPlayer.currentTime,
      key: e.key
    });
    e.preventDefault();

    window.requestAnimationFrame(() => this.renderOutput());
  },

  onMapKeys: function(e) {
    const value = parseInt(e.target.value, 10);
    if (!isFinite(value) || value < 0 || value > 32) {
      return;
    }

    while (this.keyMap.length < value) {
      this.keyMap.push({ label: "", key: "", takesNumber: false });
    }
    while (this.keyMap.length > value) {
      this.keyMap.pop();
    }
    window.requestAnimationFrame(() => this.renderKeyMappings());
  },

  renderKeyMappings: function() {
    const keyMappingsDiv = document.getElementById("keyMappings");
    while (keyMappingsDiv.children.length > this.keyMap.length) {
      keyMappingsDiv.removeChild(keyMappingsDiv.lastChild);
    }

    for (let i = keyMappingsDiv.children.length; i < this.keyMap.length; ++i) {
      const mappingDiv = document.createElement("div");

      const labelInput = document.createElement("input");
      labelInput.setAttribute("type", "text");
      labelInput.setAttribute("size", 10);
      labelInput.setAttribute("placeholder", "Column Name");
      labelInput.setAttribute("value", this.keyMap[i].label);
      labelInput.addEventListener("change", e => {
        this.keyMap[i].label = e.target.value;
      });
      mappingDiv.appendChild(labelInput);

      const keyInput = document.createElement("input");
      keyInput.setAttribute("type", "text");
      keyInput.setAttribute("size", 10);
      keyInput.setAttribute("maxlength", 1);
      keyInput.setAttribute("placeholder", "Key");
      keyInput.setAttribute("value", this.keyMap[i].key);
      keyInput.addEventListener("change", e => {
        this.keyMap[i].key = e.target.value;
      });
      mappingDiv.appendChild(keyInput);

      const takesNumberInput = document.createElement("input");
      takesNumberInput.setAttribute("type", "checkbox");
      takesNumberInput.setAttribute("id", "chkNumberInput" + i);
      if (this.keyMap[i].takesNumber) {
        takesNumberInput.setAttribute("checked", "");
      }
      takesNumberInput.addEventListener("change", e => {
        this.keyMap[i].takesNumber = e.target.checked;
      });
      const takesNumberLabel = document.createElement("label");
      takesNumberLabel.setAttribute("for", "chkNumberInput" + i);
      takesNumberLabel.textContent = "Takes number";
      mappingDiv.appendChild(takesNumberInput);
      mappingDiv.appendChild(takesNumberLabel);

      keyMappingsDiv.appendChild(mappingDiv);
    }
  },

  renderOutput: function() {
    const interval = 10;
    const rows = new Map();
    const header = new Set();
    let maxBucket = 0;
    for (const point of this.eventData) {
      let bucket = Math.floor(point.currentTime / interval) * interval;
      maxBucket = Math.max(bucket, maxBucket);
      let row = rows.get(bucket);
      if (row == null) {
        row = new Map();
      }

      let cell = row.get(point.key);
      if (cell == null) {
        cell = "";
      }
      cell += point.key;
      row.set(point.key, cell);

      header.add(point.key);
      rows.set(bucket, row);
    }

    const output = [];
    output.push(["time"].concat(Array.from(header.values())).join(","));
    for (let curBucket = 0; curBucket <= maxBucket; curBucket += interval) {
      let row = rows.get(curBucket);
      if (row == null) {
        row = new Map();
      }
      output.push(
        [curBucket]
          .concat(
            Array.from(header.values()).map(cell =>
              row.has(cell) ? row.get(cell) : ""
            )
          )
          .join(",")
      );
    }
    this.outputCsv.innerHTML = output.join("\n");
  }
};
