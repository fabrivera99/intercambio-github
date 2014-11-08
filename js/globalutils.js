var pictureSource;   // picture source
var destinationType; // sets the format of returned value
var SONDA_DB_Session;
var gInvoiceNUM;
var gInvocingTotal = 0;
var gTotalInvoiced = new Number();
var gTotalInvoicesProc = new Number();

var gBatteryLevel = 0;
var gSKUsJson = '';
var gNetworkState = 0;
var gPrepared = 0;
var gPanelOptionsIsOpen = 0;
var pPOSStatus='CLOSED';
var pCpCl = "";
var socket;
var states = {};
var gMyLocalIP = "";
var pUserID = "";
var socketConnectTimeInterval;
var gPrintAddress = "";
var gBankName = "";

var gVoidReasons=[];
var gBankAccounts=[];
var gSelectedAccount;

//var SondaServerURL = "http://200.6.253.242:8595";
var SondaServerURL = 'http://192.168.0.62:8596';
var baseURL =  SondaServerURL;

var SondaServerOptions = 
{
    'reconnect': true,
    'max reconnection attempts': 60000
}
var gCurrentGPS = '0,0';
var gImageURI_1 = '';
var gImageURI_2 = '';
var gImageURI_3 = '';
var gImageURI_Deposit = '';

var gPagado = 0;
var gPrinterIsAvailable = 0;
var gLastLogin=""
var gCurrentRoute=""
var gIsOnline = 0;

var pCurrentInvoiceID = 0;
var pCurrentNoteID = 0;

var pCurrentSAT_Resolution = 0;
var pCurrentSAT_Res_Serie = 0;

var pCurrentSAT_Resolution_notes = 0;
var pCurrentSAT_Res_Serie_notes = 0;

var pCurrentSAT_Res_DocStart = 0;
var pCurrentSAT_Res_DocFinish = 0;
var pCurrentSAT_Res_Date = '';

var pCurrentSAT_Res_DocStart_notes = 0;
var pCurrentSAT_Res_DocFinish_notes = 0;
var pCurrentSAT_Res_Date_notes = '';

var pCurrentDepositID = 0;
var pCreditNoteID = new Number();

var gTotalDeposited = new Number();

var gHeaderSerial = '';
var gDetailSerial = '';

