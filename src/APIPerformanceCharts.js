const palette = require("google-palette");
const Chart = require("chart.js");
const ChartDataLabelsPlugin = require("chartjs-plugin-datalabels");


if(typeof window !== "undefined")
{
	//Chart.defaults.global.defaultFontColor = this.fontColor;
	//Chart.defaults.global.defaultFontSize = 24;
}


class APIPerformanceCharts
{
	/**
	 * If strLanguage is not set, it will default to navigator.language if a translation exists, otherwise "en" (English).
	 * 
	 * @param {string|undefined} strLanguage = undefined
	 */
	constructor(strLanguage = undefined)
	{
		this._strLanguageCode = strLanguage || navigator.language;


		// Defaults to dark mode background.
		this._strFontColor = "#ffffff";

		// For mobile you should use half (8).
		this._nFontSize = 16;


		this._elDivContainer = document.createElement("div");


		// For destroy.
		this._arrDisposeCalls = [];
		
		// For destroy or clear.
		this._arrDisposeCallsCharts = [];

		this._arrIgnoredFunctionNames = [
			"rpc.performanceCounters",
			"sql_performance_counters"
		];


		this._arrColorsCache = [];

		this._arrHorizontalBarChartNames = ["callsCount", "callTimeTotal", "callTimeAverage", "callsCountErrors", "callTimeTotalErrors", "callTimeAverageErrors"];

		this._initCharts();
	}


	/**
	 * Removes events listeners, removes the table from its parent node and sets various stuff to null.
	 */
	destroy()
	{
		if(!this._arrDisposeCalls)
		{
			return;
		}

		this.clear();

		this._arrDisposeCalls.map(fnDispose => { fnDispose(); });
		this._arrDisposeCalls.splice(0);
		this._arrDisposeCalls = null;

		if(this._elDivContainer.parentNode)
		{
			this._elDivContainer.parentNode.removeChild(this._elDivContainer);
		}
	}


	/**
	 * Clear all charts to free up resources.
	 */
	clear()
	{
		this._arrDisposeCallsCharts.map(fnDispose => { fnDispose(); });
		this._arrDisposeCallsCharts.splice(0);

		for(const strChartName of this._arrHorizontalBarChartNames)
		{
			if(this._objChartResources[strChartName].chart)
			{
				try
				{
					this._objChartResources[strChartName].chart.destroy();
					this._objChartResources[strChartName].chart = null;
				}
				catch(error)
				{
					console.error(error);
				}
			}
		}
	}



	/**
	 * @returns {HTMLDivElement}
	 */
	get container()
	{
		return this._elDivContainer;
	}


	/**
	 * @returns {Object.<string, translation: string>}
	 */
	get texts()
	{
		if(APIPerformanceCharts.texts[this._strLanguageCode || navigator.language])
		{
			return APIPerformanceCharts.texts[this._strLanguageCode || navigator.language];
		}

		return APIPerformanceCharts.texts["en"];
	}


	/**
	 * @returns {number}
	 */
	get fontSize()
	{
		return this._nFontSize;
	}


	/**
	 * @param {number} nFontSize
	 */
	set fontSize(nFontSize)
	{
		this._nFontSize = nFontSize;
	}


	/**
	 * @returns {string}
	 */
	get fontColor()
	{
		return this._strFontColor;
	}


	/**
	 * @param {string} strFontColor
	 */
	set fontColor(strFontColor)
	{
		this._strFontColor = strFontColor;
	}


	/**
	 * @returns {string[]}
	 */
	get ignoredFunctionNames()
	{
		return this._arrIgnoredFunctionNames;
	}


	/**
	 * @param {string[]} arrIgnoredFunctionNames
	 */
	set ignoredFunctionNames(arrIgnoredFunctionNames)
	{
		this._arrIgnoredFunctionNames.splice(0);
		this._arrIgnoredFunctionNames.push(...arrIgnoredFunctionNames);
	}


