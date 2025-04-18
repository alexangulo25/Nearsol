/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/config', 'N/render', 'N/record', 'N/log', 'N/file', 'N/task'], function (config, render, record, log, file, task) {
    const taxMapping = {
        "-Not Taxable-": "",
        "SS-CO-Gral + 236515 WHT Consult 0%": "Honorarios 0%",
        "SS-CO-Gral + 236515 WHT Consult 10%": "Honorarios 10%",
        "SS-CO-Gral + 236515 WHT Consult 11%": "Honorarios 11%",
        "SS-CO-Gral + 236525 WHT Serv 0%": "Servicios 0%",
        "SS-CO-Gral + 236525 WHT Serv 1%": "Servicios 1%",
        "SS-CO-Gral + 236525 WHT Serv 2%": "Servicios 2%",
        "SS-CO-Gral + 236525 WHT Serv 3-5%": "Servicios 3.5%",
        "SS-CO-Gral + 236525 WHT Serv 4%": "Servicios 4%",
        "SS-CO-Gral + 236525 WHT Serv 6%": "Servicios 6%",
        "SS-CO-Gral + 236530 WHT Rent 3-5%": "Arrendamientos 3.5%",
        "SS-CO-Gral + 236530 WHT Rent 4%": "Arrendamientos 4%",
        "SS-CO-Gral + 236530 WHTRent 0%": "Arrendamientos 0%",
        "SS-CO-Gral + 236570 WHT Otros 0%": "Otros Ingresos y Patrimonio 0%",
        "SS-CO-GRAL + 236570 WHT Otros 2-5%": "Otros Ingresos y Patrimonio 2.5%",
        "SS-CO-GRAL + 236570 WHT Otros 3-5%": "Otros Ingresos y Patrimonio 3.5%",
        "SS-CO-VAT0% + 236505 WHTSalaries0% + 2368 iCA0.966%": "Ingresos Laborales 0%",
        "SS-CO-VAT0% + 236515 WHTHon0%": "Honorarios 0%",
        "SS-CO-VAT0% + 236525 WHTServ0%": "Servicios 0%",
        "SS-CO-VAT0% + 236525 WHTServ1%": "Servicios 1%",
        "SS-CO-VAT0% + 236525 WHTServ2%": "Servicios 2%",
        "SS-CO-VAT0% + 236525 WHTServ3-5%": "Servicios 3.5%",
        "SS-CO-VAT0% + 236525 WHTServ4%": "Servicios 4%",
        "SS-CO-VAT0% + 236525 WHTServ6%": "Servicios 6%",
        "SS-CO-VAT0% + 236530 WHTRent0%": "Arrendamientos 0%",
        "SS-CO-VAT0% + 236530 WHTRent3-5%": "Arrendamientos 3.5%",
        "SS-CO-VAT0% + 236530 WHTRent4%": "Arrendamientos 4%",
        "SS-CO-VAT0% + 236570 WHT Otros0%": "Otros Ingresos y Patrimonio 0%",
        "SS-CO-VAT0% + 236570 WHT Otros2-5%": "Otros Ingresos y Patrimonio 2.5%",
        "SS-CO-VAT0% + 236570 WHT Otros3-5%": "Otros Ingresos y Patrimonio 3.5%",
        "SS-CO-VAT0% + WHTServ0%": "Servicios 0%",
        "SS-CO-VAT5% + 236570 WHT Otros0%": "Otros Ingresos y Patrimonio 0%",
        "236525 WHTCOSer1%": "Servicios 1%",
        "236525 WHTCOSer3-5": "Servicios 3.5%",
        "236530 WHTCOArri3-5": "Arrendamientos 3.5%",
        "236570 WHTCOOtrs3-5": "Otros Ingresos y Patrimonio 3.5%",
        "236530 WHTCOArri4": "Arrendamientos 4%",
        "236525 WHTCOSer4": "Servicios 4%",
        "SS-CO-Gral": "Otros Ingresos y Patrimonio 0%",
        "WHTCOSer2": "Servicios 2%",
        "236570 WHTCOOtrs2-5": "Otros Ingresos y Patrimonio 2.5%",
        "236525 WHTCOSer2": "Servicios 2%",
    };
    const taxCodes = {
        "Not Taxable": null,
        "SS-CO-Gral + 236515 WHT Consult 0%": "236515 WHTCOHon0%",
        "SS-CO-Gral + 236515 WHT Consult 10%": "236515 WHTCOHon10",
        "SS-CO-Gral + 236515 WHT Consult 11%": "236515 WHTCOHon11",
        "SS-CO-Gral + 236525 WHT Serv 0%": "236525 WHTCOSer0%",
        "SS-CO-Gral + 236525 WHT Serv 1%": "236525 WHTCOSer1%",
        "SS-CO-Gral + 236525 WHT Serv 2%": "236525 WHTCOSer2",
        "SS-CO-Gral + 236525 WHT Serv 3-5%": "236525 WHTCOSer3-5",
        "SS-CO-Gral + 236525 WHT Serv 4%": "236525 WHTCOSer4",
        "SS-CO-Gral + 236525 WHT Serv 6%": "236525 WHTCOSer6%",
        "SS-CO-Gral + 236530 WHT Rent 3-5%": "236530 WHTCOArri3-5",
        "SS-CO-Gral + 236530 WHT Rent 4%": "236530 WHTCOArri4",
        "SS-CO-Gral + 236530 WHT Rent 0%": "236530 WHTCOArri0",
        "SS-CO-Gral + 236570 WHT Otros 0%": "236570 WHTCOOtrs0%",
        "SS-CO-GRAL + 236570 WHT Otros 2-5%": "236570 WHTCOOtrs2-5",
        "SS-CO-GRAL + 236570 WHT Otros 3-5%": "236570 WHTCOOtrs3-5",
        "SS-CO-VAT0% + 236505 WHTSalaries0% + 2368 iCA0.966%": "236805 WHTiCACOServ0.966%",
        "SS-CO-VAT0% + 236515 WHTHon0%": "236515 WHTCOHon0%",
        "SS-CO-VAT0% + 236525 WHTServ0%": "236525 WHTCOSer0%",
        "SS-CO-VAT0% + 236525 WHTServ1%": "236525 WHTCOSer1%",
        "SS-CO-VAT0% + 236525 WHTServ2%": "236525 WHTCOSer2",
        "SS-CO-VAT0% + 236525 WHTServ3-5%": "236525 WHTCOSer3-5",
        "SS-CO-VAT0% + 236525 WHTServ4%": "236525 WHTCOSer4",
        "SS-CO-VAT0% + 236525 WHTServ6%": "236525 WHTCOSer6%",
        "SS-CO-VAT0% + 236530 WHTRent0%": "236530 WHTCOArri0",
        "SS-CO-VAT0% + 236530 WHTRent3-5%": "236530 WHTCOArri3-5",
        "SS-CO-VAT0% + 236530 WHTRent4%": "236525 WHTCOSer4",
        "SS-CO-VAT0% + 236570 WHT Otros0%": "236570 WHTCOOtrs0%",
        "SS-CO-VAT0% + 236570 WHT Otros2-5%": "236570 WHTCOOtrs2-5",
        "SS-CO-VAT0% + 236570 WHT Otros3-5%": "236570 WHTCOOtrs3-5",
        "SS-CO-VAT0% + WHTServ0%": "236525 WHTCOSer0%",
        "SS-CO-VAT5% + 236570 WHT Otros0%": "236570 WHTCOOtrs0%"
    };

    function onRequest(context) {

        try {
            var multipleVendors = context.request.parameters.massPDF;
            var startDate = context.request.parameters.startDate;
            var endDate = context.request.parameters.endDate;
            if (!multipleVendors) {
                //1 vendor 

                var vendorId = context.request.parameters.vendorId;
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

                log.debug({
                    title: 'parameters',
                    details: context.request.parameters
                });

                var mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_ns_mr_generate_massive_pdf',
                    deploymentId: 'customdeploy_ns_mr_generate_massive_pdf',
                    params: {
                        custscript_start_date: startDate,
                        custscript_end_date: endDate
                    }
                });

                var taskId = mrTask.submit();
                log.debug('Map/Reduce Task Submitted: ' + taskId);

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
                    '        <h1>PDFs Successfully Saved</h1>' +
                    '        <p>Your PDFs have been successfully saved in the File Cabinet.</p>' +
                    '    </div>' +
                    '</body>' +
                    '</html>';


                context.response.write(message);
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

    function formatCurrency(amount) {
        return '$' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }
    function generateXML(vendorRecord, startDate, endDate, fiscalYear, sublistData) {
        var companyConfig = config.load({
            type: config.Type.COMPANY_INFORMATION
        });

        var companyName = companyConfig.getValue({ fieldId: 'companyname' });
        var companyNit = companyConfig.getValue({ fieldId: 'employerid' });
        var companyAddress = companyConfig.getValue({ fieldId: 'mainaddress_text' });

        log.debug('Company Information', { companyName: companyName, companyNit: companyNit, companyAddress: companyAddress });

        // Objeto para agrupar y sumar los taxitem
        var taxItemsGrouped = {};

        sublistData.forEach(function (row) {
            var taxItem = row.taxitem; // Asume que taxitem está en los datos de la sublista
            log.debug({
                title: 'taxitem',
                details: taxItem
            })
            if (taxItem == 'UNDEF-CO') {
                return
            }
            log.debug({
                title: 'name bonito',
                details: taxMapping[taxItem]
            })
            var name = taxMapping[taxItem]
            var amount = parseFloat(row.amount);

            taxItem = taxCodes[taxItem] || taxItem

            log.debug({
                title: 'name taxItem',
                details: taxItem
            })

            log.debug({
                title: 'name taxItemsGrouped',
                details: taxItemsGrouped[taxItem]
            })


            if (!taxItemsGrouped[taxItem]) {
                taxItemsGrouped[taxItem] = {
                    taxItem: taxItem,
                    totalAmount: 0,
                    retentionAmount: 0,
                    name: name
                };
            }

            // Sumar el monto total
            if (row.account.toLowerCase().indexOf('witholding') == -1) {
                taxItemsGrouped[taxItem].totalAmount += amount;
            }


            // Si es una retención, sumar al monto de retención
            if (row.account.toLowerCase().indexOf('witholding') !== -1) {
                taxItemsGrouped[taxItem].retentionAmount += amount;
            }
            if (isEmpty(taxItemsGrouped[taxItem].name)) {
                taxItemsGrouped[taxItem].name = name;
            }



        });

        log.debug('Grouped Tax Items', taxItemsGrouped);

        var xml = '<pdf><head><style>';
        xml += 'body { font-family: Arial, sans-serif; font-size: 10pt; color: #333; }';
        xml += 'h1 { font-size: 18pt; color: #000000; }';
        xml += 'h2 { font-size: 14pt; color: #0056b3; }';
        xml += 'table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }';
        xml += '.red-rounded-table { border: 2px solid red; border-radius: 10px; padding: 10px; }';
        xml += '.black-rounded-table { border: 2px solid black; border-radius: 10px; padding: 10px; }';
        xml += 'th, td { padding: 6px; text-align: center; }';
        xml += 'th { background-color: #f2f2f2; }';
        xml += '.header-table td { border: none; }';
        xml += '.header-table img { width: 100px; }';
        xml += '.footer { text-align: center; font-size: 9pt; margin-top: 20px; }';
        xml += '.detalle-retencion th, .detalle-retencion td { border: 1px solid #ccc; }';
        xml += '</style></head><body>';

        xml += '<table class="header-table black-rounded-table">';
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
        xml += '<td><strong>Retenedor:</strong> Nearsol Colombia SAS</td>';
        xml += '</tr>';
        xml += '<tr>';
        xml += '<td><strong>NIT:</strong> 901.196.266-1</td>';
        xml += '</tr>';
        xml += '<tr>';
        xml += '<td><strong>Dirección:</strong> Calle 29 A 52 - 100 Piso 3, Medellín</td>';
        xml += '</tr>';
        xml += '<tr>';
        xml += '<td><strong>Retuvo a:</strong> ' + escapeXml(vendorRecord.getValue('companyname')) + '</td>';
        xml += '</tr>';
        xml += '<tr>';
        xml += '<td><strong>NIT:</strong> ' + escapeXml(vendorRecord.getValue('vatregnumber')) + '</td>';
        xml += '</tr>';
        xml += '</table>';
        xml += '<h2>Detalles de la retención</h2>';
        xml += '<table class="detalle-retencion">';
        xml += '<tr>';
        xml += '<th><strong>Concepto de la retención</strong></th>';
        xml += '<th><strong>Monto total sujeto a retención</strong></th>';
        xml += '<th><strong>Valor total retención</strong></th>';
        xml += '</tr>';

        // Iterar sobre los taxitem agrupados
        for (var taxItem in taxItemsGrouped) {
            if (taxItemsGrouped.hasOwnProperty(taxItem)) {
                var item = taxItemsGrouped[taxItem];
                xml += '<tr>';
                xml += '<td>' + escapeXml(item.name) + '</td>';
                xml += '<td>' + escapeXml(formatCurrency(item.totalAmount)) + '</td>';
                xml += '<td>' + escapeXml(formatCurrency(item.retentionAmount)) + '</td>';
                xml += '</tr>';
            }
        }

        xml += '</table>';
        xml += '<p><strong>Firma autorizada:</strong> ______________________</p>';
        xml += '<div class="footer">';
        xml += '<p>Este es un documento generado automáticamente y no requiere firma.</p>';
        xml += '</div>';
        xml += '</body></pdf>';

        log.debug('Generated XML Content', xml);

        return xml;
    }

    function mapTaxItem(taxItem) {
        log.debug({
            title: 'taxItem',
            details: taxItem
        })
        // Ensure taxItem is a string
        if (typeof taxItem !== "string") {
            return taxItem; // Return as-is if it's not a string
        }

        if (taxItem.indexOf("236530 WHT Rent 4%") !== -1 || taxItem.indexOf("236530 WHTRent4%") !== -1) {
            return "236530 WHTCOArri4";
        } else if (taxItem.indexOf("236525 WHT Serv 4%") !== -1) {
            return "236525 WHTCOSer4";
        } else if (taxItem.indexOf("236530 WHT Rent 3-5%") !== -1) {
            return "236530 WHTCOArri3-5";
        } else if (taxItem.indexOf("236530 WHTRent0%") !== -1) {
            return "Rent0%";
        } else {
            return taxItem; // Return original value if no match
        }
    }

    // Función para normalizar las combinaciones de taxitem
    function normalizeTaxItem(taxItem) {
        if (!taxItem) return '';

        // Separar los componentes del taxitem
        var components = taxItem.split(' + ');

        // Ordenar los componentes alfabéticamente
        components.sort();

        // Unir los componentes ordenados
        return components.join(' + ');
    }

    const isEmpty = (stValue) => {
        return (
            (stValue === '' || stValue == null || stValue == undefined || stValue == 'undefined') ||
            (stValue.constructor === Array && stValue.length == 0) ||
            (stValue.constructor === Object && (function (v) {
                for (let k in v)
                    return false;
                return true;
            })(stValue))
        );
    }



    return {
        onRequest: onRequest
    };
});