function onMenuKeyDown()
{
    var myFooter;
    
    try
    {
        
        //alert($.mobile.activePage[0].id);

        switch ($.mobile.activePage[0].id)
        {
            
            case "pos_client_page":
                myFooter = $("#navFooter_POS_CUST");
                if (myFooter.css("visibility") == "hidden") { myFooter.css("visibility","visible"); }
                else { myFooter.css("visibility","hidden"); }
                break;
            case "pos_skus_page":
                PopulateAndShowSKUPanel();
                break;
            case "login_page":
                //scanloginid();
                brek;
            default:
                var myPanel = $.mobile.activePage.children('[data-role="panel"]');
                myPanel.panel("toggle");
                break;

        }
    } catch (e) { console.log(e.message); }
    
}
function onSuccessGPS(position)
{
    //spinnerplugin.hide();
    //alert("lat: " + position.coords.latitude + " lon: " + position.coords.longitude)
    //navigator.notification.activityStop();
    window.plugins.spinnerDialog.hide();
	gCurrentGPS = position.coords.latitude + "," + position.coords.longitude;
    $("#myCurrentGPS").text(position.coords.latitude + "," + position.coords.longitude);
                 
    /*
    setInterval(function ()
    {
    alert('interval');
    }, 30000);
    */
}
function DeviceIsOnline()
{
	
	try{
	    

		gNetworkState = navigator.connection.type;
		
		states[Connection.UNKNOWN]  = 'Unknown';
		states[Connection.ETHERNET] = 'Ethernet';
		states[Connection.WIFI]     = 'WiFi';
		states[Connection.CELL_2G]  = '2G';
		states[Connection.CELL_3G]  = '3G';
		states[Connection.CELL_4G]  = '4G';
		states[Connection.CELL]     = 'EDGE';
		states[Connection.NONE]     = 'NONE';
		
		/*
		$("#login_isonline").text("OnLine: "+states[gNetworkState]);
		$("#lblNetworkLogin").text(states[gNetworkState]);
		$("#lblNetworkDeliveryMenu").text(states[gNetworkState]);
		*/
		
		navigator.geolocation.getCurrentPosition(onSuccessGPS, onErrorGPS, {maximumAge:30000, timeout:15000, enableHighAccuracy:true});

	}catch(e){
		notify("DeviceIsOnline: "+e.message);
		console.log("DeviceIsOnline: "+e.message);
	}
    
}
function DeviceIsOffline()
{
    $("#login_isonline").text("OFF");
	
	$("#login_isonline").text("OFF");
	$("#lblNetworkLogin").text("OFF");
	$("#lblNetworkDeliveryMenu").text("OFF");
	$('#btnNetworkStatus').buttonMarkup({ icon: "forbidden" });
	
    gIsOnline = 0;
}
function my_dialog(pTitle, pMessage, pAction)
{
    if (pAction == "open")
    {
		window.plugins.spinnerDialog.show(pTitle, pMessage);
        //navigator.notification.activityStart();
    }
    else
    {
        //navigator.notification.activityStop();
		window.plugins.spinnerDialog.hide();
    }
}
function onErrorGPS(error)
{
    //navigator.notification.activityStop(); 
	window.plugins.spinnerDialog.hide();
    $("#myCurrentGPS").text("GPS is unable at this moment");
    ToastThis("GPS is unreachable at this moment.")
               
    //alert('error gps: ' + error.message)
}
function add_sku()
{
    $.mobile.changePage('#dialog_sku_list', 'pop', true, true);
}
function onBackKeyDown()
{
    var myPanel = $.mobile.activePage.children('[data-role="panel"]');
    
    switch ($.mobile.activePage[0].id)
    {
        case "printer_page":
            $.mobile.changePage("#menu_page", {
                transition: "none",
                reverse: true,
                changeHash: true,
                showLoadMsg: false
            });
            break;
        case "pickupplan_page":
            $.mobile.changePage("#menu_page", {
                transition: "none",
                reverse: true,
                changeHash: true,
                showLoadMsg: false
            });
            break;
        case "void_invoice_page":
            history.back();
            break;
        case "deposit_list_page":
            history.back();
            break;
        case "deposit_page":
            history.back();
            break;
        case "view_invoice_page":
            $.mobile.changePage("#invoice_list_page", {
                transition: "none",
                reverse: true,
                changeHash: true,
                showLoadMsg: false
            });
            break;
        case "invoice_list_page":
            var myDialog = $("#invoice_actions_dialog");

            if (gPanelOptionsIsOpen == 1)
            {
                myDialog.popup("close");
            } else
            {
                $.mobile.changePage("#menu_page", {
                    transition: "none",
                    reverse: true,
                    changeHash: true,
                    showLoadMsg: false
                });
            }
            break;

        case "inv_page":
            $.mobile.changePage("#menu_page", {
                transition: "none",
                reverse: true,
                changeHash: true,
                showLoadMsg: false
            });
            break;
        case "skucant_page":
            $.mobile.changePage("#pos_skus_page", {
                transition: "none",
                reverse: true,
                changeHash: true,
                showLoadMsg: false
            });
            break;
        case "summary_page":
            $.mobile.changePage("#pos_skus_page", {
                transition: "none",
                reverse: true,
                changeHash: true,
                showLoadMsg: false
            });
            break;
        case "series_page":
            $.mobile.changePage("#pos_skus_page", {
                transition: "none",
                reverse: true,
                changeHash: true,
                showLoadMsg: false
            });
            break;
        case "pos_skus_page":
            onResume();
            
            PopulateInvoiceSKUsList();
            $.mobile.changePage("#pos_client_page", {
                transition: "none",
                reverse: true,
                changeHash: true,
                showLoadMsg: false
            });
            break;
        case "dialog_sku_list":
            $.mobile.changePage("#pos_client_page", {
                transition: "none",
                reverse: true,
                changeHash: true,
                showLoadMsg: false
            });
            break;
        

        case "dialog_cust_list":
            $.mobile.changePage("#pos_client_page", {
                transition: "none",
                reverse: true,
                changeHash: true,
                showLoadMsg: false
            });
            break;

        case "pos_client_page":
            if (myPanel.css("visibility") == "hidden")
            {
                $.mobile.changePage("#menu_page", {
                    transition: "none",
                    reverse: true,
                    changeHash: true,
                    showLoadMsg: false
                });
            } else { myPanel.panel("toggle"); }

            break;
        case "dialog_startpos":
            $.mobile.changePage("#menu_page", {
                transition: "none",
                reverse: true,
                changeHash: true,
                showLoadMsg: false
            });
            break;
    
        case "login_page":
            if (myPanel.css("visibility") == "hidden")
            {
                navigator.app.exitApp();
            } else
            {
                myPanel.panel("toggle");
            }
            break;
        case "menu_page":
                
            if (myPanel.css("visibility")=="visible")
            {
                myPanel.panel("toggle");
            }
            else
            {
                navigator.app.exitApp();
            }

            break;
        

    }
}
function showmenu()
{
    $("#popupMenu").popup("open", {positionTo: '#myMenuList', transtion:"slideup"});
    //$("#popupMenu").popup("open", {transtion:"slideup"});
}
function preview_picture(pID)
{
    var pSrc=$("#btnPreviewImg"+pID).attr('srcpic');
    $("#popphoto").attr('src', pSrc);
    $("#popupPic").popup().popup("open",{transition: "none"});
}
function ShowInvoiceConfirmation()
{
    $("#lblNewInvoice").text(gInvoiceNUM);
	//check if 75%
	
    $.mobile.changePage("#confirmation_page", {
        transition: "slide",
        reverse: true,
        changeHash: true,
        showLoadMsg: false
    });
}
function take_picture(pID){
    var pSQL = "";
    try
    {
        navigator.camera.getPicture
        (
            function (imageURI)
            {

                $("#btnTakePic" + pID).attr('srcpic', imageURI);
                $('#btnTakePic' + pID).buttonMarkup({ icon: "check" });

                switch (pID)
                {
                    case '1':
                        gImageURI_1 = imageURI;
                        break;
                    case '2':
                        gImageURI_2 = imageURI;
                        break;
                    case '3':
                        gImageURI_3 = imageURI;
                        break;
                };

            },
            function (message)
            {
                //notify("ERROR," + message);
            },
            {
                quality: 75,
                targetWidth: 350,
                targetHeight: 350,
                saveToPhotoAlbum: false,
                sourceType: navigator.camera.PictureSourceType.CAMERA,
                correctOrientation: false,
                destinationType: Camera.DestinationType.FILE_URI
            }
        );
    } catch (e) { notify(e.message); }
             
}
function ToastThis(pMessage)
{
    try
    {
        window.plugins.toast.show(pMessage, 'short', 'center', function(a){}, function(b){})
    }
    catch (e) { alert(e.message); }
}
function ShowHideOptions()
{
        var pPOSStatus = "OPEN";
        
        try
        {
            if (pPOSStatus == "CLOSED")
            {
                if(gPrintAddress!=0)
                {
                    $("#btnStartPOS").show();    
                }else
                {
                    $("#btnStartPOS").hide();
                }
                /*
                $("#btnFinishPOS").hide();
                $("#btnPOS").hide();
                $("#btnShowDeposit").hide();
                $("#btnViewInv").hide();
                $("#btnInvoiceList").hide();
                $("#btnDepositsList").hide();
                
                $('#btnCreateNewInvoice').buttonMarkup({ icon: "forbidden" });
                $("#btnCreateNewInvoice").attr("onclick", "");

                $('#btnCreateNewDeposit').buttonMarkup({ icon: "forbidden" });
                $("#btnCreateNewDeposit").attr("href", "#");
                
                $("#lblPOSStartedTime").text('Cerrado');
				*/
            }
            else
            {
				/*
                $("#btnStartPOS").hide();
                $("#btnFinishPOS").show();
                $("#btnPOS").show();
                $("#btnViewInv").show();
                $("#btnShowDeposit").show();
                $("#btnInvoiceList").show();
                $("#btnDepositsList").show();
                
                $('#btnCreateNewInvoice').buttonMarkup({ icon: "plus" });
                $("#btnCreateNewInvoice").attr("onclick", "start_invoicing();");

                $('#btnCreateNewDeposit').buttonMarkup({ icon: "plus" });
                $("#btnCreateNewDeposit").attr("href", "#deposit_page");

                $("#lblPOSStartedTime").text('Abierto');
				*/
            }
        }
        catch (e)
        {
            notify("ShowHideOptions: "+e.message);
        }

    }
	
	function notify(pMessage) {
        navigator.notification.alert(
            pMessage,  // message
            null,      // callback to invoke with index of button pressed
            'Sonda® PE ' + device.cordova, //title
            'OK' //button caption
        );
	}
	function gettask(taskid, phone, address){
		try{
			//alert(taskobj.TASK_ADDRESS);
		    alert(phone);
		}catch(e){
		}
	}
	function gotomypickupplan(){
		$.mobile.changePage('#pickupplan_page', 'pop', true, true);
		RefreshMyRoutePlan();
		
	}
	function RefreshMyRoutePlan(){
		
	   try
	   {
			my_dialog("Ruta de recolecta", "cargando datos...", "open"); 
		
			SONDA_DB_Session.transaction(
			function (tx)
			{
					var pDoc = '';
					var pImg = '';
					
					tx.executeSql('SELECT * FROM PICKUP_ROUTE', [],
						function (tx, results)
						{
							
							$('#pickup_listview').children().remove('li');

							for (i = 0; i <= (results.rows.length - 1); i++)
							{
                                //mytaskid, phone, comments, address ojo
                                //TASK_ID, SCHEDULE_FOR, ASSIGNED_BY, ACCEPTED_STAMP, COMPLETED_STAMP, DOC_PARENT, EXPECTED_GPS, POSTED_GPS, TASK_COMMENTS, TASK_SEQ, 
                                //TASK_ADDRESS, RELATED_CLIENT_PHONE_1, EMAIL_TO_CONFIRM, RELATED_CLIENT_NAME, TASK_PRIORITY, TASK_STATUS

								var pClick = "gettask("+ results.rows.item(i).TASK_ID +",'"+ results.rows.item(i).RELATED_CLIENT_PHONE_1 +"','"+results.rows.item(i).TASK_ADDRESS+"');";
								
								vLI = '';
								vLI = '<li class="ui-alt-icon ui-nodisc-icon ui-btn ui-shadow ui-btn-icon-tag"> <a href="#" onclick='+ pClick +'>';
								vLI += '<p><span class="medium">' + results.rows.item(i).TASK_SEQ + ") " + results.rows.item(i).RELATED_CLIENT_NAME + '</span></p>';
								vLI += '<p><span class="small-roboto">' + results.rows.item(i).TASK_ADDRESS + '</span></p>';
								switch(results.rows.item(i).TASK_STATUS){
									case "ASSIGNED":
										vLI += '<span class="ui-li-count ui-btn ui-nodisc-icon ui-icon-bars ui-btn-icon-left small-roboto" style="background-color:yellow">&nbsp</span>';
										break;
									case "ACCEPTED":
										vLI += '<span class="ui-li-count small-roboto" style="background-color:lime">Aceptada</span>';
										break;
									case "COMPLETED":
										vLI += '<span class="ui-li-count small-roboto" style="background-color:blue">Completada</span>';
										break;
									default:
										vLI += '<span class="ui-li-count small-roboto" style="background-color:silver">Sin Status</span>';
										break;
								}
								vLI += '</a></li>'
								
								$("#pickup_listview").append(vLI);
								$("#pickup_listview").listview('refresh');	
							}							
							my_dialog("", "", "close");
						},
						function (err)
						{
							my_dialog("", "", "close");
							if (err.code != 0)
							{
								alert("(0)Error processing SQL: " + err.code);
							}
						}
					);
				},
				function (err)
				{
					if (err.code != 0)
					{
						alert("(1)Error processing SQL: " + err.code);
					}
				}
			);    
	   }
	   catch (e) { my_dialog("", "", "close"); console.log(e.message);}		
	}
	
	function preparedb()
    {
        SONDA_DB_Session = window.openDatabase("SONDA_PE_DB", "1.0", "SONDA_PE_DB",  20000000);//20mg

        SONDA_DB_Session.transaction(
            function (tx)
            {
                try
                {
                    /*
                    
                    */
					tx.executeSql('DROP TABLE IF EXISTS PICKUP_ROUTE');
                    tx.executeSql('CREATE TABLE IF NOT EXISTS PICKUP_ROUTE(TASK_ID, SCHEDULE_FOR, ASSIGNED_BY, ACCEPTED_STAMP, COMPLETED_STAMP, DOC_PARENT, EXPECTED_GPS, POSTED_GPS, TASK_COMMENTS, TASK_SEQ, TASK_ADDRESS, RELATED_CLIENT_PHONE_1, EMAIL_TO_CONFIRM, RELATED_CLIENT_NAME, TASK_PRIORITY, TASK_STATUS)');
                    
                }
                catch (e)
                {
                    notify(e.message);
                }
            },
            function (tx, error)//Fail
            {
                console.log(" ERROR EN TX ");
                console.log(error);
            },
            function ()//Success
            {
                my_dialog("", "", "close");
            }
        );
    }

