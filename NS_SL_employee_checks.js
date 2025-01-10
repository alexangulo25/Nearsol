/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/record', 'N/search', 'N/ui/serverWidget', 'N/render', 'N/file', 'N/https'], function (record, search, serverWidget, render, file, https) {

    function onRequest(context) {
        if (context.request.method === 'GET') {
            var form = serverWidget.createForm({
                title: 'Employee Checks'
            });

            // Add a sublist to display records
            var sublist = form.addSublist({
                id: 'custpage_employeechecks',
                type: serverWidget.SublistType.LIST,
                label: 'Employee Checks'
            });

            // Add fields to the sublist
            sublist.addField({
                id: 'custpage_checkbox',
                type: serverWidget.FieldType.CHECKBOX,
                label: 'Select'
            });

            sublist.addField({
                id: 'custpage_codigoempleado',
                type: serverWidget.FieldType.TEXT,
                label: 'Employee Code'
            });

            sublist.addField({
                id: 'custpage_empleado',
                type: serverWidget.FieldType.TEXT,
                label: 'Employee Name'
            });

            sublist.addField({
                id: 'custpage_monto',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Amount'
            });

            // Perform a search to get the data
            var employeeCheckSearch = search.create({
                type: 'customrecord_ns_employee_checks',
                columns: [
                    'custrecord_ns_codigo_empleado',
                    'custrecord_ns_empleado',
                    'custrecord_ns_monto'
                ]
            });

            var results = employeeCheckSearch.run().getRange({
                start: 0,
                end: 1000 // Adjust as needed
            });

            // Populate the sublist with search results
            for (var i = 0; i < results.length; i++) {
                var result = results[i];
                sublist.setSublistValue({
                    id: 'custpage_codigoempleado',
                    line: i,
                    value: result.getValue('custrecord_ns_codigo_empleado')
                });
                sublist.setSublistValue({
                    id: 'custpage_empleado',
                    line: i,
                    value: result.getValue('custrecord_ns_empleado')
                });
                sublist.setSublistValue({
                    id: 'custpage_monto',
                    line: i,
                    value: result.getValue('custrecord_ns_monto')
                });
            }

            // Add a button to print the selected records
            form.addSubmitButton({
                label: 'Print PDF'
            });

            context.response.writePage(form);
        } else if (context.request.method === 'POST') {
            // Handle the form submission and generate the PDF

            var selectedRecords = [];
            var lineCount = context.request.getLineCount({
                group: 'custpage_employeechecks'
            });

            for (var i = 0; i < lineCount; i++) {
                var isSelected = context.request.getSublistValue({
                    group: 'custpage_employeechecks',
                    name: 'custpage_checkbox',
                    line: i
                });

                if (isSelected === 'T') {
                    selectedRecords.push({
                        codigoEmpleado: context.request.getSublistValue({
                            group: 'custpage_employeechecks',
                            name: 'custpage_codigoempleado',
                            line: i
                        }),
                        empleado: context.request.getSublistValue({
                            group: 'custpage_employeechecks',
                            name: 'custpage_empleado',
                            line: i
                        }),
                        monto: context.request.getSublistValue({
                            group: 'custpage_employeechecks',
                            name: 'custpage_monto',
                            line: i
                        }),
                        letras: NumeroALetras(context.request.getSublistValue({
                            group: 'custpage_employeechecks',
                            name: 'custpage_monto',
                            line: i
                        }), 'PESOS')
                    });
                }
            }

            log.debug({
                title: 'selectedRecords',
                details: selectedRecords
            })

            if (selectedRecords.length > 0) {
                // Generate the PDF
                var renderer = render.create();
                renderer.templateContent = generateCheckXMLTemplate(selectedRecords);

                var pdfFile = renderer.renderAsPdf();
                pdfFile.name = 'EmployeeChecks.pdf';
                context.response.writeFile(pdfFile, true);
            } else {
                context.response.write('No records selected.');
            }
        }
    }

    function generateCheckXMLTemplate(records) {
        var xml = '<?xml version="1.0"?>';
        xml += '<pdf>';
        xml += '<body>';

        records.forEach(function (record, index) {
            xml += '<table style="width: 100%; margin-top: 20px;">';
            xml += '<tr>';
            xml += '<td align="right">GUATEMALA, 22/05/2024 **' + record.monto + '**</td>';
            xml += '</tr>';
            xml += '<tr>';
            xml += '<td>**' + record.empleado + '**</td>';
            xml += '</tr>';
            xml += '<tr>';
            xml += '<td>**' + record.letras + '**</td>';
            xml += '</tr>';
            xml += '<tr>';
            xml += '<td style="padding-top: 20px;">NO NEGOCIABLE</td>';
            xml += '</tr>';
            xml += '<tr>';
            xml += '<td style="padding-top: 10px;">Tax refund 2023</td>';
            xml += '</tr>';
            xml += '</table>';

            xml += '<table style="width: 100%; margin-top: 50px; border-top: 1px solid #000;">';
            xml += '<tr>';
            xml += '<td align="right">GUATEMALA, 22/05/2024 **' + record.monto + '**</td>';
            xml += '</tr>';
            xml += '<tr>';
            xml += '<td>**' + record.empleado + '**</td>';
            xml += '</tr>';
            xml += '<tr>';
            xml += '<td>**' + record.letras + '**</td>';
            xml += '</tr>';
            xml += '<tr>';
            xml += '<td style="padding-top: 20px;">INTERBANCO, S.A. NEARSOL, S.A. (Q) 8100-89960-6 000000009090</td>';
            xml += '</tr>';
            xml += '</table>';

            xml += '<table style="width: 100%; margin-top: 20px; border-top: 1px solid #000;">';
            xml += '<tr>';
            xml += '<th>CODIGO CUENTA</th>';
            xml += '<th>NOMBRE CUENTA</th>';
            xml += '<th>DEBITOS</th>';
            xml += '<th>CREDITOS</th>';
            xml += '</tr>';
            xml += '<tr>';
            xml += '<td>1.1.01.02.42</td>';
            xml += '<td>NEARSOL, S.A. - INTERBANCO (Q) 8100-89960-6</td>';
            xml += '<td>' + record.monto + '</td>';
            xml += '<td></td>';
            xml += '</tr>';
            xml += '<tr>';
            xml += '<td>2.1.02.03.00</td>';
            xml += '<td>RETENCIONES ISR A EMPLEADOS</td>';
            xml += '<td></td>';
            xml += '<td>' + record.monto + '</td>';
            xml += '</tr>';
            xml += '</table>';

            if (index < records.length - 1) {
                xml += '<pbr />'; // Page break between checks
            }
        });

        xml += '</body>';
        xml += '</pdf>';

        return xml;
    }
    function Unidades(pNumber) {
        switch (pNumber) {
            case 1: return 'UN';
            case 2: return 'DOS';
            case 3: return 'TRES';
            case 4: return 'CUATRO';
            case 5: return 'CINCO';
            case 6: return 'SEIS';
            case 7: return 'SIETE';
            case 8: return 'OCHO';
            case 9: return 'NUEVE';
        }
        return '';
    }
    function Decenas(pNumber) {
        var decena = Math.floor(pNumber / 10);
        var unidad = pNumber - (decena * 10);
        switch (decena) {
            case 1:
                switch (unidad) {
                    case 0: return 'DIEZ';
                    case 1: return 'ONCE';
                    case 2: return 'DOCE';
                    case 3: return 'TRECE';
                    case 4: return 'CATORCE';
                    case 5: return 'QUINCE';
                    default: return 'DIECI' + Unidades(unidad);
                }
            case 2:
                switch (unidad) {
                    case 0: return 'VEINTE';
                    default: return 'VEINTI' + Unidades(unidad);
                }
            case 3: return DecenasY('TREINTA', unidad);
            case 4: return DecenasY('CUARENTA', unidad);
            case 5: return DecenasY('CINCUENTA', unidad);
            case 6: return DecenasY('SESENTA', unidad);
            case 7: return DecenasY('SETENTA', unidad);
            case 8: return DecenasY('OCHENTA', unidad);
            case 9: return DecenasY('NOVENTA', unidad);
            case 0: return Unidades(unidad);
        }
    }
    function DecenasY(pString, pUnitsNumber) {
        if (pUnitsNumber > 0) {
            return pString + ' Y ' + Unidades(pUnitsNumber);
        }
        else {
            return pString;
        }
    }
    function Centenas(pNumber) {
        var centenas = Math.floor(pNumber / 100);
        var decenas = pNumber - (centenas * 100);
        switch (centenas) {
            case 1:
                if (decenas > 0) {
                    return 'CIENTO ' + Decenas(decenas);
                }
                else {
                    return 'CIEN';
                }
            case 2: return 'DOSCIENTOS ' + Decenas(decenas);
            case 3: return 'TRESCIENTOS ' + Decenas(decenas);
            case 4: return 'CUATROCIENTOS ' + Decenas(decenas);
            case 5: return 'QUINIENTOS ' + Decenas(decenas);
            case 6: return 'SEISCIENTOS ' + Decenas(decenas);
            case 7: return 'SETECIENTOS ' + Decenas(decenas);
            case 8: return 'OCHOCIENTOS ' + Decenas(decenas);
            case 9: return 'NOVECIENTOS ' + Decenas(decenas);
        }
        return Decenas(decenas);
    }
    function Seccion(pNumber, pDivisor, pStringSingular, pStringPlural) {
        var cientos = Math.floor(pNumber / pDivisor);
        var resto = pNumber - (cientos * pDivisor);
        var letras = '';
        if (cientos > 0) {
            if (cientos > 1) {
                letras = Centenas(cientos) + ' ' + pStringPlural;
            }
            else {
                letras = pStringSingular;
            }
        }
        if (resto > 0) {
            letras += '';
        }
        return letras;
    }
    function Miles(pNumber) {
        var divisor = 1000;
        var cientos = Math.floor(pNumber / divisor);
        var resto = pNumber - (cientos * divisor);
        var strMiles = Seccion(pNumber, divisor, 'UN MIL', 'MIL');
        var strCentenas = Centenas(resto);
        if (strMiles == '') {
            return strCentenas;
        }
        else {
            return strMiles + ' ' + strCentenas;
        }
    }
    function Millones(pNumber) {
        var divisor = 1000000;
        var cientos = Math.floor(pNumber / divisor);
        var resto = pNumber - (cientos * divisor);
        var strMillones = Seccion(pNumber, divisor, 'UN MILLON DE', 'MILLONES DE');
        var strMiles = Miles(resto);
        if (strMillones == '') {
            return strMiles;
        }
        else {
            return strMillones + ' ' + strMiles;
        }
    }
    function NumeroALetras(pNumber, pCurrency) {
        pCurrency = pCurrency || {};
        var data = {
            numero: pNumber,
            enteros: Math.floor(pNumber),
            centavos: (((Math.round(pNumber * 100)) - (Math.floor(pNumber) * 100))),
            letrasCentavos: '',
            letrasMonedaPlural: pCurrency.plural || 'PESOS',
            letrasMonedaSingular: pCurrency.singular || 'PESO',
            letrasMonedaCentavoPlural: pCurrency.centPlural || 'CENTAVOS',
            letrasMonedaCentavoSingular: pCurrency.centSingular || 'CENTAVO'
        };
        if (data.centavos > 0) {
            data.letrasCentavos = 'CON ' + (function () {
                if (data.centavos == 1) {
                    return Millones(data.centavos) + ' ' + data.letrasMonedaCentavoSingular;
                }
                else {
                    return Millones(data.centavos) + ' ' + data.letrasMonedaCentavoPlural;
                }
            })();
        }
        ;
        if (data.enteros == 0) {
            return 'CERO ' + data.letrasMonedaPlural + ' ' + data.letrasCentavos;
        }
        if (data.enteros == 1) {
            return Millones(data.enteros) + ' ' + data.letrasMonedaSingular + ' ' + data.letrasCentavos;
        }
        else {
            return Millones(data.enteros) + ' ' + data.letrasMonedaPlural + ' ' + data.letrasCentavos;
        }
    };

    return {
        onRequest: onRequest
    };
});
