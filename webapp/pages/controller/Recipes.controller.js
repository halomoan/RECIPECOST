sap.ui.define([
	"halo/sap/mm/RECIPECOST/controller/BaseController",
	'sap/ui/model/json/JSONModel',
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/core/message/Message",
	"sap/ui/core/library"
	
], function(BaseController,JSONModel,MessageBox,MessageToast,Message,library) {
	"use strict";
	var _oBundle;
	// shortcut for sap.ui.core.ValueState
	var ValueState = library.ValueState;

	// shortcut for sap.ui.core.MessageType
	var MessageType = library.MessageType;
	return BaseController.extend("halo.sap.mm.RECIPECOST.pages.controller.Recipes", {

		_formFragments: {},
		
		onInit: function() {
			var oFormData = {
				"MainName" : "",
				"LocationID": "",
				"Produced": 1.0,
				"v": {
					"MainName": "None",
					"LocationID": "None",
					"Produced": "None"
				}
			};
			
			var oView = this.getView();
			
			var oFormModel = new JSONModel(oFormData);
			oFormModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
			this.setModel(oFormModel, "form");
			
			
			// set message model
			var oMessageManager = sap.ui.getCore().getMessageManager();
			oView.setModel(oMessageManager.getMessageModel(), "message");
			oMessageManager.registerObject(oView, true);	
				
			this.getOwnerComponent().getModel().metadataLoaded().then(function() {
				_oBundle = this.getResourceBundle();
				
			}.bind(this));
		},
		
		onAddRecipe: function(){
			this.showFormDialogFragment(this.getView(), this._formFragments, "halo.sap.mm.RECIPECOST.fragments.RecipeForm", this);

		},
		onSaveRecipe: function(){
			var oFormData = this.getView().getModel("form").getData();
			sap.ui.getCore().getMessageManager().removeAllMessages();
			
			if (this._validateRecipe(oFormData)) {
				
				
				
				MessageBox.confirm(_oBundle.getText("msgCfrmSaveRecipe"), {
						actions: ["Save", MessageBox.Action.CANCEL],
						emphasizedAction: "CANCEL",
						onClose: function(sAction) {
							
							if (sAction === 'Save') {
								this.byId("addRecipeDialog").close();
							} else {
								this.byId("addRecipeDialog").close();
							}
						},
						
				});
				
			} else {
				MessageToast.show(_oBundle.getText("msgErrFormError"));
			}
		},
		
		onMessagePopoverPress : function (oEvent) {
			var oSource = oEvent.getSource();
			
			
			
			this.showPopOverFragment(this.getView(), oSource, this._formFragments, "halo.sap.mm.RECIPECOST.fragments.MessagePopover", this );         
		},
		
		_validateRecipe: function(oFormData){
		
			var oMessage;
			var status = true;
			var _status = true;
			
			
			if (oFormData.MainName.length < 10) {
				_status = false;
					oMessage = new Message({
					message: "Empty Is not allowed",
					type: MessageType.Error,
					target: "/MainName",
					processor: this.getView().getModel("form")
				});
				sap.ui.getCore().getMessageManager().addMessages(oMessage);
			}
			
			if (oFormData.LocationID.length < 1) {
				_status = false;
				
				oMessage = new Message({
					message: "Empty Is not allowed",
					type: MessageType.Error,
					target: "/LocationID",
					processor: this.getView().getModel("form")
				});
				sap.ui.getCore().getMessageManager().addMessages(oMessage);
			}
			
			status = oFormData.v.MainName !== ValueState.Error && oFormData.v.LocationID !== ValueState.Error &&  _status;
			
			
			
			return status;	
		},
		
	
		onCancelAddRecipe: function(){
			this.byId("addRecipeDialog").close();
		},
		onExit: function() {
		
			this.removeFragment(this._formFragments);
		}

	});

});