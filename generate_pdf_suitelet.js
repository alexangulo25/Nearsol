/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/config', 'N/render', 'N/record', 'N/log', 'N/file'], function (config, render, record, log, file) {
    function onRequest(context) {
        try {
            var multipleVendors = context.request.parameters.vendorIds
            if (!multipleVendors) {
                //1 vendor 

                var vendorId = context.request.parameters.vendorId;
                var startDate = context.request.parameters.startDate;
                var endDate = context.request.parameters.endDate;
                var fiscalYear = context.request.parameters.fiscalYear;
                var sublistData = JSON.parse(context.request.parameters.sublistData);

                log.debug('Parameters', { vendorId: vendorId, startDate: startDate, endDate: endDate, fiscalYear: fiscalYear, sublistData: sublistData });

                if (!vendorId) {
                    throw new Error('Vendor ID is required');
                }

                // Log the vendorId to debug
                log.debug('Vendor ID Received', vendorId);

                // Log the sublistData to debug
                log.debug('Sublist Data', sublistData);

                var vendorRecord;
                try {
                    vendorRecord = record.load({
                        type: record.Type.VENDOR,
                        id: vendorId
                    });
                    log.debug('Vendor Record Loaded', vendorRecord);
                } catch (e) {
                    log.error('Failed to load vendor record', { vendorId: vendorId, error: e.message });
                    throw new Error('Failed to load vendor record: ' + e.message);
                }

                var xml = generateXML(vendorRecord, startDate, endDate, fiscalYear, sublistData); // Generar el XML con los detalles del proveedor
                if (!xml) {
                    throw new Error('Failed to generate XML');
                }

                log.debug('Generated XML', xml);
                var vendorName = vendorRecord.getValue('entityid');
                var fileName = vendorName + '_Fiscal_Year_' + fiscalYear + '.pdf';

                var pdfFile = render.xmlToPdf({ xmlString: xml });
                var fileObj = file.create({
                    name: fileName,  // Replace with your preferred file name
                    fileType: file.Type.PDF,
                    contents: pdfFile.getContents(),
                    folder: 5968,
                    description: 'Generated PDF for ' + vendorName + ' in FY ' + fiscalYear
                });

                var fileId = fileObj.save();

                var fileUrl = file.load({ id: fileId }).url;

                var message =
                    '<!DOCTYPE html>' +
                    '<html lang="en">' +
                    '<head>' +
                    '    <meta charset="UTF-8">' +
                    '    <meta name="viewport" content="width=device-width, initial-scale=1.0">' +
                    '    <title>PDF Saved</title>' +
                    '    <style>' +
                    '        body {' +
                    '            font-family: Arial, sans-serif;' +
                    '            margin: 20px;' +
                    '            color: #333;' +
                    '        }' +
                    '        h1 {' +
                    '            color: #4CAF50;' +
                    '        }' +
                    '        p {' +
                    '            font-size: 16px;' +
                    '        }' +
                    '        a {' +
                    '            color: #0066cc;' +
                    '            text-decoration: none;' +
                    '        }' +
                    '        a:hover {' +
                    '            text-decoration: underline;' +
                    '        }' +
                    '        .container {' +
                    '            border: 1px solid #ddd;' +
                    '            padding: 20px;' +
                    '            border-radius: 8px;' +
                    '            background-color: #f9f9f9;' +
                    '            max-width: 600px;' +
                    '            margin: 0 auto;' +
                    '        }' +
                    '    </style>' +
                    '</head>' +
                    '<body>' +
                    '    <div class="container">' +
                    '        <h1>PDF Successfully Saved</h1>' +
                    '        <p>Your PDF has been successfully saved in the File Cabinet. You can access it by clicking the link below:</p>' +
                    '        <p><a href="' + fileUrl + '" target="_blank">Download Your PDF</a></p>' +
                    '    </div>' +
                    '</body>' +
                    '</html>';


                context.response.write(message);
            } else {
                //var vendorsObj = JSON.parse(multipleVendors)
                context.response.write('Trabajando por optimizar esta sección');
            }
        } catch (e) {
            log.error({
                title: 'Error generating PDF',
                details: e.message
            });
            context.response.write('Error generating PDF: ' + e.message);
        }
    }


    function escapeXml(unsafe) {
        return unsafe ? unsafe.replace(/[<>&'"]/g, function (c) {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case "'": return '&apos;';
                case '"': return '&quot;';
            }
        }) : '';
    }

    function generateXML(vendorRecord, startDate, endDate, fiscalYear, sublistData) {
        var companyConfig = config.load({
            type: config.Type.COMPANY_INFORMATION
        });

        var companyName = companyConfig.getValue({ fieldId: 'companyname' });
        var companyNit = companyConfig.getValue({ fieldId: 'employerid' });
        var companyAddress = companyConfig.getValue({ fieldId: 'mainaddress_text' });

        log.debug('Company Information', { companyName: companyName, companyNit: companyNit, companyAddress: companyAddress });

        var groupedData = {};

        // Agrupar los datos de la sublista
        sublistData.forEach(function (row) {
            var key = row.type + '|' + row.name + '|' + row.account;
            if (!groupedData[key]) {
                groupedData[key] = {
                    name: row.name,
                    account: row.account,
                    amount: 0
                };
            }
            groupedData[key].amount += parseFloat(row.amount);
        });

        log.debug('Grouped Data', groupedData);

        var totalRetentionAmount = 0;
        var tableRows = '';
        for (var key in groupedData) {
            var row = groupedData[key];
            tableRows += '<tr>';
            tableRows += '<td>' + escapeXml(row.name) + '</td>';
            tableRows += '<td>' + escapeXml(row.account) + '</td>';
            tableRows += '<td>' + escapeXml(row.amount.toFixed(2)) + '</td>';
            tableRows += '</tr>';
            totalRetentionAmount += row.amount;
        }

        log.debug('Total Retention Amount', totalRetentionAmount);

        var xml = '<pdf><head><style>';
        xml += 'body { font-family: Arial, sans-serif; font-size: 12pt; color: #333; }';
        xml += 'h1 { font-size: 18pt; color: #000000; }';
        xml += 'h2 { font-size: 14pt; color: #0056b3; }';
        xml += 'table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }';
        xml += '.red-rounded-table { border: 2px solid red; border-radius: 10px; padding: 10px; }';
        xml += '.black-rounded-table { border: 2px solid black; border-radius: 10px; padding: 10px; }';
        xml += 'th, td { padding: 8px; text-align: left; }';
        xml += 'th { background-color: #f2f2f2; }';
        xml += '.header-table td { border: none; }';
        xml += '.header-table img { width: 100px; }';
        xml += '.footer { text-align: center; font-size: 10pt; margin-top: 20px; }';
        xml += '</style></head><body>';

        xml += '<table class="header-table red-rounded-table">';
        xml += '<tr>';
        xml += '<td><img src="' + escapeXml("http://6421207-sb1.shop.netsuite.com/core/media/media.nl?id=2209&c=6421207_SB1&h=nAm5x9wxUKPXLKvwtLTvPJuOl2UkT7Vb8r0-SyQEiV-v7QSO") + '" /></td>';
        xml += '<td>';
        xml += '<h1><strong>CERTIFICADO DE RETENCION EN LA FUENTE</strong></h1>';
        xml += '<p><strong>Año Gravable: </strong> ' + escapeXml(fiscalYear) + '</p>';
        xml += '<p><strong>Rango de fechas: </strong> ' + escapeXml(startDate) + ' - ' + escapeXml(endDate) + '</p>';
        xml += '</td>';
        xml += '</tr>';
        xml += '</table>';
        xml += '<table class="black-rounded-table">';
        xml += '<tr>';
        xml += '<td><strong>Retenedor:</strong> ' + escapeXml(companyName) + '</td>';
        xml += '</tr>';
        xml += '<tr>';
        xml += '<td><strong>NIT:</strong> ' + escapeXml(companyNit) + '</td>';
        xml += '</tr>';
        xml += '<tr>';
        xml += '<td><strong>Dirección:</strong> ' + escapeXml(companyAddress) + '</td>';
        xml += '</tr>';
        xml += '<tr>';
        xml += '<td><strong>Retuvo a:</strong> ' + escapeXml(vendorRecord.getValue('companyname')) + '</td>';
        xml += '</tr>';
        xml += '<tr>';
        xml += '<td><strong>NIT:</strong> ' + escapeXml(vendorRecord.getValue('entityid')) + '</td>';
        xml += '</tr>';
        xml += '</table>';
        xml += '<h2>Detalles de la retención</h2>';
        xml += '<table>';
        xml += '<tr>';
        xml += '<th>Concepto de la retención</th>';
        xml += '<th>Monto total sujeto a retención</th>';
        xml += '<th>Valor total retención</th>';
        xml += '</tr>';
        xml += tableRows;
        xml += '</table>';

        xml += '<p><strong>Firma autorizada:</strong> ______________________</p>';
        xml += '<h2>Documentos y fechas de pago</h2>';
        xml += '<div class="footer">';
        xml += '<p>Este es un documento generado automáticamente y no requiere firma.</p>';
        xml += '</div>';
        xml += '</body></pdf>';

        log.debug('Generated XML Content', xml);

        return xml;
    }

    return {
        onRequest: onRequest
    };
});