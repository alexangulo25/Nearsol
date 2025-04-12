/**
          * @NApiVersion 2.1
          * @NScriptType Suitelet
          */
define(['N/record', 'N/search', 'N/ui/serverWidget', 'N/render', 'N/file', 'N/https', 'N/format', 'N/ui/message', 'N/format/i18n'], function (record, search, serverWidget, render, file, https, format, message, formati) {

    function onRequest(context) {
        if (context.request.method === 'GET') {
            var form = serverWidget.createForm({
                title: 'Employee Checks'
            });

            //Add inital data
            form.addFieldGroup({
                id: 'custpage_initial_data',
                label: 'Initial Data'
            });

            var paymentType = form.addField({
                id: 'custpage_payment_type',
                type: serverWidget.FieldType.SELECT,
                label: 'Payment Type',
                container: 'custpage_initial_data'
            });
            paymentType.isMandatory = true;
            addOptions(getPaymentTypes(), paymentType);

            var checkNumber = form.addField({
                id: 'custpage_check_number',
                type: serverWidget.FieldType.TEXT,
                label: 'Check Number',
                container: 'custpage_initial_data'
            });
            checkNumber.isMandatory = true;

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
                id: 'custpage_id',
                type: serverWidget.FieldType.TEXT,
                label: 'Internal Id'
            })
                .updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

            // sublist.addField({
            //     id: 'custpage_codigoempleado',
            //     type: serverWidget.FieldType.TEXT,
            //     label: 'Employee Code'
            // });

            sublist.addField({
                id: 'custpage_empleado',
                type: serverWidget.FieldType.TEXT,
                label: 'Employee Name'
            });


            sublist.addField({
                id: 'custpage_alfanumerico',
                type: serverWidget.FieldType.TEXT,
                label: 'Alfanumérico'
            });
            sublist.addField({
                id: 'custpage_monto',
                type: serverWidget.FieldType.TEXT,
                label: 'Monto'
            });

            // Perform a search to get the data
            var employeeCheckSearch = search.create({
                type: 'customrecord983',
                filters: [
                    ["custrecord160", "isempty", ""],
                    "AND",
                    ["custrecord161", "anyof", "@NONE@"],
                    "AND",
                    ["custrecord154", "isnotempty", ""],
                    "AND",
                    ["custrecord159", "isnotempty", ""],
                    "AND",
                    ["custrecord158", "isnotempty", ""]
                ],
                columns: [
                    search.createColumn({
                        name: "custrecord154",
                        summary: "GROUP",
                        label: "Empleado"
                    }),
                    search.createColumn({
                        name: "custrecord159",
                        summary: "GROUP",
                        label: "Consecutivo Alfanumérico"
                    }),
                    search.createColumn({
                        name: "custrecord158",
                        summary: "GROUP",
                        label: "crédito"
                    })
                ]
            });

            var results = employeeCheckSearch.run().getRange({
                start: 0,
                end: 1000 // Adjust as needed
            });

            // Populate the sublist with search results
            for (var i = 0; i < results.length; i++) {
                var result = results[i];
                log.debug('result', result)
                // sublist.setSublistValue({
                //     id: 'custpage_id',
                //     line: i,
                //     value: result.id
                // });
                // sublist.setSublistValue({
                //     id: 'custpage_codigoempleado',
                //     line: i,
                //     value: result.getValue('custrecord_ns_codigo_empleado')
                // });
                sublist.setSublistValue({
                    id: 'custpage_empleado',
                    line: i,
                    value: result.getValue({
                        name: "custrecord154",
                        summary: "GROUP",
                        label: "Empleado"
                    })
                });
                sublist.setSublistValue({
                    id: 'custpage_alfanumerico',
                    line: i,
                    value: result.getValue({
                        name: "custrecord159",
                        summary: "GROUP",
                        label: "Consecutivo Alfanumérico"
                    })
                });
                sublist.setSublistValue({
                    id: 'custpage_monto',
                    line: i,
                    value: result.getValue({
                        name: "custrecord158",
                        summary: "GROUP",
                        label: "crédito"
                    })
                });
            }

            // Add a button to print the selected records
            form.addSubmitButton({
                label: 'Print PDF'
            });

            context.response.writePage(form);
        } else if (context.request.method === 'POST') {
            // Handle the form submission and generate the PDF

            var accountNames = getAccounts(context.request.parameters.custpage_payment_type);
            log.debug('accountNames', accountNames);
            var checkNumber = context.request.parameters.custpage_check_number;

            var debitAccount = accountNames.debitAccount.match(/^(\d+)\s+(.*)$/);
            var creditAccount = accountNames.creditAccount.match(/^(\d+)\s+(.*)$/);

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

                        checkNumber: checkNumber,


                        empleado: context.request.getSublistValue({
                            group: 'custpage_employeechecks',
                            name: 'custpage_empleado',
                            line: i
                        }),
                        alfanumerico: context.request.getSublistValue({
                            group: 'custpage_employeechecks',
                            name: 'custpage_alfanumerico',
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
                        }), 'Quetzales')

                    });
                }
            }

            log.debug({
                title: 'selectedRecords',
                details: selectedRecords
            })

            if (selectedRecords.length > 0) {
                // Generate the PDF
                try {
                    var renderer = render.create();
                    renderer.templateContent = generateCheckXMLTemplate(selectedRecords);

                    var pdfFile = renderer.renderAsPdf();
                    pdfFile.name = 'EmployeeChecks.pdf';
                    context.response.writeFile(pdfFile, true);
                } catch (e) {
                    log.error("Error in", e)
                }

            } else {
                var form = serverWidget.createForm({
                    title: 'ERROR: NO RECORDS SELECTED'
                });
                form.addPageInitMessage({
                    title: 'No se eligió ningún empleado de la sublista.',
                    type: message.Type.ERROR,
                    message: 'Por favor, volver y escoger al menos un empleado para poder generar el documento PDF!',
                    // duration: 10000
                });
                context.response.writePage(form);
                // context.response.write('No records selected.');
            }
        }
    }

    const getLines = (empleado, alfanumerico) => {
        const results = [];

        try {
            const customrecord983SearchObj = search.create({
                type: "customrecord983",
                filters: [
                    ["custrecord154", "is", empleado],
                    "AND",
                    ["custrecord159", "is", alfanumerico]
                ],
                columns: [
                    search.createColumn({ name: "custrecord154", label: "Empleado" }),
                    search.createColumn({ name: "custrecord155", label: "Cuenta Contable" }),
                    search.createColumn({ name: "custrecord158", label: "crédito" }),
                    search.createColumn({ name: "custrecord156", label: "Débito" })
                ]
            });

            customrecord983SearchObj.run().each(result => {
                const cuentaContable = result.getText({ name: "custrecord155" }) || "";

                // Separar número de cuenta y nombre de cuenta
                const match = cuentaContable.match(/^(\d+)\s(.+)$/);
                log.debug({
                    title: 'match',
                    details: match
                })
                const cuentaNumero = match ? match[1] : "";
                const cuentaLetras = match ? match[2] : cuentaContable;
                results.push({
                    empleado: result.getValue({ name: "custrecord154" }),
                    cuentaNumero: cuentaNumero,
                    cuentaLetras: cuentaLetras,
                    credito: result.getValue({ name: "custrecord158" }),
                    debito: result.getValue({ name: "custrecord156" }),
                });

                return true; // Continue fetching results
            });

            log.debug("Search Results", results);
        } catch (e) {
            log.error("Error retrieving search results", e);
        }

        return results;
    };

    function generateCheckXMLTemplate(records) {
        //
        var xml = '<?xml version="1.0"?>';
        xml += '<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">'
        xml += '<pdf>';
        xml += '<body padding="0in 0.2in 0.1in 0in" >';

        var date = formatDate(new Date(), 4)

        records.forEach(function (record, index) {
            let lines = getLines(record.empleado, record.alfanumerico)
            log.debug({
                title: 'lines',
                details: lines
            })
            var monto = formatCurrency(record.monto)
            xml += '<table style="height: 5px; width: 100%"><tr><td></td></tr></table>'
            // xml += '<table>';
            // xml += '<tr><td><img src="https://6421207-sb1.app.netsuite.com/core/media/media.nl?id=926606&amp;c=6421207_SB1&amp;h=uKSSwGnqxQg1qtJVaeJZmvJXZP2LOKhIgS_FvoqO3RokFRuJ" style="width: 100%; position: fixed; height: 100%"/></td></tr>'
            // xml += '</table>';

            // xml += '<table>';
            // xml += '<tr><td><img src="https://6421207-sb1.app.netsuite.com/core/media/media.nl?id=926607&amp;c=6421207_SB1&amp;h=RviNweS86gbDbOhccKfzcHFPbESOvv8xC4-sEomFYHXJ_XxK" style="width: 100%; position: fixed; height: 100%"/></td></tr>'
            // xml += '</table>';

            xml += '<table border="0" cellpadding="1" cellspacing="1" style="width: 100%; margin-left: 0.30in; margin-top:53px; table-layout: fixed;">';
            xml += '<tr>';
            xml += '<td border="0" colspan="2" style="!important;  margin-left: 95px; padding-left: 20px; font-size: 14pt; font-family:Times New Roman, serif; font-weight:bold; word-wrap: break-word;">GUATEMALA, ' + date + ' **</td>';
            xml += '<td border="0" colspan="1" style="!important;  margin-left: 122px; font-size: 12pt; font-family:Times New Roman,serif; word-wrap: break-word; font-weight:bold;"> ' + monto + '</td>';
            xml += '</tr>';
            xml += '</table>';

            xml += '<table border="0" cellpadding="1" cellspacing="1" style="width: 100%; margin-left: 0.55in; margin-top:10.5px;">';
            xml += '<tr>';
            xml += '<td colspan="2" style="!important;  margin-left: 77px; font-size: 13pt; font-family:Times New Roman,serif; font-weight:bold;">**' + record.empleado + '**</td>';
            xml += '</tr>';
            xml += '</table>';

            xml += '<table border="0" cellpadding="1" cellspacing="1" style="width: 90%; margin-left: 0.45in; margin-top:0.1px;">';
            xml += '<tr>';
            xml += '<td colspan="2" style="!important;  margin-left: 77px; font-size: 10pt; font-family:Times New Roman, serif; font-weight:bold;">**' + record.letras + '**</td>';
            xml += '</tr>';
            xml += '</table>';
            //  "No negociable"
            xml += '<table border="0" cellpadding="1" cellspacing="1" style="width: 90%; margin-left: 0.01in; margin-top:15px;">';
            xml += '<tr>';
            xml += '<td colspan="2" style="!important;  margin-left: 77px; font-size: 10pt; font-family:Times New Roman, serif; font-weight:bold; ">NO NEGOCIABLE</td>';
            xml += '</tr>';
            xml += '</table>';
            xml += '<table border="0" style="width: 730px; margin-left: 0.55in; margin-top:146px; table-layout: fixed;  font-family:Times New Roman, serif;">';
            for (let i = 0; i < lines.length; i++) {

                if (lines[i].debito) {
                   
                    xml += '<tr>';
                    xml += '<td  border="0" style="width: 145px; font-size: 9.2pt; word-wrap: break-word; border-left: 12px solid white">' + lines[i].cuentaNumero + '</td>';
                    xml += '<td  border="0" style="width: 340px; font-size: 9.2pt; word-wrap: break-word;">' + lines[i].cuentaLetras + '</td>';
                    xml += '<td  border="0" style="width: 92px; font-size: 9.2pt; word-wrap: break-word; text-align: center">' + lines[i].debito + '</td>';
                    xml += '<td  border="0" style="width: 88px; font-size: 9.2pt; word-wrap: break-word;; text-align: center">' + '' + '</td>';
                    xml += '</tr>';
                } else if (lines[i].credito) {
                   // xml += '<table border="0" style="width: 730px; margin-left: 0.55in; margin-top:146px; table-layout: fixed;  font-family:Times New Roman, serif;">';
                    xml += '<tr>';
                    xml += '<td  border="0" style="width: 145px; font-size: 9.2pt; word-wrap: break-word; border-left: 12px solid white">' + lines[i].cuentaNumero + '</td>';
                    xml += '<td  border="0" style="width: 340px; font-size: 9.2pt; word-wrap: break-word;">' + lines[i].cuentaLetras + '</td>';
                    xml += '<td  border="0" style="width: 92px; font-size: 9.2pt; word-wrap: break-word; text-align: center">' + '' + '</td>';
                    xml += '<td  border="0" style="width: 88px; font-size: 9.2pt; word-wrap: break-word;; text-align: center">' + lines[i].credito + '</td>';
                    xml += '</tr>';
                }



                // xml += '<tr>';
                // xml += '<td  border="0" style="width: 145px; font-size: 9.2pt; word-wrap: break-word; border-left: 12px solid white">' + record.cuentaCredito.numero + '</td>';
                // xml += '<td  border="0" style="width: 340px; font-size:9.2pt; word-wrap: break-word;">' + record.cuentaCredito.nombre + '</td>';
                // xml += '<td  border="0" style="width: 92px; font-size: 9.2pt; word-wrap: break-word; text-align: center">' + '' + '</td>';
                // xml += '<td  border="0" style="width: 88px; font-size: 9.2pt; word-wrap: break-word; text-align: center">' + monto + '</td>';
                // xml += '</tr>';

            }
            xml += '</table>';

            // updateEmpCheckRecords({
            //     id: record.recordId,
            //     number: parseInt(record.checkNumber) + index,
            //     date: format.parse({ type: format.Type.DATE, value: new Date() }),
            // })

            if (index < records.length - 1) {
                xml += '<pbr />'; // Page break between checks
            }
        });

        xml += '</body>';
        xml += '</pdf>';

        return xml;
    }

    /**
     * Actualizar registros de Employee Check Payments
     * @param {Object} data información con Id de registro, fecha y número de cheque.
    */
    function updateEmpCheckRecords(data) {
        try {
            record.submitFields({
                type: 'customrecord_ns_employee_checks',
                id: data.id,
                values: {
                    custrecord_ns_correlativo_cheque: data.number,
                    custrecord_ns_fecha_generacion: data.date
                },
            })
        } catch (e) {
            log.error('Error in updateEmpCheckRecords', e);
        }
    }

    /**
     * Dar opciones a campos tipo Select.
     * @param {Array} options opciones a setear en el campo
     * @param {Object} field campo definido en el form.
    */
    function addOptions(options, field) {
        for (var i = 0; i < options.length; i++) {
            field.addSelectOption({ value: options[i].id, text: options[i].name });
        }
    }

    /**
     * LookupFields para recuperar nombre de cuentas según el tipo de pago escogido.
     * @param {String} paymentTypeId Id del registro de tipo de pago
     * @returns objeto con nombres de cuentas.
    */
    function getAccounts(paymentTypeId) {
        var accounts = search.lookupFields({
            type: 'customrecord_ns_check_accounts',
            id: paymentTypeId,
            columns: ['custrecord_ns_debit_account', 'custrecord_ns_credit_account'],
        });
        return {
            debitAccount: accounts["custrecord_ns_debit_account"][0].text,
            creditAccount: accounts["custrecord_ns_credit_account"][0].text,
        }
    }

    /**
     * Listado de tipos de pagos para opciones en el front.
     * @returns arreglo con información de tipos de pagos (id, name)
    */
    function getPaymentTypes() {
        try {
            var paymentTypes = [];

            search.create({
                type: 'customrecord_ns_check_accounts',
                filters: ['isinactive', 'is', false],
                columns: [
                    search.createColumn({ name: "custrecord_ns_payment_type", label: "Tipo de Pago" })
                ]
            }).run().each(function (result) {
                var paymentType = {};
                paymentType.id = result.getValue('custrecord_ns_payment_type');
                paymentType.name = result.getText('custrecord_ns_payment_type');
                paymentTypes.push(paymentType)
                return true
            });
            log.debug('paymentTypes', paymentTypes);
            return paymentTypes;
        } catch (e) {
            log.error('Error in getPaymentTypes', e);
        }
    }

    /**
     * Dar Formato deseado a fecha.
     * @param {Date} date fecha a formatear.
     * @param {Number} type tipado deseado (1-4)
     * @returns fecha con formato requerido.
     */
    function formatDate(date, type) {
        try {
            var finalDate = "";
            var parseDate = date;
            var year = parseDate.getFullYear();
            var month = parseDate.getMonth() + 1;
            var day = parseDate.getDate();

            if (month <= 9) {
                month = "0" + month;
            }
            if (day <= 9) {
                day = "0" + day;
            }

            switch (type) {
                case 1: // yyyy-MM-dd
                    finalDate = year + "-" + month + "-" + day;
                    break;
                case 2: // dd-MM-yyyy
                    finalDate = day + "-" + month + "-" + year;
                    break;
                case 3: // yyyy/MM/dd
                    finalDate = year + "/" + month + "/" + day;
                    break;
                case 4: // dd/MM/yyyy
                    finalDate = day + "/" + month + "/" + year;
                    break;
            }
            return finalDate;
        } catch (e) {
            log.error("Error in formatDate", e)
        }
    }

    function makeItCurrency(amount) {

        var myFormat = formati.getCurrencyFormatter({ currency: formati.Currency.USD });
        var newCur = myFormat.format({
            number: parseFloat(amount)
        });

        return newCur;
    }

    function formatCurrency(amount) {
        const partes = amount.split('.');
        const entero = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        const decimal = partes[1] ? '.' + partes[1] : '.00';
        return `${entero}${decimal}`;
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
            letrasMonedaPlural: pCurrency.plural || 'QUETZALES',
            letrasMonedaSingular: pCurrency.singular || 'QUETZAL',
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