sap.ui.define([
	"halo/sap/mm/RECIPECOST/controller/BaseController",
	'sap/ui/model/json/JSONModel',
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/core/message/Message",
	"sap/ui/core/library",
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	'sap/ui/model/Sorter'

], function(BaseController, JSONModel, MessageBox, MessageToast, Message, library, Filter, FilterOperator,Sorter) {
	"use strict";
	var _oBundle;
	// shortcut for sap.ui.core.ValueState
	var ValueState = library.ValueState;

	// shortcut for sap.ui.core.MessageType
	var MessageType = library.MessageType;
	return BaseController.extend("halo.sap.mm.RECIPECOST.pages.controller.Recipes", {

		_formFragments: {},

		onInit: function() {

			var oView = this.getView();
			
			var oViewModel = new JSONModel({
				"IsFiltered" : false,
				"IsListSelected": false,
				"IsMultiSelected" : false,
				"Mode": ""
			});
			
			oView.setModel(oViewModel,"viewData");
	
			var oFormData = {
				"Name": "",
				"GroupID": "",
				"LocationID": "",
				"Quantity": 1.0
			};

			this.PurchOrgID = "C103";
			this.PlantID = "PPHS";

			this.oFilterWerks = new Filter("Werks", FilterOperator.EQ, this.PlantID);
			this.aFilterDefault = [this.oFilterWerks]; 
			                    
			
			var oFormModel = new JSONModel(oFormData);
			oFormModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
			this.setModel(oFormModel, "form");

			// set message model
			var oMessageManager = sap.ui.getCore().getMessageManager();
			oView.setModel(oMessageManager.getMessageModel(), "message");
			oMessageManager.registerObject(oView, true);
			
			
			//GroupBy functions
			this.mGroupFunctions = {
				LocationTxt: function(oContext) {
					var name = oContext.getProperty("LocationTxt");
					return {
						key: name,
						text: name
					};
				},
				GroupTxt: function(oContext) {
					var name = oContext.getProperty("GroupTxt");
					return {
						key: name,
						text: name
					};
				}
			
			};

			this.getOwnerComponent().getModel().metadataLoaded().then(function() {
				this._init();

			}.bind(this));

		},
		
		_init: function(){
			
			var oView = this.getView();
			_oBundle = this.getResourceBundle();

			var oTable = oView.byId("recipeTable");
			var oTemplate = oTable.getBindingInfo("items").template;
			
			
			oTable.bindAggregation("items", {
				path: "/RecipeSet",
				filters: this.aFilterDefault,
				sorter: new Sorter({path: 'Name', descending: true}),
				template: oTemplate
			});
			
			oTable.attachSelectionChange(this.onItemSelected, this);
		},
		
		onItemSelected: function(oEvent){
			var arrItems = oEvent.getSource().getSelectedItems();
			var oViewModel = this.getModel("viewData");
			
			sap.ui.getCore().getMessageManager().removeAllMessages();
			if (arrItems.length > 0 ){
				oViewModel.setProperty("/IsListSelected",true);
				
				if (arrItems.length > 1 ){
					
					oViewModel.setProperty("/IsMultiSelected",true);
				} else{
					oViewModel.setProperty("/IsMultiSelected",false);
				}
			
			} else{
				oViewModel.setProperty("/IsListSelected",false);
			}
			
			
		},
		
		onDeleteRecipe: function(){
			
			var oTable = this.getView().byId("recipeTable");
			var arrItems = oTable.getSelectedItems();
			var oViewModel = this.getModel("viewData");
			oViewModel.setProperty("/Mode","Delete");
			
			
			if (arrItems.length > 0){
				MessageBox.confirm(_oBundle.getText("msgCfrmDeleteRecipe"), {
					actions: ["Delete", MessageBox.Action.CANCEL],
					emphasizedAction: "CANCEL",
					onClose: function(sAction) {
						if (sAction === 'Delete') {
							this._deleteRecipe(arrItems);
						} 
					}.bind(this)

				});
			}
		
			
		},
		
		_deleteRecipe: function(arrItems){
			
			var oModel = this.getModel();

			sap.ui.getCore().getMessageManager().removeAllMessages();

			
			oModel.setDeferredGroups(["batchRecipeDelete"]);
			for(var i = 0 ; i < arrItems.length; i++){
				var oData = arrItems[i].getBindingContext().getObject();
				
				oModel.callFunction("/Func_RecipeDelete", {
					method: "POST",
					batchGroupId: "batchRecipeDelete",
					changeSetId: i,
					urlParameters: {
					"Werks" : oData.Werks,
					"RecipeID" :  oData.RecipeID
					
					}
				});
			}
			
			//Submitting the function import batch call
			oModel.submitChanges({
				batchGroupId: "batchRecipeDelete", //Same as the batch group id used previously
				success: function (oResponse) {
					
					var arrResponses = oResponse.__batchResponses;
					var bHasError = false;
					
					for( i = 0; i < arrResponses.length; i++){
						var oResponseData = arrResponses[i].__changeResponses[0].data;
						if (oResponseData.Type === 'E') {
							bHasError = true;
							var oMessage = new Message({
									message: oResponseData.Message,
									type: MessageType.Error,
									target: "",
									processor: ""
							});
							sap.ui.getCore().getMessageManager().addMessages(oMessage);
								
						}
					}
					if (bHasError){
						MessageBox.error( _oBundle.getText("msgErrRecipeDelete"), {
				          styleClass: "sapUiSizeCompact" 
				        });
					}
					
					this.getView().byId("recipeTable").getBinding("items").refresh();
				}.bind(this),
				error: function (e) {
					MessageToast.show("Error");
					//var sMsg = JSON.parse(e.responseText).error.message.value;
				}	
    			
			});
				
		},
		onAddRecipe: function() {
			var oViewModel = this.getModel("viewData");
			oViewModel.setProperty("/Mode","Add");
			
			this.showFormDialogFragment(this.getView(), this._formFragments, "halo.sap.mm.RECIPECOST.fragments.RecipeForm", this);
			
			
		
			// Filter Location List
			var oLocList = this.getView().byId("location");
			var oLocBinding = oLocList.getBinding("items");
			oLocBinding.filter(this.aFilterDefault, "Application");

			// Filter Location List
			var oGroupList = this.getView().byId("group");
			oGroupList.bindAggregation("items", {
					path: "/RecipeGroupSet",
					filters: this.aFilterDefault,
					sorter: new Sorter({path: 'Text', descending: true}),
					template: new sap.ui.core.ListItem({
						text: "{Text}",
						key: "{Groupid}"
					})
			});
		

		},
		
		onEditRecipe: function(){
			var oViewModel = this.getModel("viewData");
			oViewModel.setProperty("/Mode","Edit");
			
			var oTable = this.getView().byId("recipeTable");
			var arrItems = oTable.getSelectedItems();
			if (arrItems.length === 1){
				var oFormModel = this.getModel("form");
				var oFormData = oFormModel.getData();
				var oListData = arrItems[0].getBindingContext().getObject();
				oFormData.Name = oListData.Name;
				oFormData.GroupID = oListData.GroupID;
				oFormData.LocationID = oListData.LocationID;
				oFormData.Quantity = oListData.Quantity;
				oFormModel.setProperty("/",oFormData);
			}
			
			
			this.showFormDialogFragment(this.getView(), this._formFragments, "halo.sap.mm.RECIPECOST.fragments.RecipeForm", this);
			
			
			
			// Filter Location List
			var oLocList = this.getView().byId("location");
			var oLocBinding = oLocList.getBinding("items");
			oLocBinding.filter(this.aFilterDefault, "Application");

			// Filter Location List
			var oGroupList = this.getView().byId("group");
			oGroupList.bindAggregation("items", {
					path: "/RecipeGroupSet",
					filters: this.aFilterDefault,
					sorter: new Sorter({path: 'Text', descending: true}),
					template: new sap.ui.core.ListItem({
						text: "{Text}",
						key: "{Groupid}"
					})
			});
			
		},
		onSaveRecipe: function() {
			var oFormData = this.getView().getModel("form").getData();
			var oViewModel = this.getModel("viewData");
			var bMultiple = oViewModel.getProperty("/IsMultipleSelected");
			var sMode = oViewModel.getProperty("/Mode");

			if (this._validateRecipe(oFormData,bMultiple)) {

				MessageBox.confirm(_oBundle.getText("msgCfrmSaveRecipe"), {
					actions: ["Save", MessageBox.Action.CANCEL],
					emphasizedAction: "CANCEL",
					onClose: function(sAction) {
						if (sAction === 'Save') {
							if (sMode === "Add") {
								this._addRecipe(oFormData);
							} else {
								this._editRecipe(oFormData);
							}
							this.byId("addRecipeDialog").close();
						} else {
							this.byId("addRecipeDialog").close();
						}
					}.bind(this)

				});

			} else {
				MessageToast.show(_oBundle.getText("msgErrFormError"));
			}
		},
		onSelectRecipe: function(oEvent){
			var oItem = oEvent.getSource();
			var oBindingContext = oItem.getBindingContext();
			console.log(oBindingContext.getPath());
		},
		
		onSearchRecipe: function(oEvent){
			var aFilters = [];
			var sQuery = oEvent.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
				var filter = new Filter("Name", FilterOperator.Contains,sQuery);
				aFilters.push(filter);
			}
			
		
			
			this._ApplyFiltersAndSorting(aFilters,[]);
		
		},
		
	
		// onGroupChanged: function(oEvent){
		// 	var oItem = oEvent.getParameter("selectedItem");
			
		// 	var aFilter = [];
			
		// 	aFilter.push(new Filter("Werks", FilterOperator.EQ,  this.PlantID));
		// 	if (oItem) {
		// 		var selKey = oItem.getKey();
		// 		aFilter.push(new Filter("GroupID", FilterOperator.EQ,  selKey));
		// 	}
			
			
		// 	var oTable = this.byId("recipeTable");
		// 	var oBinding = oTable.getBinding("items");
		// 	oBinding.filter(aFilter);
			
			

		// },
		
		onMessagePopoverPress: function(oEvent) {
			var oSource = oEvent.getSource();

			this.showPopOverFragment(this.getView(), oSource, this._formFragments, "halo.sap.mm.RECIPECOST.fragments.MessagePopover", this);
		},

		onSelectImage: function(oEvent) {
			var oSource = oEvent.getSource();
			var oParent = oSource.getParent();
			var sPath = oParent.getBindingContext().getPath();

			this.showPopOverFragment(this.getView(), oSource, this._formFragments, "halo.sap.mm.RECIPECOST.fragments.ImageUploadPopover", this);

			this.byId("ImagePopover").bindElement({
				path: sPath
			});

		},

		onUploadImage: function() {
			var oUploader = this.byId("ImageUploader");

			var sPath = this.byId("ImagePopover").getBindingContext().getPath();

			sPath = sPath.replace("RecipeSet", "RecipeVersionSet") + "/Photo";


			if (!oUploader.getValue()) {
				MessageToast.show("Choose a file first");
				return;
			}
			
			oUploader.setUploadUrl("/sap/opu/odata/sap/zrecipecost_odata_srv" + sPath);

			oUploader.checkFileReadable().then(function() {
				oUploader.upload();
			}, function(error) {
				MessageToast.show("The file cannot be read. It may have changed.");
			}).then(function() {
				oUploader.clear();
			});
		},
		onImgUploaderClose: function() {
			var oPopOver = this.getFragmentByName(this._formFragments, "halo.sap.mm.RECIPECOST.fragments.ImageUploadPopover");
			oPopOver.close();
		},
		_addRecipe: function(oFormData) {
			var oModel = this.getModel();
			var oData = {
				"Werks": this.PlantID,
				"Name": oFormData.Name,
				"GroupID": oFormData.GroupID,
				"LocationID": oFormData.LocationID,
				"Quantity": "" + oFormData.Quantity

			};

			oModel.create("/RecipeSet", oData, {
				method: "POST",
				success: function(data) {
					MessageToast.show("Recipe Successfully Created");
				},
				error: function(e) {
					MessageToast.show("Error Detected");
				}
			});

		},
		
		_editRecipe: function(oFormData) {
			var oModel = this.getModel();
			var oTable = this.getView().byId("recipeTable");
			var arrItems = oTable.getSelectedItems();
			
			
			sap.ui.getCore().getMessageManager().removeAllMessages();
			
			oModel.setDeferredGroups(["batchRecipeUpdate"]);
			for(var i = 0 ; i < arrItems.length; i++){
				var oData = arrItems[i].getBindingContext().getObject();
				var sData = JSON.stringify({
					"Name": oFormData.Name,
					"GroupID": oFormData.GroupID,
					"LocationID": oFormData.LocationID,
					"Quantity": "" + oFormData.Quantity
				});
				
				oModel.callFunction("/Func_RecipeEdit", {
					method: "POST",
					batchGroupId: "batchRecipeUpdate",
					changeSetId: i,
					urlParameters: {
					"Werks" : oData.Werks,
					"RecipeID" :  oData.RecipeID,
					"RecipeData": "'" + sData + "'"
					}
				});
			}
			
			//Submitting the function import batch call
			oModel.submitChanges({
				batchGroupId: "batchRecipeUpdate", //Same as the batch group id used previously
				success: function (oResponse) {
					
					var arrResponses = oResponse.__batchResponses;
					var bHasError = false;
					
					for( i = 0; i < arrResponses.length; i++){
						var oResponseData = arrResponses[i].__changeResponses[0].data;
						if (oResponseData.Type === 'E') {
							bHasError = true;
							var oMessage = new Message({
									message: oResponseData.Message,
									type: MessageType.Error,
									target: "",
									processor: ""
							});
							sap.ui.getCore().getMessageManager().addMessages(oMessage);
								
						}
					}
					if (bHasError){
						MessageBox.error( _oBundle.getText("msgErrRecipeDelete"), {
				          styleClass: "sapUiSizeCompact" 
				        });
					}
					
					this.getView().byId("recipeTable").getBinding("items").refresh();
				}.bind(this),
				error: function (e) {
					MessageToast.show("Error");
					//var sMsg = JSON.parse(e.responseText).error.message.value;
				}	
    			
			});
	

		},
		_validateRecipe: function(oFormData,bMultiple) {

			var oMessage;
			var status = true;

			sap.ui.getCore().getMessageManager().removeAllMessages();
			if (! bMultiple) {
				if (oFormData.Name.length < 5) {
					status = false;
					oMessage = new Message({
						message: "Empty Is not allowed. Minimum 5 characters",
						type: MessageType.Error,
						target: "/Name",
						processor: this.getView().getModel("form")
					});
					sap.ui.getCore().getMessageManager().addMessages(oMessage);
				}
			}

			if (oFormData.GroupID.length < 1) {
				status = false;

				oMessage = new Message({
					message: "Empty Is not allowed",
					type: MessageType.Error,
					target: "/GroupID",
					processor: this.getView().getModel("form")
				});
				sap.ui.getCore().getMessageManager().addMessages(oMessage);
			}

			if (oFormData.LocationID.length < 1) {
				status = false;

				oMessage = new Message({
					message: "Empty Is not allowed",
					type: MessageType.Error,
					target: "/LocationID",
					processor: this.getView().getModel("form")
				});
				sap.ui.getCore().getMessageManager().addMessages(oMessage);
			}

			return status;
		},

		onCancelRecipe: function() {
			this.byId("addRecipeDialog").close();
		},
		
		onSettingDialog: function(){
			this.showFormDialogFragment(this.getView(),this._formFragments,"halo.sap.mm.RECIPECOST.fragments.RecipeSettingDialog", this);
			
			// Group List
			var oGroupList = this.byId("VSFGroup");
			oGroupList.bindAggregation("items", {
					path: "/RecipeGroupSet",
					filters: this.aFilterDefault,
					sorter: new Sorter({path: 'Text', descending: true}),
					template: new sap.m.ViewSettingsItem({
						text: "{Text}",
						key: "GroupID___EQ___" + "{Groupid}" + "___X"
					})
			});
			
		},
		onSettingConfirm: function(oEvent){
			var mParams = oEvent.getParameters();
		
			var sPath = mParams.sortItem.getKey(),
				bDescending = mParams.sortDescending,
				aSorters = [],
				vGroup;
			var aFilters = [];
			
			if (mParams.groupItem) {
				sPath = mParams.groupItem.getKey();
				
				bDescending = mParams.groupDescending;
				vGroup = this.mGroupFunctions[sPath];
				aSorters.push(new Sorter(sPath, bDescending, vGroup));
				// apply the selected group settings
			
			} else {
				aSorters.push(new Sorter(sPath, bDescending));	
			}
			
			mParams.filterItems.forEach(function(oItem) {
				var aSplit = oItem.getKey().split("___"),
					fPath = aSplit[0],
					sOperator = aSplit[1],
					sValue1 = aSplit[2],
					sValue2 = aSplit[3],
					oFilter = new Filter(fPath, sOperator, sValue1, sValue2);
				aFilters.push(oFilter);
			});

		
			this._ApplyFiltersAndSorting(aFilters,aSorters);
			
		},
		
		
		_ApplyFiltersAndSorting: function(aFilters,aSorters){
			
			var oViewModel = this.getModel("viewData");
			if (aFilters.length < 1){
				oViewModel.setProperty("/IsFiltered", false);
			} else {
				oViewModel.setProperty("/IsFiltered", true);
			}
			
			//Apply Default Filters
			for (var i = 0; i < this.aFilterDefault.length; i++) {
				aFilters.push(this.aFilterDefault[i]);
			}
			
			
			
			// update list binding
			var oTable = this.byId("recipeTable");
			var oBinding = oTable.getBinding("items");
			if (oBinding) {
				oBinding.filter(aFilters).sort(aSorters);
			}
		},
		
		onExit: function() {

			this.removeFragment(this._formFragments);
		}

	});

});