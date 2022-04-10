sap.ui.define([
	"halo/sap/mm/RECIPECOST/controller/BaseController",
	'sap/m/Label',
	'sap/m/Column',
	'sap/ui/model/json/JSONModel',
	'sap/m/ColumnListItem',
	'sap/m/library',
	'sap/viz/ui5/data/FlattenedDataset',
	'sap/viz/ui5/controls/common/feeds/FeedItem',
	'sap/viz/ui5/format/ChartFormatter',
	 'sap/viz/ui5/api/env/Format'
], function(BaseController,Label,Column,JSONModel,ColumnListItem,MobileLibrary,FlattenedDataset,FeedItem,ChartFormatter,Format) {
	"use strict";

	return BaseController.extend("halo.sap.mm.RECIPECOST.pages.controller.RptOutBarTable", {

		_constants: {
			table: {
				itemBindingPath: "table>/table",
				columnLabelTexts: ["Recipe ID", "Name","Group", "Location", "Selling Price/Unit", "Cost/Unit","Profit"],
				templateCellLabelTexts: ["{table>Recipe_ID}", "{table>Name}","{table>Group}", "{table>Location}", "{table>Selling_Price}", "{table>Cost_Price}","{table>Profit}"]
			},
			vizFrame: {
					id: "vizFrame",
				
					dataset: {
						dimensions: [{
							name: 'Group',
							value: "{chart>group}"
						}],
						measures: [{
							name: 'Count',
							value: '{chart>count}'
						}],
						data: {
							path: "chart>/aItems"
						}
					},
					analysisObjectProps: {
						uid: "Group",
						type: "Dimension",
						name: "Group"
					},
					type: "column",
					feedItems: [{
						'uid': "primaryValues",
						'type': "Measure",
						'values': ["Count"]
					}, {
						'uid': "axisLabels",
						'type': "Dimension",
						'values': ["Group"]
					}]
				},
		},
		onInit: function() {
			
			Format.numericFormatter(ChartFormatter.getInstance());
            
            
			this._oRouter = this.getRouter();
			this._oRouter.getRoute("rptoutbartable").attachPatternMatched(this.__onRouteMatched, this);
			
			var oTable = this.getView().byId("idTable");
			this._createTableContent(oTable);
			
			var oVizFrame = this.getView().byId(this._constants.vizFrame.id);
			this._updateVizFrame(oVizFrame);
		},

		onNavBack: function(){
			this.navBack();		
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
			this._refreshTable(oTable);
			var oVizFrame = this.getView().byId(this._constants.vizFrame.id);
			this._refreshChart(oVizFrame);
			
			
		},
		
		_updateVizFrame: function(vizFrame) {
			var oVizFrame = this._constants.vizFrame;

			var oDataset = new FlattenedDataset(this._constants.vizFrame.dataset);
			vizFrame.setDataset(oDataset);
			
			this._addFeedItems(vizFrame, oVizFrame.feedItems);
			vizFrame.setVizType(oVizFrame.type);
			
			var formatPattern = ChartFormatter.DefaultPattern;
			vizFrame.setVizProperties({
				title: {
					text: "Selling Price - Total By Group",
					visible: true
				},
				valueAxis: {
                    label: {
                        formatString: formatPattern.SHORTFLOAT
                    },
                    title: {
                        visible: false
                    }
                },
                 plotArea: {
                    dataLabel: {
                        formatString: formatPattern.SHORTFLOAT_MFD2,
                        visible: true
                    }
                }
			});

		},
		
		_addFeedItems: function(vizFrame, feedItems) {
			for (var i = 0; i < feedItems.length; i++) {
				vizFrame.addFeed(new FeedItem(feedItems[i]));
			}
		},
		
		_refreshChart: function(vizFrame){
			var oModel = this.getModel();
			
			this.oFilterStatID = new sap.ui.model.Filter({
                path: "StatID",
                operator: sap.ui.model.FilterOperator.EQ,
                value1: 'SellPriceByGroup'
            });
            
	        this.oFilterWerks = new sap.ui.model.Filter({
                path: "Werks",
                operator: sap.ui.model.FilterOperator.EQ,
                value1: this.PlantID
            });
            
            this.oFilter1 = new sap.ui.model.Filter({
                path: "Filter1",
                operator: sap.ui.model.FilterOperator.EQ,
                value1: this.P1,
            });
            
            this.oFilter2 = new sap.ui.model.Filter({
                path: "Filter2",
                operator: sap.ui.model.FilterOperator.EQ,
                value1: this.P2
            });
			
			var oStatData = {
				"aItems": []
			};
				
			
			oModel.read("/StatisticSet",{
				filters: [this.oFilterStatID,this.oFilterWerks,this.oFilter1,this.oFilter2],
				success: function(oResponse){
					var aResult = oResponse.results;
				
					for (var i = 0; i < aResult.length ; i++){
						var oItem = {
							"group" : aResult[i].Label,
							"count" : Number(aResult[i].Value)
						};
						oStatData.aItems.push(oItem);
					}
					
					
				
					var oGraphDataModel = new JSONModel(oStatData);
					vizFrame.setModel(oGraphDataModel,"chart");
				
				
				}
			});
			
		},
		_createTableContent: function(oTable) {
			var oTableConfig = this._constants.table;
			var aColumns = this._createTableColumns(oTableConfig.columnLabelTexts);
			
			oTable.removeAllColumns();
			
			for (var i = 0; i < aColumns.length; i++) {
				oTable.addColumn(aColumns[i]);
			}
			
			var oTableItemTemplate = new ColumnListItem({
				type: MobileLibrary.ListType.Active,
				cells: this._createLabels(oTableConfig.templateCellLabelTexts)
			});
			
			oTable.bindItems(oTableConfig.itemBindingPath, oTableItemTemplate, null, null);
		
		
			
		},
		
		_refreshTable: function(oTable){
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
					
					for (var i = 0; i < aResult.length ; i++){
						var iSellPrice = Number(aResult[i].PricePerUnit).toFixed(2);
						var iCost = Number(aResult[i].CostPerUnit).toFixed(2);
						
						var oItem = {
							"Recipe_ID" : aResult[i].RecipeID,
							"Name" : aResult[i].Name,
							"Group" : aResult[i].GroupTxt,
							"Location" : aResult[i].LocationTxt,
							"Selling_Price" : iSellPrice+ " " + aResult[i].Currency,
							"Cost_Price" :iCost + " " + aResult[i].Currency,
							"Profit" : Number(iSellPrice - iCost).toFixed(2) + " " + aResult[i].Currency
						};
						aItems.table.push(oItem);
					}
					
					var oTableModel = new JSONModel(aItems);
					oTable.setModel(oTableModel,"table");
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
		}
		

	});

});