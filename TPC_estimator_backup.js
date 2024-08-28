/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/record', 'N/search', 'N/ui/message','N/log', 'N/cache', '../Dao/div_tpc_cls_createEstimates.js', 'N/runtime', '../Lib/div_tpc_constant.js','N/file'],
    (ui, record, search, message,log, cache, CLSCreateEstimate, runtime, constants,file) => {
        var copySublist;
        const onRequest = (context) => {
            try {
                var request = context.request;
                var response = context.response;
                var params = request.parameters;

                if (request.method === 'GET') {
                    getHandler(request, response, params);
                } else {
                    postHandler(request, response, params);
                }
            } catch (e) {
                response.writeLine({ output: 'Error: ' + e.name + ' , Details: ' + e.message });
            }
        }
        function getHandler(request, response, params) {
            var form = ui.createForm({
                title: constants.ESTIMATOR.TITLE
            });

            form.clientScriptModulePath = constants.ESTIMATOR.CLIENT_SCRIPT_PATH;
            var scriptObj = runtime.getCurrentScript();
            // Add Primary Information Group
            var primaryInfoGroup = form.addFieldGroup({
                id: 'custpage_primary_info_group',
                label: 'Primary Information'
            });

            var customerField = form.addField({
                id: constants.ESTIMATOR.FIELDS.CUSTOMER,
                label: 'Contracting Client',
                type: ui.FieldType.SELECT,
                source: 'customer',
                container: 'custpage_primary_info_group'
            });
            customerField.defaultValue = params.customer;
            customerField.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });
            customerField.isMandatory = true;

            var existSysIdCB = form.addField({
                id: constants.ESTIMATOR.FIELDS.EXISTING_ID_CB,
                label: 'Existing Estimator ID',
                type: ui.FieldType.CHECKBOX,
                container: 'custpage_primary_info_group'
            });
            existSysIdCB.defaultValue = params.e === '1' ? 'T' : 'F';
            existSysIdCB.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });

            var rollOutCb = form.addField({
                id: constants.ESTIMATOR.FIELDS.ROLL_CB,
                label: 'Roll Out Project',
                type: ui.FieldType.CHECKBOX,
                container: 'custpage_primary_info_group'
            });
            rollOutCb.defaultValue = params.rol === '1' ? 'T' : 'F';

            var autoNum = autoGenerateId();

            // Add fields to the form
            var systemIdTextFld = form.addField({
                id: constants.ESTIMATOR.FIELDS.ID,
                label: 'Estimator ID',
                type: ui.FieldType.TEXT,
                container: 'custpage_primary_info_group'
            });
            systemIdTextFld.defaultValue = params.systemid ? params.systemid : autoNum;
            systemIdTextFld.updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });
            systemIdTextFld.isMandatory = true;
            systemIdTextFld.updateBreakType({
                breakType: ui.FieldBreakType.STARTCOL
            });

            var systemNameField = form.addField({
                id: constants.ESTIMATOR.FIELDS.NAME,
                label: 'Estimator ID Name',
                type: ui.FieldType.TEXT,
                container: 'custpage_primary_info_group'
            });
            systemNameField.defaultValue = params.systemname;
            systemNameField.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });
            systemNameField.isMandatory = true;

            var projectFld = form.addField({
                id: constants.ESTIMATOR.FIELDS.PROJECT,
                label: 'Project',
                type: ui.FieldType.SELECT,
                container: 'custpage_primary_info_group'
            });
            projectFld.defaultValue = params.job;
            projectFld.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });
            if(params.customer){
                var projectSearch = search.create({
                    type: "job",
                    filters:["customer","anyof",params.customer],
                    columns: ["internalid", "companyname"]
                });
                projectFld.addSelectOption({
                    value : '',
                    text : '',
                });
                projectSearch.run().each(function(result) {
                    var name = result.getValue({ name: 'companyname' });
                    projectFld.addSelectOption({
                        value : result.getValue({ name: 'internalid' }),
                        text : name,
                    });
                    return true; // continue iteration
                });
            }
            projectFld.updateBreakType({
                breakType: ui.FieldBreakType.STARTCOL
            });

            var opportunityFld = form.addField({
                id: constants.ESTIMATOR.FIELDS.OPPORTUNITY,
                label: 'Opportunity',
                type: ui.FieldType.SELECT,
                container: 'custpage_primary_info_group'
            });
            opportunityFld.defaultValue = params.opp;
            opportunityFld.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });
            if(params.customer){
                var opportunitySearch = search.create({
                    type: "opportunity",
                    filters: ["entity","anyof",params.customer],
                    columns: ["internalid","tranid","title"]
                });
                opportunityFld.addSelectOption({
                    value: '',
                    text: ''
                });
                // Execute the search and iterate over each result
                opportunitySearch.run().each(function(result) {
                    var tranId = result.getValue({ name: 'tranid' });
                    var title = result.getValue({ name: 'title' });
                    var value = '#' + tranId + ' ' + title;
                    opportunityFld.addSelectOption({
                        value : result.getValue({ name: 'internalid' }),
                        text : value
                    });
                    return true; // continue iteration
                });
            }

            var listValues = [];
            var subHeaderNames = params.subheaders;
            if (subHeaderNames && typeof subHeaderNames === 'string') {
                listValues = subHeaderNames.split(',');
            } else if (subHeaderNames === null) {
                listValues = [];
            }
            var selectTabField = form.addField({
                id: constants.ESTIMATOR.FIELDS.SELECT_TAB,
                label: 'Select Tab',
                type: ui.FieldType.SELECT,
                container: 'custpage_primary_info_group'
            });
            selectTabField.updateDisplayType({
                displayType: ui.FieldDisplayType.NORMAL
            });
            selectTabField.updateBreakType({
                breakType: ui.FieldBreakType.STARTCOL
            });
            selectTabField.addSelectOption({
                value: '',
                text: ''
            });
            selectTabField.addSelectOption({
                value: constants.ESTIMATOR.LABOUR_PLAN.TAB_ID,
                text: 'Labor Plan'
            });
            selectTabField.addSelectOption({
                value: constants.ESTIMATOR.MISC_COST.TAB_ID,
                text: 'Misc Cost'
            });
            if(listValues && listValues.length>0){
                for (var k = 0; k < listValues.length; k++) {
                    selectTabField.addSelectOption({
                        value: constants.ESTIMATOR.ROOMS.TAB_ID + k,
                        text: listValues[k]
                    });
                }
            }

            //Add a submit button
            form.addSubmitButton({
                label: constants.ESTIMATOR.BUTTONS.SUBMIT.LABEL
            });
            if(!params.insert){
                form.addButton({
                    id: constants.ESTIMATOR.BUTTONS.COPY_NSID.ID,
                    label: constants.ESTIMATOR.BUTTONS.COPY_NSID.LABEL,
                    functionName: constants.ESTIMATOR.BUTTONS.COPY_NSID.FUNCTION
                });
            }
            form.addButton({
                id: constants.ESTIMATOR.BUTTONS.SAVE.ID,
                label: constants.ESTIMATOR.BUTTONS.SAVE.LABEL,
                functionName: constants.ESTIMATOR.BUTTONS.SAVE.FUNCTION
            });
            if(params.insert){
                form.addButton({
                    id: constants.ESTIMATOR.BUTTONS.SUMMARY.ID,
                    label: constants.ESTIMATOR.BUTTONS.SUMMARY.LABEL,
                    functionName: constants.ESTIMATOR.BUTTONS.SUMMARY.FUNCTION
                });
            }
            form.addButton({
                id: constants.ESTIMATOR.BUTTONS.IMPORT.ID,
                label: constants.ESTIMATOR.BUTTONS.IMPORT.LABEL,
                functionName: constants.ESTIMATOR.BUTTONS.IMPORT.FUNCTION
            });
            form.addButton({
                id: constants.ESTIMATOR.BUTTONS.PRINT.ID,
                label: constants.ESTIMATOR.BUTTONS.PRINT.LABEL,
                functionName: constants.ESTIMATOR.BUTTONS.PRINT.FUNCTION
            });
            form.addButton({
                id: constants.ESTIMATOR.BUTTONS.INSERT.ID,
                label: constants.ESTIMATOR.BUTTONS.INSERT.LABEL,
                functionName: constants.ESTIMATOR.BUTTONS.INSERT.FUNCTION
            });
            form.addButton({
                id: constants.ESTIMATOR.BUTTONS.HIDE.ID,
                label: constants.ESTIMATOR.BUTTONS.HIDE.LABEL,
                functionName: constants.ESTIMATOR.BUTTONS.HIDE.FUNCTION
            });

            // Print CSV Button
            form.addButton({
                id: constants.ESTIMATOR.BUTTONS.PRINT_CSV.ID,
                label: constants.ESTIMATOR.BUTTONS.PRINT_CSV.LABEL,
                functionName: constants.ESTIMATOR.BUTTONS.PRINT_CSV.FUNCTION
            })
            // End of Print CSV Button

            var data = populateSublistData(params);
            addLabourPlan(form, params, data.labordata);
            addMiscCost(form, params, data.miscdata);
            addSubheaderTabs(form, params, data.roomsdata);
            response.writePage(form);
        }
        function postHandler(request, response, params) {
            // Handle POST request logic if needed
            var title = "postHandler::";
            try {
                var results = CLSCreateEstimate.createEstimates(request);
                var form = ui.createForm({
                    title: 'Form Submitted'
                });
                var displayFieldsuccess = form.addField({
                    id: 'custpage_my_display_success',
                    type: ui.FieldType.INLINEHTML,
                    label: 'Display Request result success'
                });
                var displayFieldfail = form.addField({
                    id: 'custpage_my_display_fail',
                    type: ui.FieldType.INLINEHTML,
                    label: 'Display Request result fail'
                });
                if(results.success){
                    displayFieldsuccess.defaultValue = "<h3><span style='color: green;'> Record Created successfully IDs:</span>" + results.success + "</h3>"
                }
                if(results.fail && results.fail.length){
                    displayFieldfail.defaultValue = "<h3><span style='color: red;'> Record creation errors: </span>" + results.fail + "</h3>"
                }
                response.writePage(form);
            } catch (error) {
                log.error(title + error.name, error.message);
            }
        }
        function addSubheaderTabs(form, params, data) {
            var subHeaderNames = params.subheaders;
            var tempSubHeaderName = params.tempsubheader;
            var copySubHeader = params.copysubheader;
            if(copySubHeader){
                var lastSublist = parseInt(params.insert) - 1;
            }
            var insertTabs = params.insert;
            var labels;
            if (subHeaderNames && typeof subHeaderNames === 'string') {
                labels = subHeaderNames.split(',');
            }
            else if (subHeaderNames === null) {
                labels = [];
            }
            var shipAddressData = shipAddressSearch(params.customer);
            var oppAddr = opportunityAddress(params.opp);
            for (var i = 0; i < insertTabs; i++) {
                if(labels[i] === copySubHeader){
                    copySublist = i;
                }

                form.addTab({
                    id: constants.ESTIMATOR.ROOMS.TAB_ID + i,
                    label: labels[i],
                    tabGroup: 'custpage_tab_group'
                });
                form.addFieldGroup({
                    id: 'custpage_sublist_group_' + i,
                    label: labels[i] + ' Information',
                    tab: constants.ESTIMATOR.ROOMS.TAB_ID + i
                });
                // Add sublist for the section
                var sublist = form.addSublist({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.ID + i,
                    type: ui.SublistType.INLINEEDITOR,
                    label: labels[i],
                    tab: constants.ESTIMATOR.ROOMS.TAB_ID + i
                });

                sublist.addButton({
                    id: constants.ESTIMATOR.BUTTONS.SORT.ID,
                    label: constants.ESTIMATOR.BUTTONS.SORT.LABEL,
                    functionName: constants.ESTIMATOR.BUTTONS.SORT.FUNCTION + '(' + i + ')'
                });

                var sortFld = form.addField({
                    id: constants.ESTIMATOR.ROOMS.SORT + i,
                    type: ui.FieldType.SELECT,
                    label: 'Sort Index',
                    container: 'custpage_sublist_group_' + i
                });
                sortFld.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                sortFld.updateDisplaySize({
                    height : 50,
                    width : 200
                });
                sortFld.addSelectOption({
                    value : "",
                    text : '',
                });
                sortFld.addSelectOption({
                    value : "1",
                    text : 'Re Index',
                });

                // Add the quantity field inside the field group
                var tabQtyFld = form.addField({
                    id: constants.ESTIMATOR.ROOMS.QUANTITY + i,
                    type: ui.FieldType.FLOAT,
                    label: 'Quantity',
                    container: 'custpage_sublist_group_' + i
                });
                tabQtyFld.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });
                tabQtyFld.defaultValue = 1;
                tabQtyFld.updateDisplaySize({
                    height : 50,
                    width : 20
                });
                tabQtyFld.updateBreakType({
                    breakType: ui.FieldBreakType.STARTCOL
                });

                var roomSystemId = form.addField({
                    id: constants.ESTIMATOR.ROOMS.ROOM_ID + i,
                    type: ui.FieldType.TEXT,
                    label: 'Room/System ID',
                    container: 'custpage_sublist_group_' + i
                });
                roomSystemId.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                roomSystemId.updateBreakType({
                    breakType: ui.FieldBreakType.STARTCOL
                });
                roomSystemId.updateDisplaySize({
                    height : 50,
                    width : 20
                });

                // if(params.e === '1' && params.customer && params.systemid){
                //     var estimateSearch = search.create({
                //         type: "transaction",
                //         settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
                //         filters:
                //             [
                //                 ["custbody_div_tpc_room_name","is",labels[i]],
                //                 "AND",
                //                 ["custbody_div_tpc_netsuite_id","is",params.systemid],
                //                 "AND",
                //                 ["custbody_div_order_type","anyof","3"]
                //             ],
                //         columns:
                //             [
                //                 search.createColumn({
                //                     name: "custbody_div_tpc_system_id",
                //                     summary: "GROUP"
                //                 })
                //             ]
                //     });
                //     var results = estimateSearch.run().getRange(0,1);
                //     if(results.length>0){
                //         var systemId = results[0].getValue({
                //             name: "custbody_div_tpc_system_id",
                //             summary: "GROUP"
                //         });
                //         log.debug("systemId",systemId);
                //         roomSystemId.defaultValue = systemId || "";
                //     }
                // }

                var roomSystemName = form.addField({
                    id: constants.ESTIMATOR.ROOMS.ROOM_NAME + i,
                    type: ui.FieldType.TEXT,
                    label: 'Room/Location/Bundle',
                    container: 'custpage_sublist_group_' + i
                });
                roomSystemName.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });
                roomSystemName.updateBreakType({
                    breakType: ui.FieldBreakType.STARTCOL
                });
                roomSystemName.updateDisplaySize({
                    height : 50,
                    width : 20
                });

                // var orderType = form.addField({
                //     id: constants.ESTIMATOR.ROOMS.ORDER_TYPE + i,
                //     type: ui.FieldType.SELECT,
                //     label: 'Order Type',
                //     source: 'customlist_div_order_type',
                //     container: 'custpage_sublist_group_' + i
                // });
                // orderType.defaultValue = 3;
                // orderType.updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });
                // orderType.isMandatory = true;
                // orderType.updateBreakType({
                //     breakType: ui.FieldBreakType.STARTCOL
                // });

                var shipAddress = form.addField({
                    id: constants.ESTIMATOR.ROOMS.SHIP_TO + i,
                    type: ui.FieldType.SELECT,
                    label: 'Ship To',
                    container: 'custpage_sublist_group_' + i
                });
                shipAddress.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });

                if (shipAddressData && Array.isArray(shipAddressData) && shipAddressData.length > 0) {
                    for(var x=0; x<shipAddressData.length; x++){
                        shipAddress.addSelectOption({
                            value: shipAddressData[x].id,
                            text: shipAddressData[x].value
                        });
                    }
                }
                shipAddress.defaultValue = oppAddr;

                shipAddress.updateBreakType({
                    breakType: ui.FieldBreakType.STARTCOL
                });
                shipAddress.updateDisplaySize({
                    height : 50,
                    width : 200
                });

                var columnFld = form.addField({
                    id: constants.ESTIMATOR.ROOMS.COLUMNS + i,
                    type: ui.FieldType.SELECT,
                    label: 'Sort Column',
                    container: 'custpage_sublist_group_' + i
                });
                columnFld.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });
                columnFld.updateBreakType({
                    breakType: ui.FieldBreakType.STARTCOL
                });
                columnFld.updateDisplaySize({
                    height : 50,
                    width : 200
                });
                var columns = sublistColumnNames();
                columns.forEach(function(column) {
                    columnFld.addSelectOption({
                        value: column.value,
                        text: column.text
                    });
                });
                var filterFld = form.addField({
                    id: constants.ESTIMATOR.ROOMS.FILTERS + i,
                    type: ui.FieldType.SELECT,
                    label: 'Sort Option',
                    container: 'custpage_sublist_group_' + i
                });
                filterFld.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });
                filterFld.updateBreakType({
                    breakType: ui.FieldBreakType.STARTCOL
                });
                filterFld.updateDisplaySize({
                    height : 50,
                    width : 200
                });
                filterFld.addSelectOption({
                    value : "",
                    text : '',
                });
                filterFld.addSelectOption({
                    value : "1",
                    text : 'ASC',
                });
                filterFld.addSelectOption({
                    value : "2",
                    text : 'DESC',
                });

                var groupData = params.group;
                var group = groupData !== '' && groupData !== null && groupData !== undefined;
                sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.INDEX + i,
                    type: ui.FieldType.TEXT,
                    label: 'Index'
                });

                //Flag
                sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.FLAG + i,
                    type: ui.FieldType.SELECT,
                    label: 'Flag',
                    source: constants.LISTS.FLAG
                });
                //Design Notes
                var designNotes = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.DESIGN_NOTES + i,
                    type: ui.FieldType.TEXTAREA,
                    label: 'Design Notes'
                });
                if(group && groupData.includes('0')) {
                    designNotes.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    designNotes.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });
                }
                //no name
                var qtyfld = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.QTY + i,
                    type: ui.FieldType.FLOAT,
                    label: 'Quantity'
                });
                qtyfld.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });
                qtyfld.isMandatory = true;

                var manufacFld = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.MANUF + i,
                    type: ui.FieldType.TEXT,
                    label: 'Manufacturer'
                });
                manufacFld.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });

                var mpnFld = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.MPN + i,
                    type: ui.FieldType.TEXT,
                    label: 'MPN'
                });
                mpnFld.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });

                var itemfld = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.ITEM + i,
                    type: ui.FieldType.SELECT,
                    label: 'Item Name/Number',
                    source: 'item'
                });
                itemfld.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });
                itemfld.isMandatory = true;

                var unitDesc = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.ITEM_DESC + i,
                    type: ui.FieldType.TEXTAREA,
                    label: 'Item Description'
                });
                unitDesc.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });

                var costFld = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.COST + i,
                    type: ui.FieldType.CURRENCY,
                    label: 'Std Cost'
                });
                costFld.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });

                var extCostFld = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_COST + i,
                    type: ui.FieldType.CURRENCY,
                    label: 'Extended Cost'
                });
                extCostFld.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });

                sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.SPECIAL_PRICING + i,
                    type: ui.FieldType.CHECKBOX,
                    label: 'Special Pricing'
                });
                sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.EOL + i,
                    type: ui.FieldType.DATE,
                    label: 'EOL'
                });
                //Pricing

                var basePrice = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.PRICE + i,
                    type: ui.FieldType.CURRENCY,
                    label: 'Base Price'
                });
                if(group && groupData.includes('1')) {
                    basePrice.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    basePrice.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                }

                var discount = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.DISCOUNT + i,
                    type: ui.FieldType.PERCENT,
                    label: 'Discount%'
                });
                if(group && groupData.includes('1')) {
                    discount.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    discount.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });
                }

                var totalPrice = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.TOTAL_PRICE + i,
                    type: ui.FieldType.CURRENCY,
                    label: 'Total Price'
                });
                if(group && groupData.includes('1')) {
                    totalPrice.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    totalPrice.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                }

                var marginPercent = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.MARGIN_PERCENT +i,
                    type: ui.FieldType.CURRENCY,
                    label: 'Margin %'
                });
                if(group && groupData.includes('1')) {
                    marginPercent.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    marginPercent.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                }

                //Item Details

                var unitMeasure = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.UNIT_MEASURE + i,
                    type: ui.FieldType.TEXT,
                    label: 'Unit Measure'
                });
                if(group && groupData.includes('2')) {
                    unitMeasure.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    unitMeasure.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                }

                var costCategory = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.COST_CAT + i,
                    type: ui.FieldType.TEXT,
                    label: 'Cost Category'
                });
                if(group && groupData.includes('2')) {
                    costCategory.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    costCategory.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                }

                var itemType = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.ITEM_TYPE + i,
                    type: ui.FieldType.TEXT,
                    label: 'Item Type'
                });
                if(group && groupData.includes('2')) {
                    itemType.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    itemType.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                }

                var custom = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.CUSTOM + i,
                    type: ui.FieldType.TEXT,
                    label: 'Custom'
                });
                if(group && groupData.includes('2')) {
                    custom.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    custom.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                }

                var ofe = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.OFE + i,
                    type: ui.FieldType.TEXT,
                    label: 'OFE'
                });
                if(group && groupData.includes('2')) {
                    ofe.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    ofe.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                }

                var gsa = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.GSA + i,
                    type: ui.FieldType.TEXT,
                    label: 'GSA'
                });
                if(group && groupData.includes('2')) {
                    gsa.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    gsa.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                }

                var taa = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.TAA + i,
                    type: ui.FieldType.TEXT,
                    label: 'TAA'
                });
                if(group && groupData.includes('2')) {
                    taa.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    taa.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                }

                var manufacCountry = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.COUNTRY_OF_MANUF + i,
                    type: ui.FieldType.TEXT,
                    label: 'Country of Manufacturer'
                });
                if(group && groupData.includes('2')) {
                    manufacCountry.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    manufacCountry.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                }


                //Product Information
                var itemCat = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.PROD_MAIN_CAT + i,
                    type: ui.FieldType.TEXT,
                    label: 'Product Main Category'
                });
                if(group && groupData.includes('3')) {
                    itemCat.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    itemCat.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                }

                var itemSubCat = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.PROD_SUB_CAT + i,
                    type: ui.FieldType.TEXT,
                    label: 'Product Subcategory'
                });
                if(group && groupData.includes('3')) {
                    itemSubCat.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    itemSubCat.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                }

                var productLine = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.PROD_LINE + i,
                    type: ui.FieldType.TEXT,
                    label: 'Product Line'
                });
                if(group && groupData.includes('3')) {
                    productLine.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    productLine.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                }

                //supply chain
                var leadTime = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.LEAD_TIME + i,
                    type: ui.FieldType.TEXT,
                    label: 'Lead Time'
                });
                if(group && groupData.includes('4')) {
                    leadTime.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    leadTime.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                }

                var pref = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.PREF + i,
                    type: ui.FieldType.TEXT,
                    label: 'Preferred'
                });
                if(group && groupData.includes('4')) {
                    pref.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    pref.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                }

                var prefVendor = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.PREF_VENDOR + i,
                    type: ui.FieldType.SELECT,
                    label: 'Preferred Vendor',
                    source: 'vendor'
                });
                if(group && groupData.includes('4')) {
                    prefVendor.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    prefVendor.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                }

                //Project Execution
                var rack = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.RACK + i,
                    type: ui.FieldType.TEXT,
                    label: 'Rack/Assembly'
                });
                if(group && groupData.includes('5')) {
                    rack.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    rack.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });
                }

                var commReq = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.REQD_COMM + i,
                    type: ui.FieldType.TEXT,
                    label: 'Requires Commissioning'
                });
                if(group && groupData.includes('5')) {
                    commReq.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    commReq.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                }

                var exeNotes = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.EXE_NOTES + i,
                    type: ui.FieldType.TEXTAREA,
                    label: 'Execution Notes'
                });
                if(group && groupData.includes('5')) {
                    exeNotes.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    exeNotes.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });
                }

                //Technical Info
                var ru = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.RU + i,
                    type: ui.FieldType.TEXT,
                    label: 'RU'
                });
                if(group && groupData.includes('6')) {
                    ru.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    ru.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                }

                var extRu = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_RU + i,
                    type: ui.FieldType.TEXT,
                    label: 'Extended RU'
                });
                if(group && groupData.includes('6')) {
                    extRu.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    extRu.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                }

                var powerConsump = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.POW + i,
                    type: ui.FieldType.TEXT,
                    label: 'Typical Power (watts)'
                });
                if(group && groupData.includes('6')) {
                    powerConsump.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    powerConsump.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                }

                var extPowerConsump = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_POW + i,
                    type: ui.FieldType.TEXT,
                    label: 'Ext.PWR'
                });
                if(group && groupData.includes('6')) {
                    extPowerConsump.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    extPowerConsump.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                }

                var heatOutput = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.HEAT + i,
                    type: ui.FieldType.TEXT,
                    label: 'Typical Heat'
                });
                if(group && groupData.includes('6')) {
                    heatOutput.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    heatOutput.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                }

                var extHeatOutput = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_HEAT + i,
                    type: ui.FieldType.TEXT,
                    label: 'Ext.Heat'
                });
                if(group && groupData.includes('6')) {
                    extHeatOutput.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    extHeatOutput.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                }

                var weight = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.WEIGHT + i,
                    type: ui.FieldType.TEXT,
                    label: 'Item Weight'
                });
                if(group && groupData.includes('6')) {
                    weight.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    weight.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                }

                var extWeight = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_WEIGHT + i,
                    type: ui.FieldType.TEXT,
                    label: 'Ext.Weight'
                });
                if(group && groupData.includes('6')) {
                    extWeight.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    extWeight.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                }

                //User Fields
                var custom1 = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.C1 + i,
                    type: ui.FieldType.TEXT,
                    label: 'Custom 1'
                });
                if(group && groupData.includes('7')) {
                    custom1.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    custom1.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });
                }
                var custom2 = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.C2 + i,
                    type: ui.FieldType.TEXT,
                    label: 'Custom 2'
                });
                if(group && groupData.includes('7')) {
                    custom2.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    custom2.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });
                }
                var custom3 = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.C3 + i,
                    type: ui.FieldType.TEXT,
                    label: 'Custom 3'
                });
                if(group && groupData.includes('7')) {
                    custom3.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    custom3.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });
                }
                var custom4 = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.C4 + i,
                    type: ui.FieldType.TEXT,
                    label: 'Custom 4'
                });
                if(group && groupData.includes('7')) {
                    custom4.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    custom4.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });
                }
                var custom5 = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.C5 + i,
                    type: ui.FieldType.TEXT,
                    label: 'Custom 5'
                });
                if(group && groupData.includes('7')) {
                    custom5.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    custom5.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });
                }
                var logsFld = sublist.addField({
                    id: constants.ESTIMATOR.ROOMS.SUBLIST.LOGS +i,
                    type: ui.FieldType.TEXT,
                    label: 'Logs'
                });
                if (group && groupData.includes('8')) {
                    logsFld.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                } else {
                    logsFld.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                }

                // Populate sublist fields with data from the subHeaders array
                if (data && data.length > 0 && data[i] && (data[i].items).length > 0) {
                    if(data[i].quantity) tabQtyFld.defaultValue = data[i].quantity;
                    //roomSystemId.defaultValue = data[i].roomid;
                    roomSystemName.defaultValue = data[i].roomname;
                    //orderType.defaultValue = data[i].ordertype;
                    //shipAddress.defaultValue = oppAddr;
                    sortFld.defaultValue = data[i].sort;
                    columnFld.defaultValue = data[i].col;
                    filterFld.defaultValue = data[i].filter;
                    var itemArr = data[i].items;
                    if (data[i].col && data[i].filter) {
                        var colIndex = sublistColumnNames();
                        var code = colIndex[data[i].col].code;
                        if (data[i].filter === "1") {
                            if(code === "index"){
                               itemArr.sort((a, b) => a[code] - b[code]); // Ascending order
                            }else{
                                itemArr.sort((a, b) => {
                                    if(typeof a[code] == "number" || typeof b[code] == "number"){
                                        if(!a[code]) a[code] = 0;
                                        if(!b[code]) b[code] = 0;
                                        return a[code] - b[code];
                                    }else{
                                        if (!a[code]) a[code] = "";
                                        if (!b[code]) b[code] = "";
                                        return a[code].localeCompare(b[code]);
                                    }
                                });
                            }
                        } else if (data[i].filter === "2") {
                            if(code === "index"){
                                itemArr.sort((a, b) => b[code] - a[code]); // Desc order
                            }else{
                                itemArr.sort((a, b) => {
                                    if(typeof a[code] == "number" || typeof b[code] == "number"){
                                        if(!a[code]) a[code] = 0;
                                        if(!b[code]) b[code] = 0;
                                        return b[code] - a[code];
                                    }else{
                                        if (!a[code]) a[code] = "";
                                        if (!b[code]) b[code] = "";
                                        return b[code].localeCompare(a[code]);
                                    }
                                });
                            }
                        }
                    }
                    for (var j = 0; j < itemArr.length; j++) {
                        var currentItem = itemArr[j];
                        if((!!currentItem.index && data[i].sort === "1") || !currentItem.index){
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.INDEX + i,
                                line: j,
                                value: j + 1
                            });
                        }else if (currentItem.index) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.INDEX + i,
                                line: j,
                                value: currentItem.index
                            });
                        }
                        if (currentItem.flag) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.FLAG + i,
                                line: j,
                                value: currentItem.flag
                            });
                        }
                        if (currentItem.sp) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.SPECIAL_PRICING + i,
                                line: j,
                                value: currentItem.sp ? 'T' : 'F'
                            });
                        }
                        if (currentItem.dn) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.DESIGN_NOTES + i,
                                line: j,
                                value: currentItem.dn
                            });
                        }
                        if (currentItem.item) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.ITEM + i,
                                line: j,
                                value: currentItem.item
                            });
                        }
                        sublist.setSublistValue({
                            id: constants.ESTIMATOR.ROOMS.SUBLIST.QTY + i,
                            line: j,
                            value: currentItem.qty || 0
                        });
                        if (currentItem.manuf) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.MANUF + i,
                                line: j,
                                value: currentItem.manuf
                            });
                        }
                        if (currentItem.mpn) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.MPN + i,
                                line: j,
                                value: currentItem.mpn
                            });
                        }
                        if (currentItem.desc) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.ITEM_DESC + i,
                                line: j,
                                value: currentItem.desc
                            });
                        }
                        sublist.setSublistValue({
                            id: constants.ESTIMATOR.ROOMS.SUBLIST.COST + i,
                            line: j,
                            value: currentItem.cost || 0
                        });
                        sublist.setSublistValue({
                            id: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_COST + i,
                            line: j,
                            value: currentItem.ec || 0
                        });
                        sublist.setSublistValue({
                            id: constants.ESTIMATOR.ROOMS.SUBLIST.PRICE + i,
                            line: j,
                            value: currentItem.price || 0
                        });
                        sublist.setSublistValue({
                            id: constants.ESTIMATOR.ROOMS.SUBLIST.DISCOUNT + i,
                            line: j,
                            value: currentItem.disc || 0
                        });
                        sublist.setSublistValue({
                            id: constants.ESTIMATOR.ROOMS.SUBLIST.TOTAL_PRICE + i,
                            line: j,
                            value: currentItem.total || 0
                        });
                        sublist.setSublistValue({
                            id: constants.ESTIMATOR.ROOMS.SUBLIST.MARGIN_PERCENT + i,
                            line: j,
                            value: currentItem.margin || 0
                        });
                        if (currentItem.um) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.UNIT_MEASURE + i,
                                line: j,
                                value: currentItem.um
                            });
                        }
                        if (currentItem.cc) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.COST_CAT + i,
                                line: j,
                                value: currentItem.cc
                            });
                        }
                        if (currentItem.type) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.ITEM_TYPE + i,
                                line: j,
                                value: currentItem.type
                            });
                        }
                        if (currentItem.cus) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.CUSTOM + i,
                                line: j,
                                value: currentItem.cus
                            });
                        }
                        if (currentItem.ofe) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.OFE + i,
                                line: j,
                                value: currentItem.ofe
                            });
                        }
                        if (currentItem.gsa) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.GSA + i,
                                line: j,
                                value: currentItem.gsa
                            });
                        }
                        if (currentItem.taa) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.TAA + i,
                                line: j,
                                value: currentItem.taa
                            });
                        }
                        if (currentItem.com) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.COUNTRY_OF_MANUF + i,
                                line: j,
                                value: currentItem.com
                            });
                        }
                        if (currentItem.pmc) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.PROD_MAIN_CAT + i,
                                line: j,
                                value: currentItem.pmc
                            });
                        }
                        if (currentItem.psc) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.PROD_SUB_CAT + i,
                                line: j,
                                value: currentItem.psc
                            });
                        }
                        if (currentItem.pl) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.PROD_LINE + i,
                                line: j,
                                value: currentItem.pl
                            });
                        }
                        if (currentItem.time) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.LEAD_TIME + i,
                                line: j,
                                value: currentItem.time
                            });
                        }
                        if (currentItem.pref) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.PREF + i,
                                line: j,
                                value: currentItem.pref
                            });
                        }
                        if (currentItem.prefv) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.PREF_VENDOR + i,
                                line: j,
                                value: currentItem.prefv
                            });
                        }
                        if (currentItem.rack) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.RACK + i,
                                line: j,
                                value: currentItem.rack
                            });
                        }
                        if (currentItem.rc) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.REQD_COMM + i,
                                line: j,
                                value: currentItem.rc
                            });
                        }
                        if (currentItem.enotes) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.EXE_NOTES + i,
                                line: j,
                                value: currentItem.enotes
                            });
                        }
                        if (currentItem.ru) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.RU + i,
                                line: j,
                                value: currentItem.ru
                            });
                        }
                        sublist.setSublistValue({
                            id: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_RU + i,
                            line: j,
                            value: currentItem.eru || 0
                        });
                        if (currentItem.pow) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.POW + i,
                                line: j,
                                value: currentItem.pow
                            });
                        }
                        sublist.setSublistValue({
                            id: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_POW + i,
                            line: j,
                            value: currentItem.epow || 0
                        });
                        if (currentItem.heat) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.HEAT + i,
                                line: j,
                                value: currentItem.heat
                            });
                        }
                        sublist.setSublistValue({
                            id: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_HEAT + i,
                            line: j,
                            value: currentItem.eheat || 0
                        });
                        if (currentItem.weight) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.WEIGHT + i,
                                line: j,
                                value: currentItem.weight
                            });
                        }
                        sublist.setSublistValue({
                            id: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_WEIGHT + i,
                            line: j,
                            value: currentItem.ew || 0
                        });
                        if (currentItem.c1) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.C1 + i,
                                line: j,
                                value: currentItem.c1
                            });
                        }
                        if (currentItem.c2) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.C2 + i,
                                line: j,
                                value: currentItem.c2
                            });
                        }
                        if (currentItem.c3) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.C3 + i,
                                line: j,
                                value: currentItem.c3
                            });
                        }
                        if (currentItem.c4) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.C4 + i,
                                line: j,
                                value: currentItem.c4
                            });
                        }
                        if (currentItem.c5) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.C5 + i,
                                line: j,
                                value: currentItem.c5
                            });
                        }
                        if (currentItem.eol) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.EOL + i,
                                line: j,
                                value: currentItem.eol
                            });
                        }
                        if (!!currentItem.logs && currentItem.logs) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.LOGS + i,
                                line: j,
                                value: currentItem.logs
                            });
                        }
                    }
                }
                else if(i === lastSublist && data[copySublist]){
                    tabQtyFld.defaultValue = data[copySublist].quantity;
                    //roomSystemId.defaultValue = data[copySublist].roomid;
                    roomSystemName.defaultValue = data[copySublist].roomname;
                    // orderType.defaultValue = data[copySublist].ordertype;
                    shipAddress.defaultValue = data[copySublist].shipto;
                    var itemArr = data[copySublist].items;
                    //setValuesInEstimatorSublists(sublist, itemArr);
                    for (var l = 0; l < itemArr.length; l++) {
                        var currentItem = itemArr[l];
                        if (currentItem.index) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.INDEX + i,
                                line: l,
                                value: currentItem.index
                            });
                        }
                        if (currentItem.flag) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.FLAG + i,
                                line: l,
                                value: currentItem.flag
                            });
                        }
                        if (currentItem.sp) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.SPECIAL_PRICING + i,
                                line: l,
                                value: currentItem.sp ? 'T' : 'F'
                            });
                        }
                        if (currentItem.dn) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.DESIGN_NOTES + i,
                                line: l,
                                value: currentItem.dn
                            });
                        }
                        if (currentItem.item) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.ITEM + i,
                                line: l,
                                value: currentItem.item
                            });
                        }
                        if (currentItem.qty) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.QTY + i,
                                line: l,
                                value: currentItem.qty
                            });
                        }
                        if (currentItem.manuf) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.MANUF + i,
                                line: l,
                                value: currentItem.manuf
                            });
                        }
                        if (currentItem.mpn) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.MPN + i,
                                line: l,
                                value: currentItem.mpn
                            });
                        }
                        if (currentItem.desc) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.ITEM_DESC + i,
                                line: l,
                                value: currentItem.desc
                            });
                        }
                        sublist.setSublistValue({
                            id: constants.ESTIMATOR.ROOMS.SUBLIST.COST + i,
                            line: l,
                            value: currentItem.cost || 0
                        });
                        sublist.setSublistValue({
                            id: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_COST + i,
                            line: l,
                            value: currentItem.ec || 0
                        });
                        sublist.setSublistValue({
                            id: constants.ESTIMATOR.ROOMS.SUBLIST.PRICE + i,
                            line: l,
                            value: currentItem.price || 0
                        });
                        sublist.setSublistValue({
                            id: constants.ESTIMATOR.ROOMS.SUBLIST.DISCOUNT + i,
                            line: l,
                            value: currentItem.disc || 0
                        });
                        sublist.setSublistValue({
                            id: constants.ESTIMATOR.ROOMS.SUBLIST.TOTAL_PRICE + i,
                            line: l,
                            value: currentItem.total || 0
                        });
                        sublist.setSublistValue({
                            id: constants.ESTIMATOR.ROOMS.SUBLIST.MARGIN_PERCENT + i,
                            line: l,
                            value: currentItem.margin || 0
                        });
                        if (currentItem.um) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.UNIT_MEASURE + i,
                                line: l,
                                value: currentItem.um
                            });
                        }
                        if (currentItem.cc) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.COST_CAT + i,
                                line: l,
                                value: currentItem.cc
                            });
                        }
                        if (currentItem.type) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.ITEM_TYPE + i,
                                line: l,
                                value: currentItem.type
                            });
                        }
                        if (currentItem.cus) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.CUSTOM + i,
                                line: l,
                                value: currentItem.cus
                            });
                        }
                        if (currentItem.ofe) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.OFE + i,
                                line: l,
                                value: currentItem.ofe
                            });
                        }
                        if (currentItem.gsa) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.GSA + i,
                                line: l,
                                value: currentItem.gsa
                            });
                        }
                        if (currentItem.taa) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.TAA + i,
                                line: l,
                                value: currentItem.taa
                            });
                        }
                        if (currentItem.com) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.COUNTRY_OF_MANUF + i,
                                line: l,
                                value: currentItem.com
                            });
                        }
                        if (currentItem.pmc) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.PROD_MAIN_CAT + i,
                                line: l,
                                value: currentItem.pmc
                            });
                        }
                        if (currentItem.psc) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.PROD_SUB_CAT + i,
                                line: l,
                                value: currentItem.psc
                            });
                        }
                        if (currentItem.pl) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.PROD_LINE + i,
                                line: l,
                                value: currentItem.pl
                            });
                        }
                        if (currentItem.time) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.LEAD_TIME + i,
                                line: l,
                                value: currentItem.time
                            });
                        }
                        if (currentItem.pref) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.PREF + i,
                                line: l,
                                value: currentItem.pref
                            });
                        }
                        if (currentItem.prefv) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.PREF_VENDOR + i,
                                line: l,
                                value: currentItem.prefv
                            });
                        }
                        if (currentItem.rack) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.RACK + i,
                                line: l,
                                value: currentItem.rack
                            });
                        }
                        if (currentItem.rc) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.REQD_COMM + i,
                                line: l,
                                value: currentItem.rc
                            });
                        }
                        if (currentItem.enotes) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.EXE_NOTES + i,
                                line: l,
                                value: currentItem.enotes
                            });
                        }
                        if (currentItem.ru) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.RU + i,
                                line: l,
                                value: currentItem.ru
                            });
                        }
                        sublist.setSublistValue({
                            id: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_RU + i,
                            line: l,
                            value: currentItem.eru || 0
                        });
                        if (currentItem.pow) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.POW + i,
                                line: l,
                                value: currentItem.pow
                            });
                        }
                        sublist.setSublistValue({
                            id: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_POW + i,
                            line: l,
                            value: currentItem.epow || 0
                        });
                        if (currentItem.heat) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.HEAT + i,
                                line: l,
                                value: currentItem.heat
                            });
                        }
                        sublist.setSublistValue({
                            id: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_HEAT + i,
                            line: l,
                            value: currentItem.eheat || 0
                        });
                        if (currentItem.weight) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.WEIGHT + i,
                                line: l,
                                value: currentItem.weight
                            });
                        }
                        sublist.setSublistValue({
                            id: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_WEIGHT + i,
                            line: l,
                            value: currentItem.ew || 0
                        });
                        if (currentItem.c1) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.C1 + i,
                                line: l,
                                value: currentItem.c1
                            });
                        }
                        if (currentItem.c2) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.C2 + i,
                                line: l,
                                value: currentItem.c2
                            });
                        }
                        if (currentItem.c3) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.C3 + i,
                                line: l,
                                value: currentItem.c3
                            });
                        }
                        if (currentItem.c4) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.C4 + i,
                                line: l,
                                value: currentItem.c4
                            });
                        }
                        if (currentItem.c5) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.C5 + i,
                                line: l,
                                value: currentItem.c5
                            });
                        }
                        if (currentItem.eol) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.ROOMS.SUBLIST.EOL + i,
                                line: l,
                                value: currentItem.eol
                            });
                        }
                    }
                }
            }
        }
        function addLabourPlan(form, params, data) {
            try {
                form.addTab({
                    id: constants.ESTIMATOR.LABOUR_PLAN.TAB_ID,
                    label: 'Labor Plan'
                });
                var sublist = form.addSublist({
                    id: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                    type: ui.SublistType.INLINEEDITOR,
                    label: 'Labor Plan',
                    tab: constants.ESTIMATOR.LABOUR_PLAN.TAB_ID
                });
                var itemfld = sublist.addField({
                    id: constants.ESTIMATOR.LABOUR_PLAN.ITEM,
                    type: ui.FieldType.SELECT,
                    label: 'Item',
                    source: 'item'
                });
                itemfld.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });
                itemfld.isMandatory = true;

                var qtyfld = sublist.addField({
                    id: constants.ESTIMATOR.LABOUR_PLAN.QTY,
                    type: ui.FieldType.FLOAT,
                    label: 'Quantity'
                });
                qtyfld.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });
                qtyfld.isMandatory = true;

                var ratefld = sublist.addField({
                    id: constants.ESTIMATOR.LABOUR_PLAN.PRICE,
                    type: ui.FieldType.CURRENCY,
                    label: 'Rate'
                });
                ratefld.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                ratefld.isMandatory = true;

                var discountFld = sublist.addField({
                    id: constants.ESTIMATOR.LABOUR_PLAN.DISCOUNT,
                    type: ui.FieldType.PERCENT,
                    label: 'Discount%'
                });
                discountFld.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });

                var totalFld = sublist.addField({
                    id: constants.ESTIMATOR.LABOUR_PLAN.TOTAL_PRICE,
                    type: ui.FieldType.CURRENCY,
                    label: 'Total Price'
                });
                totalFld.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                totalFld.isMandatory = true;

                var costFld = sublist.addField({
                    id: constants.ESTIMATOR.LABOUR_PLAN.COST,
                    type: ui.FieldType.CURRENCY,
                    label: 'Cost'
                });
                costFld.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });

                var extCostFld = sublist.addField({
                    id: constants.ESTIMATOR.LABOUR_PLAN.EXT_COST,
                    type: ui.FieldType.CURRENCY,
                    label: 'Ext Cost'
                });
                extCostFld.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });

                var marginPercent = sublist.addField({
                    id: constants.ESTIMATOR.LABOUR_PLAN.MARGIN_PERCENT,
                    type: ui.FieldType.CURRENCY,
                    label: 'Margin %'
                });
                marginPercent.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });

                var groupData = params.group;
                var group = groupData !== '' && groupData !== null && groupData !== undefined;
                var logsFld = sublist.addField({
                    id: constants.ESTIMATOR.LABOUR_PLAN.LOGS,
                    type: ui.FieldType.TEXT,
                    label: 'Logs'
                });
                if (group && groupData.includes('8')) {
                    logsFld.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                } else {
                    logsFld.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                }
               // var data = populateSublistData(params, true, false);
                if (data && data.length > 0) {
                    for (var i = 0; i < data.length; i++) {
                        var itemData = data[i].item || data[i].Item || data[i].ITEM;
                        var qtyData = data[i].quantity || data[i].Quantity || data[i].QUANTITY;
                        var costData = data[i].cost || data[i].Cost || data[i].COST;
                        var rateData = data[i].rate || data[i].Rate || data[i].RATE;
                        var discountData = data[i].discount || data[i].Discount || data[i].DISCOUNT || data[i].disc;
                        var totalPrice = data[i].total || data[i]["Total Price"] || data[i]["TOTAL PRICE"] || data[i]["total price"];
                        var extCostData = data[i].ec || data[i]["Ext Cost"] || data[i]["EXT COST"] || data[i]["ext cost"] || data[i]["Extended Cost"] || data[i]["EXTENDED COST"] || data[i]["extended cost"];
                        var marginData = data[i].margin;
                        var logs = data[i].logs;
                        if (itemData) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.LABOUR_PLAN.ITEM,
                                line: i,
                                value: itemData
                            });
                        }
                        if (qtyData) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.LABOUR_PLAN.QTY,
                                line: i,
                                value: qtyData
                            });
                        }
                        sublist.setSublistValue({
                            id: constants.ESTIMATOR.LABOUR_PLAN.COST,
                            line: i,
                            value: costData || 0
                        });
                        sublist.setSublistValue({
                            id: constants.ESTIMATOR.LABOUR_PLAN.PRICE,
                            line: i,
                            value: rateData || 0
                        });
                        sublist.setSublistValue({
                            id: constants.ESTIMATOR.LABOUR_PLAN.DISCOUNT,
                            line: i,
                            value: discountData || 0
                        });
                        sublist.setSublistValue({
                            id: constants.ESTIMATOR.LABOUR_PLAN.TOTAL_PRICE,
                            line: i,
                            value: totalPrice || 0
                        });
                        sublist.setSublistValue({
                            id: constants.ESTIMATOR.LABOUR_PLAN.EXT_COST,
                            line: i,
                            value: extCostData || 0
                        });
                        sublist.setSublistValue({
                            id: constants.ESTIMATOR.LABOUR_PLAN.MARGIN_PERCENT,
                            line: i,
                            value: marginData || 0
                        });
                        if(logs){
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.LABOUR_PLAN.LOGS,
                                line: i,
                                value: logs
                            });
                        }
                    }
                }
            } catch (e) {
                log.error("Exception: addLabourPlan", e);
            }
        }
        function addMiscCost(form, params, data) {
            try {
                form.addTab({
                    id: constants.ESTIMATOR.MISC_COST.TAB_ID,
                    label: 'Misc Cost'
                });
                var sublist = form.addSublist({
                    id: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                    type: ui.SublistType.INLINEEDITOR,
                    label: 'Misc Cost',
                    tab: constants.ESTIMATOR.MISC_COST.TAB_ID
                });
                var itemfld = sublist.addField({
                    id: constants.ESTIMATOR.MISC_COST.ITEM,
                    type: ui.FieldType.SELECT,
                    label: 'Item',
                    source: 'item'
                });
                itemfld.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });
                itemfld.isMandatory = true;

                var qtyfld = sublist.addField({
                    id: constants.ESTIMATOR.MISC_COST.QTY,
                    type: ui.FieldType.FLOAT,
                    label: 'Quantity'
                });
                qtyfld.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });
                qtyfld.isMandatory = true;

                var ratefld = sublist.addField({
                    id: constants.ESTIMATOR.MISC_COST.PRICE,
                    type: ui.FieldType.CURRENCY,
                    label: 'Rate'
                });
                ratefld.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                ratefld.isMandatory = true;

                var discountFld = sublist.addField({
                    id: constants.ESTIMATOR.MISC_COST.DISCOUNT,
                    type: ui.FieldType.PERCENT,
                    label: 'Discount%'
                });
                discountFld.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });

                var totalFld = sublist.addField({
                    id: constants.ESTIMATOR.MISC_COST.TOTAL_PRICE,
                    type: ui.FieldType.CURRENCY,
                    label: 'Total Price'
                });
                totalFld.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                totalFld.isMandatory = true;

                var costFld = sublist.addField({
                    id: constants.ESTIMATOR.MISC_COST.COST,
                    type: ui.FieldType.CURRENCY,
                    label: 'Cost'
                });
                costFld.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });

                var extCostFld = sublist.addField({
                    id: constants.ESTIMATOR.MISC_COST.EXT_COST,
                    type: ui.FieldType.CURRENCY,
                    label: 'Ext Cost'
                });
                extCostFld.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });

                var marginPercent = sublist.addField({
                    id: constants.ESTIMATOR.MISC_COST.MARGIN_PERCENT,
                    type: ui.FieldType.CURRENCY,
                    label: 'Margin %'
                });
                marginPercent.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });

                var groupData = params.group;
                var group = groupData !== '' && groupData !== null && groupData !== undefined;
                var logsFld = sublist.addField({
                    id: constants.ESTIMATOR.MISC_COST.LOGS,
                    type: ui.FieldType.TEXT,
                    label: 'Logs'
                });
                if(group && groupData.includes('8')) {
                    logsFld.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                }else{
                    logsFld.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                }
                //var data = populateSublistData(params, false, true);
                if(data && data.length>0){
                    for(var i=0; i<data.length; i++){
                        var itemData = data[i].item || data[i].Item || data[i].ITEM;
                        var qtyData = data[i].quantity || data[i].Quantity || data[i].QUANTITY;
                        var costData = data[i].cost || data[i].Cost || data[i].COST;
                        var rateData = data[i].rate || data[i].Rate || data[i].RATE;
                        var discountData = data[i].discount || data[i].Discount || data[i].DISCOUNT || data[i].disc;
                        var totalPrice = data[i].total || data[i]["Total Price"] || data[i]["TOTAL PRICE"] || data[i]["total price"];
                        var extCostData = data[i].ec || data[i]["Ext Cost"] || data[i]["EXT COST"] || data[i]["ext cost"] || data[i]["Extended Cost"] || data[i]["EXTENDED COST"] || data[i]["extended cost"];
                        var marginData = data[i].margin;
                        var logs = data[i].logs;
                        if (itemData) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.MISC_COST.ITEM,
                                line: i,
                                value: itemData
                            });
                        }
                        if (qtyData) {
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.MISC_COST.QTY,
                                line: i,
                                value: qtyData
                            });
                        }
                        sublist.setSublistValue({
                            id: constants.ESTIMATOR.MISC_COST.COST,
                            line: i,
                            value: costData || 0
                        });
                        sublist.setSublistValue({
                            id: constants.ESTIMATOR.MISC_COST.PRICE,
                            line: i,
                            value: rateData || 0
                        });
                        sublist.setSublistValue({
                            id: constants.ESTIMATOR.MISC_COST.DISCOUNT,
                            line: i,
                            value: discountData || 0
                        });
                        sublist.setSublistValue({
                            id: constants.ESTIMATOR.MISC_COST.TOTAL_PRICE,
                            line: i,
                            value: totalPrice || 0
                        });
                        sublist.setSublistValue({
                            id: constants.ESTIMATOR.MISC_COST.EXT_COST,
                            line: i,
                            value: extCostData || 0
                        });
                        sublist.setSublistValue({
                            id: constants.ESTIMATOR.MISC_COST.MARGIN_PERCENT,
                            line: i,
                            value: marginData || 0
                        });
                        if(logs){
                            sublist.setSublistValue({
                                id: constants.ESTIMATOR.MISC_COST.LOGS,
                                line: i,
                                value: logs
                            });
                        }
                    }
                }

            }catch (e) {
                log.error("Exception: addMiscCost", e);
            }
        }
        function populateSublistData(params){
             var getData = params.get;
            // var data;
            // if(getData){
            //     data = populateSavedData(params, labour, misc);
            // }else{
            //     data = populateRawData(params, labour, misc);
            // }
            // return data;

            var systemId = params.systemid;
            var data = {
                "labordata": "",
                "miscdata": "",
                "roomsdata": ""
            };
            var fileContents,path;
            if(systemId){
                var userId = runtime.getCurrentUser().id;
                if(getData){
                    path = constants.ESTIMATOR_SAVED.FIELDS.FILE_PATH;
                    path += systemId + '.json';
                }else{
                    path = constants.ESTIMATOR_RAW.FIELDS.FILE_PATH;
                    path += systemId + '|' +userId + '.json';
                }
                try {
                    var fileObj = file.load({
                        id: path
                    });
                    fileContents = fileObj.getContents();

                    if (fileContents) {
                        fileContents = JSON.parse(fileContents);
                    }
                } catch (e) {
                    // log.debug("File not found", e.message);
                    return data;
                }

                if(fileContents){
                    data.labordata = (fileContents.labordata && typeof fileContents.labordata === 'string' && fileContents.labordata.trim() !== '')
                        ? JSON.parse(fileContents.labordata) : [];

                    data.miscdata = (fileContents.miscdata && typeof fileContents.miscdata === 'string' && fileContents.miscdata.trim() !== '')
                        ? JSON.parse(fileContents.miscdata) : [];

                    data.roomsdata = (fileContents.roomsdata && typeof fileContents.roomsdata === 'string' && fileContents.roomsdata.trim() !== '')
                        ? JSON.parse(fileContents.roomsdata) : [];
                }
            }
            return data;
        }
        function populateSavedData(params, labour, misc){
            var systemId = params.systemid;
            var data = [];
            if(systemId){
                var estimateRecSearch = search.create({
                    type: constants.ESTIMATOR_SAVED.RECORD_TYPE,
                    filters:
                        [
                            [constants.ESTIMATOR_SAVED.FIELDS.ID,"is",systemId]
                        ],
                    columns:
                        [
                            "internalid",
                            constants.ESTIMATOR_SAVED.FIELDS.ID,
                            constants.ESTIMATOR_SAVED.FIELDS.NAME,
                            constants.ESTIMATOR_SAVED.FIELDS.CUSTOMER,
                            constants.ESTIMATOR_SAVED.FIELDS.LABOUR_PLAN,
                            constants.ESTIMATOR_SAVED.FIELDS.MISC_COST,
                            constants.ESTIMATOR_SAVED.FIELDS.SUBHEADERS
                        ]
                });
                estimateRecSearch.run().each(function(result){
                    // .run().each has a limit of 4,000 results
                    var obj = {
                        internalId: result.getValue({
                            name: "internalid"
                        }),
                        systemId: result.getValue({ name: constants.ESTIMATOR_SAVED.FIELDS.ID }),
                        systemName: result.getValue({ name: constants.ESTIMATOR_SAVED.FIELDS.NAME }),
                        customer: result.getValue({ name: constants.ESTIMATOR_SAVED.FIELDS.CUSTOMER }),
                        savedLabourPlan: result.getValue({ name: constants.ESTIMATOR_SAVED.FIELDS.LABOUR_PLAN }),
                        savedMiscCost: result.getValue({ name: constants.ESTIMATOR_SAVED.FIELDS.MISC_COST }),
                        savedData: result.getValue({ name: constants.ESTIMATOR_SAVED.FIELDS.SUBHEADERS })
                    }
                    data.push(obj);
                    return true;
                });
                if (data.length > 0) {
                    var firstData = data[0];
                    var sublistDetails;
                    if(labour){
                        sublistDetails = firstData.savedLabourPlan ? JSON.parse(firstData.savedLabourPlan) : [];
                    }else if(misc){
                        sublistDetails = firstData.savedMiscCost ? JSON.parse(firstData.savedMiscCost) : [];
                    }
                    else{
                        sublistDetails = firstData.savedData ? JSON.parse(firstData.savedData) : [];
                    }
                    return sublistDetails;
                }else{
                    return data;
                }
            }
        }
        function populateRawData(params, labour, misc) {
            var systemId = params.systemid;
            var customer = params.customer;
            var data = [];
            if(systemId){
                var userId = runtime.getCurrentUser().id;
                var rawFilters =  [
                    ["owner.internalid","anyof",userId],
                    "AND",
                    [constants.ESTIMATOR_RAW.FIELDS.ID,"is",systemId]
                ];
                var estimateRecSearch = search.create({
                    type: constants.ESTIMATOR_RAW.RECORD_TYPE,
                    filters: rawFilters,
                    columns:
                        [
                            "internalid",
                            constants.ESTIMATOR_RAW.FIELDS.ID,
                            constants.ESTIMATOR_RAW.FIELDS.NAME,
                            constants.ESTIMATOR_RAW.FIELDS.CUSTOMER,
                            constants.ESTIMATOR_RAW.FIELDS.LABOUR_PLAN,
                            constants.ESTIMATOR_RAW.FIELDS.MISC_COST,
                            constants.ESTIMATOR_RAW.FIELDS.SUBHEADERS
                        ]
                });
                estimateRecSearch.run().each(function(result){
                    // .run().each has a limit of 4,000 results
                    var obj = {
                        internalId: result.getValue({
                            name: "internalid"
                        }),
                        systemId: result.getValue({ name: constants.ESTIMATOR_RAW.FIELDS.NAME }),
                        customer: result.getValue({ name: constants.ESTIMATOR_RAW.FIELDS.CUSTOMER }),
                        labourPlan: result.getValue({ name: constants.ESTIMATOR_RAW.FIELDS.LABOUR_PLAN }),
                        miscCost: result.getValue({ name: constants.ESTIMATOR_RAW.FIELDS.MISC_COST }),
                        sublistDetails: result.getValue({ name: constants.ESTIMATOR_RAW.FIELDS.SUBHEADERS })
                    }
                    data.push(obj);
                    return true;
                });
                if (data.length > 0) {
                    var firstData = data[0];
                    var sublistDetails;
                    if(labour){
                        sublistDetails = firstData.labourPlan ? JSON.parse(firstData.labourPlan) : [];
                    }
                    else if(misc){
                        sublistDetails = firstData.miscCost ? JSON.parse(firstData.miscCost) : [];
                    }
                    else{
                        sublistDetails = firstData.sublistDetails ? JSON.parse(firstData.sublistDetails) : [];
                    }
                    return sublistDetails;
                }else{
                    return data;
                }
            }
        }
        function autoGenerateId() {
            try {
                var prefObj = preferences();
                var prefix, initialNo, currentNo;
                var autoGeneratedNoSearch = search.lookupFields({
                    type: constants.AUTO_GEN.RECORD_TYPE,
                    id: prefObj.AUTO_GEN,
                    columns: [
                        constants.AUTO_GEN.FIELDS.PREFIX,
                        constants.AUTO_GEN.FIELDS.INITIAL_NUM,
                        constants.AUTO_GEN.FIELDS.CURRENT_NUM
                    ]
                });

                if (autoGeneratedNoSearch) {
                    prefix = autoGeneratedNoSearch[constants.AUTO_GEN.FIELDS.PREFIX];
                    initialNo = autoGeneratedNoSearch[constants.AUTO_GEN.FIELDS.INITIAL_NUM];
                    currentNo = autoGeneratedNoSearch[constants.AUTO_GEN.FIELDS.CURRENT_NUM];
                }

                var autoNum = prefix + (parseInt(currentNo) + 1);
                return autoNum;
            } catch (e) {
                log.error("Exception: autoGenerateId", e);
            }
        }
        function searchEstimatorRec(systemId, recType) {
            var estRecSearch = search.create({
                type: recType,
                filters:
                    [
                        ["name","is",systemId],
                    ],
                columns: ["internalid"]
            });
            var internalId = '';
            estRecSearch.run().each(function(result){
                internalId = result.getValue({
                    name: "internalid"
                });
                return true;
            });
            return internalId;
        }
        function preferences() {
            try {
                var searchResults = search.create({
                    type: constants.PREFERENCES.RECORD_TYPE,
                    filters: [['name', 'is', 'TPC']],
                    columns: [
                        constants.PREFERENCES.FIELDS.LOCATION,
                        constants.PREFERENCES.FIELDS.AUTO_GEN,
                        constants.PREFERENCES.FIELDS.LABOUR_ITEM,
                        constants.PREFERENCES.FIELDS.MISC_ITEM,
                        constants.PREFERENCES.FIELDS.ROOMS_ITEM
                    ]
                });
                var results = searchResults.run().getRange(0, 1);
                return {
                    LOCATION: results[0].getValue({ name: constants.PREFERENCES.FIELDS.LOCATION }) || '',
                    AUTO_GEN: results[0].getValue({ name: constants.PREFERENCES.FIELDS.AUTO_GEN }) || '',
                    LABOR_ITEM: results[0].getValue({ name: constants.PREFERENCES.FIELDS.LABOUR_ITEM }) || '',
                    MISC_ITEM: results[0].getValue({ name: constants.PREFERENCES.FIELDS.MISC_ITEM }) || '',
                    ROOMS_ITEM: results[0].getValue({ name: constants.PREFERENCES.FIELDS.ROOMS_ITEM }) || '',
                }
            } catch (e) {
                log.error("Exception: preferences", e);
            }
        }
        function sublistColumnNames() {
            return [
                { value: "", text: '', code: "" },
                { value: "1", text: 'Index', code: "index" },
                { value: "2", text: 'Flag', code: "flagt" },
                { value: "3", text: 'Design Notes', code: "dn" },
                { value: "4", text: 'Quantity', code: "qty" },
                { value: "5", text: 'Manufacturer', code: "manuf" },
                { value: "6", text: 'Mpn', code: "mpn" },
                { value: "7", text: 'Item', code: "itemt" },
                { value: "8", text: 'Item Description', code: "desc" },
                { value: "9", text: 'STD Cost', code: "cost" },
                { value: "10", text: 'Ext Cost', code: "ec" },
                { value: "11", text: 'Special Pricing', code: "sp" },
                { value: "12", text: 'Base Price', code: "price" },
                { value: "13", text: 'Discount', code: "disc" },
                { value: "14", text: 'Total Price', code: "total" },
                { value: "15", text: 'Margin', code: "margin" },
                { value: "16", text: 'Unit Measure', code: "um" },
                { value: "17", text: 'Cost Category', code: "cc" },
                { value: "18", text: 'Item Type', code: "type" },
                { value: "19", text: 'Custom', code: "cus" },
                { value: "20", text: 'OFE', code: "ofe" },
                { value: "21", text: 'GSA', code: "gsa" },
                { value: "22", text: 'TAA', code: "taa" },
                { value: "23", text: 'Country of Manufacturer', code: "com" },
                { value: "24", text: 'Product Main Category', code: "pmc" },
                { value: "25", text: 'Product Sub Category', code: "psc" },
                { value: "26", text: 'Product Line', code: "pl" },
                { value: "27", text: 'Lead Time', code: "time" },
                { value: "28", text: 'Preferred', code: "pref" },
                { value: "29", text: 'Vendor Preferred', code: "prefv" },
                { value: "30", text: 'Rack Assembly', code: "rack" },
                { value: "31", text: 'Requires Commissioning', code: "rc" },
                { value: "32", text: 'Execution Notes', code: "enotes" },
                { value: "33", text: 'RU', code: "ru" },
                { value: "34", text: 'Extended RU', code: "eru" },
                { value: "35", text: 'Typical Power (WATTS)', code: "pow" },
                { value: "36", text: 'Ext.PWR', code: "epow" },
                { value: "37", text: 'Typical Heat', code: "heat" },
                { value: "38", text: 'Ext.Heat', code: "eheat" },
                { value: "39", text: 'ITEM Weight', code: "weight" },
                { value: "40", text: 'Ext.Weight', code: "ew" },
                { value: "41", text: 'Custom 1', code: "c1" },
                { value: "42", text: 'Custom 2', code: "c2" },
                { value: "43", text: 'Custom 3', code: "c3" },
                { value: "44", text: 'Custom 4', code: "c4" },
                { value: "45", text: 'Custom 5', code: "c5" },
                { value: "46", text: 'Logs', code: "logs" }
            ];
        }
        function shipAddressSearch(customer){
            var shipData = [];
            try{
                if(customer){
                    var customerSearchObj = search.create({
                        type: "customer",
                        filters:
                            [
                                ["internalid","anyof",customer]
                            ],
                        columns:
                            [
                                "addressinternalid",
                                "addresslabel",
                                search.createColumn({
                                    name: "isdefaultshipping",
                                    sort: search.Sort.DESC
                                })
                            ]
                    });
                    customerSearchObj.run().each(function(result){
                        shipData.push({
                            id: result.getValue({name: "addressinternalid"}),
                            value: result.getValue({name: "addresslabel"})
                        });
                        return true;
                    });
                }
                return shipData;
            }catch (e) {
                log.error("Exception: shipAddressSearch", e);
            }
        }
        function opportunityAddress(opp){
            if(!opp) return;
            var id = '';
            try{
                var oppLoad = record.load({
                   type: "opportunity",
                   id: opp,
                   isDynamic: true
                });
                id = oppLoad.getValue({
                    fieldId: "shipaddresslist"
                });
            }catch (e) {
                log.error("Exception: shipAddressSearchFromOpportunity", e);
            }
            return id;
        }
        return {onRequest}

    });
