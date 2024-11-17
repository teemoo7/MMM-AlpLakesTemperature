const NodeHelper = require("node_helper");
const request = require("request");
const Log = require("logger");

const apiAlplakesBaseUrl = "https://alplakes-api.eawag.ch/simulations";
const averageTemperaturePath = "/layer/average_temperature/delft3d-flow";
const pointPath = "/point/delft3d-flow";

module.exports = NodeHelper.create({


	start: function() {
		Log.log("Starting node helper for: " + this.name);
	},

	socketNotificationReceived: function(notification, payload) {
		if (notification === "GET_TEMPERATURE_REQUEST") {
			this.config = payload;
			this.getLiveTemperature();
		}
	},

	getLiveTemperature: function() {
		let now = new Date();
		let threeHoursAgo = new Date(now.getTime() - (1000 * 60 * 60 * 3));
		let isAverageTemperature = this.config.latitude === undefined || this.config.longitude === undefined;
		let url;
		if (isAverageTemperature) {
			url = apiAlplakesBaseUrl + averageTemperaturePath + "/" + this.config.lake + "/" + this.getDateTime(threeHoursAgo) + "/" + this.getDateTime(now) + "/" + this.config.depth;
		} else {
			url = apiAlplakesBaseUrl + pointPath + "/" + this.config.lake + "/" + this.getDateTime(threeHoursAgo) + "/" + this.getDateTime(now) + "/" + this.config.depth + "/" + this.config.latitude + "/" + this.config.longitude;
		}

		let self = this;

		request(url, { json: true }, (error, response, body) => {
			if (error) {
				let errorMessage = `${self.name}: Alplakes API request failed: ${error.message}`;
				Log.error(errorMessage);
				this.sendSocketNotification("GET_TEMPERATURE_ERROR", error.message);
			} else if (response.statusCode === 200) {
				let temperature = self.getTemperatureValueFromJson(body, isAverageTemperature);
				this.sendSocketNotification("GET_TEMPERATURE_RESULT", temperature);
			} else if (response.statusCode === 400) {
				let errorMessage = `${self.name}: Alplakes API returned a validation error: ${response.statusCode}`;
				Log.error(errorMessage + " - " + body.detail);
				this.sendSocketNotification("GET_TEMPERATURE_ERROR", errorMessage);
			} else {
				let errorMessage = `${self.name}: Alplakes API returned an error: ${response.statusCode}`;
				Log.error(errorMessage + " - " + JSON.stringify(body));
				this.sendSocketNotification("GET_TEMPERATURE_ERROR", errorMessage);
			}
		});

	},

	getTemperatureValueFromJson: function(jsonBody, isAverageTemperature) {
		if (isAverageTemperature) {
			return Math.round(jsonBody.variable.data[0]);
		} else {
			return Math.round(jsonBody.variables.temperature.data[0]);
		}
	},

	getDateTime: function(date) {
		let year = "" + date.getFullYear();
		let month = "" + (date.getMonth() + 1);
		let day = "" + date.getDate();
		let hours = "" + date.getHours();
		let minutes = "" + date.getMinutes();
		return year + this.pad(month) + this.pad(day) + this.pad(hours) + this.pad(minutes);
	},

	pad: function(value) {
		if (value.length < 2) {
			return "0" + value;
		}
		return value;
	}
});
