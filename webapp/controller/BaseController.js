sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel",
	"sap/base/util/UriParameters",
	"sap/f/library",
	"sap/f/FlexibleColumnLayoutSemanticHelper"
], function(Controller, History, UIComponent,JSONModel,UriParameters,library,FlexibleColumnLayoutSemanticHelper) {
	"use strict";
	
	
	return Controller.extend("uol.bpc.ManageVDT.controller.BaseController", {

		LayoutType : library.LayoutType,
	
		getRouter : function () {
			return UIComponent.getRouterFor(this);
		},
		
		getModel : function (sName) {
			return this.getView().getModel(sName);
		},
		
		setModel : function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},
		
		getResourceBundle : function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},
			
		onNavBack : function() {
				var sPreviousHash = History.getInstance().getPreviousHash();

					if (sPreviousHash !== undefined) {
					history.go(-1);
				} else {
					this.getRouter().navTo("home", {}, true);
				}
		},
		
		
		
		getFormFragment: function (oView, _formFragments, sFragmentName,oThis) {
			var oFormFragment = _formFragments[sFragmentName];
		
			if (oFormFragment) {
				
				return oFormFragment;
			}
		
			oFormFragment = sap.ui.xmlfragment(oView.getId(), sFragmentName,oThis);
			oView.addDependent(oFormFragment);
			
			var myFragment = (_formFragments[sFragmentName] = oFormFragment);
			return myFragment;
		},
		
		showPopOverFragment : function(oView,oSource, _formFragments,sFragmentName,oThis) {
			this.getFormFragment(oView, _formFragments,sFragmentName,oThis).openBy(oSource);
		},

		showFormDialogFragment : function (oView, _formFragments,sFragmentName,oThis) {
			this.getFormFragment(oView, _formFragments,sFragmentName,oThis).open();
		},
		
		showFormFragment : function (oView,containerId,_formFragments,sFragmentName,bClearMode) {
			var oContainer = this.getView().byId(containerId);
			
			
			if (bClearMode){
				if (oContainer instanceof sap.f.GridContainer ){
					
					oContainer.removeAllItems();
				} else {
					oContainer.removeAllContent();
				}
			}
			
			if (oContainer instanceof sap.f.GridContainer ){
				oContainer.addItem(this.getFormFragment(oView,_formFragments,sFragmentName));
			} else {
				oContainer.insertContent(this.getFormFragment(oView,_formFragments,sFragmentName));
			}
			
			
		},
		removeFragment: function(_formFragments){
			for(var sPropertyName in _formFragments) {
				if(!_formFragments.hasOwnProperty(sPropertyName)) {
					return;
				}
	
				_formFragments[sPropertyName].destroy();
				_formFragments[sPropertyName] = null;
			}
		},
		
		getFCLHelper: function () {
			var oFCL = this.byId("fcl"),
				oParams = UriParameters.fromQuery(location.search),
				oSettings = {
					defaultTwoColumnLayoutType: this.LayoutType.TwoColumnsMidExpanded,
					defaultThreeColumnLayoutType: this.LayoutType.ThreeColumnsMidExpanded,
					mode: oParams.get("mode"),
					maxColumnsCount: oParams.get("max")
				};

			return FlexibleColumnLayoutSemanticHelper.getInstanceFor(oFCL, oSettings);
		}

	});

});