function OnConfirmFinishPOS(buttonIndex)
{
    try
    {
        if (buttonIndex == 2)
        {
            my_dialog("Procesando", "Finalizando Ruta", "open");
            if(gIsOnline==1)
            {

                socket.emit("finish_route", {'routeid': gCurrentRoute,'loginid': gLastLogin});
            }else
            {
                notify("ERROR, Debe estar conectado al server para poder finalizar la ruta.");
                my_dialog("", "", "close");
            }
            my_dialog("", "", "close");

        }    

    }catch(e)
    {
        notify("OnConfirmFinishPOS:"+e.message);
    }
    
}
function startpos_action()
    {
        try
        {
            
            localStorage.setItem('POS_STATUS', 'OPEN');
            localStorage.setItem('POS_DATE', getDateTime());

            /* save sat auth. info to global variable */
            pCurrentSAT_Resolution = $("#lblCurrent_AuthID").text();
            pCurrentSAT_Res_Serie = $("#lblCurrent_Serie").text();

            
            /* show result on the page (invoices) */
            pCurrentSAT_Res_Date = $("#lblCurrent_DateAuth").text();
            pCurrentSAT_Res_DocStart = $("#lblCurrent_From").text();
            pCurrentSAT_Res_DocFinish = $("#lblCurrent_To").text();
            pCurrentInvoiceID = $("#lblCurrent_CurrentInvoice").text();

            /* show result on the page (notes) */
            pCurrentSAT_Resolution_notes = $("#lblCurrent_AuthID_notes").text();
            pCurrentSAT_Res_Serie_notes = $("#lblCurrent_Serie_notes").text();

            pCurrentSAT_Res_Date_notes = $("#lblCurrent_DateAuth_notes").text();
            pCurrentSAT_Res_DocStart_notes = $("#lblCurrent_From_notes").text();
            pCurrentSAT_Res_DocFinish_notes = $("#lblCurrent_To_notes").text();
            pCurrentNoteID = $("#lblCurrent_From_notes").text();
            
            
            /* show result on the page (invoices)*/
            $("#lblSumm_Autho").text(pCurrentSAT_Resolution);
            $("#lblSumm_Serie").text(pCurrentSAT_Res_Serie);
            $("#lblSumm_AuthDate").text(pCurrentSAT_Res_Date);
            $("#lblSumm_DocFrom").text(pCurrentSAT_Res_DocStart);
            $("#lblSumm_DocTo").text(pCurrentSAT_Res_DocFinish);
            $("#lblSumm_CurrentDoc").text(pCurrentInvoiceID);

            /* show result on the page (notes) */
            $("#lblSumm_Autho_notes").text(pCurrentSAT_Resolution_notes);
            $("#lblSumm_Serie_notes").text(pCurrentSAT_Res_Serie_notes);
            $("#lblSumm_AuthDate_notes").text(pCurrentSAT_Res_Date_notes);
            $("#lblSumm_DocFrom_notes").text(pCurrentSAT_Res_DocStart_notes);
            $("#lblSumm_DocTo_notes").text(pCurrentSAT_Res_DocFinish_notes);
            $("#lblSumm_CurrentDoc_notes").text(pCurrentNoteID);
            
            /* save results on device (invoices)*/        
            localStorage.setItem('POS_SAT_RESOLUTION',pCurrentSAT_Resolution); 
            localStorage.setItem('POS_SAT_RES_SERIE', pCurrentSAT_Res_Serie);   
            localStorage.setItem('POS_SAT_RES_DOC_START', pCurrentSAT_Res_DocStart);    
            localStorage.setItem('POS_SAT_RES_DOC_FINISH', pCurrentSAT_Res_DocFinish); 
            localStorage.setItem('POS_SAT_RES_DATE', pCurrentSAT_Res_Date) 
            localStorage.setItem('POS_CURRENT_INVOICE_ID', pCurrentInvoiceID); 

            /* save results on device (notes)*/        
            localStorage.setItem('POS_SAT_RESOLUTION_NOTES',pCurrentSAT_Resolution_notes); 
            localStorage.setItem('POS_SAT_RES_SERIE_NOTES', pCurrentSAT_Res_Serie_notes);   
            localStorage.setItem('POS_SAT_RES_DOC_START_NOTES', pCurrentSAT_Res_DocStart_notes);    
            localStorage.setItem('POS_SAT_RES_DOC_FINISH_NOTES', pCurrentSAT_Res_DocFinish_notes); 
            localStorage.setItem('POS_SAT_RES_DATE_NOTES', pCurrentSAT_Res_Date_notes) 
            localStorage.setItem('POS_CURRENT_CREDIT_NOTE', pCurrentSAT_Res_DocStart_notes); 

			//var pPercAlert = Number(localStorage.getItem('POS_CURRENT_ALERT'));
			var pPercAlert=75;
			/*
			var pLeftAuthInvoices = new Number;
			pLeftAuthInvoices  = 0;
			pCurrentInvoiceID = localStorage.getItem('POS_CURRENT_INVOICE_ID'); //POS_CURRENT_INVOICE_ID
			pLeftAuthInvoices = parseInt(pCurrentSAT_Res_DocFinish) - parseInt(pCurrentInvoiceID);
			*/
			var pPerc =0;
			/*
			pPerc = (Number(pCurrentInvoiceID) / Number(pCurrentSAT_Res_DocFinish)) *100;
			
			if(Number(pPerc) >= Number(pPercAlert)){
				notify("ALERTA, El rango de facturas emitidas ya rebaso el limite de alerta (" + pPerc+ "%)".\nComuniquese con su administrador");
			}
			*/
			
            console.log('getroute_inv_request');
            socket.emit('getroute_inv', {'routeid': gCurrentRoute});

            

        }
        catch (e) { notify("startpos_action:"+e.message); }
    }
function cust_list()
    {
        $.mobile.changePage('#dialog_cust_list', 'pop', true, true);
    }
function format_number(pnumber,decimals){

    if (isNaN(pnumber)) { return 0};

    if (pnumber=='') { return 0};

    var snum = new String(pnumber);

    var sec = snum.split('.');

    var whole = parseFloat(sec[0]);

    var result = '';

    if(sec.length > 1){

        var dec = new String(sec[1]);

        dec = String(parseFloat(sec[1])/Math.pow(10,(dec.length - decimals)));

        dec = String(whole + Math.round(parseFloat(dec))/Math.pow(10,decimals));
        var dot = dec.indexOf('.');
        if(dot == -1){

            dec += '.';

            dot = dec.indexOf('.');

        }

        while(dec.length <= dot + decimals) { dec += '0'; }

        result = dec;

    } else{

        var dot;

        var dec = new String(whole);

        dec += '.';

        dot = dec.indexOf('.');

        while(dec.length <= dot + decimals) { dec += '0'; }

        result = dec;

    }

    return result;

}
function ClearUpInvoice()
{
    //clear up client
    $("#txtNIT").val('');
    $("#txtNombre").val('');
    //clear up amounts
    $("#txtCash_summ").val('');
    $("#txtVuelto_summ").text('Q0.00');
    //clear up images
    gImageURI_1="";
    gImageURI_2="";
    gImageURI_3="";
    $('#btnTakePic1').buttonMarkup({ icon: "user" });
    $('#btnTakePic2').buttonMarkup({ icon: "user" });
    $('#btnTakePic3').buttonMarkup({ icon: "comment" });
    
    gPagado = 0;
    //reload sku list
    PopulateInvoiceSKUsList();

}
function SetSpecifiSKUQty(pQTY)
{
    var pSKU = $("#lblSKU_IDCant").attr("SKU");
    
    //AddSKU(pSKU, "", "", pQTY, 0, 0);
    
    $.mobile.changePage("#pos_skus_page", {transition: "none",reverse: true,changeHash: true,showLoadMsg: false});
}
function SelectClient(xid, xcust_name, xnit)
{
    $("#txtNIT").val(xnit);
    $("#txtNombre").val(xcust_name);
    $("#client_list_panel").panel("toggle");
}
function getDateTime() {
    var now     = new Date(); 
    var year    = now.getFullYear();
    var month   = now.getMonth()+1; 
    var day     = now.getDate();
    var hour    = now.getHours();
    var minute  = now.getMinutes();
    var second  = now.getSeconds(); 
    if(month.toString().length == 1) {
        var month = '0'+month;
    }
    if(day.toString().length == 1) {
        var day = '0'+day;
    }   
    if(hour.toString().length == 1) {
        var hour = '0'+hour;
    }
    if(minute.toString().length == 1) {
        var minute = '0'+minute;
    }
    if(second.toString().length == 1) {
        var second = '0'+second;
    }   
    var dateTime = year+'/'+month+'/'+day+' '+hour+':'+minute+':'+second;   
    return dateTime;
}
function LoadRemoteSKUs(){

    if (gCurrentRoute == "") { notify("ERROR, No hay ruta actual definida, contacte a su administrador de Sonda."); return -1; }
    //console.log(gCurrentRoute);

    socket.emit('getskus', {'routeid': gCurrentRoute});
    
    my_dialog("", "", "close");

}
function LoadRemoteSeries(){

    if (gCurrentRoute == "") { notify("ERROR, No hay ruta actual definida, contacte a su administrador de Sonda."); return -1; }
    console.log("getskuseries:"+gCurrentRoute);
    socket.emit('getskuseries', {'routeid': gCurrentRoute});
    
    my_dialog("", "", "close");

}
function hiddeskupanel(){
    var myPanel = $.mobile.activePage.children('[data-role="panel"]');
    myPanel.panel("close");

}

