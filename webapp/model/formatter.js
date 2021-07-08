sap.ui.define([
	
	], function () {
	"use strict";
	return {
		YYYYMMDD: function (oDate) {
			var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({pattern: "yyyyMMdd"});
			return oDateFormat.format(oDate);
		},
		oDateDate: function(oDate){
			//return sap.ui.model.odata.ODataUtils.formatValue(oDate, "Edm.DateTime");
			
			var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({pattern: "yyyy-MM-ddT00:00:00"});
			return oDateFormat.format(oDate);
		}
	};
});