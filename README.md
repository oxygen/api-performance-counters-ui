# api-performance-counters-ui
UI to render the data format of jsonrpc-bidirectional/Plugins/Server/PerformanceCounters.js

It looks like this:

![Preview](res/preview.png?raw=true "Preview")

## Installation:

```shell
npm i api-performance-counters-ui
```

(and, if you don't have a build system):
```html
<!-- NEVER serve static content directly from node_modules! Just illustrating the file paths here. -->
<script src="/node_modules/google-palette/palette.js"></script>

<script src="/node_modules/chart.js/dist/Chart.bundle.min.js"></script>
<script src="/node_modules/chartjs-plugin-datalabels/dist/chartjs-plugin-datalabels.min.js"></script>

<script src="/node_modules/api-performance-counters-ui/dist/browser/api-performance-counters-ui.js"></script>

<script>
	// The APIPerformanceCharts class is available globally on the window object.
	new APIPerformanceCharts();
</script>

`google-palette` is optional wether using a build system or not.
When using a build system it can be excluded from the build (Webpack externals) and all will work fine without it.
```


## Usage

See [APIPerformanceCharts.js](./src/APIPerformanceCharts.js) for public methods, usage and customizable defaults (like translations).

```JavaScript
// If not already on window, import or require.
const APIPerformanceCharts = require("api-performance-counters-ui").APIPerformanceCharts;


const apiPerformanceCharts = new APIPerformanceCharts(navigator.language);

document.body.appendChild(apiPerformanceCharts.table);


setInterval(
	async() => {
		const objAPIPerformanceCounters = await yourAPIClient.rpc("rpc.performanceCounters", []);

		apiPerformanceCharts.update(objAPIPerformanceCounters);
	}, 
	30 * 1000
);


// When the table isn't needed anymore, call the destructor to remove event listeners, references and remove the HTMLTable element from the DOM.
apiPerformanceCharts.destroy();
```
