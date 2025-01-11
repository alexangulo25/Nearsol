/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord'], function (url, currentRecord) {

    function fieldChanged(context) {
        try {
            var scriptUrl = url.resolveScript({
                scriptId: 'customscript_ns_sl_certificado_retencion',
                deploymentId: 'customdeploy_ns_sl_certificado_retencion'
            }); //Suitelet mapping
            var currentRecord = context.currentRecord;
            var validate = false; // Flag to validate the modification or manipulation of fields
            var paramsArr = []; // Array that will save the parameters and their value
            var fieldObj = [ // Array of objs of fields
                /* {
                    fieldId: 'custpage_from_date',
                    param: 'fromDate'
                },
                {
                    fieldId: 'custpage_to_date',
                    param: 'toDate'
                }, */
                {
                    fieldId: 'custpage_vendor_filter',
                    param: 'custpage_vendor_filter'
                },
                {
                    fieldId: 'custpage_program',
                    param: 'program'
                },
                {
                    fieldId: 'custpage_program_type',
                    param: 'programType'
                },

            ]
            var currentField = context.fieldId; // Id of the field that is being manipulated in the Suitelet
            for (var i in fieldObj) { // Iteration of the obj array to compare the params and manipulated fields
                var validateField = fieldObj[i].fieldId;
                log.debug('Validate Fields :', validateField);
                log.debug('Current Field :', currentField);
                if (validateField == currentField) { // Validation: Is the field being manipulated the same as that of the parameters?
                    validate = true
                };
            }
            if (validate == true) {
                for (var i in fieldObj) { // Iteration of the obj array that will save the value of ALL the parameters
                    var validateField = fieldObj[i].fieldId;
                    if (!validateField.text) { // Validation: Isn't it a String?
                        var fieldValue = currentRecord.getValue(validateField); // The value of the manipulated or modified field is obtained in the Suitelet
                        console.log('Field Value :', fieldValue);

                        /* if (fieldValue) {
                            if (validateField == 'custpage_from_date' || validateField == 'custpage_to_date') {
                                fieldValue = new Date(fieldValue)
                                fieldValue = ((fieldValue.getDate()) + "/" + (fieldValue.getMonth() + 1) + "/" + fieldValue.getFullYear());
                            }
                        } */


                    } else {
                        var fieldValue = currentRecord.getText(validateField); // The value of the manipulated or modified field is obtained in the Suitelet
                        fieldValue = format.parse({
                            value: fieldValue,
                            type: format.Type.TEXT
                        })


                    }

                    if (fieldValue) {
                        paramsArr.push('&' + fieldObj[i].param + '=' + fieldValue); // All the parameters with their respective value are added to the array
                    }
                }

                window.onbeforeunload = function (event) { };
                window.location.href = scriptUrl + paramsArr.toString().replace(/[,]/g, ''); // Redirection to the same Suitelet

            }
        } catch (e) {
            console.log('Error ', e);
        }
    }



    return {
        fieldChanged: fieldChanged
    }
});