sap.ui.define([
	"halo/sap/mm/RECIPECOST/controller/BaseController",
	'sap/ui/model/json/JSONModel',
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/core/message/Message",
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	"sap/ui/core/library"
], function(BaseController, JSONModel, MessageBox, MessageToast, Message, Filter, FilterOperator,library) {
	"use strict";

	var _oBundle;
	var MessageType = library.MessageType;
	
	return BaseController.extend("halo.sap.mm.RECIPECOST.pages.controller.UOMConversion", {

	
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
					var oTable = this.byId("loctbl");
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
				this._oRouter.getRoute("recipecookuom").attachPatternMatched(this.__onRouteMatched, this);
				
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
			var oThis = this;
			
			var oFormModel = this.getModel("form"),
				oFormData = oFormModel.getData();

			if (this._validateForm(oFormData)) {
				var oData = {
					"Werks": this.PlantID,
					"Msehi": oFormData.Msehi,
					"Text": oFormData.Text
				};

				if (oFormData.LocationID === "") {
					oModel.create("/CookingUnitSet", oData, {
						method: "POST",
						success: function(data) {
							oThis._initForm();
							MessageToast.show(_oBundle.getText("msgUnitCodeCreated"));
						},
						error: function(e) {
							MessageToast.show("Error Detected");
						}
					});
				} else {
					oModel.update("/CookingUnitSet(Werks='" + this.PlantID + "',Msehi='" + oFormData.Msehi + "')", oData,null,
					function(){
						oThis._initForm();
						MessageToast.show(_oBundle.getText("msgUnitCodeUpdated"));
					},
					function(e){
						var oMessage= JSON.parse(e.responseText).error.message.value;
    					MessageBox.error(oMessage);
					});
				}
			}

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
				oFormData.LocationID = oData.LocationID;
				oFormData.Text = oData.Text;

				oFormModel.setProperty("/", oFormData);
				oViewModel.setProperty("/Mode", "Edit");

			} else {
				
				var oThis = this;
				oViewModel.setProperty("/Mode", "");
				
				MessageBox.confirm(_oBundle.getText("msgCfrmDelUnitCode"), {
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
			//	this.getView().getModel().getProperty("Locationid", oRow.getBindingContext()));
		},
		
		onMessagePopoverPress: function(oEvent) {
			var oSource = oEvent.getSource();

			this.showPopOverFragment(this.getView(), oSource, this._formFragments, "halo.sap.mm.RECIPECOST.fragments.MessagePopover", this);
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
		
		_deleteData: function(oData){
			var oModel = this.getModel();
			
			oModel.remove("/CookingUnitSet(Werks='" + this.PlantID + "',Msehi='" + oData.Msehi + "')",{
				method: "DELETE",
				success: function(data){
					MessageToast.show(_oBundle.getText("msgUnitCodeDeleted"));
				},
				error: function(e){
					var oMessage= JSON.parse(e.responseText).error.message.value;
    				MessageBox.error(oMessage);
					
				}
			});
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
			var oTable = this.byId("uomtbl");
			var oBinding = oTable.getBinding("rows");
			
			if (oBinding) {
				oBinding.filter([this.oFilterPlant],sap.ui.model.FilterType.Application);
			}
		},
		
		_initForm: function(){
			var oFormModel = this.getModel("form");
			
			var oFormData = {
					"Werks": "",
					"Msehi": "",
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

	
		onExit: function() {
		
		}

	});

});