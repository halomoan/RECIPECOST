sap.ui.define([
	"halo/sap/mm/RECIPECOST/controller/BaseController",
	'sap/ui/model/json/JSONModel'
], function(BaseController,JSONModel) {
	"use strict";

	return BaseController.extend("halo.sap.mm.RECIPECOST.pages.controller.RptSellPrice", {

	
		onInit: function() {
			var oViewData = {
				"SPR": [1,100]
			};
			
			var oViewModel = new JSONModel(oViewData);
			this.setModel(oViewModel, "viewData");	
		}

		

	});

});