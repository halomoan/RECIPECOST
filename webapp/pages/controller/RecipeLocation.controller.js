sap.ui.define([
	"halo/sap/mm/RECIPECOST/controller/BaseController",
	'sap/ui/model/json/JSONModel',
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/core/message/Message",
	"sap/ui/core/library"
], function(BaseController, JSONModel, MessageBox, MessageToast, Message, library) {
	"use strict";

	var _oBundle;
	// shortcut for sap.ui.core.ValueState
	var ValueState = library.ValueState;

	// shortcut for sap.ui.core.MessageType
	var MessageType = library.MessageType;

	return BaseController.extend("halo.sap.mm.RECIPECOST.pages.controller.RecipeLocation", {

			_formFragments: {},
			onInit: function() {
				var oViewData = {
					"Mode": ""
				};
				var oFormData = {
					"Werks": "",
					"Locid": "",
					"Text": "",
					"v": {
						"Werks": "None",
						"Locid": "None",
						"Text": "None"
					}
				};
				var oView = this.getView();

				var oViewModel = new JSONModel(oViewData);
				this.setModel(oViewModel, "viewData");
				var oFormModel = new JSONModel(oFormData);
				oFormModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
				this.setModel(oFormModel, "form");

				// set message model
				var oMessageManager = sap.ui.getCore().getMessageManager();
				oView.setModel(oMessageManager.getMessageModel(), "message");
				oMessageManager.registerObject(oView, true);

				var fnTableRowAction = this.onTableRowAction.bind(this);

				this.getOwnerComponent().getModel().metadataLoaded().then(function() {
					_oBundle = this.getResourceBundle();
					var oTable = this.byId("table");
					var oTemplate = new sap.ui.table.RowAction({
						items: [
							new sap.ui.table.RowActionItem({
								type: "Delete",
								text: "Delete",
								press: fnTableRowAction
							}),
							new sap.ui.table.RowActionItem({
								icon: "sap-icon://edit",
								text: "Edit",
								press: fnTableRowAction
							})
						]
					});
					oTable.setRowActionTemplate(oTemplate);
					oTable.setRowActionCount(2);
				}.bind(this));

				this.PurchOrgID = "C103";
				this.PlantID = "PPHS";
		},

		onNew: function() {
				var oFormModel = this.getModel("form");
				var oFormData = {
					"Werks": "",
					"Locid": "",
					"Text": "",
					"v": {
						"Werks": "None",
						"Locid": "None",
						"Text": "None"
					}
				};

				oFormModel.setProperty("/", oFormData);

				var oViewModel = this.getModel("viewData");
				oViewModel.setProperty("/Mode", "New");
		},

		

		onSave: function() {
			var oModel = this.getModel();
			
			
			var oFormModel = this.getModel("form"),
				oFormData = oFormModel.getData();

			if (this._validateForm(oFormData)) {
				var oData = {
					"Werks": this.PlantID,
					"Locid": oFormData.Locid,
					"Text": oFormData.Text
				};

				if (oFormData.Locid === "") {
					oModel.create("/LocationSet", oData, {
						method: "POST",
						success: function(data) {
							MessageToast.show("Location Successfully Created");
						},
						error: function(e) {
							MessageToast.show("Error Detected");
						}
					});
				} else {
					oModel.update("/LocationSet(Werks='" + this.PlantID + "',Locid='" + oFormData.Locid + "')", oData,null,
					function(){
						MessageToast.show("Location Successfully Edited");
					},
					function(){
							MessageToast.show("Error Detected");
					});
				}
			}

		},

		_validateForm: function(oFormData) {

			var oMessage;
			var status = true;

			sap.ui.getCore().getMessageManager().removeAllMessages();

			if (oFormData.Text.length < 5) {
				status = false;
				oMessage = new Message({
					message: "Empty Is not allowed. Minimum 5 characters",
					type: MessageType.Error,
					target: "/Text",
					processor: this.getView().getModel("form")
				});
				sap.ui.getCore().getMessageManager().addMessages(oMessage);
			}

			return status;
		},

		onTableRowAction: function(oEvent) {

			var oRow = oEvent.getParameter("row");
			var oItem = oEvent.getParameter("item");

			if (oItem.getText() === "Edit") {
				var oFormModel = this.getModel("form"),
					oFormData = oFormModel.getData();
				var oData = oRow.getBindingContext().getObject();
				oFormData.Werks = oData.Werks;
				oFormData.Locid = oData.Locid;
				oFormData.Text = oData.Text;

				oFormModel.setProperty("/", oFormData);

				var oViewModel = this.getModel("viewData");
				oViewModel.setProperty("/Mode", "Edit");

			} else {
				var oViewModel = this.getModel("viewData");
				oViewModel.setProperty("/Mode", "Delete");
			}

			//MessageToast.show("Item " + (oItem.getText() || oItem.getType()) + " pressed for product with id " +
			//	this.getView().getModel().getProperty("Locid", oRow.getBindingContext()));
		},

		onMessagePopoverPress: function(oEvent) {
			var oSource = oEvent.getSource();

			this.showPopOverFragment(this.getView(), oSource, this._formFragments, "halo.sap.mm.RECIPECOST.fragments.MessagePopover", this);
		},

		onExit: function() {
			this.removeFragment(this._formFragments);
		}

	});

});