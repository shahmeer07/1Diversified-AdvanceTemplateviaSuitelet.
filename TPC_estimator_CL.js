    /**
     * @NApiVersion 2.1
     * @NScriptType ClientScript
     */
    define(['N/currentRecord', 'N/url', 'N/record', 'N/search', 'N/ui/message', 'N/ui/dialog', 'N/log', 'N/runtime', '../Lib/div_tpc_constant.js','N/https'],
        function(currentRecord, url, record, search, message, dialog, log, runtime, constants,https) {
            var saveFlag = false;
            var reload = false;
            var saveButNotReload = false;
            var error = false;
            var errorMsg = '';
            var tabNo = -1;
            var fileid;
            function createJsonFile(systemId,userId,labourPlan,miscCost,subHeadersList, status){
                var title="createJsonFile::";
                try{
                    var obj = {
                        'status': status,
                        'systemid':systemId,
                        'userid': userId,
                        'labordata':labourPlan,
                        'miscdata': miscCost,
                        'roomsdata': subHeadersList
                    }
                    var responseobj = https.post({
                        url: 'https://9230983-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=7647&deploy=1&compid=9230983_SB1&ns-at=AAEJ7tMQdJqXREPvh_B-Slrn77lzwEyve7P2X5Rn6HovQsmLFoQ',
                        body:JSON.stringify(obj)
                    });
                    var jsonbody = JSON.parse(responseobj.body);
                }catch(error){
                    log.error(title+error.name,error.message);
                }
                return jsonbody.fileId
            }
            function main() {
                try {
                    var objRecord = currentRecord.get();
                    var existSysIdCB = objRecord.getValue({
                        fieldId: constants.ESTIMATOR.FIELDS.EXISTING_ID_CB
                    });
                    console.log("existSysIdCB",existSysIdCB);
                    var value = existSysIdCB ? "1" : "0";
                    var rollCb = objRecord.getValue({
                        fieldId: constants.ESTIMATOR.FIELDS.ROLL_CB
                    });
                    var roll = rollCb ? "1" : "0";
                    var systemId = objRecord.getValue({
                        fieldId: constants.ESTIMATOR.FIELDS.ID
                    });
                    var systemName = objRecord.getValue({
                        fieldId: constants.ESTIMATOR.FIELDS.NAME
                    });
                    systemName = removeReservedCharacters(systemName);
                    var customerName = objRecord.getValue({
                        fieldId: constants.ESTIMATOR.FIELDS.CUSTOMER
                    });
                    var project = objRecord.getValue({
                        fieldId: constants.ESTIMATOR.FIELDS.PROJECT
                    });
                    var opportunity = objRecord.getValue({
                        fieldId: constants.ESTIMATOR.FIELDS.OPPORTUNITY
                    });
                    if (systemId && systemName && (saveFlag || reload || saveButNotReload) && customerName) {
                        var url_string = window.location.href;
                        var urls = new URL(url_string);
                        var labourPlan = getLabourPlanData(objRecord);
                        if (Array.isArray(labourPlan)) {
                            labourPlan = JSON.stringify(labourPlan);
                        }
                        var miscCost = getMiscCostData(objRecord);
                        if (Array.isArray(miscCost)) {
                            miscCost = JSON.stringify(miscCost);
                        }
                        var sublistLength = parseInt(urls.searchParams.get('insert'));
                        var subHeadersList = getSublistData(objRecord, sublistLength);
                        if (subHeadersList === 'alert') {
                            return;
                        }
                        if (Array.isArray(subHeadersList)) {
                            subHeadersList = JSON.stringify(subHeadersList);
                        }
                        var userId = runtime.getCurrentUser().id;
                        var rawFilters = [
                            ["owner.internalid", "anyof", userId],
                            "AND",
                            ["name", "is", systemId]
                        ];
                        var saveFilters = [
                            ["name", "is", systemId]
                        ];
                        if (saveFlag) {
                            var searchAutoGenRec = search.lookupFields({
                                type: constants.AUTO_GEN.RECORD_TYPE,
                                id: 1,
                                columns: [constants.AUTO_GEN.FIELDS.CURRENT_NUM, constants.AUTO_GEN.FIELDS.PREFIX]
                            });
                            var currNum = searchAutoGenRec[constants.AUTO_GEN.FIELDS.CURRENT_NUM];
                            var prefix = searchAutoGenRec[constants.AUTO_GEN.FIELDS.PREFIX];
                            var saveExistingRec = searchEstimatorRec(constants.ESTIMATOR_SAVED.RECORD_TYPE, saveFilters);
                            if (saveExistingRec) {
                                var values = {};
                                values[constants.ESTIMATOR_SAVED.FIELDS.NAME] = systemName;
                                values[constants.ESTIMATOR_SAVED.FIELDS.CUSTOMER] = customerName;
                                values[constants.ESTIMATOR_SAVED.FIELDS.PROJECT] = project;
                                values[constants.ESTIMATOR_SAVED.FIELDS.OPPORTUNITY] = opportunity;
                                // values[constants.ESTIMATOR_SAVED.FIELDS.LABOUR_PLAN] = labourPlan;
                                // values[constants.ESTIMATOR_SAVED.FIELDS.MISC_COST] = miscCost;
                                // values[constants.ESTIMATOR_SAVED.FIELDS.SUBHEADERS] = subHeadersList;
                                var path = urls.pathname + urls.search;
                                if (urls) {
                                    values[constants.ESTIMATOR_SAVED.FIELDS.URL] = path
                                }
                                if(labourPlan || miscCost || subHeadersList){
                                    fileid = createJsonFile(systemId,userId,labourPlan,miscCost,subHeadersList, 'SAVED');
                                    log.debug("responseobj fileid",fileid);
                                    if(fileid) values[constants.ESTIMATOR_SAVED.FIELDS.FILE] = fileid;
                                }
                                var msg = message.create({
                                    title: 'Success',
                                    message: 'Record Updated!',
                                    type: message.Type.CONFIRMATION
                                });
                                if (existSysIdCB) {
                                    var saveRec = record.submitFields({
                                        type: constants.ESTIMATOR_SAVED.RECORD_TYPE,
                                        id: saveExistingRec,
                                        values: values
                                    });
                                    log.audit("Save Record Updated", saveRec);
                                    msg.show({
                                        duration: 5000 // will disappear after 5s
                                    });
                                } else {
                                    dialog.create({
                                        title: 'Record Exists',
                                        message: 'A record with the same NetSuite ID already exists. Choose an action:',
                                        buttons: [{
                                            label: 'Change ID',
                                            value: 'change'
                                        },
                                            {
                                                label: 'Cancel',
                                                value: 'cancel'
                                            }
                                        ]
                                    }).then(function(result) {
                                        if (result === 'change') {
                                            if (currNum) {
                                                var newNum = parseInt(currNum) + 1;
                                                objRecord.setValue({
                                                    fieldId: constants.ESTIMATOR.FIELDS.ID,
                                                    value: prefix + newNum
                                                });
                                                reload = true;
                                                main();
                                                reload = false;
                                            }
                                        }
                                    }).catch(function(error) {
                                        log.error('Error displaying dialog:', error);
                                    });
                                    return;
                                }
                            } else {
                                var estimatorSaveRec = record.create({
                                    type: constants.ESTIMATOR_SAVED.RECORD_TYPE,
                                    isDynamic: true
                                });
                                if (systemId) estimatorSaveRec.setValue(constants.ESTIMATOR_SAVED.FIELDS.ID, systemId);
                                if (systemName) estimatorSaveRec.setValue(constants.ESTIMATOR_SAVED.FIELDS.NAME, systemName);
                                if (customerName) estimatorSaveRec.setValue(constants.ESTIMATOR_SAVED.FIELDS.CUSTOMER, customerName);
                                if (project) estimatorSaveRec.setValue(constants.ESTIMATOR_SAVED.FIELDS.PROJECT, project);
                                if (opportunity) estimatorSaveRec.setValue(constants.ESTIMATOR_SAVED.FIELDS.OPPORTUNITY, opportunity);
                                // if (labourPlan) estimatorSaveRec.setValue(constants.ESTIMATOR_SAVED.FIELDS.LABOUR_PLAN, labourPlan);
                                // if (miscCost) estimatorSaveRec.setValue(constants.ESTIMATOR_SAVED.FIELDS.MISC_COST, miscCost);
                                // if (subHeadersList) estimatorSaveRec.setValue(constants.ESTIMATOR_SAVED.FIELDS.SUBHEADERS, subHeadersList);
                                var path = urls.pathname + urls.search;
                                if (urls) estimatorSaveRec.setValue(constants.ESTIMATOR_SAVED.FIELDS.URL, path);
                                if(labourPlan || miscCost || subHeadersList){
                                    fileid = createJsonFile(systemId,userId,labourPlan,miscCost,subHeadersList, 'SAVED');
                                    log.debug("responseobj fileid",fileid);
                                    if(fileid) estimatorSaveRec.setValue(constants.ESTIMATOR_SAVED.FIELDS.FILE, fileid);
                                }
                                var saveRec = estimatorSaveRec.save();
                                log.audit("Save Record Created", saveRec);
                                if (currNum) {
                                    var newNum = parseInt(currNum) + 1;
                                    var autoNumRec = record.submitFields({
                                        type: constants.AUTO_GEN.RECORD_TYPE,
                                        id: 1,
                                        values: {
                                            [constants.AUTO_GEN.FIELDS.CURRENT_NUM]: newNum
                                        }
                                    });
                                    log.audit("Auto Generate Rec Updated", autoNumRec);
                                }
                                value = "1";
                                message.create({
                                    title: 'Success',
                                    message: 'You have successfully saved the data!',
                                    type: message.Type.CONFIRMATION
                                }).show({
                                    duration: 5000 // will disappear after 5s
                                });
                            }
                        }
                        var recId = searchEstimatorRec(constants.ESTIMATOR_RAW.RECORD_TYPE, rawFilters);
                        if (recId) {
                            var values = {};
                            values[constants.ESTIMATOR_RAW.FIELDS.NAME] = systemName;
                            values[constants.ESTIMATOR_RAW.FIELDS.CUSTOMER] = customerName;
                            values[constants.ESTIMATOR_RAW.FIELDS.PROJECT] = project;
                            values[constants.ESTIMATOR_RAW.FIELDS.OPPORTUNITY] = opportunity;
                            // values[constants.ESTIMATOR_RAW.FIELDS.LABOUR_PLAN] = labourPlan;
                            // values[constants.ESTIMATOR_RAW.FIELDS.MISC_COST] = miscCost;
                            // values[constants.ESTIMATOR_RAW.FIELDS.SUBHEADERS] = subHeadersList;
                            fileid = createJsonFile(systemId,userId,labourPlan,miscCost,subHeadersList, 'RAW');
                            log.debug("responseobj fileid",fileid);
                            if(fileid) values[constants.ESTIMATOR_RAW.FIELDS.FILE] = fileid;
                            var rawRec = record.submitFields({
                                type: constants.ESTIMATOR_RAW.RECORD_TYPE,
                                id: recId,
                                values: values
                            });
                            log.audit("Raw Record Updated", rawRec);
                        } else {
                            var estimatorRawRec = record.create({
                                type: constants.ESTIMATOR_RAW.RECORD_TYPE,
                                isDynamic: true
                            });
                            if (systemId) estimatorRawRec.setValue(constants.ESTIMATOR_RAW.FIELDS.ID, systemId);
                            if (systemName) estimatorRawRec.setValue(constants.ESTIMATOR_RAW.FIELDS.NAME, systemName);
                            if (customerName) estimatorRawRec.setValue(constants.ESTIMATOR_RAW.FIELDS.CUSTOMER, customerName);
                            if (project) estimatorRawRec.setValue(constants.ESTIMATOR_RAW.FIELDS.PROJECT, project);
                            if (opportunity) estimatorRawRec.setValue(constants.ESTIMATOR_RAW.FIELDS.OPPORTUNITY, opportunity);
                            // if (labourPlan) estimatorRawRec.setValue(constants.ESTIMATOR_RAW.FIELDS.LABOUR_PLAN, labourPlan);
                            // if (miscCost) estimatorRawRec.setValue(constants.ESTIMATOR_RAW.FIELDS.MISC_COST, miscCost);
                            // if (subHeadersList) estimatorRawRec.setValue(constants.ESTIMATOR_RAW.FIELDS.SUBHEADERS, subHeadersList);
                            fileid = createJsonFile(systemId,userId,labourPlan,miscCost,subHeadersList, 'RAW');
                            log.debug("responseobj fileid",fileid);
                            if(fileid) estimatorRawRec.setValue(constants.ESTIMATOR_RAW.FIELDS.FILE, fileid);
                            var rawRec = estimatorRawRec.save();
                            log.audit("Raw Record Created", rawRec);
                        }
                        if(saveButNotReload){
                            return;
                        }
                        var subHeaders = urls.searchParams.get('subheaders');
                        // Check if parameters already exist in the URL
                        var jobUrl = urls.searchParams.get('job');
                        var oppUrl = urls.searchParams.get('opp');
                        var sysIdUrl = urls.searchParams.get('systemid');
                        var sysNameUrl = urls.searchParams.get('systemname');
                        var cusUrl = urls.searchParams.get('customer');
                        if (urls.searchParams.has('insert')) {
                            if (sysIdUrl || sysIdUrl == "" || sysIdUrl == undefined) {
                                if (systemId) urls.searchParams.set('systemid', systemId);
                            } else {
                                if (systemId) urls.searchParams.append('systemid', systemId);
                            }
                            if (sysNameUrl || sysNameUrl == "" || sysNameUrl == undefined) {
                                if (systemName) urls.searchParams.set('systemname', systemName);
                            } else {
                                if (systemName) urls.searchParams.append('systemname', systemName);
                            }
                            if (cusUrl || cusUrl == "" || cusUrl == undefined) {
                                if (customerName) urls.searchParams.set('customer', customerName);
                            } else {
                                if (customerName) urls.searchParams.append('customer', customerName);
                            }
                            if (jobUrl || jobUrl == "" || jobUrl == undefined) {
                                if (project) urls.searchParams.set('job', project);
                            } else {
                                if (project) urls.searchParams.append('job', project);
                            }
                            if (oppUrl || oppUrl == "" || oppUrl == undefined) {
                                if (opportunity) urls.searchParams.set('opp', opportunity);
                            } else {
                                if (opportunity) urls.searchParams.append('opp', opportunity);
                            }
                            if (subHeaders || subHeaders == "" || subHeaders == undefined) urls.searchParams.set('subheaders', subHeaders);
                            if (urls.searchParams.get('e')) {
                                urls.searchParams.set('e', value);
                            } else {
                                urls.searchParams.append('e', value);
                            }
                            if (urls.searchParams.get('rol')) {
                                urls.searchParams.set('rol', roll);
                            } else {
                                urls.searchParams.append('rol', roll);
                            }
                            if (urls.searchParams.get('oldname')) urls.searchParams.delete('oldname');
                            if (urls.searchParams.get('newname')) urls.searchParams.delete('newname');
                            if (urls.searchParams.get('get')) urls.searchParams.delete('get');
                            if (urls.searchParams.get('copysubheader')) {
                                urls.searchParams.delete('copysubheader');
                            }
                        } else {
                            // Add parameters to the URL
                            if (sysIdUrl || sysIdUrl == "" || sysIdUrl == undefined) {
                                if (systemId) urls.searchParams.set('systemid', systemId);
                            } else {
                                if (systemId) urls.searchParams.append('systemid', systemId);
                            }
                            if (sysNameUrl || sysNameUrl == "" || sysNameUrl == undefined) {
                                if (systemName) urls.searchParams.set('systemname', systemName);
                            } else {
                                if (systemName) urls.searchParams.append('systemname', systemName);
                            }
                            if (cusUrl || cusUrl == "" || cusUrl == undefined) {
                                if (customerName) urls.searchParams.set('customer', customerName);
                            } else {
                                if (customerName) urls.searchParams.append('customer', customerName);
                            }
                            if (jobUrl || jobUrl == "" || jobUrl == undefined) {
                                if (project) urls.searchParams.set('job', project);
                            } else {
                                if (project) urls.searchParams.append('job', project);
                            }
                            if (oppUrl || oppUrl == "" || oppUrl == undefined) {
                                if (opportunity) urls.searchParams.set('opp', opportunity);
                            } else {
                                if (opportunity) urls.searchParams.append('opp', opportunity);
                            }
                            if (subHeaders || subHeaders == "" || subHeaders == undefined) {
                                if (subHeaders) urls.searchParams.set('subheaders', subHeaders);
                            } else {
                                if (subHeaders) urls.searchParams.append('subheaders', subHeaders);
                            }
                            if (urls.searchParams.get('e')) {
                                urls.searchParams.set('e', value);
                            } else {
                                urls.searchParams.append('e', value);
                            }
                            if (urls.searchParams.get('rol')) {
                                urls.searchParams.set('rol', roll);
                            } else {
                                urls.searchParams.append('rol', roll);
                            }
                        }
                        var activeTab = jQuery('.formtabon');
                        if (activeTab) {
                            var activeTabId = activeTab.attr('id');
                            activeTabId = activeTabId.replace("lnk", "");
                            if (urls.searchParams.get('selectedtab')) {
                                urls.searchParams.set('selectedtab', activeTabId);
                            } else {
                                urls.searchParams.append('selectedtab', activeTabId);
                            }
                        }
                        var finalUrl = urls.toString();
                        window.onbeforeunload = null;
                        window.open(finalUrl, "_self");
                    } else {
                        alert("Please enter value(s) for: NetSuite ID, NetSuite ID Name");
                        error = true;
                    }
                } catch (e) {
                    log.error("Exception: main", e);
                }
            }
            function pageInit(context) {
                try {
                    jQuery("#custpage_customer_popup_new").closest(".uir-field-widget").hide();
                } catch (e) {
                    log.error("Exception: PageInit", e);
                }
            }
            function fieldChanged(context) {
                try {
                    var currentRec = currentRecord.get();
                    var fieldId = context.fieldId;
                    var itemId, itemQty, mpnfld, qty, discFld, roomIdFld,indexId, filterFld;
                    var url_string = window.location.href;
                    var urls = new URL(url_string);
                    if (fieldId.includes(constants.ESTIMATOR.ROOMS.SUBLIST.ITEM)) {
                        itemId = fieldId;
                    }
                    if (fieldId.includes(constants.ESTIMATOR.ROOMS.SUBLIST.QTY)) {
                        itemQty = fieldId;
                    }
                    if (fieldId.includes(constants.ESTIMATOR.ROOMS.SUBLIST.MPN)) {
                        mpnfld = fieldId;
                    }
                    if (fieldId.includes(constants.ESTIMATOR.ROOMS.SUBLIST.DISCOUNT)) {
                        discFld = fieldId;
                    }
                    if (fieldId.includes(constants.ESTIMATOR.ROOMS.ROOM_ID)) {
                        roomIdFld = fieldId;
                    }
                    if (fieldId.includes(constants.ESTIMATOR.ROOMS.FILTERS)) {
                        filterFld = fieldId;
                    }
                    if (fieldId.includes(constants.ESTIMATOR.ROOMS.SUBLIST.INDEX)) {
                        indexId = fieldId;
                    }
                    if (fieldId.includes(constants.ESTIMATOR.ROOMS.QUANTITY)) {
                        qty = context.currentRecord.getValue(fieldId);
                        qty = qty ? parseFloat(qty) : '';
                        if (qty && qty > 1000) {
                            dialog.alert({
                                title: "Maximum Quantity Validation",
                                message: "The Maximum Limit For this Field is : 1000"
                            });
                            context.currentRecord.setValue({
                                fieldId: fieldId,
                                value: 1000
                            });
                        }
                    }
                    else if (context.fieldId === constants.ESTIMATOR.FIELDS.CUSTOMER) {
                        var customer = currentRec.getValue(constants.ESTIMATOR.FIELDS.CUSTOMER);
                        if (urls.searchParams.get('customer')) {
                            if (customer) urls.searchParams.set('customer', customer);
                        } else {
                            if (customer) urls.searchParams.append('customer', customer);
                        }
                        if (urls.searchParams.get('systemid')) urls.searchParams.delete('systemid');
                        if (urls.searchParams.get('subheaders')) urls.searchParams.delete('subheaders');
                        if (urls.searchParams.get('oldname')) urls.searchParams.delete('oldname');
                        if (urls.searchParams.get('newname')) urls.searchParams.delete('newname');
                        if (urls.searchParams.get('get')) urls.searchParams.delete('get');
                        if (urls.searchParams.get('copysubheader')) urls.searchParams.delete('copysubheader');
                        if (urls.searchParams.get('existingsystemid')) urls.searchParams.delete('existingsystemid');
                        if (urls.searchParams.get('e')) urls.searchParams.delete('e');
                        if (urls.searchParams.get('insert')) urls.searchParams.delete('insert');
                        if (urls.searchParams.get('job')) urls.searchParams.delete('job');
                        if (urls.searchParams.get('opp')) urls.searchParams.delete('opp');
                        if (urls.searchParams.get('systemname')) urls.searchParams.delete('systemname');
                        var finalUrl = urls.toString();
                        window.onbeforeunload = null;
                        window.open(finalUrl, "_self");
                    }
                    else if (context.fieldId === constants.ESTIMATOR.LABOUR_PLAN.ITEM) {
                        var item = currentRec.getCurrentSublistValue({
                            sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                            fieldId: constants.ESTIMATOR.LABOUR_PLAN.ITEM
                        });
                        if (item) {

                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.LABOUR_PLAN.QTY,
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.LABOUR_PLAN.PRICE,
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.LABOUR_PLAN.DISCOUNT,
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.LABOUR_PLAN.TOTAL_PRICE,
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.LABOUR_PLAN.COST,
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.LABOUR_PLAN.EXT_COST,
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.LABOUR_PLAN.MARGIN_PERCENT,
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.LABOUR_PLAN.LOGS,
                                value: ''
                            });

                            var cost;
                            var searchItems = search.lookupFields({
                                type: 'item',
                                id: item,
                                columns: ['baseprice', 'lastpurchaseprice', 'cost','costestimate']
                            });
                            var rate = searchItems.baseprice;
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.LABOUR_PLAN.PRICE,
                                value: rate || 0
                            });
                            var itemDefinedCost = searchItems.costestimate;
                            var lastpurchaseprice = searchItems.lastpurchaseprice;
                            var purchasePrice = searchItems.cost;
                            if(itemDefinedCost){
                                cost = itemDefinedCost;
                            }else if (lastpurchaseprice) {
                                cost = lastpurchaseprice;
                            } else if (purchasePrice) {
                                cost = purchasePrice;
                            }
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.LABOUR_PLAN.COST,
                                value: cost || 0
                            });
                            var logs = currentRec.getCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.LABOUR_PLAN.LOGS
                            });
                            if(logs){
                                currentRec.setCurrentSublistValue({
                                    sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                                    fieldId: constants.ESTIMATOR.LABOUR_PLAN.LOGS,
                                    value: ""
                                });
                            }
                        }
                    }
                    else if (context.fieldId === constants.ESTIMATOR.LABOUR_PLAN.QTY) {
                        var qty = currentRec.getCurrentSublistValue({
                            sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                            fieldId: constants.ESTIMATOR.LABOUR_PLAN.QTY
                        });
                        if (qty) {
                            var rate = currentRec.getCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.LABOUR_PLAN.PRICE
                            }) || 0;
                            var cost = currentRec.getCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.LABOUR_PLAN.COST
                            }) || 0;
                            var discount = currentRec.getCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.LABOUR_PLAN.DISCOUNT
                            }) || 0;
                            var total = qty * rate;
                            var extCost = qty * cost;
                            var discountAmount = (discount / 100) * total;
                            var discountedPrice = total - discountAmount;
                            var marginPercent = (discountedPrice - extCost) / discountedPrice;
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.LABOUR_PLAN.TOTAL_PRICE,
                                value: discountedPrice || 0
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.LABOUR_PLAN.EXT_COST,
                                value: extCost || 0
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.LABOUR_PLAN.MARGIN_PERCENT,
                                value: marginPercent || 0
                            });
                        }
                    }
                    else if (context.fieldId === constants.ESTIMATOR.LABOUR_PLAN.DISCOUNT) {
                        var discount = currentRec.getCurrentSublistValue({
                            sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                            fieldId: constants.ESTIMATOR.LABOUR_PLAN.DISCOUNT
                        });
                        if (discount) {
                            var qty = currentRec.getCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.LABOUR_PLAN.QTY
                            });
                            var rate = currentRec.getCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.LABOUR_PLAN.PRICE
                            }) || 0;
                            var cost = currentRec.getCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.LABOUR_PLAN.COST
                            }) || 0;
                            var total = qty * rate;
                            var extCost = qty * cost;
                            var discountAmount = (discount / 100) * total;
                            var discountedPrice = total - discountAmount;
                            var marginPercent = (discountedPrice - extCost) / discountedPrice;
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.LABOUR_PLAN.TOTAL_PRICE,
                                value: discountedPrice || 0
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.LABOUR_PLAN.MARGIN_PERCENT,
                                value: marginPercent || 0
                            });
                        }
                    }
                    else if (context.fieldId === constants.ESTIMATOR.MISC_COST.ITEM) {
                        var item = currentRec.getCurrentSublistValue({
                            sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                            fieldId: constants.ESTIMATOR.MISC_COST.ITEM
                        });
                        if (item) {

                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.MISC_COST.QTY,
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.MISC_COST.PRICE,
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.MISC_COST.DISCOUNT,
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.MISC_COST.TOTAL_PRICE,
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.MISC_COST.COST,
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.MISC_COST.EXT_COST,
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.MISC_COST.MARGIN_PERCENT,
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.MISC_COST.LOGS,
                                value: ''
                            });

                            var cost;
                            var searchItems = search.lookupFields({
                                type: 'item',
                                id: item,
                                columns: ['baseprice', 'lastpurchaseprice', 'cost', 'costestimate']
                            });
                            var rate = searchItems.baseprice;
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.MISC_COST.PRICE,
                                value: rate || 0
                            });
                            var itemDefinedCost = searchItems.costestimate;
                            var lastpurchaseprice = searchItems.lastpurchaseprice;
                            var purchasePrice = searchItems.cost;
                            if(itemDefinedCost){
                                cost = itemDefinedCost;
                            }else if (lastpurchaseprice) {
                                cost = lastpurchaseprice;
                            } else if (purchasePrice) {
                                cost = purchasePrice;
                            }
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.MISC_COST.COST,
                                value: cost || 0
                            });
                            var logs = currentRec.getCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.MISC_COST.LOGS
                            });
                            if(logs){
                                currentRec.setCurrentSublistValue({
                                    sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                                    fieldId: constants.ESTIMATOR.MISC_COST.LOGS,
                                    value: ""
                                });
                            }
                        }
                    }
                    else if (context.fieldId === constants.ESTIMATOR.MISC_COST.QTY) {
                        var qty = currentRec.getCurrentSublistValue({
                            sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                            fieldId: constants.ESTIMATOR.MISC_COST.QTY
                        });
                        if (qty) {
                            var rate = currentRec.getCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.MISC_COST.PRICE
                            }) || 0;
                            var cost = currentRec.getCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.MISC_COST.COST
                            }) || 0;
                            var discount = currentRec.getCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.MISC_COST.DISCOUNT
                            }) || 0;
                            var total = qty * rate;
                            var extCost = qty * cost;
                            var discountAmount = (discount / 100) * total;
                            var discountedPrice = total - discountAmount;
                            var marginPercent = (discountedPrice - extCost) / discountedPrice;
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.MISC_COST.TOTAL_PRICE,
                                value: discountedPrice || 0
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.MISC_COST.EXT_COST,
                                value: extCost || 0
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.MISC_COST.MARGIN_PERCENT,
                                value: marginPercent || 0
                            });
                        }
                    }
                    else if (context.fieldId === constants.ESTIMATOR.MISC_COST.DISCOUNT) {
                        var discount = currentRec.getCurrentSublistValue({
                            sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                            fieldId: constants.ESTIMATOR.MISC_COST.DISCOUNT
                        });
                        if (discount) {
                            var qty = currentRec.getCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.MISC_COST.QTY
                            });
                            var rate = currentRec.getCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.MISC_COST.PRICE
                            }) || 0;
                            var cost = currentRec.getCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.MISC_COST.COST
                            }) || 0;
                            var total = qty * rate;
                            var extCost = qty * cost;
                            var discountAmount = (discount / 100) * total;
                            var discountedPrice = total - discountAmount;
                            var marginPercent = (discountedPrice - extCost) / discountedPrice;
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.MISC_COST.TOTAL_PRICE,
                                value: discountedPrice || 0
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.MISC_COST.MARGIN_PERCENT,
                                value: marginPercent || 0
                            });
                        }
                    }
                    else if (context.fieldId === itemId) {
                        var itemFldId = constants.ESTIMATOR.ROOMS.SUBLIST.ITEM;
                        var sublistNo = itemId.substring(itemFldId.length);
                        var item = currentRec.getCurrentSublistValue({
                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                            fieldId: itemId
                        });
                        if (item) {
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.FLAG + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.DESIGN_NOTES + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.QTY + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.MANUF + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.MPN + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.ITEM_DESC + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.COST + parseInt(sublistNo),
                                value: 0
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_COST + parseInt(sublistNo),
                                value: 0
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.PRICE + parseInt(sublistNo),
                                value: 0
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.DISCOUNT + parseInt(sublistNo),
                                value: 0
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.TOTAL_PRICE + parseInt(sublistNo),
                                value: 0
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.MARGIN_PERCENT + parseInt(sublistNo),
                                value: 0
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.UNIT_MEASURE + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.COST_CAT + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.ITEM_TYPE + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.CUSTOM + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.OFE + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.SPECIAL_PRICING + parseInt(sublistNo),
                                value: false
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.GSA + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.TAA + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.COUNTRY_OF_MANUF + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.PROD_MAIN_CAT + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.PROD_SUB_CAT + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.PROD_LINE + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.LEAD_TIME + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.PREF + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.PREF_VENDOR + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.RACK + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.REQD_COMM + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXE_NOTES + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.RU + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_RU + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.POW + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_POW + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.HEAT + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_HEAT + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.WEIGHT + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_WEIGHT + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.C1 + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.C2 + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.C3 + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.C4 + parseInt(sublistNo),
                                value: ''
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.C5 + parseInt(sublistNo),
                                value: ''
                            });

                            var searchItem = search.lookupFields({
                                type: "item",
                                id: parseInt(item),
                                columns: [
                                    'type', 'displayname', 'quantityavailable', 'costestimate', 'manufacturer', 'mpn', 'cost',
                                    'custitem_prod_category', 'custitem_prod_subcategory', 'leadtime', 'custitemmaxpower',
                                    'custitemmaxheat', 'custitemrequirescommissioning', 'custitemru', 'baseprice', 'unitstype',
                                    'costcategory', 'custitemcustom', 'custitemofe', 'custitemgsa', 'custitemtaacompliant',
                                    'countryofmanufacture', 'custitemx_productline', 'weight', 'othervendor', 'lastpurchaseprice', 'custitem_item_eol'
                                ]
                            });
                            var type = searchItem.type[0].text;
                            var manufacturer = searchItem.manufacturer;
                            var mpn = searchItem.mpn;
                            var price = searchItem.baseprice;
                            var prodCategory = searchItem.custitem_prod_category;
                            var prodSubCategory = searchItem.custitem_prod_subcategory;
                            var leadTime = searchItem.leadtime;
                            var power = searchItem.custitemmaxpower;
                            var heat = searchItem.custitemmaxheat;
                            var commReq = searchItem.custitemrequirescommissioning;
                            var ru = searchItem.custitemru;
                            var unitDesc = searchItem.displayname;
                            var unitMeasure = searchItem.unitstype;
                            var costCategory = searchItem.costcategory;
                            var custom = searchItem.custitemcustom;
                            var ofe = searchItem.custitemofe;
                            var gsa = searchItem.custitemgsa;
                            var taa = searchItem.custitemtaacompliant;
                            var countryManuf = searchItem.countryofmanufacture;
                            var productLine = searchItem.custitemx_productline;
                            var weight = searchItem.weight;
                            var vendor = searchItem.othervendor;
                            var cost;
                            var itemDefinedCost = searchItem.costestimate;
                            var lastpurchaseprice = searchItem.lastpurchaseprice;
                            var purchasePrice = searchItem.cost;
                            var eol = searchItem.custitem_item_eol;
                            if(itemDefinedCost){
                                cost = itemDefinedCost;
                            }else if (lastpurchaseprice) {
                                cost = lastpurchaseprice;
                            } else if (purchasePrice) {
                                cost = purchasePrice;
                            }
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.COST + parseInt(sublistNo),
                                value: cost || 0
                            });
                            var extCost = currentRec.getCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_COST + parseInt(sublistNo)
                            });
                            if (!extCost) {
                                currentRec.setCurrentSublistValue({
                                    sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                    fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_COST + parseInt(sublistNo),
                                    value: 0
                                });
                            }
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.PRICE + parseInt(sublistNo),
                                value: price || 0
                            });
                            var totalPrice = currentRec.getCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.TOTAL_PRICE + parseInt(sublistNo)
                            });
                            if (!totalPrice) {
                                currentRec.setCurrentSublistValue({
                                    sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                    fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.TOTAL_PRICE + parseInt(sublistNo),
                                    value: 0
                                });
                            }
                            if (manufacturer) {
                                currentRec.setCurrentSublistValue({
                                    sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                    fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.MANUF + parseInt(sublistNo),
                                    value: manufacturer
                                });
                            }
                            if (mpn) {
                                currentRec.setCurrentSublistValue({
                                    sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                    fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.MPN + parseInt(sublistNo),
                                    value: mpn,
                                    ignoreFieldChange: true,
                                    forceSyncSourcing: true
                                });
                            }
                            if (prodCategory.length > 0) {
                                currentRec.setCurrentSublistValue({
                                    sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                    fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.PROD_MAIN_CAT + parseInt(sublistNo),
                                    value: prodCategory[0].text
                                });
                            }
                            if (prodSubCategory.length > 0) {
                                currentRec.setCurrentSublistValue({
                                    sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                    fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.PROD_SUB_CAT + parseInt(sublistNo),
                                    value: prodSubCategory[0].text
                                });
                            }
                            if (leadTime) {
                                currentRec.setCurrentSublistValue({
                                    sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                    fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.LEAD_TIME + parseInt(sublistNo),
                                    value: leadTime
                                });
                            }
                            if (power) {
                                currentRec.setCurrentSublistValue({
                                    sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                    fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.POW + parseInt(sublistNo),
                                    value: power
                                });
                            }
                            var extPower = currentRec.getCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_POW + parseInt(sublistNo)
                            });
                            if (!extPower) {
                                currentRec.setCurrentSublistValue({
                                    sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                    fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_POW + parseInt(sublistNo),
                                    value: 0
                                });
                            }
                            if (heat) {
                                currentRec.setCurrentSublistValue({
                                    sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                    fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.HEAT + parseInt(sublistNo),
                                    value: heat
                                });
                            }
                            var extHeat = currentRec.getCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_HEAT + parseInt(sublistNo)
                            });
                            if (!extHeat) {
                                currentRec.setCurrentSublistValue({
                                    sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                    fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_HEAT + parseInt(sublistNo),
                                    value: 0
                                });
                            }
                            if (commReq) {
                                currentRec.setCurrentSublistValue({
                                    sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                    fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.REQD_COMM + parseInt(sublistNo),
                                    value: commReq
                                });
                            }
                            if (ru) {
                                currentRec.setCurrentSublistValue({
                                    sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                    fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.RU + parseInt(sublistNo),
                                    value: ru
                                });
                            }
                            var extRu = currentRec.getCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_RU + parseInt(sublistNo)
                            });
                            if (!extRu) {
                                currentRec.setCurrentSublistValue({
                                    sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                    fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_RU + parseInt(sublistNo),
                                    value: 0
                                });
                            }
                            if (unitDesc) {
                                currentRec.setCurrentSublistValue({
                                    sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                    fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.ITEM_DESC + parseInt(sublistNo),
                                    value: unitDesc
                                });
                            }
                            if (unitMeasure && unitMeasure.length>0) {
                                currentRec.setCurrentSublistValue({
                                    sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                    fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.UNIT_MEASURE + parseInt(sublistNo),
                                    value: unitMeasure[0].text
                                });
                            }
                            if (costCategory) {
                                currentRec.setCurrentSublistValue({
                                    sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                    fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.COST_CAT + parseInt(sublistNo),
                                    value: costCategory
                                });
                            }
                            if (type) {
                                currentRec.setCurrentSublistValue({
                                    sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                    fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.ITEM_TYPE + parseInt(sublistNo),
                                    value: type
                                });
                            }
                            if (custom && custom.length>0) {
                                currentRec.setCurrentSublistValue({
                                    sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                    fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.CUSTOM + parseInt(sublistNo),
                                    value: custom[0].text
                                });
                            }
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.OFE + parseInt(sublistNo),
                                value: ofe
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.GSA + parseInt(sublistNo),
                                value: gsa
                            });
                            if (taa && taa.length>0) {
                                currentRec.setCurrentSublistValue({
                                    sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                    fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.TAA + parseInt(sublistNo),
                                    value: taa[0].text
                                });
                            }
                            if (countryManuf) {
                                currentRec.setCurrentSublistValue({
                                    sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                    fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.COUNTRY_OF_MANUF + parseInt(sublistNo),
                                    value: countryManuf
                                });
                            }
                            if (productLine) {
                                currentRec.setCurrentSublistValue({
                                    sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                    fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.PROD_LINE + parseInt(sublistNo),
                                    value: productLine
                                });
                            }
                            if (weight) {
                                currentRec.setCurrentSublistValue({
                                    sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                    fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.WEIGHT + parseInt(sublistNo),
                                    value: weight
                                });
                            }
                            var extWeight = currentRec.getCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_WEIGHT + parseInt(sublistNo)
                            });
                            if (!extWeight) {
                                currentRec.setCurrentSublistValue({
                                    sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                    fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_WEIGHT + parseInt(sublistNo),
                                    value: 0
                                });
                            }
                            if (vendor.length > 0) {
                                currentRec.setCurrentSublistValue({
                                    sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                    fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.PREF + parseInt(sublistNo),
                                    value: 'true'
                                });
                                currentRec.setCurrentSublistValue({
                                    sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                    fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.PREF_VENDOR + parseInt(sublistNo),
                                    value: vendor[0].value
                                });
                            }
                            if(eol){
                                eol = new Date(eol);
                                console.log("eol",eol);
                                currentRec.setCurrentSublistValue({
                                    sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                    fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EOL + parseInt(sublistNo),
                                    value: eol
                                });
                            }
                            var logs = currentRec.getCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.LOGS + parseInt(sublistNo)
                            });
                            if(logs){
                                currentRec.setCurrentSublistValue({
                                    sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                    fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.LOGS + parseInt(sublistNo),
                                    value: ""
                                });
                            }
                        }
                    }
                    else if (context.fieldId === itemQty) {
                        var qtyFldId = constants.ESTIMATOR.ROOMS.SUBLIST.QTY;
                        var sublistNo = itemQty.substring(qtyFldId.length);
                        var qtyFld = currentRec.getCurrentSublistValue({
                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                            fieldId: itemQty
                        });
                        var stdCostFld = currentRec.getCurrentSublistValue({
                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.COST + parseInt(sublistNo)
                        });
                        var price = currentRec.getCurrentSublistValue({
                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.PRICE + parseInt(sublistNo)
                        });
                        var powerConsumption = currentRec.getCurrentSublistValue({
                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.POW + parseInt(sublistNo)
                        });
                        var heatOutput = currentRec.getCurrentSublistValue({
                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.HEAT + parseInt(sublistNo)
                        });
                        var ru = currentRec.getCurrentSublistValue({
                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.RU + parseInt(sublistNo)
                        });
                        var weight = currentRec.getCurrentSublistValue({
                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.WEIGHT + parseInt(sublistNo)
                        });
                        var discount = currentRec.getCurrentSublistValue({
                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.DISCOUNT + parseInt(sublistNo)
                        });
                        if (qtyFld) {
                            if (!stdCostFld) stdCostFld = 0;
                            if (!powerConsumption) powerConsumption = 0;
                            if (!heatOutput) heatOutput = 0;
                            if (!price) price = 0;
                            if (!ru) ru = 0;
                            if (!weight) weight = 0;
                            if (!discount) discount = 0;
                            var total = qtyFld * stdCostFld;
                            var totalPrice = qtyFld * price;
                            var discountAmount = (discount / 100) * totalPrice;
                            var discountedPrice = totalPrice - discountAmount;
                            var marginPercent = (discountedPrice - total) / discountedPrice;
                            var extPowerCons = qtyFld * powerConsumption;
                            var extHeatOutput = qtyFld * heatOutput;
                            var extRu = qtyFld * ru;
                            var extWeight = qtyFld * weight;
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_COST + parseInt(sublistNo),
                                value: total
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_RU + parseInt(sublistNo),
                                value: extRu
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.TOTAL_PRICE + parseInt(sublistNo),
                                value: discountedPrice
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_POW + parseInt(sublistNo),
                                value: extPowerCons
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_HEAT + parseInt(sublistNo),
                                value: extHeatOutput
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_WEIGHT + parseInt(sublistNo),
                                value: extWeight
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.MARGIN_PERCENT + parseInt(sublistNo),
                                value: marginPercent || 0
                            });
                            var lineIndex = currentRec.getCurrentSublistIndex({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                            });
                            if (lineIndex === 0) {
                                var sn = currentRec.getCurrentSublistValue({
                                    sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                    fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.INDEX + parseInt(sublistNo),
                                });
                                if (!sn) {
                                    currentRec.setCurrentSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.INDEX + parseInt(sublistNo),
                                        value: lineIndex + 1
                                    });
                                }
                            }
                        }
                    }
                    else if (context.fieldId === mpnfld) {
                        var mpnFldId = constants.ESTIMATOR.ROOMS.SUBLIST.MPN;
                        var sublistNo = mpnfld.substring(mpnFldId.length);
                        var mpn = currentRec.getCurrentSublistValue({
                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                            fieldId: mpnfld
                        });
                        if (mpn) {
                            var itemSearchObj = search.create({
                                type: "item",
                                filters: [
                                    ["mpn","is",mpn],
                                    "AND",
                                    ["isinactive","is","F"]
                                ],
                                columns: [
                                    'internalid', 'itemid', 'type', 'displayname', 'quantityavailable', 'costestimate', 'manufacturer', 'cost',
                                    'custitem_prod_category', 'custitem_prod_subcategory', 'leadtime', 'custitemmaxpower',
                                    'custitemmaxheat', 'custitemrequirescommissioning', 'custitemru', 'baseprice', 'unitstype',
                                    'costcategory', 'custitemcustom', 'custitemofe', 'custitemgsa', 'custitemtaacompliant',
                                    'countryofmanufacture', 'custitemx_productline', 'weight', 'vendor', 'lastpurchaseprice'
                                ]
                            });
                            var range = itemSearchObj.run().getRange(0, 10);
                            if (range.length > 0) {
                                if (range.length > 1) {
                                    var trans = checkTransactionsAgainstMPN(range);
                                    if (trans.length > 0) {
                                        var title = "Multiple Items found on this MPN";
                                        var transDetails = "<table border='1' style='border-collapse: collapse; width: 100%;'>";
                                        transDetails += "<tr style='background-color: #f2f2f2; color: #0000ff;'>";
                                        transDetails += "<th style='padding: 8px;'>Item</th>";
                                        transDetails += "<th style='padding: 8px;'>Display Name</th>";
                                        transDetails += "<th style='padding: 8px;'>Manufacturer</th>";
                                        transDetails += "</tr>"; // Header row
                                        for (var num = 0; num < trans.length; num++) {
                                            transDetails += "<tr>";
                                            transDetails += "<td style='padding: 8px;'>" + trans[num].id + "</td>";
                                            transDetails += "<td style='padding: 8px;'>" + trans[num].name + "</td>";
                                            transDetails += "<td style='padding: 8px;'>" + trans[num].manuf + "</td>";
                                            transDetails += "</tr>";
                                        }
                                        transDetails += "</table>";

                                        dialog.alert({
                                            title: title,
                                            message: transDetails,
                                            width: 600 // Set the width of the dialog alert (adjust as needed)
                                        });
                                    }
                                }
                                var item = range[0].getValue({
                                    name: "internalid"
                                });
                                var manufacturer = range[0].getValue({
                                    name: "manufacturer"
                                });
                                var price = range[0].getValue({
                                    name: "baseprice"
                                });
                                var prodCategory = range[0].getText({
                                    name: "custitem_prod_category"
                                });
                                var prodSubCategory = range[0].getText({
                                    name: "custitem_prod_subcategory"
                                });
                                var leadTime = range[0].getValue({
                                    name: "leadtime"
                                });
                                var power = range[0].getValue({
                                    name: "custitemmaxpower"
                                });
                                var heat = range[0].getValue({
                                    name: "custitemmaxheat"
                                });
                                var commReq = range[0].getValue({
                                    name: "custitemrequirescommissioning"
                                });
                                var ru = range[0].getValue({
                                    name: "custitemru"
                                });
                                var type = range[0].getValue({
                                    name: "type"
                                });
                                var unitDesc = range[0].getValue({
                                    name: "displayname"
                                });
                                var unitMeasure = range[0].getText({
                                    name: "unitstype"
                                });
                                var costCategory = range[0].getValue({
                                    name: "costcategory"
                                });
                                var custom = range[0].getText({
                                    name: "custitemcustom"
                                });
                                var ofe = range[0].getValue({
                                    name: "custitemofe"
                                });
                                var gsa = range[0].getValue({
                                    name: "custitemgsa"
                                });
                                var taa = range[0].getText({
                                    name: "custitemtaacompliant"
                                });
                                var countryManuf = range[0].getValue({
                                    name: "countryofmanufacture"
                                });
                                var productLine = range[0].getValue({
                                    name: "custitemx_productline"
                                });
                                var weight = range[0].getValue({
                                    name: "weight"
                                });
                                var vendor = range[0].getValue({
                                    name: "vendor"
                                });
                                if (item) {
                                    currentRec.setCurrentSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.ITEM + parseInt(sublistNo),
                                        value: item,
                                        ignoreFieldChange: true,
                                        forceSyncSourcing: true
                                    });
                                    var cost;
                                    var itemDefinedCost = range[0].getValue({
                                        name: "costestimate"
                                    });
                                    var lastpurchaseprice = range[0].getValue({
                                        name: "lastpurchaseprice"
                                    });
                                    var purchasePrice = range[0].getValue({
                                        name: "cost"
                                    });
                                    if(itemDefinedCost){
                                        cost = itemDefinedCost;
                                    } else if (lastpurchaseprice) {
                                        cost = lastpurchaseprice;
                                    } else if (purchasePrice) {
                                        cost = purchasePrice;
                                    }
                                    currentRec.setCurrentSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.COST + parseInt(sublistNo),
                                        value: cost || 0
                                    });
                                    var extCost = currentRec.getCurrentSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_COST + parseInt(sublistNo)
                                    });
                                    if (!extCost) {
                                        currentRec.setCurrentSublistValue({
                                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_COST + parseInt(sublistNo),
                                            value: 0
                                        });
                                    }
                                    currentRec.setCurrentSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.PRICE + parseInt(sublistNo),
                                        value: price || 0
                                    });
                                    var totalPrice = currentRec.getCurrentSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.TOTAL_PRICE + parseInt(sublistNo)
                                    });
                                    if (!totalPrice) {
                                        currentRec.setCurrentSublistValue({
                                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.TOTAL_PRICE + parseInt(sublistNo),
                                            value: 0
                                        });
                                    }
                                    if (manufacturer) {
                                        currentRec.setCurrentSublistValue({
                                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.MANUF + parseInt(sublistNo),
                                            value: manufacturer
                                        });
                                    }
                                    if (prodCategory) {
                                        currentRec.setCurrentSublistValue({
                                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.PROD_MAIN_CAT + parseInt(sublistNo),
                                            value: prodCategory
                                        });
                                    }
                                    if (prodSubCategory) {
                                        currentRec.setCurrentSublistValue({
                                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.PROD_SUB_CAT + parseInt(sublistNo),
                                            value: prodSubCategory
                                        });
                                    }
                                    if (leadTime) {
                                        currentRec.setCurrentSublistValue({
                                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.LEAD_TIME + parseInt(sublistNo),
                                            value: leadTime
                                        });
                                    }
                                    if (power) {
                                        currentRec.setCurrentSublistValue({
                                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.POW + parseInt(sublistNo),
                                            value: power
                                        });
                                    }
                                    var extPower = currentRec.getCurrentSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_POW + parseInt(sublistNo)
                                    });
                                    if (!extPower) {
                                        currentRec.setCurrentSublistValue({
                                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_POW + parseInt(sublistNo),
                                            value: 0
                                        });
                                    }
                                    if (heat) {
                                        currentRec.setCurrentSublistValue({
                                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.HEAT + parseInt(sublistNo),
                                            value: heat
                                        });
                                    }
                                    var extHeat = currentRec.getCurrentSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_HEAT + parseInt(sublistNo)
                                    });
                                    if (!extHeat) {
                                        currentRec.setCurrentSublistValue({
                                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_HEAT + parseInt(sublistNo),
                                            value: 0
                                        });
                                    }
                                    if (commReq) {
                                        currentRec.setCurrentSublistValue({
                                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.REQD_COMM + parseInt(sublistNo),
                                            value: commReq
                                        });
                                    }
                                    if (ru) {
                                        currentRec.setCurrentSublistValue({
                                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.RU + parseInt(sublistNo),
                                            value: ru
                                        });
                                    }
                                    var extRu = currentRec.getCurrentSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_RU + parseInt(sublistNo)
                                    });
                                    if (!extRu) {
                                        currentRec.setCurrentSublistValue({
                                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_RU + parseInt(sublistNo),
                                            value: 0
                                        });
                                    }

                                    if (unitDesc) {
                                        currentRec.setCurrentSublistValue({
                                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.ITEM_DESC + parseInt(sublistNo),
                                            value: unitDesc
                                        });
                                    }
                                    if (unitMeasure) {
                                        currentRec.setCurrentSublistValue({
                                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.UNIT_MEASURE + parseInt(sublistNo),
                                            value: unitMeasure
                                        });
                                    }
                                    if (costCategory) {
                                        currentRec.setCurrentSublistValue({
                                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.COST_CAT + parseInt(sublistNo),
                                            value: costCategory
                                        });
                                    }
                                    if (type) {
                                        currentRec.setCurrentSublistValue({
                                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.ITEM_TYPE + parseInt(sublistNo),
                                            value: type
                                        });
                                    }
                                    if (custom) {
                                        currentRec.setCurrentSublistValue({
                                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.CUSTOM + parseInt(sublistNo),
                                            value: custom
                                        });
                                    }
                                    currentRec.setCurrentSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.OFE + parseInt(sublistNo),
                                        value: ofe
                                    });
                                    currentRec.setCurrentSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.GSA + parseInt(sublistNo),
                                        value: gsa
                                    });
                                    if (taa) {
                                        currentRec.setCurrentSublistValue({
                                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.TAA + parseInt(sublistNo),
                                            value: taa
                                        });
                                    }
                                    if (countryManuf) {
                                        currentRec.setCurrentSublistValue({
                                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.COUNTRY_OF_MANUF + parseInt(sublistNo),
                                            value: countryManuf
                                        });
                                    }
                                    if (productLine) {
                                        currentRec.setCurrentSublistValue({
                                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.PROD_LINE + parseInt(sublistNo),
                                            value: productLine
                                        });
                                    }
                                    if (weight) {
                                        currentRec.setCurrentSublistValue({
                                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.WEIGHT + parseInt(sublistNo),
                                            value: weight
                                        });
                                    }
                                    var extWeight = currentRec.getCurrentSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_WEIGHT + parseInt(sublistNo)
                                    });
                                    if (!extWeight) {
                                        currentRec.setCurrentSublistValue({
                                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_WEIGHT + parseInt(sublistNo),
                                            value: 0
                                        });
                                    }
                                    if (vendor) {
                                        currentRec.setCurrentSublistValue({
                                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.PREF + parseInt(sublistNo),
                                            value: 'true'
                                        });
                                        currentRec.setCurrentSublistValue({
                                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.PREF_VENDOR + parseInt(sublistNo),
                                            value: vendor
                                        });
                                    }
                                }
                            } else {
                                alert("This MPN number doesn't exist!");
                                currentRec.setCurrentSublistValue({
                                    sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                    fieldId: mpnfld,
                                    value: ''
                                });
                            }
                        }
                    }
                    else if (context.fieldId === discFld) {
                        var discFldId = constants.ESTIMATOR.ROOMS.SUBLIST.DISCOUNT;
                        var sublistNo = discFld.substring(discFldId.length);
                        var disc = currentRec.getCurrentSublistValue({
                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                            fieldId: discFld
                        }) || 0;
                        var price = currentRec.getCurrentSublistValue({
                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.PRICE + parseInt(sublistNo)
                        }) || 0;
                        var qty = currentRec.getCurrentSublistValue({
                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.QTY + parseInt(sublistNo)
                        }) || 0;
                        var cost = currentRec.getCurrentSublistValue({
                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.COST + parseInt(sublistNo)
                        }) || 0;
                        var totalPrice = qty * price;
                        var discountAmount = (disc / 100) * totalPrice;
                        var discountedPrice = totalPrice - discountAmount;

                        var totalCost = qty * cost;
                        var marginPercent = (discountedPrice - totalCost) / discountedPrice;
                        currentRec.setCurrentSublistValue({
                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.TOTAL_PRICE + parseInt(sublistNo),
                            value: discountedPrice
                        });
                        currentRec.setCurrentSublistValue({
                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.MARGIN_PERCENT + parseInt(sublistNo),
                            value: marginPercent
                        });
                    }
                    else if (context.fieldId === constants.ESTIMATOR.FIELDS.SELECT_TAB) {
                        var selectTabField = currentRec.getValue({
                            fieldId: constants.ESTIMATOR.FIELDS.SELECT_TAB
                        });
                        reload = true;
                        main();
                        reload = false;
                        var currentTab = urls.searchParams.get('selectedtab');
                        if (currentTab || currentTab == "" || currentTab == undefined) {
                            urls.searchParams.set('selectedtab', selectTabField);
                        } else {
                            urls.searchParams.append('selectedtab', selectTabField);
                        }
                        var finalUrl = urls.toString();
                        window.onbeforeunload = null;
                        window.open(finalUrl, "_self");
                    }
                    else if (context.fieldId === filterFld) {
                        var filterValue = currentRec.getValue({
                            fieldId: filterFld
                        });
                        if(filterValue){
                            var number = filterFld.match(/\d+/)[0];
                            var columnsValue = currentRec.getValue({
                                fieldId: constants.ESTIMATOR.ROOMS.COLUMNS + number
                            });
                            if(columnsValue){
                                saveButNotReload = true;
                                main();
                                saveButNotReload = false;
                                if (urls.searchParams.get('oldname')) urls.searchParams.delete('oldname');
                                if (urls.searchParams.get('newname')) urls.searchParams.delete('newname');
                                if (urls.searchParams.get('get')) urls.searchParams.delete('get');
                                if (urls.searchParams.get('tempsubheader')) urls.searchParams.delete('tempsubheader');
                                if (urls.searchParams.get('copysubheader')) urls.searchParams.delete('copysubheader');
                                if (urls.searchParams.get('existingsystemid')) urls.searchParams.delete('existingsystemid');
                                var activeTab = jQuery('.formtabon');
                                if (activeTab) {
                                    var activeTabId = activeTab.attr('id');
                                    activeTabId = activeTabId.replace("lnk", "");
                                    if (urls.searchParams.get('selectedtab')) {
                                        urls.searchParams.set('selectedtab', activeTabId);
                                    } else {
                                        urls.searchParams.append('selectedtab', activeTabId);
                                    }
                                }
                                var finalUrl = urls.toString();
                                window.onbeforeunload = null;
                                window.open(finalUrl, "_self");
                            }else{
                                alert("Please Select the Column to Filter the Results!");
                                currentRec.setValue({
                                    fieldId: filterFld,
                                    value: '',
                                    forceSyncSourcing: true
                                });
                            }
                        }
                    }
                    else if (context.fieldId === indexId) {
                        var indexFldId = constants.ESTIMATOR.ROOMS.SUBLIST.INDEX;
                        var sublistNo = indexId.substring(indexFldId.length);
                        var index = currentRec.getCurrentSublistValue({
                            sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                            fieldId: indexId
                        });
                        if(index){
                            var isNumber = /^-?\d*(\.\d+)?$/;
                            if (!isNumber.test(index)) {
                                // Clear the field value
                                currentRec.setCurrentSublistValue({
                                    sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + parseInt(sublistNo),
                                    fieldId: indexId,
                                    value: ""
                                });

                                // Show alert message
                                dialog.alert({
                                    title: "Invalid Input",
                                    message: "Please enter a valid number.",
                                });
                            }
                        }
                    }
                } catch (e) {
                    log.error("Exception: fieldChanged", e);
                }
            }
            function checkDeploymentStatus(id) {
                try {
                    var scheduledscriptinstanceSearchObj = search.create({
                        type: "scheduledscriptinstance",
                        filters: [
                            ["scriptdeployment.scriptid", "is", id],
                            "AND",
                            ["status", "anyof", "PROCESSING", "PENDING"]
                        ],
                        columns: [
                            "status",
                            "percentcomplete"
                        ]
                    });
                    var searchResultCount = scheduledscriptinstanceSearchObj.runPaged().count;

                } catch (e) {
                    log.error("Exception: checkDeploymentStatus", e);
                }
                return searchResultCount;
            }
            function getDeploymentId() {
                var title = "getDeploymentId::";
                var deploymentid = ''
                var deployments = [
                    'customdeploy_div_tpc_mr_create_estimates',
                    'customdeploy_div_tpc_mr_create_est_2',
                    'customdeploy_div_tpc_mr_create_est_3'
                ]
                try {
                    for (var x = 0; x < deployments.length; x++) {
                        var deploymentlines = checkDeploymentStatus(deployments[x]);
                        if (deploymentlines == 0) {
                            deploymentid = deployments[x];
                            break;
                        }
                    }

                } catch (error) {
                    log.error(title + error.name, error.message);
                }
                return deploymentid || '';
            }
            function saveRecord(context) {
                var title = "saveRecord::";
                var valid, msg, totalqty, fieldundefined, count, qtyfield;
                var existingEstiamtes;
                var rec = context.currentRecord;
                //UN - Start bvv
                var existingCb = rec.getValue(constants.ESTIMATOR.FIELDS.EXISTING_ID_CB);
                var systemId = rec.getValue(constants.ESTIMATOR.FIELDS.ID);
                var deploymentId = getDeploymentId();
                if(deploymentId){
                    if (systemId) {
                        existingEstiamtes = checkExistingEstiamtes(systemId);
                        if (existingEstiamtes) {
                            if (window.confirm("NestuiteID : " + systemId + ": has existing estiamtes in the system, Click Ok if you agree to delete existing estimates")) {
                                valid = true;
                                if (existingCb) {
                                    saveFlag = true;
                                    main();
                                    saveFlag = false;
                                } else {
                                    var msg = message.create({
                                        title: "Warning",
                                        message: 'Please make sure to save the form before Submitting!',
                                        type: message.Type.WARNING
                                    });
                                    msg.show({
                                        duration: 10000
                                    });
                                    return;
                                }
                                //UN - End
                                totalqty = 0;
                                fieldundefined = false
                                count = 0;
                                try {

                                    while (!fieldundefined) {
                                        qtyfield = rec.getValue({
                                            fieldId: constants.ESTIMATOR.ROOMS.QUANTITY + count
                                        });
                                        if (qtyfield != undefined) {

                                            if (qtyfield) {
                                                totalqty += parseInt(qtyfield)
                                            }
                                        } else {
                                            fieldundefined = true
                                        }

                                        count++
                                    }

                                } catch (error) {
                                    log.error(title + error.name, error.message);
                                }
                                if(totalqty > 1000){
                                    msg = message.create({
                                        title: "Warning",
                                        message: "Rooms Quantity Can not be Greater than 1000",
                                        type: message.Type.WARNING
                                    });
                                    msg.show({
                                        duration: 50000
                                    });
                                    return;
                                }
                            } else {
                                valid = false;
                            }

                        } else {
                            valid = true;
                            if (existingCb) {
                                saveFlag = true;
                                main();
                                saveFlag = false;
                            } else {
                                msg = message.create({
                                    title: "Warning",
                                    message: 'Please make sure to save the form before Submitting!',
                                    type: message.Type.WARNING
                                });
                                msg.show({
                                    duration: 10000
                                });
                                return;
                            }
                            //UN - End
                            totalqty = 0;
                            fieldundefined = false
                            count = 0;
                            try {

                                while (!fieldundefined) {
                                    qtyfield = rec.getValue({
                                        fieldId: constants.ESTIMATOR.ROOMS.QUANTITY + count
                                    });
                                    if (qtyfield != undefined) {

                                        if (qtyfield) {
                                            totalqty += parseInt(qtyfield)
                                        }
                                    } else {
                                        fieldundefined = true
                                    }

                                    count++
                                }

                            } catch (error) {
                                log.error(title + error.name, error.message);
                            }
                            if(totalqty > 1000){
                                msg = message.create({
                                    title: "Warning",
                                    message: "Rooms Quantity Can not be Greater than 1000",
                                    type: message.Type.WARNING
                                });
                                msg.show({
                                    duration: 50000
                                });
                                return;
                            }
                        }
                    }
                }else{
                    valid = false;
                    msg = message.create({
                        title: "Warning",
                        message: 'Scheduling processors are busy right now, Please wait and try again after some time',
                        type: message.Type.WARNING
                    });
                    msg.show({
                        duration: 50000
                    });
                    return;
                }
                return valid
            }
            function checkExistingEstiamtes(systemId) {
                var title = "checkExistingEstiamtes::";
                try {
                    var estimateSearchObj = search.create({
                        type: "estimate",
                        settings: [{
                            "name": "consolidationtype",
                            "value": "ACCTTYPE"
                        }],
                        filters: [
                            ["type", "anyof", "Estimate"],
                            "AND",
                            ["custbody_div_tpc_netsuite_id", "is", systemId],
                            "AND",
                            ["status", "anyof", "Estimate:A"],
                            "AND",
                            ["mainline", "is", "T"]
                        ],
                        columns: [
                            search.createColumn({
                                name: "statusref",
                                label: "Status"
                            })
                        ]
                    });
                    var searchresult = estimateSearchObj.run().getRange({
                        start: 0,
                        end: 1
                    });


                } catch (error) {
                    log.error(title + error.name, error.message);
                }
                return searchresult.length > 0 ? true : false
            }
            function lineInit(context) {
                //var title="lineInit::";
                try {
                    // jQuery('[data-ns-tooltip="ITEM"]').css('width','100%');
                    // $('[data-ns-tooltip="ITEM"]').css('width','100%');
                    // jQuery('.listcontrol > input').attr('size',60);
                    var currentRec = currentRecord.get();
                    var sublistId = context.sublistId;
                    var sublist = constants.ESTIMATOR.ROOMS.SUBLIST.ID;
                    var sublistNo = sublistId.substring(sublist.length);
                    var lineIndex = currentRec.getCurrentSublistIndex({
                        sublistId: sublistId
                    });
                    var sn = currentRec.getCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.INDEX + sublistNo
                    });
                    if (!sn) {
                        currentRec.setCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.INDEX + sublistNo,
                            value: lineIndex + 1
                        });
                    }
                } catch (error) {
                    log.error(title + error.name, error.message);
                }
            }
            function onInsertButtonClick() {
                try {
                    var leftPosition, topPosition;
                    leftPosition = (window.innerWidth / 2) - ((600 / 2) + 10);
                    topPosition = (window.innerHeight / 2) - ((600 / 2) + 50);

                    var params = 'height=500,width=800';
                    params += ',left=' + leftPosition + ',top=' + topPosition;
                    params += ',screenX=' + leftPosition + ',screenY=' + topPosition;
                    params += ',status=no';
                    params += ',toolbar=no';
                    params += ',menubar=no';
                    params += ',resizable=yes';
                    params += ',scrollbars=no';
                    params += ',location=no';
                    params += ',directories=no';

                    saveButNotReload = true;
                    main();
                    saveButNotReload = false;
                    if(error){
                        if(errorMsg){
                            alert(errorMsg);
                            errorMsg = '';
                        }
                        error = false;
                    }else{
                        var objRecord = currentRecord.get();
                        var netSuiteId = objRecord.getValue({
                            fieldId: constants.ESTIMATOR.FIELDS.ID
                        });
                        var scriptURL = constants.ROOM_ACTIONS.URL;
                        if (netSuiteId){
                            var url_string = window.location.href;
                            var urls = new URL(url_string);
                            var subHeaders = urls.searchParams.get('subheaders') || "";
                            var insert = urls.searchParams.get('insert') || "";
                            var netSuiteIdName = objRecord.getValue({
                                fieldId: constants.ESTIMATOR.FIELDS.NAME
                            });
                            var customer = objRecord.getValue({
                                fieldId: constants.ESTIMATOR.FIELDS.CUSTOMER
                            });
                            var project = objRecord.getValue({
                                fieldId: constants.ESTIMATOR.FIELDS.PROJECT
                            });
                            var opportunity = objRecord.getValue({
                                fieldId: constants.ESTIMATOR.FIELDS.OPPORTUNITY
                            });
                            scriptURL = scriptURL + '&systemid=' +netSuiteId;
                            if(customer) scriptURL = scriptURL + '&customer=' +customer;
                            if(netSuiteIdName) scriptURL = scriptURL + '&systemname=' +netSuiteIdName;
                            if(project) scriptURL = scriptURL + '&job=' +project;
                            if(opportunity) scriptURL = scriptURL + '&opp=' +opportunity;
                            if(subHeaders) scriptURL = scriptURL + '&subheaders=' +subHeaders;
                            if(insert) scriptURL = scriptURL + '&insert=' +insert;
                            window.open(scriptURL, 'New Window Title', params);
                        }else{
                            alert("Please Enter Value in NetSuite Id");
                        }
                    }
                } catch (e) {
                    log.error("Exception: onInsertButtonClick", e);
                }
            }
            function onSaveButtonClick() {
                // Logic for Save button
                saveFlag = true;
                main();
                saveFlag = false;
            }
            function onPrintButtonClick() {
                try {
                    saveButNotReload = true;
                    main();
                    saveButNotReload = false;
                    var objRecord = currentRecord.get();
                    var systemId = objRecord.getValue({
                        fieldId: constants.ESTIMATOR.FIELDS.ID
                    });
                    var url_string = window.location.href;
                    var urls = new URL(url_string);
                    var subHeaders = urls.searchParams.get('subheaders');
                    var scriptURL = url.resolveScript({
                        scriptId: constants.SCRIPTS.ESTIMATOR_PDF.SCRIPT_ID,
                        deploymentId: constants.SCRIPTS.ESTIMATOR_PDF.SCRIPT_DEPLOYMENT,
                        params: {
                            id: systemId,
                            subheaders: subHeaders
                        },
                        returnExternalUrl: false,
                    });
                    window.open(scriptURL);
                } catch (e) {
                    
                    log.error("Exception: onPrintButtonClick", e);
                }
            }
            function onPrintCSVButtonClick (){
                try {                  
                
                log.debug("Print CSV Button Clicked! via ClientScript")
                // var recIdcsv = nlapiGetRecordId();
                
                window.open('/app/site/hosting/scriptlet.nl?script=7653&deploy=1')
                }
                catch(e){
                    log.error("Error on ClientScript Function onPrintCSVButtonClick: " ,e.message)
                }
            }
            function removeDetails() {
                var url_string = window.location.href;
                var urls = new URL(url_string);

                var baseUrl = urls.origin + urls.pathname;
                var scriptParam = urls.searchParams.get('script');
                var deployParam = urls.searchParams.get('deploy');

                // Constructing the new URL
                var newUrl = baseUrl + '?script=' + scriptParam + '&deploy=' + deployParam;
                return newUrl;
            }
            function searchEstimatorRec(recType, filters) {
                var estRecSearch = search.create({
                    type: recType,
                    filters: filters,
                    columns: ["internalid"]
                });
                var internalId = '';
                estRecSearch.run().each(function(result) {
                    internalId = result.getValue({
                        name: "internalid"
                    });
                    return true;
                });
                return internalId;
            }
            function getSublistData(objRecord, sublistLength) {
                try {
                    var subHeadersList, sort;
                    if (sublistLength) {
                        subHeadersList = [];
                        for (var count = 0; count < sublistLength; count++) {
                            var lineCount = objRecord.getLineCount({
                                sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count
                            });
                            var parentQty = objRecord.getValue({
                                fieldId: constants.ESTIMATOR.ROOMS.QUANTITY + count
                            });
                            var roomSystemId = objRecord.getValue({
                                fieldId: constants.ESTIMATOR.ROOMS.ROOM_ID + count
                            });
                            var roomSystemName = objRecord.getValue({
                                fieldId: constants.ESTIMATOR.ROOMS.ROOM_NAME + count
                            });
                            var orderType = objRecord.getValue({
                                fieldId: constants.ESTIMATOR.ROOMS.ORDER_TYPE + count
                            });
                            var shipTo = objRecord.getValue({
                                fieldId: constants.ESTIMATOR.ROOMS.SHIP_TO + count
                            });
                            var shipText = objRecord.getText({
                                fieldId: constants.ESTIMATOR.ROOMS.SHIP_TO + count
                            });
                            var columns = objRecord.getValue({
                                fieldId: constants.ESTIMATOR.ROOMS.COLUMNS + count
                            });
                            var filter = objRecord.getValue({
                                fieldId: constants.ESTIMATOR.ROOMS.FILTERS + count
                            });
                            if(count === tabNo){
                                sort = "1";
                                columns = "";
                                filter = "";
                            }else{
                                sort = "";
                            }
                            if (lineCount > 0) {
                                var sublistDetails = [];
                                for (var i = 0; i < lineCount; i++) {
                                    var index = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.INDEX + count,
                                        line: i
                                    });
                                    var flag = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.FLAG + count,
                                        line: i
                                    });
                                    var flagText = objRecord.getSublistText({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.FLAG + count,
                                        line: i
                                    });
                                    var designNotes = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.DESIGN_NOTES + count,
                                        line: i
                                    });
                                    var quantity = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.QTY + count,
                                        line: i
                                    });
                                    var manufacturer = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.MANUF + count,
                                        line: i
                                    });
                                    var mpn = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.MPN + count,
                                        line: i
                                    });
                                    var unitDesc = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.ITEM_DESC + count,
                                        line: i
                                    });
                                    var cost = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.COST + count,
                                        line: i
                                    });
                                    var extCost = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_COST + count,
                                        line: i
                                    });
                                    var price = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.PRICE + count,
                                        line: i
                                    });
                                    var discount = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.DISCOUNT + count,
                                        line: i
                                    });
                                    var totalPrice = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.TOTAL_PRICE + count,
                                        line: i
                                    });
                                    var marginPercent = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.MARGIN_PERCENT + count,
                                        line: i
                                    });
                                    var item = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.ITEM + count,
                                        line: i
                                    });
                                    var itemText = objRecord.getSublistText({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.ITEM + count,
                                        line: i
                                    });
                                    var unitMeasure = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.UNIT_MEASURE + count,
                                        line: i
                                    });
                                    var costCategory = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.COST_CAT + count,
                                        line: i
                                    });
                                    var itemType = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.ITEM_TYPE + count,
                                        line: i
                                    });
                                    var custom = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.CUSTOM + count,
                                        line: i
                                    });
                                    var ofe = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.OFE + count,
                                        line: i
                                    });
                                    var gsa = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.GSA + count,
                                        line: i
                                    });
                                    var taa = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.TAA + count,
                                        line: i
                                    });
                                    var countryManuf = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.COUNTRY_OF_MANUF + count,
                                        line: i
                                    });
                                    var itemCategory = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.PROD_MAIN_CAT + count,
                                        line: i
                                    });
                                    var itemSubCategory = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.PROD_SUB_CAT + count,
                                        line: i
                                    });
                                    var productLine = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.PROD_LINE + count,
                                        line: i
                                    });
                                    var leadTime = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.LEAD_TIME + count,
                                        line: i
                                    });
                                    var pref = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.PREF + count,
                                        line: i
                                    });
                                    var prefVendor = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.PREF_VENDOR + count,
                                        line: i
                                    });
                                    var rack = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.RACK + count,
                                        line: i
                                    });
                                    var commReq = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.REQD_COMM + count,
                                        line: i
                                    });
                                    var exeNotes = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXE_NOTES + count,
                                        line: i
                                    });
                                    var ru = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.RU + count,
                                        line: i
                                    });
                                    var extRu = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_RU + count,
                                        line: i
                                    });
                                    var powerConsumption = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.POW + count,
                                        line: i
                                    });
                                    var extPowerConsumption = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_POW + count,
                                        line: i
                                    });
                                    var heatOutput = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.HEAT + count,
                                        line: i
                                    });
                                    var extHeatOutput = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_HEAT + count,
                                        line: i
                                    });
                                    var weight = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.WEIGHT + count,
                                        line: i
                                    });
                                    var extWeight = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EXT_WEIGHT + count,
                                        line: i
                                    });
                                    var custom1 = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.C1 + count,
                                        line: i
                                    });
                                    var custom2 = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.C2 + count,
                                        line: i
                                    });
                                    var custom3 = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.C3 + count,
                                        line: i
                                    });
                                    var custom4 = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.C4 + count,
                                        line: i
                                    });
                                    var custom5 = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.C5 + count,
                                        line: i
                                    });
                                    var specialPricing = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.SPECIAL_PRICING + count,
                                        line: i
                                    });
                                    var eol = objRecord.getSublistText({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.EOL + count,
                                        line: i
                                    });
                                    var logs = objRecord.getSublistValue({
                                        sublistId: constants.ESTIMATOR.ROOMS.SUBLIST.ID + count,
                                        fieldId: constants.ESTIMATOR.ROOMS.SUBLIST.LOGS + count,
                                        line: i
                                    });

                                    var values = {};
                                    if (index) values['index'] = index;
                                    if (flag) values['flag'] = flag;
                                    if (flagText) values['flagt'] = flagText;
                                    if (specialPricing) values['sp'] = specialPricing;
                                    if (designNotes) values['dn'] = designNotes;
                                    if (quantity) values['qty'] = quantity;
                                    if (manufacturer) values['manuf'] = manufacturer;
                                    if (mpn) values['mpn'] = mpn;
                                    if (unitDesc) values['desc'] = unitDesc;
                                    if (cost) values['cost'] = cost;
                                    if (extCost) values['ec'] = extCost;
                                    if (price) values['price'] = price;
                                    if (discount) values['disc'] = discount;
                                    if (totalPrice) values['total'] = totalPrice;
                                    if (marginPercent) values['margin'] = marginPercent;
                                    if (item) values['item'] = item;
                                    if (itemText) values['itemt'] = itemText;
                                    if (unitMeasure) values['um'] = unitMeasure;
                                    if (costCategory) values['cc'] = costCategory;
                                    if (itemType) values['type'] = itemType;
                                    if (custom) values['cus'] = custom;
                                    if (ofe) values['ofe'] = ofe;
                                    if (gsa) values['gsa'] = gsa;
                                    if (taa) values['taa'] = taa;
                                    if (eol) values['eol'] = eol;
                                    if (countryManuf) values['com'] = countryManuf;
                                    if (itemCategory) values['pmc'] = itemCategory;
                                    if (itemSubCategory) values['psc'] = itemSubCategory;
                                    if (productLine) values['pl'] = productLine;
                                    if (leadTime) values['time'] = leadTime;
                                    if (pref) values['pref'] = pref;
                                    if (prefVendor) values['prefv'] = prefVendor;
                                    if (rack) values['rack'] = rack;
                                    if (commReq) values['rc'] = commReq;
                                    if (exeNotes) values['enotes'] = exeNotes;
                                    if (ru) values['ru'] = ru;
                                    if (extRu) values['eru'] = extRu;
                                    if (powerConsumption) values['pow'] = powerConsumption;
                                    if (extPowerConsumption) values['epow'] = extPowerConsumption;
                                    if (heatOutput) values['heat'] = heatOutput;
                                    if (extHeatOutput) values['eheat'] = extHeatOutput;
                                    if (weight) values['weight'] = weight;
                                    if (extWeight) values['ew'] = extWeight;
                                    if (custom1) values['c1'] = custom1;
                                    if (custom2) values['c2'] = custom2;
                                    if (custom3) values['c3'] = custom3;
                                    if (custom4) values['c4'] = custom4;
                                    if (custom5) values['c5'] = custom5;
                                    if (logs) values['logs'] = logs;

                                    sublistDetails.push(values);
                                }
                                var subHeader = {
                                    quantity: parentQty,
                                    roomid: roomSystemId,
                                    roomname: roomSystemName,
                                    ordertype: orderType,
                                    shipto: shipTo,
                                    shiptext: shipText,
                                    sort: sort,
                                    col: columns,
                                    filter: filter,
                                    items: sublistDetails
                                };
                                subHeadersList.push(subHeader);
                            } else {
                                subHeadersList = subHeadersList.toString();
                                subHeadersList = 'alert';
                                error = true;
                                errorMsg = 'Please Insert atleast one line Item';
                                if (!reload && !saveButNotReload) {
                                    alert("Please Insert atleast one line Item");
                                }
                            }
                        }
                    }
                    return subHeadersList;
                } catch (e) {
                    log.error('Exception: getSublistData', e);
                }
            }
            function getLabourPlanData(objRecord) {
                try {
                    var subHeadersList;
                    var lineCount = objRecord.getLineCount({
                        sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID
                    });
                    if (lineCount > 0) {
                        subHeadersList = [];
                        for (var i = 0; i < lineCount; i++) {
                            var item = objRecord.getSublistValue({
                                sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.LABOUR_PLAN.ITEM,
                                line: i
                            });
                            var itemText = objRecord.getSublistText({
                                sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.LABOUR_PLAN.ITEM,
                                line: i
                            });
                            var quantity = objRecord.getSublistValue({
                                sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.LABOUR_PLAN.QTY,
                                line: i
                            });
                            var cost = objRecord.getSublistValue({
                                sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.LABOUR_PLAN.COST,
                                line: i
                            });
                            var rate = objRecord.getSublistValue({
                                sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.LABOUR_PLAN.PRICE,
                                line: i
                            });
                            var disc = objRecord.getSublistValue({
                                sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.LABOUR_PLAN.DISCOUNT,
                                line: i
                            });
                            var amt = objRecord.getSublistValue({
                                sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.LABOUR_PLAN.TOTAL_PRICE,
                                line: i
                            });
                            var extCost = objRecord.getSublistValue({
                                sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.LABOUR_PLAN.EXT_COST,
                                line: i
                            });
                            var marginPercent = objRecord.getSublistValue({
                                sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.LABOUR_PLAN.MARGIN_PERCENT,
                                line: i
                            });
                            var logs = objRecord.getSublistValue({
                                sublistId: constants.ESTIMATOR.LABOUR_PLAN.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.LABOUR_PLAN.LOGS,
                                line: i
                            });
                            subHeadersList.push({
                                item: item,
                                itemt: itemText,
                                quantity: quantity,
                                cost: cost,
                                ec: extCost,
                                rate: rate,
                                disc: disc,
                                total: amt,
                                margin: marginPercent,
                                logs: logs
                            });
                        }
                    }
                    return subHeadersList;
                } catch (e) {
                    log.error('Exception: getLabourPlanData', e);
                }
            }
            function getMiscCostData(objRecord) {
                try {
                    var subHeadersList;
                    var lineCount = objRecord.getLineCount({
                        sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID
                    });
                    if (lineCount > 0) {
                        subHeadersList = [];
                        for (var i = 0; i < lineCount; i++) {
                            var item = objRecord.getSublistValue({
                                sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.MISC_COST.ITEM,
                                line: i
                            });
                            var itemText = objRecord.getSublistText({
                                sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.MISC_COST.ITEM,
                                line: i
                            });
                            var quantity = objRecord.getSublistValue({
                                sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.MISC_COST.QTY,
                                line: i
                            });
                            var cost = objRecord.getSublistValue({
                                sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.MISC_COST.COST,
                                line: i
                            });
                            var rate = objRecord.getSublistValue({
                                sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.MISC_COST.PRICE,
                                line: i
                            });
                            var disc = objRecord.getSublistValue({
                                sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.MISC_COST.DISCOUNT,
                                line: i
                            });
                            var amt = objRecord.getSublistValue({
                                sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.MISC_COST.TOTAL_PRICE,
                                line: i
                            });
                            var extCost = objRecord.getSublistValue({
                                sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.MISC_COST.EXT_COST,
                                line: i
                            });
                            var marginPercent = objRecord.getSublistValue({
                                sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.MISC_COST.MARGIN_PERCENT,
                                line: i
                            });
                            var logs = objRecord.getSublistValue({
                                sublistId: constants.ESTIMATOR.MISC_COST.SUBLIST_ID,
                                fieldId: constants.ESTIMATOR.MISC_COST.LOGS,
                                line: i
                            });
                            subHeadersList.push({
                                item: item,
                                itemt: itemText,
                                quantity: quantity,
                                cost: cost,
                                ec: extCost,
                                rate: rate,
                                disc: disc,
                                total: amt,
                                margin: marginPercent,
                                logs: logs
                            });
                        }
                    }
                    return subHeadersList;
                } catch (e) {
                    log.error('Exception: getMiscCostData', e);
                }
            }
            function checkTransactionsAgainstMPN(range) {
                try {
                    var item = [];
                    for (var i = 0; i < range.length; i++) {
                        item.push({
                            id: range[i].getValue({name: "itemid"}),
                            name: range[i].getValue({name: "displayname"}),
                            manuf: range[i].getValue({name: "manufacturer"}),
                        });
                    }
                    return item;
                } catch (e) {
                    log.error("Exception: checkTransactionsAgainstMPN", e);
                }
            }
            function onHideClick() {
                try {
                    var leftPosition, topPosition;
                    leftPosition = (window.innerWidth / 2) - ((600 / 2) + 10);
                    topPosition = (window.innerHeight / 2) - ((600 / 2) + 50);

                    var params = 'height=400,width=600';
                    params += ',left=' + leftPosition + ',top=' + topPosition;
                    params += ',screenX=' + leftPosition + ',screenY=' + topPosition;
                    params += ',status=no';
                    params += ',toolbar=no';
                    params += ',menubar=no';
                    params += ',resizable=yes';
                    params += ',scrollbars=no';
                    params += ',location=no';
                    params += ',directories=no';

                    saveButNotReload = true;
                    main();
                    saveButNotReload = false;

                    if(error){
                        //Do Nothing
                        if(errorMsg){
                            alert(errorMsg);
                            errorMsg = '';
                        }
                        error = false;
                    }else{
                        var url_string = window.location.href;
                        var urls = new URL(url_string);
                        var groupData = urls.searchParams.get('group');
                        if (groupData === '' || groupData === null || groupData === undefined) {
                            groupData = '';
                        }
                        var insert = urls.searchParams.get('insert');
                        if (insert === '' || insert === null || insert === undefined) {
                            insert = '';
                        }
                        var objRecord = currentRecord.get();
                        var netSuiteId = objRecord.getValue({
                            fieldId: constants.ESTIMATOR.FIELDS.ID
                        });
                        var scriptURL = constants.GROUPS_DISPLAY.URL;
                        if (netSuiteId){
                            if(groupData) scriptURL = scriptURL + '&group=' +groupData;
                            if(insert) scriptURL = scriptURL + '&insert=' +insert;
                            window.open(scriptURL, 'New Window Title', params);
                        }else{
                            alert("Please Enter Value in NetSuite Id");
                        }
                    }

                } catch (e) {
                    log.error("Exception: onHideClick", e);
                }
            }
            function onImportButtonClick() {
                try {
                    var leftPosition, topPosition;
                    leftPosition = (window.innerWidth / 2) - ((600 / 2) + 10);
                    topPosition = (window.innerHeight / 2) - ((600 / 2) + 50);

                    var params = 'height=400,width=820';
                    params += ',left=' + leftPosition + ',top=' + topPosition;
                    params += ',screenX=' + leftPosition + ',screenY=' + topPosition;
                    params += ',status=no';
                    params += ',toolbar=no';
                    params += ',menubar=no';
                    params += ',resizable=yes';
                    params += ',scrollbars=no';
                    params += ',location=no';
                    params += ',directories=no';

                    var objRecord = currentRecord.get();
                    var customer = objRecord.getValue(constants.ESTIMATOR.FIELDS.CUSTOMER);
                    var systemId = objRecord.getValue(constants.ESTIMATOR.FIELDS.ID);
                    var project = objRecord.getValue(constants.ESTIMATOR.FIELDS.PROJECT);
                    var opportunity = objRecord.getValue(constants.ESTIMATOR.FIELDS.OPPORTUNITY);
                    var systemName = objRecord.getValue(constants.ESTIMATOR.FIELDS.NAME);
                    systemName = removeReservedCharacters(systemName);
                    var rollCb = objRecord.getValue({
                        fieldId: constants.ESTIMATOR.FIELDS.ROLL_CB
                    });
                    var roll = rollCb ? "1" : "0";

                    if (customer && systemId) {
                        var url_string = window.location.href;
                        var urls = new URL(url_string);
                        var subHeaders = urls.searchParams.get('subheaders');
                        var scriptURL = constants.CSV_IMPORT.URL;
                        if (customer) scriptURL = scriptURL + '&customer=' + customer;
                        if (systemId) scriptURL = scriptURL + '&systemid=' + systemId;
                        if (systemName) scriptURL = scriptURL + '&systemname=' + systemName;
                        if (project) scriptURL = scriptURL + '&job=' + project;
                        if (opportunity) scriptURL = scriptURL + '&opp=' + opportunity;
                        if (roll) scriptURL = scriptURL + '&rol=' + roll;
                        if (subHeaders) scriptURL = scriptURL + '&subheaders=' + subHeaders;

                        var labourPlan = getLabourPlanData(objRecord);
                        if (Array.isArray(labourPlan)) {
                            labourPlan = JSON.stringify(labourPlan);
                        }
                        var miscCost = getMiscCostData(objRecord);
                        if (Array.isArray(miscCost)) {
                            miscCost = JSON.stringify(miscCost);
                        }
                        var sublistLength = parseInt(urls.searchParams.get('insert'));
                        var subHeadersList = getSublistData(objRecord, sublistLength);
                        if (Array.isArray(subHeadersList)) {
                            subHeadersList = JSON.stringify(subHeadersList);
                        }
                        if (subHeadersList === 'alert') {
                            return;
                        }
                        var userId = runtime.getCurrentUser().id;
                        var rawFilters = [
                            ["owner.internalid", "anyof", userId],
                            "AND",
                            ["name", "is", systemId]
                        ];
                        var recId = searchEstimatorRec(constants.ESTIMATOR_RAW.RECORD_TYPE, rawFilters);
                        var values = {};
                        values[constants.ESTIMATOR_RAW.FIELDS.NAME] = systemName;
                        values[constants.ESTIMATOR_RAW.FIELDS.CUSTOMER] = customer;
                        values[constants.ESTIMATOR_RAW.FIELDS.PROJECT] = project;
                        values[constants.ESTIMATOR_RAW.FIELDS.OPPORTUNITY] = opportunity;
                        fileid = createJsonFile(systemId,userId,labourPlan,miscCost,subHeadersList, 'RAW');
                        log.debug("responseobj fileid",fileid);
                        if(fileid) values[constants.ESTIMATOR_RAW.FIELDS.FILE] = fileid;
                        if (recId) {
                            var rec = record.submitFields({
                                type: constants.ESTIMATOR_RAW.RECORD_TYPE,
                                id: recId,
                                values: values
                            });
                            log.audit('Record Updated', rec);
                        } else {
                            var estimatorRawRec = record.create({
                                type: constants.ESTIMATOR_RAW.RECORD_TYPE,
                                isDynamic: true
                            });
                            // if(labourPlan){
                            //     var fileid = createJsonFile(labourPlan,systemId);
                            //     console.log("responseobj fileid",fileid);
                            //     if(fileid) estimatorRawRec.setValue('custrecord_raw_est_labordata_file', fileid);
                            // }
                            if (systemId) estimatorRawRec.setValue('name', systemId);
                            if (customer) estimatorRawRec.setValue(constants.ESTIMATOR_RAW.FIELDS.CUSTOMER, customer);
                            if (project) estimatorRawRec.setValue(constants.ESTIMATOR_RAW.FIELDS.PROJECT, project);
                            if (opportunity) estimatorRawRec.setValue(constants.ESTIMATOR_RAW.FIELDS.OPPORTUNITY, opportunity);
                            if (systemName) estimatorRawRec.setValue(constants.ESTIMATOR_RAW.FIELDS.NAME, systemName);
                            // if (labourPlan) estimatorRawRec.setValue(constants.ESTIMATOR_RAW.FIELDS.LABOUR_PLAN, labourPlan);
                            // if (miscCost) estimatorRawRec.setValue(constants.ESTIMATOR_RAW.FIELDS.MISC_COST, miscCost);
                            // if (subHeadersList) estimatorRawRec.setValue(constants.ESTIMATOR_RAW.FIELDS.SUBHEADERS, subHeadersList);
                            fileid = createJsonFile(systemId,userId,labourPlan,miscCost,subHeadersList, 'RAW');
                            log.debug("responseobj fileid",fileid);
                            if(fileid) estimatorRawRec.setValue(constants.ESTIMATOR_RAW.FIELDS.FILE, fileid);
                            var rec = estimatorRawRec.save();
                            log.audit("Raw Record Created", rec);
                        }
                        window.open(scriptURL, 'New Window Title', params);
                    } else {
                        alert("Please enter value(s) for: Customer");
                    }
                } catch (e) {
                    log.error("Exception: onImportButtonClick", e);
                }
            }
            function removeReservedCharacters(str) {
                var pattern = /[!$&'()*+,/:;=?@[\]]/g;
                var cleanedStr = str.replace(pattern, '');
                return cleanedStr;
            }
            function onSummaryButtonClick() {
                try {
                    var url_string = window.location.href;
                    var urls = new URL(url_string);
                    var objRecord = currentRecord.get();
                    var laborPlan = getLabourPlanData(objRecord);
                    laborPlan = laborPlan ? laborPlan : [];
                    var miscCost = getMiscCostData(objRecord);
                    miscCost = miscCost ? miscCost : [];
                    var sublistLength = parseInt(urls.searchParams.get('insert'));
                    var subHeadersList = getSublistData(objRecord, sublistLength);
                    subHeadersList = subHeadersList ? subHeadersList : [];
                    var laborSum = laborPlan.reduce(function(acc, obj) {
                        return acc + obj.total;
                    }, 0);
                    laborSum = Math.round(laborSum * 100) / 100;
                    var laborExtCost = laborPlan.reduce(function(acc, obj) {
                        return acc + obj.ec;
                    }, 0);
                    laborExtCost = Math.round(laborExtCost * 100) / 100;
                    var laborGrossProfit = laborSum - laborExtCost || 0;
                    if(laborGrossProfit)  laborGrossProfit = Math.round(laborGrossProfit * 100) / 100;
                    var laborMarginPercent = (laborSum - laborExtCost) /laborSum || 0;
                    if(laborMarginPercent) laborMarginPercent =  Math.round(laborMarginPercent * 100) / 100;

                    var miscSum = miscCost.reduce(function(acc, obj) {
                        return acc + obj.total;
                    }, 0);
                    miscSum = Math.round(miscSum * 100) / 100;
                    var miscExtCost = miscCost.reduce(function(acc, obj) {
                        return acc + obj.ec;
                    }, 0);
                    miscExtCost = Math.round(miscExtCost * 100) / 100;

                    var miscGrossProfit = miscSum - miscExtCost || 0;
                    if(miscGrossProfit)  miscGrossProfit = Math.round(miscGrossProfit * 100) / 100;
                    var miscMarginPercent = (miscSum - miscExtCost) /miscSum || 0;
                    if(miscMarginPercent) miscMarginPercent =  Math.round(miscMarginPercent * 100) / 100;

                    var roomSum = subHeadersList.reduce(function(sum, order) {
                        return sum + order.items.reduce(function(subtotal, item) {
                            // Check if the 'total' property exists and is a number
                            if (item.total && typeof item.total === 'number') {
                                return subtotal + item.total;
                            } else {
                                return subtotal;
                            }
                        }, 0);
                    }, 0);
                    var sumOfQty = subHeadersList.reduce((sum, current) => sum + current.quantity, 0);
                    var updatedRevenue = roomSum * sumOfQty;
                    roomSum = Math.round(updatedRevenue * 100) / 100;

                    var roomCost = subHeadersList.reduce(function(sum, order) {
                        return sum + order.items.reduce(function(subtotal, item) {
                            // Check if the 'total' property exists and is a number
                            if (item.ec && typeof item.ec === 'number') {
                                return subtotal + item.ec;
                            } else {
                                return subtotal;
                            }
                        }, 0);
                    }, 0);
                    var updatedCost = roomCost * sumOfQty;
                    roomCost = Math.round(updatedCost * 100) / 100;

                    var roomGrossProfit = roomSum - roomCost || 0;
                    if(roomGrossProfit)  roomGrossProfit = Math.round(roomGrossProfit * 100) / 100;
                    var roomMarginPercent = (roomSum - roomCost) /roomSum || 0;
                    if(roomMarginPercent)  roomMarginPercent = Math.round(roomMarginPercent * 100) / 100;
                    var sumOfCost = laborExtCost + miscExtCost + roomCost;
                    if(sumOfCost)  sumOfCost = Math.round(sumOfCost * 100) / 100;
                    var sumOfRevenue = laborSum + miscSum + roomSum;
                    if(sumOfRevenue)  sumOfRevenue = Math.round(sumOfRevenue * 100) / 100;
                    var sumOfGrossProfit = laborGrossProfit + miscGrossProfit + roomGrossProfit;
                    if(sumOfGrossProfit)  sumOfGrossProfit = Math.round(sumOfGrossProfit * 100) / 100;
                    var sumOfMarginPercent = (sumOfRevenue - sumOfCost) / sumOfRevenue || 0;
                    if(sumOfMarginPercent)  sumOfMarginPercent = Math.round(sumOfMarginPercent * 100) / 100;
                    var data = '<table style="border-collapse: collapse; border: 1px solid black; width: 100%;">' +
                        '  <tr>' +
                        '    <th style="font-weight: bold; border: 1px solid black; padding: 8px; color: black;"></th>' +
                        '    <td style="font-weight: bold; border: 1px solid black; padding: 8px; color: black;">Cost</td>' +
                        '    <td style="font-weight: bold; border: 1px solid black; padding: 8px; color: black;">Revenue</td>' +
                        '    <td style="font-weight: bold; border: 1px solid black; padding: 8px; color: black;">Gross Profit</td>' +
                        '    <td style="font-weight: bold; border: 1px solid black; padding: 8px; color: black;">Margin Percent</td>' +
                        '  </tr>' +
                        '  <tr>' +
                        '    <th style="font-weight: bold; border: 1px solid black; padding: 8px; color: black;">Labor</th>' +
                        '    <td style="border: 1px solid black; padding: 8px; color: black;">' + laborExtCost + '</td>' +
                        '    <td style="border: 1px solid black; padding: 8px; color: black;">' + laborSum + '</td>' +
                        '    <td style="border: 1px solid black; padding: 8px; color: black;">' + laborGrossProfit + '</td>' +
                        '    <td style="border: 1px solid black; padding: 8px; color: black;">' + laborMarginPercent + '</td>' +
                        '  </tr>' +
                        '  <tr>' +
                        '    <th style="font-weight: bold; border: 1px solid black; padding: 8px; color: black;">Misc</th>' +
                        '    <td style="border: 1px solid black; padding: 8px; color: black;">' + miscExtCost + '</td>' +
                        '    <td style="border: 1px solid black; padding: 8px; color: black;">' + miscSum + '</td>' +
                        '    <td style="border: 1px solid black; padding: 8px; color: black;">' + miscGrossProfit + '</td>' +
                        '    <td style="border: 1px solid black; padding: 8px; color: black;">' + miscMarginPercent + '</td>' +
                        '  </tr>' +
                        '  <tr>' +
                        '    <th style="font-weight: bold; border: 1px solid black; padding: 8px; color: black;">Room/Systems</th>' +
                        '    <td style="border: 1px solid black; padding: 8px; color: black;">' + roomCost + '</td>' +
                        '    <td style="border: 1px solid black; padding: 8px; color: black;">' + roomSum + '</td>' +
                        '    <td style="border: 1px solid black; padding: 8px; color: black;">' + roomGrossProfit + '</td>' +
                        '    <td style="border: 1px solid black; padding: 8px; color: black;">' + roomMarginPercent + '</td>' +
                        '  </tr>' +
                        '  <tr>' +
                        '    <th style="font-weight: bold; border: 1px solid black; padding: 8px; color: black;">Total</th>' +
                        '    <td style="border: 1px solid black; padding: 8px; color: black;">' + sumOfCost + '</td>' +
                        '    <td style="border: 1px solid black; padding: 8px; color: black;">' + sumOfRevenue + '</td>' +
                        '    <td style="border: 1px solid black; padding: 8px; color: black;">' + sumOfGrossProfit + '</td>' +
                        '    <td style="border: 1px solid black; padding: 8px; color: black;">' + sumOfMarginPercent + '</td>' +
                        '  </tr>' +
                        '</table>';

                    dialog.create({
                        title: 'Summary',
                        message: data
                    });
                    setTimeout(function() {
                        var dialog = jQuery('.uif880'); // Adjust the selector as needed
                        dialog.css('min-width', 'fit-content'); // Set your desired width
                    }, 500);
                } catch (e) {
                    log.error("Exception: onSummaryButtonClick", e);
                }
            }
            function onCopyNetsuiteIdButtonClick() {
                try {
                    var leftPosition, topPosition;
                    leftPosition = (window.innerWidth / 2) - ((600 / 2) + 10);
                    topPosition = (window.innerHeight / 2) - ((600 / 2) + 50);

                    var params = 'height=400,width=900';
                    params += ',left=' + leftPosition + ',top=' + topPosition;
                    params += ',screenX=' + leftPosition + ',screenY=' + topPosition;
                    params += ',status=no';
                    params += ',toolbar=no';
                    params += ',menubar=no';
                    params += ',resizable=yes';
                    params += ',scrollbars=no';
                    params += ',location=no';
                    params += ',directories=no';

                    var objRecord = currentRecord.get();
                    var netSuiteId = objRecord.getValue({
                        fieldId: constants.ESTIMATOR.FIELDS.ID
                    });
                    var scriptURL = constants.COPY_NSID.URL;
                    if (netSuiteId){
                        scriptURL = scriptURL + '&systemid=' + netSuiteId;
                        window.open(scriptURL, 'New Window Title', params);
                    }else{
                        alert("Please Enter Value in NetSuite Id");
                    }
                } catch (e) {
                    log.error("Exception: onImportButtonClick", e);
                }
            }
            function onSortButtonClick(number){
                try{
                    tabNo = number;
                    reload = true;
                    main();
                    reload = false;
                }catch (e) {
                    log.error("Exception: onSortButtonClick", e);
                }
            }
            return {
                pageInit: pageInit,
                fieldChanged: fieldChanged,
                saveRecord: saveRecord,
                lineInit: lineInit,
                onInsertButtonClick: onInsertButtonClick,
                onSaveButtonClick: onSaveButtonClick,
                onPrintButtonClick: onPrintButtonClick,
                onPrintCSVButtonClick: onPrintCSVButtonClick,
                onHideClick: onHideClick,
                onImportButtonClick: onImportButtonClick,
                onSummaryButtonClick: onSummaryButtonClick,
                onCopyNetsuiteIdButtonClick: onCopyNetsuiteIdButtonClick,
                onSortButtonClick: onSortButtonClick
            };
        });