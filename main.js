const App = {
  init: function() {
    this.audioPlayer = document.getElementById("audioPlayer");
    this.eventData = [];
    this.outputCsv = document.getElementById("outputCsv");

    const keyDetector = document.getElementById("keyDetector");
    const songInput = document.getElementById("songInput");

    songInput.addEventListener("change", () => {
      this.audioPlayer.setAttribute(
        "src",
        URL.createObjectURL(songInput.files[0])
      );
    });

    keyDetector.addEventListener("keypress", e => this.onKeyPress(e));
  },

  onKeyPress: function(e) {
    this.eventData.push({
      currentTime: this.audioPlayer.currentTime,
      key: e.key
    });
    e.preventDefault();

    window.requestAnimationFrame(() => this.renderOutput());
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
