sap.ui.define([
	"halo/sap/mm/RECIPECOST/controller/BaseController",
	'sap/ui/model/json/JSONModel',
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/core/message/Message",
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	"sap/ui/core/library"
], function(BaseController, JSONModel, MessageBox, MessageToast, Message, Filter,FilterOperator, library) {
	"use strict";

	var _oBundle;
	// shortcut for sap.ui.core.ValueState
	var ValueState = library.ValueState;

	// shortcut for sap.ui.core.MessageType
	var MessageType = library.MessageType;

	return BaseController.extend("halo.sap.mm.RECIPECOST.pages.controller.RecipeGroup", {

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
				var oTable = this.byId("grptbl");
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

			this.PlantID = "";
				
			this._oRouter = this.getRouter();
			this._oRouter.getRoute("recipegroup").attachPatternMatched(this.__onRouteMatched, this);
		},
		
		__onRouteMatched: function(oEvent){
			var oArguments = oEvent.getParameter("arguments");
			this.PlantID = oArguments.Werks;
			this.oFilterPlant = new Filter("Werks", FilterOperator.EQ, this.PlantID); // Filter Plant
		
			this.getView().bindElement({
				path: "/PlantSet('" + this.PlantID + "')"
			});
			
			this._refreshTable();
		},
		_refreshTable: function(){
			var oTable = this.byId("grptbl");
			var oBinding = oTable.getBinding("rows");
			
			if (oBinding) {
				oBinding.filter([this.oFilterPlant],sap.ui.model.FilterType.Application);
			}
		},
		onNavBack: function(){
			this.navBack();	
		},
		
		onNew: function() {
			this._initForm();

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
					"Groupid": oFormData.Groupid,
					"Text": oFormData.Text
				};

				if (oFormData.Groupid === "") {
					oModel.create("/RecipeGroupSet", oData, {
						method: "POST",
						success: function(data) {
							this._initForm();
							MessageToast.show("Group Successfully Created");
						}.bind(this),
						error: function(e) {
							MessageToast.show("Error Detected");
						}
					});
				} else {
					oModel.update("/RecipeGroupSet(Werks='" + this.PlantID + "',Groupid='" + oFormData.Groupid + "')", oData, null,
						function() {
							this._initForm();
							MessageToast.show("Group Successfully Edited");
						}.bind(this),
						function(e) {
							var oMessage = JSON.parse(e.responseText).error.message.value;
							MessageBox.error(oMessage);
						});
				}
			}

		},

		_initForm: function() {
			var oFormModel = this.getModel("form");

			var oFormData = {
				"Werks": "",
				"Groupid": "",
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
		_validateForm: function(oFormData) {

			var oMessage;
			var status = true;

			sap.ui.getCore().getMessageManager().removeAllMessages();

			if (oFormData.Text.length < 1) {
				status = false;
				oMessage = new Message({
					message: "Empty Is not allowed.",
					type: MessageType.Error,
					target: "/Text",
					processor: this.getView().getModel("form")
				});
				sap.ui.getCore().getMessageManager().addMessages(oMessage);
			}

			return status;
		},
		_deleteData: function(oData) {
			var oModel = this.getModel();

			oModel.remove("/RecipeGroupSet(Werks='" + this.PlantID + "',Groupid='" + oData.Groupid + "')", {
				method: "DELETE",
				success: function(data) {
					MessageToast.show("Group Successfully Deleted");
				},
				error: function(e) {
					var oMessage = JSON.parse(e.responseText).error.message.value;
					MessageBox.error(oMessage);

				}
			});
		},
		onTableRowAction: function(oEvent) {

			var oRow = oEvent.getParameter("row");
			var oData = oRow.getBindingContext().getObject();
			var oItem = oEvent.getParameter("item");
			var oViewModel = this.getModel("viewData");

			if (oItem.getText() === "Edit") {
				var oFormModel = this.getModel("form"),
					oFormData = oFormModel.getData();

				oFormData.Werks = oData.Werks;
				oFormData.Groupid = oData.Groupid;
				oFormData.Text = oData.Text;

				oFormModel.setProperty("/", oFormData);
				oViewModel.setProperty("/Mode", "Edit");

			} else {

				var oThis = this;
				oViewModel.setProperty("/Mode", "");

				MessageBox.confirm(_oBundle.getText("msgCfrmDelLocation"), {
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

		onExit: function() {
			this.removeFragment(this._formFragments);
		}

	});

});