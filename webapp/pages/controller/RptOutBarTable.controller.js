sap.ui.define([
	"halo/sap/mm/RECIPECOST/controller/BaseController",
	'sap/m/Label',
	'sap/m/Column',
	'sap/ui/model/json/JSONModel',
	'sap/m/ColumnListItem',
	'sap/m/library'
], function(BaseController,Label,Column,JSONModel,ColumnListItem,MobileLibrary) {
	"use strict";

	return BaseController.extend("halo.sap.mm.RECIPECOST.pages.controller.RptOutBarTable", {

		_constants: {
			table: {
				itemBindingPath: "/table",
				columnLabelTexts: ["Recipe ID", "Name", "Location", "Selling Price/Unit", "Cost/Unit"],
				templateCellLabelTexts: ["{Recipe_ID}", "{Name}", "{Location}", "{Selling_Price}", "{Cost_Price}"]
			}
		},
		onInit: function() {
			this._oRouter = this.getRouter();
			this._oRouter.getRoute("rptoutbartable").attachPatternMatched(this.__onRouteMatched, this);
		},

		
		onExit: function() {
		
		},
		
		__onRouteMatched: function(oEvent){
			var oArguments = oEvent.getParameter("arguments");
			this.PurchOrgID = oArguments.Ekorg;
			this.PlantID = oArguments.Werks;
			this.FilterType = oArguments.FilterType;
			this.P1 = oArguments.P1;
			this.P2 = oArguments.P2;
			
			var oTable = this.getView().byId("idTable");
			this._createTableContent(oTable);
		},
		
		_createTableContent: function(oTable) {
			var oTableConfig = this._constants.table;
			var aColumns = this._createTableColumns(oTableConfig.columnLabelTexts);
			
			
			for (var i = 0; i < aColumns.length; i++) {
				oTable.addColumn(aColumns[i]);
			}
			
			var oTableItemTemplate = new ColumnListItem({
				type: MobileLibrary.ListType.Active,
				cells: this._createLabels(oTableConfig.templateCellLabelTexts)
			});
			
			oTable.bindItems(oTableConfig.itemBindingPath, oTableItemTemplate, null, null);
		
			var oModel = this.getModel();
			
	        this.oFilterWerks = new sap.ui.model.Filter({
                path: "Werks",
                operator: sap.ui.model.FilterOperator.EQ,
                value1: this.PlantID
            });
            
            this.oFilterAmount = new sap.ui.model.Filter({
                path: "PricePerUnit",
                operator: sap.ui.model.FilterOperator.BT,
                value1: this.P1,
                value2: this.P2
            });
            
			oModel.read("/RecipeSet",{
				filters: [this.oFilterWerks,this.oFilterAmount],
				success: function(oResponse){
					var aResult = oResponse.results;
					
					var aItems = {
						"table": []
					};
					
					for (i = 0; i < aResult.length ; i++){
						var oItem = {
							"Recipe_ID" : aResult[i].RecipeID,
							"Name" : aResult[i].Name,
							"Location" : aResult[i].LocationTxt,
							"Selling_Price" : Number(aResult[i].PricePerUnit).toFixed(2) + " " + aResult[i].Currency,
							"Cost_Price" : Number(aResult[i].CostPerUnit).toFixed(2) + " " + aResult[i].Currency
						};
						aItems.table.push(oItem);
					}
					
					var oTableModel = new JSONModel(aItems);
					oTable.setModel(oTableModel);
				}
			});
			
		},
		_createTableColumns: function(labels) {
		
			var aLabels = this._createLabels(labels);
			return this._createControls(Column, "header", aLabels);
		},
		_createLabels: function(labelTexts) {
			return this._createControls(Label, "text", labelTexts);
		},
		_createControls: function(Control, prop, propValues) {
			var aControls = [];
			var oProps = {};
			
			for (var i = 0; i < propValues.length; i++) {
				oProps[prop] = propValues[i];
				aControls.push(new Control(oProps));
			}
			return aControls;
		},
		

	});

});