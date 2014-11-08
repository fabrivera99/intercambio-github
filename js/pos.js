
function showdepositform()
{
    GetGPS_ProcessDeposit();
    $.mobile.changePage("#deposit_page", {
        transition: "none",
        reverse: true,
        changeHash: true,
        showLoadMsg: false
    });
    $("#txtDepositAmount").focus();
}

function PopulateBankAccounts()
{

    SONDA_DB_Session.transaction(
            function (tx)
            {
                var pDoc = '';
                var pImg = '';


                tx.executeSql('SELECT * FROM BANK_ACCOUNTS', [],
                    function (tx, results)
                    {

                        var xskus_len = (results.rows.length - 1);
                        gBankAccounts = [];
                        for (i = 0; i <= xskus_len; i++)
                        {
                            gBankAccounts.push(
                                {
                                    text: results.rows.item(i).ACCOUNT_NAME,
                                    value: results.rows.item(i).ACCOUNT_NUMBER,
                                    bank: results.rows.item(i).BANK
                                }
                            );
                        }
                        // Put the object into storage
                        localStorage.setItem('gBankAccounts', JSON.stringify(gBankAccounts));

                        my_dialog("", "", "close");
                    },
                    function (err)
                    {
                        my_dialog("", "", "close");
                        if (err.code !== 0)
                        {
                            alert("(POS.0)Error processing SQL: " + err.code);
                        }
                    }
                );
            },
            function (err)
            {
                notify("ERROR, " + err.code);

                if (err.code !== 0)
                {
                    alert("(POS.1)Error processing SQL: " + err.code);
                }
            }
        );    
        my_dialog("", "", "close");

}
function UploadPhoto(pID)
{
    
    var pPrimaryServerURL = baseURL+ "SONDA_POS_IMAGE.aspx";
    var pimageURI="";

    try
    {

        pimageURI = $("#btnTakePic" + pID).attr('srcpic');
        

        if(pimageURI.length>=1)
        {
            
            var options = new FileUploadOptions();
            options.fileKey     =   "file";
            options.fileName    =   pimageURI.substr(pimageURI.lastIndexOf('/')+1);
            options.mimeType    =   "image/jpeg";
            options.chunkedMode =   true;
    
            var query_str       =   pPrimaryServerURL;
                    
            var params          =   {};
            params.pINVOICE_NUM =   gInvoiceNUM;
            params.pID          =   pID;
                
            options.params      =   params;
    
            var ft = new FileTransfer();

            ft.upload(pimageURI, encodeURI(query_str),
                function UploadSuccess(r)
                {
                    $("#btnTakePic" + pID).attr('srcpic', '');
                    my_dialog("", "", "close");
                },
                function UploadFail(error)
                {
                    $("#btnTakePic" + pID).attr('srcpic', '');
                    my_dialog("", "", "close");
                    notify("An error has occurred: Code = " + error.code+ " SOURCE= "+error.source+ " TARGET="+error.target);
                },
                options
           );    
        }

    }catch(e)
    {
        notify(e.message);
    }

        
} 

function UploadPhotoDeposit(pTRANS_ID, pimageURI)
{
    
    var pPrimaryServerURL = baseURL+ "SONDA_DEPOSIT_IMAGE.aspx";
    
    //my_dialog("Imagenes","Procesando...","open");
    
    var options = new FileUploadOptions();
    options.fileKey     =   "file";
    options.fileName    =   pimageURI.substr(pimageURI.lastIndexOf('/')+1);
    options.mimeType    =   "image/jpeg";
    options.chunkedMode =   true;
                        
    var query_str       =   pPrimaryServerURL;
                
    var params          = {};
    params.pTRANS_ID = pTRANS_ID;
    
                
    options.params      = params;
    

    var ft = new FileTransfer();
    ft.upload(pimageURI, encodeURI(query_str), 
        function UploadSuccess(r)
        {
          //notify('uploaded');  
        }, 
        function UploadFail(error)
        {
            notify("An error has occurred: Code = " + error.code+ " SOURCE= "+error.source+ " TARGET="+error.target);
        }, 
        options
   );
        
} 

function take_picture_deposit()
{
    navigator.camera.getPicture
    (
        function (imageURI)
        {
            $("#btnTakePicDepositBank").attr('srcpic', imageURI);
            $('#btnTakePicDepositBank').buttonMarkup({ icon: "check" });

            gImageURI_Deposit = imageURI;
            $("#btnMakeDepositBank").css("visibility", "visible");
            
            
        },
        function (message)
        {
            //notify("ERROR," + message);
        },
        {

            quality: 80,
            targetWidth: 500,
            targetHeight: 500,
            saveToPhotoAlbum: false,
            sourceType: navigator.camera.PictureSourceType.CAMERA,
            correctOrientation: false,
            destinationType: Camera.DestinationType.FILE_URI

        }
    );
}

function PostDeposit(pAccountNumber, pAmount, pUpdate)
{
    try
    {
        if(pUpdate==1)
        {
            localStorage.setItem('POS_TOTAL_DEPOSITED', (Number(gTotalDeposited) + Number(pAmount)));
            localStorage.setItem('POS_TOTAL_DEPOSITS_PROC', Number(pCurrentDepositID));

            $("#lblTotalDeposits").text(pCurrentDepositID);
            $("#lblTotalDeposited ").text('Q ' + format_number(gTotalDeposited, 2));
        
            gTotalDeposited = localStorage.getItem('POS_TOTAL_DEPOSITED');
            SetNextDepositID();
        }
        
        if(gIsOnline==1)
        {
            socket.emit('post_deposit', { 'accountid': pAccountNumber, 'gps': gCurrentGPS, 'amount': pAmount, 'routeid': gCurrentRoute, 'processdate': getDateTime(), 'loginid': gLastLogin, 'transid': pCurrentDepositID });            
        }else
        {
            if(pUpdate==1)
            {
                $.mobile.changePage("#menu_page", {
                    transition: "none",
                    reverse: false,
                    showLoadMsg: false
                });    
            }
                
        }
        
    } catch (e) { notify(e.message); }
}

function PostDepositOffline(pAccountNumber, pAmount, pTransID)
{
    try
    {
        var emitdata={ 
                'accountid': pAccountNumber, 
                'gps': gCurrentGPS, 
                'amount': pAmount, 
                'routeid': gCurrentRoute, 
                'processdate': getDateTime(), 
                'loginid': gLastLogin, 
                'transid': pTransID 
             };
        
        socket.emit('post_deposit_offline', emitdata);            
    } catch (e) { notify(e.message); }
}

function onSuccessGPS_Deposit(position)
{
    try
    {
        gGPSPositionIsAvailable = true;
        gCurrentGPS = position.coords.latitude + ',' + position.coords.longitude
        my_dialog("", "", "close");
        
    } catch (e) { alert('error on getting gps:' + err.message); }
        
}

function onErrorGPS_Deposit(error){
        my_dialog("","","close");
        gGPSPositionIsAvailable = false;
        gMyCurrentGPS= "0,0"
        ToastThis('GPS position Is unreachable.');
        //window.plugins.statusBarNotification.notify("Sonda:GPS disabled", "GPS position Is unreachable.");
    }

function GetGPS_ProcessDeposit()
{
    //ProcessDeposit();
    navigator.geolocation.getCurrentPosition(onSuccessGPS_Deposit, onErrorGPS_Deposit, {timeout:10000, enableHighAccuracy:true});
}
function ProcessDeposit()
{
    var pAccountNumber = gSelectedAccount;
    
    var pAmount = new Number;
    try
    {
        
        pAmount = parseFloat($("#txtDepositAmount").val());

        if(!isNaN(pAmount) && Number(pAmount)>=10)
        {
            //my_dialog("Procesando Deposito", "Espere...", "open");

            SONDA_DB_Session.transaction(
                function (tx)
                {

                    GetNextDepositID();
                    pSQL = "INSERT INTO DEPOSITS(TRANS_ID, TRANS_TYPE, TRANS_DATETIME, BANK_ID, ACCOUNT_NUM, AMOUNT, GPS_URL, IS_POSTED, IMG1) ";
                    pSQL += "VALUES(" + pCurrentDepositID + ",'BANK_DEPOSIT','" + getDateTime() + "','" + gBankName + "','";
                    pSQL += pAccountNumber + "'," + pAmount + ",'" + gCurrentGPS + "', 0, '"+ gImageURI_Deposit+"')";
                    tx.executeSql(pSQL);

                },
                function (tx, err) { my_dialog("", "", "close"); notify(err); },
                function ()
                {
                
                    PostDeposit(pAccountNumber, pAmount, 1);

                }
            );
            //my_dialog("", "", "close");    
        }else
        {
            notify("ERROR, Debe Ingresar un monto valido");
        }

        
        
    }
    catch(e)
    {
        notify(e.message);
    }
}

