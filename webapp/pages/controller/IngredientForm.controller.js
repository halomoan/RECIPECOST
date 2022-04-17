sap.ui.define([
	"halo/sap/mm/RECIPECOST/controller/BaseController",
	'sap/ui/model/json/JSONModel',
	'sap/m/ColumnListItem',
	'sap/m/Token',
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	'sap/ui/core/BusyIndicator',
	"halo/sap/mm/RECIPECOST/model/formatter"
], function(BaseController, JSONModel, ColumnListItem, Token, Filter, FilterOperator, MessageBox, MessageToast, BusyIndicator,  formatter) {
	"use strict";

	var _oBundle;

	return BaseController.extend("halo.sap.mm.RECIPECOST.pages.controller.IngredientForm", {
		formatter: formatter,
		_formFragments: {},

		_VHMaterialColumns: {
			"cols": [{
					"label": "Material ID",
					"template": "Matnr",
					"width": "7rem"
				}, {
					"label": "Name",
					"template": "Maktx",
					"width": "20rem"
				}, {
					"label": "Group",
					"template": "Matkltx"
				}, {
					"label": "Curr",
					"template": "Waers",
					"width": "3rem"
				}, {
					"label": "Price",
					"template": "Netpr",
					"demandPopin": "true",
					"hAlign": "End"
				}, {
					"label": "Per",
					"template": "Peinh",
					"hAlign": "End",
					"width": "3rem"
				}, {
					"label": "Unit",
					"template": "Bprme"
				}

			]
		},

		onInit: function() {
			var oViewModel = new JSONModel({
				"isFullScreen": false,
				"ImagePopUpPos": "Left",
				"ShowDelete": false,
				"ShowMultiSelect": false,
				"Date": {
					"Curr": "",
					"Prev1": ""
				}

			});
			this.getView().setModel(oViewModel, "viewData");

			var oIngredientModel = new JSONModel({
				"Items": []

			});
			this._sVersionID = "";
			this._oDate = null;
			this._bDirty = false;

			this.getView().setModel(oIngredientModel, "Ingredients");

			//this.oColModel = new JSONModel(sap.ui.require.toUrl("halo/sap/mm/RECIPECOST/fragments/") + "/VHMaterialColumnsModel.json");
			this.oColModel = new JSONModel(this._VHMaterialColumns);

			this._oRouter = this.getRouter();
			this._oRouter.getRoute("ingredientform").attachPatternMatched(this.__onRouteMatched, this);
		},

		__onRouteMatched: function(oEvent) {

			var oArguments = oEvent.getParameter("arguments");
			this.PurchOrgID = oArguments.Ekorg;
			this.PlantID = oArguments.Werks;
			this.RecipeID = oArguments.RecipeID;
			this.MatType = "F";

			this.oFilterPurchOrg = new Filter("Ekorg", FilterOperator.EQ, this.PurchOrgID); // Filter Material Type
			this.oFilterPlant = new Filter("Werks", FilterOperator.EQ, this.PlantID); // Filter Plant
			this.oFilterMatType = new Filter("Mtart", FilterOperator.StartsWith, this.MatType); // Filter Material Type

			this.aFilters = [this.oFilterPurchOrg, this.oFilterPlant, this.oFilterMatType];

			this.getView().bindElement("/RecipeSet(Werks='" + this.PlantID + "',RecipeID='" + this.RecipeID + "')");

			_oBundle = this.getResourceBundle();

			var oModel = this.getModel();

			BusyIndicator.show();
			oModel.read("/RecipeSet(Werks='" + this.PlantID + "',RecipeID='" + this.RecipeID + "')/Versions", {
				urlParameters: {
					//"$select": "Werks,RecipeID,Versions/VersionID,Versions/Ingredients",
					//"$expand": "Versions/Ingredients"
					"$expand": "Ingredients",
					"$top": 2
				},
				//filters: [  new Filter({ path: "VersionID",  operator:FilterOperator.EQ,  value1: "0000"}) ],
				success: function(oData, oResponse) {
					var aVersions = oData.results;

					var oViewModel = this.getModel("viewData");

					if (aVersions.length > 0) {

						oViewModel.setProperty("/Date/Curr", aVersions[0].PriceDate);
						this._sVersionID = aVersions[0].VersionID;
						this._oDate = aVersions[0].PriceDate;

						if (aVersions.length === 2) {
							oViewModel.setProperty("/Date/Prev1", aVersions[1].PriceDate);
						} else {
							oViewModel.setProperty("/Date/Prev1", null);
						}

						oViewModel.setProperty("/ShowMultiSelect", true);
					} else {
						oViewModel.setProperty("/Date/Curr", null);
						oViewModel.setProperty("/Date/Prev1", null);
					}
					this._showMaterial(aVersions);

					BusyIndicator.hide();

				}.bind(this),
				error: function(oError) {
					BusyIndicator.hide();
					MessageBox.error("{i18n>msgErr}");
				}
			});

		},
		
		onOverView: function(oEvent){			
			this._oRouter.navTo("recipeoverview", {
				Ekorg: this.PurchOrgID,
				Werks: this.PlantID,
				RecipeID: this.RecipeID
			});
		},
	
		onHowToCookPress: function(oEvent){
			var oRichText = sap.ui.getCore().byId("myRTE");
			
			if (oRichText) {
				oRichText.destroy();
			}
			
			if (!this.getFragmentByName(this._formFragments, "halo.sap.mm.RECIPECOST.fragments.HowToCookDialog")) {
				this.showFormDialogFragment(this.getView(), this._formFragments, "halo.sap.mm.RECIPECOST.fragments.HowToCookDialog", this);
				this._initRichTextEditor(false);
			} else {
				this.showFormDialogFragment(this.getView(), this._formFragments, "halo.sap.mm.RECIPECOST.fragments.HowToCookDialog", this);
				this._initRichTextEditor(false);
				this._getHTC();
			}
			


		},
		onHTCSave: function(){
			 
			 this._saveHTC();
	
			 //this.byId("HTCDialog").close();	
		},
		onHTCChange: function(oEvent){
			this._bHTCChanged = true;
			
		},
		onHTCClose: function(){
			
			
			if (this._bHTCChanged) {
				MessageBox.confirm(_oBundle.getText("msgAlertHTCUnsaved"), {
						actions: ["Save", "Discard"],
						emphasizedAction: "Save",
						onClose: function(sAction) {
							if (sAction === 'Save') {
								this._saveHTC();
							} 
							this._bHTCChanged = false;	
            				this.byId("HTCDialog").close();
						}.bind(this)
				});	
			} else {
				this.byId("HTCDialog").close();	
			}
		
		},
		
		_getHTC: function(){
			var oRichText = sap.ui.getCore().byId("myRTE");
			oRichText.setValue("");
			var oModel = this.getModel();
			
		
			BusyIndicator.show();
			oModel.read("/RecipeHTCSet(Werks='" + this.PlantID + "',RecipeID='" + this.RecipeID + "',Filename='HTC.txt')/$value", {
				success: function(oData, oResponse) {
					
					oRichText.setValue(oData);
					BusyIndicator.hide();
				}.bind(this),
				error: function(oError) {
					BusyIndicator.hide();
					MessageBox.error(_oBundle.getText("msgErr"));
				}
			});
		},
		
		_saveHTC: function(){
			var oRichText = sap.ui.getCore().byId("myRTE");
			var sData =  oRichText.getValue();
			
			var oModel = this.getModel();
			
			 var sUrl = location.protocol + "//" + location.hostname + ":" + location.port + "/sap/opu/odata/sap/ZRECIPECOST_ODATA_SRV"
					+ "/RecipeSet(Werks='" + this.PlantID + "',RecipeID='" + this.RecipeID +"')/HTC";
			 
			 var oThis = this;
			 $.ajaxSetup({ cache: false});
			 BusyIndicator.show();
			 
			 jQuery.ajax({
			 	url: sUrl,
			 	async : false,
			 	dataType: 'json',
			 	data: sData,
			 	type: "POST",
			 	beforeSend: function(xhr){
			 		xhr.setRequestHeader("X-CSRF-Token",oModel.getSecurityToken());
			 		xhr.setRequestHeader("slug","HTC.txt");
			 		xhr.setRequestHeader("content-type","text/plain");
			 	},
			 	success: function(oResponse){
			 		
					BusyIndicator.hide();
					oThis._bHTCChanged = false;
					MessageToast.show(_oBundle.getText("msgSuccessSaved"));
			 	},
			 	error: function(oResponse){
			 		BusyIndicator.hide();
			 		MessageToast.show("Error Detected");
			 	}
			 })
			
		},
		_initRichTextEditor: function(bFlag){
			var oThis = this;
			sap.ui.require(["sap/ui/richtexteditor/RichTextEditor"],
				function (RTE) {
					oThis.oRichTextEditor = new RTE("myRTE", {
						editorType: sap.ui.richtexteditor.EditorType.TinyMCE5,
						width: "100%",
						height: "600px",
						customToolbar: true,
						showGroupFont: true,
						showGroupLink: true,
						showGroupInsert: true,
						sanitizeValue: false,
						value: "",
						ready: function () {
							this.addButtonGroup("styleselect").addButtonGroup("table");
						},
						change: function(oEvent){
							oThis.onHTCChange(oEvent)
						}
					});
				oThis.getView().byId("howtocookEditor").addContent(oThis.oRichTextEditor);
				oThis._getHTC();
			});	
		},
		
		onUnitPress: function(oEvent) {
			var oSource = oEvent.getSource();
			var sPath = oSource.getBindingContext("Ingredients").getPath();
			var oData = oSource.getBindingContext("Ingredients").getObject();

			this._UnitPath = sPath;

			var aFilter = [
				new Filter("Werks", FilterOperator.EQ, this.PlantID),
				new Filter("Matnr", FilterOperator.EQ, oData.Matnr)
			];

			this.showPopOverFragment(this.getView(), oSource, this._formFragments, "halo.sap.mm.RECIPECOST.fragments.UnitPopover", this);

			var oList = this.byId("unitlist");
			var oBinding = oList.getBinding("items");
			oBinding.filter(aFilter, "Application");

		},

		onCookUnitSelect: function(oEvent) {
			var oSource = oEvent.getSource(),
				oData = oSource.getBindingContext().getObject();

			var oModel = this.getModel("Ingredients"),
				oItem = oModel.getProperty(this._UnitPath);
			
			if (oItem.QtyUnit.Curr !== oData.Cookunit) {

				oItem.QtyUnit.Curr = oData.Cookunit;
				oItem.QtyRatio.Curr = oData.Cookqty;
				if (oItem.QtyUnitx) {
					oItem.QtyUnitx.Curr = oData.Cookunitx;
				} else {
					oItem.QtyUnitx = { "Curr": oData.Cookunitx };
				}

				this._bDirty = true;
			}

			if (oItem.Peinh.Curr > 0) {
				var iTotalCost = (oItem.QtyUsed.Curr / oItem.Peinh.Curr) * oItem.Netpr.Curr * ( 1 / oItem.QtyRatio.Curr );
				oItem.CalcCost.Curr = iTotalCost.toFixed(2);
			}

			oModel.setProperty(this._UnitPath, oItem);
			this._calcTotals();

			var oPopOver = this.getFragmentByName(this._formFragments, "halo.sap.mm.RECIPECOST.fragments.UnitPopover");
			oPopOver.close();
		},
		onNavBack: function() {
			this.navBack();

		},

		onVHMaterialRequested: function() {
			var aCols = this.oColModel.getData().cols;

			this._oBasicSearchField = new sap.m.SearchField({
				showSearchButton: false
			});

			this._oValueHelpDialog = sap.ui.xmlfragment("halo.sap.mm.RECIPECOST.fragments.VHMaterial", this);
			this.getView().addDependent(this._oValueHelpDialog);

			//this._oValueHelpDialog.setSupportMultiselect(false); 

			var oMatGroup = sap.ui.getCore().byId("MatGroup");

			if (oMatGroup.getBinding("suggestionItems") === undefined) {
				oMatGroup.bindAggregation("suggestionItems", {
					path: "/MaterialGroupSet",
					template: new sap.ui.core.Item({
						key: "{Materialgrouptext}",
						text: "{Materialgrouptext}"
					}),
					filters: [new Filter("Language", FilterOperator.EQ, sap.ui.getCore().getConfiguration().getLanguage())]
				});

			}

			var oFilterBar = this._oValueHelpDialog.getFilterBar();
			oFilterBar.setFilterBarExpanded(false);
			oFilterBar.setBasicSearch(this._oBasicSearchField);

			this._oValueHelpDialog.getTableAsync().then(function(oTable) {
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
					}, function() {
						return new ColumnListItem({
							cells: aCols.map(function(column) {
								return new sap.m.Label({
									text: "{" + column.template + "}"
								});
							})
						});
					});
				}

				this._oValueHelpDialog.update();
			}.bind(this));

			this._oValueHelpDialog.open();
		},

		onFilterBarSearch: function(oEvent) {

			var sSearchQuery = this._oBasicSearchField.getValue(),
				aSelectionSet = oEvent.getParameter("selectionSet");
			var aFilters = aSelectionSet.reduce(function(aResult, oControl) {

				var sType = oControl.getMetadata().getName();
				switch (sType) {
					case "sap.m.Switch":
						if (oControl.getState()) {
							aResult.push(new Filter({
								path: oControl.getName(),
								operator: FilterOperator.EQ,
								value1: oControl.getState()
							}));
						}

						break;
					case "sap.m.Input":
						if (oControl.getValue()) {
							aResult.push(new Filter({
								path: oControl.getName(),
								operator: FilterOperator.Contains,
								value1: oControl.getValue()
							}));
						}

						break;

					case "sap.m.CheckBox":
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

		_showMaterial: function(aVersions) {

			var oIngredientModel = this.getModel("Ingredients"),
				aMaterials = [];
			var oVersion, aIngredients, oMaterial;
			var i, idx;

			if (aVersions.length > 0) {

				oVersion = aVersions[0];

				aIngredients = oVersion.Ingredients.results;

				for (i = 0; i < aIngredients.length; i++) {
					oMaterial = {
						"Matnr": aIngredients[i].Matnr,
						"Matkl": aIngredients[i].Matkl,
						"Maktx": aIngredients[i].Maktx,
						"Bprme": aIngredients[i].Bprme,
						"Peinh": {
							Curr: aIngredients[i].Peinh,
							Prev1: 0
						},
						"Netpr": {
							Curr: aIngredients[i].Netpr,
							Prev1: 0
						},
						"Waers": aIngredients[i].Waers,
						"Ebeln": aIngredients[i].Ebeln,
						"QtyUsed": {
							Curr: aIngredients[i].QtyUsed,
							Prev1: 0
						},
						"QtyUnit": {
							Curr: aIngredients[i].QtyUnit,
							Prev1: aIngredients[i].Bprme
						},
						"QtyUnitx": {
							Curr: aIngredients[i].QtyUnitx ? aIngredients[i].QtyUnitx : aIngredients[i].Bprmex,
							Prev1: aIngredients[i].Bprmex,
						},
						"QtyRatio": {
							Curr: aIngredients[i].QtyRatio,
							Prev1: null
						},
						"CalcCost": {
							Curr: aIngredients[i].CalcCost,
							Prev1: 0.00
						},
						"Status": "Success"
					}
					aMaterials.push(oMaterial);
				}

				if (aVersions.length === 2) {
					oVersion = aVersions[1];
					aIngredients = oVersion.Ingredients.results;
					for (i = 0; i < aIngredients.length; i++) {

						idx = aMaterials.findIndex(ele => {
							return ele.Matnr === aIngredients[i].Matnr;
						});

						if (idx > -1) {
							oMaterial = aMaterials[idx];
							oMaterial.Peinh.Prev1 = aIngredients[i].Peinh;
							oMaterial.Netpr.Prev1 = aIngredients[i].Netpr;
							oMaterial.QtyUsed.Prev1 = aIngredients[i].QtyUsed;
							oMaterial.CalcCost.Prev1 = aIngredients[i].CalcCost;

						} else {
							oMaterial = {
								"Matnr": aIngredients[i].Matnr,
								"Matkl": aIngredients[i].Matkl,
								"Maktx": aIngredients[i].Maktx,
								"Bprme": aIngredients[i].Bprme,
								"Peinh": {
									Curr: null,
									Prev1: aIngredients[i].Peinh
								},
								"Netpr": {
									Curr: null,
									Prev1: aIngredients[i].Netpr
								},
								"Waers": aIngredients[i].Waers,
								"Ebeln": aIngredients[i].Ebeln,
								"QtyUsed": {
									Curr: null,
									Prev1: aIngredients[i].QtyUsed
								},
								"QtyUnit": {
									Curr: null,
									Prev1: aIngredients[i].QtyUnit
								},
								"QtyRatio": {
									Curr: null,
									Prev1: aIngredients[i].QtyRatio
								},
								"CalcCost": {
									Curr: null,
									Prev1: aIngredients[i].CalcCost
								},
								"Status": "None"
							}
							aMaterials.push(oMaterial);
						}

					}

				}

				this._showSubTotal(aMaterials, aVersions);
			}
			oIngredientModel.setProperty("/Items", aMaterials);
		},

		onValueHelpOkPress: function(oEvent) {
			var oIngredientModel = this.getModel("Ingredients"),
				oIngredientData = oIngredientModel.getData().Items,
				oViewModel = this.getModel("viewData");

			var aTokens = oEvent.getParameter("tokens");

			if (aTokens.length) {
				oViewModel.setProperty("/ShowMultiSelect", true);
				//remove subtotal
				if (oIngredientData.length > 1) {
					oIngredientData.splice(oIngredientData.length - 7, 7);
				}
				for (var i = 0; i < aTokens.length; i++) {
					var oObject = aTokens[i].data().row;
					var oMaterial = {
						"Matnr": oObject.Matnr,
						"Matkl": oObject.Matkl,
						"Maktx": oObject.Maktx,
						"Bprme": oObject.Bprme,
						"Peinh": {
							Curr: oObject.Peinh,
							Prev1: "0.00"
						},
						"Netpr": {
							Curr: oObject.Netpr,
							Prev1: "0.00"
						},
						"Waers": oObject.Waers,
						"Ebeln": oObject.Ebeln,
						"QtyUsed": {
							Curr: 0.00,
							Prev1: 0.00
						},
						"QtyUnit": {
							Curr: oObject.Bprme,
							Prev1: oObject.Bprme
						},
						"QtyRatio": {
							Curr: 1.00,
							Prev1: 0.00
						},
						"CalcCost": {
							Curr: 0.00,
							Prev1: 0.00
						},
						"Status": "Success"
					}

					var idx = oIngredientData.findIndex(ele => {
						return ele.Matnr === oMaterial.Matnr;
					})

					if (idx > -1) {
						if (oIngredientData[idx].Netpr.Curr === null) {
							oIngredientData[idx].Netpr.Curr = oMaterial.Netpr.Curr;
							oIngredientData[idx].Peinh.Curr = oMaterial.Peinh.Curr;
							oIngredientData[idx].CalcCost.Curr = 0.00;
							oIngredientData[idx].QtyUsed.Curr = 0.00;
							oIngredientData[idx].Status = "Success";
						}
					} else {

						if (oIngredientData.length > 0) {
							var idx = oIngredientData.findIndex(ele => {
								return ele.QtyUsed.Curr === null;
							});
							if (idx > -1) {
								oIngredientData.splice(idx, 0, oMaterial);
							} else {
								oIngredientData.push(oMaterial);
							}
						} else {
							oIngredientData.push(oMaterial);

						}

					}
				}
			}

			this._sortMaterials(oIngredientData);
			this._showSubTotal(oIngredientData, []);

			this._calcTotals(oIngredientData);
			this._oValueHelpDialog.close();
		},

		_sortMaterials: function(aMaterials) {
			aMaterials.sort(function(a, b) {
				if (a.QtyUsed.Curr) {
					return -1;
				} else {
					return 1;
				}
			});
		},

		_showSubTotal: function(aMaterials, aVersions) {
			aMaterials.push({
				"ID": "",
				"Netpr": {
					Curr: null,
					Prev1: null
				}
			});

			aMaterials.push({
				"ID": "SubTotal",
				"Matnr": "",
				"Maktx": _oBundle.getText("SubTotal"),
				"QtyUsed": null,
				"Bprme": null,
				"Peinh": null,
				"Netpr": null,
				"Waers": "SGD",
				"CalcCost": {
					Curr: (aVersions.length > 0 ? aVersions[0].SubTotal : 0),
					Prev1: (aVersions.length > 1 ? aVersions[1].SubTotal : 0)
				}
			});

			aMaterials.push({
				"ID": "AddMisc",
				"Matnr": null,
				"Maktx": _oBundle.getText("AddMisc"),
				"QtyUsed": null,
				"Bprme": null,
				"Peinh": null,
				"Netpr": null,
				"Waers": "%",
				"CalcCost": 0.00,
				"AddMisc": {
					Curr: (aVersions.length > 0 ? aVersions[0].AddMisc * 100 : 0),
					Prev1: (aVersions.length > 1 ? aVersions[1].AddMisc * 100 : 0)
				}
			});
			aMaterials.push({
				"ID": "TotRecipeCost",
				"Matnr": "",
				"Maktx": _oBundle.getText("TotalRecipeCost"),
				"QtyUsed": null,
				"Bprme": null,
				"Peinh": null,
				"Netpr": null,
				"Waers": "SGD",
				"CalcCost": {
					Curr: (aVersions.length > 0 ? aVersions[0].TotRecipeCost : 0),
					Prev1: (aVersions.length > 1 ? aVersions[1].TotRecipeCost : 0)
				}
			});

			aMaterials.push({
				"ID": "CostPerUnit",
				"Matnr": "",
				"Maktx": _oBundle.getText("CostPerPortion"),
				"QtyUsed": null,
				"Bprme": null,
				"Peinh": null,
				"Netpr": null,
				"Waers": "SGD",
				"CalcCost": {
					Curr: (aVersions.length > 0 ? aVersions[0].CostPerUnit : 0),
					Prev1: (aVersions.length > 1 ? aVersions[1].CostPerUnit : 0)
				}
			});
			aMaterials.push({
				"ID": "PricePerUnit",
				"Matnr": null,
				"Maktx": _oBundle.getText("UnitSellPrice"),
				"QtyUsed": null,
				"Bprme": null,
				"Peinh": null,
				"Netpr": null,
				"Waers": "SGD",
				"CalcCost": null,
				"SellPrice": {
					Curr: (aVersions.length > 0 ? aVersions[0].PricePerUnit : 0),
					Prev1: (aVersions.length > 1 ? aVersions[1].PricePerUnit : 0)
				}
			});

			aMaterials.push({
				"ID": "readonly",
				"Matnr": "",
				"Maktx": _oBundle.getText("Cost%PerPortion"),
				"QtyUsed": null,
				"Bprme": null,
				"Peinh": null,
				"Netpr": null,
				"Waers": "% ",
				"CalcCost": {
					Curr: (aVersions.length > 0 ? (aVersions[0].CostPerUnit / aVersions[0].PricePerUnit) * 100 : 0),
					Prev1: (aVersions.length > 1 ? (aVersions[1].CostPerUnit / aVersions[1].PricePerUnit) * 100 : 0)
				}
			});
		},
		onValueHelpCancelPress: function() {
			this._oValueHelpDialog.close();
		},

		onValueHelpAfterClose: function() {
			this._oValueHelpDialog.destroy();
		},

		_filterTable: function(oFilter) {
			var oValueHelpDialog = this._oValueHelpDialog;

			oValueHelpDialog.getTableAsync().then(function(oTable) {
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

			var sPhotoPath = "/sap/opu/odata/sap/zrecipecost_odata_srv" + sPath.replace("RecipeSet", "RecipePhotoSet") + "/$value?" + "?" + new Date()
				.getTime();
			var oPreviewImage = this.byId("imgPreview");
			oPreviewImage.setSrc(sPhotoPath);
			this._imageSelected = oSource;

		},

		onUploadImage: function() {
			var oUploader = this.byId("ImageUploader");
			var sPath = this.byId("ImagePopover").getBindingContext().getPath();
			sPath = sPath + "/Photo";

			if (!oUploader.getValue()) {
				MessageToast.show("Choose a file first");
				return;
			}

			oUploader.setUploadUrl("/sap/opu/odata/SAP/ZRECIPECOST_ODATA_SRV" + sPath);

			oUploader.checkFileReadable().then(function() {
				var csrfToken = this.getView().getModel().oHeaders['x-csrf-token'];
				oUploader.setSendXHR(true);
				var headerParma = new sap.ui.unified.FileUploaderParameter();
				headerParma.setName('x-csrf-token');
				headerParma.setValue(csrfToken);

				oUploader.addHeaderParameter(headerParma);
				oUploader.upload();
			}.bind(this), function(error) {
				MessageToast.show("The file cannot be read. It may have changed.");
			}).then(function() {
				oUploader.clear();
			});
		},
		onUploadComplete: function() {
			this._imageSelected.setSrc(this._imageSelected.getSrc() + "?" + new Date().getTime());

			var oPopOver = this.getFragmentByName(this._formFragments, "halo.sap.mm.RECIPECOST.fragments.ImageUploadPopover");
			oPopOver.close();

		},

		onImgUploaderClose: function() {
			var oPopOver = this.getFragmentByName(this._formFragments, "halo.sap.mm.RECIPECOST.fragments.ImageUploadPopover");
			oPopOver.close();
		},

		onToggleSelect: function(oEvent) {

			var oTable = this.byId("ingredienttbl");
			var oPlugin = oTable.getPlugins()[0];
			var sMode = oPlugin.getSelectionMode();

			if (sMode === "MultiToggle") {
				oPlugin.setSelectionMode("None");
			} else {
				oPlugin.setSelectionMode("MultiToggle");
			}

		},

		onSelectMaterial: function(oEvent) {
			var oViewModel = this.getModel("viewData");
			var oPlugin = oEvent.getSource();
			var bLimitReached = oEvent.getParameters().limitReached;
			var iIndices = oPlugin.getSelectedIndices();
			var sMessage = "";

			if (iIndices.length > 0) {

				oViewModel.setProperty("/ShowDelete", true);

				sMessage = _oBundle.getText("NoRowSelected", iIndices.length);
				if (bLimitReached) {
					sMessage = sMessage + _oBundle.getText("LimitRowSelected", oPlugin.getLimit());
				}
			} else {
				sMessage = _oBundle.getText("SelectedRowClear");
				oViewModel.setProperty("/ShowDelete", false);
			}

			MessageToast.show(sMessage);
		},

		onDeleteMaterial: function() {

			var oTable = this.byId("ingredienttbl");
			var oPlugin = oTable.getPlugins()[0];
			var aIndices = oPlugin.getSelectedIndices();

			if (aIndices.length > 0) {

				MessageBox.confirm(_oBundle.getText("msgCfrmDelMaterial"), {
					actions: ["Delete", MessageBox.Action.CANCEL],
					emphasizedAction: "CANCEL",
					onClose: function(sAction) {
						if (sAction === 'Delete') {
							this._deleteMaterial(aIndices);
							oPlugin.clearSelection();
						}
					}.bind(this)

				});
			}

		},

		_deleteMaterial: function(arrItems) {
			var oModel = this.getModel("Ingredients");
			var oRows = oModel.getProperty("/Items");

			for (var i = arrItems.length - 1; i >= 0; i--) {

				if (arrItems[i] < oRows.length - 7) {
					var oMaterial = oRows[arrItems[i]];

					if (oMaterial.QtyUsed.Prev1 !== 0) {
						if (oMaterial.QtyUsed.Curr) {
							oMaterial.QtyUsed.Curr = 0.00;
						}
					} else {
						oRows.splice(arrItems[i], 1);
					}
				}

			}
			this._calcTotals(oRows);
		},
		onQtyChanged: function(oEvent) {
			var oSource = oEvent.getSource();
			var sPath = oSource.getBindingContext("Ingredients").getPath();
			var oModel = this.getModel("Ingredients");
			var oRow = oModel.getProperty(sPath);

			if (oRow.Peinh.Curr > 0) {
				var iTotalCost = (oRow.QtyUsed.Curr  / oRow.Peinh.Curr) * oRow.Netpr.Curr * ( 1 / oRow.QtyRatio.Curr);
			
				oRow.CalcCost.Curr = iTotalCost.toFixed(2);
			}

			oModel.setProperty(sPath, oRow);
			this._calcTotals();

		},

		onAddMiscChanged: function(oEvent) {

			var iValue = oEvent.getSource().getValue();
			this._calcTotals();
		},
		onUnitSellPriceChanged: function(oEvent) {

			var iValue = oEvent.getSource().getValue();
			this._calcTotals();
		},

		onSave: function() {
			var i = 0;
			var oIngredientModel = this.getModel("Ingredients");
			var oRows = oIngredientModel.getProperty("/Items");
			var sPath = this.getView().getBindingContext().getPath();
			var oRecipeData = this.getModel().getProperty(sPath);

			var oRecipeVersion = {
				"Werks": this.PlantID,
				"RecipeID": this.RecipeID,
				"VersionID": this._sVersionID,
				"PriceDate": this._oDate,
				"Waers": oRecipeData.Currency,
				"Bprme": oRecipeData.Unit,
				"SubTotal": 0.00,
				"AddMisc": 0.00,
				"TotRecipeCost": 0.00,
				"CostPerUnit": 0.00,
				"PricePerUnit": 0.00,
				"ProfitPerUnit": 0.00,
				"Ingredients": []

			};

			for (i = 0; i < oRows.length; i++) {

				if (i < oRows.length - 7) {
					if (oRows[i].QtyUsed.Curr > 0) {
						var oIngredient = {
							"Werks": this.PlantID,
							"RecipeID": this.RecipeID,
							"VersionID": this._sVersionID,
							"Matnr": oRows[i].Matnr,
							"Maktx": "",
							"Matkl": oRows[i].Matkl,
							"Matkltx": "",
							"Ebeln": oRows[i].Ebeln,
							"Waers": oRows[i].Waers,
							"Netpr": oRows[i].Netpr.Curr,
							"Peinh": oRows[i].Peinh.Curr,
							"Bprme": oRows[i].Bprme,
							"CalcCost": oRows[i].CalcCost.Curr,
							"QtyUsed": "" + oRows[i].QtyUsed.Curr,
							"QtyUnit": oRows[i].QtyUnit.Curr,
							"QtyRatio": "" + oRows[i].QtyRatio.Curr
						};

						oRecipeVersion.Ingredients.push(oIngredient);
					}

				} else {
					switch (oRows[i].ID) {
						case "SubTotal":
							oRecipeVersion.SubTotal = "" + oRows[i].CalcCost.Curr;
							break;
						case "AddMisc":
							oRecipeVersion.AddMisc = "" + (oRows[i].AddMisc.Curr / 100);
							break;
						case "TotRecipeCost":
							oRecipeVersion.TotRecipeCost = "" + oRows[i].CalcCost.Curr;
							break;
						case "CostPerUnit":
							oRecipeVersion.CostPerUnit = "" + oRows[i].CalcCost.Curr;
							break;
						case "PricePerUnit":
							oRecipeVersion.PricePerUnit = "" + oRows[i].SellPrice.Curr;
							break;
					}
				}

			}
			
			oRecipeVersion.ProfitPerUnit = "" + (Number(oRecipeVersion.PricePerUnit) - Number(oRecipeVersion.CostPerUnit));
			

			var oModel = this.getModel();

			BusyIndicator.show(1000);

			oModel.create("/RecipeVersionSet", oRecipeVersion, {
				method: "POST",
				success: function(oData) {
					BusyIndicator.hide();
					this._bDirty = false;
					MessageToast.show(_oBundle.getText("msgSuccessSaved"));
				}.bind(this),
				error: function(e) {
					BusyIndicator.hide();
					MessageToast.show("Error Detected");
				}
			});

		},

		onCreateNewVersion: function() {

			if (this._bDirty) {
				MessageBox.alert(_oBundle.getText("msgAlertUnsaved"));
			} else {

				MessageBox.confirm(_oBundle.getText("msgCfrmNewVersion"), {
					actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
					emphasizedAction: "CANCEL",
					onClose: function(sAction) {
						if (sAction === MessageBox.Action.YES) {
							this._createNewVersion();
						}
					}.bind(this)
				});
			}
		},

		_createNewVersion: function() {
			this._sVersionID = "";
			this._oDate = new Date();
			var oViewModel = this.getModel("viewData");
			var oIngredientModel = this.getModel("Ingredients");
			var aMaterials = oIngredientModel.getProperty("/Items");

			for (var i = 0; i < aMaterials.length; i++) {

				for (let id in aMaterials[i]) {
					if (aMaterials[i][id] && aMaterials[i][id].hasOwnProperty("Curr")) {
						aMaterials[i][id].Prev1 = aMaterials[i][id].Curr;
					}
				}
			}

			aMaterials = aMaterials.filter(oMaterial => {
				var bSkip = true;

				if (oMaterial.hasOwnProperty("ID")) {
					bSkip = true;
				} else {
					for (let id in oMaterial) {

						if (oMaterial[id] && oMaterial[id].hasOwnProperty("Curr")) {
							bSkip = bSkip && oMaterial[id].Curr !== null;
						}
					}
				}
				return bSkip;
			});

			oViewModel.setProperty("/Date/Prev1", oViewModel.getProperty("/Date/Curr"));
			oViewModel.setProperty("/Date/Curr", this._oDate);

			oIngredientModel.setProperty("/Items", aMaterials);

		},

		_calcTotals: function(oRows) {
			var oModel = this.getModel("Ingredients");

			if (!oRows) {
				oRows = oModel.getProperty("/Items");
			}

			var sPath = this.getView().getBindingContext().getPath();
			var oRecipeData = this.getModel().getProperty(sPath);

			//SubTotal
			var iSubTotal = 0.00;
			for (var i = 0; i < oRows.length - 7; i++) {
				if (oRows[i].CalcCost.Curr) {
					iSubTotal = parseFloat(iSubTotal) + parseFloat(oRows[i].CalcCost.Curr);
				}
			}

			var oRowSubTotal = oRows[oRows.length - 6];

			oRowSubTotal.CalcCost.Curr = iSubTotal;
			//oModel.setProperty("/Items/" + (oRows.length - 6), oRowSubTotal);

			var oRowAddMisc = oRows[oRows.length - 5];
			var iAddMisc = oRowAddMisc.AddMisc.Curr || 0;

			var iTotalCost = iSubTotal * (1 + (iAddMisc / 100));

			var oRowTotalCost = oRows[oRows.length - 4];
			oRowTotalCost.CalcCost.Curr = iTotalCost;

			//oModel.setProperty("/Items/" + (oRows.length - 4), oRowTotalCost);

			//Cost Per Portion
			var iQty = oRecipeData.Qty;
			var oRowCostPerPortion = oRows[oRows.length - 3];
			var iCostPerPortion = (oRowTotalCost.CalcCost.Curr / iQty).toFixed(2);
			oRowCostPerPortion.CalcCost.Curr = iCostPerPortion;

			//oModel.setProperty("/Items/" + (oRows.length - 3), oRowCostPerPortion);

			//Cost % Per Portion
			var oRowSellPrice = oRows[oRows.length - 2];
			var iCostPctg = 0.00;
			if (oRowSellPrice.SellPrice.Curr > 0) {
				iCostPctg = (iCostPerPortion / oRowSellPrice.SellPrice.Curr * 100).toFixed(2);
			}
			var oRowCostPctg = oRows[oRows.length - 1];

			oRowCostPctg.CalcCost.Curr = iCostPctg;

			//oModel.setProperty("/Items/" + (oRows.length - 1), oRowCostPctg);

			oModel.setProperty("/Items", oRows);

		},

		onExit: function() {
			this._oRouter.detachRouteMatched(this.__onRouteMatched, this);
			this._oValueHelpDialog.destroy();
			this.removeFragment(this._formFragments);

		}

	});

});