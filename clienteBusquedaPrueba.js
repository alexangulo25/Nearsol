/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord', 'N/https'], function(url, currentRecord, https) {
    function pageInit(context) {
        var record = currentRecord.get();
        var retainerInfo = record.getValue({ fieldId: 'custpage_retainer_info' });
        console.log('Retainer Info:', retainerInfo);
    }

    function formatDate(date) {
        var d = new Date(date);
        var month = '' + (d.getMonth() + 1);
        var day = '' + d.getDate();
        var year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [month, day, year].join('/');
    }

    function generatePDF() {
        var record = currentRecord.get();
        var vendorId = record.getValue({ fieldId: 'custpage_hidden_vendor' });
        var vendorName = record.getValue({ fieldId: 'custpage_vendor_name' });
        var startDate = record.getValue({ fieldId: 'custpage_hidden_startdate' });
        var endDate = record.getValue({ fieldId: 'custpage_hidden_enddate' });
        var fiscalYear;

        if (!startDate) {
            startDate = '01/01/1970';
        } else {
            startDate = formatDate(startDate);
        }

        if (!endDate) {
            endDate = formatDate(new Date());
        } else {
            endDate = formatDate(endDate);
        }

        fiscalYear = new Date(startDate).getFullYear();

        if (!vendorId) {
            alert('Please select a vendor before generating the PDF.');
            return;
        }

        console.log('Vendor ID:', vendorId);

        var sublistData = [];
        var lineCount = record.getLineCount({ sublistId: 'custpage_sublist' });

        for (var i = 0; i < lineCount; i++) {
            sublistData.push({
                type: record.getSublistValue({ sublistId: 'custpage_sublist', fieldId: 'custpage_type', line: i }),
                name: record.getSublistValue({ sublistId: 'custpage_sublist', fieldId: 'custpage_name', line: i }),
                account: record.getSublistValue({ sublistId: 'custpage_sublist', fieldId: 'custpage_account', line: i }),
                amount: record.getSublistValue({ sublistId: 'custpage_sublist', fieldId: 'custpage_amount', line: i })
            });
        }

        var suiteletUrl = url.resolveScript({
            scriptId: 'customscript_generate_pdf_suitelet_',
            deploymentId: 'customdeploy_generate_pdf_suitelet_',
            params: {
                vendorId: vendorId,
                vendorName: vendorName,
                startDate: startDate,
                endDate: endDate,
                fiscalYear: fiscalYear,
                sublistData: JSON.stringify(sublistData)
            }
        });
        window.open(suiteletUrl, '_blank');
    }

    function generateMultiplePDFs() {
    var record = currentRecord.get();
    var startDate = record.getValue({ fieldId: 'custpage_hidden_startdate' });
    var endDate = record.getValue({ fieldId: 'custpage_hidden_enddate' });

    if (!startDate) {
        startDate = '01/01/1970';
    } else {
        startDate = formatDate(startDate);
    }

    if (!endDate) {
        endDate = formatDate(new Date());
    } else {
        endDate = formatDate(endDate);
    }

    var fiscalYear = new Date(startDate).getFullYear();

    var vendorData = JSON.parse(record.getValue({ fieldId: 'custpage_vendor_data' }));

    console.log('Vendor Data:', vendorData);

    var vendorIds = Object.keys(vendorData);
    var index = 0;

    function sendRequest() {
        if (index < vendorIds.length) {
            var vendorId = vendorIds[index];
            console.log('Vendor ID:', vendorId);

            var vendorInfo = vendorData[vendorId];
            if (vendorInfo && vendorInfo.vendorName) {
                var vendorName = vendorInfo.vendorName;

                var suiteletUrl = url.resolveScript({
                    scriptId: 'customscript_generate_mass_pdf_suitelet_',
                    deploymentId: 'customdeploy_generate_mass_pdf_suitelet_',
                    params: {
                        vendorId: vendorId,
                        vendorName: vendorName,
                        startDate: startDate,
                        endDate: endDate,
                        fiscalYear: fiscalYear,
                        sublistData: JSON.stringify(vendorInfo.lines),
                        retainerInfo: record.getValue({ fieldId: 'custpage_retainer_info' })
                    }
                });
                window.open(suiteletUrl, '_blank');
            } else {
                console.error('Vendor info is missing for vendor ID:', vendorId);
            }

            index++;
            setTimeout(sendRequest, 3000); // Espera 3 segundos antes de enviar la siguiente solicitud
        }
    }

    sendRequest();
}
    return {
        pageInit: pageInit,
        generatePDF: generatePDF,
        generateMultiplePDFs: generateMultiplePDFs
    };
});