/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/file', 'N/render', 'N/record'],
    (serverWidget, search, file, render, record) => {
        const onRequest = (context) => {
            if (context.request.method === 'GET') {
                const form = serverWidget.createForm({ title: 'Vendor Bill Report' });

                // Vendor filter
                const vendorField = form.addField({
                    id: 'custpage_vendor_filter',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Vendor',
                    source: 'vendor'
                });

                vendorField.isMandatory = false;

                // Add a Submit button
                form.addSubmitButton({ label: 'Filter' });

                // Add a Print button
                form.addButton({
                    id: 'custpage_print_pdf',
                    label: 'Print PDF',
                    functionName: 'printPdf'
                });

                // Add Client Script for handling Print button and filtering
                form.clientScriptFileId = 'YOUR_CLIENT_SCRIPT_FILE_ID'; // Replace with actual file ID

                // Fetch and display search results if vendor is selected
                const vendorId = context.request.parameters.custpage_vendor_filter || '';
                if (vendorId) {
                    const sublist = form.addSublist({
                        id: 'custpage_vendorbill_sublist',
                        type: serverWidget.SublistType.LIST,
                        label: 'Vendor Bills'
                    });

                    sublist.addField({
                        id: 'custpage_type',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Type'
                    });
                    sublist.addField({
                        id: 'custpage_name',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Name'
                    });
                    sublist.addField({
                        id: 'custpage_account',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Account'
                    });
                    sublist.addField({
                        id: 'custpage_amount',
                        type: serverWidget.FieldType.CURRENCY,
                        label: 'Amount'
                    });

                    // Run saved search and populate the sublist
                    const searchResults = getVendorBills(vendorId);
                    searchResults.forEach((result, index) => {
                        sublist.setSublistValue({
                            id: 'custpage_type',
                            line: index,
                            value: result.type
                        });
                        sublist.setSublistValue({
                            id: 'custpage_name',
                            line: index,
                            value: result.name
                        });
                        sublist.setSublistValue({
                            id: 'custpage_account',
                            line: index,
                            value: result.account
                        });
                        sublist.setSublistValue({
                            id: 'custpage_amount',
                            line: index,
                            value: result.amount
                        });
                    });
                }

                context.response.writePage(form);
            } else if (context.request.method === 'POST') {
                // Handle PDF generation
                const pdfFile = generatePdf(context.request.parameters);
                context.response.writeFile(pdfFile);
            }
        };

        const getVendorBills = (vendorId) => {
            const results = [];
            const vendorBillSearch = search.create({
                type: 'vendorbill',
                filters: [
                    ['type', 'anyof', 'VendBill'],
                    'AND',
                    ['vendor.internalid', 'anyof', vendorId]
                ],
                columns: [
                    { name: 'type', summary: 'GROUP' },
                    { name: 'entity', summary: 'GROUP' },
                    { name: 'account', summary: 'GROUP' },
                    { name: 'amount', summary: 'SUM' }
                ]
            });

            vendorBillSearch.run().each((result) => {
                results.push({
                    type: result.getValue({ name: 'type', summary: 'GROUP' }),
                    name: result.getText({ name: 'entity', summary: 'GROUP' }),
                    account: result.getText({ name: 'account', summary: 'GROUP' }),
                    amount: result.getValue({ name: 'amount', summary: 'SUM' })
                });
                return true;
            });
            return results;
        };

        const generatePdf = (params) => {
            const renderer = render.create();
            renderer.templateContent = `
                <html>
                <body>
                    <h1>Vendor Bill Report</h1>
                    <table border="1">
                        <tr>
                            <th>Type</th>
                            <th>Name</th>
                            <th>Account</th>
                            <th>Amount</th>
                        </tr>
                        {{#each results}}
                        <tr>
                            <td>{{type}}</td>
                            <td>{{name}}</td>
                            <td>{{account}}</td>
                            <td>{{amount}}</td>
                        </tr>
                        {{/each}}
                    </table>
                </body>
                </html>`;
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'results',
                data: getVendorBills(params.custpage_vendor_filter)
            });

            return renderer.renderAsPdf();
        };

        return { onRequest };
    });