	/**
	 * @param {Object<functionName:string, metrics:{successCount: number, errorCount: number, successMillisecondsTotal: number, errorMillisecondsTotal: number, successMillisecondsAverage: number, errorMillisecondsAverage: number}>} objPerformanceCounters
	 * @param {boolean} bClearExisting = false
	 * @param {boolean} bAnimations = false
	 */
	update(objPerformanceCounters, bClearExisting = false, bAnimations = false)
	{
		if(bClearExisting)
		{
			this.clear();
		}


		const objPerformanceCountersParsed = {
			callsCount: [], 
			callTimeTotal: [], 
			callTimeAverage: [],
			callsCountErrors: [], 
			callTimeTotalErrors: [], 
			callTimeAverageErrors: []
		};

		for(const strFunctionName in objPerformanceCounters.metrics)
		{
			if(this._arrIgnoredFunctionNames.includes(strFunctionName))
			{
				continue;
			}

			let strLabel;

			// if(strFunctionName.endsWith("_search"))
			// {
			// 	strLabel = "search functions";
			// }
			// else if(strFunctionName.endsWith("_edit"))
			// {
			// 	strLabel = "update functions";
			// }
			// else
			// {
			// 	strLabel = "others";
			// }
			
			strLabel = "";

			if(objPerformanceCounters.metrics[strFunctionName].successCount)
			{
				objPerformanceCountersParsed.callsCount.push({y: objPerformanceCounters.metrics[strFunctionName].successCount, x: strFunctionName, label: strLabel});
			}
			
			if(objPerformanceCounters.metrics[strFunctionName].errorCount)
			{
				objPerformanceCountersParsed.callsCountErrors.push({y: objPerformanceCounters.metrics[strFunctionName].errorCount, x: strFunctionName, label: strLabel});
			}

			if(objPerformanceCounters.metrics[strFunctionName].successMillisecondsTotal >= 1000)
			{
				objPerformanceCountersParsed.callTimeTotal.push({y: Math.round(objPerformanceCounters.metrics[strFunctionName].successMillisecondsTotal / 1000, 0), x: strFunctionName, label: strLabel});
			}

			if(objPerformanceCounters.metrics[strFunctionName].errorMillisecondsTotal)
			{
				objPerformanceCountersParsed.callTimeTotalErrors.push({y: Math.round(objPerformanceCounters.metrics[strFunctionName].errorMillisecondsTotal, 0), x: strFunctionName, label: strLabel});
			}

			if(objPerformanceCounters.metrics[strFunctionName].successMillisecondsAverage)
			{
				objPerformanceCountersParsed.callTimeAverage.push({y: objPerformanceCounters.metrics[strFunctionName].successMillisecondsAverage, x: strFunctionName, label: strLabel});
			}

			if(objPerformanceCounters.metrics[strFunctionName].errorMillisecondsAverage)
			{
				objPerformanceCountersParsed.callTimeAverageErrors.push({y: objPerformanceCounters.metrics[strFunctionName].errorMillisecondsAverage, x: strFunctionName, label: strLabel});
			}
		}

		for(const strChartName in objPerformanceCountersParsed)
		{
			this.updateChart(strChartName, objPerformanceCountersParsed[strChartName], bAnimations);
		}
	}