function PopulateSKUGrid()
{

    var xchild_list = 0;
    try
    {
        xchild_list = $('#skus_listview_panel').children().length;
        //alert('cuantos items cargados? ' + xchild_list);

    } catch (e) { }

        //my_dialog("Cargando listado SKUS", "Espere...", "open");

    SONDA_DB_Session.transaction(
    function (tx)
    {
        var pDoc = '';
        var pImg = '';

        var psql = 'SELECT A.SKU AS PARENT_SKU, A.SKU_NAME, A.IS_KIT, A.SKU_PRICE, '
        psql += 'IFNULL((SELECT B.ON_HAND FROM SKUS B WHERE B.PARENT_SKU = A.SKU AND B.EXPOSURE = 1),0) AS ON_HAND, '
        psql += 'IFNULL((SELECT B.ON_HAND FROM SKUS B WHERE B.PARENT_SKU = A.SKU AND B.EXPOSURE = 1),0) AS ON_HAND, '
        psql += '(SELECT B.SKU FROM SKUS B WHERE B.PARENT_SKU = A.SKU AND B.EXPOSURE = 1) AS SKU, '
        psql += '(SELECT B.REQUERIES_SERIE FROM SKUS B WHERE B.PARENT_SKU = A.SKU AND B.EXPOSURE = 1) AS REQUERIES_SERIE FROM SKUS A WHERE A.IS_PARENT=1'
        console.log(psql);

        tx.executeSql(psql, [],
            function (tx, results)
            {

                var xskus_len = (results.rows.length - 1);
                $('#skus_listview_panel').children().remove('li');

                for (i = 0; i <= xskus_len; i++)
                {
                    if (Number(results.rows.item(i).ON_HAND) > 0)
                    {
                       
                        try
                        {

                            var pREQUERIES_SERIE = results.rows.item(i).REQUERIES_SERIE;
                            var pIS_KIT = results.rows.item(i).IS_KIT;
                            var pSKU_PARENT = results.rows.item(i).PARENT_SKU;
                            var xonclick1 = 'AddSKU(' + "'" + results.rows.item(i).SKU + "','" + results.rows.item(i).SKU_NAME + "', '" + pSKU_PARENT + "'" + ');';

                            var xmsg;
                            if (pREQUERIES_SERIE == 1) { xmsg = "Se requiere info. adicional."; } else { xmsg = ""; }

                            vLI = '';
                            vLI = '<li data-icon="false" class="ui-alt-icon ui-nodisc-icon ui-shadow ui-icon-check">';
                            vLI = vLI + '<a href="#" onclick="' + xonclick1 + '">';
                            vLI = vLI + '<p><span class="small-roboto">' + results.rows.item(i).SKU_NAME + '</span></p>';
                            //vLI = vLI + '<fieldset class="ui-grid-b">'

                            vLI = vLI + '<p><span class="title ui-mini">Inventario:' + results.rows.item(i).ON_HAND + '</span>';
                            vLI = vLI + '<span class="title ui-mini"> Precio Q' + format_number(results.rows.item(i).SKU_PRICE, 2) + '</span></p> ';

                            //vLI = vLI + '<div class="ui-block-a"><span class="ui-btn-c ui-btn ui-shadow ui-alt-icon ui-nodisc-icon ui-icon-tag  ui-btn-icon-left ui-mini">' + results.rows.item(i).ON_HAND + '</span></div> ';
                            //vLI = vLI + '<div class="ui-block-b"><span class="ui-btn-c ui-btn ui-shadow ui-alt-icon ui-nodisc-icon ui-icon-shop ui-btn-icon-left ui-mini">Q' + format_number(results.rows.item(i).SKU_PRICE, 2) + '</span></div> ';

                            //vLI = vLI + '<div class="ui-block-c"><button class="ui-btn-c ui-btn ui-shadow ui-alt-icon ui-nodisc-icon ui-icon-info ui-mini ui-btn-icon-notext"></button></div> ';
                            vLI = vLI + '</li>';
                            vLI = vLI + '</fieldset></li>';
                            
                            $("#skus_listview_panel").append(vLI);

                        } catch (e) { notiy(e.message); }
                    }
                }
                $("#skus_listview_panel").listview('refresh');
                my_dialog("", "", "close");

            },
            function (err)
            {
                my_dialog("", "", "close");
                if (err.code != 0)
                {
                    alert("(2)Error processing SQL: " + err.code);
                }
            }
        );
    },
        function (err)
        {

            if (err.code != 0)
            {
                alert("(3)Error processing SQL: " + err.code);
            }
        }
    );    
    
    my_dialog("", "", "close");

}
function PopulateInvGrid()
{
   //my_dialog("Cargando listado SKUS", "Espere...", "open");

   try
   {

        SONDA_DB_Session.transaction(
            function (tx)
            {
                var pDoc = '';
                var pImg = '';
                
                tx.executeSql('SELECT * FROM SKUS', [],
                    function (tx, results)
                    {
                        
                        $('#inv_listview').children().remove('li');

                        for (i = 0; i <= (results.rows.length - 1); i++)
                        {
                        
                            vLI = '';
                            vLI = '<li class="ui-alt-icon ui-nodisc-icon ui-btn ui-shadow ui-btn-icon-tag">'
                            vLI += '<p><span class="medium">' + results.rows.item(i).SKU_NAME + '</span></p>'
                            vLI += '<p><span class="medium"> Precio: Q' + format_number(results.rows.item(i).SKU_PRICE,2) + '</span></p>'

                            if(results.rows.item(i).ONHAND >=1)
                            {
                                vLI = vLI + '<span class="ui-li-count">' + results.rows.item(i).ONHAND + '</span>'
                            }else
                            {
                                vLI = vLI + '<span class="ui-li-count" style="color:red">' + results.rows.item(i).ONHAND + '</span>'
                            }
                            
                            vLI = vLI + '</li>'
                            

                            $("#inv_listview").append(vLI);
                            
                        }
                        $("#inv_listview").listview('refresh');
                        my_dialog("", "", "close");
                    },
                    function (err)
                    {
                        my_dialog("", "", "close");
                        if (err.code != 0)
                        {
                            alert("(5)Error processing SQL: " + err.code);
                        }
                    }
                );
            },
            function (err)
            {
                if (err.code != 0)
                {
                    alert("(6)Error processing SQL: " + err.code);
                }
            }
        );    
   }
   catch (e) { my_dialog("", "", "close"); console.log(e.message);}

   

}
function ReturnSkus()
{
    $.mobile.changePage("#pos_skus_page", {
        transition: "none",
        reverse: true,
        changeHash: true,
        showLoadMsg: false
    });
}
function UpdateSKUSeries(pSKU, pLINE_SEQ, pSN, pIMEN, pPHONE)
{
    /*
    var pLINE_SEQ = $("#lblSKU_IDName_Serie").attr('LineSeq');
    var pSN = $("#txtSerie_series").val();
    var pIMEN = $("#txtImei_series").val();
    */
    

    try
    {
        SONDA_DB_Session.transaction(
            function (tx)
            {
                var pSQL1 = 'UPDATE INVOICE_DETAIL SET SERIE = "' + pSN + '", SERIE_2 = "' + pIMEN + '", PHONE = "'+pPHONE+'" WHERE INVOICE_NUM = -9999 AND LINE_SEQ = ' + pLINE_SEQ;
                //console.log(pSQL1);
                tx.executeSql(pSQL1);


                pSQL1 = 'UPDATE SKU_SERIES SET STATUS = 3 WHERE SKU = "' + pSKU + '" AND SERIE = "' + pSN + '"'
                //console.log(pSQL1);
                tx.executeSql(pSQL1);

                PopulateInvoiceSKUsList();
                
                $.mobile.changePage("#pos_skus_page", {
                    transition: "none",
                    reverse: true,
                    changeHash: true,
                    showLoadMsg: false
                });

            },
            function (err)
            {
                if (err.code != 0)
                {
                    alert("(7)Error processing SQL: " + err);
                }
            }
        )
    }catch(e){console.log(e.message); notify("jv.catch.10.5.6: "+e.message);}
}
function closeprinter()
{
    bluetoothSerial.disconnect(function(){alert('Printer is disconnected');},function(){alert('Printer is unable to get disconnected');});
}
function printinvoice_joininfo(pInvoiceID, pIsRePrinted)
{
    var lheader = "";
    var ldetail = "";
    var lfooter = "";

    try
    {
        pSQL = "SELECT A.*, B.* FROM INVOICE_HEADER A, INVOICE_DETAIL B WHERE A.INVOICE_NUM = " + pInvoiceID 
        pSQL += " AND B.INVOICE_NUM = A.INVOICE_NUM AND A.IS_CREDIT_NOTE = 0 AND B.IS_ACTIVE = 1 AND B.EXPOSURE = 1";

        SONDA_DB_Session.transaction(
        function (tx)
        {
            tx.executeSql(pSQL, [],
                function (tx, results)
                {
                    var print_doc_len = new Number();
					var pExpiresAuth = localStorage.getItem('SAT_RES_EXPIRE');

                    print_doc_len = 290; //header;
                    print_doc_len += parseInt(parseInt(results.rows.length) * 150); //detail
                    print_doc_len += parseInt(290); //footer
					
					var pRes = localStorage.getItem('POS_SAT_RESOLUTION');

                    lheader = "! 0 50 50 " + print_doc_len + " 1\r\n";
                    lheader += "! U1 LMARGIN 10\r\n! U\r\n! U1 PAGE-WIDTH 1400\r\nON-FEED IGNORE\r\n";
                    lheader += "CENTER 550 T 1 2 0 10 Ways, S.A / Ways, Zacapa\r\n"
                    lheader += "CENTER 550 T 0 2 0 60 Calzada La Paz, Ofibodega Centro 5, Bodega #13 18-40, Guatemala Ciudad\r\n";
                    lheader += "CENTER 550 T 0 2 0 90 SUJETO A PAGOS TRIMESTRALES\r\n";
                    lheader += "CENTER 550 T 0 2 0 120 NIT: 3517713-6\r\n";
                    lheader += "CENTER 550 T 0 2 0 150 Resolución #: " + pRes + " \r\n";
                    lheader += "CENTER 550 T 0 2 0 180 Fecha Auto. : " + pCurrentSAT_Res_Date + " \r\n";
					lheader += "CENTER 550 T 0 2 0 210 Resol.Vence : " + pExpiresAuth + " \r\n";
                    lheader += "CENTER 550 T 0 2 0 240 Del: " + pCurrentSAT_Res_DocStart + " Al: " + pCurrentSAT_Res_DocFinish + "\r\n";
                    lheader += "CENTER 550 T 0 3 0 280 Factura Serie " + results.rows.item(0).SAT_SERIE + " # " + pInvoiceID + "\r\n";
                    lheader += "L 5 310 570 310 1\r\n";
                    lheader += "CENTER 550 T 0 2 0 340 A NOMBRE DE: NIT:" + results.rows.item(0).CLIENT_ID + "-" + results.rows.item(0).CLIENT_NAME + "\r\n";
                    lheader += "L 5 370 570 370 1\r\n";

                    var pRow = 410;

                    ldetail = "";
                    var pImei = 0;
                    var pImeiPrint = 0;

                    for (i = 0; i <= (results.rows.length - 1); i++)
                    {
                        
                        ldetail = ldetail + "LEFT 5 T 0 2 0 " + pRow + " " + results.rows.item(i).SKU + "- " + results.rows.item(i).SKU_NAME + "\r\n";
                        pRow += parseInt(30);

                        ldetail = ldetail + "LEFT 5 T 0 2 0 " + pRow + " CANTIDAD: " + results.rows.item(i).QTY + " / PREC.UNIT. : Q" + format_number(results.rows.item(i).PRICE, 2) + "\r\n";
                        pRow += parseInt(30);

                        pImei = results.rows.item(i).SERIE_2;
                        if (isNaN(pImei))
                        {
                            pImeiPrint = 0;
                        }else
                        {
                            pImeiPrint = pImei;
                        }

                        ldetail = ldetail + "LEFT 5 T 0 2 0 " + pRow + " SERIE: " + results.rows.item(i).SERIE + "/ IMEI: " + pImeiPrint + "/ " + results.rows.item(i).PHONE + "\r\n";
                        pRow += parseInt(30);

                        ldetail = ldetail + "RIGHT 550 T 0 2 0 " + (pRow - 90) + " Q" + format_number(results.rows.item(i).PRICE, 2) + "\r\n";

                        ldetail = ldetail + "L 5 " + pRow + " 570 " + pRow + " 1\r\n";
                        pRow += parseInt(10);

                    };

                    pRow += parseInt(30);
                    lfooter = "LEFT 5 T 0 2 0 " + pRow + " TOTAL: \r\n";
                    lfooter = lfooter + "RIGHT 550 T 0 2 0 " + pRow + " Q" + format_number(results.rows.item(0).TOTAL_AMOUNT, 2) + "\r\n";

                    pRow += parseInt(30);
                    lfooter += "LEFT 5 T 0 2 0 " + pRow + " EFECTIVO: \r\n";
                    lfooter += "RIGHT 550 T 0 2 0 " + pRow + " Q" + format_number(Number(results.rows.item(0).TOTAL_AMOUNT) + Number(results.rows.item(0).CHANGE), 2) + "\r\n";

                    pRow += parseInt(30);
                    lfooter += "LEFT 5 T 0 2 0 " + pRow + " CAMBIO: \r\n";
                    lfooter += "RIGHT 550 T 0 2 0 " + pRow + " Q" + format_number(results.rows.item(0).CHANGE, 2) + "\r\n";

                    pRow += parseInt(30);
                    lfooter += "CENTER 550 T 0 2 0 " + pRow + " " + getDateTime() + " / RUTA " + gCurrentRoute + " \r\n";

                    pRow += parseInt(30);
                    lfooter += lfooter + "L 5  " + pRow + " 570 " + pRow + " 1\r\n";

                    pRow += parseInt(30);
                    lfooter += "CENTER 550 T 0 2 0 " + pRow + " " + pIsRePrinted + "\r\nPRINT\r\n";

                    //pIsRePrinted lfooter = lfooter + "";CENTER 550 T 0 2 0 " + pRow + " " + getDateTime() + " / RUTA " + gCurrentRoute + " \r\n
                    pCpCl = (lheader + ldetail + lfooter);
                    var x = 0;

                    for (i = 0; i <= 1; i++)//print twice, one copy for the client, one for backoffice.
                    {
                        bluetoothSerial.write(pCpCl, function () { }, function () { alert('unable to write to printer'); });

                        if (i === 0)
                        {
                            lfooter = "CENTER 550 T 0 2 0 50 *** ORIGINAL CLIENTE ***\r\n";
                        } else
                        {
                            lfooter = "CENTER 550 T 0 2 0 50 *** COPIA CONTABILIDAD ***\r\n";
                        }

                        lfooter = lfooter + "L 5  80 570 80 1\r\nPRINT\r\n";
                        print_doc_len = 150;

                        lheader = "! 0 50 50 " + print_doc_len + " 1\r\n";
                        lheader += "! U1 LMARGIN 10\r\n! U\r\n! U1 PAGE-WIDTH 1400\r\nON-FEED IGNORE\r\n";
                        bluetoothSerial.write(lheader + lfooter, function () { }, function () { alert('unable to write to printer'); });

                    }

                    bluetoothSerial.disconnect(function () { }, function () { alert('Printer is unable to get disconnected'); });

                    my_dialog("", "", "close");

                },
                function (err)
                {
                    my_dialog("", "", "close");
                    notify("ERROR, 8.1.17: " + err.code);
                    return err.code;
                }
            );
        });
        my_dialog("", "", "close");
        
    }catch(e)
    {
        notify(e.message);
        my_dialog("", "", "close");
        return e.message;
    }
}
function printinvoice(pInvoice, pIsRePrinted)
{
    try
    {
         my_dialog("Imprimiendo Factura", "#"+pInvoice+" Espere...", "open");
         bluetoothSerial.isConnected(
            function ()
            {
                printinvoice_joininfo(pInvoice, pIsRePrinted);
            },
            function ()
            {
                try
                {
                    bluetoothSerial.connect
                    (gPrintAddress,
                        function ()
                        {
                            printinvoice_joininfo(pInvoice, pIsRePrinted);
                        },
                        function ()
                        {
                            my_dialog("", "", "close");
                            notify("ERROR, Unable to connect to the printer.("+gPrintAddress+")");
                        }
                    );
                } catch (e)
                {
                    my_dialog("", "", "close");
                    notify(e.message);
                }
            }
        );
    } 
    catch (e) 
    {
        my_dialog("", "", "close");
        alert('cannot print '+e.message);
    }
}
function onBatteryStatus(info) {
    // Handle the online event
    gBatteryLevel = info.level;
    $("#lblBattLevelLogin").text(gBatteryLevel+"%");
    $('#lblBattLevelLogin').buttonMarkup({ icon: "gear" });
    $("#lblBattLevelLogin").css("color","white");

    $("#lblBattLevelMenu").text(gBatteryLevel+"%");
    $('#lblBattLevelMenu').buttonMarkup({ icon: "gear" });
    $("#lblBattLevelMenu").css("color","white");
   
    $("#lblBattLevelTask").text(gBatteryLevel+"%");
    $('#lblBattLevelTask').buttonMarkup({ icon: "gear" });
    $("#lblBattLevelTask").css("color","white");

    $("#lblBattLevelPickupPlan").text(gBatteryLevel+"%");
    $('#lblBattLevelPickupPlan').buttonMarkup({ icon: "gear" });
    $("#lblBattLevelPickupPlan").css("color","white");

    
}
function onBatteryCritical(info) {
    // Handle the battery critical event
    gBatteryLevel = info.level;

    $("#lblBattLevelLogin").text(gBatteryLevel+"%");
    $('#lblBattLevelLogin').buttonMarkup({ icon: "delete" });
    $("#lblBattLevelLogin").css("color","white");

    $("#lblBattLevelMenu").text(gBatteryLevel+"%");
    $('#lblBattLevelMenu').buttonMarkup({ icon: "delete" });
    $("#lblBattLevelMenu").css("color","red");

    $("#lblBattLevelTask").text(gBatteryLevel+"%");
    $('#lblBattLevelTask').buttonMarkup({ icon: "delete" });
    $("#lblBattLevelTask").css("color","white");

    $("#lblBattLevelPickupPlan").text(gBatteryLevel+"%");
    $('#lblBattLevelPickupPlan').buttonMarkup({ icon: "delete" });
    $("#lblBattLevelPickupPlan").css("color","white");

    notify("Battery Level Critical " + info.level + "%\n Recarge pronto!");
}
function onBatteryLow(info) {
    // Handle the battery low event
    gBatteryLevel = info.level;
    $("#lblBattLevelLogin").text(gBatteryLevel+"%");
    $('#lblBattLevelLogin').buttonMarkup({ icon: "alert" });
    $("#lblBattLevelLogin").css("color","white");

    $("#lblBattLevelMenu").text(gBatteryLevel+"%");
    $('#lblBattLevelMenu').buttonMarkup({ icon: "alert" });
    $("#lblBattLevelMenu").css("color","red");

    $("#lblBattLevelTask").text(gBatteryLevel+"%");
    $('#lblBattLevelTask').buttonMarkup({ icon: "alert" });
    $("#lblBattLevelTask").css("color","white");

    $("#lblBattLevelPickupPlan").text(gBatteryLevel+"%");
    $('#lblBattLevelPickupPlan').buttonMarkup({ icon: "alert" });
    $("#lblBattLevelPickupPlan").css("color","white");

    alert("Battery Level Low " + info.level + "%");
}
function ShowInventoryPage()
{
    $.mobile.changePage("#inv_page", {
        transition: "none",
        reverse: true,
        changeHash: true,
        showLoadMsg: false
    });
    
    PopulateInvGrid();
}
function ShowInvoiceListPage()
{
    listallinvoices();
    $.mobile.changePage("#invoice_list_page", {
        transition: "slide",
        reverse: true,
        changeHash: true,
        showLoadMsg: false
    });
    
}
function listallinvoices()
{
    
    try
    {

        SONDA_DB_Session.transaction(
            function (tx)
            {
                var vLI = '';
                //INVOICE_HEADER(INVOICE_NUM, TERMS, POSTED_DATETIME, CLIENT_ID, CLIENT_NAME, POS_TERMINAL, GPS, TOTAL_AMOUNT, ERP_INVOICE_ID, IS_POSTED, STATUS, IS_CREDIT_NOTE, VOID_REASON, VOID_NOTES)
                tx.executeSql('SELECT * FROM INVOICE_HEADER WHERE IS_CREDIT_NOTE = 0 ORDER BY INVOICE_NUM', [],
                    function (tx, results)
                    {
                        $('#invoiceslist_listview').children().remove('li');
                        $("#invoiceslist_listview").listview();
                        var xonclick1 = '';
                        for (i = 0; i <= (results.rows.length - 1); i++)
                        {

                            var pIS_POSTED = results.rows.item(i).IS_POSTED;
                            var pSTATUS = results.rows.item(i).STATUS;
                            

                            xonclick1 = "showInvoiceActions(" + results.rows.item(i).INVOICE_NUM + "," + format_number(results.rows.item(i).TOTAL_AMOUNT, 2) + ",'" + results.rows.item(i).CLIENT_NAME + "');";

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
                            if (results.rows.item(i).STATUS == 3)
                            {
                                vLI = '<li class="ui-nodisc-icon ui-alt-icon">';
                                vLI = vLI + '<p><span class="title" style="color:red">'+xmsg+' Factura #' + results.rows.item(i).INVOICE_NUM + ' (Anulada)</span></p>';
                                
                            }else
                            {
                                vLI = '<li class="ui-nodisc-icon ui-alt-icon" onclick="' + xonclick1 + '">';   
                                vLI = vLI + '<p><span class="title">'+xmsg+' Factura #' + results.rows.item(i).INVOICE_NUM + '</span></p>';
                            }
                            vLI = vLI + '<p><span class="medium">' + results.rows.item(i).CLIENT_NAME + '</span></p>';
                            
                            vLI = vLI + '<p><span class="medium">' + results.rows.item(i).POSTED_DATETIME+'</span></p>';
                            vLI = vLI + '<p><span class="small-roboto ui-li-count">Q ' + format_number(results.rows.item(i).TOTAL_AMOUNT, 2); +'</span></p>'
                            vLI = vLI + '</li>';
                            console.log(vLI);
                            try
                            {
                                $("#invoiceslist_listview").append(vLI).trigger('create');
                                $("#invoiceslist_listview").listview('refresh');
                            } catch (e) { notify(e.message); console.log('error: ' + e.message); }
                        }

                        my_dialog("", "", "close");
                    },
                    function (err)
                    {
                        if (err.code != 0)
                        {
                            alert("(8)Error processing SQL: " + err.code);
                        }
                    }
                );
            },
            function (err)
            {
                if (err.code != 0)
                {
                    alert("(9)Error processing SQL: " + err.code);
                }
            }
        );   

        my_dialog("", "", "close");

    } 
    catch (e) { notify(e.message); console.log('show invoices cath: '+ e.message); }

}
function showinvoicedetail(pInvoiceID)
    {
        
        try
        {

            SONDA_DB_Session.transaction(
                function (tx)
                {
                    var vLI = '';
                    tx.executeSql('SELECT * FROM INVOICE_DETAIL WHERE INVOICE_NUM ='+pInvoiceID+ ' AND EXPOSURE = 1', [],
                        function (tx, results)
                        {
                            $('#fldDetailView').children().remove('div');

                            for (i = 0; i <= (results.rows.length - 1); i++)
                            {

                                vLI = '';
                                vLI = '<div data-role="collapsible" class="ui-nodisc-icon ui-alt-icon" data-mini="true" data-collapsed-icon="carat-d" data-expanded-icon="carat-u"  data-inset="true">'
                                vLI += '<h4><span class="small-roboto">'+ results.rows.item(i).SKU_NAME +'</span></h4>'
                                vLI += '<ul data-role="listview" data-inset="false" data-count-theme="b">'
                                vLI += '<li><span class="medium">Cantidad: '+ results.rows.item(i).QTY +'</span>'
                                vLI += '<span class="small-roboto ui-li-count">Q'+ format_number(results.rows.item(i).PRICE,2) +'</span></li>'
                                vLI += '<li><span class="medium">Celular: '+ results.rows.item(i).PHONE +'</span></li>'
                                vLI += '<li><span class="medium">Serie: '+ results.rows.item(i).SERIE +'</span></li>'
                                vLI += '<li><span class="medium">#IMEI: '+results.rows.item(i).SERIE_2+'</span></li></ul></div>'
                                vLI += ''

                                try
                                {
                                    $("#fldDetailView").append(vLI).trigger('create');
                                } catch (e) { console.log('? ' + e.message); }
                            }
                            $("#fldDetailView").listview('refresh');
                            my_dialog("", "", "close");
                        },
                        function (err)
                        {
                            if (err.code != 0)
                            {
                                alert("(10)Error processing SQL: " + err.code);
                            }
                        }
                    );
                },
                function (err)
                {
                    if (err.code != 0)
                    {
                        alert("(11)Error processing SQL: " + err.code);
                    }
                }
            );   

            my_dialog("", "", "close");
        } 
        catch (e) { notify(e.message); }
    }
