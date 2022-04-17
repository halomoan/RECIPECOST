sap.ui.define([
	"halo/sap/mm/RECIPECOST/controller/BaseController"
], function(BaseController) {
	"use strict";

	return BaseController.extend("halo.sap.mm.RECIPECOST.pages.controller.RecipeOverview", {

	
		onInit: function() {
			
			this._fullScreen = false;
			
			
			this._oRouter = this.getRouter();
			this._oRouter.getRoute("recipeoverview").attachPatternMatched(this.__onRouteMatched, this);
		},

		__onRouteMatched: function(oEvent) {
	
				var oArguments = oEvent.getParameter("arguments");
				this.PurchOrgID = oArguments.Ekorg;
				this.PlantID = oArguments.Werks;
				this.RecipeID = oArguments.RecipeID;
				
				this.getView().bindElement("/RecipeSet(Werks='" + this.PlantID + "',RecipeID='" + this.RecipeID + "')");
				
				var oModel = this.getModel();
				
				var oHTCPanel = this.byId("HTCPanel");
				oHTCPanel.destroyContent();
				
				var oHTCHTML = new sap.ui.core.HTML({
					  id: "HTC",
					  preferDOM: true,
					  content: ""
					});
				
				oHTCPanel.addContent(
					 oHTCHTML
				);
			
				
				oModel.read("/RecipeHTCSet(Werks='" + this.PlantID + "',RecipeID='" + this.RecipeID + "',Filename='HTC.txt')/$value", {
					success: function(oData, oResponse) {
						oHTCHTML.setDOMContent(oResponse.body);
					}
				});
					
		},
		
		onClose: function(){
			this.navBack();
		},
		
		 

		
		onExit: function() {
		}

	});

});