	/**
	 * @param {string} strChartName 
	 * @param {[{y: number, x: number, label: string}]} arrRows 
	 * @param {boolean} bAnimations = false
	 */
	updateChart(strChartName, arrRows, bAnimations = false)
	{
		const arrDatasets = [];

		const objDatasetLabelToData = {};
		const arrXAxis = [];
		const arrDatasetLabels = [];

		// let yMax = 0;

		for(const objRow of arrRows)
		{
			if(!objDatasetLabelToData[objRow.label])
			{
				objDatasetLabelToData[objRow.label] = [];
				arrDatasetLabels.push(objRow.label);
			}

			if(!arrXAxis.includes(objRow.x))
			{
				arrXAxis.push(objRow.x);
			}
		}
		arrXAxis.sort();

		for(const {} of arrXAxis)
		{
			for(const strLabel in objDatasetLabelToData)
			{
				objDatasetLabelToData[strLabel].push(null);
			}
		}

		for(const objRow of arrRows)
		{
			objDatasetLabelToData[objRow.label][arrXAxis.indexOf(objRow.x)] = objRow.y;
		}


		const arrColors = this.makeColors(arrRows.length);


		if(Object.values(objDatasetLabelToData).length === 1)
		//if(arrDatasets.length === 1)
		//if(strChartType === "horizontalBar")
		{
			const mapColors = new Map();
			let nColorIndexForMap = -1;
			for(let strX of arrXAxis)
			{
				// const arrParts = strX.split(":");
				// if(arrParts.length === 2 && arrParts[1] === "CustomMarker")
				// {
				// 	strX = arrParts[0];
				// }

				if(mapColors.has(strX))
				{
					continue;
				}

				mapColors.set(String(strX), arrColors[++nColorIndexForMap]);
			}


			arrColors.splice(0);
			for(let strX of arrXAxis)
			{
				// const arrParts = strX.split(":");
				// if(arrParts.length === 2 && arrParts[1] === "CustomMarker")
				// {
				// 	strX = arrParts[0];
				// }

				arrColors.push(mapColors.get(String(strX)));
			}
		}

		
		for(const strDatasetLabel in objDatasetLabelToData)
		{
			const arrDatasetColors = [];
			/*if(
				arrXAxis.length 
				&& (
					(
						typeof arrXAxis[0] === "string" 
						&& arrXAxis[0].match(/^[0-9]{4}\-[0-9]{2}\-[0-9]{2}/)
					)
					|| (
						typeof arrXAxis[0] === "object"
						&& arrXAxis[0] instanceof Date
					)
				)
			)
			{
				arrDatasetColors.push(`#${arrColors[arrDatasets.length]}`);
			}
			else*/ if(arrDatasetLabels.length === 1)
			{
				arrDatasetColors.push(...arrColors.map((strColor) => { return "#" + strColor; }));
			}
			else
			{
				arrDatasetColors.push(`#${arrColors[arrDatasets.length]}`);
			}

			arrDatasets.push({
				// The measurement unit of the y axis value.
				label: strDatasetLabel,
				data: objDatasetLabelToData[strDatasetLabel],

				fill: false,
				backgroundColor: arrDatasetColors.length === 1 ? arrDatasetColors[0] : arrDatasetColors, 
				borderColor: arrDatasetColors.length === 1 ? arrDatasetColors[0] : arrDatasetColors
			});

			// yMax = Math.max(yMax, ...objDatasetLabelToData[strDatasetLabel]);
		}

		// Padding to allow text to the right of the bar.
		// yMax *= 1.5;
		// console.log(yMax);

		if(this._objChartResources[strChartName].chart)
		{
			this._objChartResources[strChartName].chart.destroy();
			this._objChartResources[strChartName].chart = null;
			this._objChartResources[strChartName].elCanvas.removeAttribute("style");
			this._objChartResources[strChartName].elCanvas.removeAttribute("class");
			this._objChartResources[strChartName].elCanvas = document.createElement("canvas");
			this._objChartResources[strChartName].elDivContainer.innerHTML = "";
			this._objChartResources[strChartName].elDivContainer.appendChild(this._objChartResources[strChartName].elCanvas);
		}


		let strChartType = "bar";
		if(arrDatasets.length === 1)
		{
			strChartType = "horizontalBar";
		}
		if(arrXAxis.length * arrDatasetLabels.length > 200)
		{
			strChartType = "line";
		}

		
		if(this._arrHorizontalBarChartNames.includes(strChartName))
		{
			strChartType = "horizontalBar";
		}


		const fnAxisLabelCallback = ((label, index, labels) => {
			// if(typeof label === "string")
			// {
			// 	const arrParts = label.split(":");
			// 	if(arrParts.length === 2 && arrParts[1] === "CustomMarker")
			// 	{
			// 		return arrParts[0];
			// 	}

			// 	if(label.match(/^[0-9]{4}\-[0-9]{2}\-[0-9]{2}$/))
			// 	{
			// 		const date = new Date(`${label}T00:00:00.000Z`);

			// 		if(date.getTime() >= nUnixMillisecondsLast7DaysStart && date.getTime() <= nUnixMillisecondsLast7DaysEnd)
			// 		{
			// 			return date.toLocaleDateString("en-US", {timeZone: "UTC", weekday: "long"});
			// 		}
			// 		else if(date.getTime() >= nUnixMillisecondsTodayStart && date.getTime() <= nUnixMillisecondsTodayEnd)
			// 		{
			// 			return "today";
			// 		}
			// 		else if(date.getTime() >= nUnixMillisecondsLast365DaysStart)
			// 		{
			// 			return date.toLocaleDateString("en-US", {timeZone: "UTC", day: "numeric", month: "short"});
			// 		}
			// 	}
			// }

			return label;
		}).bind(this);

		const nDataLabelsFontSize = 13;

		const objOptions = {
			maintainAspectRatio: false,
			//responsive: true,

			legend: {
				labels: {
					fontColor: this.fontColor,
					fontSize: this.fontSize
				}
			},
			scales: {
				yAxes: [{
					ticks: {
						beginAtZero: true,
						autoSkip: false,
						fontSize: this.fontSize,
						fontColor: this.fontColor,
						callback: fnAxisLabelCallback
						// max: yMax,
						// suggestedMax: yMax
					}
				}],
				xAxes: [{
					ticks: {
						beginAtZero: true,
						autoSkip: false,
						fontSize: this.fontSize,
						fontColor: this.fontColor,
						callback: fnAxisLabelCallback
					}
				}]
			},
			/*layout: {
				padding: {
					left: 0,
					right: 100,
					top: 0,
					bottom: 0
				}
			},*/
			plugins: {
				datalabels: {
					offset: 0, 
					clip: false,
					anchor: ((context) => {
						return context.dataset.data[context.dataIndex] >= 0 ? "end" : "start";
					}).bind(this),
					color: ((context) => {
						if(strChartType !== "horizontalBar")
						{
							if(strChartType === "bar")
							{
								if(context.chart.width / arrDatasets.length / context.dataset.data.length < nDataLabelsFontSize * String(context.dataset.data[context.dataIndex]).length * 1.1)
								{
									return this.fontColor;
								}
							}
							else
							{
								return this.fontColor;
							}
						}

						const nColorLight = parseInt(arrColors[context.dataIndex].substr(0, 2), 16) + parseInt(arrColors[context.dataIndex].substr(2, 2), 16) + parseInt(arrColors[context.dataIndex].substr(4, 2), 16);
						return Math.abs(context.dataset.data[context.dataIndex] / Math.max(0.00000001, Math.abs(context.dataset.data[context.dataIndex] >= 0 ? context.chart.boxes[2].max : context.chart.boxes[2].min))) > 0.5 ? (nColorLight > 120 * 3 ? "#000000" : "#ffffff") : this.fontColor;
					}).bind(this),
					"font.size": nDataLabelsFontSize,
					align: ((context) => {
						const bGreaterThanHalf = Math.abs(context.dataset.data[context.dataIndex] / Math.max(0.00000001, Math.abs(context.dataset.data[context.dataIndex] >= 0 ? context.chart.boxes[2].max : context.chart.boxes[2].min))) > 0.5;
						if(strChartType === "horizontalBar")
						{
							if(context.dataset.data[context.dataIndex] < 0)
							{
								return bGreaterThanHalf ? "right" : "left";
							}
							
							return bGreaterThanHalf ? "left" : "right";
						}

						if(context.dataset.data[context.dataIndex] < 0)
						{
							return bGreaterThanHalf ? "top" : "bottom";
						}

						return bGreaterThanHalf ? "bottom" : "top";
					}).bind(this),
					formatter: ((value, context) => {
						if(this._objChartNameToValueUnits[strChartName])
						{
							if(String(value) === "1")
							{
								return String(value) + " " + this._objChartNameToValueUnitsSingular[strChartName];
							}

							return String(value) + " " + this._objChartNameToValueUnits[strChartName];
						}

						// if(String(arrXAxis[context.dataIndex]).endsWith(":Outbound"))
						// {
						// 	return String(value) + " outbound";
						// }

						// if(String(arrXAxis[context.dataIndex]).endsWith(":Interrupted"))
						// {
						// 	return String(value) + " i";
						// }

						return value;
					}).bind(this)
				}
			}
		};

		if(!bAnimations)
		{
			objOptions.animation = false;
		}


		if(strChartType === "horizontalBar")
		{
			this._objChartResources[strChartName].elCanvas.style.height = (arrRows.length * 30 + /*legend*/ (isMobile() ? 20 : 40) * 2) + "px";
		}
		else
		{
			this._objChartResources[strChartName].elCanvas.style.height = (/*bar height aprox. */ 8 * 40 + /*top legend aprox.*/ parseInt(arrDatasets.length / (isMobile() ? 7 : 3.5) * 40 + (isMobile() ? 20 : 40)) + /*bottom legend*/ (isMobile() ? 20 : 40)) + "px";
		}


		// eslint-disable-next-line no-undef
		this._objChartResources[strChartName].chart = new Chart(
			this._objChartResources[strChartName].elCanvas, 
			{
				type: strChartType,
				data: {
					// The x axis values/labels/dates.
					labels: arrXAxis,

					datasets: arrDatasets
				},
				options: objOptions
			}
		);
	}


