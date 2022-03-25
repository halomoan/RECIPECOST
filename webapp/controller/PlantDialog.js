sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/core/Core",
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	'sap/ui/model/Sorter'
], function (Object,Core,Filter,FilterOperator,Sorter) {
	"use strict";
	return Object.extend("halo.sap.mm.RECIPECOST.controller.PlantDialog", {
		_init: function(){
			var oPlantList = Core.byId("cboPlant");
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
						
						var aItems = oPlantList.getItems();
						oPlantList.setSelectedItem(aItems[0]);
						oPlantList.fireSelectionChange();
					}
				}
			});
		},
		_getDialog : function () {
			
			// create dialog lazily
			if (!this._oDialog) {
				// create dialog via fragment factory
				this._oDialog = sap.ui.xmlfragment("halo.sap.mm.RECIPECOST.fragments.PlantDialog", this);
				this._init();
			}
			return this._oDialog;
		},
		open : function (oView, that, callback) {
			var oDialog = this._getDialog();
			// connect dialog to view (models, lifecycle)
			oView.addDependent(oDialog);
			
			this.fcallback = callback;
			this.oThat = that;
			
			// open dialog
			oDialog.open();
		},
		onPlantChange : function(oEvent){
			var oSource = oEvent.getSource();
			
			var oItem = oSource.getSelectedItem();
			if (!oItem) return;
			var oPlant = oItem.getBindingContext().getObject();
			
			var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			oStorage.put("Plant", oPlant);
		},
		onCloseDialog : function () {
			this.fcallback(this.oThat);
			this._getDialog().close();
		}
	});
});