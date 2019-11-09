sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel"
], function (Controller, MessageToast, JSONModel) {
	"use strict";
	var pressDialog;
	var msg;
	var accessToken;

	return Controller.extend("com.sap.MFA.controller.Home", {
		onInit: function () {
			debugger;
			//Issue a new SMS Code
		this.issueCode();
		this.launchDialog();
		},
		pressDialog: null,
		onNewCode: function(oEvent){
			this.issueCode();
		},
		
		issueCode: function () {
			
			//Get Access Token
			var clientId = "XXXXXXXXXX";
			var clientSecret = "XXXXXXXXXXXXXXXX";
			var url3 = "/a365_dest/oauth/token"
			
			debugger;
			$.ajax({
				url: url3 + "?grant_type=client_credentials",
				type: "POST",
				contentType: "application/json",
				dataType: "json",
				async: false,
				beforeSend: function (xhr) {
					xhr.setRequestHeader("Authorization", "Basic " + btoa(clientId + ":" + clientSecret));
				},
				success: function (response) {
					accessToken = response.access_token;
				}

			});

			//Send SMS Code
			var a365URL = "/a365_dest/tokens/generate";
			var smsdata = {
				"accountId": 238,
				"telephoneNumber": "XXXXXXXX7512",
				"secondaryKey": "",
				"messageBody": "Hi, your token is [token]",
				"characterSet": "",
				"tokenLength": 4,
				"pinType": 1,
				"timeOut": 180
			};

			$.ajax({
				url: a365URL,
				type: "POST",
				beforeSend: function (xhr) {
					xhr.setRequestHeader("Authorization", "Bearer " + accessToken);
				},
				data: JSON.stringify(smsdata),
				async: false,
				contentType: "application/json",
				dataType: "json",
				success: function (data) {
					try {
						debugger;
					} catch (err) {
						MessageToast.show("Caught - [ajax error] :" + err.message);
					}
				},
				error: function (request, status, error) {
					MessageToast.show("Caught - [ajax error] :" + request.responseText);
				}
			});
		},

		launchDialog: function () {
			pressDialog = this.getView().byId("ListDialog");
			if (!pressDialog) {
				pressDialog = sap.ui.xmlfragment("com.sap.MFA.view/DialogFrag", this);
				pressDialog.setModel(this.getView().getModel());
				pressDialog.open();
			}
		},

		onAuthenticate: function (oEvent) {
// Validate the code
			var oView = this.getView();
			var pdfurl = $.sap.getModulePath("com.sap.MFA", "/paystubs.pdf");
			var validateURL = "/a365_dest/tokens/validate";
			var pincode = {
				"accountId": 238,
				"telephoneNumber": "XXXXXX512",
				"oneTimePassword": sap.ui.getCore().byId("pin").getValue()
			}

			$.ajax({
				url: validateURL,
				type: "POST",
				data: JSON.stringify(pincode),
				async: false,
				beforeSend: function (xhr) {
					xhr.setRequestHeader("Authorization", "Bearer " + accessToken);
				},
				contentType: "application/json",
				dataType: "json",
				success: function (data) {
					try {
						oView.byId("pdf").setSource(pdfurl);
						msg = 'Code validated successfully';
					} catch (err) {
						MessageToast.show("Caught - [ajax error] :" + err.message);
					}
				},
				error: function (request, status, error) {
					MessageToast.show("Caught - [ajax error] :" + request.responseText);
				}
			});

			MessageToast.show(msg);
			pressDialog.close();
			pressDialog.destroy();
		},
		onClose: function () {
			pressDialog.close();
			pressDialog.destroy();
		},
		onExit: function () {
			if (pressDialog) {
				pressDialog.destroy();
			}
		}
	});
});