function GetBankAccounts()
{
    try
    {
        socket.emit('getbankaccounts', {'routeid': gCurrentRoute});
        my_dialog("", "", "close");
    
    }catch(e)
    {
        notify(e.message);
        my_dialog("", "", "close");
    }
}
function GetNextInvoiceID()
{
    try
    {
        var pInvID =  new Number;
		var pInvoice_Until = new Number;
		
		pInvoice_Until = parseInt(localStorage.getItem('POS_SAT_RES_DOC_FINISH'));   
		
        pInvID = 0;
        pInvID = parseInt(localStorage.getItem('POS_CURRENT_INVOICE_ID'))+1;
		
		if(pInvID <= pInvoice_Until){
			//check if user needs to be alerted about % of left invoices
			//ojo
			
			return pInvID;
		}else{
			return -1;
		}
    }catch(e)
    {
        console.log("GetNextInvoiceID.catch: "+e.message);
        return 0;
    }
    
}

function GetNextDepositID()
{
    pCurrentDepositID = localStorage.getItem('POS_TOTAL_DEPOSITS_PROC');
    pCurrentDepositID++;

}

function SetNextDepositID()
{
    
    localStorage.setItem('POS_TOTAL_DEPOSITS_PROC', Number(pCurrentDepositID));
}

function initlocalstorage()
{
    
    localStorage.setItem('POS_STATUS', 'CLOSED');   
    localStorage.setItem('POS_LAST_LOGIN_ID', '');  
    localStorage.setItem('POS_CURRENT_ROUTE', '');  
    localStorage.setItem('POS_CURRENT_INVOICE_ID', Number(0));  
    
    localStorage.setItem('POS_TOTAL_DEPOSITED', 0);
    localStorage.setItem('POS_TOTAL_INVOICED', 0);
    localStorage.setItem('POS_TOTAL_INVOICES_PROC',0);
    localStorage.setItem('POS_CURRENT_CREDIT_NOTE', 0);

    localStorage.setItem('POS_SAT_RES_DOC_START', 0);
    localStorage.setItem('POS_SAT_RES_DOC_FINISH', 0);
    localStorage.setItem('POS_SAT_RES_DATE','');

    localStorage.setItem('POS_SAT_RES_DOC_START_NOTES', 0);
    localStorage.setItem('POS_SAT_RES_DOC_FINISH_NOTES', 0);
    localStorage.setItem('POS_SAT_RES_DATE_NOTES','');


    localStorage.setItem('POS_CURRENT_DEPOSIT_ID', 0);
    localStorage.setItem('POS_CURRENT_DEPOSIT_ID', '');
    localStorage.setItem('POS_ITEM_SEQ', Number(0));
    localStorage.setItem('POS_TOTAL_DEPOSITS_PROC',Number(0));
    localStorage.setItem('PRINTER_ADDRESS', "0");

    pCreditNoteID = new Number();
    gTotalDeposited = new Number();
    gInvocingTotal = new Number();
    gTotalInvoiced = new Number();
    gTotalInvoicesProc = new Number();
    gPrintAddress = "0";
    gTotalInvoicesProc = 0;
    gTotalDepositsProc = 0
    gLastLogin = 'CLOSED';

}

function ShowDepositsListPage()
{
    $.mobile.changePage("#deposit_list_page", {
        transition: "slide",
        reverse: true,
        changeHash: true,
        showLoadMsg: false
    });
    listalldeposits();
}

function listalldeposits()
{
    
    try
    {

        //my_dialog("Cargando Depositos", "Espere...", "open");
        SONDA_DB_Session.transaction(
            function (tx)
            {
                var vLI = '';
                tx.executeSql('SELECT * FROM DEPOSITS WHERE BANK_ID <> "?"', [],
                    function (tx, results)
                    {
                        $('#depositslist_listview').children().remove('li');

                        for (i = 0; i <= (results.rows.length - 1); i++)
                        {

                            //var xonclick = 'viewdepositpicture(' + results.rows.item(i).TRANS_ID + ');'
                            //DEPOSITS(TRANS_ID, TRANS_TYPE, TRANS_DATETIME, BANK_ID, ACCOUNT_NUM, AMOUNT, GPS_URL)
                            var pIS_POSTED = results.rows.item(i).IS_POSTED;
                            var xmsg;
                            if (results.rows.item(i).IS_POSTED == 1)
                            {
                                
                                xmsg = "<img src='css/styles/images/icons-png/check-black.png'></img>";
                            }
                            else
                            {
                                xmsg = "<img src='css/styles/images/icons-png/forbidden-black.png'></img>";
                            }

                            
                            vLI = '';
                            vLI = '<li class="ui-nodisc-icon ui-btn ui-shadow">'
                            vLI += '<p><span class="title">'+ results.rows.item(i).BANK_ID +'</span></p>'
                            vLI += '<p><span class="medium">'+xmsg+' '+ results.rows.item(i).ACCOUNT_NUM+'</span></p>'
                            vLI += '<p><span class="medium">'+ results.rows.item(i).TRANS_DATETIME+'</span></p>'
                            vLI += '<p class="ui-li-aside medium">#'+ results.rows.item(i).TRANS_ID+'</p>'
                            vLI += '<p><span class="small-roboto ui-li-count">Q '+ format_number(results.rows.item(i).AMOUNT,2); +'</span></p>'
                            vLI += '</li>'
                            vLI += ''

                            //vLI = '<li><a href="#">test prg</a></li>'
                            //console.log(vLI);
                            try
                            {
                                $("#depositslist_listview").append(vLI).trigger('create');
                            } catch (e) { console.log('? ' + e.message); }
                        }
                        $("#depositslist_listview").listview('refresh');
                        my_dialog("", "", "close");
                    },
                    function (err)
                    {
                        if (err.code !== 0)
                        {
                            alert("(POS.2)Error processing SQL: " + err.code);
                        }
                    }
                );
            },
            function (err)
            {
                if (err.code !== 0)
                {
                    alert("(POS.3)Error processing SQL: " + err.code);
                }
            }
        );   

        my_dialog("", "", "close");

    } catch (e) { console.log('show invoices cath: '+ e.message); }
}

function GetRouteAuth(docType)
{
    var pRoute = $("#lblCurrentLoggedRoute").text();
    
    try
    {
        socket.emit('getauthinfo', {'routeid': pRoute, 'doctype': docType});
    }catch(e)
    {
        console.log(e.message);    
    }

}

