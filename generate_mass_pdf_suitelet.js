/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/config', 'N/render', 'N/record', 'N/log'], function(config, render, record, log) {
    function onRequest(context) {
        try {
            var vendorId = context.request.parameters.vendorId;
            var startDate = context.request.parameters.startDate;
            var endDate = context.request.parameters.endDate;
            var fiscalYear = context.request.parameters.fiscalYear;
            var sublistData = JSON.parse(context.request.parameters.sublistData);
            var retainerInfo = JSON.parse(context.request.parameters.retainerInfo);

            log.debug('Parameters', { vendorId: vendorId, startDate: startDate, endDate: endDate, fiscalYear: fiscalYear, sublistData: sublistData, retainerInfo: retainerInfo });

            if (!vendorId) {
                throw new Error('Vendor ID is required');
            }

            // Log the vendorId to debug
            log.debug('Vendor ID Received', vendorId);

            // Log the sublistData to debug
            log.debug('Sublist Data', sublistData);

            var vendorInfo = retainerInfo.vendorData[vendorId];
            if (!vendorInfo) {
                throw new Error('Vendor information not found for vendor ID: ' + vendorId);
            }

            var xml = generateXML(vendorInfo, startDate, endDate, fiscalYear, sublistData, retainerInfo); // Generar el XML con los detalles del proveedor
            if (!xml) {
                throw new Error('Failed to generate XML');
            }

            log.debug('Generated XML', xml);

            var pdfFile = render.xmlToPdf({ xmlString: xml });

            context.response.writeFile(pdfFile);
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

    function generateXML(vendorInfo, startDate, endDate, fiscalYear, sublistData, retainerInfo) {
        var groupedData = {};

        // Agrupa los datos de la sublista
        sublistData.forEach(function(row) {
            var key = row.type + '|' + row.name + '|' + row.account;
            if (!groupedData[key]) {
                groupedData[key] = {
                    type: row.type,
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
            tableRows += '<td>' + escapeXml(row.type) + '</td>';
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
        xml += '<td><img src="URL_DEL_LOGO" /></td>';
        xml += '<td>';
        xml += '<h1><strong>CERTIFICADO DE RETENCION EN LA FUENTE</strong></h1>';
        xml += '<p><strong>Año Gravable: </strong> ' + escapeXml(fiscalYear) + '</p>';
        xml += '<p><strong>Rango de fechas: </strong> ' + escapeXml(startDate) + ' - ' + escapeXml(endDate) + '</p>';
        xml += '</td>';
        xml += '</tr>';
        xml += '</table>';
        xml += '<table class="black-rounded-table">';
        xml += '<tr>';
        xml += '<td><strong>Retenedor:</strong> ' + escapeXml(retainerInfo.companyName) + '</td>';
        xml += '</tr>';
        xml += '<tr>';
        xml += '<td><strong>NIT:</strong> ' + escapeXml(retainerInfo.companyNit) + '</td>';
        xml += '</tr>';
        xml += '<tr>';
        xml += '<td><strong>Dirección:</strong> ' + escapeXml(retainerInfo.companyAddress) + '</td>';
        xml += '</tr>';
        xml += '<tr>';
        xml += '<td><strong>Retuvo a:</strong> ' + escapeXml(vendorInfo.vendorName) + '</td>';
        xml += '</tr>';
        xml += '<tr>';
        xml += '<td><strong>NIT:</strong> ' + escapeXml(vendorInfo.vendorNit) + '</td>';
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