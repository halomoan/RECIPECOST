sap.ui.define([
	"halo/sap/mm/RECIPECOST/controller/BaseController",
	'sap/ui/model/json/JSONModel',
	'sap/m/ColumnListItem',
	'sap/m/Token',
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator'
], function(BaseController,JSONModel,ColumnListItem,Token,Filter,FilterOperator) {
	"use strict";
	
	var _oBundle;
	
	return BaseController.extend("halo.sap.mm.RECIPECOST.pages.controller.IngredientForm", {

	
		onInit: function() {
			var oViewModel = new JSONModel({
				"isFullScreen" : false
			
			});
			this.getView().setModel(oViewModel, "viewData");
			
			this.oIngredientModel = new JSONModel(sap.ui.require.toUrl("halo/sap/mm/RECIPECOST/model") + "/ingredient.json");
			this.getView().setModel(this.oIngredientModel, "form");
			
			this.oColModel = new JSONModel(sap.ui.require.toUrl("halo/sap/mm/RECIPECOST/fragments/") + "/VHMaterialColumnsModel.json");
		
			
		
			
			this._oRouter =  this.getRouter();
			this._oRouter.getRoute("ingredientform").attachPatternMatched(this.__onRouteMatched, this);
		},
		
		__onRouteMatched: function(oEvent){
			var oArguments = oEvent.getParameter("arguments");
			this.PurchOrgID = oArguments.Ekorg;
			this.PlantID = oArguments.Werks;
			this.RecipeID = oArguments.RecipeID;
			this.MatType = "FOOD";
			
			this.oFilterPurchOrg = new Filter("Ekorg", FilterOperator.EQ, this.PurchOrgID); // Filter Material Type
			this.oFilterPlant = new Filter("Werks", FilterOperator.EQ, this.PlantID); // Filter Plant
			this.oFilterMatType = new Filter("Mtart", FilterOperator.EQ, this.MatType); // Filter Material Type
			
			this.aFilters = [this.oFilterPurchOrg,this.oFilterPlant,this.oFilterMatType];
			
			this.getView().bindElement("/RecipeSet(Werks='" + this.PlantID + "',RecipeID='" + this.RecipeID + "')");
			
			_oBundle = this.getResourceBundle();
		},
		onNavBack: function(){
			this._oRouter.navTo("recipes");
		},

		onVHMaterialRequested: function(){
			var aCols = this.oColModel.getData().cols;
			
			this._oBasicSearchField = new sap.m.SearchField({
				showSearchButton: false
			});


			this._oValueHelpDialog = sap.ui.xmlfragment("halo.sap.mm.RECIPECOST.fragments.VHMaterial", this);
			this.getView().addDependent(this._oValueHelpDialog);
			
			//this._oValueHelpDialog.setSupportMultiselect(false); 
		
			
			var oFilterBar = this._oValueHelpDialog.getFilterBar();
			oFilterBar.setFilterBarExpanded(false);
			oFilterBar.setBasicSearch(this._oBasicSearchField);
			
			this._oValueHelpDialog.getTableAsync().then(function (oTable) {
				oTable.setModel(this.oColModel, "columns");

				if (oTable.bindRows) {
					oTable.bindAggregation("rows", {
						path: "/PlantMaterialSet",
						filters: this.aFilters
					});
				}

				if (oTable.bindItems) {
					oTable.bindAggregation("items", {
						path: "/PlantMaterialSet",
						filters: this.aFilters
					}, function () {
						return new ColumnListItem({
							cells: aCols.map(function (column) {
								return new sap.m.Label({ text: "{" + column.template + "}"});
							})
						});
					});
				}

				this._oValueHelpDialog.update();
			}.bind(this));
			
			this._oValueHelpDialog.open();
		},
		
		onFilterBarSearch: function (oEvent) {
			
			var sSearchQuery = this._oBasicSearchField.getValue(),
				aSelectionSet = oEvent.getParameter("selectionSet");
			var aFilters = aSelectionSet.reduce(function (aResult, oControl) {
				
				var sType = oControl.getMetadata().getName();
				switch(sType){
					case "sap.m.Switch":
							if (oControl.getState()) {
								aResult.push(new Filter({
									path: oControl.getName(),
									operator: FilterOperator.EQ,
									value1: oControl.getState()
								}));
							}
							
							break;
					case "sap.m.Input" :
							if (oControl.getValue()) {
								aResult.push(new Filter({
									path: oControl.getName(),
									operator: FilterOperator.Contains,
									value1: oControl.getValue()
								}));
							}
							
							break;
					
					case "sap.m.CheckBox" :
							if (oControl.getSelected()) {
								aResult.push(new Filter({
									path: oControl.getName(),
									operator: FilterOperator.EQ,
									value1: true
								}));
							}
							
							break;
				}
				return aResult;
			}, []);
			
		

			if (sSearchQuery) {
			
				aFilters.push(new Filter({
					filters: [
						new Filter({
							path: "Maktx",
							operator: FilterOperator.Contains,
							value1: sSearchQuery
						})
					],
					and: false
				}));
			}
			
			if (aFilters.length > 0) {
				this._filterTable(new Filter({
					filters: aFilters,
					and: true
				}));
			} else {
				this._filterTable([]);
			}
		},
		onValueHelpOkPress: function (oEvent) {
			var oIngredientModel = this.getModel("form"),
				oIngredientData = oIngredientModel.getData().Ingredients;

						
			var aTokens = oEvent.getParameter("tokens");
			
			//console.log(oIngredientData,aTokens);
			
			if (aTokens.length) {	
				
				//remove subtotal
				if (oIngredientData.length > 1){
					oIngredientData.splice(oIngredientData.length - 7,7);				
				}
				for(var i = 0; i < aTokens.length; i++){
					var oObject = aTokens[i].data();
					var oMaterial = oObject.row;
					var bExist = oIngredientData.find(ele => {
						return ele.Matnr === oMaterial.Matnr;
					})
					if (!bExist) {
						oIngredientData.push(oMaterial);
					}
				}
				oIngredientModel.setProperty("/Ingredients",oIngredientData);	
			}
			
			oIngredientData.push({
				"Matnr": null,
				"Maktx": null,
				"TPeinh": null,
				"Bprme" :null,
				"Peinh": null,
				"Netpr":null,
				"Waers":null,
				"TNetpr":null
			});
			
			oIngredientData.push({
				"Matnr": null,
				"Maktx": _oBundle.getText("SubTotal"),
				"TPeinh": null,
				"Bprme" : null,
				"Peinh": null,
				"Netpr": null,
				"Waers": "SGD",
				"TNetpr":"1000.00"
			});
			oIngredientData.push({
				"Matnr": null,
				"Maktx": _oBundle.getText("AddMisc"),
				"TPeinh": null,
				"Bprme" : null,
				"Peinh": null,
				"Netpr": null,
				"Waers": "%",
				"TNetpr":"0.00"
			});
			oIngredientData.push({
				"Matnr": null,
				"Maktx": _oBundle.getText("TotalRecipeCost"),
				"TPeinh": null,
				"Bprme" : null,
				"Peinh": null,
				"Netpr": null,
				"Waers": "SGD",
				"TNetpr":"0.00"
			});
			
			oIngredientData.push({
				"Matnr": null,
				"Maktx": _oBundle.getText("CostPerPortion"),
				"TPeinh": null,
				"Bprme" : null,
				"Peinh": null,
				"Netpr": null,
				"Waers": "SGD",
				"TNetpr":"0.00"
			});
			oIngredientData.push({
				"Matnr": null,
				"Maktx": _oBundle.getText("UnitSellingPrice"),
				"TPeinh": null,
				"Bprme" : null,
				"Peinh": null,
				"Netpr": null,
				"Waers": "SGD",
				"TNetpr":"0.00"
			});
			oIngredientData.push({
				"Matnr": null,
				"Maktx": _oBundle.getText("Cost%PerPortion"),
				"TPeinh": null,
				"Bprme" : null,
				"Peinh": null,
				"Netpr": null,
				"Waers": "% ",
				"TNetpr":"0.00"
			});
			oIngredientModel.setProperty("/Ingredients",oIngredientData);
			
			this._oValueHelpDialog.close();
		},

		onValueHelpCancelPress: function () {
			this._oValueHelpDialog.close();
		},

		onValueHelpAfterClose: function () {
			this._oValueHelpDialog.destroy();
		},
		
		_filterTable: function (oFilter) {
			var oValueHelpDialog = this._oValueHelpDialog;

			oValueHelpDialog.getTableAsync().then(function (oTable) {
				if (oTable.bindRows) {
					oTable.getBinding("rows").filter(oFilter);
				}

				if (oTable.bindItems) {
					oTable.getBinding("items").filter(oFilter);
				}

				oValueHelpDialog.update();
			});
		},
		
		onExit: function() {
			this._oRouter.detachRouteMatched(this.__onRouteMatched, this);
			this._oValueHelpDialog.destroy();
			
		}

	});

});