function startpos()
{
	
	 $.mobile.changePage("#dialog_startpos", {
			transition: "none",
			reverse: true,
			changeHash: true,
			showLoadMsg: false
	});  
}
function start_invoicing()
{
        
    $.mobile.changePage("#pos_client_page", {
            transition: "none",
            reverse: true,
            changeHash: true,
            showLoadMsg: false
    });        
}
function pos_sku_swipeHandler(event)
{
    try{
		if (event.type === "swipeleft") {
			event.preventDefault();

			var pID = $(this).attr('id');
			var pSKU = pID.substring(4, pID.length);
			var pLINE_SEQ = $(this).attr('LineSeq');
			var pSERIE = $(this).attr('SkuSerie');
			
			try
			{
				navigator.notification.confirm(
					"Confirma remover de la lista al SKU " + pSKU + "?",  // message
					function (buttonIndex)
					{
						if (buttonIndex == 2)
						{
							RemoveSKU(pSKU, pLINE_SEQ, pSERIE); 
						}
					},   // callback to invoke with index of button pressed
					'Sonda® POS ' + device.cordova,   // title
					'No,Si'    // buttonLabels
				);
			 
			}
			catch(e){alert(e.message)}
			
		}
	}catch(e){
		alert("sku_swipe:"+e.message);
	}
}
function PopulateInvoiceSKUsList()
{
    try
    {
        //my_dialog("SKUs", "Espere...", "open");
        gInvocingTotal = 0;
        $("#lblTotalSKU").text("0.00");
            
        $('#pos_skus_page_listview').children().remove('li');
        SONDA_DB_Session.transaction(
            function (tx)
            {
                var pDoc = '';
                var pImg = '';
                var pSql = 'SELECT A.SKU, A.PRICE, B.SKU_NAME, A.QTY, A.TOTAL_LINE, A.REQUERIES_SERIE, A.LINE_SEQ, '
                pSql += ' B.IS_KIT, A.SERIE, A.SERIE_2, B.PARENT_SKU FROM INVOICE_DETAIL A, ';
                pSql += ' SKUS B WHERE A.INVOICE_NUM = -9999 AND B.EXPOSURE = 1 AND A.SKU = B.SKU AND A.COMBO_REFERENCE = B.PARENT_SKU';
                //console.log(pSql);

                tx.executeSql(pSql, [],
                    function (tx, results)
                    {
                        if (results.rows.length <= 0)
                        {
                            //notify("Combo No tiene SKU principal definido, o no hay inventario disponible.");
                            return 0;
                        } else
                        {
                            for (i = 0; i <= (results.rows.length - 1); i++)
                            {
                                try
                                {
                                    var pSKU = results.rows.item(i).SKU;
                                    var pPRICE = results.rows.item(i).PRICE;
                                    var pSKU_Name = results.rows.item(i).SKU_NAME;
                                    var pQTY = results.rows.item(i).QTY;
                                    //var pTOTAL_LINE = results.rows.item(i).TOTAL_LINE;
                                    var pTOTAL_LINE = (pQTY * pPRICE);
                                    var pREQUERIES_SERIE = results.rows.item(i).REQUERIES_SERIE;
                                    var pSERIE = results.rows.item(i).SERIE;
                                    var pSERIE_2 = results.rows.item(i).SERIE_2;
                                    var pIS_KIT = results.rows.item(i).IS_KIT;
                                    var pLINE_SEQ = results.rows.item(i).LINE_SEQ;
                                    var pPARENT_SKU = results.rows.item(i).PARENT_SKU;

                                    var xmsg = '';

                                    vLI = '<li LineSeq="' + pLINE_SEQ + '" SkuSerie="' + pSERIE + '" id="SKU_' + pSKU + '" data-filtertext="' + pSKU + ' ' + pSKU_Name + '">'
                                    var onSKUClick = "";

                                    if (pREQUERIES_SERIE == 1)
                                    {
                                        onSKUClick = 'SetSKUSeries(' + "'" + pSKU + "','" + pSKU_Name + "'" + ',' + pLINE_SEQ + ');'
                                        vLI = vLI + '<a class="ui-alt-icon ui-shadow ui-nodisc-icon" href="#" onclick="' + onSKUClick + '">';

                                    } else
                                    {

                                        onSKUClick = 'SetSKUCant(' + "'" + pSKU + "','" + pSKU_Name + "'" + ',' + pLINE_SEQ + ');'
                                        vLI = vLI + '<a class="ui-alt-icon ui-shadow ui-nodisc-icon" href="#" onclick="' + onSKUClick + '">';
                                    }
                                    vLI = vLI + '<span class="small-roboto">' + pSKU_Name + '</span>'
                                    vLI = vLI + '<p><span id="SKU_QTY_' + pSKU + '" class="small-roboto">Cant.: ' + pQTY + ' Pre.: Q' + format_number(pPRICE, 2) + '</span></p>'
                                    //vLI = vLI + '<p><span class="small-roboto">Total: Q' + format_number(pTOTAL_LINE, 2) + '</span></p>'

                                    if (pREQUERIES_SERIE == 1)
                                    {
                                        if (pSERIE == 0)
                                        {
                                            vLI = vLI + '<span style="color:red" class="small-roboto">Se requiere info. adicional</span>'
                                        } else
                                        {
                                            vLI = vLI + '<span style="color:blue" class="small-roboto">SN:' + pSERIE + ' IM:' + pSERIE_2 + '</span>'
                                        }
                                    }

                                    vLI = vLI + '<span class="small-roboto ui-li-count">Q' + format_number(pPRICE, 2) + '</span></a>'
                                    //AddSKU(pSKU, pSKU_Name, pSKU_PARENT)
                                    var xonclick2 = 'AddSKU(' + "'" + pSKU + "','" + pSKU_Name + "', '" + pPARENT_SKU + "'" + ');'

                                    vLI = vLI + '<a href="#" onclick="' + xonclick2 + '" class="ui-nodisc-icon ui-alt-icon ui-icon-plus" data-theme="plus"></a></li>'


                                    gInvocingTotal = gInvocingTotal + pTOTAL_LINE

                                    //console.log(vLI);

                                    $("#pos_skus_page_listview").append(vLI);

                                    $("#lblTotalSKU").text(format_number(gInvocingTotal, 2));

                                } catch (e) { my_dialog("", "", "close"); console.log("ERROR, " + e.message); }
                            }

                        }
                        $("#pos_skus_page_listview").listview('refresh');
                        my_dialog("", "", "close");

                    },
                    function (err)
                    {
                        console.log("aqui el error: " + err.message);

                        my_dialog("", "", "close");
                        if (err.code !== 0)
                        {
                            alert("10.20.50.90, Error processing SQL: " + err);
                        }
                    }
                );

                my_dialog("", "", "close");
            },
            function (err)
            {
                console.log("aqui el error: " + err.message);

                my_dialog("", "", "close");
                if (err.code !== 0)
                {
                    alert("(POS.4)Error processing SQL: " + err);
                }
            }
        );    
        my_dialog("", "", "close");
     } catch (e) { my_dialog("", "", "close"); notify(e.message); console.log(e.message); }
     my_dialog("", "", "close");

}
    

function RemoveSKU(pSKU, pLINE_SEQ, pSerie)
{
    try
    {

        SONDA_DB_Session.transaction(
            function (tx)
            {
                var pSQL = "DELETE FROM INVOICE_DETAIL WHERE INVOICE_NUM = -9999 AND LINE_SEQ = " + pLINE_SEQ;

                tx.executeSql(pSQL);

                var pSQL1 = 'UPDATE SKU_SERIES SET STATUS = 0 WHERE SKU = "' + pSKU + '" AND SERIE = "' + pSerie + '"'
                console.log(pSQL1);
                tx.executeSql(pSQL1);

                var pCurrentSEQ = Number(localStorage.getItem('POS_ITEM_SEQ'));
                localStorage.setItem('POS_ITEM_SEQ', Number(pCurrentSEQ)-1);


            },
            function (err) { notify(err); console.log(err); },
            function () { PopulateInvoiceSKUsList(); my_dialog("", "", "close"); }
        )
        
        
    } catch (e) {notify(e.message); console.log(e.message)}
}

function PopulateAndShowSKUPanel()
{
        
        PopulateSKUGrid();
        
        $.mobile.changePage("#skus_list_page", {
                transition: "none",
                reverse: true,
                changeHash: true,
                showLoadMsg: false
        });

        //var myPanel = $.mobile.activePage.children('[data-role="panel"]');
        //myPanel.panel("toggle");
        //recognizeSpeech()
}

function pos_skus_swipeHandler(event)
{
	 
    if (event.type === "swiperight") {
        PopulateAndShowSKUPanel();
    } else if (event.type === "swipeleft") {
        $.mobile.changePage("#pos_client_page", {
                transition: "none",
                reverse: true,
                changeHash: true,
                showLoadMsg: false
        });
    }
}

function ProceedToVoid()
{
    PopulateVoidReasons();
    $.mobile.changePage("#void_invoice_page", {
        transition: "none",
        reverse: true,
        changeHash: true,
        showLoadMsg: false
    });
    var pClientName = $("#invoice_actions_custname").text();
    $("#lblvoid_invoiceid").text("Factura # " + pInvoiceID);
    $("#lblvoid_clientname").text(pClientName);
}

function showvoidinvoice(pInvoiceID)
{
     var pLeftAuthNotes = new Number();
    pLeftAuthNotes  = 0;
    
    pCreditNoteID = localStorage.getItem('POS_CURRENT_CREDIT_NOTE'); //POS_CURRENT_INVOICE_ID
    
    pLeftAuthNotes = Number(pCurrentSAT_Res_DocFinish_notes) - Number(pCreditNoteID);
    switch(pLeftAuthNotes)
    {
        case 0:
            notify("ERROR, No se puede anular la factura, puesto que no hay notas de credito autorizadas. \nContacte a su administrador de Sonda.");
            break;
        case 1:
            notify("ATENCION, Esta es la ultima anulacion que se puede realizar, (notas de credito autorizadas). \nContacte a su administrador de Sonda.");
            break;
        default:
            ProceedToVoid();
            break;
    }
    
}

