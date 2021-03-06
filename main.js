const App = {
  init: function() {
    this.audioPlayer = document.getElementById("audioPlayer");
    this.eventData = [];
    this.lastNumberTakingEvent = null;
    this.numberTakingEvents = new Set();
    this.numbers = new Set("0123456789");
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
    if (this.numbers.has(e.key) && this.lastNumberTakingEvent !== null) {
      this.eventData[this.lastNumberTakingEvent].value = e.key;
    } else {
      if (this.numberTakingEvents.has(e.key)) {
        this.lastNumberTakingEvent = this.eventData.length;
      }
      this.eventData.push({
        currentTime: this.audioPlayer.currentTime,
        key: e.key,
        value: null
      });
    }
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
        if (this.keyMap[i].takesNumber) {
          this.numberTakingEvents.add(this.keyMap[i].key);
        } else {
          this.numberTakingEvents.delete(this.keyMap[i].key);
        }
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
        if (this.keyMap[i].takesNumber) {
          this.numberTakingEvents.add(this.keyMap[i].key);
        } else {
          this.numberTakingEvents.delete(this.keyMap[i].key);
        }
      });
      const takesNumberLabel = document.createElement("label");
      takesNumberLabel.setAttribute("for", "chkNumberInput" + i);
      takesNumberLabel.textContent = "Takes number";
      mappingDiv.appendChild(takesNumberInput);
      mappingDiv.appendChild(takesNumberLabel);

      keyMappingsDiv.appendChild(mappingDiv);
    }
  },

  renderHeader: function(columns) {
    const allColumns = ["time"];
    let mappingIdx = 0;
    for (let column of columns) {
      while (mappingIdx < this.keyMap.length) {
        const mapping = this.keyMap[mappingIdx];
        ++mappingIdx;
        if (column === mapping.key && mapping.label.length > 0) {
          column = mapping.label;
          break;
        }
      }
      allColumns.push(column);
    }
    return allColumns.join(",");
  },

  renderOutput: function() {
    const interval = 10;
    const rows = new Map();
    const header = new Set();
    let maxBucket = 0;

    for (const mapping of this.keyMap) {
      if (mapping.label.length > 0 && mapping.key.length > 0) {
        header.add(mapping.key);
      }
    }

    for (const point of this.eventData) {
      let bucket = Math.floor(point.currentTime / interval) * interval;
      maxBucket = Math.max(bucket, maxBucket);
      let row = rows.get(bucket);
      if (row == null) {
        row = new Map();
      }

      let cell = row.get(point.key);
      if (cell == null) {
        cell = [];
      }
      cell.push(point.value == null ? point.key : point.value);
      row.set(point.key, cell);

      header.add(point.key);
      rows.set(bucket, row);
    }

    const output = [];
    output.push(this.renderHeader(header.values()));
    for (let curBucket = 0; curBucket <= maxBucket; curBucket += interval) {
      let row = rows.get(curBucket);
      if (row == null) {
        row = new Map();
      }
      output.push(
        [curBucket]
          .concat(
            Array.from(header.values()).map(cell =>
              row.has(cell) ? row.get(cell).join(" ") : ""
            )
          )
          .join(",")
      );
    }
    this.outputCsv.innerHTML = output.join("\n");
  }
};
