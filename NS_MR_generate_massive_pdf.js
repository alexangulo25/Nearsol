/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/runtime', 'N/file', 'N/config', 'N/render'],
    (search, record, runtime, file, config, render) => {
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
        function getInputData() {
            const startDate = runtime.getCurrentScript().getParameter({ name: 'custscript_start_date' });
            const endDate = runtime.getCurrentScript().getParameter({ name: 'custscript_end_date' });

            let filters = [["subsidiary", "anyof", "10"]];


            //filters.push('AND', ["vendor.internalid", "anyof", [5915, 5900, 5923]]);

            if (startDate) {
                filters.push('AND', ['trandate', 'onorafter', startDate]);
            }
            if (endDate) {
                filters.push('AND', ['trandate', 'onorbefore', endDate]);
            }

            return search.create({
                type: search.Type.VENDOR_BILL,
                filters: filters,
                columns:
                    [
                        search.createColumn({
                            name: "type",
                            summary: "GROUP",
                            label: "Type"
                        }),
                        search.createColumn({
                            name: "internalid",
                            join: "vendor",
                            summary: "GROUP",
                            label: "Internal ID"
                        }),
                        search.createColumn({
                            name: "companyname",
                            join: "vendor",
                            summary: "GROUP",
                            label: "Company Name"
                        }),
                        search.createColumn({
                            name: "account",
                            summary: "GROUP",
                            label: "Account"
                        }),
                        search.createColumn({
                            name: "fxamount",
                            summary: "SUM",
                            label: "Amount (Foreign Currency)"
                        }),
                        search.createColumn({
                            name: "vatregnumber",
                            join: "vendor",
                            summary: "GROUP",
                            label: "Tax Number"
                        }),
                        search.createColumn({
                            name: "taxitem",
                            summary: "GROUP",
                            label: "Tax Item"
                        }) // Nueva columna para taxitem
                    ]
            });
        }

        function map(context) {

            let searchResult = JSON.parse(context.value);
            let vendorId = searchResult.values["GROUP(internalid.vendor)"].value;
            let vendorName = searchResult.values["GROUP(companyname.vendor)"];
            let account = searchResult.values["GROUP(account)"].text;
            let amount = parseFloat(searchResult.values["SUM(fxamount)"]) || 0;
            let type = searchResult.values["GROUP(type)"].text;
            let taxNumber = searchResult.values["GROUP(vatregnumber.vendor)"] || '';
            let taxitem = searchResult.values["GROUP(taxitem)"].text
            if ((account.indexOf('witholding') !== -1 || /^15/.test(account) || /^5/.test(account) || /^6/.test(account)) && amount !== 0 && vendorName) {
                let recordData = {
                    vendorId,
                    vendorName,
                    account,
                    amount,
                    type,
                    taxNumber,
                    taxitem
                };
                log.debug({
                    title: 'recordData',
                    details: recordData
                })

                context.write(vendorId, recordData);

            }


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
                    folder: 6029,
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
        function mapTaxItem(taxItem) {

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
            xml += '<p><strong>Año Gravable: </strong> ' + fiscalYear + '</p>';
            xml += '<p><strong>Rango de fechas: </strong> ' + startDate + ' - ' + endDate + '</p>';
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
                    xml += '<td>' + formatCurrency(item.totalAmount) + '</td>';
                    xml += '<td>' + formatCurrency(item.retentionAmount) + '</td>';
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
            getInputData,
            map,
            reduce,
            summarize
        };
    });
