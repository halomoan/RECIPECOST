sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"halo/sap/mm/RECIPECOST/model/models",
	"halo/sap/mm/RECIPECOST/controller/PlantDialog"
], function(UIComponent, Device, models, PlantDialog) {
	"use strict";

	return UIComponent.extend("halo.sap.mm.RECIPECOST.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function() {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			
			//init Router
			this.getRouter().initialize();
			
			//Plant Dialog
			
			this.plantDialog = new PlantDialog();
		}
	});
});