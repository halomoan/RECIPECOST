sap.ui.define([
	"halo/sap/mm/RECIPECOST/controller/BaseController",
	'sap/ui/model/json/JSONModel',
	'sap/m/ColumnListItem',
	'sap/m/Token',
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	"sap/m/MessageBox",
	"sap/m/MessageToast",
], function(BaseController,JSONModel,ColumnListItem,Token,Filter,FilterOperator,MessageBox,MessageToast) {
	"use strict";
	
	var _oBundle;
	
	return BaseController.extend("halo.sap.mm.RECIPECOST.pages.controller.IngredientForm", {

		_formFragments: {},

		onInit: function() {
			var oViewModel = new JSONModel({
				"isFullScreen" : false,
				"ImagePopUpPos": "Left",
			
			});
			this.getView().setModel(oViewModel, "viewData");
			
			var oIngredientModel = new JSONModel({  
				"Items" : []
				
			});
			this.getView().setModel(oIngredientModel, "Ingredients");
			
			this.aSubTotal = [
				{ "AddMisc": 1.00, "UnitSellPrice" : 20.00},
				{ "AddMisc": 2.00, "UnitSellPrice" : 0.00},
			];
			
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
			var oIngredientModel = this.getModel("Ingredients"),
				oIngredientData = oIngredientModel.getData().Items;

			var aTokens = oEvent.getParameter("tokens");
			
			
			if (aTokens.length) {	
				
				//remove subtotal
				if (oIngredientData.length > 1){
					oIngredientData.splice(oIngredientData.length - 7,7);				
				}
				for(var i = 0; i < aTokens.length; i++){
					var oObject = aTokens[i].data().row;
					var oMaterial = {
						"Matnr": oObject.Matnr,
						"Maktx": oObject.Maktx,
						"Bprme" : oObject.Bprme,
						"Peinh": oObject.Peinh,
						"Netpr": {Curr: oObject.Netpr, Prev1: "0.00"},
						"Waers": oObject.Waers,
						"Ebeln": oObject.Ebeln,
						"TPeinh": null,
						"TNetpr": {Curr: 0.00, Prev1: 0.00},
						"Status": "Success"
					}
					
					var bExist = oIngredientData.find(ele => {
						return ele.Matnr === oMaterial.Matnr;
					})
					
				
					if (!bExist) {
						
						oIngredientData.push(oMaterial);
					}
				}
				console.log(oIngredientData);
			}
			
			oIngredientData.push({
				"ID" : "spacer"
			});
			
			oIngredientData.push({
				"ID" : "readonly",
				"Matnr": null,
				"Maktx": _oBundle.getText("SubTotal"),
				"TPeinh": null,
				"Bprme" : null,
				"Peinh": null,
				"Netpr": null,
				"Waers": "SGD",
				"TNetpr": {Curr: 0.00, Prev1: 0.00}
			});
			
			oIngredientData.push({
				"ID" : "AddMisc",
				"Matnr": null,
				"Maktx": _oBundle.getText("AddMisc"),
				"TPeinh": null,
				"Bprme" : null,
				"Peinh": null,
				"Netpr": null,
				"Waers": "%",
				"TNetpr": 0.00,
				"AddMisc": { Curr: this.aSubTotal[0].AddMisc, Prev1: 0.00 }
			});
			oIngredientData.push({
				"ID" : "readonly",
				"Matnr": null,
				"Maktx": _oBundle.getText("TotalRecipeCost"),
				"TPeinh": null,
				"Bprme" : null,
				"Peinh": null,
				"Netpr": null,
				"Waers": "SGD",
				"TNetpr": {Curr: 0.00, Prev1: 0.00 }
			});
			
			oIngredientData.push({
				"ID" : "readonly",
				"Matnr": null,
				"Maktx": _oBundle.getText("CostPerPortion"),
				"TPeinh": null,
				"Bprme" : null,
				"Peinh": null,
				"Netpr": null,
				"Waers": "SGD",
				"TNetpr": {Curr: 0.00, Prev1: 0.00 }
			});
			oIngredientData.push({
				"ID" : "UnitSellPrice",
				"Matnr": null,
				"Maktx": _oBundle.getText("UnitSellPrice"),
				"TPeinh": null,
				"Bprme" : null,
				"Peinh": null,
				"Netpr": null,
				"Waers": "SGD",
				"TNetpr": null,
				"SellPrice": {Curr: this.aSubTotal[0].UnitSellPrice, Prev1: 0.00 }
			});
			oIngredientData.push({
				"ID" : "readonly",
				"Matnr": null,
				"Maktx": _oBundle.getText("Cost%PerPortion"),
				"TPeinh": null,
				"Bprme" : null,
				"Peinh": null,
				"Netpr": null,
				"Waers": "% ",
				"TNetpr": {Curr: 0.00, Prev1: 0.00 }
			});
			oIngredientModel.setProperty("/Items",oIngredientData);
			
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
		
		onSelectImage: function(oEvent) {
			var oSource = oEvent.getSource();
			var oParent = oSource.getParent();
			var sPath = oParent.getBindingContext().getPath();

			this.showPopOverFragment(this.getView(), oSource, this._formFragments, "halo.sap.mm.RECIPECOST.fragments.ImageUploadPopover", this);

			this.byId("ImagePopover").bindElement({
				path: sPath
			});

		},
		onUploadImage: function() {
			var oUploader = this.byId("ImageUploader");

			var sPath = this.byId("ImagePopover").getBindingContext().getPath();

			sPath = sPath.replace("RecipeSet", "RecipeVersionSet") + "/Photo";


			if (!oUploader.getValue()) {
				MessageToast.show("Choose a file first");
				return;
			}
			
			oUploader.setUploadUrl("/sap/opu/odata/sap/zrecipecost_odata_srv" + sPath);

			oUploader.checkFileReadable().then(function() {
				oUploader.upload();
			}, function(error) {
				MessageToast.show("The file cannot be read. It may have changed.");
			}).then(function() {
				oUploader.clear();
			});
		},
		onImgUploaderClose: function() {
			var oPopOver = this.getFragmentByName(this._formFragments, "halo.sap.mm.RECIPECOST.fragments.ImageUploadPopover");
			oPopOver.close();
		},
		
		onQtyChanged: function(oEvent){
			var oSource = oEvent.getSource();
			
			var iValue = oSource.getValue();
			var sPath = oSource.getBindingContext("Ingredients").getPath();
			var oModel = this.getModel("Ingredients");
			var oRow = oModel.getProperty(sPath);
			
			
			if (oRow.Peinh > 0) {
				var iTotalCost = ( iValue / oRow.Peinh ) * oRow.Netpr.Curr;
				oRow.TNetpr.Curr = iTotalCost.toFixed(2);
			}
			oModel.setProperty(sPath,oRow);
			this._calcTotals();
		
		},
		
		onAddMiscChanged: function(oEvent){
			
			var iValue = oEvent.getSource().getValue();
			
			this.aSubTotal[0].AddMisc = iValue;
			
			this._calcTotals();	
		},
		onUnitSellPriceChanged: function(oEvent){
			
			var iValue = oEvent.getSource().getValue();
			this.aSubTotal[0].UnitSellPrice = iValue;
			this._calcTotals();	
		},
		_calcTotals: function(){
			var oModel = this.getModel("Ingredients");
			var oRows = oModel.getProperty("/Items");
			
			var sPath = this.getView().getBindingContext().getPath();
			var oRecipeData = this.getModel().getProperty(sPath);
			
			
			
			//SubTotal
			var iSubTotal = 0.00;
			for (var i = 0; i < oRows.length -7; i++){
				if (oRows[i].TNetpr.Curr) {
					iSubTotal = parseFloat(iSubTotal) + parseFloat(oRows[i].TNetpr.Curr);		
				}	
			}
			
			
			var oRowSubTotal = oRows[oRows.length - 6];
			oRowSubTotal.TNetpr.Curr = iSubTotal.toFixed(2);
			oModel.setProperty("/Items/" + (oRows.length - 6),oRowSubTotal);
			
			var oRowAddMisc = oRows[oRows.length - 5];
			var iAddMisc = oRowAddMisc.AddMisc.Curr || 0;
			
			
			var iTotalCost = iSubTotal *  (1 + (iAddMisc / 100));
			
			var oRowTotalCost = oRows[oRows.length - 4];
			oRowTotalCost.TNetpr.Curr = iTotalCost.toFixed(2);
			
			oModel.setProperty("/Items/" + (oRows.length - 4),oRowTotalCost);
			
			//Cost Per Portion
			var iQty = oRecipeData.Quantity;
			var oRowCostPerPortion = oRows[oRows.length - 3];
			var iCostPerPortion = (oRowTotalCost.TNetpr.Curr / iQty).toFixed(2);
			oRowCostPerPortion.TNetpr.Curr = iCostPerPortion;
			
			oModel.setProperty("/Items/" + (oRows.length - 3),oRowCostPerPortion);
			
			//Cost % Per Portion
			var oRowSellPrice = oRows[oRows.length - 2];
			var iCostPctg = 0.00;
			if (oRowSellPrice.SellPrice.Curr > 0 ) {
				iCostPctg = (iCostPerPortion / oRowSellPrice.SellPrice.Curr * 100).toFixed(2);
			}
			var oRowCostPctg = oRows[oRows.length - 1];
			
			oRowCostPctg.TNetpr.Curr = iCostPctg;
			
			oModel.setProperty("/Items/" + (oRows.length - 1),oRowCostPctg);
		},
		
		onExit: function() {
			this._oRouter.detachRouteMatched(this.__onRouteMatched, this);
			this._oValueHelpDialog.destroy();
			this.removeFragment(this._formFragments);
			
		}

	});

});