sap.ui.define([
	"halo/sap/mm/RECIPECOST/controller/BaseController",
	'sap/ui/model/json/JSONModel',
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/core/message/Message",
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	'sap/ui/model/Sorter'

], function(BaseController, JSONModel, MessageBox, MessageToast, Message, Filter, FilterOperator, Sorter) {
	"use strict";
	var _oBundle;

	return BaseController.extend("halo.sap.mm.RECIPECOST.pages.controller.Recipes", {

		_formFragments: {},

		onInit: function() {

			var oView = this.getView();

			var oViewModel = new JSONModel({
				"ImagePopUpPos": "Right",
				"IsFiltered": false,
				"IsListSelected": false,
				"IsMultiSelected": false,
				"ShowCopy": false,
				"StickyOptions": ["HeaderToolbar", "ColumnHeaders"],
				"Mode": ""
			});

			oView.setModel(oViewModel, "viewData");

			var oFormData = {
				"Name": "",
				"GroupID": "",
				"LocationID": "",
				"Qty": 1.0,
				"VideoLink": ""
			};

			this.PurchOrgID = "";
			this.PlantID = "";

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
			
			//RecipeGroup Filter List
			this.oFilterStatID = new Filter("StatID", FilterOperator.EQ, "RecipeByGroup");

			_oBundle = this.getResourceBundle();

			this.aUserSorter = [new Sorter({
				path: 'Name',
				descending: true,
				group: this.mGroupFunctions['GroupTxt']
			})];

			this._oRouter = this.getRouter();
			this._oRouter.getRoute("recipes").attachPatternMatched(this.__onRouteMatched, this);
		},

		_refreshList: function() {

			var oView = this.getView();
			var oTable = oView.byId("recipeTable");
			var oTemplate = oTable.getBindingInfo("items").template;

			oTable.bindAggregation("items", {
				path: "/RecipeSet",
				filters: [...this.aFilterDefault, this.oFilterGroupID],
				sorter: this.aUserSorter,
				template: oTemplate
			});

			oTable.attachSelectionChange(this.onItemSelected, this);
		},

		__onRouteMatched: function(oEvent) {
			
			var oArguments = oEvent.getParameter("arguments");
			this.PurchOrgID = oArguments.Ekorg;
			this.PlantID = oArguments.Werks;
			this.GroupID = oArguments.GroupID;

			this.oFilterWerks = new Filter("Werks", FilterOperator.EQ, this.PlantID);
			this.oFilterGroupID = new Filter("GroupID", FilterOperator.EQ, this.GroupID);
			
			this.aFilterDefault = [this.oFilterWerks];

			this.getOwnerComponent().getModel().metadataLoaded().then(function() {
				this._refreshList();

			}.bind(this));
		},

		onNavBack: function(oEvent) {
			this.navBack();
		},
		onItemSelected: function(oEvent) {
			var arrItems = oEvent.getSource().getSelectedItems();
			var oViewModel = this.getModel("viewData");

			sap.ui.getCore().getMessageManager().removeAllMessages();
			if (arrItems.length > 0) {
				oViewModel.setProperty("/IsListSelected", true);

				if (arrItems.length > 1) {

					oViewModel.setProperty("/IsMultiSelected", true);
				} else {
					oViewModel.setProperty("/IsMultiSelected", false);
				}

			} else {
				oViewModel.setProperty("/IsListSelected", false);
			}

			if (arrItems.length === 1) {
				oViewModel.setProperty("/ShowCopy", true);
			} else {
				oViewModel.setProperty("/ShowCopy", false);
			}

		},

		onDeleteRecipe: function() {

			var oTable = this.getView().byId("recipeTable");
			var arrItems = oTable.getSelectedItems();
			var oViewModel = this.getModel("viewData");
			oViewModel.setProperty("/Mode", "Delete");

			if (arrItems.length > 0) {
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

		_deleteRecipe: function(arrItems) {

			var oModel = this.getModel();

			sap.ui.getCore().getMessageManager().removeAllMessages();

			oModel.setDeferredGroups(["batchRecipeDelete"]);
			for (var i = 0; i < arrItems.length; i++) {
				var oData = arrItems[i].getBindingContext().getObject();

				oModel.callFunction("/Func_RecipeDelete", {
					method: "POST",
					batchGroupId: "batchRecipeDelete",
					changeSetId: i,
					urlParameters: {
						"Werks": oData.Werks,
						"RecipeID": oData.RecipeID

					}
				});
			}

			//Submitting the function import batch call
			oModel.submitChanges({
				batchGroupId: "batchRecipeDelete", //Same as the batch group id used previously
				success: function(oResponse) {

					var arrResponses = oResponse.__batchResponses;
					var bHasError = false;

					for (i = 0; i < arrResponses.length; i++) {
						var oResponseData = arrResponses[i].__changeResponses[0].data;
						if (oResponseData.Type === 'E') {
							bHasError = true;
							var oMessage = new Message({
								message: oResponseData.Message,
								type: "Error",
								target: "",
								processor: ""
							});
							sap.ui.getCore().getMessageManager().addMessages(oMessage);

						}
					}
					if (bHasError) {
						MessageBox.error(_oBundle.getText("msgErrRecipeDelete"), {
							styleClass: "sapUiSizeCompact"
						});
					}

					this.getView().byId("recipeTable").getBinding("items").refresh();
				}.bind(this),
				error: function(e) {
					MessageToast.show("Error");
					//var sMsg = JSON.parse(e.responseText).error.message.value;
				}

			});

		},
		onAddRecipe: function() {
			var oViewModel = this.getModel("viewData");
			oViewModel.setProperty("/Mode", "Add");
			var oFormModel = this.getModel("form");
			var oFormData = oFormModel.getData();
			

			oFormData.RecipeID = "";
			oFormData.Name = null;
			oFormData.GroupID = null;
			oFormData.LocationID = null;
			oFormData.Qty = 1;
			oFormData.IsSubMaterial = false;
			oFormData.VideoLink = "";

			oFormModel.setProperty("/", oFormData);

			this.showFormDialogFragment(this.getView(), this._formFragments, "halo.sap.mm.RECIPECOST.fragments.RecipeForm", this);

			// Filter Location List
			
			var oLocList = this.getView().byId("location");
			var oLocBinding = oLocList.getBinding("items");
			oLocBinding.filter(this.aFilterDefault, "Application");

			// Filter Location List
			
			var oGroupList = this.getView().byId("group");
			oGroupList.bindAggregation("items", {
				path: "/RecipeGroupSet",
				filters: [...this.aFilterDefault,this.oFilterGroupID],
				sorter: new Sorter({
					path: 'Text',
					descending: true
				}),
				template: new sap.ui.core.ListItem({
					text: "{Text}",
					key: "{GroupID}"
				})
			});

		},

		onCopyRecipe: function() {
			var oViewModel = this.getModel("viewData");
			oViewModel.setProperty("/Mode", "Copy");
			var oTable = this.getView().byId("recipeTable");
			var arrItems = oTable.getSelectedItems();

			if (arrItems.length === 1) {
				var oFormModel = this.getModel("form");
				var oFormData = oFormModel.getData();
				var oListData = arrItems[0].getBindingContext().getObject();

				oFormData.RecipeID = oListData.RecipeID;
				oFormData.Name = oListData.Name;
				oFormData.GroupID = oListData.GroupID;
				oFormData.LocationID = oListData.LocationID;
				oFormData.Qty = oListData.Qty;
				oFormData.IsSubMaterial = oListData.IsSubMaterial;
				oFormData.VideoLink = oListData.VideoLink;

				oFormModel.setProperty("/", oFormData);

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
					sorter: new Sorter({
						path: 'Text',
						descending: true
					}),
					template: new sap.ui.core.ListItem({
						text: "{Text}",
						key: "{GroupID}"
					})
				});
				
			} else {
				MessageBox.error(_oBundle.getText("msgErrSelect1Recipe"));
			}
		},

		onEditRecipe: function() {
			var oViewModel = this.getModel("viewData");
			oViewModel.setProperty("/Mode", "Edit");

			var oTable = this.getView().byId("recipeTable");
			var arrItems = oTable.getSelectedItems();
			if (arrItems.length === 1) {
				var oFormModel = this.getModel("form");
				var oFormData = oFormModel.getData();
				var oListData = arrItems[0].getBindingContext().getObject();
				oFormData.Name = oListData.Name;
				oFormData.GroupID = oListData.GroupID;
				oFormData.LocationID = oListData.LocationID;
				oFormData.Qty = oListData.Qty;
				oFormData.IsSubMaterial = oListData.IsSubMaterial;
				oFormData.VideoLink = oFormData.VideoLink;
				
				oFormModel.setProperty("/", oFormData);
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
				sorter: new Sorter({
					path: 'Text',
					descending: true
				}),
				template: new sap.ui.core.ListItem({
					text: "{Text}",
					key: "{GroupID}"
				})
			});

		},
		onChangeGrpRecipe: function(){
			var oViewModel = this.getModel("viewData");
			oViewModel.setProperty("/Mode", "ChangeGrp");
			
			this.showFormDialogFragment(this.getView(), this._formFragments, "halo.sap.mm.RECIPECOST.fragments.RecipeGroup", this);
			
			var oList = this.byId("repicegroupGrid");
			
			oList.getBinding("items").filter([this.oFilterStatID, this.oFilterWerks]);
			
			
		},
		
		onRecipeGroupSearch: function(oEvent){
			var oList = this.byId("repicegroupGrid");
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter("Label", FilterOperator.Contains, sValue);
			var oBinding = oEvent.getParameter("itemsBinding");
			oBinding.filter([oFilter],sap.ui.model.FilterType.Application);
		},
		
		onRecipeGroupConfirm: function(oEvent){
		
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				
				var sGroupID = aContexts[0].getObject().SecondID;
				var sGroupLabel = aContexts[0].getObject().Label;
				
				var oModel = this.getModel();
				var oTable = this.getView().byId("recipeTable");
				var mParameters = {
					method: "PUT",
					groupId: "batchRecipeUpdate",
					success: function(oResponse) {
					
	
					},
					error: function(e) {
						var sMsg = JSON.parse(e.responseText).error.message.value;
						var oMessage = new Message({
							message: sMsg,
							type: "Error",
							target: "",
							processor: ""
						});
						sap.ui.getCore().getMessageManager().addMessages(oMessage);
						MessageToast.show("Error Detected");
					}
	
				};
			
				MessageBox.confirm(_oBundle.getText("msgCfrmChgRecipeGrp",sGroupLabel),{
					actions: ["Yes", MessageBox.Action.CLOSE],
					onClose: function(sAction){
						if (sAction == "Yes") {
							
							
							var arrItems = oTable.getSelectedItems();
							
							oModel.setUseBatch(true);
							oModel.setDeferredGroups(["batchRecipeUpdate"]);
							
							for(var i = 0; i < arrItems.length; i++){
								var oData = arrItems[i].getBindingContext().getObject();
								oData.GroupID = sGroupID;
								oData.GroupTxt = sGroupLabel;
								console.log(oData);
								oModel.update("/RecipeSet(Werks='" + oData.Werks + "',RecipeID='" + oData.RecipeID + "')", oData, mParameters);
								
							}
							//Submitting the function import batch call
							oModel.submitChanges(mParameters);
						}
					}
				});
			} 
			
		
			
			oEvent.getSource().getBinding("items").filter([],sap.ui.model.FilterType.Application);
		},
		
		onRecipeGroupCancel: function(oEvent){
			oEvent.getSource().getBinding("items").filter([],sap.ui.model.FilterType.Application);
		},
		
		onSaveRecipe: function() {
			var oFormData = this.getView().getModel("form").getData();
			var oViewModel = this.getModel("viewData");
			var bMultiple = oViewModel.getProperty("/IsMultiSelected");
			var sMode = oViewModel.getProperty("/Mode");

			if (this._validateRecipe(oFormData, bMultiple)) {

				MessageBox.confirm(_oBundle.getText("msgCfrmSaveRecipe"), {
					actions: ["Save", MessageBox.Action.CANCEL],
					emphasizedAction: "CANCEL",
					onClose: function(sAction) {
						if (sAction === 'Save') {
							if (sMode === "Add" || sMode === "Copy") {
								this._addRecipe(oFormData, sMode);
							} else {
								this._editRecipe(oFormData);
							}
							this.byId("addRecipeDialog").close();

						}
					}.bind(this)

				});

			} else {
				MessageToast.show(_oBundle.getText("msgErrFormError"));
			}
		},
		onSelectRecipe: function(oEvent) {
			var oItem = oEvent.getSource();
			var oListItem = oItem.getBindingContext().getObject();

			this._oRouter.navTo("ingredientform", {
				Ekorg: oListItem.Ekorg,
				Werks: oListItem.Werks,
				RecipeID: oListItem.RecipeID
			});
		},

		onSearchRecipe: function(oEvent) {
			var aFilters = [];
			var sQuery = oEvent.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
				var filter = new Filter({
					filters: [
						new Filter("RecipeID", FilterOperator.Contains, sQuery),
						new Filter("Name", FilterOperator.Contains, sQuery)
					],
					and: false
				});
				aFilters.push(filter);
			}

			this._ApplyFiltersAndSorting(aFilters, []);

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
			
			
			var sPhotoPath = "/sap/opu/odata/sap/zrecipecost_odata_srv" + sPath.replace("RecipeSet","RecipePhotoSet") + "/$value?" + "?" + new Date().getTime();
			var oPreviewImage = this.byId("imgPreview");
			oPreviewImage.setSrc(sPhotoPath);
			this._imageSelected = oSource;
			
		},

		onUploadImage: function() {
			var oUploader = this.byId("ImageUploader");
			var sPath = this.byId("ImagePopover").getBindingContext().getPath();
			sPath = sPath  + "/Photo";


			if (!oUploader.getValue()) {
				MessageToast.show("Choose a file first");
				return;
			}
			
			oUploader.setUploadUrl("/sap/opu/odata/SAP/ZRECIPECOST_ODATA_SRV" + sPath);

			oUploader.checkFileReadable().then(function() {
				var csrfToken = this.getView().getModel().oHeaders['x-csrf-token'];
				oUploader.setSendXHR(true);
				var headerParma = new sap.ui.unified.FileUploaderParameter();
					headerParma.setName('x-csrf-token');
					headerParma.setValue(csrfToken);

					oUploader.addHeaderParameter(headerParma);
				oUploader.upload();
			}.bind(this), function(error) {
				MessageToast.show("The file cannot be read. It may have changed.");
			}).then(function() {
				oUploader.clear();
			});
		},
		
		onUploadComplete: function(){
			
			this._imageSelected.setSrc( this._imageSelected.getSrc() + "?" + new Date().getTime());
			var oPopOver = this.getFragmentByName(this._formFragments, "halo.sap.mm.RECIPECOST.fragments.ImageUploadPopover");
			oPopOver.close();
			
			
			
		},
		onImgUploaderClose: function() {
			var oPopOver = this.getFragmentByName(this._formFragments, "halo.sap.mm.RECIPECOST.fragments.ImageUploadPopover");
			oPopOver.close();
		},
		_addRecipe: function(oFormData, sMode) {
			var oModel = this.getModel();
			var oData = {
				"Werks": this.PlantID,
				"RecipeID": oFormData.RecipeID,
				"Name": oFormData.Name,
				"Ekorg": this.PurchOrgID,
				"GroupID": oFormData.GroupID,
				"LocationID": oFormData.LocationID,
				"Qty": "" + oFormData.Qty,
				"IsSubMaterial": oFormData.IsSubMaterial,
				"VideoLink" : oFormData.VideoLink

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
			var mParameters = {
				method: "PUT",
				groupId: "batchRecipeUpdate",
				success: function(oResponse) {

					// var arrResponses = oResponse.__batchResponses;
					// var bHasError = false;

					// for( var i = 0; i < arrResponses.length; i++){
					// 	var oResponseData = arrResponses[i].__changeResponses[0].data;
					// 	if (oResponseData.Type === 'E') {
					// 		bHasError = true;
					// 		var oMessage = new Message({
					// 				message: oResponseData.Message,
					// 				type: "Error",
					// 				target: "",
					// 				processor: ""
					// 		});
					// 		sap.ui.getCore().getMessageManager().addMessages(oMessage);

					// 	}
					// }
					// if (bHasError){
					// 	MessageBox.error( _oBundle.getText("msgErrRecipeDelete"), {
					//         styleClass: "sapUiSizeCompact" 
					//       });
					// }

				},
				error: function(e) {
					var sMsg = JSON.parse(e.responseText).error.message.value;
					var oMessage = new Message({
						message: sMsg,
						type: "Error",
						target: "",
						processor: ""
					});
					sap.ui.getCore().getMessageManager().addMessages(oMessage);
					MessageToast.show("Error Detected");
				}

			};

			sap.ui.getCore().getMessageManager().removeAllMessages();

			oModel.setUseBatch(true);
			oModel.setDeferredGroups(["batchRecipeUpdate"]);

			for (var i = 0; i < arrItems.length; i++) {
				var oData = arrItems[i].getBindingContext().getObject();
				if (arrItems.length === 1) {
					oData.Name = oFormData.Name;
					oData.VideoLink = oFormData.VideoLink;
				}
				if (oFormData.GroupID) {
					oData.GroupID = oFormData.GroupID;
				}
				if (oFormData.LocationID) {
					oData.LocationID = oFormData.LocationID;
				}
				if (oFormData.Qty) {
					oData.Qty = "" + oFormData.Qty;
				}
				oData.Ekorg = this.PurchOrgID;

				oData.IsSubMaterial = oFormData.IsSubMaterial;

				oModel.update("/RecipeSet(Werks='" + oData.Werks + "',RecipeID='" + oData.RecipeID + "')", oData, mParameters);

			}

			//Submitting the function import batch call
			oModel.submitChanges(mParameters);

		},
		_validateRecipe: function(oFormData, bMultiple) {

			var oMessage;
			var status = true;

			sap.ui.getCore().getMessageManager().removeAllMessages();

			if (bMultiple) {
				return true;
			}

			if (oFormData.Name.length < 5) {
				status = false;
				oMessage = new Message({
					message: "Empty Is not allowed. Minimum 5 characters",
					type: "Error",
					target: "/Name",
					processor: this.getView().getModel("form")
				});
				sap.ui.getCore().getMessageManager().addMessages(oMessage);
			}

			if (oFormData.GroupID.length < 1) {
				status = false;

				oMessage = new Message({
					message: "Empty Is not allowed",
					type: "Error",
					target: "/GroupID",
					processor: this.getView().getModel("form")
				});
				sap.ui.getCore().getMessageManager().addMessages(oMessage);
			}

			if (oFormData.LocationID.length < 1) {
				status = false;

				oMessage = new Message({
					message: "Empty Is not allowed",
					type: "Error",
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

		onSettingDialog: function() {
			this.showFormDialogFragment(this.getView(), this._formFragments, "halo.sap.mm.RECIPECOST.fragments.RecipeSettingDialog", this);

			// Group List
			var oGroupList = this.byId("VSFGroup");
			oGroupList.bindAggregation("items", {
				path: "/RecipeGroupSet",
				filters: this.aFilterDefault,
				sorter: new Sorter({
					path: 'Text',
					descending: true
				}),
				template: new sap.m.ViewSettingsItem({
					text: "{Text}",
					key: "GroupID___EQ___" + "{Groupid}" + "___X"
				})
			});

			// Group List
			var oLocationList = this.byId("VSFLocation");
			oLocationList.bindAggregation("items", {
				path: "/LocationSet",
				filters: this.aFilterDefault,
				sorter: new Sorter({
					path: 'Text',
					descending: true
				}),
				template: new sap.m.ViewSettingsItem({
					text: "{Text}",
					key: "LocationID___EQ___" + "{LocationID}" + "___X"
				})
			});

		},
		onSettingConfirm: function(oEvent) {
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

			} else {
				aSorters.push(new Sorter(sPath, bDescending));
			}
			this.aUserSorter = aSorters;

			mParams.filterItems.forEach(function(oItem) {

				var aSplit = oItem.getKey().split("___"),
					fPath = aSplit[0],
					sOperator = aSplit[1],
					sValue1 = aSplit[2],
					sValue2 = aSplit[3],
					oFilter = new Filter(fPath, sOperator, sValue1, sValue2);
				aFilters.push(oFilter);
			});

			this._ApplyFiltersAndSorting(aFilters, aSorters);

		},

		_ApplyFiltersAndSorting: function(aFilters, aSorters) {

			var oViewModel = this.getModel("viewData");
			if (aFilters.length < 1) {
				oViewModel.setProperty("/IsFiltered", false);
			} else {
				oViewModel.setProperty("/IsFiltered", true);
			}

			//Apply Default Filters
			// for (var i = 0; i < this.aFilterDefault.length; i++) {
			// 	aFilters.push(this.aFilterDefault[i]);
			// }

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