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
		
		toggleFullScreen: function(){
			 if (this._fullScreen) {
				  this._closeFullScreen();
				  this._fullScreen = false;
			  } else {
				  this._openFullScreen();
				  this._fullScreen = true;
			  }
			  var sIcon = (this._fullScreen ? "sap-icon://exit-full-screen" : "sap-icon://full-screen");
			  
			  var oFullScreen = this.byId("btnFullScreen");
			  
			  oFullScreen.setIcon(sIcon);
		},
		
		 _openFullScreen: function() {
		  var s2Controller = this.oApplicationFacade.getApplicationModel("sharedData").getData().s2Controller;
		  var masterPage = s2Controller.byId("page").getParent().getParent().$();
		  masterPage.css({
		  display: "none"
		  });
		},

		
		onExit: function() {
		}

	});

});