	/**
	 * @param {number} nColorsCount = 500
	 */
	makeColors(nColorsCount = 500)
	{
		if(this._arrColorsCache.length >= nColorsCount)
		{
			return this._arrColorsCache.slice(0, nColorsCount);
		}


		const arrColors = [];
		
		// Maybe google-palette isn't loaded on the page (if not using a build system and the google-palette browser version is not loaded).
		if(palette)
		{
			while(arrColors.length < arrRows.length)
			{
				arrColors.push(...palette("mpn65", Math.min(65, arrRows.length - arrColors.length)));
			}
		}
		else
		{
			while(arrColors.length < arrRows.length)
			{
				arrColors.push(["ff0029","377eb8","66a61e","984ea3","00d2d5","ff7f00","af8d00","7f80cd","b3e900","c42e60","a65628","f781bf","8dd3c7","bebada","fb8072","80b1d3","fdb462","fccde5","bc80bd","ffed6f","c4eaff","cf8c00","1b9e77","d95f02","e7298a","e6ab02","a6761d","0097ff","00d067","000000","252525","525252","737373","969696","bdbdbd","f43600","4ba93b","5779bb","927acc","97ee3f","bf3947","9f5b00","f48758","8caed6","f2b94f","eff26e","e43872","d9b100","9d7a00","698cff","d9d9d9","00d27e","d06800","009f82","c49200","cbe8ff","fecddf","c27eb6","8cd2ce","c4b8d9","f883b0","a49100","f48800","27d0df","a04a9b","ff0029","377eb8","66a61e","984ea3","00d2d5","ff7f00","af8d00","7f80cd","b3e900","c42e60","a65628","f781bf","8dd3c7","bebada","fb8072","80b1d3","fdb462","fccde5","bc80bd","ffed6f","c4eaff","cf8c00","1b9e77","d95f02","e7298a","e6ab02","a6761d","0097ff","00d067","000000","252525","525252","737373","969696","bdbdbd","f43600","4ba93b","5779bb","927acc","97ee3f","bf3947","9f5b00","f48758","8caed6","f2b94f","eff26e","e43872","d9b100","9d7a00","698cff","d9d9d9","00d27e","d06800","009f82","c49200","cbe8ff","fecddf","c27eb6","8cd2ce","c4b8d9","f883b0","a49100","f48800","27d0df","a04a9b","ff0029","377eb8","66a61e","984ea3","00d2d5","ff7f00","af8d00","7f80cd","b3e900","c42e60","a65628","f781bf","8dd3c7","bebada","fb8072","80b1d3","fdb462","fccde5","bc80bd","ffed6f","c4eaff","cf8c00","1b9e77","d95f02","e7298a","e6ab02","a6761d","0097ff","00d067","000000","252525","525252","737373","969696","bdbdbd","f43600","4ba93b","5779bb","927acc","97ee3f","bf3947","9f5b00","f48758","8caed6","f2b94f","eff26e","e43872","d9b100","9d7a00","698cff","d9d9d9","00d27e","d06800","009f82","c49200","cbe8ff","fecddf","c27eb6","8cd2ce","c4b8d9","f883b0","a49100","f48800","27d0df","a04a9b","ff0029","377eb8","66a61e","984ea3","00d2d5","ff7f00","af8d00","7f80cd","b3e900","c42e60","a65628","f781bf","8dd3c7","bebada","fb8072","80b1d3","fdb462","fccde5","bc80bd","ffed6f","c4eaff","cf8c00","1b9e77","d95f02","e7298a","e6ab02","a6761d","0097ff","00d067","000000","252525","525252","737373","969696","bdbdbd","f43600","4ba93b","5779bb","927acc","97ee3f","bf3947","9f5b00","f48758","8caed6","f2b94f","eff26e","e43872","d9b100","9d7a00","698cff","d9d9d9","00d27e","d06800","009f82","c49200","cbe8ff","fecddf","c27eb6","8cd2ce","c4b8d9","f883b0","a49100","f48800","27d0df","a04a9b","ff0029","377eb8","66a61e","984ea3","00d2d5","ff7f00","af8d00","7f80cd","b3e900","c42e60","a65628","f781bf","8dd3c7","bebada","fb8072","80b1d3","fdb462","fccde5","bc80bd","ffed6f","c4eaff","cf8c00","1b9e77","d95f02","e7298a","e6ab02","a6761d","0097ff","00d067","000000","252525","525252","737373","969696","bdbdbd","f43600","4ba93b","5779bb","927acc","97ee3f","bf3947","9f5b00","f48758","8caed6","f2b94f","eff26e","e43872","d9b100","9d7a00","698cff","d9d9d9","00d27e","d06800","009f82","c49200","cbe8ff","fecddf","c27eb6","8cd2ce","c4b8d9","f883b0","a49100","f48800","27d0df","a04a9b","ff0029","377eb8","66a61e","984ea3","00d2d5","ff7f00","af8d00","7f80cd","b3e900","c42e60","a65628","f781bf","8dd3c7","bebada","fb8072","80b1d3","fdb462","fccde5","bc80bd","ffed6f","c4eaff","cf8c00","1b9e77","d95f02","e7298a","e6ab02","a6761d","0097ff","00d067","000000","252525","525252","737373","969696","bdbdbd","f43600","4ba93b","5779bb","927acc","97ee3f","bf3947","9f5b00","f48758","8caed6","f2b94f","eff26e","e43872","d9b100","9d7a00","698cff","d9d9d9","00d27e","d06800","009f82","c49200","cbe8ff","fecddf","c27eb6","8cd2ce","c4b8d9","f883b0","a49100","f48800","27d0df","a04a9b","ff0029","377eb8","66a61e","984ea3","00d2d5","ff7f00","af8d00","7f80cd","b3e900","c42e60","a65628","f781bf","8dd3c7","bebada","fb8072","80b1d3","fdb462","fccde5","bc80bd","ffed6f","c4eaff","cf8c00","1b9e77","d95f02","e7298a","e6ab02","a6761d","0097ff","00d067","000000","252525","525252","737373","969696","bdbdbd","f43600","4ba93b","5779bb","927acc","97ee3f","bf3947","9f5b00","f48758","8caed6","f2b94f","eff26e","e43872","d9b100","9d7a00","698cff","d9d9d9","00d27e","d06800","009f82","c49200","cbe8ff","fecddf","c27eb6","8cd2ce","c4b8d9","f883b0","a49100","f48800","27d0df","a04a9b","ff0029","377eb8","66a61e","984ea3","00d2d5","ff7f00","af8d00","7f80cd","b3e900","c42e60","a65628","f781bf","8dd3c7","bebada","fb8072","80b1d3","fdb462","fccde5","bc80bd","ffed6f","c4eaff","cf8c00","1b9e77","d95f02","e7298a","e6ab02","a6761d","0097ff","00d067","000000","252525","525252","737373","969696","bdbdbd","f43600","4ba93b","5779bb","927acc","97ee3f","bf3947","9f5b00","f48758","8caed6","f2b94f"].slice(0, arrRows.length - arrColors.length));
			}
		}
		for(let i = 0; i < arrColors.length; i++)
		{
			if(parseInt(arrColors[i].substr(0, 2), 16) + parseInt(arrColors[i].substr(2, 2), 16) + parseInt(arrColors[i].substr(4, 2), 16) < 99)
			{
				arrColors[i] = `${(255 - parseInt(arrColors[i].substr(0, 2), 16)).toString(16)}${(255 - parseInt(arrColors[i].substr(2, 2), 16)).toString(16)}${(255 - parseInt(arrColors[i].substr(4, 2), 16)).toString(16)}`;
			}
		}


		this._arrColorsCache = arrColors;
		return arrColors;
	}