function PostVoidedInvoice(pInvoiceID, pNoteID, pVoidReason, pVoidNotes)
{
    try
    {
	//ojo
		var pAuth = localStorage.getItem('POS_SAT_RESOLUTION_NOTES');
		var pSerie = localStorage.getItem('POS_SAT_RES_SERIE_NOTES');
			
		console.log(pAuth+ ' ' +pSerie);
        socket.emit('void_invoice', { 'invoiceid': pInvoiceID, 'noteid': pNoteID, 'reasonid': pVoidReason, 'authid': pAuth, 'serie': pSerie});
		
    }catch(e)
    {
        console.log(e.message);
    }
}

function DuplicateInvoiceDetail_Void(pInvoiceID, pVoidReason, pVoidNotes)
{
    pSQL = "SELECT * FROM INVOICE_DETAIL WHERE INVOICE_NUM = " + pInvoiceID;
    console.log(pSQL);

    SONDA_DB_Session.transaction(
    function (tx)
    {
        tx.executeSql(pSQL, [],
            function (tx, results)
            {
                for (i = 0; i <= (results.rows.length - 1); i++)
                {
                    pSQL = 'INSERT INTO INVOICE_DETAIL(INVOICE_NUM, SKU, SKU_NAME, QTY, PRICE, DISCOUNT, TOTAL_LINE, REQUERIES_SERIE, SERIE, SERIE_2, LINE_SEQ, COMBO_REFERENCE, PARENT_SEQ, EXPOSURE, PHONE) '
                    pSQL += " VALUES(" + pCurrentNoteID + ",'" + results.rows.item(i).SKU + "','" + results.rows.item(i).SKU_NAME + "', " + results.rows.item(i).QTY
                    pSQL += "," + results.rows.item(i).PRICE + ", 0, " + results.rows.item(i).PRICE + ",1," + results.rows.item(i).SERIE + ",0," + results.rows.item(i).LINE_SEQ
                    pSQL += ",'" + results.rows.item(i).COMBO_REFERENCE + "'," + results.rows.item(i).PARENT_SEQ + "," + results.rows.item(i).EXPOSURE
                    pSQL += ",'" + results.rows.item(i).PHONE + "')"

                    console.log(pSQL);
                    tx.executeSql(pSQL);


                    if(results.rows.item(i).EXPOSURE == 1)
                    {
                        pSQL = "UPDATE SKU_SERIES SET STATUS = 0 WHERE SERIE = "+ results.rows.item(i).SERIE
                        console.log(pSQL);
                        tx.executeSql(pSQL);    
                    }
                    


                };

                pSQL = "UPDATE INVOICE_HEADER SET STATUS = 3, VOID_INVOICE_ID = " + pCurrentNoteID + " WHERE INVOICE_NUM = " + pInvoiceID
                console.log(pSQL);
                tx.executeSql(pSQL);

                pSQL = "UPDATE INVOICE_DETAIL SET IS_ACTIVE = 2 WHERE INVOICE_NUM = " + pInvoiceID
                console.log(pSQL);
                tx.executeSql(pSQL);

                

                PostVoidedInvoice(pInvoiceID, pCurrentNoteID, pVoidReason, pVoidNotes);

                ShowInvoiceListPage();

            },
            function (err)
            {
                pCreditNoteID -= 1;
                localStorage.setItem('POS_CURRENT_CREDIT_NOTE', pCreditNoteID);
                notify("ERROR, 8.1.17: " + err.code);
            });
    });

   
      
}
function ProcessVoidInvoice(pInvoiceID, pReasonID, pVoidNotes)
{
    var pSQL = '';
    

    try
    {
        
        my_dialog("Procesando Factura", "Espere...", "open");

        SONDA_DB_Session.transaction(
            function (tx)
            {
                //INVOICE_HEADER(INVOICE_NUM, TERMS, POSTED_DATETIME, CLIENT_ID, CLIENT_NAME, POS_TERMINAL, GPS, TOTAL_AMOUNT, ERP_INVOICE_ID, IS_POSTED, STATUS, IS_CREDIT_NOTE, VOID_REASON, VOID_NOTES)
                pSQL = "SELECT * FROM INVOICE_HEADER WHERE INVOICE_NUM = " + pInvoiceID + " AND IS_CREDIT_NOTE = 0 "
                //console.log(pSQL);

                tx.executeSql(pSQL, [],
                    function (tx, results)
                    {
                        pCreditNoteID += 1;

                        gHeaderSerial = ''


                        var xrow_len = results.rows.length;
                        //console.log("xrow_len: " + xrow_len);

                        if (xrow_len >= 1)
                        {
                            pSQL = "INSERT INTO INVOICE_HEADER(INVOICE_NUM, TERMS, CLIENT_ID, CLIENT_NAME, POS_TERMINAL, GPS, TOTAL_AMOUNT, ERP_INVOICE_ID, IS_POSTED, STATUS, IS_CREDIT_NOTE, VOID_REASON, VOID_NOTES, POSTED_DATETIME, VOID_INVOICE_ID, CHANGE) "
                            pSQL += " VALUES(" + pCreditNoteID + ",'CASH','" + results.rows.item(0).CLIENT_ID + "','" + results.rows.item(0).CLIENT_NAME + "', '" + gCurrentRoute + "',"
                            pSQL += "'" + results.rows.item(0).GPS + "'," + results.rows.item(0).TOTAL_AMOUNT + ",'', "+results.rows.item(0).IS_POSTED+", 0, 1,'" + pReasonID + "',"
                            pSQL += "'" + pVoidNotes + "','" + getDateTime() + "'," + results.rows.item(0).INVOICE_NUM + "," + results.rows.item(0).CHANGE + ")";
                            //console.log(pSQL);
                            var pAmount = results.rows.item(0).TOTAL_AMOUNT;

                            tx.executeSql(pSQL, [],

                                function (tx, results)
                                {
                                    console.log('results.rowsAffected: ' + results.rowsAffected);
                                    if (results.rowsAffected == 1)
                                    {
                                        localStorage.setItem('POS_CURRENT_CREDIT_NOTE', Number(pCreditNoteID));

                                        gTotalInvoiced -= Number(pAmount);
                                        gTotalInvoicesProc--;

                                        localStorage.setItem('POS_TOTAL_INVOICED', gTotalInvoiced);
                                        localStorage.setItem('POS_TOTAL_INVOICES_PROC', gTotalInvoicesProc);
                                        
                                        $("#lblTotalInvoices").text(gTotalInvoicesProc);
                                        $("#lblSold").text('Q '+format_number(gTotalInvoiced,2));

                                        DuplicateInvoiceDetail_Void(pInvoiceID, pReasonID, pVoidNotes);
                                    } else
                                    {
                                        notify("ERROR, 9.1.0: No se actualizo correctamente");
                                        pCreditNoteID -= 1;
                                        localStorage.setItem('POS_CURRENT_CREDIT_NOTE', Number(pCreditNoteID));
                                    }

                                },
                                function (tx, err)
                                {
                                    alert("ERROR, 7.1.2:" + err.code);
                                    console.log('err.code:' + err.code); my_dialog("", "", "close"); notify(err);
                                }
                            );

                        }

                        my_dialog("", "", "close");

                    },
                    function (err)
                    {
                        pCreditNoteID -= 1;
                        localStorage.setItem('POS_CURRENT_CREDIT_NOTE', pCreditNoteID);
                        if (err.code !== 0)
                        {
                            alert("ERROR, 8.2.1: " + err.code);
                        }
                    }
                );
            },
            function (err)
            {
                my_dialog("", "", "close");
                pCreditNoteID -= 1;
                localStorage.setItem('POS_CURRENT_CREDIT_NOTE', pCreditNoteID);
                if (err.code !== 0)
                {
                    alert("ERROR, 8.2.2: " + err.code);
                }
            }
        );   

        
    }
    catch(e)
    {
        pCreditNoteID -= 1;
        localStorage.setItem('POS_CURRENT_CREDIT_NOTE', pCreditNoteID);
        notify("ERROR, 01.02.03: " + e.message);
    }
}
function PopulateVoidReasons()
{
    var xchild_list = 0;
    try
    {
        xchild_list = $('#cmbVoidReason').children().length;
    } catch (e) { }

     if(xchild_list===0)
    {
        //my_dialog("Cargando motivos de devolucion", "Espere...", "open");

        SONDA_DB_Session.transaction(
        function (tx)
        {
            var pDoc = '';
            var pImg = '';
            

            tx.executeSql('SELECT * FROM VOID_REASONS', [],
                function (tx, results)
                {
                    $('#cmbVoidReason').children().remove('option');
                    var xskus_len = (results.rows.length - 1);

                    for (i = 0; i <= xskus_len; i++)
                    {

                        try
                        {
                            vLI = '';
                            vLI = '<option value="'+results.rows.item(i).REASON_ID+'">'+results.rows.item(i).REASON_DESCRIPTION+'</option>'
                            
                            $("#cmbVoidReason").append(vLI);

                        } catch (e) { notiy(e.message); }

                    }
                    $("#cmbVoidReason").selectmenu('refresh');
                    my_dialog("", "", "close");

                },
                function (err)
                {
                    my_dialog("", "", "close");
                    if (err.code !== 0)
                    {
                        alert("(POS.5)Error processing SQL: " + err.code);
                    }
                }
            );
        },
            function (err)
            {
                notify("ERROR, " + err.code);

                if (err.code !== 0)
                {
                    alert("(POS.6)Error processing SQL: " + err.code);
                }
            }
        );    
    }
    my_dialog("", "", "close");

}
function GetVoidReasons()
{
    try
    {
       socket.emit('getvoidreasons', {'routeid': gCurrentRoute});
       my_dialog("", "", "close");
    
    }catch(e)
    {
        
    }  
}
function SetCF()
{
    $("#txtNIT").val("CF");
    $("#txtNombre").val("Consumidor Final");
    
}
function ConfirmPostInvoice()
{
    try
    {
        if(gPagado==1)
        {

            SONDA_DB_Session.transaction(
                function (tx)
                {
                    var vLI = '';
                    //REQUERIES_SERIE, SERIE, SERIE_2
                    tx.executeSql('SELECT * FROM INVOICE_DETAIL WHERE INVOICE_NUM = -9999 AND REQUERIES_SERIE = 1 AND (SERIE = 0 OR SERIE_2 = 0)', [],
                        function (tx, results)
                        {
                            //console.log("algun registro sin serie: " + results.rows.length);
                            my_dialog("", "", "close");
                            if (results.rows.length === 0)
                            {
                                console.log(gImageURI_1);

                                if (gImageURI_1.length > 0)
                                {
                                    navigator.notification.confirm(
                                        "Confirma Facturar?",  // message
                                        function (buttonIndex)
                                        {
                                            if (buttonIndex == 2)
                                            {
                                                console.log("entro!!!");
                                                my_dialog("Factura", "Procesando...", "close");
                                                console.log("going to PostInvoice()!!!");
                                                PostInvoice();
                                                my_dialog("", "", "close");

                                            }
                                        },   // callback to invoke with index of button pressed
                                        'Sonda® POS ' + device.cordova,   // title
                                        'No,Si'    // buttonLabels
                                    );
                                } else
                                {
                                    notify("ERROR, Aun Debe tomar la imagen frontal");
                                }
                            }
                            else
                            {
                                notify("ERROR, Aun Debe ingresar la información de series/imei");
                            }
                        },
                        function (err)
                        {
                            if (err.code !== 0)
                            {
                                alert("(POS.7)Error processing SQL: " + err.code);
                            }
                            pReturnValue = -2;
                            return pReturnValue;
                        }
                    );
                },
                function (err)
                {
                    if (err.code !== 0)
                    {
                        alert("(POS.8)Error processing SQL: " + err.code);
                    }
                    pReturnValue = -3;
                    return pReturnValue;
                }
            );

        }else
        {
            notify("ERROR, Debe cancelar la totalidad de la factura Q"+format_number(gInvocingTotal,2));
        }
    
    } catch (e) {
        notify(e.message);
    }
}

