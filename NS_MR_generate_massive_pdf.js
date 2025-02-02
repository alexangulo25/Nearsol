/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/runtime', 'N/file', 'N/config', 'N/render'],
    (search, record, runtime, file, config, render) => {

        function getInputData() {
            const startDate = runtime.getCurrentScript().getParameter({ name: 'custscript_start_date' });
            const endDate = runtime.getCurrentScript().getParameter({ name: 'custscript_end_date' });

            let filters = [["subsidiary", "anyof", "10"]];


            filters.push('AND', ["vendor.internalid", "anyof", [5915, 5900, 5923]]);

            if (startDate) {
                filters.push('AND', ['trandate', 'onorafter', startDate]);
            }
            if (endDate) {
                filters.push('AND', ['trandate', 'onorbefore', endDate]);
            }

            return search.create({
                type: search.Type.VENDOR_BILL,
                filters: filters,
                columns: [
                    search.createColumn({ name: "type", summary: "GROUP" }),
                    search.createColumn({ name: "internalid", join: "vendor", summary: "GROUP" }),
                    search.createColumn({ name: "companyname", join: "vendor", summary: "GROUP" }),
                    search.createColumn({ name: "account", summary: "GROUP" }),
                    search.createColumn({ name: "fxamount", summary: "SUM" }),
                    search.createColumn({ name: "vatregnumber", join: "vendor", summary: "GROUP" })
                ]
            });
        }

        function map(context) {
            log.debug({
                title: 'context',
                details: context
            })
            let searchResult = JSON.parse(context.value);
            let vendorId = searchResult.values["GROUP(internalid.vendor)"].value;
            let vendorName = searchResult.values["GROUP(companyname.vendor)"];
            let account = searchResult.values["GROUP(account)"].text;
            let amount = parseFloat(searchResult.values["SUM(fxamount)"]) || 0;
            let type = searchResult.values["GROUP(type)"].text;
            let taxNumber = searchResult.values["GROUP(vatregnumber.vendor)"] || '';

            let recordData = {
                vendorId,
                vendorName,
                account,
                amount,
                type,
                taxNumber
            };
            log.debug({
                title: 'recordData',
                details: recordData
            })

            context.write(vendorId, recordData);
        }

        function reduce(context) {
            try {


                let vendorId = context.key;
                let vendorRecord = record.load({ type: record.Type.VENDOR, id: vendorId });
                let startDate = runtime.getCurrentScript().getParameter({ name: 'custscript_start_date' });
                let endDate = runtime.getCurrentScript().getParameter({ name: 'custscript_end_date' });
                log.debug({
                    title: 'startDate',
                    details: startDate
                })
                log.debug({
                    title: 'endDate',
                    details: endDate
                })
                let fiscalYear = new Date(startDate).getFullYear();
                let sublistData = context.values.map(value => JSON.parse(value));

                log.debug({
                    title: 'sublistData reduce',
                    details: sublistData
                })

                let xml = generateXML(vendorRecord, startDate, endDate, fiscalYear, sublistData);
                if (!xml) {
                    throw new Error('Failed to generate XML');
                }
                let vendorName = sublistData[0].vendorName
                var fileName = vendorName + '_Fiscal_Year_' + fiscalYear + '.pdf';
                var pdfFile = render.xmlToPdf({ xmlString: xml });

                let fileObj = file.create({
                    name: fileName,
                    fileType: file.Type.PDF,
                    contents: pdfFile.getContents(),
                    folder: 5968,
                    description: 'Generated PDF for ' + vendorName + ' in FY ' + fiscalYear
                });

                let fileId = fileObj.save();
                log.audit('File Saved', `File ID: ${fileId} for Vendor: ${vendorId}`);
            } catch (error) {
                log.error({
                    title: 'error',
                    details: error
                })
            }
        }

        function summarize(summary) {
            log.audit('Map/Reduce Complete', {
                totalProcessed: summary.reduceSummary.count
            });

            summary.output.iterator().each((key, value) => {
                log.debug(`Vendor ID: ${key}`, `File Saved: ${value}`);
                return true;
            });
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
            try {


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
                    var key = row.type + '|' + row.vendorName + '|' + row.account;
                    if (!groupedData[key]) {
                        groupedData[key] = {
                            name: row.vendorName,
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
                xml += '<p><strong>Año Gravable: </strong> ' + fiscalYear + '</p>';
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

                return xml;
            } catch (error) {
                log.error({
                    title: 'error in generate PDF',
                    details: error
                })
            }
        }

        return {
            getInputData,
            map,
            reduce,
            summarize
        };
    });
