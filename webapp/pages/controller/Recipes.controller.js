sap.ui.define([
	"halo/sap/mm/RECIPECOST/controller/BaseController",
	'sap/ui/model/json/JSONModel',
	"sap/m/MessageBox",
	"sap/m/MessageToast"
	
], function(BaseController,JSONModel,MessageBox,MessageToast) {
	"use strict";
	var _oBundle;
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
			
			this.setModel(new JSONModel(oFormData), "form");
				
				
			this.getOwnerComponent().getModel().metadataLoaded().then(function() {
				_oBundle = this.getResourceBundle();
			}.bind(this));
		},
		
		onAddRecipe: function(){
			this.showFormDialogFragment(this.getView(), this._formFragments, "halo.sap.mm.RECIPECOST.fragments.RecipeForm", this);

		},
		onSaveRecipe: function(){
			var oFormData = this.getView().getModel("form").getData();
			
			
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
				
			}
		},
		
		_validateRecipe: function(oFormData){
			var oFormModel = this.getModel("form");
			var status = true;
			if (!oFormData.MainName || oFormData.MainName.length < 1){
				oFormModel.setProperty("/v/MainName","Error");
				status = false;
			} else {
				oFormModel.setProperty("/v/MainName","None");
			}
			
			if (!oFormData.LocationID || oFormData.LocationID.length < 1){
				oFormModel.setProperty("/v/LocationID","Error");
				status = false;
			} else {
				oFormModel.setProperty("/v/LocationID","None");
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