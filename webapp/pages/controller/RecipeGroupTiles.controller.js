sap.ui.define([
	"halo/sap/mm/RECIPECOST/controller/BaseController",
	'sap/ui/model/json/JSONModel',
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	'sap/ui/model/Sorter',
	"halo/sap/mm/RECIPECOST/model/formatter"
], function(BaseController, JSONModel, Filter, FilterOperator, Sorter, formatter) {
	"use strict";

	var _oBundle;
	return BaseController.extend("halo.sap.mm.RECIPECOST.pages.controller.RecipeGroupTiles", {

		formatter: formatter,

		onInit: function() {
			var oViewData = {
				"Search": ""
			};

			var oViewModel = new JSONModel(oViewData);
			this.setModel(oViewModel, "viewData");

			_oBundle = this.getResourceBundle();
			this._oRouter = this.getRouter();
			this._oRouter.getRoute("recipegrouptiles").attachPatternMatched(this.__onRouteMatched, this);
		},

		onLiveSearch: function(oEvent) {
			var sNewValue = oEvent.getParameter("value");
			var oGridList = this.byId("repicegroupGrid");
			if (oGridList) {

				var oBinding = oGridList.getBinding("items");
				var oFilter = new Filter("Label", FilterOperator.Contains, sNewValue);
					
				oBinding.filter([oFilter]);
				// var oUnitGridBindingInfo = oGridList.getBindingInfo("items");
				// oUnitGridBindingInfo.filters = [this.oFilterStatID, this.oFilterWerks,oFilter];
				// oGridList.bindItems(oUnitGridBindingInfo);

			}
		},
		onGotoRecipes: function(GroupID){
			//console.log(GroupID);
			this._oRouter.navTo("recipes", {Ekorg: this.PurchOrgID, Werks: this.PlantID, GroupID: GroupID}); 		
		},
		onNavBack: function(){
			this.navBack();	
		},
		__onRouteMatched: function(oEvent) {

			var oArguments = oEvent.getParameter("arguments");
			this.PurchOrgID = oArguments.Ekorg;
			this.PlantID = oArguments.Werks;

			this.oFilterStatID = new Filter("StatID", FilterOperator.EQ, "RecipeByGroup");
			this.oFilterWerks = new Filter("Werks", FilterOperator.EQ, this.PlantID);

			this._getTiles();
			// this.getOwnerComponent().getModel().metadataLoaded().then(function() {
			// }.bind(this));
		},

		_getTiles: function() {
			var oGridList = this.byId("repicegroupGrid");
			if (oGridList) {

				var oUnitGridBindingInfo = oGridList.getBindingInfo("items");

				if (!oUnitGridBindingInfo.parameters) {
					oUnitGridBindingInfo.parameters = {};
				} else {
					oUnitGridBindingInfo.parameters.custom = {};
				}

				//oUnitGridBindingInfo.parameters.custom.at = formatter.yyyyMMdd(oDate);

				oUnitGridBindingInfo.filters = [this.oFilterStatID, this.oFilterWerks];
				//oUnitGridBindingInfo.sorter = this.aSort;

				oGridList.bindItems(oUnitGridBindingInfo);

			}
		},
		onExit: function() {

		}

	});

});