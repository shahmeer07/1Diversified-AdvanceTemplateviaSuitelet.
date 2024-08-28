/**
 * @NapiVersion 2.0
 * @NscriptType ClientScript 
 * @NModulescope Public 
 */

define (["N/log","N/record","N/ui/dialog"] , function (log,record,dialog){

    function saveRecord(context){    
        try {

            var currentRecord = context.currentRecord
            
            var milestone1 = currentRecord.getValue({
                fieldId: 'custbody_milestone_1'
            })
            var milestone2 = currentRecord.getValue({
                fieldId: 'custbody_milestone_2'
            })
            var milestone3 = currentRecord.getValue({
                fieldId: 'custbody_milestone_3'
            })
            var milestone4 = currentRecord.getValue({
                fieldId: 'custbody_milestone_4'
            })
            var milestone5 = currentRecord.getValue({
                fieldId: 'custbody_milestone_5'
            })
            var xdeposit = currentRecord.getValue({
                fieldId: 'custbody_deposit_percent'
            })

            log.debug("Milestone 1: " , milestone1 )
            log.debug("Milestone 2: " , milestone2 )
            log.debug("Milestone 3: " , milestone3 )
            log.debug("Milestone 4: " , milestone4 )
            log.debug("Milestone 5: " , milestone5 )
            log.debug(" xdeposit: " , xdeposit )

            if (milestone1 + milestone2 + milestone3 + milestone4 + milestone5 + xdeposit !== 100){

                dialog.alert({
                    title: "xDeposit % and xBill % at milestone Values ",
                    message: "The percentage of XDEPOSIT % and the values of xBill % at milestone Do not sum up to 100%"
                })

                return true
            } else {
                return true 
            }


        }
        catch(error){
            log.error(error.title, error.message)
        }
    }
    return{
        saveRecord:saveRecord
    }

})