function viewinvoice(pInvoiceID, pInvoiceCustName, pAmount)
{
    try
    {
        $("#invoice_view_id").text(pInvoiceID);
        $("#invoice_view_custname").text(pInvoiceCustName);
        $("#invoice_view_amount").text('Q' + format_number(pAmount, 2));

        $.mobile.changePage("#view_invoice_page", {
            transition: "slidedown",
            reverse: true,
            changeHash: true,
            showLoadMsg: false
        });
        showinvoicedetail(pInvoiceID);

    } catch (e) { notify(e.message); }
}

function onDeviceReady()
{
    
    var pDebug = '1';
    try
    {
        
		$("#login_isonline").text("OFF");
		$("#lblNetworkLogin").text("OFF");
		$("#lblNetworkDeliveryMenu").text("OFF");
		
        delegate_events();
        console.log('io.connect('+SondaServerURL+')');
        try
        {
            $("#login_isonline").text("/");
            if (!socket.socket.connected)
            {
                pDebug = '3';
                socket = io.connect(SondaServerURL);
            }
            
        }catch(e)
        {
            pDebug = '4';
            
            socket = io.connect(SondaServerURL);
            pDebug = '5';
        }
        console.log('delegate socket events');
        delegate_socket_core();
        delegate_socket_login();
		delegate_socket_pickup();
		console.log('socket events delegated');

        if(gPrepared==0)
        {
            try
            {
                preparedb();
                gPrepared = 1;    
            }catch(e)
            {
                notify(e.message);
            }
        }

        $("#svr_addr").text(baseURL);
        $("#login_panel").css({ opacity: 0.85 });
        $("#mainmenu_panel").css({ opacity: 0.85 });
        $("#lstmainlist").css({ opacity: 0.50 });
        $("#lstmainfield").css({ opacity: 0.50 });
        $("#loginfieldset").css({ opacity: 0.90 });
        
		UpdateLoginInfo("get");
		$("#txtPin").focus();
        var pPOSStatus = "CLOSED" 
        
        if(pPOSStatus!="CLOSED")
        {
            $.mobile.changePage("#menu_page", {
                transition: "none",
                reverse: false,
                showLoadMsg: false
            });
            ToastThis('Bienvenido '+gLastLogin+'@'+gCurrentRoute);
        }
    }catch(e)
    {
		console.log(e.message);
        alert("onDeviceReady:"+e.message);
    }
    
}
function ReleaseUnsedSeries()
{
    try
    {
        SONDA_DB_Session.transaction(
                function (tx)
                {
                    var pSQL = "";
                    try
                    {
                        pSQL = "UPDATE SKU_SERIES SET STATUS = 0 WHERE STATUS = 3";
                        tx.executeSql(pSQL);
                    }
                    catch(e)
                    {
                        notify(e.message);           
                    }
                }
            );
    }catch(e)
    {
        notify(e.message);
    }
}
function ReleaseUnsedSKUs()
{
    try
    {
        SONDA_DB_Session.transaction(
                function (tx)
                {
                    var pSQL = "";
                    try
                    {
                       // pSQL = "DELETE FROM INVOICE_HEADER WHERE STATUS = 3";
                       // tx.executeSql(pSQL);

                        pSQL = "DELETE FROM INVOICE_DETAIL WHERE INVOICE_NUM = -9999";
                        tx.executeSql(pSQL);

                        ReleaseUnsedSeries();

                        localStorage.setItem('POS_ITEM_SEQ', 0);
                    }
                    catch (e)
                    {
                        notify(e.message);
                    }
                }
            );
    }catch(e)
    {
        notify(e.message);
    }
}
function onResume()
{
    /*
    try
    {
        SONDA_DB_Session.transaction(
                function (tx)
                {
                    var pSQL = "";
                    try
                    {
                       // pSQL = "DELETE FROM INVOICE_HEADER WHERE STATUS = 3";
                       // tx.executeSql(pSQL);

                        pSQL = "DELETE FROM INVOICE_DETAIL WHERE INVOICE_NUM = -9999";
                        tx.executeSql(pSQL);

                        ReleaseUnsedSeries();

                        localStorage.setItem('POS_ITEM_SEQ', 0);
                    }
                    catch (e)
                    {
                        notify(e.message);
                    }
                }
            );
    }catch(e)
    {
        notify(e.message);
    }
    */
}
function delegate_events()
{
    document.addEventListener("menubutton", onMenuKeyDown, true);
    document.addEventListener("backbutton", onBackKeyDown, true);
    document.addEventListener("online", DeviceIsOnline, false);
    document.addEventListener("offline", DeviceIsOffline, false);
    
    //document.addEventListener("resume", onResume, false);
    
    window.addEventListener("batterystatus", onBatteryStatus, true);
    window.addEventListener("batterycritical", onBatteryCritical, true);
    window.addEventListener("batterylow", onBatteryLow, true);
    
    

    $("#btnLogme").bind("touchstart", function () { ValidateCredentials(); });
    $("#btnGetBankAccounts").bind("touchstart", function () { showBankAccounts(); });
    
    $("#btnShowPrinterConfig").bind("touchstart",function (){ $.mobile.changePage("#printer_page", {transition: "none",reverse: true,changeHash: true,showLoadMsg: false}); exploredevices();});
    $("#btnTryPrinter").bind("touchstart", function () { TryPrinter(); });
    $("#btnSavePrinter").bind("touchstart", function () { SavePrinter(); });
    $("#btnMyDeliveryRoute").bind("touchstart", function () { RefreshMyRoutePlan(); });
    $("#btnOut").bind("touchstart", function () { console.log('bye...bye'); navigator.app.exitApp();  });
    $("#btnPrintIT").bind("touchstart", function () { printinvoice(gInvoiceNUM, ""); });

    $(document).on("pageshow", "#pos_skus_page", function (){});
    
        
    $("#btnCloseInvoiceDialog").bind("touchstart", function () { $("#invoice_actions_dialog").popup("close");});
    $("#btnRePrintInvoice").bind("touchstart", function () { printinvoice(gInvoiceNUM, "***RE-IMPRESO***"); });
    $("#btnVoidInvoice").bind("touchstart", function () { showvoidinvoice(gInvoiceNUM); });
    $("#btnProcessVoidInvoice").bind("touchstart", function () { ProcessVoidInvoice(gInvoiceNUM); });
        
    $("#btnGetImagesInvoice").bind("touchstart", function () { alert(gInvoiceNUM); });
    $("#btnShowDeposit").bind("touchstart", function () { showdepositform(); });

    $("#btnFinishPOS").bind("touchstart", function () { closepos_action(); });
    $("#btnLogByScan").bind("touchstart", function () { scanloginid(); });
    $("#btnStartPOS").bind("touchstart", function () { startpos(); });
    $("#btnStartPOS_action").bind("touchstart", function () { startpos_action(); });
    $("#btnQuit").bind("touchstart", function () { navigator.app.exitApp(); });
    $("#btnPOS").bind("touchstart", function () { start_invoicing(); });
    $("#btnListingClient").bind("touchstart", function () { cust_list(); });
    
    $("#panelTotalSKU").bind("touchstart", function () { TotalSKU_Click(); });
    $("#btnOK_series").bind("touchstart", function () { UpdateSKUSeries(); });
    
    $("#btnCancel_series").bind("touchstart", function () { ReturnSkus(); });
    $("#btnContinue_Client").bind("touchstart", function () { ContinueToSkus(); });
    $("#btnSetCF").bind("touchstart", function () { SetCF(); });
    $("#panelTotalSKUSumm").bind("touchstart", function () { ConfirmPostInvoice(); });
    $("#btnConfirmedInvoice").bind("touchstart", function () { ConfirmedInvoice(); });

    $("#btnPreviewImg1").bind("touchstart", function () { preview_picture('1'); });
    $("#btnPreviewImg2").bind("touchstart", function () { preview_picture('2'); });
    $("#btnPreviewImg3").bind("touchstart", function () { preview_picture('3'); });

    $("#btnTakePic1").bind("touchstart", function () { take_picture('1'); });
    $("#btnTakePic2").bind("touchstart", function () { take_picture('2'); });
    $("#btnTakePic3").bind("touchstart", function () { take_picture('3'); });

    $("#btnTakePicDepositBank").bind("touchstart", function () { take_picture_deposit(); });
    $("#btnMakeDepositBank").bind("touchstart", function () { ProcessDeposit(); });

    $("#btnViewInv").bind("touchstart", function () { ShowInventoryPage(); });
    $("#btnInvoiceList").bind("touchstart", function () { ShowInvoiceListPage(); });
    
    $("#btnDepositsList").bind("touchstart", function () { ShowDepositsListPage(); });
    $("#btnDepositsListSumm").bind("touchstart", function () { ShowDepositsListPage(); });
    
    
    $(document).on("pageshow", "#menu_page", function ()
    {
        ShowHideOptions();
    });

    $(document).on("pageshow", "#pos_client_page", function ()
    {
        SetCF();
        ReleaseUnsedSKUs();
    });

    $(document).on("pageshow", "#summary_page", function ()
    {
        //my_dialog("Total", "total", "open");
        
        $('#txtCash_summ').focus();
        
        //navigator.notification.activityStop();
        //my_dialog("Total", "total", "close");

        
    });

    $(document).on("pageshow", "#deposit_page", function ()
    {
        
        $("#lblSold_Dep").text(format_number(gTotalInvoiced, 2));
        $("#lblDeposited_Dep").text(format_number(gTotalDeposited, 2));
        $("#txtDepositAmount").val(format_number(gTotalInvoiced - gTotalDeposited, 2));

        $("#btnTakePicDepositBank").attr("srcpic", "");
        $('#btnTakePicDepositBank').buttonMarkup({ icon: "user" });

        $("#btnMakeDepositBank").css("visibility", "hidden");

        $("#lblBankName").text();
        $("#lblBankAccount").text();

    });

    $(document).on("pageshow", "#series_page", function () { $("#txtSerie_series").focus(); });

    $('#invoice_actions_dialog').on('popupafteropen', function ()
    {
        gPanelOptionsIsOpen = 1;
    }).on('popupafterclose', function ()
    {
        gPanelOptionsIsOpen = 0;
    });

    $("#pos_skus_page").on("swiperight", pos_skus_swipeHandler);

    $("#pos_client_page").on("swipeleft", function ()
    {
        ContinueToSkus();
    });
    $("#pos_client_page").on("swiperight", function ()
    {
        $.mobile.changePage("#menu_page", {
            transition: "none",
            reverse: true,
            changeHash: true,
            showLoadMsg: false
        });
    });

    $("#menu_page").on("swipeleft", function ()
    {
        start_invoicing();
    });

    $("#login_page").on("swiperight",
        function ()
        {
            var myPanel = $.mobile.activePage.children('[data-role="panel"]');
            myPanel.panel("toggle");
        });

    $("#pos_skus_page").on("swipeleft", "#pos_skus_page_listview li", pos_sku_swipeHandler);

    $("#menu_page").on("swiperight", 
        function(){
            var myPanel = $.mobile.activePage.children('[data-role="panel"]');
            myPanel.panel("toggle");
        });

        $("#txtNIT").keypress(function (event)
        {

            if (event.which == 13)
            {
                //alert('?');
                
                $("#txtNombre").focus();
                SoftKeyboard.show();
                event.preventDefault();
            }
        });
		
		$("#txtPin").keypress(function (event)
        {

            if (event.which == 13)
            {
				ValidateCredentials();
                event.preventDefault();
            }
        });

        $('#txtNIT').keyup(function() {
            event.preventDefault();
            $("#txtNombre").val('');
            
        });
  
    $("#txtCash_summ").keyup(function (event)
    {
        try
        {
            var pTotal = new Number();
            var pCash = new Number();
            var pVuelto = new Number();

            pTotal = parseFloat($("#lblTotalSKU_summ").text());
            gInvocingTotal = pTotal;

            pCash = parseFloat($("#txtCash_summ").val());
            pVuelto = Number(Number(pCash) - Number(pTotal));

            $("#txtVuelto_summ").text(format_number(pVuelto, 2));

            if (pCash < pTotal) { gPagado = 0; } else { gPagado = 1; }

        }
        catch (e) { console.log(e.message); }


    });

}
function SetSKUSeries(pSKU, pSKU_NAME, pLineSeq)
{
    
    $.mobile.changePage("#series_page", {
        transition: "slide",
        reverse: true,
        changeHash: true,
        showLoadMsg: false
    });
    PopulateSKUSeriesGrid(pSKU, pLineSeq);

}
function SetSKUCant(pSKU, pSKU_NAME, pLineSeq)
{
    $("#lblSKU_IDCant").text(pSKU + " " + pSKU_NAME);
    $("#lblSKU_IDCant").attr("LineSeq", pLineSeq);
    $("#lblSKU_IDCant").attr("SKU", pSKU);
    
    $.mobile.changePage("#skucant_page", {
        transition: "none",
        reverse: true,
        changeHash: true,
        showLoadMsg: false
    });
}
function TotalSKU_Click()
{
    if (gInvocingTotal > 0)
    {
        var pTotal = $("#lblTotalSKU").text();
        var pNit = $("#txtNIT").val();
        var pCustName = $("#txtNombre").val();

        $("#lblTotalSKU_summ").text(pTotal);

        $("#lblClientName_summ").text(pNit + '-' + pCustName);
        $("#lblClientName_summ").attr('taxid', pNit);
        $("#lblClientName_summ").attr('clientid', pNit);

        SoftKeyboard.show();
        $.mobile.changePage("#summary_page", {
            transition: "none",
            reverse: true,
            changeHash: true,
            showLoadMsg: false
        });
        $('#txtCash_summ').focus();
        $('#txtCash_summ').focus();
        

    } else { notify('ERROR, Total no puede ser cero.'); }
    
}
function ShowViewPicture()
{
    $("#popupPic").popup("open", {positionTo: 'window', transtion:"slideup"});
}
function showInvoiceActions(pInvoiceID, pAmount, pClientName)
{
    // Prepare the picker configuration
    var config = {
        title: "Opciones", 
        items: [
            { text: "Re-imprimir", value: "reprint" },
            { text: "Anular", value: "void" },
            { text: "Ver Detalle", value: "detail" }
        ],
        //selectedValue: "reprint",
        doneButtonLabel: "Ok",
        cancelButtonLabel: "Cancelar"
    };
    
    // Show the picker
    window.plugins.listpicker.showPicker(config,
        function (item)
        {
            gInvoiceNUM = pInvoiceID;
            switch (item)
            {
                case "reprint":
                    printinvoice(gInvoiceNUM, "*** RE-IMPRESO ***")
                    break;
                case "void":
                    showVoidOptions(pInvoiceID)
                    break;
                case "detail":
                    viewinvoice(gInvoiceNUM,pClientName,pAmount);
                    break;
            }
        }
    );
}
function showVoidOptions(pInvoiceID)
{
    SONDA_DB_Session.transaction(
        function (tx)
        {
            var pDoc = '';
            var pImg = '';

            //tx.executeSql('SELECT * FROM SKUS WHERE EXPOSURE = 1 AND ON_HAND > 0', [],
            var psql = 'SELECT * FROM VOID_REASONS ';
            console.log(psql);
            tx.executeSql(psql, [],
                function (tx, results)
                {

                    var xskus_len = (results.rows.length - 1);
                    gVoidReasons = [];
                    for (i = 0; i <= xskus_len; i++)
                    {
                        try
                        {
                            gVoidReasons.push(
                                    {
                                        text: results.rows.item(i).REASON_DESCRIPTION,
                                        value: results.rows.item(i).REASON_ID
                                    }
                                );

                        } catch (e) { notiy(e.message); }
                    }
                    console.log(gVoidReasons);
                    var config_options = {
                        title: "Motivos de anulación",
                        items: gVoidReasons,
                        doneButtonLabel: "Ok",
                        cancelButtonLabel: "Cancelar"
                    };
                        
                    window.plugins.listpicker.showPicker(config_options,
                        function (item)
                        {
                            navigator.notification.confirm(
                                "Confirma Anulacion?",  // message
                                function (buttonIndex)
                                {
                                    if (buttonIndex == 2)
                                    {
                                        my_dialog("Anulando factura", "Procesando...", "close");
                                        ProcessVoidInvoice(pInvoiceID, item, item);
                                        my_dialog("", "", "close");
                                    }
                                },   // callback to invoke with index of button pressed
                                'Sonda® POS ' + device.cordova,   // title
                                'No,Si'    // buttonLabels
                            );

                        }
                    );
                    my_dialog("", "", "close");
                },
                function (err)
                {
                    my_dialog("", "", "close");
                    if (err.code != 0)
                    {
                        alert("(12)Error processing SQL: " + err.code);
                    }
                }
            );
        },
        function (err)
        {
            if (err.code != 0)
            {
                alert("(13)Error processing SQL: " + err.code);
            }
        }
    );    
    
}
function showBankAccounts()
{
   gBankName = "";
   gBankAccounts = localStorage.getItem('gBankAccounts');
   var pLocalItemsArray = JSON.parse(gBankAccounts);
   try
   {
        var config_options = {
            title: "Cuentas habilitadas",
            items: pLocalItemsArray,
            doneButtonLabel: "Ok",
            cancelButtonLabel: "Cancelar"
        };

        console.log(config_options);

        window.plugins.listpicker.showPicker(config_options,
            function (item)
            {
                gSelectedAccount = item;

                $("#lblBankAccount").text(gSelectedAccount);
                
                for (var i = 0; i < pLocalItemsArray.length; i++)
                {
                    if (pLocalItemsArray[i].value == gSelectedAccount)
                    {
                        gBankName = pLocalItemsArray[i].bank;
                        $("#lblBankName").text(pLocalItemsArray[i].bank);
                        break;
                    }
                }
            }
        );    
   }catch(e)
   {
       
       console.log(e.message);
   }
   
}
