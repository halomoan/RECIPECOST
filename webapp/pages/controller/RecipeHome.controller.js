sap.ui.define([
	"halo/sap/mm/RECIPECOST/controller/BaseController",
	'sap/ui/model/json/JSONModel'
], function(BaseController,JSONModel) {
	"use strict";

	return BaseController.extend("halo.sap.mm.RECIPECOST.pages.controller.RecipeHome", {

		
		onInit: function() {
			
			var oViewData = {
				"PlantID": ""
			};
			var oViewModel = new JSONModel(oViewData);
			this.setModel(oViewModel, "viewData");
			this._oRouter =  this.getRouter();
		},
		
		onGoToRecipe: function(){
			
			var oPlant = this.byId("cboPlant");
			
			
			this._oRouter.navTo("recipes"); 	
		},
	
		onExit: function() {
		
		}

	});

});