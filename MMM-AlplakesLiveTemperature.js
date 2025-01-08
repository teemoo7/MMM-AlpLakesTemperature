Module.register("MMM-AlplakesLiveTemperature", {

	defaults: {
		title: "",
		depth: 1,
		refresh: (60 * 60 * 1000),
		animationSpeed: 2000,
		units: config.units,
	},

	start: function() {
		Log.info(`Starting module: ${this.name}`);
		this.temperature = undefined;
		this.errorMessage = undefined;

		let self = this;
		setInterval(function() {
			self.getLiveTemperature();
		}, this.config.refresh);
		self.getLiveTemperature();
	},

	getStyles: function() {
		return ["font-awesome.css"];
	},

	getScripts: function() {
		return [];
	},

	getDom: function() {
		let wrapper = document.createElement("div");
		wrapper.className = "temperature-wrapper";

		if (this.errorMessage !== undefined) {
			let errorDiv = document.createElement("div");
			errorDiv.className = "error";
			errorDiv.innerHTML = "ERROR: " + this.errorMessage;
			wrapper.appendChild(errorDiv);
		}

		if (this.temperature !== undefined) {
			let symbolSpan = document.createElement("span");
			symbolSpan.className = `fa fa-person-swimming symbol medium`;
			wrapper.appendChild(symbolSpan);
			let nameSpan = document.createElement("span");
			nameSpan.className = "medium";
			nameSpan.innerHTML = "&nbsp;" + this.config.title;
			wrapper.appendChild(nameSpan);

			let temperatureDiv = document.createElement("div");
			temperatureDiv.className = "temperature-value bright large";
			if (this.config.units === "imperial") {
				temperatureDiv.innerHTML = this.temperature.inFahrenheit + "°F";
			} else {
				temperatureDiv.innerHTML = this.temperature.inCelsius + "°C";
			}
			wrapper.appendChild(temperatureDiv);
		}

		return wrapper;
	},

	socketNotificationReceived: function(notification, payload) {
		switch (notification) {
			case "GET_TEMPERATURE_ERROR":
				this.errorMessage = payload;
				this.temperature = undefined;
				this.updateDom(this.config.animationSpeed);
				break;
			case "GET_TEMPERATURE_RESULT":
				this.temperature.inCelsius = payload;
				this.temperature.inFahrenheit = this.convertCelsiusToFahrenheit(payload);
				this.errorMessage = undefined;
				this.updateDom(this.config.animationSpeed);
				break;
		}
	},

	getLiveTemperature: function() {
		this.sendSocketNotification("GET_TEMPERATURE_REQUEST", this.config);
	},

	convertCelsiusToFahrenheit(temperatureIn) {
		return Math.round((temperatureIn * 9 / 5) + 32);
	}
});
