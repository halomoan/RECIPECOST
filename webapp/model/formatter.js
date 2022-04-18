sap.ui.define([
		"sap/ui/core/format/NumberFormat"
	
	], function (NumberFormat) {
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
		},
		NoDecimal: function(iNumber){
			if (iNumber) {
				var oFloatNumberFormat = NumberFormat.getFloatInstance({
					maxFractionDigits: 0,
					minFractionDigits: 0,
					groupingEnabled: true
				}, sap.ui.getCore().getConfiguration().getLocale());

				return oFloatNumberFormat.format(iNumber);
			} else {
				return 0;
			}

		},
		SpaceInBetween: function(sValue1,sValue2){
			return sValue1 + " " + sValue2;
		}
	};
});