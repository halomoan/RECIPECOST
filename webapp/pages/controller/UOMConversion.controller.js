sap.ui.define([
	"halo/sap/mm/RECIPECOST/controller/BaseController",
	'sap/ui/model/json/JSONModel',
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/core/message/Message",
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	'sap/m/ColumnListItem',
	"sap/ui/core/library"
], function(BaseController, JSONModel, MessageBox, MessageToast, Message, Filter, FilterOperator,ColumnListItem,library) {
	"use strict";

	var _oBundle;
	var MessageType = library.MessageType;
	
	return BaseController.extend("halo.sap.mm.RECIPECOST.pages.controller.UOMConversion", {

		_formFragments: {},
		onInit: function() {
			var oViewData = {
					"Mode": "New"
				};
				
				
				var oView = this.getView();

				var oViewModel = new JSONModel(oViewData);
				this.setModel(oViewModel, "viewData");
				
				this._initForm();
				
				// set message model
				var oMessageManager = sap.ui.getCore().getMessageManager();
				oView.setModel(oMessageManager.getMessageModel(), "message");
				oMessageManager.registerObject(oView, true);
				
				sap.ui.getCore().getMessageManager().removeAllMessages();
				
				this.oColModel = new JSONModel(sap.ui.require.toUrl("halo/sap/mm/RECIPECOST/fragments/") + "/VHMaterialColumnsModel.json");

				var fnTableRowAction = this.onTableRowAction.bind(this);

				this.getOwnerComponent().getModel().metadataLoaded().then(function() {
					_oBundle = this.getResourceBundle();
					var oTable = this.byId("uomtbl");
					var oTemplate = new sap.ui.table.RowAction({
						items: [
							new sap.ui.table.RowActionItem({
								type: "Delete",
								text: "Delete",
								press: fnTableRowAction
							}),
							new sap.ui.table.RowActionItem({
								icon: "sap-icon://edit",
								text: "Edit",
								press: fnTableRowAction
							}),
							new sap.ui.table.RowActionItem({
								icon: "sap-icon://navigation-right-arrow",
								text: "Conversion",
								press: fnTableRowAction
							})
						]
					});
					oTable.setRowActionTemplate(oTemplate);
					oTable.setRowActionCount(3);
					
				
					
				}.bind(this));
				
				this.PlantID = "";
				
				this._oRouter = this.getRouter();
				this._oRouter.getRoute("uomconversion").attachPatternMatched(this.__onRouteMatched, this);
				
		},
		
		onNavBack: function(){
			this.navBack();	
		},
		
		onNew: function() {
				this._initForm();

				var oViewModel = this.getModel("viewData");
				oViewModel.setProperty("/Mode", "New");
		},
		
		onSave: function() {
			var oViewModel = this.getModel("viewData");
			var oModel = this.getModel();
			var oThis = this;
			
			var sMode = oViewModel.getProperty("/Mode");
			
			var oFormModel = this.getModel("form"),
				oFormData = oFormModel.getData();

			if (this._validateForm(oFormData)) {
				var oData = {
					"Werks": this.PlantID,
					"Msehi": oFormData.Msehi,
					"Text": oFormData.Text
				};

				
				if (sMode === "New") {
					oModel.create("/CookingUnitSet", oData, {
						method: "POST",
						success: function(data) {
							oThis._initForm();
							MessageToast.show(_oBundle.getText("msgUnitCodeCreated"));
						},
						error: function(e) {
							var oMessage= JSON.parse(e.responseText).error.message.value;
							if (oMessage) {
								MessageToast.show(oMessage);
							} else {
								MessageToast.show(_oBundle.getText("msgErr"));
							}
						}
					});
				} else {
					oModel.update("/CookingUnitSet(Werks='" + this.PlantID + "',Msehi='" + oFormData.Msehi + "')", oData,null,
					function(){
						oThis._initForm();
						MessageToast.show(_oBundle.getText("msgUnitCodeUpdated"));
					},
					function(e){
							var oMessage= JSON.parse(e.responseText).error.message.value;
							if (oMessage) {
								MessageToast.show(oMessage);
							} else {
								MessageToast.show(_oBundle.getText("msgErr"));
							}
					});
				}
			}

		},
		
		onTableRowAction: function(oEvent) {

		
			var oRow = oEvent.getParameter("row");
			var oData = oRow.getBindingContext().getObject();
			var oItem = oEvent.getParameter("item");
			var oViewModel = this.getModel("viewData");
			
			if (oItem.getText() === "Edit") {
				var oFormModel = this.getModel("form"),
					oFormData = oFormModel.getData();
				
				oFormData.Werks = oData.Werks;
				oFormData.Msehi = oData.Msehi;
				oFormData.Text = oData.Text;

				oFormModel.setProperty("/", oFormData);
				oViewModel.setProperty("/Mode", "Edit");

			} else {
				
				var oThis = this;
				oViewModel.setProperty("/Mode", "");
				
				MessageBox.confirm(_oBundle.getText("msgCfrmDelUnitCode"), {
					actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
					emphasizedAction: "CANCEL",
					onClose: function(sAction) {
						if (sAction === 'YES') {
						
							oThis._deleteData(oData);
							
						}
				}
			});	
			}

			//MessageToast.show("Item " + (oItem.getText() || oItem.getType()) + " pressed for product with id " +
			//	this.getView().getModel().getProperty("Locationid", oRow.getBindingContext()));
		},
		onMsehiChange:function(oEvent){
			var input = oEvent.getSource();

    		input.setValue(input.getValue().toUpperCase());
		},
		onMessagePopoverPress: function(oEvent) {
			var oSource = oEvent.getSource();

			this.showPopOverFragment(this.getView(), oSource, this._formFragments, "halo.sap.mm.RECIPECOST.fragments.MessagePopover", this);
		},
		
		_validateForm: function(oFormData) {

			var oMessage;
			var status = true;

			sap.ui.getCore().getMessageManager().removeAllMessages();
			
			if (oFormData.Msehi.length < 1) {
				status = false;
				oMessage = new Message({
					message: "Empty Is not allowed.",
					type: MessageType.Error,
					target: "/Msehi",
					processor: this.getView().getModel("form")
				});
				sap.ui.getCore().getMessageManager().addMessages(oMessage);
			}
			
			if (oFormData.Text.length < 1) {
				status = false;
				oMessage = new Message({
					message: "Empty Is not allowed.",
					type: MessageType.Error,
					target: "/Text",
					processor: this.getView().getModel("form")
				});
				sap.ui.getCore().getMessageManager().addMessages(oMessage);
			}

			return status;
		},
		
		_deleteData: function(oData){
			var oModel = this.getModel();
			
			oModel.remove("/CookingUnitSet(Werks='" + this.PlantID + "',Msehi='" + oData.Msehi + "')",{
				method: "DELETE",
				success: function(data){
					MessageToast.show(_oBundle.getText("msgUnitCodeDeleted"));
				},
				error: function(e){
					var oMessage= JSON.parse(e.responseText).error.message.value;
    				MessageBox.error(oMessage);
					
				}
			});
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

		onValueHelpOkPress: function(oEvent) {
			// var oTable = this.byId("matcookunittbl"),
			// 	oViewModel = this.getModel("viewData");
				
				
		
			// var oBindingInfo = oTable.getBindingInfo("rows");	
			// 	console.log(oBindingInfo);	

			var aTokens = oEvent.getParameter("tokens");

			if (aTokens.length) {
				for (var i = 0; i < aTokens.length; i++) {
					var oObject = aTokens[i].data().row;
					var oRecord = {
						"Werks" : this.plantID,
						"Matnr" : oObject.Matnr,
						"Cookunit" : null,
						"Cookqty" : null,
						"Purcunit" : oObject.Bprme,
						"Purcqty" : oObject.Peinh,
						"MAKTX" : oObject.Matkl
					}
				}
			}
			this._oValueHelpDialog.close();
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
		
		
		
		__onRouteMatched: function(oEvent){
			var oArguments = oEvent.getParameter("arguments");
			this.PurchOrgID = oArguments.Ekorg;
			this.PlantID = oArguments.Werks;
			this.MatType = "F";
			
			this.oFilterPurchOrg = new Filter("Ekorg", FilterOperator.EQ, this.PurchOrgID); // Filter Material Type
			this.oFilterPlant = new Filter("Werks", FilterOperator.EQ, this.PlantID); // Filter Plant
			this.oFilterMatType = new Filter("Mtart", FilterOperator.StartsWith, this.MatType); // Filter Material Type
			
			this.aFilters = [this.oFilterPurchOrg, this.oFilterPlant, this.oFilterMatType];
		
			this.getView().bindElement({
				path: "/PlantSet('" + this.PlantID + "')"
			});
			
			this._refreshTable();
			
			
		},
		
		_refreshTable: function(){
			var oTable = this.byId("uomtbl");
			var oBinding = oTable.getBinding("rows");
			
			if (oBinding) {
				oBinding.filter([this.oFilterPlant],sap.ui.model.FilterType.Application);
			}
		},
		
		_initForm: function(){
			var oFormModel = this.getModel("form");
			
			var oFormData = {
					"Werks": "",
					"Msehi": "",
					"Text": ""
			};
			
			if (oFormModel) {
				oFormModel.setProperty("/", oFormData);
			} else {
				oFormModel = new JSONModel(oFormData);
				oFormModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
				this.setModel(oFormModel, "form");
				
			}
		},

	
		onExit: function() {
		
		}

	});

});