function UploadOfflinePhoto(pINVOICE_NUM, pIMG1, pIMG2, pIMG3)
{
    var pPrimaryServerURL = baseURL+ "SONDA_POS_IMAGE.aspx";
    var pimageURI="";

    try
    {
        for(i=1; i<=3; i++)
        {
            switch(i)
            {
                case 1:
                    pimageURI = pIMG1;
                    break;
                case 2:
                    pimageURI = pIMG2;
                    break;
                case 3:
                    pimageURI = pIMG3;
                    break;
            }

            if(pimageURI.length>=2)
            {
            
                var options = new FileUploadOptions();
                options.fileKey     =   "file";
                options.fileName    =   pimageURI.substr(pimageURI.lastIndexOf('/')+1);
                options.mimeType    =   "image/jpeg";
                options.chunkedMode =   true;
    
                var query_str       =   pPrimaryServerURL;
                    
                var params          =   {};
                params.pINVOICE_NUM =   pINVOICE_NUM;
                params.pID          =   i;
                
                options.params      =   params;
    
                var ft = new FileTransfer();

                ft.upload(pimageURI, encodeURI(query_str),
                    function UploadSuccess(r)
                    {
                        //notify('ok');
                    },
                    function UploadFail(error)
                    {
                        notify("An error has occurred: Code = " + error.code + " SOURCE= " + error.source + " TARGET=" + error.target);
                    },
                    options
               );    
            }
        }

    }catch(e)
    {
        notify(e.message);
    }

}