	_initCharts()
	{
		this._objChartNameToValueUnits = {
			callsCount: this.texts.calls, 
			callTimeTotal: this.texts.seconds, 
			callTimeAverage: this.texts.milliseconds,
			
			callsCountErrors: this.texts.calls, 
			callTimeTotalErrors: this.texts.seconds, 
			callTimeAverageErrors: this.texts.milliseconds
		};
		this._objChartNameToValueUnitsSingular = {
			callsCount: this.texts.call, 
			callTimeTotal: this.texts.second, 
			callTimeAverage: this.texts.millisecond,
			
			callsCountErrors: this.texts.call, 
			callTimeTotalErrors: this.texts.second, 
			callTimeAverageErrors: this.texts.millisecond
		};


		this._objChartResources = {};
		let bFirstChart = true;
		for(const strChartName of this._arrHorizontalBarChartNames)
		{
			this._objChartResources[strChartName] = {
				elDivContainer: document.createElement("div"), 
				elCanvas: document.createElement("canvas"), 
				elH4Title: document.createElement("h4"), 
				chart: null
			};
			this._objChartResources[strChartName].elDivContainer.appendChild(this._objChartResources[strChartName].elCanvas);
			
			this._arrDisposeCalls.push(() => {
				if(this._objChartResources[strChartName].chart)
				{
					this._objChartResources[strChartName].chart.destroy();
					this._objChartResources[strChartName].chart = null;
				}

				if(this._objChartResources[strChartName].elCanvas.parentNode)
				{
					this._objChartResources[strChartName].elCanvas.parentNode.removeChild(this._objChartResources[strChartName].elCanvas);
				}

				this._objChartResources[strChartName].elDivContainer.innerHTML = "";

				delete this._objChartResources[strChartName];
			});

			
			if(bFirstChart)
			{
				this._elDivContainer.appendChild(document.createElement("br"));
				this._elDivContainer.appendChild(document.createElement("br"));
			}
			bFirstChart = false;
			this._elDivContainer.appendChild(this._objChartResources[strChartName].elH4Title);
			this._elDivContainer.appendChild(this._objChartResources[strChartName].elDivContainer);

			this._objChartResources[strChartName].elH4Title.textContent = this.texts[strChartName];
		}
	}
};


