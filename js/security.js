function UpdateLoginInfo(pAction)//set/get
{
    if(pAction == "set")
    {
        localStorage.setItem('POS_LAST_LOGIN_ID', gLastLogin);
        localStorage.setItem('POS_CURRENT_ROUTE', gCurrentRoute);
    }
    else
    {
        gLastLogin= localStorage.getItem('POS_LAST_LOGIN_ID');
        gCurrentRoute = localStorage.getItem('POS_CURRENT_ROUTE');
    }
    $("#lblLoginID").text(gLastLogin);
    $("#lblCurrentRoute").text(gCurrentRoute);
    $("#lblCurrentLoggedRoute").text(gCurrentRoute);
    $("#lblCurrentLoggedRoutePickupPlan").text(gCurrentRoute);
    $("#lblCurrentLogged").text(gLastLogin);

    $("#lblCurrentLoggedRouteMenu").text(gCurrentRoute);
    

}
function ValidateCredentials()
{
    pUserID = $("#txtUserID").val();
    var pPINCode = $("#txtPin").val();

    try
    {
        if(isNaN(pPINCode))
        {
            notify('ERROR, Debe ingresar un valor numerico');
            $("#txtUserID").val('');
            $("#txtUserID").focus();
        }else
        {
            if (pPINCode == "") { notify("ERROR, ingrese usuario/pin."); return -1; }
            socket.emit('validatecredentials', {'loginid': pUserID, 'pin':pPINCode});
        }
    }catch(e)
    {
        console.log(e.message);    
    }

}