function CheckforOffline()
{
	/*
    try
    {

        SONDA_DB_Session.transaction(
            function (tx)
            {
                var pSQL = "";
                pSQL = "SELECT * FROM INVOICE_HEADER WHERE IS_CREDIT_NOTE = 0 AND IS_POSTED = 0 AND STATUS <> 3 ORDER BY INVOICE_NUM";
                console.log(pSQL);

                tx.executeSql(pSQL, [],
                    function (tx, results)
                    {
                        for (i = 0; i <= (results.rows.length - 1); i++)
                        {
                            Process_SKUsToInvoice(results.rows.item(i).INVOICE_NUM, 0, results.rows.item(i).AUTH_ID);
                        }
                        
                        pSQL = "";
                        pSQL = "SELECT * FROM DEPOSITS WHERE IS_POSTED = 0 ORDER BY TRANS_ID";
                        console.log(pSQL);
                        
                        tx.executeSql(pSQL, [],
                            function (tx, results)
                            {
                                console.log("results.rows.length:" + results.rows.length);

                                for (i = 0; i <= (results.rows.length - 1); i++)
                                {
                                    var pAccountNumber = results.rows.item(i).ACCOUNT_NUM;
                                    var pAmount = results.rows.item(i).AMOUNT;
                                    var pGPS_URL = results.rows.item(i).GPS_URL;
                                    var pTRANS_ID = results.rows.item(i).TRANS_ID;

                                    PostDepositOffline(pAccountNumber, pAmount, pTRANS_ID);
                                }

                                my_dialog("", "", "close");
                            },
                            function (err)
                            {
                                if (err.code !== 0)
                                {
                                    alert("(POS.9)Error processing SQL: " + err.code);
                                }
                            }
                        );
                        
                    },
                    function (err)
                    {
                        if (err.code !== 0)
                        {
                            alert("(POS.10)Error processing SQL: " + err.code);
                        }
                    }
                );
            },
            function (err)
            {
                if (err.code !== 0)
                {
                    alert("(POS.11)Error processing SQL: " + err.code);
                }
            }
        );
        
    } 
    catch (e) { notify(e.message); console.log('show invoices cath: '+ e.message); }
	*/
}
function PostInvoice()
{
    var pTaxID = $("#txtNIT").val();
    var pCustName = $("#txtNombre").val();
    var pChange = $("#txtVuelto_summ").text();
    
    console.log("PostInvoice()");
    
	try
    {
        gInvoiceNUM = GetNextInvoiceID()
		
		if(gInvoiceNUM != -1){
		
			SONDA_DB_Session.transaction(
				function (tx)
				{
					var pSQL = "";
					pSQL = "UPDATE SKU_SERIES SET STATUS = 2 WHERE SERIE IN (SELECT SERIE FROM INVOICE_DETAIL WHERE INVOICE_NUM = -9999)";
					tx.executeSql(pSQL);

					pSQL = "UPDATE INVOICE_DETAIL SET INVOICE_NUM = " + gInvoiceNUM + ", IS_ACTIVE=1 WHERE INVOICE_NUM = -9999";

					tx.executeSql(pSQL);

				},
				function (tx, err) { my_dialog("", "", "close"); notify(err.message); },
				function ()
				{
					SONDA_DB_Session.transaction(
						function (tx)
						{
							//INVOICE_HEADER(INVOICE_NUM, TERMS, POSTED_DATETIME, CLIENT_ID, CLIENT_NAME, POS_TERMINAL, GPS, TOTAL_AMOUNT, ERP_INVOICE_ID, IS_POSTED, STATUS, IS_CREDIT_NOTE, VOID_REASON, VOID_NOTES, VOID_INVOICE_ID, PRINT_REQUEST, PRINTED_COUNT, AUTH_ID, SAT_SERIE)
							pSQL = "INSERT INTO INVOICE_HEADER(INVOICE_NUM, TERMS, CLIENT_ID, CLIENT_NAME, POS_TERMINAL, GPS, TOTAL_AMOUNT, ERP_INVOICE_ID, IS_POSTED, STATUS, IS_CREDIT_NOTE, VOID_REASON, VOID_NOTES, POSTED_DATETIME, PRINT_REQUEST, PRINTED_COUNT, AUTH_ID, SAT_SERIE, CHANGE, IMG1, IMG2, IMG3) "
							pSQL += " VALUES(" + gInvoiceNUM + ",'CASH','" + pTaxID + "','"
							pSQL += pCustName + "', '" + gCurrentRoute + "','" + gCurrentGPS + "'," + gInvocingTotal + ",'', 0, 1, 0,'','','"
							pSQL += getDateTime() + "',1,0," + pCurrentSAT_Resolution + ",'" + pCurrentSAT_Res_Serie + "'," + pChange + ",'" + gImageURI_1 + "','" + gImageURI_2 + "','" + gImageURI_3 + "') ";
							
							//alert(pSQL);
							console.log(pSQL);
							tx.executeSql(pSQL);

						}, function (tx, err) { console.log("err.message: " + err.message); my_dialog("", "", "close"); notify(err); },
						function ()
						{

							gTotalInvoiced += Number(gInvocingTotal);
							gTotalInvoicesProc++;
							console.log(gTotalInvoicesProc);
							console.log("UpdateInvoiceCounter");
							UpdateInvoiceCounter();
							//Process_SKUsToInvoice(gInvoiceNUM, pUpdateInventory); where pUpdateInventory is an integer flag that indicate if function have to update inventory (1=yes/0=no)
							Process_SKUsToInvoice(gInvoiceNUM, 1, pCurrentSAT_Resolution);
						}
					);
				}
			);

		}else{
			notify("ERROR, Resolucion de SAT ha sido agotada, contacte a su administrador.");
		}
        
           
    } 
    catch (e) { console.log(e.message); notify(e.message); }
}
function ContinueToSkus()
{

    var pLeftAuthInvoices = new Number();
    pLeftAuthInvoices  = 0;
    pCurrentInvoiceID = localStorage.getItem('POS_CURRENT_INVOICE_ID'); //POS_CURRENT_INVOICE_ID
    pLeftAuthInvoices = Number(pCurrentSAT_Res_DocFinish) - Number(pCurrentInvoiceID);
    
		switch(pLeftAuthInvoices)
		{
			case 0:
				notify("ERROR, no se puede continuar facturando, no hay mas facturas disponibles en resolución: " + pCurrentSAT_Resolution + ". \nComuníquese con su administrador de Sonda");
				break;
			case 1:
				notify("ATENCION, esta es la última factura disponible en resolución: " + pCurrentSAT_Resolution + ". \nComuníquese con su administrador de Sonda");
				ShowSkusToPOS();
				break;
			default:
				ShowSkusToPOS();  
				break;
		}

	
	
 
    
}
function ShowSkusToPOS()
{
    //if more than 80% of authorized invoices are consumed, send alert.
    var ptxtNIT = $("#txtNIT").val();
    if (ptxtNIT.length === 0)
    {
        notify("ERROR, Debe Ingresar la identificacion.");
        $("#txtNIT").focus();
    } else
    {
        GetGPS_ProcessInvoice();
        ReleaseUnsedSeries();
        $.mobile.changePage("#pos_skus_page", {
            transition: "flip",
            reverse: true,
            changeHash: true,
            showLoadMsg: false
        });
    }
}
function GetGPS_ProcessInvoice()
{
    //my_dialog("GPS", "Getting your location...","open");
    navigator.geolocation.getCurrentPosition(onSuccessGPS_PostInvoice, onErrorGPS_PostInvoice, {timeout:30000, enableHighAccuracy:true});
}
function onSuccessGPS_PostInvoice(position)
{
    try
    {
        navigator.notification.activityStop();
        gGPSPositionIsAvailable = true;
        gCurrentGPS = position.coords.latitude + ',' + position.coords.longitude
        my_dialog("", "", "close");        
  

    } catch (e) { alert('error on getting gps:' + err.message); }
        
}

function onErrorGPS_PostInvoice(error){
    //notify("error posting invoice");
    navigator.notification.activityStop();
    gGPSPositionIsAvailable = false;
    gMyCurrentGPS= "0,0"
    ToastThis('GPS position Is unreachable.');
    
    //window.plugins.statusBarNotification.notify("Sonda:GPS disabled", "GPS position Is unreachable.");
}

function AddSKU(pSKU, pSKU_Name, pSKU_PARENT)
{
    var vLI = '';
    var xonclick = '';
    var pSKU_Price = new Number();
    var pSKUQTY = new Number();
    var pREQUERIES_SERIE= new Number();
    var pIS_KIT= new Number();

    try
    {
        var pSEQ = new Number();
        pSEQ = 0;
        
        var pPARENT_SEQ = new Number();
        pPARENT_SEQ = 0;

        pSEQ = GetNextSKUSeq();
        //alert("returned pSEQ:"+pSEQ);
       
        InsertInvoiceDetail(pSKU_PARENT, pSEQ);
        PopulateInvoiceSKUsList();
        localStorage.setItem('POS_ITEM_SEQ', pSEQ+1);
        

        $.mobile.changePage("#pos_skus_page", {
            transition: "none",
            reverse: true,
            changeHash: true,
            showLoadMsg: false
        });

    } catch (e) { notify(e.message); console.log("catch: "+e.message); }
        
}

function InsertInvoiceDetail(pSKU_PARENT, pSEQ)
{
    try
    {
        
        var pNextParentSeq=1;

        SONDA_DB_Session.transaction(
            function (tx)
            {
                var pDoc = '';
                var pImg = '';
                var pSQL = "SELECT COUNT(1)+1 as CURRENT_SEQ FROM INVOICE_DETAIL WHERE INVOICE_NUM = -9999 AND COMBO_REFERENCE = '" + pSKU_PARENT + "' AND EXPOSURE = 1";

                try
                {

                    console.log(pSQL);

                    tx.executeSql(pSQL, [],
                        function (tx, results)
                        {
                            pNextParentSeq = results.rows.item(0).CURRENT_SEQ;
                            console.log('GetNextParentSeq.Return:' + pNextParentSeq);
                            pSQL = "SELECT * FROM SKUS WHERE PARENT_SKU = '" + pSKU_PARENT + "'";
                            console.log(pSQL);

                            tx.executeSql(pSQL, [],
                                function (tx, results)
                                {
                                    //console.log("results.rows.length:" + results.rows.length);
                                    var pExposureCount = 0;
                                    var pExposure = 0;

                                    for (i = 0; i <= (results.rows.length - 1); i++)
                                    {
                                        pREQUERIES_SERIE = results.rows.item(i).REQUERIES_SERIE;
                                        pSKU_Price = results.rows.item(i).SKU_PRICE;
                                        pSKUQTY = results.rows.item(i).QTY_RELATED;
                                        pSKU_Name = results.rows.item(i).SKU_NAME;
                                        pExposure = results.rows.item(i).EXPOSURE;


                                        pSQL = 'INSERT INTO INVOICE_DETAIL(INVOICE_NUM, SKU, SKU_NAME, QTY, PRICE, DISCOUNT, TOTAL_LINE, REQUERIES_SERIE, SERIE, SERIE_2, LINE_SEQ, IS_ACTIVE, COMBO_REFERENCE, PARENT_SEQ, EXPOSURE, PHONE) ';
                                        pSQL = pSQL + " VALUES(-9999,'" + results.rows.item(i).SKU + "','" + pSKU_Name + "', " + pSKUQTY + ", " + pSKU_Price + ", 0, 0," + pREQUERIES_SERIE + ",0,0," + pSEQ + ", 3, '" + pSKU_PARENT + "'," + pNextParentSeq + "," + pExposure + ",'')";
                                        
                                        console.log(pSQL);
                                        tx.executeSql(pSQL);

                                        if (pExposure == 1)
                                        {
                                            pExposureCount++;
                                        }
                                    }
                                    if (pExposureCount === 0)
                                    {
                                        pSQL = "DELETE FROM INVOICE_DETAIL WHERE INVOICE_NUM = -9999 AND LINE_SEQ=" + pSEQ;
                                        localStorage.setItem('POS_ITEM_SEQ', Number(0));
                                        tx.executeSql(pSQL);
                                    }
                                    my_dialog("", "", "close");
                                },
                                function (err)
                                {
                                    console.log("02.40.99:" + err.code);

                                    my_dialog("", "", "close");
                                    if (err.code !== 0)
                                    {
                                        alert("Error on: insert into invoice_detail: " + err.code);
                                    }
                                }
                            );

                        }
                    );

                } catch (e)
                {
                    console.log('catch.getnextseq:' + e.message);
                }
            },
            function (err)
            {
                console.log("03.50.110:" + err.code);
                if (err.code != 0)
                {
                    alert("03.50.110.Error processing SQL: " + err.code);
                }
            }
        );
    }catch(e)
    {
        var xresult = "InsertInvoiceDetail.Catch:" + e.message;
        console.log(xresult);
        notify(xresult);
    }
}

