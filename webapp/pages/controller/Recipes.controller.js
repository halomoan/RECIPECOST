sap.ui.define([
	"halo/sap/mm/RECIPECOST/controller/BaseController",
	'sap/ui/model/json/JSONModel',
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/core/message/Message",
	"sap/ui/core/library",
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator'
	
], function(BaseController,JSONModel,MessageBox,MessageToast,Message,library,Filter,FilterOperator) {
	"use strict";
	var _oBundle;
	// shortcut for sap.ui.core.ValueState
	var ValueState = library.ValueState;

	// shortcut for sap.ui.core.MessageType
	var MessageType = library.MessageType;
	return BaseController.extend("halo.sap.mm.RECIPECOST.pages.controller.Recipes", {

		_formFragments: {},
		
		onInit: function() {
			
			var oView = this.getView();
	
			var oFormData = {
				"Name" : "",
				"LocationID": "",
				"Produced": 1.0
			};
			
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
			
			
			this.PurchOrgID = "C103";
			this.PlantID = "PPHS";
		},
		
		onAddRecipe: function(){
			
			
			
			this.showFormDialogFragment(this.getView(), this._formFragments, "halo.sap.mm.RECIPECOST.fragments.RecipeForm", this);
			
			// Filter Location List
			var oLocList  = this.getView().byId("location");
			var oLocBinding = oLocList.getBinding("items");
			oLocBinding.filter([new Filter("Werks", FilterOperator.EQ, this.PlantID)], "Application");
			

		},
		onSaveRecipe: function(){
			var oFormData = this.getView().getModel("form").getData();
			var oThis = this;
			
			
			if (this._validateRecipe(oFormData)) {
				
				MessageBox.confirm(_oBundle.getText("msgCfrmSaveRecipe"), {
						actions: ["Save", MessageBox.Action.CANCEL],
						emphasizedAction: "CANCEL",
						onClose: function(sAction) {
							if (sAction === 'Save') {
								
								oThis._saveRecipe(oFormData);
								oThis.byId("addRecipeDialog").close();
							} else {
								oThis.byId("addRecipeDialog").close();
							}
						}
						
				});
				
			} else {
				MessageToast.show(_oBundle.getText("msgErrFormError"));
			}
		},
		
		onMessagePopoverPress : function (oEvent) {
			var oSource = oEvent.getSource();
			
			this.showPopOverFragment(this.getView(), oSource, this._formFragments, "halo.sap.mm.RECIPECOST.fragments.MessagePopover", this );         
		},
		
		onSelectImage: function(oEvent){
			var oSource = oEvent.getSource();
			var oParent = oSource.getParent();
			var sPath = oParent.getBindingContext().getPath();
		
			this.showPopOverFragment(this.getView(), oSource, this._formFragments, "halo.sap.mm.RECIPECOST.fragments.ImageUploadPopover", this ); 
			
		
			this.byId("ImagePopover").bindElement({path: sPath});
		
		},
		
		onImgUploaderClose: function(){
			var oPopOver = this.getFragmentByName(this._formFragments,"halo.sap.mm.RECIPECOST.fragments.ImageUploadPopover");
			oPopOver.close();
		},
		_saveRecipe: function(oFormData){
			var oModel = this.getModel();
			var oData = {
				"Werks" : this.PlantID,
				"Name": oFormData.Name,
				"LocationID": oFormData.LocationID,
				"Produced": "" + oFormData.Produced
				

			};

			oModel.create("/RecipeSet", oData, {
				method: "POST",
				success: function(data) {
					MessageToast.show("Recipe Successfully Created");
				},
				error: function(e) {
					MessageToast.show("Error Detected");
				}
			});

		},
		_validateRecipe: function(oFormData){
		
			var oMessage;
			var status = true;
		
			
			sap.ui.getCore().getMessageManager().removeAllMessages();
			
			if (oFormData.Name.length < 5) {
					status = false;
					oMessage = new Message({
					message: "Empty Is not allowed. Minimum 5 characters",
					type: MessageType.Error,
					target: "/Name",
					processor: this.getView().getModel("form")
				});
				sap.ui.getCore().getMessageManager().addMessages(oMessage);
			}
			
			if (oFormData.LocationID.length < 1) {
				status = false;
				
				oMessage = new Message({
					message: "Empty Is not allowed",
					type: MessageType.Error,
					target: "/LocationID",
					processor: this.getView().getModel("form")
				});
				sap.ui.getCore().getMessageManager().addMessages(oMessage);
			}
			
			
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