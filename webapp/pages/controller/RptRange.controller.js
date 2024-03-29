sap.ui.define([
	"halo/sap/mm/RECIPECOST/controller/BaseController",
	'sap/ui/model/json/JSONModel'
], function(BaseController,JSONModel) {
	"use strict";

	return BaseController.extend("halo.sap.mm.RECIPECOST.pages.controller.RptRange", {

	
		onInit: function() {
			var oViewData = {
				"SPR": [1,100]
			};
			
			var oViewModel = new JSONModel(oViewData);
			this.setModel(oViewModel, "viewData");	
			
			this._oRouter = this.getRouter();
			this._oRouter.getRoute("rptrange").attachPatternMatched(this.__onRouteMatched, this);
		},
		
		onRun: function(oEvent){
			
			var oViewModel = this.getModel("viewData");
			if (!this.oPlant){
				this.oPlant = this.getLocalStore("Plant");
			}
			
			var P = oViewModel.getProperty("/SPR");
			
			var oCboReport = this.byId("cboReport"); 
			var reportKey = oCboReport.getSelectedKey();
			
			if (reportKey.length > 0) {
				oCboReport.setValueState("None");
				if (this.oPlant.Ekorg && this.oPlant.Werks){
					this._oRouter.navTo("rptoutbartable", {Ekorg: this.oPlant.Ekorg, Werks: this.oPlant.Werks, FilterType: reportKey , P1: P[0], P2: P[1] }); 	
				}
			} else {
				oCboReport.setValueState("Error");
				oCboReport.setValueStateText("Please select an item");
			}
			
			
		
			
		},
		
		__onRouteMatched: function(oEvent) {
			this.oPlant = this.getLocalStore("Plant");
			
			if (! this.oPlant ) {
				this.getOwnerComponent().plantDialog.open(this.getView(),this,this._callback);
				
			} else {
				var oViewModel = this.getModel("viewData");
				oViewModel.setProperty("/PlantID",this.oPlant.Werks);
				oViewModel.setProperty("/PlantName",this.oPlant.Name);
			}
		},
		
		_callback: function(oThis){
			var oPlant = oThis.getLocalStore("Plant");
			var oViewModel = oThis.getModel("viewData");
				oViewModel.setProperty("/PlantID",oPlant.Werks);
				oViewModel.setProperty("/PlantName",oPlant.Name);
		}
		

		

	});

});