// Feel free to add translations after importing the class into your scope.
APIPerformanceCharts.texts = {
	en: {
		callTimeTotal: "Total run time", 
		callTimeAverage: "Average call run time",
		callsCount: "Calls count",
		callTimeTotalErrors: "Errors total run time", 
		callTimeAverageErrors: "Errors average call run time",
		callsCountErrors: "Error calls count",

		call: "call",
		calls: "calls",
		second: "second",
		seconds: "seconds",
		millisecond: "millisecond",
		milliseconds: "milliseconds",
		secondShort: "sec",
		secondsShort: "sec",
		millisecondShort: "ms",
		millisecondsShort: "ms"
	},

	ro: {
		callTimeTotal: "Timp total de rulare", 
		callTimeAverage: "Medie per chemare",
		callsCount: "Număr apeluri",
		callTimeTotalErrors: "Timp total de rulare erori", 
		callTimeAverageErrors: "Medie per eroare",
		callsCountErrors: "Număr erori",

		call: "apel",
		calls: "apeluri",
		second: "secundă",
		seconds: "secunde",
		millisecond: "milisecundă",
		milliseconds: "milisecunde",
		secondShort: "sec",
		secondsShort: "sec",
		millisecondShort: "ms",
		millisecondsShort: "ms"
	}
};


APIPerformanceCharts.texts["ro-RO"] = APIPerformanceCharts.texts.ro;
APIPerformanceCharts.texts["ro-MD"] = APIPerformanceCharts.texts.ro;
APIPerformanceCharts.texts["en-US"] = APIPerformanceCharts.texts.en;
APIPerformanceCharts.texts["en-UK"] = APIPerformanceCharts.texts.en;


module.exports = APIPerformanceCharts;
