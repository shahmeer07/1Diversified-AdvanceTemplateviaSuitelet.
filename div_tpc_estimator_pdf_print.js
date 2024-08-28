/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/record', 'N/search', 'N/ui/message', 'N/ui/dialog', '../Lib/div_tpc_constant.js','N/runtime', 'N/file'],
    (ui, record, search, message, dialog, constants,runtime,file) => {
        const onRequest = (context) => {
            try {
                var request = context.request;
                var response = context.response;
                var params = request.parameters;
                var systemId = params.id;
                var date = new Date();
                var time = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
                var today = new Date().toLocaleDateString(undefined, {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                });

                var temp = '';
                temp =
                    '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">\
                  <pdf>\
                  <head>\
                  <link name="arabic-font" type="font" subtype="opentype"\
                    src="https://system.eu2.netsuite.com/core/media/media.nl?id=512&amp;c=4453818&amp;h=db8e747ae68c04938a12&amp;_xt=.ttf"\
                    src-bold="https://system.eu2.netsuite.com/core/media/media.nl?id=512&amp;c=4453818&amp;h=db8e747ae68c04938a12&amp;_xt=.ttf"\
                    bytes="2" />\
                  <link name="comforta-font" type="font" subtype="opentype"\
                    src=" https://4848148.app.netsuite.com/core/media/media.nl?id=98623&amp;c=4848148&amp;h=ace307004f61a5013bca&amp;_xt=.ttf"\
                    src-bold="https://4848148.app.netsuite.com/core/media/media.nl?id=98624&amp;c=4848148&amp;h=b5bd601fbcb7e070a93f&amp;_xt=.ttf"\
                    bytes="2" />\
                  <link name="NotoSans" type="font" subtype="truetype" src="${nsfont.NotoSans_Regular}"\
                    src-bold="${nsfont.NotoSans_Bold}" src-italic="${nsfont.NotoSans_Italic}"\
                    src-bolditalic="${nsfont.NotoSans_BoldItalic}" bytes="2" />\
                  <macrolist>\
                    <macro id="nlheader">\
                      <table class="header" style="width: 100%; margin-bottom:5px;"  >\
                      <tr>\
                      <td colspan="4" ><img src="http://9230983-sb1.shop.netsuite.com/core/media/media.nl?id=40&amp;c=9230983_SB1&amp;h=3PXyoALc1f8KeZx6GeqWHdYBs46c1Ja1u8WS7D5TWLGT-ayL" style="float: left;" width="120"  height="35" /> </td>\
                      <td colspan="10" align="center" style="vertical-align: middle; font-size:32px; margin-top: 8px;" ><span><b>Estimator</b></span></td>\
                      <td colspan="4" align="right" style="vertical-align: middle; font-size:12px; margin-top: 10px;"><b>' + today + ' ' + time + '</b></td>\
        </tr>\
        </table>\
      </macro>\
      <macro id="nlfooter">\
        <table cellpadding="1" style="margin-top: 5px;">\
        <tr>\
        <td align="right" style="width: 100px;">Page :</td>\
        <td style="width: 220px;"><pagenumber/> of <totalpages/></td>\
        </tr>\
        </table>\
      </macro>\
    </macrolist>\
    <style type="text/css">* \
      table {\
          font-size: 9pt;\
          border-collapse: collapse;\
      }\
      th {\
          font-weight: bold;\
          font-size: 8pt;\
          vertical-align: middle;\
          padding: 3px 3px 2px;\
          color: #333333;\
      }\
      td {\
          padding: 2px;\
      }\
      td p { align:left }\
      b {\
          font-weight: bold;\
          color: #333333;\
      }\
      table.header {\
          padding: 5px;\
      }\
      table.header td {\
          padding: 0;\
          font-size: 13pt;\
      }\
      table.footer td {\
          padding: 0;\
          font-size: 8pt;\
      }\
      table.itemtable {\
      table-layout: fixed;\
      }\
      table.itemtable th {\
          padding-bottom: 5px;\
          padding-top: 5px;\
          font-size: 7pt;\
      }\
      table.itemtable td {\
          padding-bottom: 5px;\
          padding-top: 5px;\
          font-size: 7pt;\
          border-bottom: 0.5px;\
          border-bottom: 0.5px;\
      }\
      table.body td {\
          padding-top: 2px;\
      }\
      table.total {\
          page-break-inside: avoid;\
      }\
      td.totalboxbot {\
          background-color: #e3e3e3;\
          font-weight: bold;\
      }\
      span.title {\
          font-size: 18pt;\
      }\
      hr {\
          width: 100%;\
          color: #d3d3d3;\
          background-color: #d3d3d3;\
          height: 1px;\
      }\
    </style>\
    </head>\
    <body header="nlheader" header-height="6%" footer="nlfooter" footer-height="25pt" padding="0.2in 0.3in 0.2in 0.3in" size="Letter">\
      <br />\
    ';
                var data = estimatorRecData(systemId);
                log.debug("data", data);
                if (data && data.length > 0) {
                    temp +=
                        '\
                      <table border="1" style="width: 100%;font-size: 8pt;">\
                        <tr>\
                          <td border-right="1" colspan="3" style="width: 20%;"><b>Customer</b></td>\
                          <td border-right="1" colspan="6" style="width: 30%;">' + (data[0].customer).replace(/&/g, '&amp;') + '</td>\
                          <td border-right="1" colspan="3" style="width: 20%;"><b>NetSuite ID</b></td>\
                      <td  colspan="6" style="width: 30%;">' + data[0].systemId + '</td>\
                    </tr>\
                    <tr>\
                      <td border-right="1" colspan="3" style="width: 20%;"><b>Project</b></td>\
                      <td border-right="1" colspan="6" style="width: 30%;">' + (data[0].project).replace(/&/g, '&amp;') + '</td>\
                      <td border-right="1" colspan="3" style="width: 20%;"><b>NetSuite ID Name</b></td>\
                      <td colspan="6" style="width: 30%;">' + data[0].systemName + '</td>\
                    </tr>\
                    <tr>\
                      <td border-right="1" colspan="3" style="width: 20%;"><b>Opportunity</b></td>\
                      <td border-right="1" colspan="6" style="width: 30%;">' + (data[0].opportunity).replace(/&/g, '&amp;') + '</td>\
                      <td border-right="1" colspan="3" style="width: 20%;"><b></b></td>\
                      <td colspan="6" style="width: 30%;"></td>\
                    </tr>\
                  </table>';

                    var subHeaders = params.subheaders;
                    var subHeaderNames;
                    if (subHeaders && typeof subHeaders === 'string') {
                        subHeaderNames = subHeaders.split(',');
                    } else {
                        subHeaderNames = [];
                    }
                    temp +=
                        '\
                    <table border="1" class="itemtable" style="width: 100%; margin-top: 20px; border-bottom: none;">\
                  <thead>\
                      <tr>\
                        <th align="center" border-right="1" style="width: 10%;">Qty</th>\
                        <th border-right="1" style="width: 15%;">Manufacturer</th>\
                        <th border-right="1" style="width: 15%;">Model</th>\
                        <th border-right="1" style="width: 40%;">Description</th>\
                        <th align="right" border-right="1" style="width: 10%;">Unit Price</th>\
                        <th align="right" style="width: 10%;">Extended Price</th>\
                      </tr>\
                    </thead>\
                    </table>\
                    <table class="itemtable" style="width: 100%; border: 1px;">\
                    ';
                    var roomsSummary = [];
                    var laborObj, miscObj;
                    for (var i = 0; i < subHeaderNames.length; i++) {
                        var sublistDetails = JSON.parse(data[0].savedData);
                        if (sublistDetails && sublistDetails.length > 0 && sublistDetails[i] && (sublistDetails[i].items).length > 0) {
                            var itemArr = sublistDetails[i].items;
                            temp += '\
                        <tr style="background-color: #A7C7E7; color: black; font-weight: bold;">\
                            <td style="width: 10%;"></td>\
                            <td style="width: 15%;"></td>\
                            <td style="width: 15%;"></td>\
                            <td style="width: 40%;">' + subHeaderNames[i].replace(/&/g, '&amp;') + '</td>\
                            <td style="width: 10%;"></td>\
                            <td style="width: 10%;"></td>\
                          </tr>\
                          ';
                            var unitPriceTotal = 0, extPriceTotal = 0;
                            for (var j = 0; j < itemArr.length; j++) {
                                var currentItem = itemArr[j];
                                unitPriceTotal = parseFloat(unitPriceTotal) + (parseFloat(currentItem.price) || 0);
                                if(unitPriceTotal) unitPriceTotal = Math.round(unitPriceTotal * 100) / 100;
                                extPriceTotal = parseFloat(extPriceTotal) + (parseFloat(currentItem.total) || 0);
                                if(extPriceTotal) extPriceTotal = Math.round(extPriceTotal * 100) / 100;
                                var itemDetails = getItemDetails(currentItem.item);
                                if (itemDetails.itemid === "Header" || itemDetails.itemid === "Header End") {
                                    temp += '\
                            <tr style="background-color: #D3D3D3; color: black; font-weight: bold;">\
                            <td style="width: 10%;"></td>\
                            <td style="width: 15%;"></td>\
                            <td style="width: 15%;"></td>\
                            <td style="width: 40%;">' + (currentItem.desc).replace(/&/g, '&amp;') + '</td>\
                            <td style="width: 10%;"></td>\
                            <td style="width: 10%;"></td>\
                          </tr>\
                                    ';
                                }
                                else if (itemDetails.itemid === "Sub-Header" || itemDetails.itemid === "Sub-Header End") {
                                    temp += '\
                            <tr style="background-color: #EAECEE; color: black; font-weight: bold;">\
                            <td style="width: 10%;"></td>\
                            <td style="width: 15%;"></td>\
                            <td style="width: 15%;"></td>\
                            <td style="width: 40%;">' + (currentItem.desc).replace(/&/g, '&amp;') + '</td>\
                            <td style="width: 10%;"></td>\
                            <td style="width: 10%;"></td>\
                          </tr>\
                                    ';
                                } else {
                                    var manuf;
                                    if(itemDetails.manuf){
                                        manuf = (itemDetails.manuf).replace(/&/g, '&amp;');
                                    }
                                    var desc;
                                    if(itemDetails.itemdesc){
                                        desc = (itemDetails.itemdesc).replace(/&/g, '&amp;');
                                    }
                                    var itemId;
                                    if(itemDetails.itemid){
                                        itemId = (itemDetails.itemid).replace(/&/g, '&amp;');
                                    }
                                    var price = 0;
                                    if(currentItem.price) price = (Math.round(currentItem.price * 100) / 100);

                                    var total = 0;
                                    if(currentItem.total) total = (Math.round(currentItem.total * 100) / 100);
                                    temp += '\
                        <tr>\
                            <td align="center" border-right="1" style="width: 10%;">' + (currentItem.qty || 0) + '</td>\
                            <td border-right="1" style="width: 15%;">' + manuf + '</td>\
                            <td border-right="1" style="width: 15%;">' + itemId + '</td>\
                            <td border-right="1" style="width: 40%;">' + desc + '</td>\
                            <td align="right" border-right="1" style="width: 10%;">' + price + '</td>\
                            <td align="right" style="width: 10%;">' + total + '</td>\
                          </tr>\
                          ';
                                }
                            }
                            temp += '\
                        <tr>\
                            <td style="width: 10%;"></td>\
                            <td style="width: 15%;"></td>\
                            <td style="width: 15%;"></td>\
                            <td style="width: 40%;"></td>\
                            <td align="right" style="width: 10%; font-weight: bold;">Item Subtotal</td>\
                            <td align="right" style="width: 10%;">' + extPriceTotal + '</td>\
                          </tr>\
                          ';
                        }
                        let totalQty = 0;
                        itemArr.forEach(item => {
                            totalQty += parseFloat(item.qty);
                        });
                        var updatedUnitPrice = totalQty * unitPriceTotal || 0;
                        var updatedextPrice = totalQty * extPriceTotal || 0;
                        roomsSummary.push({
                            qty: totalQty || 0,
                            desc: subHeaderNames[i].replace(/&/g, '&amp;'),
                            unit: updatedUnitPrice,
                            price: updatedextPrice
                        });
                    }
                    if(data[0].labourSavedData){
                        var laborUnitTotal = 0,
                            laborExtUnitTotal = 0;
                        var laborSublist = JSON.parse(data[0].labourSavedData);
                        var laborQty = 0;
                        if (laborSublist && laborSublist.length > 0) {
                            temp += '\
                        <tr style="background-color: #A7C7E7; color: black; font-weight: bold;">\
                            <td style="width: 10%;"></td>\
                            <td style="width: 15%;"></td>\
                            <td style="width: 15%;"></td>\
                            <td style="width: 40%;">Labor Plan</td>\
                            <td style="width: 10%;"></td>\
                            <td style="width: 10%;"></td>\
                          </tr>\
                          ';
                            for (var k = 0; k < laborSublist.length; k++) {
                                laborQty = laborQty + laborSublist[k].quantity;
                                laborUnitTotal = parseFloat(laborUnitTotal) + parseFloat(laborSublist[k].rate);
                                laborUnitTotal = Math.round(laborUnitTotal * 100) / 100;
                                laborExtUnitTotal = parseFloat(laborExtUnitTotal) + parseFloat(laborSublist[k].total);
                                laborExtUnitTotal = Math.round(laborExtUnitTotal * 100) / 100;
                                var laborDetails = getItemDetails(laborSublist[k].item);
                                var laborManuf;
                                if(laborDetails.manuf){
                                    laborManuf = (laborDetails.manuf).replace(/&/g, '&amp;');
                                }
                                var laborDesc;
                                if(laborDetails.itemdesc){
                                    laborDesc = (laborDetails.itemdesc).replace(/&/g, '&amp;');
                                }
                                var laborItemId;
                                if(laborDetails.itemid){
                                    laborItemId = (laborDetails.itemid).replace(/&/g, '&amp;');
                                }
                                temp += '\
                        <tr>\
                            <td align="center" border-right="1" style="width: 10%;">' + laborSublist[k].quantity + '</td>\
                            <td border-right="1" style="width: 15%;">' + laborManuf + '</td>\
                            <td border-right="1" style="width: 15%;">' + laborItemId + '</td>\
                            <td border-right="1" style="width: 40%;">' + laborDesc + '</td>\
                            <td align="right" border-right="1" style="width: 10%;">' + (laborSublist[k].rate || 0) + '</td>\
                            <td align="right" style="width: 10%;">' + (laborSublist[k].total || 0) + '</td>\
                          </tr>\
                          ';
                            }
                            temp += '\
                        <tr>\
                            <td style="width: 10%;"></td>\
                            <td style="width: 15%;"></td>\
                            <td style="width: 15%;"></td>\
                            <td style="width: 40%;"></td>\
                            <td align="right" style="width: 10%; font-weight: bold;">Item Subtotal</td>\
                            <td align="right" style="width: 10%;">' + laborExtUnitTotal + '</td>\
                          </tr>\
                          ';
                            laborObj = {
                                qty: laborQty,
                                desc: "LABOR PLAN",
                                unit: laborUnitTotal,
                                price: laborExtUnitTotal
                            }
                        }
                    }
                    if(data[0].miscCostSavedData){
                        var miscUnitTotal = 0, miscExtUnitTotal = 0;
                        var miscSublist = JSON.parse(data[0].miscCostSavedData);
                        var miscQty = 0;
                        if (miscSublist && miscSublist.length > 0) {
                            temp += '\
                        <tr style="background-color: #A7C7E7; color: black; font-weight: bold;">\
                            <td style="width: 10%;"></td>\
                            <td style="width: 15%;"></td>\
                            <td style="width: 15%;"></td>\
                            <td style="width: 40%;">Miscellaneous Materials</td>\
                            <td style="width: 10%;"></td>\
                            <td style="width: 10%;"></td>\
                          </tr>\
                          ';
                            for (var l = 0; l < miscSublist.length; l++) {
                                miscQty = miscQty + miscSublist[l].quantity;
                                miscUnitTotal = parseFloat(miscUnitTotal) + parseFloat(miscSublist[l].rate);
                                miscUnitTotal = Math.round(miscUnitTotal * 100) / 100;
                                miscExtUnitTotal = parseFloat(miscExtUnitTotal) + parseFloat(miscSublist[l].total);
                                miscExtUnitTotal = Math.round(miscExtUnitTotal * 100) / 100;
                                var miscDetails = getItemDetails(miscSublist[l].item);
                                var miscManuf;
                                if(miscDetails.manuf){
                                    miscManuf = (miscDetails.manuf).replace(/&/g, '&amp;');
                                }
                                var miscDesc;
                                if(miscDetails.itemdesc){
                                    miscDesc = (miscDetails.itemdesc).replace(/&/g, '&amp;');
                                }
                                var miscItemId;
                                if(miscDetails.itemid){
                                    miscItemId = (miscDetails.itemid).replace(/&/g, '&amp;');
                                }
                                temp += '\
                        <tr>\
                            <td align="center" border-right="1" style="width: 10%;">' + miscSublist[l].quantity + '</td>\
                            <td border-right="1" style="width: 15%;">' + miscManuf + '</td>\
                            <td border-right="1" style="width: 15%;">' + miscItemId + '</td>\
                            <td border-right="1" style="width: 40%;">' + miscDesc + '</td>\
                            <td align="right" border-right="1" style="width: 10%;">' + (miscSublist[l].rate || 0) + '</td>\
                            <td align="right" style="width: 10%;">' + (miscSublist[l].total || 0) + '</td>\
                          </tr>\
                          ';
                            }
                            temp += '\
                        <tr>\
                            <td style="width: 10%;"></td>\
                            <td style="width: 15%;"></td>\
                            <td style="width: 15%;"></td>\
                            <td style="width: 40%;"></td>\
                            <td align="right" style="width: 10%; font-weight: bold;">Item Subtotal</td>\
                            <td align="right" style="width: 10%;">' + miscExtUnitTotal + '</td>\
                          </tr>\
                          ';
                            miscObj = {
                                qty: miscQty,
                                desc: "MISCELLANEOUS MATERIALS",
                                unit: miscUnitTotal,
                                price: miscExtUnitTotal
                            }
                        }
                    }
                    temp += '\
                        </table>\
                        ';
                    temp +=
                        '\
                    <table align="right" border="1" class="itemtable" style="width: 75%; margin-top: 20px; border-bottom: none;">\
                  <thead>\
                  <tr style="background-color: #A7C7E7; color: black; font-weight: bold;">\
                            <td style="width: 20%;"></td>\
                            <td align="right" style="width: 40%;">QUOTE SUMMARY</td>\
                            <td style="width: 20%;"></td>\
                            <td style="width: 20%;"></td>\
                        </tr>\
                      <tr>\
                        <th align="center" border-right="1" style="width: 20%;">Quantity</th>\
                        <th align="center" border-right="1" style="width: 40%;">Room/Task Description</th>\
                        <th align="right" border-right="1" style="width: 20%;">Unit Price</th>\
                        <th align="right" style="width: 20%;">Extended Price</th>\
                      </tr>\
                    </thead>\
                    ';
                    var grandTotal = 0;
                    for (var m = 0; m < roomsSummary.length; m++) {
                        grandTotal = grandTotal + roomsSummary[m].price;
                        temp += '\
                        <tr style="border-top: 0.5px;">\
                        <td align="center" border-right="1" style="width: 20%;">'+roomsSummary[m].qty+'</td>\
                        <td align="center" border-right="1" style="width: 40%;">'+(roomsSummary[m].desc).replace(/&/g, '&amp;')+'</td>\
                        <td align="right" border-right="1" style="width: 20%;">'+roomsSummary[m].unit+'</td>\
                        <td align="right" style="width: 20%;">'+roomsSummary[m].price+'</td>\
                      </tr>\
                      ';
                    }
                    if(laborObj){
                        temp += '\
                        <tr style="border-top: 0.5px;">\
                        <td align="center" border-right="1" style="width: 20%;">'+laborObj.qty+'</td>\
                        <td align="center" border-right="1" style="width: 40%;">'+(laborObj.desc).replace(/&/g, '&amp;')+'</td>\
                        <td align="right" border-right="1" style="width: 20%;">'+laborObj.unit+'</td>\
                        <td align="right" style="width: 20%;">'+laborObj.price+'</td>\
                      </tr>\
                      ';
                        grandTotal = grandTotal + laborObj.price;
                    }
                    if(miscObj){
                        temp += '\
                      <tr style="border-top: 0.5px;">\
                        <td align="center" border-right="1" style="width: 20%;">'+miscObj.qty+'</td>\
                        <td align="center" border-right="1" style="width: 40%;">'+(miscObj.desc).replace(/&/g, '&amp;')+'</td>\
                        <td align="right" border-right="1" style="width: 20%;">'+miscObj.unit+'</td>\
                        <td align="right" style="width: 20%;">'+miscObj.price+'</td>\
                      </tr>\
                      ';
                        grandTotal = grandTotal + miscObj.price;
                    }
                    grandTotal = Math.round(grandTotal * 100) / 100;
                    temp += '\
                      <tr style="border-top: 0.5px;">\
                        <td colspan="3" align="right" style="width: 80%; font-weight: bold">Grand Total</td>\
                        <td align="right" style="width: 20%;">'+grandTotal+'</td>\
                      </tr>\
                      ';
                    temp += '\
                        </table>\
                        ';
                }
                temp += '\
                    </body>\
                    </pdf>';
                response.renderPdf(temp);
            } catch (e) {
                response.writeLine({
                    output: 'Error: ' + e.name + ' , Details: ' + e.message
                });
            }
        }

        function estimatorRecData(systemId) {
            try {
                var data = [];
                if (systemId) {
                    var userId = runtime.getCurrentUser().id;
                    var estimateRecSearch = search.create({
                        type: constants.ESTIMATOR_RAW.RECORD_TYPE,
                        filters: [
                            ["owner.internalid","anyof",userId],
                            "AND",
                            ["name", "is", systemId]
                        ],
                        columns: [
                            "internalid",
                            constants.ESTIMATOR_RAW.FIELDS.ID,
                            constants.ESTIMATOR_RAW.FIELDS.NAME,
                            constants.ESTIMATOR_RAW.FIELDS.CUSTOMER,
                            constants.ESTIMATOR_RAW.FIELDS.PROJECT,
                            constants.ESTIMATOR_RAW.FIELDS.OPPORTUNITY
                            // constants.ESTIMATOR_RAW.FIELDS.SUBHEADERS,
                            // constants.ESTIMATOR_RAW.FIELDS.LABOUR_PLAN,
                            // constants.ESTIMATOR_RAW.FIELDS.MISC_COST
                        ]
                    });
                    var obj, fileContents;
                    estimateRecSearch.run().each(function(result) {
                        // .run().each has a limit of 4,000 results
                        obj = {
                            internalId: result.getValue({
                                name: "internalid"
                            }),
                            systemId: result.getValue({
                                name: constants.ESTIMATOR_RAW.FIELDS.ID
                            }),
                            systemName: result.getValue({
                                name: constants.ESTIMATOR_RAW.FIELDS.NAME
                            }),
                            customer: result.getText({
                                name: constants.ESTIMATOR_RAW.FIELDS.CUSTOMER
                            }),
                            project: result.getText({
                                name: constants.ESTIMATOR_RAW.FIELDS.PROJECT
                            }),
                            opportunity: result.getText({
                                name: constants.ESTIMATOR_RAW.FIELDS.OPPORTUNITY
                            }),
                            // savedData: result.getValue({
                            //     name: constants.ESTIMATOR_RAW.FIELDS.SUBHEADERS
                            // }),
                            // labourSavedData: result.getValue({
                            //     name: constants.ESTIMATOR_RAW.FIELDS.LABOUR_PLAN
                            // }),
                            // miscCostSavedData: result.getValue({
                            //     name: constants.ESTIMATOR_RAW.FIELDS.MISC_COST
                            // })
                        }
                        try {
                            var path = constants.ESTIMATOR_RAW.FIELDS.FILE_PATH;
                            path += systemId + '|' +userId + '.json';
                            var fileObj = file.load({
                                id: path
                            });
                            fileContents = fileObj.getContents();

                            if (fileContents) {
                                fileContents = JSON.parse(fileContents);
                            }
                        } catch (e) {
                            log.debug("File not found", e.message);
                            return;
                        }
                        log.debug("fileContents",fileContents);
                        obj.labourSavedData = fileContents.labordata || "";
                        obj.miscCostSavedData = fileContents.miscdata || "";
                        obj.savedData = fileContents.roomsdata || "";

                        log.debug("obj", obj);
                        data.push(obj);
                        return true;
                    });
                    return data;
                }
            } catch (e) {
                log.debug("Exception: estimatorRecData", e);
            }
        }

        function getItemDetails(itemId) {
            try {
                var searchItemRec = search.lookupFields({
                    type: 'item',
                    id: itemId,
                    columns: ['itemid', 'purchasedescription', 'displayname', 'manufacturer']
                });
                return {
                    "itemid": searchItemRec.itemid,
                    "itemdesc": (searchItemRec.purchasedescription) ? (searchItemRec.purchasedescription) : (searchItemRec.displayname),
                    "manuf": searchItemRec.manufacturer
                }
            } catch (e) {
                log.debug("Exception: getItemDetails", e);
            }
        }

        return {
            onRequest
        }

    });