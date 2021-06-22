sap.ui.define([
	"halo/sap/mm/RECIPECOST/controller/BaseController"
], function(BaseController) {
	"use strict";

	return BaseController.extend("halo.sap.mm.RECIPECOST.controller.App", {
		onInit: function() {
			
		},
		
		onSideMenuSelect: function(oEvent){
			var oItem = oEvent.getParameter("item"),
				oCtx = oItem.getBindingContext(),
				//sMenu = oItem.getText(),
				sTarget = oItem.getTarget();
				
		
			var oRouter = this.getRouter();
			
			
				
			switch(sTarget){
				case "G001:RECIPES":			
					oRouter.navTo("recipes"); break;
				case "G001:LOCATION":
					oRouter.navTo("recipeloc"); break;
				case "G001:RECIPEFORM":			
					oRouter.navTo("ingredientform"); break;
				default:
					oRouter.navTo("notFound");break;
			}
		},
	});
});