function GetNextSKUSeq()
{
    //console.log('GetNextSKUSeq');
    var pSEQ=1;
    
    pSEQ = Number(localStorage.getItem('POS_ITEM_SEQ'));
    return pSEQ;

}

function ConfirmedInvoice()
{
    ClearUpInvoice(); 
    $.mobile.changePage("#pos_client_page", {
        transition: "none",
        reverse: true,
        changeHash: true,
        showLoadMsg: false
    });
}

function PopulateSKUSeriesGrid(pSKU, pLINE_SEQ)
{
   //my_dialog("Cargando listado Series", "Espere...", "open");

   try
   {
       SONDA_DB_Session.transaction(
            function (tx)
            {
                var pDoc = '';
                var pImg = '';
                var pSQL = 'SELECT * FROM SKU_SERIES WHERE SKU = "' + pSKU + '" AND STATUS = 0';
                //var pSQL = "SELECT * FROM SKU_SERIES WHERE SKU = '" + pSKU + "'";

                tx.executeSql(pSQL, [],
                    function (tx, results)
                    {
                        console.log(results.rows.length);
                        $('#series_listview_panel').children().remove('li');
                        $("#divSeriesSKU").attr('LineSeq', pLINE_SEQ);

                        for (i = 0; i <= (results.rows.length - 1); i++)
                        {

                            var xonclick2 = 'UpdateSKUSeries(' + "'" + pSKU + "'," + pLINE_SEQ + ",'" + results.rows.item(i).SERIE + "','" + results.rows.item(i).ICC + "','" + results.rows.item(i).PHONE + "'" + ');'

                            //tx.executeSql('CREATE TABLE IF NOT EXISTS SKU_SERIES(SKU, IMEI, SERIE, PHONE, ICC, STATUS, LOADED_LAST_UPDATED)');
                            vLI = '';
                            vLI += '<li class="ui-nodisc-icon ui-alt-icon">';
                            vLI += '<a href="#" onclick="' + xonclick2 + '">';
                            vLI += '<p><span class="title">' + results.rows.item(i).SERIE + '</span></p>';
                            vLI += '<p><div class="ui-nodisc-icon ui-alt-icon">'

                            xonclick2 = "notify('IMEI: " + results.rows.item(i).ICC + "');";
                            vLI += '<a style="text-align:center" href="#" class="ui-corner-all ui-btn-icon-notext ui-btn-inline ui-btn-icon-left ui-btn ui-btn-c ui-shadow ui-icon-tag ui-nodisc-icon" onclick="' + xonclick2 + '">IMEI</a>';

                            xonclick2 = "notify('Celular: " + results.rows.item(i).PHONE + "');";
                            vLI += '<a style="text-align:center" href="#" class="ui-corner-all ui-btn-icon-notext ui-btn-inline ui-btn-icon-left ui-btn ui-btn-c ui-shadow ui-icon-phone ui-nodisc-icon" onclick="' + xonclick2 + '">' + results.rows.item(i).PHONE + '</a>';
                            vLI += '</div></a></li>';

                            //  console.log(vLI);


                            $("#series_listview_panel").append(vLI);

                        }
                        console.log("termino.");
                        $("#series_listview_panel").listview('refresh');
                        my_dialog("", "", "close");
                    },
                    function (err)
                    {
                        console.log("01.40.99:" + err.code);

                        my_dialog("", "", "close");
                        if (err.code !== 0)
                        {
                            alert("(POS.12)Error processing SQL: " + err.code);
                        }
                    }
                );
            },
            function (err)
            {
                console.log("01.40.100:" + err.code);
                if (err.code !== 0)
                {
                    alert("(POS.13)Error processing SQL: " + err.code);
                }
            }
        );    
   }
   catch (e) { my_dialog("", "", "close"); console.log(e.message);}

   
}

function exploredevices()
{
    try
    {
         //my_dialog("Obteniendo dispositivos", "Espere...", "open");
         try
         {
             bluetoothSerial.list(
                function (devices)
                {
                    devices.forEach(function (device)
                    {
                        xdevname = device.name;

                        if (xdevname.substring(1, 2) == "X")
                        {
                            var xxitem = $("#item-" + device.name);
                            
                            if (xxitem.length<=0)
                            {
                                var pHtml = "";
                                if(device.address == gPrintAddress)
                                {
                                    pHtml = pHtml + "<input type='radio' name='itemDev' id='item-" + device.name + "' value='" + device.address + "' checked='checked'>";    
                                }else
                                {
                                    pHtml = pHtml + "<input type='radio' name='itemDev' id='item-" + device.name + "' value='" + device.address + "'>";    
                                }
                                
                                pHtml = pHtml + "<label class='medium' for='item-" + device.name + "'>" + device.name + " " + device.address + "</label>";

                                $("#cmbDevices").append(pHtml);
                                $("#item-" + device.name).checkboxradio().checkboxradio("refresh");
                            }
                        }

                    });
                    $('#cmbDevices').controlgroup().controlgroup('refresh');

                },
                function (err) { }
             );    
         }catch(e)
         {
             alert(e.message);
         }
         my_dialog("", "", "close");

    } 
    catch (e) 
    {
        my_dialog("", "", "close");
        alert('cannot print '+e.message);
    }
}

function TryPrinter()
{
    
    try
    {
        var lheader = ""
        lheader = "! 0 50 50 350 1\r\n";
        lheader = lheader + "! U1 LMARGIN 10\r\n! U\r\n! U1 PAGE-WIDTH 1400\r\nON-FEED IGNORE\r\n";
        lheader = lheader + "CENTER 550 T 1 2 0 10 Ways, S.A\r\n"
        lheader = lheader + "CENTER 550 T 0 2 0 60 Calzada La Paz, Ofibodega Centro 5, Bodega #13 18-40, Guatemala Ciudad\r\n";
        lheader = lheader + "LEFT 5 T 0 2 0 90 Usuario: " + gLastLogin + " \r\n";
        lheader = lheader + "LEFT 5 T 0 2 0 120 Ruta: " + gCurrentRoute + " \r\n";
        lheader = lheader + "LEFT 5 T 0 2 0 150 Estatus: " + $("#login_isonline").text() + " " + $("#svr_addr").text() + " \r\n";
        lheader = lheader + "L 5 180 570 180 1\r\nPRINT\r\n";

        
        bluetoothSerial.isConnected(
            function ()
            {
                bluetoothSerial.write(lheader, function () { }, function () { alert('unable to write to printer'); });
                bluetoothSerial.disconnect(function () { }, function () { alert('Printer is unable to get disconnected'); });
                
                gPrinterIsAvailable = 1;
            },
            function ()
            {
                
                gPrintAddress = $('input[name=itemDev]:checked').val();
                
                bluetoothSerial.connect(gPrintAddress,
                    function ()
                    {
                        bluetoothSerial.write(lheader, function () { }, function () { alert('unable to write to printer'); });
                        bluetoothSerial.disconnect(function () { }, function () { alert('Printer is unable to get disconnected'); });
                        gPrinterIsAvailable = 1;
                        
                    },
                    function ()
                    {
                        notify("ERROR, No se pudo conectar a la impresora:" + gPrintAddress);
                        my_dialog("", "", "close");
                        gPrinterIsAvailable = 0;

                    }
                );
            }
        );
    } catch (e) { notify(e.message); }
    
}

