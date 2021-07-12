sap.ui.define([
	"halo/sap/mm/RECIPECOST/controller/BaseController",
	'sap/ui/model/json/JSONModel',
	"sap/m/MessageBox",
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
], function(BaseController,JSONModel,MessageBox,Filter,FilterOperator) {
	"use strict";

	var _oBundle;
	return BaseController.extend("halo.sap.mm.RECIPECOST.pages.controller.RecipeHome", {

		
		onInit: function() {
			
			this.PlantID = "";
			this.PurchOrgID = "";
			
			var oViewData = {
				"PurchOrg": ""
			};
			var oViewModel = new JSONModel(oViewData);
			this.setModel(oViewModel, "viewData");
			_oBundle = this.getResourceBundle();
			
			this._oRouter =  this.getRouter();
			this._oRouter.getRoute("recipehome").attachPatternMatched(this.__onRouteMatched, this);
			
		},
		
		__onRouteMatched: function(oEvent){
			this.getOwnerComponent().getModel().metadataLoaded().then(function() {
				var oPlant = this.byId("cboPlant");
				var aItems = oPlant.getItems();
				console.log(aItems);
				oPlant.setSelectedItem(aItems[0]);

			}.bind(this));
		},
		onGoToRecipe: function(){
			
			if (this.PurchOrgID === ""){
				MessageBox.error(_oBundle.getText("msgErrMissingPurchOrg"), {
					styleClass: "sapUiSizeCompact"
				});
			} else {
				this._oRouter.navTo("recipes", {Ekorg: this.PurchOrgID, Werks: this.PlantID}); 	
			}
		},
		
		_updateChart1: function(){
			var oChart = this.byId("recipebygroup");
			var oBinding = oChart.getBinding("bars");
			oBinding.filter([this.oFilterWerks]);
		},
		
		onPlantChange: function(oEvent){
			
			var oViewModel = this.getModel("viewData");
			var oSource = oEvent.getSource();
			
			var oItem = oSource.getSelectedItem();
			var oPlant = oItem.getBindingContext().getObject();
			this.PlantID = oPlant.Werks;
			this.PurchOrgID = oPlant.Ekorg;
			oViewModel.setProperty("/PurchOrg",oPlant.Name);
			
			this.oFilterWerks = new Filter("Werks", FilterOperator.EQ, this.PlantID);
			
			this._updateChart1();
		},
	
		onExit: function() {
		
		}

	});

});