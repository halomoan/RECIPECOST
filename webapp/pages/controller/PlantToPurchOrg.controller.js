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

	return BaseController.extend("halo.sap.mm.RECIPECOST.pages.controller.PlantToPurchOrg", {

		_formFragments: {},
		onInit: function() {
			var oViewData = {
				"Mode": ""
			};

			var oView = this.getView();

			var oViewModel = new JSONModel(oViewData);
			this.setModel(oViewModel, "viewData");

			this._initForm();

			// set message model
			var oMessageManager = sap.ui.getCore().getMessageManager();
			oView.setModel(oMessageManager.getMessageModel(), "message");
			oMessageManager.registerObject(oView, true);

			var fnTableRowAction = this.onTableRowAction.bind(this);

			this.getOwnerComponent().getModel().metadataLoaded().then(function() {
				_oBundle = this.getResourceBundle();
				var oTable = this.byId("planttbl");
				var oTemplate = new sap.ui.table.RowAction({
					items: [
						new sap.ui.table.RowActionItem({
							type: "Delete",
							text: "Delete",
							press: fnTableRowAction
						})
					]
				});
				oTable.setRowActionTemplate(oTemplate);
				oTable.setRowActionCount(1);

			}.bind(this));
		},

		_initForm: function() {
			var oFormModel = this.getModel("form");

			var oFormData = {
				"PlantID": "",
				"Ekorg": "",
				"Text": ""
			};

			if (oFormModel) {
				oFormModel.setProperty("/", oFormData);
			} else {
				oFormModel = new JSONModel(oFormData);
				oFormModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
				this.setModel(oFormModel, "form");

			}
		},

		onTableRowAction: function(oEvent) {

			var oRow = oEvent.getParameter("row");
			var oData = oRow.getBindingContext().getObject();
			var oItem = oEvent.getParameter("item");
			var oViewModel = this.getModel("viewData");

			if (oItem.getText() === "Delete") {

				var oThis = this;
				oViewModel.setProperty("/Mode", "");

				MessageBox.confirm(_oBundle.getText("msgCfrmDelPlant"), {
					actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
					emphasizedAction: "CANCEL",
					onClose: function(sAction) {
						if (sAction === 'YES') {

							oThis._deleteData(oData);

						}
					}
				});
			}

			//MessageToast.show("Item " + (oItem.getText() || oItem.getType()) + " pressed for product with id " +
			//	this.getView().getModel().getProperty("Groupid", oRow.getBindingContext()));
		},
		
		onMessagePopoverPress: function(oEvent) {
			var oSource = oEvent.getSource();

			this.showPopOverFragment(this.getView(), oSource, this._formFragments, "halo.sap.mm.RECIPECOST.fragments.MessagePopover", this);
		},
		
		onSave: function(){
			var oModel = this.getModel();

			var oFormModel = this.getModel("form"),
				oFormData = oFormModel.getData();

			if (this._validateForm(oFormData)) {
				
				var oData = {
					"Werks": oFormData.PlantID,
					"Ekorg": oFormData.Ekorg
				};
				
				oModel.create("/PlantSet", oData, {
					method: "POST",
					success: function(data) {
						MessageToast.show(_oBundle.getText("msgInfoPlantCreated"));
					}.bind(this),
					error: function(e) {
						MessageToast.show("Error Detected");
					}
				});
				
			} else {
				MessageToast.show(_oBundle.getText("msgErr"));
			}
			
		},
		
		_deleteData: function(oData){
			var oModel = this.getModel();
			console.log(oData);
			oModel.remove("/PlantSet(Werks='" + oData.Werks + "')", {
				method: "DELETE",
				success: function(data) {
					MessageToast.show(_oBundle.getText("msgSuccessDelete"));
				},
				error: function(e) {
					var oMessage = JSON.parse(e.responseText).error.message.value;
					MessageBox.error(oMessage);

				}
			});
		},
		_validateForm: function(oFormData) {

			var oMessage;
			var status = true;

			sap.ui.getCore().getMessageManager().removeAllMessages();

			if (oFormData.PlantID.length < 1) {
				status = false;
				oMessage = new Message({
					message: "Empty Is not allowed.",
					type: "Error",
					target: "/PlantID",
					processor: this.getView().getModel("form")
				});
				sap.ui.getCore().getMessageManager().addMessages(oMessage);
			}
			
			if (oFormData.Ekorg.length < 1) {
				status = false;
				oMessage = new Message({
					message: "Empty Is not allowed.",
					type: "Error",
					target: "/Ekorg",
					processor: this.getView().getModel("form")
				});
				sap.ui.getCore().getMessageManager().addMessages(oMessage);
			}

			return status;
		},
		onExit: function() {

		}

	});

});