function SavePrinter()
{
    try
    {
        gPrintAddress = $('input[name=itemDev]:checked').val();

        localStorage.setItem('PRINTER_ADDRESS', gPrintAddress);
        $("#lblPrinterAddress").text(gPrintAddress);

        var pVisible = $("#btnStartPOS").css("Visibility");
        
        if(pVisible=="hidden")
        {
            $("#btnStartPOS").show();
        }
        $.mobile.changePage("#menu_page", {
            transition: "none",
            reverse: true,
            showLoadMsg: false
        });
    }catch(e)
    {
        notify(e.message);
    }
}

function UpdateInventory(pCombo, pSku, pQty, tx)
{
    try
    {
        pSQL = "";
        pSQL = "UPDATE SKUS SET ON_HAND = ON_HAND - "+ pQty+" WHERE PARENT_SKU = '" + pCombo + "' AND EXPOSURE = 1 AND SKU = '" + pSku + "'";
        console.log(pSQL);
        

        tx.executeSql(pSQL, [],
            function (tx, results)
            {
                if (results.rowsAffected == 1)
                {
                    //alert('actualizo!');
                    //PopulateSKUGrid();
                }
            }
        );
    } catch (e) { notify(e.message); }
    
}
function Process_SKUsToInvoice(pInvoiceID, pUpdateInventory, pResolution)
{
    var pDetailResults= Array();
    var pHeaderResults = "";
    var pCombo = "";
    var singlesku = "";
    try
    {
        console.log("001.01");
        SONDA_DB_Session.transaction(
            function (tx)
            {
                var pDoc = '';
                var pImg = '';
                var pSQL = '';
                pSQL = 'SELECT A.INVOICE_NUM, A.SKU, A.PRICE, A.SKU_NAME, A.QTY, A.TOTAL_LINE, A.COMBO_REFERENCE,'
                pSQL += 'A.REQUERIES_SERIE, A.LINE_SEQ, 1 AS IS_KIT, A.SERIE, A.SERIE_2, A.PARENT_SEQ, A.EXPOSURE FROM INVOICE_DETAIL A  '
                pSQL += 'WHERE A.INVOICE_NUM = ' + pInvoiceID

                console.log(pSQL);
                tx.executeSql(pSQL, [],
                        function (tx, results)
                        {
                            var INVOICE_DETAIL = {};


                            for (i = 0; i <= (results.rows.length - 1); i++)
                            {
                                INVOICE_DETAIL =

                                {
                                    INVOICE_NUM :   results.rows.item(i).INVOICE_NUM,
                                    SKU         :   results.rows.item(i).SKU,
                                    QTY         :   results.rows.item(i).QTY,
                                    PRICE       :   results.rows.item(i).PRICE,
                                    TOTAL_LINE  :   results.rows.item(i).TOTAL_LINE,
                                    SERIE       :   results.rows.item(i).SERIE,
                                    SERIE_2     :   results.rows.item(i).SERIE_2,
                                    COMBO_REFERENCE: results.rows.item(i).COMBO_REFERENCE,
                                    PARENT_SEQ  :   results.rows.item(i).PARENT_SEQ,
                                    EXPOSURE    :   results.rows.item(i).EXPOSURE,
									LINE_SEQ	:	results.rows.item(i).LINE_SEQ,
									INVOICE_RESOLUTION	:	pResolution,
									
                                };
                                var xDetailData = JSON.stringify(INVOICE_DETAIL);
                                pDetailResults.push(INVOICE_DETAIL);
                                pCombo = results.rows.item(i).COMBO_REFERENCE;
                                singlesku = results.rows.item(i).SKU;
                                console.log("DETALLE");
                                
                                if (pUpdateInventory == 1)
                                {
                                    UpdateInventory(pCombo, singlesku, 1, tx);
                                }

                            }

                            SONDA_DB_Session.transaction(
                                function (tx)
                                {
                                    var pDoc = '';
                                    var pImg = '';
                                    var pSQL = '';
                                    pSQL = 'SELECT * FROM INVOICE_HEADER WHERE  '
                                    pSQL += " INVOICE_NUM = " + pInvoiceID
                                    console.log(pSQL);

                                    tx.executeSql(pSQL, [],
                                            function (tx, results)
                                            {

                                                var INVOICE_HEADER =
                                                {
                                                    INVOICE_NUM: results.rows.item(0).INVOICE_NUM,
                                                    CLIENT_ID: results.rows.item(0).CLIENT_ID,
                                                    POS_TERMINAL: results.rows.item(0).POS_TERMINAL,
                                                    GPS: results.rows.item(0).GPS,
                                                    TOTAL_AMOUNT: results.rows.item(0).TOTAL_AMOUNT,
                                                    POSTED_DATETIME: results.rows.item(0).POSTED_DATETIME,
                                                    TOTAL_AMOUNT: results.rows.item(0).TOTAL_AMOUNT,
                                                    CLIENT_ID: results.rows.item(0).CLIENT_ID,
                                                    CLIENT_NAME: results.rows.item(0).CLIENT_NAME,
                                                    AUTH_ID: results.rows.item(0).AUTH_ID,
                                                    SAT_SERIE: results.rows.item(0).SAT_SERIE
                                                }
                                                pHeaderResults = JSON.stringify(INVOICE_HEADER);

                                                var xDetailData1 = JSON.stringify(pDetailResults);

                                                var dataemit =
                                                {
                                                    'data_header': pHeaderResults,
                                                    'data_detail': xDetailData1,
                                                    'routeid': gCurrentRoute,
                                                    'batt': gBatteryLevel
                                                }

                                                //console.log("gIsOnline:"+gIsOnline);

                                                

                                                if (gIsOnline == 1)
                                                {
                                                    if (pUpdateInventory == 1)
                                                    {
                                                        socket.emit('post_invoice', { data: dataemit });
                                                        ShowInvoiceConfirmation();
														
                                                    } else
                                                    {
                                                        socket.emit('post_invoice_offline', { data: dataemit });
                                                    }
                                                }else
                                                {
                                                    ShowInvoiceConfirmation();
                                                }
                                                

                                            },
                                            function (err)
                                            {
                                                console.log(err.message);

                                                my_dialog("", "", "close");
                                                if (err.code !== 0)
                                                {
                                                    alert("(POS.14)Error processing SQL: " + err.code);
                                                }
                                            }
                                        );
                                    my_dialog("", "", "close");
                                },
                                function (err)
                                {
                                    my_dialog("", "", "close");
                                    if (err.code !== 0)
                                    {
                                        alert("(POS.15)Error processing SQL: " + err.code);
                                    }
                                }
                            );

                        },
                        function (err)
                        {
                            console.log(err.message);

                            my_dialog("", "", "close");
                            if (err.code !== 0)
                            {
                                alert("(POS.16)Error processing SQL: " + err.code);
                            }
                        }
                    );
                my_dialog("", "", "close");
            },
            function (err)
            {
                my_dialog("", "", "close");
                if (err.code !== 0)
                {
                    alert("(POS.17)Error processing SQL: " + err.code);
                }
            }
        );

        
        
    }
    catch (e) { console.log(e); notify("Process_SKUsToInvoice: "+ e.message); }
}

function UpdateInvoiceCounter()
{
    localStorage.setItem('POS_CURRENT_INVOICE_ID', gInvoiceNUM);   
    $("#lblSumm_CurrentDoc").text(gInvoiceNUM);
    localStorage.setItem('POS_TOTAL_INVOICED', gTotalInvoiced);
    localStorage.setItem('POS_TOTAL_INVOICES_PROC', Number(gTotalInvoicesProc));
    localStorage.setItem('POS_ITEM_SEQ', Number(0));
}