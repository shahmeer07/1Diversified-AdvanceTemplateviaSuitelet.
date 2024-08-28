/**
 * @NapiVersion 2.0
 * @NscriptType Suitelet
 */

define(['N/record','N/search','N/file','N/format'] , function (record,search,file,format){

    function onRequest(context){
        try {
        if (context.request.method === 'GET'){
            log.debug("Print CSV Function Clicked! via Suitelet")
            log.debug("Start of CSV Export")
            var csvContent = 'Customer, Project, Quantity, Manufacturer, Model, Description, Unit Price, Extended Price\n';
            var fileObj = file.create({
                name: 'EstimatorData.csv',
                fileType: file.Type.CSV,
                contents: csvContent
            })

            context.response.writeFile({
                file: fileObj,
                isInline: false
            })
        }
        }
        catch(error){
            log.error ("Error on Suitel Estimator print CSV" , error.message)
        }
    }
    return {
        onRequest : onRequest
    }

})