sap.ui.define([
	"halo/sap/mm/RECIPECOST/controller/BaseController"
], function(BaseController) {
	"use strict";

	return BaseController.extend("halo.sap.mm.RECIPECOST.pages.controller.MasterDetail", {
		onInit: function() {
			this._oRouter =  this.getRouter();
		},
		
		onSideMenuSelect: function(oEvent){
			var oItem = oEvent.getParameter("item"),
				//oCtx = oItem.getBindingContext(),
				//sMenu = oItem.getText(),
				sTarget = oItem.getTarget();
				
			switch(sTarget){
				case "G001:RECIPES":			
					this._oRouter.navTo("recipehome"); break;
				case "G001:IMAGEEDITOR":			
					this._oRouter.navTo("imageeditor"); break;	
				case "G002:RPTRANGE":	
					this._oRouter.navTo("rptrange"); break;	
				case "SAPG1:PLANT":			
					this._oRouter.navTo("planttopurchorg"); break;
				default:
					this._oRouter.navTo("notFound");break;
			}
		},
		
		onFixMenuSelect: function(oEvent){
			var oItem = oEvent.getParameter("item"),
				sTarget = oItem.getTarget();
		
					
			switch(sTarget){
				case "GROUP":			
					this._oRouter.navTo("recipegroup"); break;
				case "LOCATION":
					this._oRouter.navTo("recipeloc"); break;
					
				default:
					this._oRouter.navTo("notFound");break;
			}		
					
		},
		onToggleSideNavPress: function(oEvent) {
			var oToolPage = this.byId("toolPage");
			var bSideExpanded = oToolPage.getSideExpanded();

			this._setToggleButtonTooltip(bSideExpanded);

			oToolPage.setSideExpanded(!oToolPage.getSideExpanded());
		},
		
		_setToggleButtonTooltip: function(bLarge) {
			var oToggleButton = this.byId('sideNavigationToggleButton');
			if (bLarge) {
				oToggleButton.setTooltip('Expand');
			} else {
				oToggleButton.setTooltip('Collapse');
			}
		}
	});
});