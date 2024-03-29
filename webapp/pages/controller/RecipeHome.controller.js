sap.ui.define([
	"halo/sap/mm/RECIPECOST/controller/BaseController",
	'sap/ui/model/json/JSONModel',
	"sap/m/MessageBox",
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	'sap/ui/model/Sorter',
	"sap/m/MenuItem"
], function(BaseController,JSONModel,MessageBox,Filter,FilterOperator,Sorter,MenuItem) {
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
			
			
			var oPlantList = this.getView().byId("cboPlant");
			oPlantList.bindAggregation("items", {
				path: "/PlantSet",
				 filters :  [
				 	new Filter({ path : 'Ekorg', operator : 'NE', value1 : ''})
		        ],
				sorter: new Sorter({
					path: 'Name',
					descending: true
				}),
				template: new sap.ui.core.ListItem({
					text: "{Name}",
					key: "{Werks}",
					additionalText: "{Werks}"
				}),
				events : {
					dataReceived: function(){
						
						//var aItems = oPlantList.getItems();
						//oPlantList.setSelectedItem(aItems[0]);
						//oPlantList.fireSelectionChange(oPlantList.getSelectedItem()) ;
					}
				}
			});
			
		
			
			this._oRouter.getRoute("recipehome").attachPatternMatched(this.__onRouteMatched, this);
			
		},
		
		__onRouteMatched: function(oEvent){
			
			this._updateChart1();
			// this.getOwnerComponent().getModel().metadataLoaded().then(function() {
			// }.bind(this));
			
			var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			var oPlant = oStorage.get("Plant");
			
			if(oPlant) {
			
				this.PurchOrgID = oPlant.Ekorg;
				this.PlantID = oPlant.Werks;
				var oPlantList = this.getView().byId("cboPlant");
				
				oPlantList.setSelectedKey(this.PlantID);
				
				oPlantList.fireSelectionChange(oPlantList.getSelectedItem()) ;
			}
			
		},
		
		onMenuAction: function(oEvent) {
				var oItem = oEvent.getParameter("item"),
					//sText = oItem.getText();
					iIdx = oItem.getParent().indexOfItem(oItem);
					
					
				
				switch(iIdx){
					case 0: this.onGoToRecipe(); break;
					case 1: this.onGotoLoc(); break;
					case 2: this.onGotoGroup(); break;
					case 3: this.onGotoUOM(); break;
				}
				
		},
		onGoToRecipe: function(){
			
			if (this.PurchOrgID === ""){
				MessageBox.error(_oBundle.getText("msgErrMissingPurchOrg"), {
					styleClass: "sapUiSizeCompact"
				});
			} else {
				//this._oRouter.navTo("recipes", {Ekorg: this.PurchOrgID, Werks: this.PlantID}); 	
				this._oRouter.navTo("recipegrouptiles", {Ekorg: this.PurchOrgID, Werks: this.PlantID}); 	
			}
		},
		
		onGotoLoc: function(){
			
			if (this.PlantID === ""){
				MessageBox.error(_oBundle.getText("msgErrSelectPlant"), {
					styleClass: "sapUiSizeCompact"
				});
			} else {
				this._oRouter.navTo("recipeloc", {Werks: this.PlantID}); 	
			}
		},
		onGotoGroup: function(){
			if (this.PlantID === ""){
				MessageBox.error(_oBundle.getText("msgErrSelectPlant"), {
					styleClass: "sapUiSizeCompact"
				});
			} else {
				this._oRouter.navTo("recipegroup", {Werks: this.PlantID}); 	
			}
		},
		
		onGotoUOM: function(){
			if (this.PlantID === ""){
				MessageBox.error(_oBundle.getText("msgErrSelectPlant"), {
					styleClass: "sapUiSizeCompact"
				});
			} else {
				this._oRouter.navTo("uomconversion", {Ekorg: this.PurchOrgID, Werks: this.PlantID}); 	
			}
		},
		_updateChart1: function(){
			var oChart = this.byId("recipebygroup");
			var oBinding = oChart.getBinding("bars");
			if (oBinding && this.oFilterWerks){
				oBinding.filter([this.oFilterWerks]);
			}
		},
	
		onPlantChange: function(oEvent){
			
			
			var oViewModel = this.getModel("viewData");
			var oSource = oEvent.getSource();
			
			var oItem = oSource.getSelectedItem();
			
			var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			var oPlant;
			if (oItem) {
				oPlant = oItem.getBindingContext().getObject();
				oStorage.put("Plant", oPlant);
			} else {
				oPlant = oStorage.get("Plant");
			}
			
			
			if (!oPlant) return;
			
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