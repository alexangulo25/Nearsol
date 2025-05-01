/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/record', 'N/render', 'N/config'], function (serverWidget, search, record, render, config) {
    function onRequest(context) {
        var form = serverWidget.createForm({ title: 'Vendor Bill Report' });

        form.addField({
            id: 'custpage_vendor_name',
            type: serverWidget.FieldType.TEXT,
            label: 'Vendor Name'
        }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

        var vendorField = form.addField({
            id: 'custpage_vendor',
            type: serverWidget.FieldType.SELECT,
            label: 'Vendor',
            source: 'vendor'
        });

        var startDateField = form.addField({
            id: 'custpage_startdate',
            type: serverWidget.FieldType.DATE,
            label: 'Start Date'
        });

        var endDateField = form.addField({
            id: 'custpage_enddate',
            type: serverWidget.FieldType.DATE,
            label: 'End Date'
        });

        var hiddenVendorField = form.addField({
            id: 'custpage_hidden_vendor',
            type: serverWidget.FieldType.TEXT,
            label: 'Hidden Vendor'
        }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

        var hiddenStartDateField = form.addField({
            id: 'custpage_hidden_startdate',
            type: serverWidget.FieldType.TEXT,
            label: 'Hidden Start Date'
        }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

        var hiddenEndDateField = form.addField({
            id: 'custpage_hidden_enddate',
            type: serverWidget.FieldType.TEXT,
            label: 'Hidden End Date'
        }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

        form.addSubmitButton({ label: 'Search' });

        if (context.request.method === 'POST') {
            var vendor = context.request.parameters.custpage_vendor;
            var startDate = context.request.parameters.custpage_startdate || '01/01/1970';
            var endDate = context.request.parameters.custpage_enddate || formatDate(new Date());

            hiddenVendorField.defaultValue = vendor;
            hiddenStartDateField.defaultValue = startDate;
            hiddenEndDateField.defaultValue = endDate;

            var filters = [];

            filters.push(["subsidiary", "anyof", "10"]);
            if (vendor) {
                filters.push('AND');
                filters.push(["vendor.internalid", "anyof", vendor]);
            }
            if (startDate) {
                if (filters.length > 0) {
                    filters.push('AND');
                }
                filters.push(['trandate', 'onorafter', startDate]);
            }
            if (endDate) {
                if (filters.length > 0) {
                    filters.push('AND');
                }
                filters.push(['trandate', 'onorbefore', endDate]);
            }



            var searchObj = search.create({
                type: search.Type.VENDOR_BILL,
                filters: filters,
                columns: [
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
                    })
                ]
            });

            var searchResults = searchObj.run().getRange({ start: 0, end: 1000 });

            var sublist = form.addSublist({
                id: 'custpage_sublist',
                type: serverWidget.SublistType.LIST,
                label: 'Results'
            });

            sublist.addField({ id: 'custpage_type', type: serverWidget.FieldType.TEXT, label: 'Type' });
            sublist.addField({ id: 'custpage_name', type: serverWidget.FieldType.TEXT, label: 'Name' });
            sublist.addField({ id: 'custpage_account', type: serverWidget.FieldType.TEXT, label: 'Account' });
            sublist.addField({ id: 'custpage_amount', type: serverWidget.FieldType.CURRENCY, label: 'Amount' });

            var vendorData = {};
            var lineIndex = 0;

            for (var i = 0; i < searchResults.length; i++) {
                var result = searchResults[i];
                var account = result.getText({
                    name: "account",
                    summary: "GROUP",
                    label: "Account"
                });
                var amount = parseFloat(result.getValue({
                    name: "fxamount",
                    summary: "SUM",
                    label: "Amount (Foreign Currency)"
                }));
                var entityName = result.getValue({
                    name: "companyname",
                    join: "vendor",
                    summary: "GROUP",
                    label: "Company Name"
                });
                var vendorId = result.getValue({
                    name: "internalid",
                    join: "vendor",
                    summary: "GROUP",
                    label: "Internal ID"
                });
                var vendorNit = result.getValue({
                    name: "vatregnumber",
                    join: "vendor",
                    summary: "GROUP",
                    label: "Tax Number"
                });

                if ((account.indexOf('witholding') !== -1 || /^15/.test(account) || /^5/.test(account) || /^6/.test(account)) && amount !== 0 && entityName) {
    if (!vendorData[vendorId]) {
        vendorData[vendorId] = {
            vendorId: vendorId,
            vendorName: entityName,
            vendorNit: vendorNit,
            lines: []
        };
    }
                    vendorData[vendorId].lines.push({
                        type: result.getValue('type'),
                        account: account,
                        amount: amount
                    });

                    if (result.getValue('type')) {
                        sublist.setSublistValue({ id: 'custpage_type', line: lineIndex, value: result.getValue('type') });
                    }
                    if (entityName) {
                        sublist.setSublistValue({ id: 'custpage_name', line: lineIndex, value: entityName });
                    }
                    if (account) {
                        sublist.setSublistValue({ id: 'custpage_account', line: lineIndex, value: account });
                    }
                    if (!isNaN(amount)) {
                        sublist.setSublistValue({ id: 'custpage_amount', line: lineIndex, value: amount.toFixed(2) });
                    }
                    lineIndex++;
                }
            }

            form.addButton({
                id: 'custpage_generate_pdf',
                label: 'Generate PDF',
                functionName: 'generatePDF'
            });

            form.addButton({
                id: 'custpage_generate_multiple_pdfs',
                label: 'Generate PDFs for All Vendors',
                functionName: 'generateMultiplePDFs'
            });

            form.clientScriptModulePath = './clienteBusquedaPrueba.js';

            form.addField({
                id: 'custpage_vendor_data',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'Vendor Data'
            }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN }).defaultValue = JSON.stringify(vendorData);

            var companyConfig = config.load({
                type: config.Type.COMPANY_INFORMATION
            });

            var retainerInfo = {
                companyName: companyConfig.getValue({ fieldId: 'companyname' }),
                companyNit: companyConfig.getValue({ fieldId: 'employerid' }),
                companyAddress: companyConfig.getValue({ fieldId: 'mainaddress_text' }),
                vendorData: vendorData
            };

            form.addField({
                id: 'custpage_retainer_info',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'Retainer Info'
            }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN }).defaultValue = JSON.stringify(retainerInfo);
        }

        context.response.writePage(form);
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

    return {
        onRequest: onRequest
    };
});