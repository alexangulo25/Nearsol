/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord', 'N/https'], function (url, currentRecord, https) {
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

    var sublistData = [];
    var lineCount = record.getLineCount({ sublistId: 'custpage_sublist' });

    for (var i = 0; i < lineCount; i++) {
        sublistData.push({
            type: record.getSublistValue({ sublistId: 'custpage_sublist', fieldId: 'custpage_type', line: i }),
            name: record.getSublistValue({ sublistId: 'custpage_sublist', fieldId: 'custpage_name', line: i }),
            account: record.getSublistValue({ sublistId: 'custpage_sublist', fieldId: 'custpage_account', line: i }),
            amount: record.getSublistValue({ sublistId: 'custpage_sublist', fieldId: 'custpage_amount', line: i }),
            taxitem: record.getSublistValue({ sublistId: 'custpage_sublist', fieldId: 'custpage_taxitem', line: i }) // Incluir taxitem
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


        var suiteletUrl = url.resolveScript({
            scriptId: 'customscript_generate_pdf_suitelet_',
            deploymentId: 'customdeploy_generate_pdf_suitelet_',
            params: {
                startDate: startDate,
                endDate: endDate,
                massPDF: true
            }
        });


        // abre la URL en una nueva pestaña
        window.open(suiteletUrl, '_blank');


    }
    return {
        pageInit: pageInit,
        generatePDF: generatePDF,
        generateMultiplePDFs: generateMultiplePDFs
    };
});