sap.ui.define([
	"halo/sap/mm/RECIPECOST/controller/BaseController",
	'sap/ui/model/json/JSONModel',
	'sap/ui/core/BusyIndicator',
	"sap/m/MessageBox",
	"halo/sap/mm/RECIPECOST/model/formatter"
	
], function(BaseController,JSONModel,BusyIndicator,MessageBox,formatter) {
	"use strict";
	

	var _oBundle;
	return BaseController.extend("halo.sap.mm.RECIPECOST.pages.controller.RecipeOverview", {

		formatter: formatter,
		onInit: function() {
			var oViewModel = new JSONModel({
				
				"DoPrint": false,
				"Date": {
					"Curr": "",
					"Prev1": ""
				}

			});
			this.getView().setModel(oViewModel, "viewData");
			
			var oIngredientModel = new JSONModel({
				"Items": []
			});
			this.getView().setModel(oIngredientModel, "Ingredients");
			
			_oBundle = this.getResourceBundle();
				
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
				
				this._refreshTable();
					
		},
		
		// onPrint: async function(){
			
		// 	this.getView().getModel("viewData").setProperty("/DoPrint", true);
			
		// 	 const oOptions = {
		// 	    margin: [0.1,0,0.1,0],
		// 	    filename:     'recipe.pdf',
		// 	    image:        { type: 'jpeg', quality: 0.98 },
		// 	    html2canvas:  { scale: 2 },
		// 	    jsPDF:        { unit: 'in', format: 'A4', orientation: 'l' },
		// 	    pagebreak: { avoid: 'tr' }
		// 	};
			
		// 	const element1 = this.getView().byId("SAPUI5content").getDomRef();
		// 	await html2pdf().set(oOptions).from(element1).save();
			
		// 	this.getView().getModel("viewData").setProperty("/DoPrint", false);
		// },
		
		onPrint: function(){
			
			
			var aObjects = this.byId("PageContent").$().height();
			console.log(aObjects);
	
			
			// this.getView().getModel("viewData").setProperty("/DoPrint", true);
			
			// var iHeight = this.getView().$().height();
			
			// var css = '@page { size: 100% ' + iHeight + 'px; }',
			//     head = document.head || document.getElementsByTagName('head')[0],
			//     style = document.createElement('style');
			    
			// console.log(css);
			
			// style.type = 'text/css';
			// style.media = 'print';
			
			// if (style.styleSheet){
			//   style.styleSheet.cssText = css;
			// } else {
			//   style.appendChild(document.createTextNode(css));
			// }
			
			// head.appendChild(style);
			window.print();	
			
			this.getView().getModel("viewData").setProperty("/DoPrint", false);
		},
		
		_refreshTable: function(){
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
		
		onClose: function(){
			this.navBack();
		},
		
		 

		
		onExit: function() {
		}

	});

});