sap.ui.define([
	"halo/sap/mm/RECIPECOST/controller/BaseController",
	'sap/ui/model/json/JSONModel'
], function(BaseController,JSONModel) {
	"use strict";

	return BaseController.extend("halo.sap.mm.RECIPECOST.pages.controller.RptSellPrice", {

	
		onInit: function() {
			var oViewData = {
				"SPR": [1,100]
			};
			
			var oViewModel = new JSONModel(oViewData);
			this.setModel(oViewModel, "viewData");	
			
			this._oRouter = this.getRouter();
			this._oRouter.getRoute("rptsellprice").attachPatternMatched(this.__onRouteMatched, this);
		},
		
		onRun: function(oEvent){
			
			var oViewModel = this.getModel("viewData");
			
			var P = oViewModel.getProperty("/SPR");
			
			if (this.oPlant.Ekorg && this.oPlant.Werks){
				this._oRouter.navTo("recipes", {Ekorg: this.oPlant.Ekorg, Werks: this.oPlant.Werks, FilterType: "RptSellPrice" , P1: P[0], P2: P[1] }); 	
			}
			
			
		
			
		},
		
		__onRouteMatched: function(oEvent) {
			this.oPlant = this.getLocalStore("Plant");
			
			if (! this.oPlant ) {
				this.getOwnerComponent().plantDialog.open(this.getView());
			} else {
				var oViewModel = this.getModel("viewData");
				oViewModel.setProperty("/PlantID",this.oPlant.Werks);
				oViewModel.setProperty("/PlantName",this.oPlant.Name);
			}
		
		}

		

	});

});